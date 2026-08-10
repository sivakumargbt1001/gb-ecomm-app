import type { AnalyticsEventName } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";
import { getAnalyticsSessionId } from "./analytics-session";

export type TrackEventPayload = {
  productId?: string;
  orderId?: string;
  valueInPaise?: number;
};

// Fire-and-forget by contract: a failed measurement call must never surface to
// the shopper or break the flow it is measuring, so every error is swallowed.
export async function trackEvent(
  name: AnalyticsEventName,
  payload: TrackEventPayload = {},
): Promise<void> {
  try {
    const sessionId = await getAnalyticsSessionId();
    await apiFetch("/api/analytics/events", {
      method: "POST",
      body: { name, sessionId, ...payload },
    });
  } catch {
    // ignore
  }
}
