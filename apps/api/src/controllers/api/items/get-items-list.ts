import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../../../middleware/interfaces.js";
import { listItems } from "../../../services/items/list-items.js";
import { respondInvalidPayload } from "../../lib/respond-invalid-payload.js";

import { listItemsQuerySchema } from "@repo/interfaces/api/items";

export async function getItemsList(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      res.json({ success: false, reason: "unauthenticated" });
      return;
    }

    const query = listItemsQuerySchema.safeParse(req.query);
    if (!query.success) {
      respondInvalidPayload({ res, issues: query.error.issues });
      return;
    }

    const { items, total } = await listItems({
      userId,
      limit: query.data.limit,
      offset: query.data.offset,
      includeArchived: query.data.includeArchived,
    });

    res.json({ success: true, data: { items, total } });
  } catch (error) {
    next(error);
  }
}
