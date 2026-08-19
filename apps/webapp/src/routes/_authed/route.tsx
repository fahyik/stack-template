import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
