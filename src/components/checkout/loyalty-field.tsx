import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { formatPaise } from "../../lib/catalog-api";
import {
  redeemedValueInPaise,
  usablePoints,
  validateRedeemDraft,
} from "../../lib/loyalty";
import { useLoyaltyBalance } from "../../lib/use-loyalty";

export function LoyaltyField({
  subtotalInPaise,
  payableInPaise,
  points,
  onPointsChange,
}: {
  subtotalInPaise: number;
  payableInPaise: number;
  points: number;
  onPointsChange: (points: number) => void;
}) {
  const { balance } = useLoyaltyBalance();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  // A guest, a failed read or an empty balance all mean there is nothing to
  // offer — an empty points control is only noise in a checkout.
  if (!balance || balance.balance <= 0) return null;

  const max = usablePoints({
    balance: balance.balance,
    maxRedemptionPercent: balance.maxRedemptionPercent,
    subtotalInPaise,
    payableInPaise,
  });

  function submit() {
    const validation = validateRedeemDraft(draft, max);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError(null);
    onPointsChange(validation.points);
  }

  function remove() {
    setError(null);
    setDraft("");
    onPointsChange(0);
  }

  return (
    <View
      testID="loyalty-field"
      className="gap-2 rounded-lg border border-neutral-200 p-4"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-neutral-800">Loyalty points</Text>
        <Text testID="loyalty-balance" className="text-sm text-neutral-500">
          {balance.balance} available
        </Text>
      </View>

      {points > 0 ? (
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-neutral-600">{points} points</Text>
            <Text testID="loyalty-discount" className="text-sm text-neutral-900">
              −{formatPaise(redeemedValueInPaise(points))}
            </Text>
          </View>
          <Pressable testID="loyalty-remove" onPress={remove} hitSlop={6}>
            <Text className="text-sm font-semibold text-neutral-800 underline">
              Remove
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View className="flex-row gap-2">
            <TextInput
              testID="loyalty-points"
              accessibilityLabel="Points to use"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={submit}
              placeholder={String(max)}
              keyboardType="number-pad"
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-3"
            />
            <Pressable
              testID="loyalty-apply"
              onPress={submit}
              disabled={max <= 0}
              className="items-center justify-center rounded-lg border border-neutral-300 px-5 disabled:opacity-50"
            >
              <Text className="text-sm font-semibold text-neutral-800">Use</Text>
            </Pressable>
          </View>
          <Text testID="loyalty-usable" className="text-xs text-neutral-500">
            Up to {max} points ({formatPaise(redeemedValueInPaise(max))}) on this order
          </Text>
        </>
      )}

      {error ? (
        <Text testID="loyalty-error" className="text-xs text-red-600">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
