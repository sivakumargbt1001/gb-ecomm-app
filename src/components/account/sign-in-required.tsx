import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

import { useAuthStore } from "../../lib/auth-store";

// Wraps every account screen: the tab already sends guests to sign in, but a
// deep link (or a session that expired mid-visit) can land here without one.
export function SignInRequired({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuthStore();

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-sm text-neutral-500">Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white p-6">
        <Text className="text-base text-neutral-600">Sign in to manage your account.</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable className="rounded-lg bg-black px-6 py-3">
            <Text className="font-semibold text-white">Sign in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return <>{children}</>;
}

export const inputClass = "rounded-lg border border-neutral-300 px-4 py-3 text-base";
export const primaryButtonClass =
  "items-center rounded-lg bg-black py-3 disabled:opacity-50";
export const secondaryButtonClass =
  "items-center rounded-lg border border-neutral-300 py-3 disabled:opacity-50";
