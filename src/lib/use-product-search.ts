import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { nextSearchPage, searchResultItems } from "./search";
import { searchProducts } from "./search-api";

const DEBOUNCE_MS = 300;

// The box updates on every keystroke; the query does not. Without this, typing
// "t-shirt" is seven searches and the results flicker through the prefixes.
export function useDebouncedValue<T>(value: T, delayMs = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useProductSearch(rawQuery: string) {
  const query = useDebouncedValue(rawQuery).trim();

  const search = useInfiniteQuery({
    queryKey: ["search", query],
    queryFn: ({ pageParam }) => searchProducts({ q: query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextSearchPage,
    enabled: query.length > 0,
    // A search is a question about right now; a merchant's pin should show up
    // on the next one rather than after a cache window.
    staleTime: 0,
  });

  return {
    query,
    items: searchResultItems(search.data?.pages),
    total: search.data?.pages[0]?.total ?? 0,
    isLoading: search.isLoading,
    isError: search.isError,
    hasNextPage: search.hasNextPage,
    isFetchingNextPage: search.isFetchingNextPage,
    fetchNextPage: search.fetchNextPage,
    refetch: () => {
      void search.refetch();
    },
  };
}
