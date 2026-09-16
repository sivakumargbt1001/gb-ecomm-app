import { useQuery } from "@tanstack/react-query";

import { fetchProducts } from "./catalog-api";
import { useCatalogFilterStore } from "./catalog-filter-store";

// The Home grid's products, keyed by everything the shopper has narrowed to.
// The catalog menu reads the same query for its facets, so the two never
// disagree about what can still be picked and no second request is made.
export function useCatalogProducts() {
  const { categorySlug, sort, sizes, colors, specs } = useCatalogFilterStore();

  return useQuery({
    queryKey: ["products", categorySlug, sort, sizes, colors, specs],
    queryFn: () => fetchProducts({ categorySlug, sort, sizes, colors, specs }),
  });
}
