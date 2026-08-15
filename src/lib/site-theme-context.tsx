import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchSiteSettings } from "./site-settings-api";
import { DEFAULT_SITE_THEME, themeFromSettings, type SiteTheme } from "./site-theme";

export const SITE_SETTINGS_QUERY_KEY = ["site-settings"] as const;

// The default is the shared fallback theme, so a consumer rendered outside the
// provider (or before the fetch resolves) still gets a usable store rather than
// throwing.
const SiteThemeContext = createContext<SiteTheme>(DEFAULT_SITE_THEME);

export function useSiteTheme(): SiteTheme {
  return useContext(SiteThemeContext);
}

export function SiteThemeProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: fetchSiteSettings,
    // Branding changes rarely and the app re-fetches on launch, which is the
    // cadence 5.1's phase scope asks for ("reflected on next load").
    staleTime: 5 * 60 * 1000,
  });

  const theme = useMemo(() => themeFromSettings(data), [data]);

  return (
    <SiteThemeContext.Provider value={theme}>{children}</SiteThemeContext.Provider>
  );
}
