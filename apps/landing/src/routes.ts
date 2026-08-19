/**
 * The single source of truth for this site's routes.
 *
 * Both `src/App.tsx` (which picks the view at runtime) and
 * `scripts/prerender.ts` (which writes one static HTML file per route) read
 * this list, so adding a page means editing this file and nothing else.
 *
 * Firebase Hosting runs with `cleanUrls: true`, so `/about` is served from
 * `about.html`.
 */
export const routes = [
  { path: "/", out: "index.html" },
  { path: "/about", out: "about.html" },
] as const;

export type RoutePath = (typeof routes)[number]["path"];

/** Normalises a URL to one of the declared route paths, falling back to "/". */
export function matchRoute(pathname: string): RoutePath {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const hit = routes.find((r) => r.path === normalized);
  return hit ? hit.path : "/";
}
