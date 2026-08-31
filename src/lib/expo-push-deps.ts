import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { PushPermissionStatus, PushTokenDeps } from "./push-registration";

function toStatus(status: Notifications.PermissionStatus): PushPermissionStatus {
  if (status === "granted") return "granted";
  return status === "undetermined" ? "undetermined" : "denied";
}

// EAS injects this at build time; a bare `expo start` has no project id and the
// token call throws, which resolvePushToken treats as "no push here".
function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

export function expoPushTokenDeps(): PushTokenDeps {
  return {
    isPhysicalDevice: Device.isDevice,
    os: Platform.OS,
    getPermissions: async () =>
      toStatus((await Notifications.getPermissionsAsync()).status),
    requestPermissions: async () =>
      toStatus((await Notifications.requestPermissionsAsync()).status),
    getToken: async () =>
      (await Notifications.getExpoPushTokenAsync({ projectId: projectId() }))
        .data,
  };
}

// Without this an arriving push is silent while the app is open, which reads as
// a delivery failure when verifying an order status change.
export function configureForegroundNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Android shows nothing at all without a channel to file the push under.
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Order updates",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}
