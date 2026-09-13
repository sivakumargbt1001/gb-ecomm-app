import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import type { OtpChannel } from "@geekbase-labs/shared-types";

import {
  SignInRequired,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../src/components/account/sign-in-required";
import { confirmContactChange, requestContactChange } from "../../src/lib/account-api";
import { useAuthStore } from "../../src/lib/auth-store";
import {
  canResend,
  createOtpTimerState,
  formatOtpTime,
  isOtpExpired,
  tickOtpTimerState,
  type OtpTimerState,
} from "../../src/lib/otp-timer";

const CHANNEL_LABEL: Record<OtpChannel, string> = { whatsapp: "WhatsApp", sms: "SMS" };

export default function ChangePhoneScreen() {
  return (
    <SignInRequired>
      <Stack.Screen options={{ title: "Change mobile number" }} />
      <ChangePhone />
    </SignInRequired>
  );
}

// Two stages on one screen: the new number, then the code sent to it. The
// old number stays on the account until the code checks out.
function ChangePhone() {
  const user = useAuthStore((state) => state.user)!;
  const setUser = useAuthStore((state) => state.setUser);
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState<{ phone: string; channel: OtpChannel } | null>(null);
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState<OtpTimerState>(() => createOtpTimerState());

  useEffect(() => {
    if (!pending) return;
    const interval = setInterval(() => setTimer((prev) => tickOtpTimerState(prev)), 1000);
    return () => clearInterval(interval);
  }, [pending]);

  const request = useMutation({
    mutationFn: (input: { phone: string; channel: OtpChannel }) =>
      requestContactChange({ kind: "phone", ...input }),
    onSuccess: (_, input) => {
      setPending(input);
      setCode("");
      setTimer(createOtpTimerState());
    },
  });

  const confirm = useMutation({
    mutationFn: () => confirmContactChange({ kind: "phone", phone: pending!.phone, code }),
    onSuccess: (updated) => {
      setUser(updated);
      router.back();
    },
  });

  const error = request.error?.message ?? confirm.error?.message ?? null;

  if (pending) {
    const expired = isOtpExpired(timer);
    return (
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View className="gap-1">
          <Text className="text-sm text-neutral-500">We&apos;ve sent a one-time password (OTP) to</Text>
          <Text className="text-base text-neutral-900" testID="otp-destination">
            <Text className="font-semibold">{pending.phone}</Text> on{" "}
            <Text className="font-semibold">{CHANNEL_LABEL[pending.channel]}</Text>
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-800">Enter OTP</Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            className={`${inputClass} text-center text-2xl tracking-widest`}
            testID="otp-code"
          />
        </View>

        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

        <Pressable
          onPress={() => confirm.mutate()}
          disabled={confirm.isPending || code.length !== 6 || expired}
          className={primaryButtonClass}
          testID="otp-confirm"
        >
          <Text className="font-semibold text-white">
            {confirm.isPending ? "Verifying…" : "Verify & update"}
          </Text>
        </Pressable>

        <View className="items-center gap-3">
          {expired ? (
            <Text className="text-sm font-semibold text-red-600">
              Code has expired. Please request a new one.
            </Text>
          ) : (
            <Text className="text-sm text-neutral-500">
              Code expires in{" "}
              <Text className="font-semibold text-neutral-900">
                {formatOtpTime(timer.expirySeconds)}
              </Text>
            </Text>
          )}
          <Pressable
            onPress={() => request.mutate(pending)}
            disabled={!canResend(timer) || request.isPending}
          >
            <Text
              className={`text-sm font-semibold ${
                !canResend(timer) || request.isPending ? "text-neutral-400" : "text-black"
              }`}
            >
              {request.isPending
                ? "Resending…"
                : canResend(timer)
                  ? "Didn't receive the OTP? Resend"
                  : `Didn't receive the OTP? Resend in ${timer.cooldownSeconds}s`}
            </Text>
          </Pressable>
          {pending.channel === "whatsapp" ? (
            <Pressable
              onPress={() => request.mutate({ phone: pending.phone, channel: "sms" })}
              disabled={request.isPending}
              className={`${secondaryButtonClass} w-full`}
              testID="otp-send-sms"
            >
              <Text className="font-semibold text-neutral-900">Send OTP by SMS</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, gap: 16 }}>
      {user.phone ? (
        <Text className="text-sm text-neutral-500">
          Current number: <Text className="font-medium text-neutral-900">{user.phone}</Text>
        </Text>
      ) : null}
      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-800">New mobile number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+919876543210"
          keyboardType="phone-pad"
          autoComplete="tel"
          autoCapitalize="none"
          className={inputClass}
          testID="new-phone"
        />
      </View>
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
      <Pressable
        onPress={() => request.mutate({ phone: phone.trim(), channel: "whatsapp" })}
        disabled={request.isPending || !phone.trim()}
        className={primaryButtonClass}
        testID="send-otp"
      >
        <Text className="font-semibold text-white">
          {request.isPending ? "Sending OTP…" : "Send OTP on WhatsApp"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
