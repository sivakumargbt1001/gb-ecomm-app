import { Text, View } from "react-native";
import type { ReviewSummary } from "@geekbase-labs/shared-types";

import { RatingStars } from "./rating-stars";

// The one-line verdict under a product's name: the average, the stars, and
// how many shoppers it rests on. A product nobody has rated says nothing
// here rather than "0 ratings".
export function ProductRating({ summary }: { summary: ReviewSummary | undefined }) {
  if (!summary || summary.count === 0 || summary.averageRating === null) return null;

  return (
    <View testID="product-rating" className="flex-row items-center gap-2">
      <View className="rounded-md bg-emerald-600 px-1.5 py-0.5">
        <Text className="text-xs font-semibold text-white">
          {summary.averageRating.toFixed(1)} ★
        </Text>
      </View>
      <RatingStars rating={summary.averageRating} className="text-xs" />
      <Text className="text-sm text-neutral-500">
        {summary.count.toLocaleString("en-IN")} {summary.count === 1 ? "rating" : "ratings"}
      </Text>
    </View>
  );
}
