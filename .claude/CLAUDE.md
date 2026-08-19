# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

<!-- TODO: describe your product in two or three lines — who uses it and what it does. -->

Turborepo + npm workspaces, scoped `@repo/*`. Uses npm (not yarn/pnpm/bun). Requires Node >= 24.19.0, npm >= 11.17.0 (pinned via Volta).

## Commands

```bash
npm install                          # Install all dependencies
npm run dev                          # Start all apps in dev mode (turbo)
npm run build                        # Build all packages and apps
npm run lint                         # Lint all packages and apps
npm run test                         # Run all tests
npm run format                       # Prettier format all .ts/.tsx/.md files

# Run commands for a specific workspace
npx turbo run build --filter=@repo/api
npx turbo run dev --filter=@repo/api

# Run a single test file (from the workspace directory)
cd apps/api && NODE_OPTIONS=--experimental-vm-modules npx jest path/to/file.test.ts
```

## Architecture

**Apps:**

- `apps/api` — Express 5 + TypeScript backend (port 3001, debugger on 9229). JWT auth via Supabase JWKS, direct postgres connection via the `postgres` library. ESM modules — all imports must use `.js` extensions even for `.ts` files. See `apps/api/CLAUDE.md`.
- `apps/webapp` — Vite + React 19 customer-facing dashboard (port 3002). TanStack Router + Supabase Auth (email OTP). See `apps/webapp/CLAUDE.md`.
- `apps/backoffice` — Vite + React 19 internal staff/admin dashboard (port 3003). TanStack Router + Query + Table; admin-gated via the JWT `app_metadata.is_admin` claim. Deployed separately for IAM isolation. See `apps/backoffice/CLAUDE.md`.
- `apps/landing` — Vite + React 19 marketing site (port 3000). Prerendered to static HTML at build time via an SSR pass. See `apps/landing/CLAUDE.md`.

<!-- #region module:mastra -->

- **Mastra module** — an embedded agent-workflow runtime lives in `apps/api/src/services/mastra/`, sharing the api process and storing workflow state in the same Postgres instance under a dedicated `mastra` schema. `pg`, `pino` and `pino-pretty` exist only for it.

<!-- #endregion module:mastra -->

- `apps/supabase` — Local Supabase instance for database and auth. Migrations managed via the supabase CLI, in `apps/supabase/supabase/migrations/`. See `apps/supabase/CLAUDE.md`.

**Shared packages** (all scoped `@repo/*`):

- `packages/ui` — React component library on Tailwind v4, `clsx` + `tailwind-merge`. Consumed as raw source (no build step). Exports are per-file only — `@repo/ui/components/*`, `@repo/ui/hooks/*`, `@repo/ui/lib/*`, `@repo/ui/globals.css`. There is no barrel. See `packages/ui/CLAUDE.md`.
- `packages/api-types` — The API response contract (`ApiEndpoint`, `Serialized`) plus per-resource zod schemas and domain types shared between the api and the frontends
- `packages/logger` — Isomorphic logger wrapper (winston + correlation IDs)
- `packages/eslint-config` — Shared ESLint flat configs: `base.mjs`, `server.mjs` (for `apps/api`), `react.mjs` (for the frontends and `packages/ui`)
- `packages/typescript-config` — Shared tsconfig: `base.json`, `vite-app.json`, `react-library.json`
- `packages/jest-presets` — Jest preset using ts-jest with ESM support

**Build dependency chain:** packages build first (`^build` in `turbo.json`), then apps consume them. `lint` and `test` also depend on `^build` so types and compiled output from packages are available.

## Architectural rules (easy to violate)

1. **Supabase is plain Postgres + Auth + Storage. Nothing else.** Tables ship with RLS **enabled and zero policies** (defense-in-depth against PostgREST) — do not write policies; all authorization lives in `apps/api`. Do not use PostgREST. Do not use Realtime. Do not write Edge Functions. Do not import `@supabase/supabase-js` in `apps/api` for data access — use the `postgres` library against the connection string. The Supabase SDK is only used in the dashboards (for auth) and in the api's signed-URL helper (for storage).
2. **Migrations are immutable and forward-only.** Never edit an existing migration file (even one created in the current session). Never run `supabase db reset` against anything you care about. All schema changes go in new migration files.
3. **No service role keys in the browser.** The dashboards never get the Supabase service role key. File uploads go through signed URLs minted by the api.
4. **`src/lib/{api-client,supabase,query-client,auth}.ts` are intentionally duplicated across `apps/webapp` and `apps/backoffice`.** Do not extract them into a shared package. They are ~150 lines total, change rarely, and the two apps are independently deployable with different auth posture (backoffice gates on `app_metadata.is_admin`). Sharing them would mean injecting a base URL and a token getter to avoid depending on `import.meta.env` and `@supabase/supabase-js`, which costs more indirection than the duplication costs. **If you change one copy, check the other.**

## Code Style

- **Prettier** (from `.prettierrc`): **double quotes** (`singleQuote: false`), semicolons, `trailingComma: es5`, 80 char width, `arrowParens: always`
- **Import sorting** via `@trivago/prettier-plugin-sort-imports` with `importOrderSeparation: true`. Order: `^@core/(.*)$` → `^@server/(.*)$` → `^@ui/(.*)$` → `^[./]` (relative) → `^@repo/(.*)$` → `^@/(.*)$`
- **ESLint server config** (used by `apps/api`): `no-explicit-any: error`, `no-floating-promises: warn`, `import-x/no-cycle: error`, `eqeqeq: error`, `no-unsafe-optional-chaining: warn`. Unused vars prefixed with `_` are allowed
- **ESLint react config** (used by the frontends and `packages/ui`): extends base + `@eslint-react/recommended-typescript` with most stylistic rules disabled. Uses `eslint-plugin-only-warn`, but `--max-warnings 0` in lint scripts means warnings still fail
- **Always run `npx prettier --write`** on any files you create or modify
- **`apps/api` uses ESM**, so all imports must use `.js` extensions even for `.ts` files
- **Function signatures — named arguments over positional.** Functions with 2 or more parameters must accept a single options object (e.g. `function foo(args: { a; b; ... })`) rather than positional params. Keeps call sites self-documenting and avoids argument-order bugs when new fields are added. Applies to all TypeScript code in this repo.
- **No barrel `index.ts` files.** Consumers import directly from the file that owns the symbol (e.g. `services/items/list-items.js`), not from a folder-level `index.ts` that re-exports. Barrel files hide where symbols actually live, create circular-import risk, and add noise every time a new export is added. If a folder has multiple related utilities, group them in a `lib/` subfolder with one exported function per file, and import each one directly.
- **Colocate types with the function that uses them.** Don't park a service's types in a shared `types.ts` by default — inline each type in the file where its primary consumer lives. Promote a type to a shared file (or shared module) only when it's genuinely used across multiple files in the service. Types that are input/output shapes for a single function belong in that function's file.

## Environment Variables

Build-time env vars must be declared in `turbo.json` or Turborepo will omit them from the task hash and serve cached builds with stale values. **`turbo.json` is the source of truth — read it rather than trusting a list here.**

All three frontends use `VITE_API_URL` for the api base URL. Each app has a committed `.env.default` documenting its variables; copy it to `.env.local` (frontends) or `.env.development.local` (api) and fill in.

## The example `items` resource

This repo ships one deliberately generic vertical slice — `items` — threaded through every layer, so the stack is provably working on first run and there's a live pattern to copy. Delete it once you have a real resource; see "Removing the example slice" in `README.md` for the file list.

## Where to look

- `apps/api/CLAUDE.md` — backend auth, db, testing conventions, local JWT generation
- `apps/supabase/CLAUDE.md` — local Supabase, migration rules, the "plain Postgres" rule
- `apps/webapp/CLAUDE.md` — customer dashboard orientation
- `apps/backoffice/CLAUDE.md` — staff dashboard, auth wiring, where authorization actually lives
- `apps/landing/CLAUDE.md` — marketing site, prerender pipeline
- `packages/ui/CLAUDE.md` — UI component library, and how to swap the brand palette

**Skills** (loaded on demand, not in this file):

- `api-stack` — creating/modifying an api endpoint: services, domain types, controllers, zod validation, response contract
- `design-language` — design-token reference for React UI work
