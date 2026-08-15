import { useState } from "react";
import type {
  CreateReviewInput,
  Review,
  ReviewEligibility,
  ReviewSummary,
} from "@geekbase-labs/shared-types";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { createReview, getReviewEligibility, listReviews } from "./review-api";

export const REVIEWS_KEY = ["reviews"] as const;
export const REVIEWS_PAGE_SIZE = 5;

export function reviewsKey(productId: string, page: number) {
  return [...REVIEWS_KEY, productId, page] as const;
}

// Deliberately outside REVIEWS_KEY: invalidating the public list after a
// submission must not also refetch — and so briefly re-offer — the form.
export function reviewEligibilityKey(productId: string) {
  return ["review-eligibility", productId] as const;
}

// Pages accumulate rather than replace, so tapping "Show more" never takes away
// the reviews already on screen.
export function useProductReviews(productId: string) {
  const [pageCount, setPageCount] = useState(1);

  const results = useQueries({
    queries: Array.from({ length: pageCount }, (_, index) => ({
      queryKey: reviewsKey(productId, index + 1),
      queryFn: () =>
        listReviews(productId, { page: index + 1, pageSize: REVIEWS_PAGE_SIZE }),
      enabled: Boolean(productId),
    })),
  });

  const first = results[0];
  const loaded = results.filter((result) => result.data !== undefined);
  const reviews: Review[] = loaded.flatMap((result) => result.data!.items);
  const summary: ReviewSummary | undefined = first?.data?.summary;

  return {
    reviews,
    summary,
    isLoading: Boolean(first?.isLoading),
    isLoadingMore: results.some((result) => result.isLoading) && loaded.length > 0,
    error: first?.error ?? null,
    hasMore: pageCount < (first?.data?.totalPages ?? 0),
    loadMore: () => setPageCount((count) => count + 1),
  };
}

export function useReviewEligibility(productId: string, enabled: boolean) {
  const query = useQuery({
    queryKey: reviewEligibilityKey(productId),
    queryFn: () => getReviewEligibility(productId),
    enabled,
  });

  return { eligibility: query.data, isLoading: query.isLoading };
}

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: (review) => {
      queryClient.setQueryData<ReviewEligibility>(
        reviewEligibilityKey(productId),
        { canReview: false, review },
      );
      // The average is the server's to compute — recomputing it here would let
      // the app disagree with the website about the same product.
      void queryClient.invalidateQueries({ queryKey: REVIEWS_KEY });
    },
  });
}
