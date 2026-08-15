import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
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

import { loginWithEmail, requestOtp } from "../../src/lib/auth-api";
import { setAuthToken } from "../../src/lib/api-client";
import { useAuthStore } from "../../src/lib/auth-store";
import { saveTokens } from "../../src/lib/token-storage";
import { mergeGuestCart } from "../../src/lib/cart-api";

type Method = "email" | "phone";

export default function LoginScreen() {
  const setUser = useAuthStore((state) => state.setUser);
  const [method, setMethod] = useState<Method>("email");

  const emailForm = useForm<LoginEmailInput>({
    resolver: zodResolver(LoginEmailSchema),
    defaultValues: { email: "", password: "" },
  });

  const phoneForm = useForm<RequestOtpInput>({
    resolver: zodResolver(RequestOtpSchema),
    defaultValues: { phone: "", channel: "sms" },
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
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
    >
      <View className="w-full max-w-md space-y-6 self-center rounded-2xl border border-gray-200 bg-white p-8">
        <View className="space-y-1">
          <Text className="text-center text-3xl font-extrabold text-gray-900">Welcome Back</Text>
          <Text className="text-center text-sm text-gray-500">
            Sign in to access your GB E-commerce account
          </Text>
        </View>

        <View className="flex-row rounded-lg bg-gray-100 p-1">
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
              Email Login
            </Text>
          </Pressable>
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
              Phone / OTP
            </Text>
          </Pressable>
        </View>

        {method === "email" ? (
          <View className="space-y-4">
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
                    keyboardType="email-address"
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
          <View className="space-y-4">
            {requestOtpMutation.isError && (
              <Text className="text-sm font-medium text-red-600">
                {requestOtpMutation.error.message}
              </Text>
            )}

            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-900">Phone Number</Text>
              <Controller
                control={phoneForm.control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="+919876543210"
                    keyboardType="phone-pad"
                    className="rounded-lg border border-gray-300 px-4 py-3"
                  />
                )}
              />
              {phoneForm.formState.errors.phone && (
                <Text className="text-xs font-medium text-red-600">
                  {phoneForm.formState.errors.phone.message}
                </Text>
              )}
            </View>

            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-900">Choose Channel</Text>
              <Controller
                control={phoneForm.control}
                name="channel"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row space-x-3">
                    <Pressable
                      onPress={() => onChange("sms")}
                      className={`flex-1 items-center rounded-lg border py-3 ${
                        value === "sms" ? "border-black bg-gray-100" : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={`font-semibold ${value === "sms" ? "text-black" : "text-gray-500"}`}
                      >
                        SMS
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onChange("whatsapp")}
                      className={`flex-1 items-center rounded-lg border py-3 ${
                        value === "whatsapp" ? "border-black bg-gray-100" : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          value === "whatsapp" ? "text-black" : "text-gray-500"
                        }`}
                      >
                        WhatsApp
                      </Text>
                    </Pressable>
                  </View>
                )}
              />
            </View>

            <Pressable
              onPress={phoneForm.handleSubmit((data) => requestOtpMutation.mutate(data))}
              disabled={requestOtpMutation.isPending}
              className="items-center rounded-lg bg-black py-3 disabled:opacity-50"
            >
              <Text className="font-semibold text-white">
                {requestOtpMutation.isPending ? "Sending OTP..." : "Send Verification Code"}
              </Text>
            </Pressable>
          </View>
        )}

        <Link href="/(auth)/signup" asChild>
          <Pressable className="items-center rounded-lg border border-gray-300 py-3">
            <Text className="font-semibold text-gray-900">Create an Account</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
