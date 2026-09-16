import {
  serializeSpecFilters,
  type Category,
  type Product,
  type ProductFacets,
  type ProductOptionField,
  type ProductSort,
  type SpecFilters,
  type StoreProfile,
} from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

export type ProductListResponse = {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  facets: ProductFacets;
};

export type CatalogQuery = {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  sort?: ProductSort;
  inStock?: boolean;
  // Every listing under one brand name, or from one seller's store.
  brand?: string;
  storeSlug?: string;
  // Any-of within each; a spec key's values are any-of, keys are all-of.
  sizes?: string[];
  colors?: string[];
  specs?: SpecFilters;
};

export function buildProductQueryString(query: CatalogQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 24));
  params.set("sort", query.sort ?? "relevance");
  if (query.categorySlug) params.set("categorySlug", query.categorySlug);
  if (query.inStock) params.set("inStock", "true");
  if (query.brand) params.set("brand", query.brand);
  if (query.storeSlug) params.set("storeSlug", query.storeSlug);
  if (query.sizes && query.sizes.length > 0) params.set("sizes", query.sizes.join(","));
  if (query.colors && query.colors.length > 0) params.set("colors", query.colors.join(","));
  if (query.specs && Object.keys(query.specs).length > 0) {
    params.set("specs", serializeSpecFilters(query.specs));
  }
  return `?${params.toString()}`;
}

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function totalStock(product: Product): number | null {
  if (product.variants.length === 0) return null;
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await apiFetch<{ categories: Category[] }>(
    "/api/catalog/categories",
  );
  return data.categories;
}

export async function fetchProducts(
  query: CatalogQuery = {},
): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>(
    `/api/catalog/products${buildProductQueryString(query)}`,
  );
}

export async function fetchProduct(slug: string): Promise<Product> {
  const data = await apiFetch<{ product: Product }>(
    `/api/catalog/products/${encodeURIComponent(slug)}`,
  );
  return data.product;
}

export async function fetchProductOptionFields(
  slug: string,
): Promise<ProductOptionField[]> {
  const data = await apiFetch<{ optionFields: ProductOptionField[] }>(
    `/api/catalog/products/${encodeURIComponent(slug)}/option-fields`,
  );
  return data.optionFields;
}

// Who sells a product: their store, or null when the site itself does.
export async function fetchProductSeller(
  slug: string,
): Promise<StoreProfile | null> {
  const data = await apiFetch<{ store: StoreProfile | null }>(
    `/api/catalog/products/${encodeURIComponent(slug)}/seller`,
  );
  return data.store;
}

export async function fetchStore(slug: string): Promise<StoreProfile> {
  const data = await apiFetch<{ store: StoreProfile }>(
    `/api/catalog/stores/${encodeURIComponent(slug)}`,
  );
  return data.store;
}
