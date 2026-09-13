import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { useAuthStore } from "../../src/lib/auth-store";
import { logout as logoutRequest } from "../../src/lib/auth-api";
import { setAuthToken } from "../../src/lib/api-client";
import { clearTokens, loadTokens } from "../../src/lib/token-storage";
import { detachPushDevice } from "../../src/lib/push-registration";
import { ReferralCard } from "../../src/components/account/referral-card";

const SECTIONS: { label: string; hint: string; href: Href; testID: string }[] = [
  {
    label: "Profile",
    hint: "Your name, email and mobile number",
    href: "/account/profile",
    testID: "account-profile",
  },
  {
    label: "Addresses",
    hint: "Where your orders are delivered",
    href: "/account/addresses",
    testID: "account-addresses",
  },
  {
    label: "Security",
    hint: "Password and sign-in",
    href: "/account/security",
    testID: "account-security",
  },
  {
    label: "Track your order",
    hint: "Order history and delivery status",
    href: "/(tabs)/orders",
    testID: "track-order-link",
  },
  {
    label: "Wishlist",
    hint: "Products you have saved",
    href: "/(tabs)/wishlist",
    testID: "account-wishlist",
  },
];

export default function AccountScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Drop the device first: this call rides the auth token onSettled is
      // about to clear, and a phone that changes hands must stop receiving the
      // last shopper's order pushes.
      await detachPushDevice();
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

  const greeting = user.name ? `Hi, ${user.name}` : (user.email ?? user.phone ?? "");

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View className="gap-1">
        <Text className="text-2xl font-bold text-neutral-900" testID="account-greeting">
          {greeting}
        </Text>
        {user.name ? (
          <Text className="text-sm text-neutral-500">{user.email ?? user.phone}</Text>
        ) : null}
      </View>

      <View className="overflow-hidden rounded-xl border border-neutral-200">
        {SECTIONS.map((section, index) => (
          <Link key={section.testID} href={section.href} asChild>
            <Pressable
              testID={section.testID}
              className={`flex-row items-center justify-between px-4 py-3 ${
                index > 0 ? "border-t border-neutral-100" : ""
              }`}
            >
              <View className="flex-1 gap-0.5">
                <Text className="text-base font-medium text-neutral-900">{section.label}</Text>
                <Text className="text-xs text-neutral-500">{section.hint}</Text>
              </View>
              <Text className="text-neutral-400">›</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <ReferralCard />

      <Pressable
        onPress={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="items-center rounded-lg border border-neutral-300 py-3 disabled:opacity-50"
      >
        <Text className="font-semibold text-neutral-900">
          {logoutMutation.isPending ? "Logging out..." : "Log Out"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
