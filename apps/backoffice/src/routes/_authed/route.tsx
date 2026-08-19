import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AuthedLayout } from "../../components/authed-layout";
import { isAdminSession } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    if (!isAdminSession(session)) {
      throw redirect({ to: "/login", search: { error: "unauthorized" } });
    }
  },
  component: AuthedRoute,
});

function AuthedRoute() {
  return (
    <AuthedLayout>
      <Outlet />
    </AuthedLayout>
  );
}
