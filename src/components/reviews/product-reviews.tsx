import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import type { Review } from "@geekbase-labs/shared-types";

import { RatingStars } from "./rating-stars";
import { ReviewForm } from "./review-form";
import { useAuthStore } from "../../lib/auth-store";
import { formatAverageRating, reviewInvitation } from "../../lib/reviews";
import { useProductReviews, useReviewEligibility } from "../../lib/use-reviews";

function formatReviewDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReviewRow({
  review,
  testID,
  label,
}: {
  review: Review;
  testID: string;
  label?: string;
}) {
  return (
    <View testID={testID} className="gap-1 border-t border-neutral-100 py-3">
      <View className="flex-row items-center gap-2">
        <RatingStars rating={review.rating} />
        <Text className="text-sm text-neutral-500">
          {review.rating} out of 5 · {formatReviewDate(review.createdAt)}
        </Text>
        {label ? (
          <Text className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
            {label}
          </Text>
        ) : null}
      </View>
      {review.text ? (
        <Text className="text-neutral-700">{review.text}</Text>
      ) : null}
    </View>
  );
}

function Invitation({ productId }: { productId: string }) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const { eligibility } = useReviewEligibility(productId, Boolean(user));

  switch (reviewInvitation({ status, eligibility })) {
    case "waiting":
      return null;
    case "sign-in":
      return (
        <View testID="review-sign-in" className="gap-2">
          <Text className="text-sm text-neutral-500">
            Bought this? Sign in to share how it went.
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable className="self-start rounded-lg border border-neutral-300 px-4 py-2">
              <Text className="text-sm font-medium text-neutral-800">Log In</Text>
            </Pressable>
          </Link>
        </View>
      );
    case "not-eligible":
      return (
        <Text testID="review-not-eligible" className="text-sm text-neutral-500">
          Reviews come from shoppers who bought this product and had it delivered.
        </Text>
      );
    case "own-review":
      return (
        <ReviewRow
          review={eligibility!.review!}
          testID="review-mine"
          label="Your review"
        />
      );
    case "form":
      return <ReviewForm productId={productId} />;
  }
}

export function ProductReviews({ productId }: { productId: string }) {
  const { reviews, summary, isLoading, error, hasMore, loadMore, isLoadingMore } =
    useProductReviews(productId);

  return (
    <View className="gap-4 border-t border-neutral-200 pt-6" testID="product-reviews">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-neutral-900">Reviews</Text>
        {summary && summary.count > 0 && summary.averageRating !== null ? (
          <View testID="review-summary" className="flex-row items-center gap-2">
            <RatingStars rating={summary.averageRating} />
            <Text className="font-medium text-neutral-900">
              {formatAverageRating(summary.averageRating)}
            </Text>
            <Text className="text-sm text-neutral-500">
              ({summary.count} review{summary.count === 1 ? "" : "s"})
            </Text>
          </View>
        ) : null}
      </View>

      <Invitation productId={productId} />

      {isLoading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text testID="reviews-error" className="text-sm text-red-600">
          {error.message}
        </Text>
      ) : reviews.length === 0 ? (
        <Text testID="reviews-empty" className="text-sm text-neutral-500">
          No reviews yet — the first one will show up here.
        </Text>
      ) : (
        <View>
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} testID="review-row" />
          ))}
          {hasMore ? (
            <Pressable
              testID="show-more-reviews"
              onPress={loadMore}
              disabled={isLoadingMore}
              className="mt-3 items-center rounded-lg border border-neutral-300 py-3"
            >
              <Text className="text-sm font-medium text-neutral-800">
                {isLoadingMore ? "Loading..." : "Show more reviews"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}
