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

const CHANNEL_LABEL: Record<OtpChannel, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
};

export default function OtpVerifyScreen() {
  // `referralCode` was already validated and normalised on the signup screen;
  // this screen only has to carry it into the call that creates the account.
  const { phone, channel: initialChannel, referralCode } = useLocalSearchParams<{
    phone: string;
    channel: OtpChannel;
    referralCode?: string;
  }>();
  // WhatsApp is tried first; a shopper it does not reach switches to SMS from
  // here, and every later resend goes to wherever the code last went.
  const [channel, setChannel] = useState<OtpChannel>(initialChannel);
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
    onSuccess: (_, variables) => {
      setChannel(variables.channel);
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
          <Text className="text-center text-2xl font-bold text-gray-900">Verify your number</Text>
          <Text className="text-center text-sm text-gray-500">
            We&apos;ve sent a one-time password (OTP) to
          </Text>
          <Text className="text-center text-sm text-gray-900" testID="otp-destination">
            <Text className="font-semibold">{phone}</Text> on{" "}
            <Text className="font-semibold">{CHANNEL_LABEL[channel]}</Text>
          </Text>
        </View>

        {(verifyMutation.isError || resendMutation.isError) && (
          <Text className="text-center text-sm font-medium text-red-600">
            {(verifyMutation.error ?? resendMutation.error)?.message}
          </Text>
        )}

        <View className="space-y-2">
          <Text className="text-sm font-medium text-gray-900">Enter OTP</Text>
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
                  ? "Didn't receive the OTP? Resend"
                  : `Didn't receive the OTP? Resend in ${timer.cooldownSeconds}s`}
            </Text>
          </Pressable>

          {channel === "whatsapp" ? (
            <>
              <View className="w-full flex-row items-center gap-3 py-1">
                <View className="h-px flex-1 bg-gray-200" />
                <Text className="text-xs text-gray-500">or</Text>
                <View className="h-px flex-1 bg-gray-200" />
              </View>
              <Pressable
                testID="otp-send-sms"
                onPress={() => resendMutation.mutate({ phone, channel: "sms" })}
                disabled={resendMutation.isPending || verifyMutation.isPending}
                className="w-full items-center rounded-lg border border-gray-300 py-3 disabled:opacity-50"
              >
                <Text className="font-semibold text-gray-900">Send OTP by SMS</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
