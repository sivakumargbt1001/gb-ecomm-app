import type { Product } from "@geekbase-labs/shared-types";

import {
  buildProductQueryString,
  formatPaise,
  totalStock,
} from "../catalog-api";

function makeProduct(variants: { stock: number }[]): Product {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    categoryId: "22222222-2222-4222-8222-222222222222",
    name: "P",
    slug: "p",
    description: "",
    priceInPaise: 1000,
    currency: "INR",
    isActive: true,
    ownerUserId: null,
    approvalStatus: "approved" as const,
    rejectionReason: null,
    submittedAt: null,
    reviewedAt: null,
    createdAt: "2026-07-02T00:00:00.000Z",
    variants: variants.map((v, i) => ({
      id: `44444444-4444-4444-8444-00000000000${i}`,
      productId: "33333333-3333-4333-8333-333333333333",
      name: `V${i}`,
      sku: null,
      priceInPaise: 1000,
      stock: v.stock,
      sortOrder: i,
    })),
    images: [],
  };
}

describe("buildProductQueryString", () => {
  it("applies defaults", () => {
    expect(buildProductQueryString({})).toBe("?page=1&pageSize=24&sort=relevance");
  });

  it("includes category, sort, and inStock when set", () => {
    const qs = buildProductQueryString({
      categorySlug: "sarees",
      sort: "price_asc",
      inStock: true,
      page: 2,
    });
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("categorySlug")).toBe("sarees");
    expect(params.get("sort")).toBe("price_asc");
    expect(params.get("inStock")).toBe("true");
    expect(params.get("page")).toBe("2");
  });
});

describe("formatPaise", () => {
  it("formats paise as rupees", () => {
    expect(formatPaise(899900)).toBe("₹8,999.00");
  });
});

describe("totalStock", () => {
  it("returns null for a product with no variants", () => {
    expect(totalStock(makeProduct([]))).toBeNull();
  });

  it("sums variant stock", () => {
    expect(totalStock(makeProduct([{ stock: 3 }, { stock: 2 }]))).toBe(5);
  });
});
