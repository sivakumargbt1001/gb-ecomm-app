import { Text, View } from "react-native";
import {
  RATING_BREAKDOWN_ORDER,
  ratingShare,
  type ReviewSummary,
} from "@geekbase-labs/shared-types";

// Five bars, 5★ first: how the product's reviews split by star. Each bar's
// width is that star's share of every review, so the bars read against each
// other rather than against some fixed scale. Renders nothing for a product
// nobody has reviewed — five empty bars say less than no bars.
export function RatingBreakdown({ summary }: { summary: ReviewSummary }) {
  if (summary.count === 0) return null;

  return (
    <View testID="rating-breakdown" accessibilityLabel="Ratings by star" className="gap-1.5">
      {RATING_BREAKDOWN_ORDER.map((star) => {
        const count = summary.breakdown[star];
        const share = ratingShare(summary, star);
        return (
          <View
            key={star}
            testID={`rating-breakdown-${star}`}
            accessibilityLabel={`${star} star${star === 1 ? "" : "s"}: ${count}`}
            className="flex-row items-center gap-2"
          >
            <Text className="w-10 text-sm text-neutral-500">{star} ★</Text>
            <View className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
              <View
                className="h-full rounded-full bg-neutral-900"
                style={{ width: `${share}%` }}
              />
            </View>
            <Text className="w-10 text-right text-sm text-neutral-500">{count}</Text>
          </View>
        );
      })}
    </View>
  );
}
