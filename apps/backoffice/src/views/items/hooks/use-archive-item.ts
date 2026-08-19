import { useMutation, useQueryClient } from "@tanstack/react-query";

import { archiveItem } from "../lib/items-api";
import { ITEMS_QUERY_KEY } from "./use-items-list";

export function useArchiveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    },
  });
}
