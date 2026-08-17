import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import type { OtpChannel } from "@geekbase-labs/shared-types";

import { requestOtp, verifyOtp } from "../../src/lib/auth-api";
import { setAuthToken } from "../../src/lib/api-client";
import { useAuthStore } from "../../src/lib/auth-store";
import { saveTokens } from "../../src/lib/token-storage";
import {
  canResend,
  createOtpTimerState,
  formatOtpTime,
  isOtpExpired,
  tickOtpTimerState,
  type OtpTimerState,
} from "../../src/lib/otp-timer";
import { mergeGuestCart } from "../../src/lib/cart-api";

export default function OtpVerifyScreen() {
  // `referralCode` was already validated and normalised on the signup screen;
  // this screen only has to carry it into the call that creates the account.
  const { phone, channel, referralCode } = useLocalSearchParams<{
    phone: string;
    channel: OtpChannel;
    referralCode?: string;
  }>();
  const setUser = useAuthStore((state) => state.setUser);
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState<OtpTimerState>(() => createOtpTimerState());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => tickOtpTimerState(prev));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const verifyMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: async ({ user, tokens }) => {
      await saveTokens(tokens);
      setAuthToken(tokens.accessToken);
      setUser(user);
      mergeGuestCart().catch(() => {});
      router.replace("/(tabs)");
    },
  });

  const resendMutation = useMutation({
    mutationFn: requestOtp,
    onSuccess: () => {
      setTimer(createOtpTimerState());
      setCode("");
    },
  });

  const expired = isOtpExpired(timer);
  const resendDisabled = !canResend(timer) || resendMutation.isPending;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
    >
      <View className="w-full max-w-md space-y-6 self-center rounded-2xl border border-gray-200 bg-white p-8">
        <View className="space-y-1">
          <Text className="text-center text-2xl font-bold text-gray-900">Verify Phone</Text>
          <Text className="text-center text-sm text-gray-500">
            We sent a verification code to <Text className="font-semibold text-gray-900">{phone}</Text>
          </Text>
        </View>

        {(verifyMutation.isError || resendMutation.isError) && (
          <Text className="text-center text-sm font-medium text-red-600">
            {(verifyMutation.error ?? resendMutation.error)?.message}
          </Text>
        )}

        <View className="space-y-2">
          <Text className="text-sm font-medium text-gray-900">Verification Code</Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            className="rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-widest"
          />
        </View>

        <Pressable
          onPress={() =>
            verifyMutation.mutate({
              phone,
              code,
              ...(referralCode ? { referralCode } : {}),
            })
          }
          disabled={verifyMutation.isPending || code.length !== 6 || expired}
          className="items-center rounded-lg bg-black py-3 disabled:opacity-50"
        >
          <Text className="font-semibold text-white">
            {verifyMutation.isPending ? "Verifying..." : "Verify & Continue"}
          </Text>
        </Pressable>

        <View className="items-center space-y-2">
          {expired ? (
            <Text className="text-center text-sm font-semibold text-red-600">
              Code has expired. Please request a new one.
            </Text>
          ) : (
            <Text className="text-center text-sm text-gray-500">
              Code expires in{" "}
              <Text className="font-semibold text-gray-900">
                {formatOtpTime(timer.expirySeconds)}
              </Text>
            </Text>
          )}

          <Pressable
            onPress={() => resendMutation.mutate({ phone, channel })}
            disabled={resendDisabled}
          >
            <Text
              className={`text-sm font-semibold ${resendDisabled ? "text-gray-400" : "text-black"}`}
            >
              {resendMutation.isPending
                ? "Resending..."
                : canResend(timer)
                  ? "Resend Code"
                  : `Resend code in ${timer.cooldownSeconds}s`}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
