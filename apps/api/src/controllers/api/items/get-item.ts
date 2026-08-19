import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../../../middleware/interfaces.js";
import { getItem as getItemService } from "../../../services/items/get-item.js";
import { respondInvalidPayload } from "../../lib/respond-invalid-payload.js";

import { itemParamsSchema } from "@repo/api-types/api/items";

export async function getItem(
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

    const result = await getItemService({
      itemId: params.data.itemId,
      userId,
    });

    if (!result.success) {
      // Forward the service's failure union directly rather than rebuilding it.
      res.json(result);
      return;
    }

    res.json({ success: true, data: { item: result.item } });
  } catch (error) {
    next(error);
  }
}
