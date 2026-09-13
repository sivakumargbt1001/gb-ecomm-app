import { pushRecentSearch, RECENT_SEARCHES_MAX } from "../recent-searches";

describe("pushRecentSearch", () => {
  it("puts the newest query first", () => {
    expect(pushRecentSearch(["shoes"], "saree")).toEqual(["saree", "shoes"]);
  });

  it("moves a repeated query to the front instead of duplicating it", () => {
    expect(pushRecentSearch(["saree", "shoes"], " Shoes ")).toEqual(["Shoes", "saree"]);
  });

  it("ignores an empty query", () => {
    expect(pushRecentSearch(["saree"], "   ")).toEqual(["saree"]);
  });

  it("keeps only the most recent few", () => {
    const many = Array.from({ length: RECENT_SEARCHES_MAX }, (_, i) => `q${i}`);
    expect(pushRecentSearch(many, "new")).toHaveLength(RECENT_SEARCHES_MAX);
    expect(pushRecentSearch(many, "new")[0]).toBe("new");
  });
});
