import {
  DEFAULT_SITE_SETTINGS,
  HexColorSchema,
  type SiteSettings,
} from "@geekbase-labs/shared-types";

export type SiteTheme = {
  siteName: string;
  logoUrl: string | null;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

export const DEFAULT_SITE_THEME: SiteTheme = {
  siteName: DEFAULT_SITE_SETTINGS.siteName,
  logoUrl: DEFAULT_SITE_SETTINGS.logoUrl,
  colors: {
    primary: DEFAULT_SITE_SETTINGS.primaryColor,
    secondary: DEFAULT_SITE_SETTINGS.secondaryColor,
    accent: DEFAULT_SITE_SETTINGS.accentColor,
  },
};

// Colours reach the app as raw strings and go straight into style props, so
// anything that isn't a hex colour falls back rather than being handed to the
// native layer.
function safeColor(value: string, fallback: string): string {
  return HexColorSchema.safeParse(value).success ? value : fallback;
}

export function themeFromSettings(settings: SiteSettings | undefined): SiteTheme {
  if (!settings) return DEFAULT_SITE_THEME;

  return {
    siteName: settings.siteName.trim() || DEFAULT_SITE_THEME.siteName,
    logoUrl: settings.logoUrl,
    colors: {
      primary: safeColor(settings.primaryColor, DEFAULT_SITE_THEME.colors.primary),
      secondary: safeColor(
        settings.secondaryColor,
        DEFAULT_SITE_THEME.colors.secondary,
      ),
      accent: safeColor(settings.accentColor, DEFAULT_SITE_THEME.colors.accent),
    },
  };
}
