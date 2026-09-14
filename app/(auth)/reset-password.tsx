import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ResetPasswordSchema, type ResetPasswordInput } from "@geekbase-labs/shared-types";

import { AuthShell } from "../../src/components/auth/auth-shell";
import { resetPassword } from "../../src/lib/auth-api";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token: token ?? "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => setSuccess(true),
  });

  if (!token) {
    return (
      <AuthShell>
        <Text className="text-center text-2xl font-bold text-gray-900">Invalid Link</Text>
        <Text className="text-center text-sm text-gray-500">
          This password reset link is missing or invalid. Please request a new one.
        </Text>
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable className="mt-2 items-center rounded-lg bg-black py-3">
            <Text className="font-semibold text-white">Request New Link</Text>
          </Pressable>
        </Link>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <Text className="text-center text-2xl font-bold text-gray-900">Password Reset</Text>
        <Text className="text-center text-sm text-gray-500">
          Your password has been reset. You can now log in with your new password.
        </Text>
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          className="mt-2 items-center rounded-lg bg-black py-3"
        >
          <Text className="font-semibold text-white">Go to Login</Text>
        </Pressable>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <View className="space-y-1">
        <Text className="text-center text-3xl font-extrabold text-gray-900">Set New Password</Text>
        <Text className="text-center text-sm text-gray-500">
          Choose a new password for your account
        </Text>
      </View>

      {mutation.isError && (
        <Text className="text-sm font-medium text-red-600">{mutation.error.message}</Text>
      )}

      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-900">New Password</Text>
        <Controller
          control={form.control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Minimum 8 characters"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              autoCapitalize="none"
              className="rounded-lg border border-gray-300 px-4 py-3"
            />
          )}
        />
        {form.formState.errors.password && (
          <Text className="text-xs font-medium text-red-600">
            {form.formState.errors.password.message}
          </Text>
        )}
      </View>

      <Pressable
        onPress={form.handleSubmit((data) => mutation.mutate(data))}
        disabled={mutation.isPending}
        className="items-center rounded-lg bg-black py-3 disabled:opacity-50"
      >
        <Text className="font-semibold text-white">
          {mutation.isPending ? "Resetting..." : "Reset Password"}
        </Text>
      </Pressable>
    </AuthShell>
  );
}
