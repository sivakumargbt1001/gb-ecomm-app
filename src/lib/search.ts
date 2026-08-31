import type { Product } from "@geekbase-labs/shared-types";

import type { SearchResultPage } from "./search-api";

export type SearchScreenState =
  | "prompt"
  | "loading"
  | "error"
  | "empty"
  | "results";

// Pure because this repo has no React renderer, so the decision is only
// testable outside a component (same reason as `recommendationSection`).
//
// A failure stays visible here, unlike the recommendations row: the shopper
// asked for this, and folding an error into "no results" would misreport the
// catalog.
export function searchScreenState(query: {
  query: string;
  isLoading: boolean;
  isError: boolean;
  total: number;
}): SearchScreenState {
  if (!query.query.trim()) return "prompt";
  if (query.isLoading) return "loading";
  if (query.isError) return "error";
  return query.total > 0 ? "results" : "empty";
}

export function nextSearchPage(last: SearchResultPage): number | undefined {
  return last.page < last.totalPages ? last.page + 1 : undefined;
}

export function searchResultItems(
  pages: SearchResultPage[] | undefined,
): Product[] {
  return (pages ?? []).flatMap((page) => page.items);
}
