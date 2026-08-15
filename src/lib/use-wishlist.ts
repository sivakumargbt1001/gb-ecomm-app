import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WishlistItem } from "@geekbase-labs/shared-types";

import { useAuthStore } from "./auth-store";
import { isProductSaved, withSavedItem, withoutProduct } from "./wishlist";
import {
  addWishlistItem,
  listWishlist,
  removeWishlistItem,
} from "./wishlist-api";

export const WISHLIST_KEY = ["wishlist"] as const;

export function useWishlist(enabled: boolean) {
  const query = useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: listWishlist,
    enabled,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

// One toggle behind both hearts — the one on a catalog card and the one on the
// detail screen — so they read and write the same cached list.
export function useWishlistToggle(productId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { items } = useWishlist(Boolean(user));
  const isSaved = isProductSaved(items, productId);

  const write = (update: (items: WishlistItem[]) => WishlistItem[]) =>
    queryClient.setQueryData<WishlistItem[]>(WISHLIST_KEY, (prev) =>
      prev ? update(prev) : prev,
    );

  const add = useMutation({
    mutationFn: () => addWishlistItem(productId),
    onSuccess: (saved) => write((prev) => withSavedItem(prev, saved)),
  });

  const remove = useMutation({
    mutationFn: () => removeWishlistItem(productId),
    onSuccess: () => write((prev) => withoutProduct(prev, productId)),
  });

  return {
    isSaved,
    isPending: add.isPending || remove.isPending,
    error: add.error ?? remove.error,
    toggle: () => (isSaved ? remove.mutate() : add.mutate()),
  };
}
