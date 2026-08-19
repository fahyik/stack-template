import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import { App } from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;

// Analytics: initialise your provider here if you add one.
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

// `npm run build` prerenders each route into #root, so a built page hydrates
// while the dev server (empty #root) mounts fresh.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, tree);
} else {
  createRoot(rootEl).render(tree);
}
