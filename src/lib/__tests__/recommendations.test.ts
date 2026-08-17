import {
  recommendationLimit,
  recommendationSection,
} from "../recommendations";

const product = (id: string) => ({
  id,
  categoryId: "22222222-2222-4222-8222-222222222222",
  name: `Product ${id}`,
  slug: `product-${id}`,
  description: "",
  priceInPaise: 100000,
  currency: "INR" as const,
  isActive: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  variants: [],
  images: [],
});

describe("recommendationLimit", () => {
  it("defaults to the shared default when nothing is asked for", () => {
    expect(recommendationLimit()).toBe(4);
  });

  it("passes a sensible request through", () => {
    expect(recommendationLimit(6)).toBe(6);
  });

  it("clamps above the shared maximum rather than letting the server refuse", () => {
    expect(recommendationLimit(99)).toBe(12);
  });

  it("clamps a zero or negative request up to one", () => {
    expect(recommendationLimit(0)).toBe(1);
    expect(recommendationLimit(-3)).toBe(1);
  });

  it("rounds a fractional request, since the endpoint takes integers only", () => {
    expect(recommendationLimit(2.6)).toBe(3);
  });
});

describe("recommendationSection", () => {
  it("is hidden while the request is in flight", () => {
    expect(
      recommendationSection({ isLoading: true, isError: false, items: undefined }),
    ).toBe("hidden");
  });

  it("is hidden when the request failed — a product page must not show an error for this", () => {
    expect(
      recommendationSection({ isLoading: false, isError: true, items: undefined }),
    ).toBe("hidden");
  });

  it("is hidden when there is nothing to recommend", () => {
    expect(
      recommendationSection({ isLoading: false, isError: false, items: [] }),
    ).toBe("hidden");
  });

  it("shows the list once there is something to show", () => {
    expect(
      recommendationSection({
        isLoading: false,
        isError: false,
        items: [product("a")],
      }),
    ).toBe("list");
  });
});
