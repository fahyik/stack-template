import { matchRoute } from "./routes.ts";
import { AboutView } from "./views/about/about-view.tsx";
import { HomeView } from "./views/home/home-view.tsx";

// Static, prerendered routing: each route in `src/routes.ts` is rendered to its
// own HTML file at build time and selected here by pathname. `url` is supplied
// during SSR; on the client we read the live pathname (which matches the
// prerendered file). No router library — the static-file model depends on this
// staying simple.
export function App({ url }: { url?: string }) {
  const pathname =
    url ?? (typeof window !== "undefined" ? window.location.pathname : "/");

  switch (matchRoute(pathname)) {
    case "/about":
      return <AboutView />;
    default:
      return <HomeView />;
  }
}
