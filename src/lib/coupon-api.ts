import type { CouponPreview } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";
import { getGuestId } from "./guest-id";

// Priced against the caller's own cart, so it carries the guest id the same way
// every other cart request does.
export async function applyCoupon(code: string): Promise<CouponPreview> {
  const guestId = await getGuestId();
  const data = await apiFetch<{ preview: CouponPreview }>("/api/coupons/apply", {
    method: "POST",
    body: { code },
    headers: { "X-Guest-Id": guestId },
  });
  return data.preview;
}
