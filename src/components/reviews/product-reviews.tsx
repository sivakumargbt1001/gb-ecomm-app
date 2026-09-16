import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import {
  isReviewEdited,
  reviewAge,
  reviewerDisplayName,
  type Review,
} from "@geekbase-labs/shared-types";

import { RatingBreakdown } from "./rating-breakdown";
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

// Everyone else sees how fresh a review is, not the day it was written or
// whether it was touched since; the exact dates are the author's own view.
function ReviewRow({
  review,
  testID,
  label,
  onEdit,
  mine = false,
}: {
  review: Review;
  testID: string;
  label?: string;
  onEdit?: () => void;
  mine?: boolean;
}) {
  return (
    <View testID={testID} className="gap-1 border-t border-neutral-100 py-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <RatingStars rating={review.rating} />
        <Text className="text-sm text-neutral-500">{review.rating} out of 5</Text>
        {label ? (
          <Text className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
            {label}
          </Text>
        ) : null}
        {onEdit ? (
          <Pressable testID="edit-review" onPress={onEdit} hitSlop={8} className="ml-auto">
            <Text className="text-sm font-medium text-neutral-800 underline">Edit</Text>
          </Pressable>
        ) : null}
      </View>
      <Text className="text-sm text-neutral-500">
        <Text testID="review-author" className="font-medium text-neutral-800">
          {reviewerDisplayName(review)}
        </Text>
        {" · "}
        {mine ? (
          <>
            {formatReviewDate(review.createdAt)}
            {isReviewEdited(review) ? (
              <Text testID="review-edited"> · Edited {formatReviewDate(review.updatedAt)}</Text>
            ) : null}
          </>
        ) : (
          reviewAge(review.createdAt)
        )}
      </Text>
      {review.text ? (
        <Text className="text-neutral-700">{review.text}</Text>
      ) : null}
    </View>
  );
}

// The shopper's own review, with the way back into the form to change it.
function OwnReview({ productId, review }: { productId: string; review: Review }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <ReviewForm
        productId={productId}
        existing={review}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <View className="rounded-xl border border-neutral-200 px-4">
      <ReviewRow
        review={review}
        testID="review-mine"
        label="Your review"
        mine
        onEdit={() => setEditing(true)}
      />
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
      return <OwnReview productId={productId} review={eligibility!.review!} />;
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

      {summary && summary.count > 0 ? (
        <View className="gap-2 rounded-xl border border-neutral-200 p-4">
          <Text className="text-sm font-medium text-neutral-900">Rating snapshot</Text>
          <RatingBreakdown summary={summary} />
        </View>
      ) : null}

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
