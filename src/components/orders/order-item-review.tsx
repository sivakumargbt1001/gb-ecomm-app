import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useSiteTheme } from "../../lib/site-theme-context";
import { useReviewEligibility } from "../../lib/use-reviews";
import { RatingStars } from "../reviews/rating-stars";
import { ReviewForm } from "../reviews/review-form";

// The review entry point on a delivered order: the shopper is already looking
// at the thing they bought, so the form opens right here rather than sending
// them off to find the product. The server applies the same eligibility rules
// as the product screen — buyers of a delivered order, once per product.
export function OrderItemReview({ productId }: { productId: string }) {
  const theme = useSiteTheme();
  const { eligibility } = useReviewEligibility(productId, true);
  const [open, setOpen] = useState(false);

  if (!eligibility) return null;

  if (eligibility.review) {
    return (
      <View className="mt-2 flex-row items-center gap-2" testID="order-item-reviewed">
        <RatingStars rating={eligibility.review.rating} />
        <Text className="text-xs text-neutral-500">You reviewed this</Text>
      </View>
    );
  }

  if (!eligibility.canReview) return null;

  if (!open) {
    return (
      <Pressable
        testID="order-item-write-review"
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        hitSlop={8}
        className="mt-2 self-start"
      >
        <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>
          Write a review
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="mt-3">
      <ReviewForm productId={productId} />
    </View>
  );
}
