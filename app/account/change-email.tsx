import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, router } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import {
  SignInRequired,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../src/components/account/sign-in-required";
import { requestContactChange } from "../../src/lib/account-api";
import { useAuthStore } from "../../src/lib/auth-store";

export default function ChangeEmailScreen() {
  return (
    <SignInRequired>
      <Stack.Screen options={{ title: "Change email" }} />
      <ChangeEmail />
    </SignInRequired>
  );
}

// The new address is confirmed through a link sent to it, which opens on the
// website while signed in there. Until it is, the old address keeps working.
function ChangeEmail() {
  const user = useAuthStore((state) => state.user)!;
  const [email, setEmail] = useState("");

  const request = useMutation({
    mutationFn: (next: string) => requestContactChange({ kind: "email", email: next }),
  });

  if (request.isSuccess) {
    return (
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text className="text-base text-neutral-900" testID="email-link-sent">
          We&apos;ve sent a confirmation link to{" "}
          <Text className="font-semibold">{request.variables}</Text>. Open it to switch
          your email. Until then, {user.email ?? "your current sign-in"} keeps working.
        </Text>
        <Pressable onPress={() => router.back()} className={secondaryButtonClass}>
          <Text className="font-semibold text-neutral-900">Done</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, gap: 16 }}>
      {user.email ? (
        <Text className="text-sm text-neutral-500">
          Current email: <Text className="font-medium text-neutral-900">{user.email}</Text>
        </Text>
      ) : null}
      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-800">New email address</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          className={inputClass}
          testID="new-email"
        />
      </View>
      {request.isError ? (
        <Text className="text-sm text-red-600">{request.error.message}</Text>
      ) : null}
      <Pressable
        onPress={() => request.mutate(email.trim())}
        disabled={request.isPending || !email.trim()}
        className={primaryButtonClass}
        testID="send-email-link"
      >
        <Text className="font-semibold text-white">
          {request.isPending ? "Sending…" : "Send confirmation link"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
