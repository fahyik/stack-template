import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../../../middleware/interfaces.js";
import { updateItem } from "../../../services/items/update-item.js";
import { respondInvalidPayload } from "../../lib/respond-invalid-payload.js";

import {
  itemParamsSchema,
  patchItemBodySchema,
} from "@repo/interfaces/api/items";

export async function patchItem(
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
    const body = patchItemBodySchema.safeParse(req.body);
    if (!params.success || !body.success) {
      respondInvalidPayload({
        res,
        issues: [
          ...(params.success ? [] : params.error.issues),
          ...(body.success ? [] : body.error.issues),
        ],
      });
      return;
    }

    const result = await updateItem({
      itemId: params.data.itemId,
      userId,
      name: body.data.name,
      notes: body.data.notes,
    });

    if (!result.success) {
      res.json(result);
      return;
    }

    res.json({ success: true, data: { item: result.item } });
  } catch (error) {
    next(error);
  }
}
