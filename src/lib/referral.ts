import {
  ReferralCodeSchema,
  type ReferralSummary,
} from "@geekbase-labs/shared-types";

export type ReferralDraft = { ok: true; code?: string } | { ok: false; error: string };

const MALFORMED =
  "That referral code doesn't look right — check the link you were sent.";

// Pure, like the coupon and loyalty helpers, because this repo has no React
// renderer to test the decision inside a component.

// Blank is valid: most people signing up were not referred by anyone.
export function validateReferralDraft(raw: string): ReferralDraft {
  if (!raw.trim()) return { ok: true };

  const parsed = ReferralCodeSchema.safeParse(raw);
  return parsed.success ? { ok: true, code: parsed.data } : { ok: false, error: MALFORMED };
}

// On a phone the whole link gets pasted far more often than the bare code is
// retyped, so the field has to be able to read one. Returns null for anything
// that is not a link carrying a usable code.
export function referralCodeFromLink(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let ref: string | null;
  try {
    ref = new URL(trimmed).searchParams.get("ref");
  } catch {
    return null;
  }
  if (!ref) return null;

  const parsed = ReferralCodeSchema.safeParse(ref);
  return parsed.success ? parsed.data : null;
}

// What the signup screen should send for whatever ended up in the field —
// a bare code, a pasted link, or nothing.
export function signupReferralCode(raw: string): ReferralDraft {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true };

  const fromLink = referralCodeFromLink(trimmed);
  if (fromLink) return { ok: true, code: fromLink };

  // A link we could not read a code out of is a mistake worth naming, rather
  // than something to hand to the server as if it were a code.
  if (/^https?:\/\//i.test(trimmed)) return { ok: false, error: MALFORMED };

  return validateReferralDraft(trimmed);
}

// The text the native share sheet sends. It leads with what the *friend* gets:
// nobody forwards a link that only pays the sender.
export function referralShareMessage(summary: ReferralSummary): string {
  if (!summary.shareUrl) return "";
  return `Get a discount on your first order — sign up with my link: ${summary.shareUrl}`;
}
