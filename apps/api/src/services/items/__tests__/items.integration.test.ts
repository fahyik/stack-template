import { afterAll, describe, expect, it } from "@jest/globals";

import { sql } from "../../../db/index.js";
import { archiveItem } from "../archive-item.js";
import { createItem } from "../create-item.js";
import { getItem } from "../get-item.js";
import { listItems } from "../list-items.js";
import { updateItem } from "../update-item.js";

// Integration suites auto-skip when there's no database configured, so
// `npm run test` still passes on a bare checkout.
const HAS_DB = Boolean(process.env.DB_HOSTNAME);
const describeIntegration = HAS_DB ? describe : describe.skip;

// Seeded by apps/supabase/supabase/seeds/init.sql.
const USER_ID = "00000000-0000-4000-8000-000000000001";

describeIntegration("items service", () => {
  const created: string[] = [];

  afterAll(async () => {
    // Each test owns its fixtures and removes them, so suites can run in any
    // order against a shared local database.
    if (created.length > 0) {
      await sql`delete from app.items where id in ${sql(created)}`;
    }
    await sql.end();
  });

  it("round-trips create -> get -> update -> archive", async () => {
    const { item } = await createItem({
      userId: USER_ID,
      name: "Integration item",
      notes: "created by a test",
    });
    created.push(item.id);

    expect(item.name).toBe("Integration item");
    expect(item.archivedAt).toBeNull();

    const fetched = await getItem({ itemId: item.id, userId: USER_ID });
    expect(fetched.success).toBe(true);

    const updated = await updateItem({
      itemId: item.id,
      userId: USER_ID,
      name: "Renamed",
    });
    expect(updated.success && updated.item.name).toBe("Renamed");
    // notes was not supplied, so the patch must leave it untouched.
    expect(updated.success && updated.item.notes).toBe("created by a test");

    const archived = await archiveItem({ itemId: item.id, userId: USER_ID });
    expect(archived.success).toBe(true);
  });

  it("scopes reads to the owning user", async () => {
    const { item } = await createItem({ userId: USER_ID, name: "Private" });
    created.push(item.id);

    const asStranger = await getItem({
      itemId: item.id,
      userId: "33333333-3333-4333-8333-333333333333",
    });

    expect(asStranger).toEqual({ success: false, reason: "entity_not_found" });
  });

  it("excludes archived items from the default listing", async () => {
    const { item } = await createItem({ userId: USER_ID, name: "To archive" });
    created.push(item.id);
    await archiveItem({ itemId: item.id, userId: USER_ID });

    const live = await listItems({
      userId: USER_ID,
      limit: 100,
      offset: 0,
      includeArchived: false,
    });
    expect(live.items.some((i) => i.id === item.id)).toBe(false);

    const all = await listItems({
      userId: USER_ID,
      limit: 100,
      offset: 0,
      includeArchived: true,
    });
    expect(all.items.some((i) => i.id === item.id)).toBe(true);
  });
});
