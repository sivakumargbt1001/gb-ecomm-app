import type { Review } from "@geekbase-labs/shared-types";

import {
  formatAverageRating,
  reviewInvitation,
  validateReviewDraft,
} from "../reviews";

// A real v4 UUID: the draft is validated with the shared CreateReviewSchema,
// and zod checks the version and variant nibbles, not just the shape.
const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";

const review: Review = {
  id: "44444444-4444-4444-8444-444444444444",
  productId: PRODUCT_ID,
  rating: 4,
  text: "Solid.",
  createdAt: "2026-08-02T10:00:00.000Z",
};

describe("reviewInvitation", () => {
  it("waits while the session is still resolving", () => {
    expect(
      reviewInvitation({ status: "loading", eligibility: undefined }),
    ).toBe("waiting");
  });

  it("asks a guest to sign in", () => {
    expect(reviewInvitation({ status: "guest", eligibility: undefined })).toBe(
      "sign-in",
    );
  });

  it("waits for the signed-in shopper's eligibility before deciding", () => {
    expect(
      reviewInvitation({ status: "authenticated", eligibility: undefined }),
    ).toBe("waiting");
  });

  it("offers the form to someone whose order was delivered", () => {
    expect(
      reviewInvitation({
        status: "authenticated",
        eligibility: { canReview: true, review: null },
      }),
    ).toBe("form");
  });

  it("explains the gate to someone who never bought it", () => {
    expect(
      reviewInvitation({
        status: "authenticated",
        eligibility: { canReview: false, review: null },
      }),
    ).toBe("not-eligible");
  });

  it("shows a shopper their own review instead of a second form", () => {
    expect(
      reviewInvitation({
        status: "authenticated",
        eligibility: { canReview: false, review },
      }),
    ).toBe("own-review");
  });
});

describe("validateReviewDraft", () => {
  it("accepts a rating with text", () => {
    expect(
      validateReviewDraft({ productId: PRODUCT_ID, rating: 5, text: "Great." }),
    ).toEqual({ ok: true });
  });

  it("accepts a rating on its own", () => {
    expect(
      validateReviewDraft({ productId: PRODUCT_ID, rating: 5, text: "" }),
    ).toEqual({ ok: true });
  });

  it("refuses an untouched form rather than assuming a rating", () => {
    const result = validateReviewDraft({
      productId: PRODUCT_ID,
      rating: 0,
      text: "",
    });
    expect(result).toEqual({ ok: false, error: "Pick a rating from 1 to 5" });
  });

  it("refuses text beyond 2000 characters", () => {
    const result = validateReviewDraft({
      productId: PRODUCT_ID,
      rating: 5,
      text: "x".repeat(2001),
    });
    expect(result.ok).toBe(false);
  });
});

describe("formatAverageRating", () => {
  it("always shows one decimal, so the number never jumps width", () => {
    expect(formatAverageRating(4)).toBe("4.0");
    expect(formatAverageRating(4.25)).toBe("4.3");
  });
});
