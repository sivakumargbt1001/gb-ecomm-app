import { apiFetch } from "../api-client";
import { createReferralCode, getReferralSummary } from "../referral-api";

jest.mock("../api-client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const SUMMARY = {
  code: "REF-A1B2C3D4",
  shareUrl: "https://shop.example/signup?ref=REF-A1B2C3D4",
  invited: 2,
  rewarded: 1,
  referrerRewardPoints: 100,
  enabled: true,
};

describe("referral-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getReferralSummary unwraps the summary", async () => {
    mockApiFetch.mockResolvedValue({ summary: SUMMARY });

    expect(await getReferralSummary()).toEqual(SUMMARY);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/referrals/me");
  });

  it("createReferralCode posts and unwraps the same shape", async () => {
    mockApiFetch.mockResolvedValue({ summary: SUMMARY });

    expect(await createReferralCode()).toEqual(SUMMARY);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/referrals/me/code", {
      method: "POST",
    });
  });

  // A guest has no referrals to read, which is an ordinary state on an account
  // screen rather than an error to shout about.
  it("lets a refusal reach the caller", async () => {
    mockApiFetch.mockRejectedValue(new Error("API request failed: 401"));

    await expect(getReferralSummary()).rejects.toThrow("401");
  });
});
