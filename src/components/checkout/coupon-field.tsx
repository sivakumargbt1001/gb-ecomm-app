import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import type { CouponPreview } from "@geekbase-labs/shared-types";

import { formatPaise } from "../../lib/catalog-api";
import { applyCoupon } from "../../lib/coupon-api";
import { appliedDiscount, validateCouponCode } from "../../lib/coupon";
import { useSiteTheme } from "../../lib/site-theme-context";

export function CouponField({
  subtotalInPaise,
  preview,
  onPreviewChange,
}: {
  subtotalInPaise: number;
  // The preview belongs to the checkout screen, which is what sends the code
  // and shows the total — this field only edits it.
  preview: CouponPreview | null;
  onPreviewChange: (preview: CouponPreview | null) => void;
}) {
  const theme = useSiteTheme();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const applied = appliedDiscount(preview, subtotalInPaise);

  async function submit() {
    const validation = validateCouponCode(code);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setError(null);
    setIsApplying(true);
    try {
      onPreviewChange(await applyCoupon(validation.code));
    } catch (err) {
      onPreviewChange(null);
      setError(err instanceof Error ? err.message : "Could not apply that code");
    } finally {
      setIsApplying(false);
    }
  }

  function remove() {
    onPreviewChange(null);
    setError(null);
    setCode("");
  }

  return (
    <View
      testID="coupon-field"
      className="gap-2 rounded-lg border border-neutral-200 p-4"
    >
      <Text className="text-sm font-medium text-neutral-800">Coupon code</Text>

      <View className="flex-row gap-2">
        <TextInput
          testID="coupon-code"
          accessibilityLabel="Coupon code"
          value={code}
          onChangeText={setCode}
          onSubmitEditing={submit}
          placeholder="DIWALI20"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={preview === null}
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-3"
        />
        {preview === null ? (
          <Pressable
            testID="coupon-apply"
            onPress={submit}
            disabled={isApplying}
            className="items-center justify-center rounded-lg border border-neutral-300 px-5 disabled:opacity-50"
          >
            {isApplying ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-sm font-semibold text-neutral-800">Apply</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            testID="coupon-remove"
            onPress={remove}
            className="items-center justify-center rounded-lg border border-neutral-300 px-5"
          >
            <Text className="text-sm font-semibold text-neutral-800">Remove</Text>
          </Pressable>
        )}
      </View>

      {error ? (
        <Text testID="coupon-error" className="text-xs text-red-600">
          {error}
        </Text>
      ) : null}

      {applied.stale ? (
        <Text testID="coupon-stale" className="text-xs text-red-600">
          Your cart changed — apply the code again to reprice it.
        </Text>
      ) : null}

      {preview !== null && !applied.stale ? (
        <View className="flex-row justify-between">
          <Text className="text-sm text-neutral-600">{preview.code}</Text>
          <Text
            testID="coupon-discount"
            className="text-sm font-medium"
            style={{ color: theme.colors.primary }}
          >
            −{formatPaise(applied.discountInPaise)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
