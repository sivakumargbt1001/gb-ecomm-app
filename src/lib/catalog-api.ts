import type {
  Category,
  Product,
  ProductOptionField,
  ProductSort,
} from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

export type ProductListResponse = {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CatalogQuery = {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  sort?: ProductSort;
  inStock?: boolean;
};

export function buildProductQueryString(query: CatalogQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 24));
  params.set("sort", query.sort ?? "newest");
  if (query.categorySlug) params.set("categorySlug", query.categorySlug);
  if (query.inStock) params.set("inStock", "true");
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
