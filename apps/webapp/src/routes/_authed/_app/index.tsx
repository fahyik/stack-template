import { createFileRoute } from "@tanstack/react-router";

import { ItemsView } from "../../../views/items/items-view";

export const Route = createFileRoute("/_authed/_app/")({
  component: ItemsView,
});
