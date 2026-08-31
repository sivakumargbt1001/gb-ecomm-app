import type { Product } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

export type SearchResultPage = {
  query: string;
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SearchParams = { q: string; page: number };

// The query goes up as the shopper typed it: the backend folds it for pins and
// synonyms, and the box keeps showing them their own words.
export function buildSearchQueryString(params: SearchParams): string {
  return `?${new URLSearchParams({
    q: params.q,
    page: String(params.page),
  }).toString()}`;
}

function emptyPage(params: SearchParams): SearchResultPage {
  return {
    query: params.q,
    items: [],
    page: params.page,
    pageSize: 24,
    total: 0,
    totalPages: 0,
  };
}

export async function searchProducts(
  params: SearchParams,
): Promise<SearchResultPage> {
  // An empty q is refused by the endpoint, and an empty box is not a search.
  if (!params.q.trim()) return emptyPage(params);

  return apiFetch<SearchResultPage>(
    `/api/search/products${buildSearchQueryString(params)}`,
  );
}
