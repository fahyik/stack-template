import { createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "../lib/supabase";
import { LoginView } from "../views/login/login-view";

type LoginSearch = {
  auto_login?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    auto_login:
      typeof search.auto_login === "string" ? search.auto_login : undefined,
  }),
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginView,
});
