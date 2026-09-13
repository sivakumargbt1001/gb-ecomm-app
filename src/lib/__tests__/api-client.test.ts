import { apiFetch, setAuthToken } from "../api-client";

describe("apiFetch", () => {
  afterEach(() => {
    setAuthToken(null);
    jest.restoreAllMocks();
  });

  it("attaches the auth token when set", async () => {
    setAuthToken("test-token");
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await apiFetch("/health");

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((requestInit.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
  });

  it("omits the Authorization header when no token is set", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await apiFetch("/health");

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((requestInit.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("resolves without parsing a body for a 204 No Content response", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error("json() should not be called for a 204 response");
      },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiFetch("/api/auth/logout")).resolves.toBeUndefined();
  });

  it("throws when the response is not ok", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiFetch("/health")).rejects.toThrow("API request failed: 500");
  });
});

jest.mock("expo-secure-store");

describe("apiFetch session refresh", () => {
  const SecureStore = jest.requireMock("expo-secure-store") as {
    getItemAsync: jest.Mock;
    setItemAsync: jest.Mock;
    deleteItemAsync: jest.Mock;
  };

  function response(status: number, body: unknown = {}) {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      json: async () => body,
    };
  }

  beforeEach(() => {
    setAuthToken("stale-token");
    SecureStore.getItemAsync.mockImplementation(async (key: string) =>
      key === "auth_access_token" ? "stale-token" : "refresh-1",
    );
    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    setAuthToken(null);
    jest.restoreAllMocks();
    SecureStore.getItemAsync.mockReset();
    SecureStore.setItemAsync.mockReset();
    SecureStore.deleteItemAsync.mockReset();
  });

  it("refreshes once and replays a request that got a 401", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(200, { accessToken: "fresh", refreshToken: "refresh-2" }))
      .mockResolvedValueOnce(response(201, { item: { productId: "p1" } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiFetch("/api/wishlist", { method: "POST", body: { productId: "p1" } }))
      .resolves.toEqual({ item: { productId: "p1" } });

    const paths = fetchMock.mock.calls.map(([url]) => new URL(url as string).pathname);
    expect(paths).toEqual(["/api/wishlist", "/api/auth/refresh", "/api/wishlist"]);

    const [, refreshInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(refreshInit.body as string)).toEqual({ refreshToken: "refresh-1" });

    const [, replayInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect((replayInit.headers as Record<string, string>).Authorization).toBe("Bearer fresh");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("auth_refresh_token", "refresh-2");
  });

  it("clears the stored session when the refresh token is revoked", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(401));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiFetch("/api/wishlist")).rejects.toThrow("API request failed: 401");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_refresh_token");
  });

  it("never refreshes on behalf of an auth route", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(response(401));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiFetch("/api/auth/me")).rejects.toThrow("API request failed: 401");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
