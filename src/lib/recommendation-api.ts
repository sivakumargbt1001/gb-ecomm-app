import type { Product } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";
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
