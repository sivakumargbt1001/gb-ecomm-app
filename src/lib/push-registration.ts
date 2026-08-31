import type { PushPlatform } from "@geekbase-labs/shared-types";

import { registerPushDevice, removePushDevice } from "./push-api";
import { usePushStore } from "./push-store";

export type PushPermissionStatus = "granted" | "denied" | "undetermined";

export interface PushTokenDeps {
  isPhysicalDevice: boolean;
  os: string;
  getPermissions: () => Promise<PushPermissionStatus>;
  requestPermissions: () => Promise<PushPermissionStatus>;
  getToken: () => Promise<string>;
}

export function pushPlatformFor(os: string): PushPlatform | null {
  return os === "ios" || os === "android" ? os : null;
}

export async function resolvePushToken(
  deps: PushTokenDeps,
): Promise<string | null> {
  // Expo issues no token to a simulator, so asking for permission there only
  // shows a dialog that can lead nowhere.
  if (!deps.isPhysicalDevice) return null;

  let status = await deps.getPermissions();
  // iOS turns a second request into a no-op once the shopper has refused —
  // changing their mind happens in Settings, not in another prompt.
  if (status === "undetermined") {
    status = await deps.requestPermissions();
  }
  if (status !== "granted") return null;

  try {
    return await deps.getToken();
  } catch {
    return null;
  }
}

export async function registerDeviceForPush(
  deps: PushTokenDeps,
): Promise<string | null> {
  const platform = pushPlatformFor(deps.os);
  if (!platform) return null;

  const token = await resolvePushToken(deps);
  if (!token) return null;

  try {
    await registerPushDevice({ token, platform });
    usePushStore.getState().setToken(token);
    return token;
  } catch {
    // Push is an extra; a store that cannot register one still sells.
    return null;
  }
}

export async function unregisterDeviceForPush(token: string): Promise<void> {
  try {
    await removePushDevice(token);
  } catch {
    // A device the backend has already dropped is the state we wanted anyway.
  }
}

// Called while the shopper is still signed in: the delete rides their auth
// token, which logging out clears before any status-change effect could run.
export async function detachPushDevice(): Promise<void> {
  const { token, setToken } = usePushStore.getState();
  setToken(null);
  if (token) await unregisterDeviceForPush(token);
}
