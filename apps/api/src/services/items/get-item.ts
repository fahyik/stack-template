import { sql } from "../../db/index.js";
import { type ItemRow, mapItemRow } from "./item-row.js";

import type { Item } from "@repo/interfaces/domain/item";

/**
 * Services return a discriminated union rather than throwing for business
 * outcomes, and know nothing about HTTP status codes.
 */
export async function getItem({
  itemId,
  userId,
}: {
  itemId: string;
  userId: string;
}): Promise<
  { success: true; item: Item } | { success: false; reason: "entity_not_found" }
> {
  const [row] = await sql<ItemRow[]>`
    select * from app.items
    where id = ${itemId} and user_id = ${userId}
    limit 1
  `;

  if (!row) {
    return { success: false, reason: "entity_not_found" };
  }

  return { success: true, item: mapItemRow({ row }) };
}
