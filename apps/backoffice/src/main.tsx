import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { queryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";

import { Spinner } from "@repo/ui/components/spinner";

function RouterPending() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner />
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  </StrictMode>
);
