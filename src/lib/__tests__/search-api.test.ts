import { apiFetch } from "../api-client";
import { buildSearchQueryString, searchProducts } from "../search-api";

jest.mock("../api-client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const PAGE = {
  query: "tee",
  items: [],
  page: 1,
  pageSize: 24,
  total: 0,
  totalPages: 0,
};

describe("buildSearchQueryString", () => {
  it("sends the raw query and the page", () => {
    expect(buildSearchQueryString({ q: "blue tee", page: 2 })).toBe(
      "?q=blue+tee&page=2",
    );
  });

  // The backend normalizes for pins and synonyms; the screen keeps showing the
  // shopper exactly what they typed.
  it("does not fold the query itself", () => {
    expect(buildSearchQueryString({ q: "Blue TEE", page: 1 })).toBe(
      "?q=Blue+TEE&page=1",
    );
  });
});

describe("searchProducts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads the search endpoint", async () => {
    mockApiFetch.mockResolvedValue(PAGE);

    expect(await searchProducts({ q: "tee", page: 1 })).toEqual(PAGE);
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/search/products?q=tee&page=1",
    );
  });

  // A blank box is not a search; the endpoint refuses an empty q outright.
  it("never asks the backend about a blank query", async () => {
    const result = await searchProducts({ q: "   ", page: 1 });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  // The shopper asked for this, so a failure has to reach the screen rather
  // than quietly reading as "no results".
  it("lets a failure reach the caller", async () => {
    mockApiFetch.mockRejectedValue(new Error("API request failed: 500"));

    await expect(searchProducts({ q: "tee", page: 1 })).rejects.toThrow("500");
  });
});
