-- Baseline schema.
--
-- Application objects live in `app`, extensions in `extensions`. `public` is
-- left empty except for Supabase platform objects, which are owned by
-- supabase_admin and cannot be moved by the migration role.
create schema if not exists app;
create schema if not exists extensions;

-- Fuzzy, accent-insensitive text search. Drop these two lines if you don't
-- need trigram matching — adding them later means moving an extension between
-- schemas, which is fiddlier than it looks.
create extension if not exists pg_trgm schema extensions;
create extension if not exists unaccent schema extensions;

-- Bumps updated_at inside the same transaction as any UPDATE, so application
-- code can never forget to. Attach to every table with an updated_at column:
--
--   create trigger <table>_set_updated_at
--     before update on app.<table>
--     for each row execute function app.set_updated_at();
create or replace function app.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
