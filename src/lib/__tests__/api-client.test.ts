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
