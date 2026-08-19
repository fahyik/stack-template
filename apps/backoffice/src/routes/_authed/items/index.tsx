import { createFileRoute } from "@tanstack/react-router";

import { ItemsListView } from "../../../views/items/items-list-view";

export const Route = createFileRoute("/_authed/items/")({
  component: ItemsListView,
});
