import { apiFetch } from "../api-client";
import {
  createReview,
  getReviewEligibility,
  listReviews,
} from "../review-api";

jest.mock("../api-client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";

const MOCK_REVIEW = {
  id: "44444444-4444-4444-8444-444444444444",
  productId: PRODUCT_ID,
  rating: 4,
  text: "Solid.",
  createdAt: "2026-08-02T10:00:00.000Z",
};

const MOCK_PAGE = {
  items: [MOCK_REVIEW],
  page: 1,
  pageSize: 5,
  total: 1,
  totalPages: 1,
  summary: { averageRating: 4, count: 1 },
};

describe("review-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listReviews asks for the page it was given", async () => {
    mockApiFetch.mockResolvedValue(MOCK_PAGE);

    const page = await listReviews(PRODUCT_ID, { page: 2, pageSize: 5 });

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/reviews/${PRODUCT_ID}?page=2&pageSize=5`,
    );
    expect(page).toEqual(MOCK_PAGE);
  });

  it("getReviewEligibility asks the server, not the list", async () => {
    mockApiFetch.mockResolvedValue({ canReview: true, review: null });

    const eligibility = await getReviewEligibility(PRODUCT_ID);

    expect(mockApiFetch).toHaveBeenCalledWith(`/api/reviews/${PRODUCT_ID}/me`);
    expect(eligibility).toEqual({ canReview: true, review: null });
  });

  it("createReview POSTs the review and unwraps it", async () => {
    mockApiFetch.mockResolvedValue({ review: MOCK_REVIEW });

    const review = await createReview({
      productId: PRODUCT_ID,
      rating: 4,
      text: "Solid.",
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/reviews", {
      method: "POST",
      body: { productId: PRODUCT_ID, rating: 4, text: "Solid." },
    });
    expect(review).toEqual(MOCK_REVIEW);
  });

  it("encodes the product id into the path", async () => {
    mockApiFetch.mockResolvedValue({ canReview: false, review: null });

    await getReviewEligibility("weird id/../x");

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/reviews/${encodeURIComponent("weird id/../x")}/me`,
    );
  });

  it("propagates API failures instead of swallowing them", async () => {
    mockApiFetch.mockRejectedValue(
      new Error("API request failed: 409 Conflict"),
    );

    await expect(
      createReview({ productId: PRODUCT_ID, rating: 1, text: "" }),
    ).rejects.toThrow("409");
  });
});
