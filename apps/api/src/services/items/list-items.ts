import { sql } from "../../db/index.js";
import { type ItemRow, mapItemRow } from "./item-row.js";

import type { Item } from "@repo/interfaces/domain/item";

/**
 * Lists a user's items, newest first. Scoped to `userId` in the query itself —
 * never filter by owner in the controller.
 */
export async function listItems({
  userId,
  limit,
  offset,
  includeArchived,
}: {
  userId: string;
  limit: number;
  offset: number;
  includeArchived: boolean;
}): Promise<{ items: Item[]; total: number }> {
  const rows = await sql<(ItemRow & { total: string })[]>`
    select *, count(*) over () as total
    from app.items
    where user_id = ${userId}
      ${includeArchived ? sql`` : sql`and archived_at is null`}
    order by created_at desc
    limit ${limit}
    offset ${offset}
  `;

  return {
    items: rows.map((row) => mapItemRow({ row })),
    total: rows.length > 0 ? parseInt(rows[0].total, 10) : 0,
  };
}
