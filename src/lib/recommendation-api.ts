import type { Product } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";
import { getGuestId } from "./guest-id";
import { recommendationLimit } from "./recommendations";

export async function fetchRecommendations(
  productId: string,
  limit?: number,
): Promise<Product[]> {
  const data = await apiFetch<{ items: Product[] }>(
    `/api/recommendations/${encodeURIComponent(productId)}?limit=${recommendationLimit(limit)}`,
  );
  return data.items;
}

// What is moving lately, tilted to this shopper: the guest id goes along (the
// signed-in token already does) so the API knows who is asking.
export async function fetchTrending(limit?: number): Promise<Product[]> {
  const guestId = await getGuestId();
  const data = await apiFetch<{ items: Product[] }>(
    `/api/recommendations/trending?limit=${recommendationLimit(limit)}`,
    { headers: { "X-Guest-Id": guestId } },
  );
  return data.items;
}
