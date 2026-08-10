import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import {
  getAnalyticsSessionId,
  _resetCacheForTesting,
} from "../analytics-session";
import { trackEvent } from "../analytics";
import { loginWithEmail } from "../auth-api";

jest.mock("expo-crypto");
jest.mock("expo-secure-store");

const mockRandomUUID = Crypto.randomUUID as jest.MockedFunction<
  typeof Crypto.randomUUID
>;
const mockGetItem = SecureStore.getItemAsync as jest.MockedFunction<
  typeof SecureStore.getItemAsync
>;
const mockSetItem = SecureStore.setItemAsync as jest.MockedFunction<
  typeof SecureStore.setItemAsync
>;

const SESSION_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

describe("analytics-session", () => {
  beforeEach(() => {
    _resetCacheForTesting();
    jest.clearAllMocks();
    mockRandomUUID.mockReturnValue(
      SESSION_ID as `${string}-${string}-${string}-${string}-${string}`,
    );
  });

  it("generates and persists a session id when none is stored", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue();

    const id = await getAnalyticsSessionId();

    expect(id).toBe(SESSION_ID);
    expect(mockSetItem).toHaveBeenCalledWith("gb_analytics_session", id);
  });

  it("reuses the stored session id", async () => {
    const stored = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    mockGetItem.mockResolvedValue(stored);

    expect(await getAnalyticsSessionId()).toBe(stored);
    expect(mockRandomUUID).not.toHaveBeenCalled();
  });

  it("caches the session id rather than re-reading SecureStore", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue();

    await getAnalyticsSessionId();
    await getAnalyticsSessionId();

    expect(mockGetItem).toHaveBeenCalledTimes(1);
  });
});

describe("trackEvent", () => {
  beforeEach(() => {
    _resetCacheForTesting();
    jest.clearAllMocks();
    mockRandomUUID.mockReturnValue(
      SESSION_ID as `${string}-${string}-${string}-${string}-${string}`,
    );
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
    }) as unknown as typeof fetch;
  });

  it("posts the event with the session id attached", async () => {
    await trackEvent("product_viewed", { productId: "p1" });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/analytics/events");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      name: "product_viewed",
      sessionId: SESSION_ID,
      productId: "p1",
    });
  });

  it("never throws when the request fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));

    await expect(trackEvent("added_to_cart")).resolves.toBeUndefined();
  });

  it("never throws when the backend rejects the event", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    });

    await expect(trackEvent("checkout_started")).resolves.toBeUndefined();
  });

  it("attaches the session header when logging in, so the backend can link it", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: "u1" },
        accessToken: "a",
        refreshToken: "r",
      }),
    });

    await loginWithEmail({ email: "a@b.com", password: "Passw0rd!" });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["X-Analytics-Session"]).toBe(SESSION_ID);
  });

  it("still logs in when the session store is unavailable", async () => {
    mockGetItem.mockRejectedValue(new Error("keystore locked"));
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: "u1" },
        accessToken: "a",
        refreshToken: "r",
      }),
    });

    await expect(
      loginWithEmail({ email: "a@b.com", password: "Passw0rd!" }),
    ).resolves.toMatchObject({ user: { id: "u1" } });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["X-Analytics-Session"]).toBeUndefined();
  });

  it("sends an order's id and value", async () => {
    await trackEvent("order_placed", { orderId: "o1", valueInPaise: 150000 });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      name: "order_placed",
      sessionId: SESSION_ID,
      orderId: "o1",
      valueInPaise: 150000,
    });
  });
});
