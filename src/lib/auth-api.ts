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

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
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
