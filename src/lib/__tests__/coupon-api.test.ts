import { apiFetch } from "../api-client";
import { applyCoupon } from "../coupon-api";
import { getGuestId } from "../guest-id";

jest.mock("../api-client");
jest.mock("../guest-id");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockGetGuestId = getGuestId as jest.MockedFunction<typeof getGuestId>;

const GUEST_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const PREVIEW = {
  code: "DIWALI20",
  subtotalInPaise: 100000,
  discountInPaise: 20000,
  totalInPaise: 80000,
};

describe("coupon-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGuestId.mockResolvedValue(GUEST_ID);
  });

  it("applyCoupon prices the code against the caller's own cart", async () => {
    mockApiFetch.mockResolvedValue({ preview: PREVIEW });

    const preview = await applyCoupon("DIWALI20");

    // The guest header is what ties the preview to this device's cart — without
    // it the server has no cart to price against.
    expect(mockApiFetch).toHaveBeenCalledWith("/api/coupons/apply", {
      method: "POST",
      body: { code: "DIWALI20" },
      headers: { "X-Guest-Id": GUEST_ID },
    });
    expect(preview).toEqual(PREVIEW);
  });

  it("lets the server's refusal reach the caller", async () => {
    mockApiFetch.mockRejectedValue(new Error("This coupon has expired"));

    await expect(applyCoupon("GONE")).rejects.toThrow("This coupon has expired");
  });
});
