import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import { getGuestId, clearGuestId, _resetCacheForTesting } from "../guest-id";

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
const mockDeleteItem = SecureStore.deleteItemAsync as jest.MockedFunction<
  typeof SecureStore.deleteItemAsync
>;

describe("guest-id", () => {
  beforeEach(() => {
    _resetCacheForTesting();
    jest.clearAllMocks();
    mockRandomUUID.mockReturnValue(
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" as `${string}-${string}-${string}-${string}-${string}`,
    );
  });

  it("generates and persists a new UUID when none is stored", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue();

    const id = await getGuestId();

    expect(id).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(mockRandomUUID).toHaveBeenCalledTimes(1);
    expect(mockSetItem).toHaveBeenCalledWith("gb_guest_id", id);
  });

  it("returns the stored UUID without generating a new one", async () => {
    const stored = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    mockGetItem.mockResolvedValue(stored);

    const id = await getGuestId();

    expect(id).toBe(stored);
    expect(mockRandomUUID).not.toHaveBeenCalled();
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("caches the ID and does not hit SecureStore again on subsequent calls", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue();

    const first = await getGuestId();
    const second = await getGuestId();

    expect(first).toBe(second);
    expect(mockGetItem).toHaveBeenCalledTimes(1);
  });

  it("clearGuestId removes the stored ID and resets the cache", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue();
    mockDeleteItem.mockResolvedValue();

    await getGuestId();
    await clearGuestId();

    expect(mockDeleteItem).toHaveBeenCalledWith("gb_guest_id");

    mockGetItem.mockResolvedValue(null);
    const newId = await getGuestId();
    expect(mockGetItem).toHaveBeenCalledTimes(2);
    expect(newId).toBeTruthy();
  });
});
