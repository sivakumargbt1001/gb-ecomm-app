import { apiFetch } from "../api-client";
import { getLoyaltyBalance } from "../loyalty-api";

jest.mock("../api-client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const BALANCE = { balance: 100, earnRatePercent: 10, maxRedemptionPercent: 5 };

describe("loyalty-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getLoyaltyBalance unwraps the balance", async () => {
    mockApiFetch.mockResolvedValue({ balance: BALANCE });

    const balance = await getLoyaltyBalance();

    expect(mockApiFetch).toHaveBeenCalledWith("/api/loyalty/me");
    expect(balance).toEqual(BALANCE);
  });

  // A signed-out shopper has no balance, and that is an ordinary state on a
  // checkout screen rather than an error to show.
  it("lets a refusal reach the caller", async () => {
    mockApiFetch.mockRejectedValue(new Error("API request failed: 401"));

    await expect(getLoyaltyBalance()).rejects.toThrow("401");
  });
});
