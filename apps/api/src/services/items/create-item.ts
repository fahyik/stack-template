import { sql } from "../../db/index.js";
import { type ItemRow, mapItemRow } from "./item-row.js";

import type { Item } from "@repo/interfaces/domain/item";

export async function createItem({
  userId,
  name,
  notes,
}: {
  userId: string;
  name: string;
  notes?: string | null;
}): Promise<{ success: true; item: Item }> {
  const [row] = await sql<ItemRow[]>`
    insert into app.items ${sql({
      user_id: userId,
      name,
      notes: notes ?? null,
    })}
    returning *
  `;

  return { success: true, item: mapItemRow({ row }) };
}
