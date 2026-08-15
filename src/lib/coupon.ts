import { CouponCodeSchema, type CouponPreview } from "@geekbase-labs/shared-types";

export type AppliedDiscount = {
  discountInPaise: number;
  totalInPaise: number;
  // True when a preview exists but was priced against a different subtotal —
  // the shopper changed the cart after applying it.
  stale: boolean;
};

// A preview is only good for the subtotal it was priced against. Showing an old
// discount against a new subtotal would quote a total the server will not
// honour. Pure, like the wishlist and review helpers, because this repo has no
// React renderer to test the decision inside a component.
export function appliedDiscount(
  preview: CouponPreview | null,
  subtotalInPaise: number,
): AppliedDiscount {
  if (preview === null) {
    return { discountInPaise: 0, totalInPaise: subtotalInPaise, stale: false };
  }
  if (preview.subtotalInPaise !== subtotalInPaise) {
    return { discountInPaise: 0, totalInPaise: subtotalInPaise, stale: true };
  }
  return {
    discountInPaise: preview.discountInPaise,
    totalInPaise: preview.totalInPaise,
    stale: false,
  };
}

// The code checkout may send. A stale preview is withheld rather than sent, so
// the shopper is never charged on numbers they were not shown.
export function checkoutCouponCode(
  preview: CouponPreview | null,
  subtotalInPaise: number,
): string | undefined {
  if (preview === null) return undefined;
  return appliedDiscount(preview, subtotalInPaise).stale ? undefined : preview.code;
}

export type CouponCodeValidation =
  | { ok: true; code: string }
  | { ok: false; error: string };

export function validateCouponCode(raw: string): CouponCodeValidation {
  if (!raw.trim()) return { ok: false, error: "Enter a coupon code" };

  const parsed = CouponCodeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Coupon codes are letters, digits and hyphens only",
    };
  }
  return { ok: true, code: parsed.data };
}
