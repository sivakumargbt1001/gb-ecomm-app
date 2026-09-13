import "../global.css";

import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { apiFetch, refreshSession, setAuthToken } from "../src/lib/api-client";
import { useAuthStore } from "../src/lib/auth-store";
import { SiteThemeProvider } from "../src/lib/site-theme-context";
import { loadTokens } from "../src/lib/token-storage";
import { usePushRegistration } from "../src/lib/use-push-registration";

function PushRegistrar() {
  usePushRegistration();
  return null;
}

function AuthInitializer() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    let active = true;

    async function initAuth() {
      const tokens = await loadTokens();
      if (!tokens) {
        if (active) setUser(null);
        return;
      }

      setAuthToken(tokens.accessToken);
      const loadUser = () =>
        apiFetch<{ user: Parameters<typeof setUser>[0] }>("/api/auth/me");
      try {
        let data: Awaited<ReturnType<typeof loadUser>>;
        try {
          data = await loadUser();
        } catch {
          // The stored access token is 15 minutes old at most on a relaunch;
          // the refresh token is what actually keeps a shopper signed in.
          if (!(await refreshSession())) throw new Error("Session expired");
          data = await loadUser();
        }
        if (active) setUser(data.user);
      } catch {
        setAuthToken(null);
        if (active) setUser(null);
      }
    }

    void initAuth();
    return () => {
      active = false;
    };
  }, [setUser]);

  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SiteThemeProvider>
        <AuthInitializer />
        <PushRegistrar />
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </SiteThemeProvider>
    </QueryClientProvider>
  );
}
