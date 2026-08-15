import {
  CreateReviewSchema,
  type ReviewEligibility,
} from "@geekbase-labs/shared-types";

import type { AuthStatus } from "./auth-store";

export type ReviewInvitation =
  | "waiting"
  | "sign-in"
  | "not-eligible"
  | "own-review"
  | "form";

// What the product screen should show where a review form might go. Kept as a
// pure function because this repo has no React renderer, so the decision is
// only testable outside a component.
export function reviewInvitation(state: {
  status: AuthStatus;
  eligibility: ReviewEligibility | undefined;
}): ReviewInvitation {
  if (state.status === "loading") return "waiting";
  if (state.status === "guest") return "sign-in";
  if (!state.eligibility) return "waiting";
  if (state.eligibility.review) return "own-review";
  return state.eligibility.canReview ? "form" : "not-eligible";
}

export type DraftValidation = { ok: true } | { ok: false; error: string };

export function validateReviewDraft(draft: {
  productId: string;
  rating: number;
  text: string;
}): DraftValidation {
  const parsed = CreateReviewSchema.safeParse(draft);
  if (parsed.success) return { ok: true };

  // A rating of 0 is an untouched form, not a bad rating, and "Too small:
  // expected number to be >=1" is not what to put in front of a shopper.
  const issue = parsed.error.issues[0];
  if (issue?.path[0] === "rating") {
    return { ok: false, error: "Pick a rating from 1 to 5" };
  }
  if (issue?.path[0] === "text") {
    return { ok: false, error: "Reviews are limited to 2000 characters" };
  }
  return { ok: false, error: issue?.message ?? "Invalid review" };
}

export function formatAverageRating(average: number): string {
  return average.toFixed(1);
}
