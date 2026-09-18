import { siteLinkTarget } from "../site-links";

describe("siteLinkTarget", () => {
  // The two shapes the admin's banners actually use today.
  it("maps a product link to the app's singular product route", () => {
    expect(
      siteLinkTarget("https://pimkart.com/products/wall-clock-gift-item-resin-art"),
    ).toEqual({ kind: "route", href: "/product/wall-clock-gift-item-resin-art" });
  });

  it("maps the catalogue's category query to the Home grid's filter", () => {
    expect(siteLinkTarget("https://pimkart.com/products?category=t-shirt")).toEqual({
      kind: "category",
      slug: "t-shirt",
    });
  });

  it("treats the bare catalogue as the unfiltered grid", () => {
    expect(siteLinkTarget("https://pimkart.com/products")).toEqual({
      kind: "category",
      slug: undefined,
    });
  });

  it("maps stores, brands and orders onto their singular routes", () => {
    expect(siteLinkTarget("https://pimkart.com/stores/leero")).toEqual({
      kind: "route",
      href: "/store/leero",
    });
    expect(siteLinkTarget("https://pimkart.com/brands/yamaha")).toEqual({
      kind: "route",
      href: "/brand/yamaha",
    });
    expect(siteLinkTarget("https://pimkart.com/orders/abc")).toEqual({
      kind: "route",
      href: "/order/abc",
    });
  });

  it("keeps the query when handing over to search", () => {
    expect(siteLinkTarget("https://pimkart.com/search?q=saree")).toEqual({
      kind: "route",
      href: "/search?q=saree",
    });
  });

  it("sends the site root to the tabs", () => {
    expect(siteLinkTarget("https://pimkart.com/")).toEqual({
      kind: "route",
      href: "/(tabs)",
    });
  });

  it("accepts the www host as our own", () => {
    expect(siteLinkTarget("https://www.pimkart.com/products/some-slug")).toEqual({
      kind: "route",
      href: "/product/some-slug",
    });
  });

  // A banner may advertise a campaign on somebody else's site. A path that
  // merely looks like ours must not capture the tap.
  it("has no route for another host", () => {
    expect(siteLinkTarget("https://example.com/products/some-slug")).toBeNull();
    expect(siteLinkTarget("https://instagram.com/pimkart")).toBeNull();
  });

  // Pages the website has and the app does not.
  it("has no route for a website-only page", () => {
    expect(siteLinkTarget("https://pimkart.com/refund-policy")).toBeNull();
    expect(siteLinkTarget("https://pimkart.com/contact")).toBeNull();
  });

  it("has no route for a missing or unparseable url", () => {
    expect(siteLinkTarget(null)).toBeNull();
    expect(siteLinkTarget(undefined)).toBeNull();
    expect(siteLinkTarget("not a url")).toBeNull();
  });
});
