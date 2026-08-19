import { describe, expect, it } from "@jest/globals";

import { type ItemRow, mapItemRow } from "../item-row.js";

describe("mapItemRow", () => {
  const row: ItemRow = {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "22222222-2222-4222-8222-222222222222",
    name: "Example",
    notes: null,
    archived_at: null,
    created_at: new Date("2026-01-01T00:00:00Z"),
    updated_at: new Date("2026-01-02T00:00:00Z"),
  };

  it("camelCases every column", () => {
    expect(mapItemRow({ row })).toEqual({
      id: row.id,
      userId: row.user_id,
      name: "Example",
      notes: null,
      archivedAt: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  });

  it("preserves Date instances so the boundary can serialize them", () => {
    const item = mapItemRow({ row });
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.archivedAt).toBeNull();
  });
});
