import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ForgotPasswordSchema, type ForgotPasswordInput } from "@geekbase-labs/shared-types";

import { forgotPassword } from "../../src/lib/auth-api";

export default function ForgotPasswordScreen() {
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => setSuccess(true),
  });

  if (success) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <View className="w-full max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-8">
          <Text className="text-center text-2xl font-bold text-gray-900">Check Your Email</Text>
          <Text className="text-center text-sm text-gray-500">
            If an account is associated with that email address, we have sent a link to reset your
            password.
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable className="mt-2 items-center rounded-lg bg-black py-3">
              <Text className="font-semibold text-white">Return to Login</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
    >
      <View className="w-full max-w-md space-y-6 self-center rounded-2xl border border-gray-200 bg-white p-8">
        <View className="space-y-1">
          <Text className="text-center text-3xl font-extrabold text-gray-900">
            Reset Password
          </Text>
          <Text className="text-center text-sm text-gray-500">
            Enter your email and we&apos;ll send you a link to reset your password
          </Text>
        </View>

        {mutation.isError && (
          <Text className="text-sm font-medium text-red-600">{mutation.error.message}</Text>
        )}

        <View className="space-y-2">
          <Text className="text-sm font-medium text-gray-900">Email Address</Text>
          <Controller
            control={form.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="name@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                className="rounded-lg border border-gray-300 px-4 py-3"
              />
            )}
          />
          {form.formState.errors.email && (
            <Text className="text-xs font-medium text-red-600">
              {form.formState.errors.email.message}
            </Text>
          )}
        </View>

        <Pressable
          onPress={form.handleSubmit((data) => mutation.mutate(data))}
          disabled={mutation.isPending}
          className="items-center rounded-lg bg-black py-3 disabled:opacity-50"
        >
          <Text className="font-semibold text-white">
            {mutation.isPending ? "Sending link..." : "Send Reset Link"}
          </Text>
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable className="items-center rounded-lg border border-gray-300 py-3">
            <Text className="font-semibold text-gray-900">Back to Login</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
