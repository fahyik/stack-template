import { sql } from "../../db/index.js";
import type { ItemRow } from "./item-row.js";

/** Soft delete: rows are retained with `archived_at` set, never removed. */
export async function archiveItem({
  itemId,
  userId,
}: {
  itemId: string;
  userId: string;
}): Promise<
  { success: true } | { success: false; reason: "entity_not_found" }
> {
  const [row] = await sql<ItemRow[]>`
    update app.items set archived_at = now()
    where id = ${itemId} and user_id = ${userId} and archived_at is null
    returning *
  `;

  if (!row) {
    return { success: false, reason: "entity_not_found" };
  }

  return { success: true };
}
