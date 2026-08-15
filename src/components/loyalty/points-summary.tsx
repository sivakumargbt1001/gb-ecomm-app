import { Text, View } from "react-native";

import { formatPaise } from "../../lib/catalog-api";
import { redeemedValueInPaise } from "../../lib/loyalty";
import { useLoyaltyBalance } from "../../lib/use-loyalty";
import { useSiteTheme } from "../../lib/site-theme-context";

// Sits above the order list: this app has no account screen, and a balance is
// only meaningful next to the orders that earned it.
export function PointsSummary() {
  const { balance } = useLoyaltyBalance();
  const theme = useSiteTheme();

  // Nothing to say for a guest, a failed read, or a store running the
  // programme switched off.
  if (!balance) return null;
  if (balance.earnRatePercent === 0 && balance.maxRedemptionPercent === 0) {
    return null;
  }

  return (
    <View
      testID="points-summary"
      className="gap-1 border-b border-neutral-100 px-4 py-4"
    >
      <Text className="text-sm text-neutral-500">Loyalty points</Text>
      <Text
        testID="points-balance"
        className="text-2xl font-semibold"
        style={{ color: theme.colors.primary }}
      >
        {balance.balance}
      </Text>
      <Text testID="points-value" className="text-xs text-neutral-500">
        Worth {formatPaise(redeemedValueInPaise(balance.balance))} at checkout — you
        earn {balance.earnRatePercent}% back on every delivered order.
      </Text>
    </View>
  );
}
