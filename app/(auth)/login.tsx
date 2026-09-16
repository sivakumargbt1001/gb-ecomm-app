import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  LoginEmailSchema,
  RequestOtpSchema,
  type LoginEmailInput,
  type RequestOtpInput,
} from "@geekbase-labs/shared-types";

import { AuthShell } from "../../src/components/auth/auth-shell";
import { ConsentNotice } from "../../src/components/auth/consent-notice";
import { loginWithEmail, requestOtp } from "../../src/lib/auth-api";
import { setAuthToken } from "../../src/lib/api-client";
import { useAuthStore } from "../../src/lib/auth-store";
import { useSiteTheme } from "../../src/lib/site-theme-context";
import { saveTokens } from "../../src/lib/token-storage";
import { mergeGuestCart } from "../../src/lib/cart-api";
import { PhoneField } from "../../src/components/ui/phone-field";

type Method = "email" | "phone";

export default function LoginScreen() {
  const { siteName } = useSiteTheme();
  const setUser = useAuthStore((state) => state.setUser);
  // Mobile first: an OTP asks nothing of the shopper but the phone in hand.
  const [method, setMethod] = useState<Method>("phone");

  const emailForm = useForm<LoginEmailInput>({
    resolver: zodResolver(LoginEmailSchema),
    defaultValues: { email: "", password: "" },
  });

  const phoneForm = useForm<RequestOtpInput>({
    resolver: zodResolver(RequestOtpSchema),
    // WhatsApp first; the OTP screen offers SMS as the fallback.
    defaultValues: { phone: "", channel: "whatsapp" },
  });

  const loginEmailMutation = useMutation({
    mutationFn: loginWithEmail,
    onSuccess: async ({ user, tokens }) => {
      await saveTokens(tokens);
      setAuthToken(tokens.accessToken);
      setUser(user);
      mergeGuestCart().catch(() => {});
      router.replace("/(tabs)");
    },
  });

  const requestOtpMutation = useMutation({
    mutationFn: requestOtp,
    onSuccess: (_, variables) => {
      router.push({
        pathname: "/(auth)/otp-verify",
        params: { phone: variables.phone, channel: variables.channel },
      });
    },
  });

  return (
    <AuthShell>
      <View className="space-y-1">
        <Text className="text-center text-3xl font-extrabold text-gray-900">Welcome Back</Text>
        <Text className="text-center text-sm text-gray-500">
          Welcome back to {siteName}. Sign in with your mobile number or email.
        </Text>
      </View>

      <View className="flex-row rounded-lg bg-gray-100 p-1">
        <Pressable
          onPress={() => {
            setMethod("phone");
            requestOtpMutation.reset();
          }}
          className={`flex-1 rounded-md py-2 ${method === "phone" ? "bg-white" : ""}`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              method === "phone" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Mobile number
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setMethod("email");
            loginEmailMutation.reset();
          }}
          className={`flex-1 rounded-md py-2 ${method === "email" ? "bg-white" : ""}`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              method === "email" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Email
          </Text>
        </Pressable>
      </View>

      {method === "email" ? (
        <View key={method} className="space-y-4">
          {loginEmailMutation.isError && (
            <Text className="text-sm font-medium text-red-600">
              {loginEmailMutation.error.message}
            </Text>
          )}

          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-900">Email Address</Text>
            <Controller
              control={emailForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  // No autoCorrect={false} on email fields: Android 17
                  // rewrites the NO_SUGGESTIONS flag it sets, so RN sees a
                  // changed input type on every render and restarts the
                  // keyboard, which drops every keystroke. The email
                  // keyboard does not autocorrect anyway.
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  className="rounded-lg border border-gray-300 px-4 py-3"
                  testID="login-email"
                />
              )}
            />
            {emailForm.formState.errors.email && (
              <Text className="text-xs font-medium text-red-600">
                {emailForm.formState.errors.email.message}
              </Text>
            )}
          </View>

          <View className="space-y-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-gray-900">Password</Text>
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable>
                  <Text className="text-xs font-semibold text-gray-900">Forgot password?</Text>
                </Pressable>
              </Link>
            </View>
            <Controller
              control={emailForm.control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  autoCapitalize="none"
                  className="rounded-lg border border-gray-300 px-4 py-3"
                  testID="login-password"
                />
              )}
            />
            {emailForm.formState.errors.password && (
              <Text className="text-xs font-medium text-red-600">
                {emailForm.formState.errors.password.message}
              </Text>
            )}
          </View>

          <Pressable
            onPress={emailForm.handleSubmit((data) => loginEmailMutation.mutate(data))}
            disabled={loginEmailMutation.isPending}
            className="items-center rounded-lg bg-black py-3 disabled:opacity-50"
            testID="login-submit"
          >
            <Text className="font-semibold text-white">
              {loginEmailMutation.isPending ? "Logging in..." : "Log In with Email"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View key={method} className="space-y-4">
          {requestOtpMutation.isError && (
            <Text className="text-sm font-medium text-red-600">
              {requestOtpMutation.error.message}
            </Text>
          )}

          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-900">Mobile number</Text>
            <Controller
              control={phoneForm.control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <PhoneField
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  className="rounded-lg border border-gray-300"
                  testID="phone"
                />
              )}
            />
            {phoneForm.formState.errors.phone && (
              <Text className="text-xs font-medium text-red-600">
                {phoneForm.formState.errors.phone.message}
              </Text>
            )}
          </View>

          <Pressable
            onPress={phoneForm.handleSubmit((data) => requestOtpMutation.mutate(data))}
            disabled={requestOtpMutation.isPending}
            className="items-center rounded-lg bg-black py-3 disabled:opacity-50"
          >
            <Text className="font-semibold text-white">
              {requestOtpMutation.isPending ? "Sending OTP..." : "Send OTP on WhatsApp"}
            </Text>
          </Pressable>
        </View>
      )}

      <ConsentNotice />

      <Link href="/(auth)/signup" asChild>
        <Pressable className="items-center rounded-lg border border-gray-300 py-3">
          <Text className="font-semibold text-gray-900">Create an Account</Text>
        </Pressable>
      </Link>
    </AuthShell>
  );
}
