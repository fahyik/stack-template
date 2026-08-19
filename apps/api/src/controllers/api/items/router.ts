import { Router } from "express";

import { checkAdmin } from "../../../middleware/check-admin.js";
import { deleteItem } from "./delete-item.js";
import { getItem } from "./get-item.js";
import { getItemsList } from "./get-items-list.js";
import { patchItem } from "./patch-item.js";
import { postItem } from "./post-item.js";

// `auth` is attached once at the mount point in controllers/api/index.ts, not
// here. Per-route middleware is for narrower gates like checkAdmin.
export function itemsRouter() {
  const router = Router();

  router.get("/", getItemsList);
  router.post("/", postItem);
  router.get("/:itemId", getItem);
  router.patch("/:itemId", patchItem);
  // Authorization is middleware, not URL structure: this stays on /items
  // rather than moving to an /admin namespace.
  router.delete("/:itemId", checkAdmin, deleteItem);

  return router;
}
