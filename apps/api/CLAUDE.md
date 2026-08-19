# API

Express.js backend with JWT authentication.

## Commands

- `npm run dev` - Start dev server with hot reload (port 3001, debugger on 9229)
- `npm run build` - Build TypeScript to dist/
- `npm run start` - Start production server
- `npm run test` - Run Jest tests with ESM support
- `npm run lint` - Type check and lint

**Important**: Uses ESM modules (`type: "module"`), so all imports must use `.js` extensions even for `.ts` files.

## Architecture

### Authentication Flow

- Uses express-jwt middleware with JWKS validation
- JWT tokens verified against `AUTH_DOMAIN/.well-known/jwks.json` — this is the **Supabase Auth** JWKS endpoint
- The api **only verifies** Supabase-issued JWTs; it never proxies login flows. The dashboard talks to Supabase Auth directly via `@supabase/supabase-js`, then sends the resulting JWT in the `Authorization: Bearer` header
- Protected routes require valid JWT tokens with matching audience/issuer
- Authorization decisions (which tenant, which role, which permissions) live in your own tables keyed by the Supabase `auth.users(id)` — not in Supabase Auth, which only establishes identity

### Structure

- **Middleware**: Auth (JWT), error handling, file uploads, correlation IDs
- **Controllers**: Organized by resource under `/api/<resource>/` and `/public/<resource>/`.
- **Services**: All business logic inside `/services/<service-name>/**`
- **Database**: Direct postgres connection using `postgres` library, not through Supabase SDK
- **Process Lifecycle**: Graceful shutdown handlers for cleanup

**No `/api/` URL prefix.** Authed routes mount at root (e.g. `GET /items/...`). The `controllers/api/` folder name refers to the _authentication tier_, not a URL segment.

### Database Connection

- Connects directly to Postgres using the `postgres` library
- Connection configured via `DB_*` environment variables
- The Postgres instance is **Supabase-hosted**, but we use it as plain Postgres only — no PostgREST, no RLS, no Realtime, no Edge Functions. Do not import `@supabase/supabase-js` in this app for data access; it's only used in the storage signed-URL helper
- SSL disabled for development/test, required for production
- Graceful shutdown ensures connection termination

### Testing

Tests live in `__tests__/` folders colocated with the code under test, and are named with one of two postfixes that signal their dependencies:

- **`*.unit.test.ts`** — pure, in-process tests. No DB, no network, no external services. Must pass with zero environment setup. Use for codec/parser/formatter logic, pure functions, and anything you can exercise without I/O.
- **`*.integration.test.ts`** — tests that require the local Postgres (DB, real `postgres` client) or other external services. Gate the suite on `const HAS_DB = Boolean(process.env.DB_HOSTNAME)` / `const describeIntegration = HAS_DB ? describe : describe.skip;` so the file auto-skips when the dependency isn't available. Each test must set up and tear down its own fixtures (e.g. create a throwaway row, delete it in a `finally` — rely on `ON DELETE CASCADE` for related rows).

When a single feature needs both — e.g. a codec with pure round-trip cases and a DB round-trip sanity check — split them into two files (`foo.unit.test.ts` + `foo.integration.test.ts`) rather than mixing `describe` and `describeIntegration` in one file. Jest's `testMatch` already picks up both suffixes; no config change needed when adding a new test file.

## Health Check

- To check if the API server is running, poll `GET /ready`

## Local Dev JWT Token

To generate a JWT for testing authenticated endpoints locally:

1. Ask the user for a user_id; if none, default to the seeded local user `00000000-0000-4000-8000-000000000001` (see `apps/supabase/supabase/seeds/init.sql`)
2. Generate a bearer token and capture it cleanly (the command outputs an interactive prompt line before the token, so pipe through `tail -1 | tr -d '\n'` to extract just the token):
   ```
   TOKEN=$(cd apps/supabase && supabase gen bearer-jwt --role authenticated --sub PROVIDED_USER_ID --payload "{\"iss\": \"http://127.0.0.1:54321/auth/v1\", \"aud\": \"authenticated\"}" --valid-for "10m" --yes 2>/dev/null | tail -1 | tr -d '\n')
   ```
3. Use the token in curl: `curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/...`

## Key Notes

- Runs with `TZ=UTC`
- Dev server runs with `--inspect` flag on `0.0.0.0:9229`
- CORS: the `/public` tier has an explicit origin allowlist in `app.ts` (empty by default — add your production origins); localhost origins are added in non-production
