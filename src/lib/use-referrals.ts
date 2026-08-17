import type { ReferralSummary } from "@geekbase-labs/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createReferralCode, getReferralSummary } from "./referral-api";

export const REFERRAL_SUMMARY_KEY = ["referrals", "summary"] as const;

export function useReferralSummary() {
  const query = useQuery({
    queryKey: REFERRAL_SUMMARY_KEY,
    queryFn: getReferralSummary,
    // A signed-out shopper has no referrals to read, and a failed read must not
    // retry its way through the account screen.
    retry: false,
  });

  return { summary: query.data, isLoading: query.isLoading };
}

export function useCreateReferralCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReferralCode,
    // The response is the whole summary, so it goes straight into the cache:
    // refetching to learn what we were just told would blank the link the
    // shopper has already been handed.
    onSuccess: (summary: ReferralSummary) => {
      queryClient.setQueryData(REFERRAL_SUMMARY_KEY, summary);
    },
  });
}
