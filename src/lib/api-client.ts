import { clearTokens, loadTokens, saveTokens } from "./token-storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

// Routes where a 401 is the answer rather than an expired access token.
// Refreshing on /me would also loop when the refresh token itself is gone.
const NO_REFRESH_PREFIX = "/api/auth/";

// The access token lives 15 minutes; the refresh token rotates on every use.
// One in-flight refresh is shared by every request that hits a 401 at the same
// time, so a burst of expired calls spends the refresh token once rather than
// racing to reuse a token the first call already revoked.
let refreshInFlight: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const stored = await loadTokens();
  if (!stored) return false;

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: stored.refreshToken }),
  });
  if (!response.ok) {
    // Revoked or expired: these tokens will never work again, and keeping them
    // would make every launch retry a refresh that cannot succeed.
    if (response.status === 401 || response.status === 400) {
      await clearTokens();
      setAuthToken(null);
    }
    return false;
  }

  const tokens = (await response.json()) as { accessToken: string; refreshToken: string };
  await saveTokens(tokens);
  setAuthToken(tokens.accessToken);
  return true;
}

export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh()
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { body, headers, ...rest } = options;

  const send = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response = await send();

  // An expired access token is the ordinary case for anyone who opened the app
  // more than 15 minutes after signing in; refresh once and replay rather than
  // surface it. The replay picks up the new token through `authToken`.
  if (
    response.status === 401 &&
    authToken !== null &&
    !path.startsWith(NO_REFRESH_PREFIX) &&
    (await refreshSession())
  ) {
    response = await send();
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
