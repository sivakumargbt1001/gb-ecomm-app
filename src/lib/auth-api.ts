import type {
  AuthTokens,
  ForgotPasswordInput,
  LoginEmailInput,
  RefreshTokenInput,
  RequestOtpInput,
  ResetPasswordInput,
  SignupEmailInput,
  User,
  VerifyOtpInput,
} from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";
import { getAnalyticsSessionId } from "./analytics-session";

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

// Sent only on the two routes that actually authenticate someone, which is where
// the backend links this shopper's guest analytics session to their user id.
// Attached per-call like cart-api's guestHeaders rather than inside apiFetch, so
// no other request pays for a SecureStore read.
async function analyticsHeaders(): Promise<Record<string, string>> {
  try {
    return { "X-Analytics-Session": await getAnalyticsSessionId() };
  } catch {
    // Losing attribution is acceptable; being unable to log in is not.
    return {};
  }
}

type AuthApiResponse = { user: User } & AuthTokens;

function splitAuthResponse(response: AuthApiResponse): AuthResult {
  const { user, accessToken, refreshToken } = response;
  return { user, tokens: { accessToken, refreshToken } };
}

export function signupWithEmail(data: SignupEmailInput): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/api/auth/signup", { method: "POST", body: data });
}

export async function loginWithEmail(data: LoginEmailInput): Promise<AuthResult> {
  const response = await apiFetch<AuthApiResponse>("/api/auth/login", {
    method: "POST",
    body: data,
    headers: await analyticsHeaders(),
  });
  return splitAuthResponse(response);
}

export function requestOtp(data: RequestOtpInput): Promise<void> {
  return apiFetch<void>("/api/auth/otp/request", { method: "POST", body: data });
}

export async function verifyOtp(data: VerifyOtpInput): Promise<AuthResult> {
  const response = await apiFetch<AuthApiResponse>("/api/auth/otp/verify", {
    method: "POST",
    body: data,
    headers: await analyticsHeaders(),
  });
  return splitAuthResponse(response);
}

export function forgotPassword(data: ForgotPasswordInput): Promise<void> {
  return apiFetch<void>("/api/auth/forgot-password", { method: "POST", body: data });
}

export function resetPassword(data: ResetPasswordInput): Promise<void> {
  return apiFetch<void>("/api/auth/reset-password", { method: "POST", body: data });
}

export function logout(data: RefreshTokenInput): Promise<void> {
  return apiFetch<void>("/api/auth/logout", { method: "POST", body: data });
}
