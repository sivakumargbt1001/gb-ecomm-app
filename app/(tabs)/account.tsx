import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

import { useAuthStore } from "../../src/lib/auth-store";

export default function AccountScreen() {
  const user = useAuthStore((state) => state.user);

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
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold">{user.email ?? user.phone}</Text>
    </View>
  );
}
