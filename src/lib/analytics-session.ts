import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const ANALYTICS_SESSION_KEY = "gb_analytics_session";

let cachedSessionId: string | null = null;

// A stable per-install id tagging this shopper's funnel events (sent as the
// X-Analytics-Session header, and as sessionId on every tracked event). Kept
// separate from the guest cart id, which is cleared when a guest's cart merges
// on login — the analytics session must outlive that so pre-login events stay
// attributable to the same journey.
export async function getAnalyticsSessionId(): Promise<string> {
  if (cachedSessionId) return cachedSessionId;

  const stored = await SecureStore.getItemAsync(ANALYTICS_SESSION_KEY);
  if (stored) {
    cachedSessionId = stored;
    return stored;
  }

  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(ANALYTICS_SESSION_KEY, id);
  cachedSessionId = id;
  return id;
}

export function _resetCacheForTesting(): void {
  cachedSessionId = null;
}
