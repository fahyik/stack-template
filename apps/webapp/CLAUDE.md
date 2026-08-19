# Webapp

The customer-facing dashboard. <!-- TODO: describe what your users do here. -->

## Commands

- `npm run dev` — Vite dev server on port 3002
- `npm run build` — `tsr generate && tsc -b && vite build`
- `npm run lint` — Type-check + ESLint (`--fix`, max-warnings 0)
- `npm run deploy:production` / `npm run deploy:staging` — Firebase Hosting targets

## Stack

Vite + React 19 + Tailwind v4 + `@repo/ui`, TanStack Router (file-based) + TanStack Query, Supabase Auth via email OTP.

## Auth

Identity comes from Supabase Auth; **every authorization decision lives in `apps/api`.** The browser only ever decides what to render.

- `src/lib/supabase.ts` — the client, with `detectSessionInUrl: false` (OTP is verified explicitly, not via a URL fragment).
- `src/lib/auth.ts` — `setupAuthListener({ queryClient })` registers `supabase.auth.onAuthStateChange` once, mirrors the session into the query cache under `["auth", "session"]`, and `queryClient.clear()`s on `SIGNED_OUT`. Returns an unsubscribe cleanup. `useSession()` reads the cached session; `signOut()` wraps `supabase.auth.signOut({ scope: "local" })`.
- `src/routes/_authed/route.tsx` — the gate. `beforeLoad` checks for a session and `redirect({ to: "/login" })`s if there isn't one.
- `src/views/login/login-view.tsx` — the two-step email OTP flow (`signInWithOtp` → `verifyOtp({ type: "email" })`). Cloudflare Turnstile is **optional**: without `VITE_TURNSTILE_SITE_KEY` the widget is skipped entirely, so a fresh checkout can log in. With a key set it runs in interaction-only mode — invisible unless a real challenge is needed.

`src/lib/api-client.ts` attaches the Supabase access token as a bearer and unwraps the `{ success, data }` contract, throwing `ApiError` with the server's `reason` on failure.

> `src/lib/{api-client,supabase,query-client,auth}.ts` are **intentionally duplicated** with `apps/backoffice`. See the root `.claude/CLAUDE.md` for why. If you change one, check the other.

## Source layout

```
src/
├── main.tsx                 router + QueryClientProvider
├── index.css                imports @repo/ui/globals.css
├── components/              cross-feature presentational pieces
├── lib/                     api-client, auth, supabase, query-client
├── routes/                  file-based routes (routeTree.gen.ts is generated)
│   ├── __root.tsx           registers the auth listener
│   ├── login.tsx            reverse gate — redirects to / when signed in
│   └── _authed/            session gate
│       └── _app/           pathless group for the signed-in shell
└── views/                   one folder per feature; owns its components/hooks/lib
```

## Conventions

- **Filenames are kebab-case.** Component names inside stay PascalCase.
- **No barrel `index.ts` files.** Import directly from the file that owns the symbol.
- **Named arguments for any function with 2+ params.**
- Routes stay thin — they wire a gate and render a view. Feature logic lives in `views/<feature>/`.
- Per-feature query/mutation hooks live at `views/<feature>/hooks/use-<thing>.ts`, one hook per file, calling typed fetchers in `views/<feature>/lib/<feature>-api.ts`. Export the query key from the hook that owns it so invalidations import it rather than re-typing a literal array. See `views/items/` for the canonical pattern.
- For typed access to a route's params/search/navigate from inside a view (without circular-importing the `Route` constant), use `getRouteApi("/_authed/_app/")` and call `.useSearch()` / `.useNavigate()` / `.useParams()` on it. The `useSearch({ from })` shorthand has fragile inference in this version — prefer `getRouteApi` consistently inside views.

## Styling

Covered by the `design-language` skill and `.claude/rules/frontend/design-language.md`: no hex codes, no one-off `rgba()`, no hand-written `dark:` colour overrides. Prefer `@repo/ui` components over re-implementing primitives.
