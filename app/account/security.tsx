import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { PasswordSchema } from "@geekbase-labs/shared-types";

import {
  SignInRequired,
  inputClass,
  primaryButtonClass,
} from "../../src/components/account/sign-in-required";
import { changePassword } from "../../src/lib/account-api";
import { setAuthToken } from "../../src/lib/api-client";
import { useAuthStore } from "../../src/lib/auth-store";
import { saveTokens } from "../../src/lib/token-storage";

export default function SecurityScreen() {
  return (
    <SignInRequired>
      <Stack.Screen options={{ title: "Security" }} />
      <PasswordForm />
    </SignInRequired>
  );
}

function PasswordForm() {
  const user = useAuthStore((state) => state.user)!;
  const setUser = useAuthStore((state) => state.setUser);
  const hasPassword = user.hasPassword;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      changePassword({
        newPassword,
        ...(hasPassword ? { currentPassword } : {}),
      }),
    onSuccess: async ({ user: updated, tokens }) => {
      // Every other session was signed out; this one continues on the new pair.
      await saveTokens(tokens);
      setAuthToken(tokens.accessToken);
      setUser(updated);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
    },
  });

  const submit = () => {
    setSaved(false);
    if (hasPassword && !currentPassword) {
      setValidation("Enter your current password");
      return;
    }
    if (!PasswordSchema.safeParse(newPassword).success) {
      setValidation("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidation("Passwords do not match");
      return;
    }
    setValidation(null);
    save.mutate();
  };

  const error = validation ?? save.error?.message ?? null;

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View className="gap-1">
        <Text className="text-base font-semibold text-neutral-900">
          {hasPassword ? "Change password" : "Set a password"}
        </Text>
        <Text className="text-sm text-neutral-500">
          {hasPassword
            ? "Changing your password signs you out everywhere else."
            : "You currently sign in with a one-time code. Adding a password lets you sign in with your email as well."}
        </Text>
      </View>

      {hasPassword ? (
        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-800">Current password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoComplete="current-password"
            className={inputClass}
            testID="current-password"
          />
        </View>
      ) : null}

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-800">New password</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoComplete="new-password"
          className={inputClass}
          testID="new-password"
        />
        <Text className="text-xs text-neutral-500">At least 8 characters.</Text>
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-800">Confirm new password</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          className={inputClass}
          testID="confirm-password"
        />
      </View>

      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={save.isPending}
        className={primaryButtonClass}
        testID="password-save"
      >
        <Text className="font-semibold text-white">
          {save.isPending ? "Saving…" : hasPassword ? "Update password" : "Set password"}
        </Text>
      </Pressable>
      {saved ? (
        <Text className="text-center text-sm text-neutral-500" testID="password-saved">
          Password updated
        </Text>
      ) : null}
    </ScrollView>
  );
}
