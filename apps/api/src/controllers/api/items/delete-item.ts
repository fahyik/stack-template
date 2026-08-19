import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../../../middleware/interfaces.js";
import { archiveItem } from "../../../services/items/archive-item.js";
import { respondInvalidPayload } from "../../lib/respond-invalid-payload.js";

import { itemParamsSchema } from "@repo/api-types/api/items";

// Gated by checkAdmin in router.ts — see the "authorization is middleware"
// rule in the api-stack skill.
export async function deleteItem(
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

    const params = itemParamsSchema.safeParse(req.params);
    if (!params.success) {
      respondInvalidPayload({ res, issues: params.error.issues });
      return;
    }

    const result = await archiveItem({
      itemId: params.data.itemId,
      userId,
    });

    if (!result.success) {
      res.json(result);
      return;
    }

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}
