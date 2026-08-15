import {
  appliedDiscount,
  checkoutCouponCode,
  validateCouponCode,
} from "../coupon";

const SUBTOTAL = 100000;

const PREVIEW = {
  code: "DIWALI20",
  subtotalInPaise: SUBTOTAL,
  discountInPaise: 20000,
  totalInPaise: 80000,
};

describe("appliedDiscount", () => {
  it("charges the full subtotal when no coupon is applied", () => {
    expect(appliedDiscount(null, SUBTOTAL)).toEqual({
      discountInPaise: 0,
      totalInPaise: SUBTOTAL,
      stale: false,
    });
  });

  it("uses the preview's own numbers when it still matches the cart", () => {
    expect(appliedDiscount(PREVIEW, SUBTOTAL)).toEqual({
      discountInPaise: 20000,
      totalInPaise: 80000,
      stale: false,
    });
  });

  it("drops a preview priced against a different subtotal rather than quoting it", () => {
    expect(appliedDiscount(PREVIEW, 150000)).toEqual({
      discountInPaise: 0,
      totalInPaise: 150000,
      stale: true,
    });
  });
});

describe("checkoutCouponCode", () => {
  it("is undefined when nothing is applied", () => {
    expect(checkoutCouponCode(null, SUBTOTAL)).toBeUndefined();
  });

  it("sends the code when the preview still matches the cart", () => {
    expect(checkoutCouponCode(PREVIEW, SUBTOTAL)).toBe("DIWALI20");
  });

  it("withholds a stale code so the shopper is never charged on numbers they did not see", () => {
    expect(checkoutCouponCode(PREVIEW, 150000)).toBeUndefined();
  });
});

describe("validateCouponCode", () => {
  it("uppercases what the shopper typed", () => {
    expect(validateCouponCode("diwali20")).toEqual({ ok: true, code: "DIWALI20" });
  });

  it("trims surrounding whitespace", () => {
    expect(validateCouponCode("  DIWALI20 ")).toEqual({
      ok: true,
      code: "DIWALI20",
    });
  });

  it("treats an empty field as nothing to apply, not as a bad code", () => {
    expect(validateCouponCode("   ")).toEqual({
      ok: false,
      error: "Enter a coupon code",
    });
  });

  it("refuses a code with characters no coupon can have", () => {
    expect(validateCouponCode("SAVE 20%")).toEqual({
      ok: false,
      error: "Coupon codes are letters, digits and hyphens only",
    });
  });
});
