import { sql } from "../../db/index.js";
import { type ItemRow, mapItemRow } from "./item-row.js";

import type { Item } from "@repo/interfaces/domain/item";

export async function updateItem({
  itemId,
  userId,
  name,
  notes,
}: {
  itemId: string;
  userId: string;
  name?: string;
  notes?: string | null;
}): Promise<
  { success: true; item: Item } | { success: false; reason: "entity_not_found" }
> {
  // Build the patch from only the fields the caller actually supplied, so a
  // partial update can't null out columns it never mentioned.
  const patch: Record<string, string | null> = {};
  if (name !== undefined) {
    patch.name = name;
  }
  if (notes !== undefined) {
    patch.notes = notes;
  }

  if (Object.keys(patch).length === 0) {
    return { success: false, reason: "entity_not_found" };
  }

  const [row] = await sql<ItemRow[]>`
    update app.items set ${sql(patch)}
    where id = ${itemId} and user_id = ${userId}
    returning *
  `;

  if (!row) {
    return { success: false, reason: "entity_not_found" };
  }

  return { success: true, item: mapItemRow({ row }) };
}
