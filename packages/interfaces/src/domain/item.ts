/**
 * Domain entity for the example `items` resource.
 *
 * Domain types are camelCase and describe the shape services return — they are
 * deliberately not the database row shape (snake_case, see
 * `apps/api/src/services/items/item-row.ts`) and not the wire shape (`Date`
 * becomes `string` via `Serialized<T>` at the boundary).
 */
export type Item = {
  id: string;
  userId: string;
  name: string;
  notes: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
