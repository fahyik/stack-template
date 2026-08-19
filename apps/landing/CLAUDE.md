# Landing

The public marketing site. No auth, no Supabase, no dashboard — this app's only backend contact is whatever unauthenticated `POST /public/*` endpoints you add.

## Commands

- `npm run dev` — Vite dev server on port 3000
- `npm run build` — client build → SSR build → `scripts/prerender.ts` (see Prerendering)
- `npm run preview` — serve the built `dist/` on port 3000
- `npm run lint` — Type-check + ESLint (`--fix`, max-warnings 0)
- `npm run deploy` — build + `firebase deploy --only hosting`

## Stack

Vite + React 19 + Tailwind v4 + `@repo/ui`. Deliberately lighter than the dashboards:

- **No router.** Routing is a pathname switch in `src/App.tsx` — each route is prerendered to its own HTML file, so the client only needs to pick the matching view on hydration. Don't add TanStack Router here without a reason; the static-file model depends on this staying simple.
- **No `@supabase/supabase-js`**, no TanStack Query. Nothing on this site is authenticated or stateful.

## Prerendering

`npm run build` runs three passes: a normal client build, an SSR build of `src/entry-server.tsx` into `dist/server/`, then `scripts/prerender.ts`, which renders each route to static HTML and injects it into `#root` in the template. `dist/server/` is deleted afterwards — only static assets ship.

**Routes are declared once, in `src/routes.ts`.** Both `src/App.tsx` and `scripts/prerender.ts` import that list, so adding a page means editing one file. Firebase Hosting is configured with `cleanUrls: true`, so `/about` is served from `about.html`.

`index.html` must keep its `<div id="root"></div>` exactly as written — `scripts/prerender.ts` asserts on that string and fails the build if it's missing.

## Source layout

```
src/
├── routes.ts                the route list (shared with scripts/prerender.ts)
├── App.tsx                  pathname → view
├── entry-server.tsx         SSR entry used only by the prerender pass
├── main.tsx                 client entry; hydrates when prerendered markup exists
├── index.css                imports @repo/ui/globals.css
├── animations.css           landing-only keyframes
├── components/              presentational pieces (container, reveal, section-head)
├── hooks/                   one hook per file
└── views/                   one folder per page
```

Conventions (repo-wide, restated because they're easy to drop on a marketing site):

- **Filenames are kebab-case.** Component names inside stay PascalCase.
- **No barrel `index.ts` files.** Import directly from the file that owns the symbol.
- **Named arguments for any function with 2+ params.**
- **Colocate types with the function that uses them.**
- **`views/<page>/` owns its own components.** Only promote something to top-level `components/` once two pages use it.

## Styling

Covered by the `design-language` skill and the always-on guardrails in `.claude/rules/frontend/design-language.md`: **no hex codes, no one-off `rgba()` literals, no hand-written `dark:` colour overrides.** Marketing pages are the most common place for one-off colours to creep in — reach for a token or propose a new one.

Page-specific keyframes live in `animations.css`, not in `packages/ui/src/globals.css`.

## Hosting

Static site on Firebase Hosting, in its own Firebase project for IAM blast-radius isolation.

- `cleanUrls: true` — required for the prerendered `/about` route
- Cache headers: long-lived immutable for hashed assets, `no-cache` for `*.html` so a deploy is picked up on next load
- Deploy: `npm run deploy`. Requires `firebase login` and access to the project. Set the project id in `.firebaserc` first.

## Env vars

Vite bakes these in at build time — set them before `npm run deploy`, and don't commit production values. See `.env.default`.
