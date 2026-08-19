import { Router } from "express";

import { auth } from "../../middleware/auth.js";
import { itemsRouter } from "./items/router.js";

// Authenticated tier. Note there is no `/api` URL prefix — these mount at the
// root (GET /items, ...). The `api/` folder name refers to the auth tier, not
// a URL segment.
export function apiRouter() {
  const router = Router();

  // Authorization is middleware, not controller logic: pass `auth` (and
  // `checkAdmin` where a route is staff-only) at the mount point.
  //
  // Mount more-specific paths BEFORE less-specific ones, e.g.
  //   router.use("/items/:itemId/parts", auth, partsRouter());
  //   router.use("/items", auth, itemsRouter());
  router.use("/items", auth, itemsRouter());

  return router;
}
