import type { Product } from "@geekbase-labs/shared-types";

import type { SearchResultPage } from "../search-api";
import { nextSearchPage, searchResultItems, searchScreenState } from "../search";

function page(overrides: Partial<SearchResultPage> = {}): SearchResultPage {
  return {
    query: "tee",
    items: [],
    page: 1,
    pageSize: 24,
    total: 0,
    totalPages: 0,
    ...overrides,
  };
}

const PRODUCT = { id: "p1", name: "Blue tee" } as unknown as Product;

describe("searchScreenState", () => {
  it("prompts before the shopper has typed anything", () => {
    expect(
      searchScreenState({ query: "  ", isLoading: false, isError: false, total: 0 }),
    ).toBe("prompt");
  });

  it("shows the spinner while the first page is in flight", () => {
    expect(
      searchScreenState({ query: "tee", isLoading: true, isError: false, total: 0 }),
    ).toBe("loading");
  });

  // Unlike the recommendations row, a failed search cannot hide: the shopper
  // asked for it, and "no results" would be a lie about the catalog.
  it("surfaces a failure instead of calling it empty", () => {
    expect(
      searchScreenState({ query: "tee", isLoading: false, isError: true, total: 0 }),
    ).toBe("error");
  });

  it("separates a real empty result from results", () => {
    expect(
      searchScreenState({ query: "tee", isLoading: false, isError: false, total: 0 }),
    ).toBe("empty");
    expect(
      searchScreenState({ query: "tee", isLoading: false, isError: false, total: 3 }),
    ).toBe("results");
  });
});

describe("nextSearchPage", () => {
  it("advances while pages remain", () => {
    expect(nextSearchPage(page({ page: 1, totalPages: 3 }))).toBe(2);
  });

  it("stops on the last page", () => {
    expect(nextSearchPage(page({ page: 3, totalPages: 3 }))).toBeUndefined();
  });

  it("stops when nothing matched", () => {
    expect(nextSearchPage(page({ page: 1, totalPages: 0 }))).toBeUndefined();
  });
});

describe("searchResultItems", () => {
  it("flattens the loaded pages in order", () => {
    const first = page({ items: [PRODUCT], page: 1, total: 2, totalPages: 2 });
    const second = page({
      items: [{ ...PRODUCT, id: "p2" } as Product],
      page: 2,
      total: 2,
      totalPages: 2,
    });

    expect(searchResultItems([first, second]).map((p) => p.id)).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("has nothing to flatten before the first page arrives", () => {
    expect(searchResultItems(undefined)).toEqual([]);
  });
});
