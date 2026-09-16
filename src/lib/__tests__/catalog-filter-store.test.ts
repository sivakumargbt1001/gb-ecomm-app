import { buildProductQueryString } from "../catalog-api";
import {
  countNarrowing,
  isValueSelected,
  toggleSpecValue,
  toggleValue,
  useCatalogFilterStore,
} from "../catalog-filter-store";

describe("toggleValue", () => {
  it("ticks a value that is not there and unticks one that is", () => {
    expect(toggleValue([], "S")).toEqual(["S"]);
    expect(toggleValue(["S"], "M")).toEqual(["S", "M"]);
    expect(toggleValue(["S", "M"], "S")).toEqual(["M"]);
  });

  it("matches without regard to case, so a deep link's xxl unticks XXL", () => {
    expect(toggleValue(["XXL"], "xxl")).toEqual([]);
    expect(isValueSelected(["XXL"], "xxl")).toBe(true);
  });
});

describe("toggleSpecValue", () => {
  it("adds a key on its first value and drops it with its last", () => {
    const one = toggleSpecValue({}, "gender", "Men");
    expect(one).toEqual({ gender: ["Men"] });
    const two = toggleSpecValue(one, "gender", "Women");
    expect(two).toEqual({ gender: ["Men", "Women"] });
    const back = toggleSpecValue(toggleSpecValue(two, "gender", "Men"), "gender", "Women");
    expect(back).toEqual({});
  });

  it("leaves other keys alone", () => {
    expect(toggleSpecValue({ material: ["Cotton"] }, "gender", "Men")).toEqual({
      material: ["Cotton"],
      gender: ["Men"],
    });
  });
});

describe("countNarrowing", () => {
  it("counts every ticked value across size, colour and specs", () => {
    expect(countNarrowing({ sizes: [], colors: [], specs: {} })).toBe(0);
    expect(
      countNarrowing({
        sizes: ["S", "M"],
        colors: ["Black"],
        specs: { gender: ["Men"], material: ["Cotton", "Linen"] },
      }),
    ).toBe(6);
  });
});

describe("the catalog filter store", () => {
  beforeEach(() => {
    useCatalogFilterStore.setState({
      categorySlug: undefined,
      sort: "relevance",
      sizes: [],
      colors: [],
      specs: {},
    });
  });

  it("ticks sizes, colours and specs in place", () => {
    const store = useCatalogFilterStore.getState();
    store.toggleSize("M");
    store.toggleColor("Black");
    store.toggleSpec("gender", "Men");

    expect(useCatalogFilterStore.getState()).toMatchObject({
      sizes: ["M"],
      colors: ["Black"],
      specs: { gender: ["Men"] },
    });
  });

  it("starts the narrowing over when the category changes", () => {
    const store = useCatalogFilterStore.getState();
    store.toggleSize("M");
    store.toggleSpec("gender", "Men");
    store.setCategorySlug("shoes");

    expect(useCatalogFilterStore.getState()).toMatchObject({
      categorySlug: "shoes",
      sizes: [],
      colors: [],
      specs: {},
    });
  });

  it("clears the narrowing but keeps the category and sort", () => {
    const store = useCatalogFilterStore.getState();
    store.setCategorySlug("t-shirt");
    store.setSort("newest");
    store.toggleSize("M");
    store.clearNarrowing();

    expect(useCatalogFilterStore.getState()).toMatchObject({
      categorySlug: "t-shirt",
      sort: "newest",
      sizes: [],
    });
  });

  it("sends the narrowing to the backend the way the website does", () => {
    const qs = buildProductQueryString({
      sizes: ["S", "M"],
      colors: ["Black"],
      specs: { gender: ["Men", "Women"] },
    });
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("sizes")).toBe("S,M");
    expect(params.get("colors")).toBe("Black");
    expect(params.get("specs")).toBe("gender:Men,gender:Women");
  });

  it("sends nothing extra when nothing is ticked", () => {
    expect(buildProductQueryString({ sizes: [], colors: [], specs: {} })).toBe(
      "?page=1&pageSize=24&sort=relevance",
    );
  });
});
