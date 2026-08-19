import { Outlet, createFileRoute } from "@tanstack/react-router";

// Pathless layout group for the signed-in app. It exists as the place to put
// gates that need more than a session — e.g. redirecting a user who hasn't
// finished onboarding into a `_setup` group:
//
//   beforeLoad: async ({ context: { queryClient } }) => {
//     const profile = await queryClient.ensureQueryData(profileQueryOptions());
//     if (!profile.onboarded) throw redirect({ to: "/onboarding" });
//   },
export const Route = createFileRoute("/_authed/_app")({
  component: () => <Outlet />,
});
