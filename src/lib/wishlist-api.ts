import type { WishlistItem } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

export async function listWishlist(): Promise<WishlistItem[]> {
  const data = await apiFetch<{ items: WishlistItem[] }>("/api/wishlist");
  return data.items;
}

export async function addWishlistItem(productId: string): Promise<WishlistItem> {
  const data = await apiFetch<{ item: WishlistItem }>("/api/wishlist", {
    method: "POST",
    body: { productId },
  });
  return data.item;
}

export async function removeWishlistItem(productId: string): Promise<void> {
  await apiFetch<void>(`/api/wishlist/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}
