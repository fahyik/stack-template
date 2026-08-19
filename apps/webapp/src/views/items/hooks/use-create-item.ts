import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createItem } from "../lib/items-api";
import { ITEMS_QUERY_KEY } from "./use-items-list";

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    },
  });
}
