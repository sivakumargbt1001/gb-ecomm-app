import type {
  CreateReviewInput,
  Review,
  ReviewEligibility,
  ReviewList,
} from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

export function listReviews(
  productId: string,
  query: { page: number; pageSize: number },
): Promise<ReviewList> {
  return apiFetch<ReviewList>(
    `/api/reviews/${encodeURIComponent(productId)}?page=${query.page}&pageSize=${query.pageSize}`,
  );
}

// Whether this shopper may review is the server's answer to give: it depends on
// their order history, which the public list deliberately says nothing about.
export function getReviewEligibility(
  productId: string,
): Promise<ReviewEligibility> {
  return apiFetch<ReviewEligibility>(
    `/api/reviews/${encodeURIComponent(productId)}/me`,
  );
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const data = await apiFetch<{ review: Review }>("/api/reviews", {
    method: "POST",
    body: input,
  });
  return data.review;
}
