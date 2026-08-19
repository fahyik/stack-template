import { z } from "zod";

import type { ApiEndpoint } from "../api-endpoint.js";
import type { Item } from "../domain/item.js";

// Request schemas. The wire types below are derived from these with
// `z.infer`, so a schema change can't drift from the type it validates.

export const itemParamsSchema = z.object({
  itemId: z.uuid(),
});

export const listItemsQuerySchema = z.object({
  // Query values arrive as strings; coerce and bound them here rather than in
  // the handler.
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  includeArchived: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export const createItemBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000).nullish(),
});

export const patchItemBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    notes: z.string().trim().max(2000).nullish(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "at least one field must be provided",
  });

export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
export type CreateItemBody = z.infer<typeof createItemBodySchema>;
export type PatchItemBody = z.infer<typeof patchItemBodySchema>;
export type ItemParams = z.infer<typeof itemParamsSchema>;

// Endpoint contracts: <body, query, params, response>.

export type ListItems = ApiEndpoint<
  never,
  ListItemsQuery,
  never,
  { items: Item[]; total: number }
>;

export type GetItem = ApiEndpoint<never, never, ItemParams, { item: Item }>;

export type CreateItem = ApiEndpoint<
  CreateItemBody,
  never,
  never,
  { item: Item }
>;

export type PatchItem = ApiEndpoint<
  PatchItemBody,
  never,
  ItemParams,
  { item: Item }
>;

export type ArchiveItem = ApiEndpoint<never, never, ItemParams, null>;
