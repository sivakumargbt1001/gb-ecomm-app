import type {
  AuthTokens,
  ChangePasswordInput,
  ConfirmContactChangeInput,
  RequestContactChangeInput,
  UpdateProfileInput,
  User,
} from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const data = await apiFetch<{ user: User }>("/api/account/profile", {
    method: "PATCH",
    body: input,
  });
  return data.user;
}

// Every other session is signed out by this; the tokens that come back are
// the one that survives, and must replace what SecureStore holds.
export async function changePassword(
  input: ChangePasswordInput,
): Promise<{ user: User; tokens: AuthTokens }> {
  const { user, accessToken, refreshToken } = await apiFetch<{ user: User } & AuthTokens>(
    "/api/account/password",
    { method: "POST", body: input },
  );
  return { user, tokens: { accessToken, refreshToken } };
}

export function requestContactChange(input: RequestContactChangeInput): Promise<void> {
  return apiFetch<void>("/api/account/contact/request", { method: "POST", body: input });
}

export async function confirmContactChange(input: ConfirmContactChangeInput): Promise<User> {
  const data = await apiFetch<{ user: User }>("/api/account/contact/confirm", {
    method: "POST",
    body: input,
  });
  return data.user;
}
