import { familyFor, withAppFont } from "../app-font";

describe("app font", () => {
  it("picks the Jakarta file for the weight a style asks for", () => {
    expect(familyFor(undefined)).toBe("PlusJakartaSans_400Regular");
    expect(familyFor("normal")).toBe("PlusJakartaSans_400Regular");
    expect(familyFor("500")).toBe("PlusJakartaSans_500Medium");
    expect(familyFor("600")).toBe("PlusJakartaSans_600SemiBold");
    expect(familyFor("bold")).toBe("PlusJakartaSans_700Bold");
    expect(familyFor("800")).toBe("PlusJakartaSans_700Bold");
  });

  it("keeps the caller's style and consumes its weight", () => {
    const [own, font] = withAppFont([{ fontSize: 14 }, { fontWeight: "600", color: "red" }]);
    expect(own).toEqual({ fontSize: 14, fontWeight: "600", color: "red" });
    expect(font).toEqual({ fontFamily: "PlusJakartaSans_600SemiBold", fontWeight: "normal" });
  });
});
