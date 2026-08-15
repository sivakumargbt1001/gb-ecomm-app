import type { LoyaltyBalance } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

// Points belong to a signed-in shopper, so this rides the auth token the api
// client already carries — no guest identity is involved.
export async function getLoyaltyBalance(): Promise<LoyaltyBalance> {
  const data = await apiFetch<{ balance: LoyaltyBalance }>("/api/loyalty/me");
  return data.balance;
}
