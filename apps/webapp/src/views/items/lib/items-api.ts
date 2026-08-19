import { apiFetch } from "../../../lib/api-client";

import type { Serialized } from "@repo/api-types/api-endpoint";
import type { Item } from "@repo/api-types/domain/item";

// Responses cross a JSON boundary, so Date fields arrive as strings. The
// `Serialized<T>` helper makes that explicit instead of lying about the type.
export type WireItem = Serialized<Item>;

export function listItems({ includeArchived = false } = {}) {
  return apiFetch<{ items: WireItem[]; total: number }>({
    method: "GET",
    path: "/items",
    query: { includeArchived: String(includeArchived) },
  });
}

export function createItem({
  name,
  notes,
}: {
  name: string;
  notes?: string | null;
}) {
  return apiFetch<{ item: WireItem }>({
    method: "POST",
    path: "/items",
    body: { name, notes },
  });
}
