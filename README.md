# stack-template

A batteries-included TypeScript monorepo template: Express 5 API, three Vite + React 19 frontends, local Supabase, Firebase Hosting, Cloud Run, and a shared Tailwind v4 design-token package — wired together and proven working by a single example resource.

**New project?** Don't clone this — create from the template, then run init:

```sh
gh repo create my-app --template <you>/stack-template --private --clone
cd my-app
npm run init
```

`npm run init` prompts for a name, npm scope and ports, deletes the apps and modules you don't want, rewrites every reference, regenerates the lockfile, and re-initialises git. It then deletes itself. See [`TEMPLATE.md`](TEMPLATE.md) for the details.

## What's in it

| Workspace                    | Purpose                                                                            | Port  |
| ---------------------------- | ---------------------------------------------------------------------------------- | ----- |
| `apps/api`                   | Express 5 backend — JWT auth via Supabase JWKS, direct Postgres, graceful shutdown | 3001  |
| `apps/webapp`                | Customer dashboard — TanStack Router + Query, Supabase email-OTP login             | 3002  |
| `apps/backoffice`            | Staff dashboard — same stack, admin-gated on `app_metadata.is_admin`               | 3003  |
| `apps/landing`               | Marketing site — prerendered to static HTML at build time                          | 3000  |
| `apps/supabase`              | Local Supabase (Postgres + Auth) + migrations                                      | 5434x |
| `packages/ui`                | React components on Tailwind v4, three-layer design tokens                         | —     |
| `packages/interfaces`        | The API response contract + per-resource zod schemas and domain types              | —     |
| `packages/logger`            | Winston logger with correlation-id propagation                                     | —     |
| `packages/eslint-config`     | Shared ESLint flat configs (base / server / react)                                 | —     |
| `packages/typescript-config` | Shared tsconfig bases                                                              | —     |
| `packages/jest-presets`      | ts-jest preset with ESM support                                                    | —     |

<!-- #region module:mastra -->

Optional module: **Mastra** (embedded agent-workflow runtime in `apps/api`), included by default and removable at init.
<!-- #endregion module:mastra -->

## Getting started

Requires **Node 24.19.0+** and **npm 12.0.2+** (pinned via Volta), plus Docker for local Supabase.

```sh
npm install

# 1. Env files
cp apps/api/.env.default apps/api/.env.development.local
cp apps/webapp/.env.default apps/webapp/.env.local        # and backoffice / landing

# 2. Local Supabase
npm run start -w apps/supabase
npx supabase status --workdir apps/supabase   # copy the API URL + anon key into the .env files
npm run db:migrate:up -w apps/supabase

# 3. Everything else
npm run dev
```

If you already have another local Supabase project running, its ports will clash with this one — edit the port prefix in `apps/supabase/supabase/config.toml` first. See `apps/supabase/README.md` for details.

Then sign in at http://localhost:3002/login with the seeded user in `apps/supabase/supabase/seeds/init.sql`.

Top-level turbo tasks: `npm run build`, `npm run lint`, `npm run test`, `npm run dev`.

## The example `items` resource

The template ships one deliberately generic vertical slice, threaded through every layer, so the stack is provably working on first run and there is a live pattern to copy:

`migration → service → controller → ApiEndpoint type → react-query hook → view`

### Removing the example slice

Once you have a real resource, delete:

```
apps/supabase/supabase/migrations/20260101000100_items.sql   # or write a drop migration
apps/api/src/services/items/
apps/api/src/controllers/api/items/
packages/interfaces/src/domain/item.ts
packages/interfaces/src/api/items.ts
apps/webapp/src/views/items/
apps/backoffice/src/views/items/
apps/backoffice/src/routes/_authed/items/
```

Then remove the `items` mount in `apps/api/src/controllers/api/index.ts`, the sidebar link in `apps/backoffice/src/components/sidebar.tsx`, point `apps/webapp/src/routes/_authed/_app/index.tsx` and `apps/backoffice/src/routes/_authed/index.tsx` at your own view, and drop the seed insert in `apps/supabase/supabase/seeds/init.sql`.

Note the migration is already applied to any database you've run it against — per the forward-only rule, write a new migration that drops the table rather than editing history.

## Making it yours

1. **Brand palette** — `packages/ui/src/globals.css`, between the `SWAP ME` banners. See `packages/ui/CLAUDE.md`.
2. **Firebase project ids** — each frontend's `.firebaserc` (init leaves `REPLACE_ME-*` placeholders if you skip that prompt).
3. **Cloud Run service name** — `apps/api/cloudbuild.yaml`.
4. **CORS origins** — the `originsOnPublic` allowlist in `apps/api/src/app.ts` is empty by default.
5. **Docs** — fill in the `TODO` markers in `.claude/CLAUDE.md` and each app's `CLAUDE.md`.

## Where to look

- [`.claude/CLAUDE.md`](.claude/CLAUDE.md) — project-wide orientation, architectural rules, code style
- [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md) — backend auth, db, testing conventions, local JWT generation
- [`apps/supabase/CLAUDE.md`](apps/supabase/CLAUDE.md) — local Supabase, migration rules, the "plain Postgres" rule
- [`apps/webapp/CLAUDE.md`](apps/webapp/CLAUDE.md) · [`apps/backoffice/CLAUDE.md`](apps/backoffice/CLAUDE.md) · [`apps/landing/CLAUDE.md`](apps/landing/CLAUDE.md)
- [`packages/ui/CLAUDE.md`](packages/ui/CLAUDE.md) — component library and how to swap the palette
