import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { ProductRating as ProductRatingValue, ReviewSummary } from "@geekbase-labs/shared-types";

import { RatingBreakdown } from "./rating-breakdown";
import { RatingStars } from "./rating-stars";

function ratingsLabel(count: number): string {
  return `${count.toLocaleString("en-IN")} ${count === 1 ? "rating" : "ratings"}`;
}

// The one-line verdict under a product's name: the average, the stars, and
// how many shoppers it rests on. A product nobody has rated says nothing
// here rather than "0 ratings".
//
// Tapping it unfolds the star breakdown in place — the phone's answer to the
// website's hover card — so a shopper can see whether a 4.1 is mostly fives
// with a few ones or a solid run of fours without scrolling to the reviews.
export function ProductRating({ summary }: { summary: ReviewSummary | undefined }) {
  const [open, setOpen] = useState(false);

  if (!summary || summary.count === 0 || summary.averageRating === null) return null;

  return (
    <View className="gap-2">
      <Pressable
        testID="product-rating"
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Rated ${summary.averageRating.toFixed(1)} out of 5 from ${ratingsLabel(summary.count)}`}
        accessibilityHint="Shows how many shoppers gave each star"
        onPress={() => setOpen((value) => !value)}
        className="flex-row items-center gap-2 self-start"
      >
        <View className="rounded-md bg-emerald-600 px-1.5 py-0.5">
          <Text className="text-xs font-semibold text-white">
            {summary.averageRating.toFixed(1)} ★
          </Text>
        </View>
        <RatingStars rating={summary.averageRating} className="text-xs" />
        <Text className="text-sm text-neutral-500">{ratingsLabel(summary.count)}</Text>
        <Text className="text-xs text-neutral-400">{open ? "▲" : "▼"}</Text>
      </Pressable>
      {open ? (
        <View
          testID="product-rating-breakdown"
          className="rounded-xl border border-neutral-200 p-3"
        >
          <RatingBreakdown summary={summary} />
        </View>
      ) : null}
    </View>
  );
}

// The compact form for a product card in a list: stars, the average and the
// count. Silent for an unrated product, so a fresh catalogue is not a wall
// of "0 ratings".
export function ProductCardRating({ rating }: { rating: ProductRatingValue }) {
  // A product cached before it carried a rating has none to show.
  if (!rating || rating.count === 0 || rating.averageRating === null) return null;

  return (
    <View
      testID="product-card-rating"
      accessibilityLabel={`Rated ${rating.averageRating.toFixed(1)} out of 5 from ${ratingsLabel(rating.count)}`}
      className="flex-row items-center gap-1"
    >
      <RatingStars rating={rating.averageRating} className="text-xs" />
      <Text className="text-xs text-neutral-500">
        {rating.averageRating.toFixed(1)} ({rating.count.toLocaleString("en-IN")})
      </Text>
    </View>
  );
}
