# Backoffice

The internal staff/admin dashboard. Deployed to its own Firebase project, separate from `apps/webapp`, for IAM blast-radius isolation.

## Commands

- `npm run dev` — Vite dev server on port 3003
- `npm run build` — `tsr generate && tsc -b && vite build`
- `npm run lint` — Type-check + ESLint (`--fix`, max-warnings 0)
- `npm run deploy` — build + `firebase deploy --only hosting`

## Stack

Vite + React 19 + Tailwind v4 + `@repo/ui`, TanStack Router (file-based) + TanStack Query + TanStack Table, Supabase Auth via email OTP.

## Where authorization actually lives

The browser-side admin check is **UX, not security**:

- `src/lib/auth.ts` exports `isAdminSession(session)`, reading `app_metadata.is_admin` off the JWT.
- `src/routes/_authed/route.tsx` uses it to gate the whole authed area, redirecting to `/login?error=unauthorized` otherwise.
- `src/routes/login.tsx` signs in with `shouldCreateUser: false` — staff accounts are provisioned, not self-registered — and bounces non-admin accounts back out.

**Real authorization lives in `apps/api`**, in `src/middleware/check-admin.ts`, applied per-route in resource routers (e.g. the `DELETE /items/:itemId` route in `apps/api/src/controllers/api/items/router.ts`). It checks the same `app_metadata.is_admin` claim, and returns 403 regardless of what the frontend lets you click. Adding a nav link is never enough to grant access, and removing one is never enough to revoke it.

To make a user an admin locally, set `raw_app_meta_data.is_admin = true` on their `auth.users` row — see `apps/supabase/supabase/seeds/init.sql`.

## Source layout

```
src/
├── main.tsx
├── index.css                imports @repo/ui/globals.css + the app-level overflow fix
├── components/
│   ├── authed-layout.tsx    sidebar + scrollable page area
│   ├── page-layout.tsx      max-width container
│   └── sidebar.tsx          nav; add a link per feature
├── lib/                     api-client, auth (+ isAdminSession), supabase, query-client
├── routes/
│   ├── login.tsx
│   └── _authed/            admin gate, wraps <AuthedLayout>
└── views/                   one folder per feature; owns its components/hooks/lib
```

> `src/lib/{api-client,supabase,query-client,auth}.ts` are **intentionally duplicated** with `apps/webapp`. See the root `.claude/CLAUDE.md` for why. If you change one, check the other.

## Conventions

- **Filenames are kebab-case.** Component names inside stay PascalCase.
- **No barrel `index.ts` files.**
- **Named arguments for any function with 2+ params.**
- Routes stay thin — they wire the gate and render a view.
- Per-feature query/mutation hooks live at `views/<feature>/hooks/use-<thing>.ts`, one hook per file, calling typed fetchers in `views/<feature>/lib/<feature>-api.ts`. Export the query key from the hook that owns it so invalidations import it rather than re-typing a literal array. See `views/items/` for the canonical pattern, including the TanStack Table setup.
- For typed access to a route's params/search/navigate from inside a view, use `getRouteApi("/_authed/items/")` rather than the `useSearch({ from })` shorthand — inference on the latter is fragile in this version.

## Styling

Covered by the `design-language` skill and `.claude/rules/frontend/design-language.md`. The `html, body { overflow: hidden }` rule in `src/index.css` is deliberate — it stops the page scrolling behind the `h-svh` sidebar; per-area scrolling happens in `page-layout.tsx`.
