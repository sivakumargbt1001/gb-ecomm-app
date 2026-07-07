import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { useAuthStore } from "../../src/lib/auth-store";
import { logout as logoutRequest } from "../../src/lib/auth-api";
import { setAuthToken } from "../../src/lib/api-client";
import { clearTokens, loadTokens } from "../../src/lib/token-storage";

export default function AccountScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const tokens = await loadTokens();
      if (tokens) {
        await logoutRequest({ refreshToken: tokens.refreshToken });
      }
    },
    onSettled: async () => {
      await clearTokens();
      setAuthToken(null);
      logout();
    },
  });

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center space-y-4 bg-white p-6">
        <Text className="text-lg font-semibold">You&apos;re not logged in</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable className="rounded-lg bg-black px-6 py-3">
            <Text className="font-semibold text-white">Log In</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center space-y-4 bg-white">
      <Text className="text-lg font-semibold">{user.email ?? user.phone}</Text>
      <Pressable
        onPress={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="rounded-lg bg-black px-6 py-3 disabled:opacity-50"
      >
        <Text className="font-semibold text-white">
          {logoutMutation.isPending ? "Logging out..." : "Log Out"}
        </Text>
      </Pressable>
    </View>
  );
}
