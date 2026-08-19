import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { useEffect } from "react";

import { setupAuthListener } from "../lib/auth";

import { Toaster } from "@repo/ui/components/ui/sonner";

export type RouterContext = {
  queryClient: QueryClient;
};

function RootShell() {
  const queryClient = useQueryClient();
  useEffect(() => setupAuthListener({ queryClient }), [queryClient]);
  return (
    <>
      <Outlet />
      <Toaster position="top-right" />
    </>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootShell,
});
