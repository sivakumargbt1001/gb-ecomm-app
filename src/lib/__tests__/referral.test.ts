import type { ReferralSummary } from "@geekbase-labs/shared-types";

import {
  referralCodeFromLink,
  referralShareMessage,
  signupReferralCode,
  validateReferralDraft,
} from "../referral";

function summary(overrides: Partial<ReferralSummary> = {}): ReferralSummary {
  return {
    code: "REF-A1B2C3D4",
    shareUrl: "https://shop.example/signup?ref=REF-A1B2C3D4",
    invited: 2,
    rewarded: 1,
    referrerRewardPoints: 100,
    enabled: true,
    ...overrides,
  };
}

describe("validateReferralDraft", () => {
  // Blank is valid: most people signing up were not referred by anyone.
  it("accepts an empty field", () => {
    expect(validateReferralDraft("")).toEqual({ ok: true });
    expect(validateReferralDraft("   ")).toEqual({ ok: true });
  });

  it("normalises what was typed so the server sees one form", () => {
    expect(validateReferralDraft("ref-a1b2c3d4")).toEqual({
      ok: true,
      code: "REF-A1B2C3D4",
    });
  });

  it("trims what a share sheet or clipboard added", () => {
    expect(validateReferralDraft("  REF-A1B2C3D4 ")).toEqual({
      ok: true,
      code: "REF-A1B2C3D4",
    });
  });

  it("refuses a malformed code before it costs a round trip", () => {
    expect(validateReferralDraft("not a code").ok).toBe(false);
    expect(validateReferralDraft("REF_A1B2").ok).toBe(false);
  });
});

// On a phone the whole link gets pasted far more often than the bare code, so
// the field has to cope with one.
describe("referralCodeFromLink", () => {
  it("pulls the code out of a pasted share link", () => {
    expect(
      referralCodeFromLink("https://shop.example/signup?ref=REF-A1B2C3D4"),
    ).toBe("REF-A1B2C3D4");
  });

  it("normalises the case the link was pasted in", () => {
    expect(
      referralCodeFromLink("https://shop.example/signup?ref=ref-a1b2c3d4"),
    ).toBe("REF-A1B2C3D4");
  });

  it("copes with a link carrying other query parameters", () => {
    expect(
      referralCodeFromLink("https://shop.example/signup?utm=x&ref=REF-A1B2C3D4"),
    ).toBe("REF-A1B2C3D4");
  });

  it("is null when the text is not a link with a code on it", () => {
    expect(referralCodeFromLink("https://shop.example/signup")).toBeNull();
    expect(referralCodeFromLink("REF-A1B2C3D4")).toBeNull();
    expect(referralCodeFromLink("")).toBeNull();
  });

  it("is null when the link carries something that is not a code", () => {
    expect(referralCodeFromLink("https://shop.example/signup?ref=not a code")).toBeNull();
  });
});

// What the field should actually send, given whatever the shopper put in it —
// a bare code or a whole link.
describe("signupReferralCode", () => {
  it("takes a bare code", () => {
    expect(signupReferralCode("ref-a1b2c3d4")).toEqual({
      ok: true,
      code: "REF-A1B2C3D4",
    });
  });

  it("takes a pasted link and finds the code in it", () => {
    expect(
      signupReferralCode("https://shop.example/signup?ref=ref-a1b2c3d4"),
    ).toEqual({ ok: true, code: "REF-A1B2C3D4" });
  });

  it("sends nothing at all for an empty field", () => {
    expect(signupReferralCode("  ")).toEqual({ ok: true });
  });

  it("refuses text that is neither", () => {
    expect(signupReferralCode("https://shop.example/signup").ok).toBe(false);
    expect(signupReferralCode("not a code").ok).toBe(false);
  });
});

describe("referralShareMessage", () => {
  it("carries the link, which is the only part that has to survive", () => {
    expect(referralShareMessage(summary())).toContain(
      "https://shop.example/signup?ref=REF-A1B2C3D4",
    );
  });

  it("says what the friend gets, not what the referrer gets", () => {
    const message = referralShareMessage(summary());
    expect(message).toMatch(/discount|off/i);
  });

  it("is empty when there is no link to share", () => {
    expect(referralShareMessage(summary({ code: null, shareUrl: null }))).toBe("");
  });
});
