import { useEffect } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

import { useAuthStore } from "./auth-store";
import {
  configureForegroundNotifications,
  ensureAndroidChannel,
  expoPushTokenDeps,
} from "./expo-push-deps";
import { orderRouteForPushUrl } from "./push-navigation";
import { registerDeviceForPush } from "./push-registration";
import { usePushStore } from "./push-store";

// Registration follows the session rather than the launch: a guest has no
// account to attach a device to, and the token is only useful once the backend
// knows whose orders it belongs to.
export function usePushRegistration(): void {
  const status = useAuthStore((state) => state.status);
  const registeredToken = usePushStore((state) => state.token);

  useEffect(() => {
    if (status !== "authenticated" || registeredToken) return;

    async function register() {
      configureForegroundNotifications();
      await ensureAndroidChannel();
      await registerDeviceForPush(expoPushTokenDeps());
    }

    void register();
  }, [status, registeredToken]);

  useEffect(() => {
    function open(response: Notifications.NotificationResponse | null) {
      const route = orderRouteForPushUrl(
        response?.notification.request.content.data?.url,
      );
      if (route) router.push(route as never);
    }

    // A tap that launched the app from cold has already been delivered by the
    // time a listener could attach, so the last response is read once too.
    void Notifications.getLastNotificationResponseAsync().then(open);

    const subscription =
      Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, []);
}
