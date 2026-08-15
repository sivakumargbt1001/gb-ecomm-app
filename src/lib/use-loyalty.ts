import { useQuery } from "@tanstack/react-query";

import { getLoyaltyBalance } from "./loyalty-api";

export const LOYALTY_BALANCE_KEY = ["loyalty", "balance"] as const;

export function useLoyaltyBalance() {
  const query = useQuery({
    queryKey: LOYALTY_BALANCE_KEY,
    queryFn: getLoyaltyBalance,
    // A signed-out shopper has no balance to read, and a failed read must not
    // retry its way through checkout.
    retry: false,
  });

  return { balance: query.data, isLoading: query.isLoading };
}
