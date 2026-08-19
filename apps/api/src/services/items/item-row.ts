import type { Item } from "@repo/api-types/domain/item";

/**
 * The database row shape, snake_case, exactly as Postgres returns it. It stays
 * private to this service — everything outside `services/items/` sees the
 * camelCased `Item` domain type instead.
 */
export type ItemRow = {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export function mapItemRow({ row }: { row: ItemRow }): Item {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    notes: row.notes,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
