import { useQuery } from "@tanstack/react-query";

import { listItems } from "../lib/items-api";

export const ITEMS_QUERY_KEY = ["items"] as const;

export function useItemsList() {
  return useQuery({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: () => listItems(),
  });
}
