import { apiFetch } from "../api-client";
import { forgotPassword, loginWithEmail, requestOtp, signupWithEmail, verifyOtp } from "../auth-api";

jest.mock("../api-client", () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe("auth-api", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  describe("signupWithEmail", () => {
    it("posts to /api/auth/signup and returns the created user", async () => {
      const user = { id: "1" } as never;
      mockedApiFetch.mockResolvedValue({ user });

      const result = await signupWithEmail({ email: "a@b.com", password: "longenough1" });

      expect(mockedApiFetch).toHaveBeenCalledWith("/api/auth/signup", {
        method: "POST",
        body: { email: "a@b.com", password: "longenough1" },
      });
      expect(result).toEqual({ user });
    });
  });

  describe("loginWithEmail", () => {
    it("posts to /api/auth/login and splits the response into user + tokens", async () => {
      const user = { id: "1" } as never;
      mockedApiFetch.mockResolvedValue({
        user,
        accessToken: "access-1",
        refreshToken: "refresh-1",
      });

      const result = await loginWithEmail({ email: "a@b.com", password: "longenough1" });

      expect(mockedApiFetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        body: { email: "a@b.com", password: "longenough1" },
      });
      expect(result).toEqual({
        user,
        tokens: { accessToken: "access-1", refreshToken: "refresh-1" },
      });
    });
  });

  describe("requestOtp", () => {
    it("posts to /api/auth/otp/request", async () => {
      mockedApiFetch.mockResolvedValue(undefined);

      await requestOtp({ phone: "+15551234567", channel: "sms" });

      expect(mockedApiFetch).toHaveBeenCalledWith("/api/auth/otp/request", {
        method: "POST",
        body: { phone: "+15551234567", channel: "sms" },
      });
    });
  });

  describe("verifyOtp", () => {
    it("posts to /api/auth/otp/verify and splits the response into user + tokens", async () => {
      const user = { id: "1" } as never;
      mockedApiFetch.mockResolvedValue({
        user,
        accessToken: "access-2",
        refreshToken: "refresh-2",
      });

      const result = await verifyOtp({ phone: "+15551234567", code: "123456" });

      expect(mockedApiFetch).toHaveBeenCalledWith("/api/auth/otp/verify", {
        method: "POST",
        body: { phone: "+15551234567", code: "123456" },
      });
      expect(result).toEqual({
        user,
        tokens: { accessToken: "access-2", refreshToken: "refresh-2" },
      });
    });
  });

  describe("forgotPassword", () => {
    it("posts to /api/auth/forgot-password", async () => {
      mockedApiFetch.mockResolvedValue(undefined);

      await forgotPassword({ email: "a@b.com" });

      expect(mockedApiFetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "a@b.com" },
      });
    });
  });
});
