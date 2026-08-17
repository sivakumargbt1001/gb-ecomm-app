import type { ReferralSummary } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

// Referrals belong to a signed-in shopper, so these ride the auth token the api
// client already carries — no guest identity is involved.
export async function getReferralSummary(): Promise<ReferralSummary> {
  const data = await apiFetch<{ summary: ReferralSummary }>("/api/referrals/me");
  return data.summary;
}

// The backend treats this as "give me my link": the first call mints the code,
// every call after it returns the same one.
export async function createReferralCode(): Promise<ReferralSummary> {
  const data = await apiFetch<{ summary: ReferralSummary }>(
    "/api/referrals/me/code",
    { method: "POST" },
  );
  return data.summary;
}
