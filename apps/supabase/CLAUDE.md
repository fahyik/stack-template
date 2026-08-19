# Supabase

Local Supabase instance for database and auth.
The local instance runs on 127.0.0.1:54342

## Architectural rule (read this first)

**Supabase is used as plain Postgres + Auth + Storage only.** Nothing else.

- **Do not write RLS policies.** All authorization is enforced in `apps/api`. Tables ship with **RLS enabled and zero policies** — this locks PostgREST (anon / service-role keys) out entirely as defense-in-depth, while the api's direct `postgres` connection uses a role that bypasses RLS. Do not add policies; if you find yourself wanting one, the authz belongs in the api instead
- **Do not use PostgREST.** All data access goes through `apps/api` using the `postgres` library
- **Do not write Edge Functions.** Backend logic lives in `apps/api`
- **Do not use Realtime.** If real-time updates to the dashboard are ever needed, they go through the api (WebSocket / SSE), not Supabase Realtime
- The only Supabase features in use: **Auth** (JWT issuance, verified by the api via JWKS), **Storage** (private buckets, signed URLs minted by the api), and **plain Postgres** (connected via `DB_*` env vars in the api)

This is deliberate: keeping the data-access surface in one place (the api) makes authorization auditable, keeps encryption of sensitive fields in a single code path, and means there is exactly one place to look when a query misbehaves.

## Commands

- `npm run dev` - Start local Supabase instance
- `npm run stop` - Stop local Supabase instance

## Database Migrations

- Managed via supabase CLI
- **NEVER run or suggest to run `supabase db reset`** — it destroys local data and is disruptive. Use `supabase migration up` to apply pending migrations
- **Supabase MCP is for cloud projects only** — never use it for local database operations
- **NEVER edit existing migration files** — migrations are immutable and forward-only. All schema changes (including fixes to previous migrations) MUST go in new migration files. This applies even if the migration was created in the current session
- Do not add unnecessary `COMMENT ON COLUMN` statements — column names and table structure should be self-explanatory
- Migrations should define **plain Postgres tables**. Reference Supabase's `auth.users` only as a `uuid` column (`user_id uuid references auth.users(id)`) — treat the `auth` schema as read-only from the api's perspective. Do not add `ON DELETE CASCADE` triggers that depend on writing to or coupling tightly with Supabase's auth schema; cascade behavior should be handled in application code via `apps/api`
- **Foreign-key column names follow the referenced table.** A column referencing `<table>(id)` is named `<table_singular>_id` — e.g. a column referencing `entities(id)` is `entity_id`, a column referencing `auth.users(id)` is `user_id`. Exception: when a single table has multiple FKs to the same target, use a role-based name instead (e.g. `triggered_by`, `requested_by_entity_id`, `decided_by_entity_id`) so the relationship's purpose is obvious at the call site
