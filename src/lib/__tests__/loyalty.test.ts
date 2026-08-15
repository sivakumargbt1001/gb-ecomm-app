import {
  checkoutRedeemPoints,
  redeemedValueInPaise,
  usablePoints,
  validateRedeemDraft,
} from "../loyalty";

describe("usablePoints", () => {
  it("is the merchant's cap on the order when the balance is bigger", () => {
    // 10% of ₹1,000 is ₹100 — 100 points.
    expect(
      usablePoints({
        balance: 500,
        maxRedemptionPercent: 10,
        subtotalInPaise: 100000,
        payableInPaise: 100000,
      }),
    ).toBe(100);
  });

  it("is the balance when that is smaller than the cap", () => {
    expect(
      usablePoints({
        balance: 30,
        maxRedemptionPercent: 50,
        subtotalInPaise: 100000,
        payableInPaise: 100000,
      }),
    ).toBe(30);
  });

  it("never exceeds what the order still costs", () => {
    expect(
      usablePoints({
        balance: 500,
        maxRedemptionPercent: 10,
        subtotalInPaise: 100000,
        payableInPaise: 5000,
      }),
    ).toBe(50);
  });

  it("is zero while the programme is switched off", () => {
    expect(
      usablePoints({
        balance: 500,
        maxRedemptionPercent: 0,
        subtotalInPaise: 100000,
        payableInPaise: 100000,
      }),
    ).toBe(0);
  });
});

describe("redeemedValueInPaise", () => {
  it("values a point at one rupee", () => {
    expect(redeemedValueInPaise(50)).toBe(5000);
  });
});

describe("validateRedeemDraft", () => {
  it("accepts a whole number within the allowance", () => {
    expect(validateRedeemDraft("50", 50)).toEqual({ ok: true, points: 50 });
  });

  it("treats a blank field as nothing to redeem", () => {
    expect(validateRedeemDraft("  ", 50)).toEqual({
      ok: false,
      error: "Enter how many points to use",
    });
  });

  it("refuses fractions and gibberish", () => {
    expect(validateRedeemDraft("1.5", 50).ok).toBe(false);
    expect(validateRedeemDraft("lots", 50).ok).toBe(false);
  });

  it("refuses zero and negatives", () => {
    expect(validateRedeemDraft("0", 50).ok).toBe(false);
    expect(validateRedeemDraft("-5", 50).ok).toBe(false);
  });

  it("refuses more than the order allows, and says the number", () => {
    const result = validateRedeemDraft("51", 50);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/50/);
  });
});

describe("checkoutRedeemPoints", () => {
  it("sends nothing when no points are applied", () => {
    expect(
      checkoutRedeemPoints({
        points: 0,
        balance: 500,
        maxRedemptionPercent: 10,
        subtotalInPaise: 100000,
        payableInPaise: 100000,
      }),
    ).toBeUndefined();
  });

  it("sends what the shopper applied when it still fits the order", () => {
    expect(
      checkoutRedeemPoints({
        points: 50,
        balance: 500,
        maxRedemptionPercent: 10,
        subtotalInPaise: 100000,
        payableInPaise: 100000,
      }),
    ).toBe(50);
  });

  // The cart can change after points are applied — a smaller cart means a
  // smaller cap, and sending the old number would just be refused.
  it("withholds points the order can no longer take", () => {
    expect(
      checkoutRedeemPoints({
        points: 100,
        balance: 500,
        maxRedemptionPercent: 10,
        subtotalInPaise: 20000,
        payableInPaise: 20000,
      }),
    ).toBeUndefined();
  });
});
