import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { queryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";

if (import.meta.env.DEV) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) {
    link.href = "/favicon-dev.svg";
  }
}

function RouterPending() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <span className="brand-text text-5xl">...</span>
    </div>
  );
}

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPendingComponent: RouterPending,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Analytics: wrap <appTree> in your provider here if you add one.
const appTree = (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>{appTree}</StrictMode>
);
