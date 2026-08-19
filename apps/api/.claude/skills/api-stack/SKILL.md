---
name: api-stack
description: "Full guide to creating or modifying an api endpoint in apps/api: business logic in src/services/<domain>/, domain types in packages/interfaces/src/domain/, controllers (resource-folder layout, router wiring, thin handlers), the API response contract (ApiEndpoint, success/reason shapes), request validation with zod schemas in packages/interfaces/src/api/<resource>.ts, and middleware wiring (auth, checkAdmin, file upload). Use this skill whenever creating or editing files under apps/api/src/services/**, apps/api/src/controllers/{api,public}/**, packages/interfaces/src/api/**, or packages/interfaces/src/domain/**; defining a new endpoint, adding a router, designing a service module or domain entity, writing zod request/response schemas, or shaping a new API response. Trigger even when the user only mentions one layer (e.g. 'add an items service', 'new orders endpoint', 'wire admin guard on a route') — the layers are coupled and the skill covers the whole flow."
---

# API stack (apps/api)

A new api endpoint touches three layers, in this order: **services** (business logic), **domain types** (shared shapes), **controllers + api types** (HTTP boundary). This skill covers all three. Read the Exemptions section first — it lists places where these rules deliberately don't apply.

## Exemptions

Do not "fix" anything in this list without discussing first. Each exemption has a reason that lives outside this skill's rules.

- **`middleware/error-handler.ts`** — all branches keep their legacy shapes. The auth paths (`UnauthorizedError`, `JwksRateLimitError`) emit `{ reason }`; the generic 500 emits `{ message: "Internal server error", error?, stack? }` so dev-mode debug info isn't lost.
- **Webhook controllers (`/webhooks/**`)** — the response shape is dictated by the external service, so they're exempt from the contract below. They're also exempt from zod request validation: they verify the provider's signature over the raw body and decode separately, so they never go through Express's JSON `req.body` path.
- **Infra-facing health/info routes** (`GET /`, `GET /ready` in `app.ts`) — consumed by load balancers and uptime monitors, not typed clients.
- **Pure SDK adapters** (a thin wrapper around a third-party client) — the camelCase domain-shape rule below applies at the boundary that controllers hit. Internal-only return types inside an adapter can mirror the SDK's vocabulary if that's clearer.

## 1. Business logic — `src/services/<domain>/`

All persistence and domain logic lives in `src/services/<domain>/**`. Controllers must not import `sql` or query `app.*` tables directly — they call named functions from a service.

### Folder layout

`services/booking/` is the canonical example for a domain with multiple entities and a sub-area:

```
services/booking/
├── order/
│   └── order.ts                  # CRUD + state transitions for one entity
├── providers/
│   ├── providers.ts
│   └── opening-hours.ts
├── search/
│   ├── search-providers.ts       # entry point
│   ├── search-google-places.ts
│   ├── search-web-providers.ts
│   ├── search-suppliers.ts
│   ├── types.ts                  # types only used inside search/
│   └── lib/                      # one helper per file, no barrel
│       ├── sign.ts
│       ├── encode-candidate-id.ts
│       └── decode-candidate-id.ts
└── attempt-digital-booking.ts    # top-level orchestration that crosses subdomains
```

Counter-example: `services/items/` is flat (`get-item.ts`, `list-items.ts`, `create-item.ts`, `update-item.ts`, `archive-item.ts`). That's fine when there are no subdomains. Don't introduce nesting until a domain has multiple entities or a clear sub-area — premature folders bury single files behind extra navigation.

### Rules

- **Named-args for any function with 2+ params.** Reason: call sites stay self-documenting and adding a new field doesn't silently shift the meaning of existing positional args. (See the project [`CLAUDE.md`](../../../../../.claude/CLAUDE.md) "Code Style" section.)
- **No barrel `index.ts`.** Reason: barrels hide where symbols actually live, create circular-import risk, and add noise on every new export. Consumers import directly from the file that owns the symbol (e.g. `services/items/list-items.js`). For grouped helpers, use a `lib/` subfolder with one function per file.
- **Services return camelCase domain shapes.** Reason: callers (controllers, other services, eventually the dashboard) shouldn't be coupled to DB column names — renaming a column shouldn't cascade through the codebase. Pattern: alias `snake_case → camelCase` in the SQL projection or in the function's return mapping. See `services/items/get-item.ts:9-30` for the pattern.
- **Services don't know about HTTP.** Reason: a service should be reusable from a background workflow step, a CLI script, or a test, none of which have an `Express.Response`. Return discriminated unions (`{ success: true, ... } | { success: false, reason: "..." }`) or `null` for "not found". Controllers don't translate variants to different status codes (everything-200, see §3); their job is to surface the result, not to invent HTTP semantics around it.
- **Use `entity_not_found` as the reason for generic not-found cases.** Reason: the dashboard and any other client can branch on one stable reason for "the thing you addressed doesn't exist" without learning a new string per resource. Use a specific reason only when the controller's caller genuinely needs to distinguish _which_ of several referenced entities is missing in one request (e.g. a create endpoint that references two parent rows might return `customer_not_found | product_not_found` so the dashboard can highlight the offending field). The rest collapse to `entity_not_found`. Non-not-found failures stay specific (`already_exists`, `not_authorized`, `already_decided`, etc.).
- **Colocate types with the function that uses them.** Reason: input/output shapes for a single function don't need a shared `types.ts`. Promote a type to a service-level shared file only when it's genuinely used across multiple files inside the service. (See project `CLAUDE.md` "Code Style".)
- **ESM `.js` import extension** even when the source is `.ts`. Reason: Node ESM and the build both require it. (See project `CLAUDE.md`.)
- **Tests colocated in `__tests__/`** with two suffixes: `*.unit.test.ts` for pure logic (no DB, no I/O), `*.integration.test.ts` for anything that touches Postgres. Reason: the suffix tells the reader and CI which suite needs the local DB. Integration tests must self-clean — create throwaway fixtures, delete in `finally`, lean on `ON DELETE CASCADE`. (See [`apps/api/CLAUDE.md`](../../CLAUDE.md) "Testing".)

## 2. Domain types vs API types — `packages/interfaces/src/domain/` vs `src/api/`

`@repo/interfaces` has two distinct sub-folders. Knowing which one a new type belongs in is the single most common mistake in this layer.

| Layer      | Lives in                                            | What it is                                                                                                                                                                                                                                     | Examples                                                                                       |
| ---------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Domain** | `packages/interfaces/src/domain/<entity>.ts` | The app-language shape of an entity and its value-level enums. What services return, controllers respond with, dashboards render, background workflows reason about. Independent of any one HTTP message or DB row.                                | `Item`                                    |
| **API**    | `packages/interfaces/src/api/<resource>.ts`         | The HTTP-contract layer: zod schemas for `req.body`/`req.query`/`req.params`, plus `ApiEndpoint<...>` aliases. Almost always **imports** and is often a **superset** of a domain type (e.g. a list response wraps the entity with pagination). | `listItemsQuerySchema`, `itemParamsSchema`, `ListItems`, `GetItem` |

### Default rules

- **Domain types belong in `domain/` from the start — not inline in a service file, not in `api/`.** Reason: a domain entity is shared by definition (services produce it, controllers respond with it, the dashboard renders it, background workflows reason about it). Hiding it inside one service forces every other consumer to either deep-import past the package boundary or redeclare a near-identical shape. Putting it in `api/` muddies the contract layer with shapes that aren't tied to any one HTTP message.
- **API types reference domain types — never the reverse.** The api file imports `Item` from `../domain/item.js`; the domain file knows nothing about HTTP, zod request schemas, or `ApiEndpoint`. Reason: domain types must be reusable from non-HTTP consumers (background workflows, scripts, tests) without dragging in HTTP-shaped types.
- **Value-level zod enums for entity properties belong in `domain/`.** A status set like `orderStatusEnum` describes the _entity_, not any one HTTP message. The api layer imports the same enum to validate `req.query.status`. Reason: one source of truth — request validation, domain types, services, and the dashboard all line up automatically.
- **API responses are typically supersets, not duplicates.** A list endpoint returns `{ items: Item[]; total: number }` — the inline shape lives in the `ApiEndpoint<...>` alias in `api/`, while `Item` itself stays in `domain/`. Don't copy the entity shape into `api/` "for symmetry."

### What stays _inside_ a service (not in `domain/`)

- **DB row types** — snake_case shapes like `ItemRow` mirroring SQL columns. They're a SQL-projection implementation detail. Promoting them would expose column names to consumers and lock every layer to a column rename.
- **Service-internal helper / args / intermediate types** — `MarkFailedArgs`, internal step-result types, anything that isn't an entity or a value-set. Colocate next to the function they serve (project `CLAUDE.md`'s "Colocate types with the function that uses them").

### Folder layout

Mirror the service folder structure, one file per entity. Status enums + the entity shape + value-level zod enums live together — they're the same concept:

```
domain/
├── item.ts                   # Item (plus any value-level enums it owns)
└── order.ts                  # Order, OrderStatus, orderStatusEnum
```

Nest into a subfolder (`domain/billing/invoice.ts`) only once an area genuinely has several entities — don't create folders for single files.

### Importing — there is no barrel

There is **no barrel** — `packages/interfaces` has no `src/index.ts`. Consumers import the exact file that owns the symbol, via the per-file wildcard `exports` map in its `package.json`:

```ts
import type { ApiEndpoint, Serialized } from "@repo/interfaces/api-endpoint";
import type { Item } from "@repo/interfaces/domain/item";
import { createItemBodySchema } from "@repo/interfaces/api/items";
```

Adding a new file needs no wiring: `./api/*` and `./domain/*` already resolve. The subpaths work under both `NodeNext` (apps/api) and `Bundler` (the frontends).

### The canonical example for new work

`packages/interfaces/src/domain/item.ts` (the entity) + `packages/interfaces/src/api/items.ts` (request schemas + `ApiEndpoint` aliases that import `Item` from domain). Mirror this layout for any new entity.


## 3. Controllers, validation, middleware

### Controller layout

Controllers organize by **resource**, not by audience. Each resource is a folder under `src/controllers/api/<resource>/` (authenticated) or `src/controllers/public/<resource>/` (unauthenticated public routes), containing:

- **`router.ts`** — exports a single `<resource>Router()` returning an Express `Router`. Its only job is to wire HTTP method + path → middleware → handler. Mounted in `controllers/api/index.ts` at `/api/<resource>` (the JWT `auth` middleware is attached there once per resource, not inside the router).
- **One file per route handler**, prefixed by HTTP verb: `post-<action>.ts`, `get-<action>.ts`, `put-<action>.ts`, `delete-<action>.ts`. Each file exports a single named handler (e.g. `export async function patchItem(req, res, next) { ... }`). Action names are unique per resource, so clashes don't happen.

No barrel `index.ts` inside the resource folder — `router.ts` is the only entry point. Example: `controllers/api/items/router.ts` + `controllers/api/items/patch-item.ts`.

### Authorization is middleware, not URL structure

Staff-only / admin-only / role-gated routes do not get their own URL namespace (no `/api/admin/...`, no `/api/backoffice/...`). They live alongside the rest of the resource and apply the relevant middleware per-route in `router.ts`:

```ts
router.post(
  "/:itemId",
  checkAdmin,
  patchItem
);
```

Reason: a resource's routes stay co-located regardless of who can call them, and the same resource can expose both staff-only and end-user routes without splitting URL namespaces.

### Available middleware

- **`auth`** (`middleware/auth.ts`) — JWT verification via Supabase JWKS. **Attached at the resource level** in `controllers/api/index.ts` (`router.use("/items", auth, itemsRouter())`), not inside individual routers. Reason: opting an entire `/api/<resource>/*` namespace into JWT auth in one place avoids forgetting it on a single route.
- **`checkAdmin`** (`middleware/check-admin.ts`) — gates on `req.auth.app_metadata.is_admin`, applied per-route inside `router.ts` for staff-only handlers.
- **`internalServiceAuth`** (`middleware/internal-service-auth.ts`) — header-based `x-api-key` for internal service-to-service endpoints.
- **`file`** (`middleware/file.ts`) — multer memory storage, image-only filter, 10MB cap.
- **`error-handler`** (`middleware/error-handler.ts`) — global, mounted last in `app.ts`. Don't try to handle infrastructure errors inline; throw and let the handler shape the response.

### Controllers stay thin

Controllers must not import `sql` or query `app.*` tables directly. The handler's job is exactly:

1. **Validate** `req.body` / `req.params` / `req.query` with zod schemas from `@repo/interfaces` (see "Request validation" below).
2. **Call services** — one or more named functions from `services/<domain>/`, taking named-arg objects and returning camelCased domain shapes.
3. **Return the result** — `res.json(result)` on a service failure (the discriminated union is already the wire shape); a small `{ success: true, data }` reconstruction on success (because services return entity-named fields like `result.provider` and the contract field is `data`).

Example: `controllers/api/items/patch-item.ts` calls `getItem` from `services/items/get-item.ts` rather than running its own `select`.

### API response contract

All `/api/*` and `/public/*` controllers must return shapes that satisfy `ApiEndpoint` from `@repo/interfaces`:

- **Success:** `res.json({ success: true, data })`. The `data` field is mandatory; endpoints with no payload pass `data: null` and type as `ApiEndpoint<..., null>`.
- **Failure:** `res.json({ success: false, reason })`. When the service already returns this shape, forward it directly: `res.json(result)`. Don't reconstruct `{ success: false, reason: result.reason }` — it's redundant and would silently drop any future fields the service adds.

Do not invent ad-hoc shapes like `{ error: "..." }`. Write the JSON inline at the call site — there is no helper wrapper, the shape is the contract.

**Status codes.** Default to 200 (which `res.json(...)` already implies — don't write `.status(200)` explicitly). The only carve-outs:

| Status                  | When                                                                                                         | Where                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| **400**                 | `reason: "invalid_payload"` only — zod validation failed, request can't be processed                         | Inline validation block at the top of every handler  |
| **500**                 | Genuine server-side data integrity error (e.g. a row that should always have a foreign key suddenly doesn't) | Rare; keep it as 5xx so error monitoring picks it up |
| **`result.statusCode`** | Webhook handlers forward whatever the inner handler chose                                                    | `/webhooks/*` only — exempt from this contract       |

Every other business outcome — "the resource doesn't exist", "you're not authorized for this action", "that name is already taken", "the record was already archived" — is a successfully-processed request whose answer is `success: false`. It returns 200 with the reason in the body. Reason: HTTP status codes are observability for "did the server process the request at all"; conflating that with business outcomes splits the contract across two systems (status + body) for no real signal gain on an internal API.

**Reason strings** are stable, snake_case, machine-readable identifiers. They are part of the contract and changes are breaking. Clients (the dashboard, tests, eventually third parties) branch on `reason`. Conventions:

- `invalid_payload` — reserved for the 400 zod-failure case above.
- `entity_not_found` — the default for any "the thing you addressed doesn't exist" failure (URL resource missing, body reference missing, etc.). Use a specific reason like `customer_not_found` _only_ when the caller needs to distinguish which of several referenced entities is missing in one request.
- Specific reasons for non-not-found business failures: `already_exists`, `already_archived`, `not_authorized`, `unauthenticated`, etc. Keep them snake_case and stable — clients branch on them, so changes are breaking.

Don't put free-form messages, user input, or sensitive data in `reason`.

The 404 fallback in `app.ts` (`{ success: false, reason: "not_found" }`) is for URLs that don't match any mounted route at all — a transport-layer 404 distinct from the business-layer `entity_not_found`.

### Request validation

Every `/api/*` and `/public/*` controller validates `req.body`, `req.params`, and `req.query` with zod schemas. Schemas live in `@repo/interfaces` (one file per resource at `packages/interfaces/src/api/<resource>.ts`) and are paired with an `ApiEndpoint<...>` type that uses `z.infer<typeof ...>` for body/query/params. Reason: the wire types stay derived from the schema, so there are no hand-maintained type duplicates that drift out of sync with the validator.

On any validation failure, respond `400 { success: false, reason: "invalid_payload" }`. When `process.env.APP_ENV !== "production"`, also include an `issues` array (raw zod issues from `safeParse(...).error.issues`) so engineers can see which fields failed. Never include `issues` in production — it's a dev-only debug extension. The single `invalid_payload` reason intentionally collapses what used to be per-field reasons; field-level detail belongs in the dev `issues` array, not in the contract.

Validate inline at the top of the handler — there is no shared `validateRequest` middleware. The 400 response itself goes through `controllers/lib/respond-invalid-payload.ts`, which owns the dev-only `issues` branch so it isn't copy-pasted into every handler. Pattern:

```ts
const isDev = process.env.APP_ENV !== "production";

router.post("/...", async (req, res, next) => {
  try {
    const params = paramsSchema.safeParse(req.params);
    const body = bodySchema.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({
        success: false,
        reason: "invalid_payload",
        ...(isDev
          ? {
              issues: [
                ...(params.success ? [] : params.error.issues),
                ...(body.success ? [] : body.error.issues),
              ],
            }
          : {}),
      });
      return;
    }
    // use params.data / body.data
  } catch (err) {
    next(err);
  }
});
```

See `packages/interfaces/src/api/items.ts` and `apps/api/src/controllers/api/items/patch-item.ts` as canonical examples — the whole `items` slice exists to be copied.
