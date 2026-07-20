import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const GUEST_ID_KEY = "gb_guest_id";

let cachedGuestId: string | null = null;

export async function getGuestId(): Promise<string> {
  if (cachedGuestId) return cachedGuestId;

  const stored = await SecureStore.getItemAsync(GUEST_ID_KEY);
  if (stored) {
    cachedGuestId = stored;
    return stored;
  }

  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(GUEST_ID_KEY, id);
  cachedGuestId = id;
  return id;
}

export async function clearGuestId(): Promise<void> {
  cachedGuestId = null;
  await SecureStore.deleteItemAsync(GUEST_ID_KEY);
}

export function _resetCacheForTesting(): void {
  cachedGuestId = null;
}
