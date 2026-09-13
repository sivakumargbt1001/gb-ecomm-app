import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  RequestOtpSchema,
  SignupEmailSchema,
  type RequestOtpInput,
  type SignupEmailInput,
} from "@geekbase-labs/shared-types";

import { ConsentNotice } from "../../src/components/auth/consent-notice";
import { requestOtp, signupWithEmail } from "../../src/lib/auth-api";
import { useSiteTheme } from "../../src/lib/site-theme-context";
import { ReferralCodeField } from "../../src/components/auth/referral-code-field";
import { signupReferralCode } from "../../src/lib/referral";

type Method = "email" | "phone";

export default function SignupScreen() {
  const { siteName } = useSiteTheme();
  // Mobile first: an OTP asks nothing of the shopper but the phone in hand.
  const [method, setMethod] = useState<Method>("phone");
  const [emailSignupSuccess, setEmailSignupSuccess] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState("");
  // Held on the screen rather than in either form: the same code has to reach an
  // email signup and a phone signup, and the phone path only claims it on the
  // next screen, at OTP verification.
  const [referralCode, setReferralCode] = useState("");
  const [referralError, setReferralError] = useState<string | null>(null);

  const emailForm = useForm<SignupEmailInput>({
    resolver: zodResolver(SignupEmailSchema),
    defaultValues: { email: "", password: "" },
  });

  const phoneForm = useForm<RequestOtpInput>({
    resolver: zodResolver(RequestOtpSchema),
    // WhatsApp first; the OTP screen offers SMS as the fallback.
    defaultValues: { phone: "", channel: "whatsapp" },
  });

  const signupEmailMutation = useMutation({
    mutationFn: signupWithEmail,
    onSuccess: (_, variables) => {
      setSignedUpEmail(variables.email);
      setEmailSignupSuccess(true);
    },
  });

  const requestOtpMutation = useMutation({
    mutationFn: requestOtp,
    onSuccess: (_, variables) => {
      const referral = signupReferralCode(referralCode);
      router.push({
        pathname: "/(auth)/otp-verify",
        params: {
          phone: variables.phone,
          channel: variables.channel,
          // Carried to the next screen because that is where the account is
          // actually created, and attribution is claimed at creation.
          ...(referral.ok && referral.code ? { referralCode: referral.code } : {}),
        },
      });
    },
  });

  // A code that cannot be a code is refused here rather than at the server: the
  // signup would succeed either way, and the shopper would silently lose the
  // attribution they were sent a link for.
  function withReferral<T extends object>(
    submit: (data: T & { referralCode?: string }) => void,
  ) {
    return (data: T) => {
      const referral = signupReferralCode(referralCode);
      if (!referral.ok) {
        setReferralError(referral.error);
        return;
      }
      setReferralError(null);
      submit({ ...data, ...(referral.code ? { referralCode: referral.code } : {}) });
    };
  }

  if (emailSignupSuccess) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <View className="w-full max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-8">
          <Text
            testID="signup-verify-notice"
            className="text-center text-2xl font-bold text-gray-900"
          >
            Verify Your Email
          </Text>
          <Text className="text-center text-sm text-gray-500">
            We have sent a verification link to{" "}
            <Text className="font-semibold text-gray-900">{signedUpEmail}</Text>. Please check
            your inbox and tap the link to activate your account.
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable className="mt-2 items-center rounded-lg bg-black py-3">
              <Text className="font-semibold text-white">Go to Login</Text>
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
            Create Account
          </Text>
          <Text className="text-center text-sm text-gray-500">
            Join {siteName}. Your mobile number is all it takes.
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
              signupEmailMutation.reset();
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
          <View className="space-y-4">
            {signupEmailMutation.isError && (
              <Text className="text-sm font-medium text-red-600">
                {signupEmailMutation.error.message}
              </Text>
            )}

            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-900">Email Address</Text>
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    testID="signup-email"
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
              {emailForm.formState.errors.email && (
                <Text className="text-xs font-medium text-red-600">
                  {emailForm.formState.errors.email.message}
                </Text>
              )}
            </View>

            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-900">Password</Text>
              <Controller
                control={emailForm.control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    testID="signup-password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Minimum 8 characters"
                    secureTextEntry
                    autoCapitalize="none"
                    className="rounded-lg border border-gray-300 px-4 py-3"
                  />
                )}
              />
              {emailForm.formState.errors.password && (
                <Text className="text-xs font-medium text-red-600">
                  {emailForm.formState.errors.password.message}
                </Text>
              )}
            </View>

            <ReferralCodeField
              value={referralCode}
              onChange={setReferralCode}
              error={referralError}
            />

            <Pressable
              onPress={emailForm.handleSubmit(
                withReferral((data: SignupEmailInput) => signupEmailMutation.mutate(data)),
              )}
              disabled={signupEmailMutation.isPending}
              testID="signup-submit"
              className="items-center rounded-lg bg-black py-3 disabled:opacity-50"
            >
              <Text className="font-semibold text-white">
                {signupEmailMutation.isPending ? "Creating account..." : "Sign Up with Email"}
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
              <Text className="text-sm font-medium text-gray-900">Mobile number</Text>
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

            <ReferralCodeField
              value={referralCode}
              onChange={setReferralCode}
              error={referralError}
            />

            <Pressable
              onPress={phoneForm.handleSubmit(
                withReferral((data: RequestOtpInput) =>
                  requestOtpMutation.mutate({ phone: data.phone, channel: data.channel }),
                ),
              )}
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

        <Link href="/(auth)/login" asChild>
          <Pressable className="items-center rounded-lg border border-gray-300 py-3">
            <Text className="font-semibold text-gray-900">Sign In</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
