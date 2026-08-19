-- Example resource. See README.md ("Removing the example slice") for the full
-- list of files to delete alongside this migration.
create table app.items (
  id uuid primary key default gen_random_uuid(),
  -- References Supabase Auth's user id. Treat the `auth` schema as read-only:
  -- no cascades into it, no triggers on it. Cleanup lives in apps/api.
  user_id uuid not null references auth.users (id),
  name text not null check (length(trim(name)) > 0),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partial index: the only list query filters to a user's live items.
create index items_user_id_idx
  on app.items (user_id)
  where archived_at is null;

create trigger items_set_updated_at
  before update on app.items
  for each row execute function app.set_updated_at();

-- RLS enabled with ZERO policies, deliberately.
--
-- This locks PostgREST out entirely (both the anon key and the service-role
-- key) as defense in depth: every authorization decision lives in apps/api,
-- which connects as a role that bypasses RLS. Do NOT add policies here — if
-- you find yourself wanting one, the check belongs in the api instead.
alter table app.items enable row level security;
