import type { WishlistItem } from "@geekbase-labs/shared-types";

export function isProductSaved(
  items: WishlistItem[] | undefined,
  productId: string,
): boolean {
  return Boolean(items?.some((item) => item.productId === productId));
}

// A repeat save is a 201 with the row that already existed, so the list is
// rebuilt around the product rather than growing a second entry for it.
export function withSavedItem(
  items: WishlistItem[],
  saved: WishlistItem,
): WishlistItem[] {
  const index = items.findIndex((item) => item.productId === saved.productId);
  if (index === -1) return [saved, ...items];

  const next = [...items];
  next[index] = saved;
  return next;
}

export function withoutProduct(
  items: WishlistItem[],
  productId: string,
): WishlistItem[] {
  return items.filter((item) => item.productId !== productId);
}
