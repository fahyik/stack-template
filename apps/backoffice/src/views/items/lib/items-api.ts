import { apiFetch } from "../../../lib/api-client";

import type { Serialized } from "@repo/api-types/api-endpoint";
import type { Item } from "@repo/api-types/domain/item";

export type WireItem = Serialized<Item>;

export function listItems({ includeArchived = true } = {}) {
  return apiFetch<{ items: WireItem[]; total: number }>({
    method: "GET",
    path: "/items",
    query: { includeArchived: String(includeArchived) },
  });
}

export function archiveItem({ itemId }: { itemId: string }) {
  return apiFetch<null>({ method: "DELETE", path: `/items/${itemId}` });
}
