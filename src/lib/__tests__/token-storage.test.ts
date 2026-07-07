import * as SecureStore from "expo-secure-store";

import { clearTokens, loadTokens, saveTokens } from "../token-storage";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("token-storage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("saveTokens", () => {
    it("persists the access and refresh tokens under their own keys", async () => {
      await saveTokens({ accessToken: "access-123", refreshToken: "refresh-456" });

      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        "auth_access_token",
        "access-123",
      );
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        "auth_refresh_token",
        "refresh-456",
      );
    });
  });

  describe("loadTokens", () => {
    it("returns both tokens when present", async () => {
      mockedSecureStore.getItemAsync.mockImplementation(async (key: string) => {
        if (key === "auth_access_token") return "access-123";
        if (key === "auth_refresh_token") return "refresh-456";
        return null;
      });

      const tokens = await loadTokens();

      expect(tokens).toEqual({ accessToken: "access-123", refreshToken: "refresh-456" });
    });

    it("returns null when either token is missing", async () => {
      mockedSecureStore.getItemAsync.mockImplementation(async (key: string) => {
        if (key === "auth_access_token") return "access-123";
        return null;
      });

      const tokens = await loadTokens();

      expect(tokens).toBeNull();
    });

    it("returns null when nothing is stored", async () => {
      mockedSecureStore.getItemAsync.mockResolvedValue(null);

      const tokens = await loadTokens();

      expect(tokens).toBeNull();
    });
  });

  describe("clearTokens", () => {
    it("deletes both stored tokens", async () => {
      await clearTokens();

      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_access_token");
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_refresh_token");
    });
  });
});
