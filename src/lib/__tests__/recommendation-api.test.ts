import { apiFetch } from "../api-client";
import { fetchRecommendations } from "../recommendation-api";

jest.mock("../api-client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";

const MOCK_PRODUCT = {
  id: "33333333-3333-4333-8333-333333333333",
  categoryId: "44444444-4444-4444-8444-444444444444",
  name: "LED Bulbs",
  slug: "led-bulbs",
  description: "",
  priceInPaise: 79900,
  currency: "INR" as const,
  isActive: true,
  brand: "Test",
  gtin: null,
  mpn: null,
  condition: "new" as const,
  seoTitle: null,
  seoDescription: null,
  ogImageUrl: null,
  ownerUserId: null,
  approvalStatus: "approved" as const,
  rejectionReason: null,
  submittedAt: null,
  reviewedAt: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  variants: [],
  images: [],
};

describe("recommendation-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("asks the recommendations endpoint for the product, with the default limit", async () => {
    mockApiFetch.mockResolvedValue({ items: [MOCK_PRODUCT] });

    const items = await fetchRecommendations(PRODUCT_ID);

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/recommendations/${PRODUCT_ID}?limit=4`,
    );
    expect(items).toEqual([MOCK_PRODUCT]);
  });

  it("clamps the limit before asking, so the endpoint never refuses the request", async () => {
    mockApiFetch.mockResolvedValue({ items: [] });

    await fetchRecommendations(PRODUCT_ID, 99);

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/recommendations/${PRODUCT_ID}?limit=12`,
    );
  });

  it("encodes the product id it was handed", async () => {
    mockApiFetch.mockResolvedValue({ items: [] });

    await fetchRecommendations("a b/c");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/recommendations/a%20b%2Fc?limit=4",
    );
  });
});
