import {
  RECOMMENDATION_LIMIT_DEFAULT,
  RECOMMENDATION_LIMIT_MAX,
  type Product,
} from "@geekbase-labs/shared-types";

// Clamped here rather than trusted to the caller: the endpoint refuses anything
// outside 1..RECOMMENDATION_LIMIT_MAX, and a refused request would silently cost
// the shopper the whole section.
export function recommendationLimit(
  requested: number = RECOMMENDATION_LIMIT_DEFAULT,
): number {
  return Math.min(RECOMMENDATION_LIMIT_MAX, Math.max(1, Math.round(requested)));
}

export type RecommendationSection = "hidden" | "list";

// Whether the product screen shows a "Customers also bought" section at all.
// Pure because this repo still has no React renderer, so the decision is only
// testable outside a component (same reason as `reviewInvitation`).
//
// Loading, failed and empty all collapse to "hidden": recommendations are a
// nice-to-have beside the product, so a spinner that resolves to nothing — or an
// error where a shopper expected products — is worse than no section.
export function recommendationSection(query: {
  isLoading: boolean;
  isError: boolean;
  items: Product[] | undefined;
}): RecommendationSection {
  if (query.isLoading || query.isError) return "hidden";
  return query.items && query.items.length > 0 ? "list" : "hidden";
}
