import type { Session } from "@supabase/supabase-js";
import { type QueryClient, useQuery } from "@tanstack/react-query";

import { supabase } from "./supabase";

const SESSION_QUERY_KEY = ["auth", "session"] as const;

export function setupAuthListener({
  queryClient,
}: {
  queryClient: QueryClient;
}) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      queryClient.clear();
    }
    queryClient.setQueryData(SESSION_QUERY_KEY, session);
  });
  return () => data.subscription.unsubscribe();
}

export function useSession() {
  const { data } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => (await supabase.auth.getSession()).data.session,
    staleTime: Infinity,
  });
  return data ?? null;
}

export function isAdminSession(session: Session | null): boolean {
  return Boolean(session?.user.app_metadata?.is_admin);
}

export async function signOut() {
  await supabase.auth.signOut();
}
