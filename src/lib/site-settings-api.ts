import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

export function fallbackSettings(): SiteSettings {
  return {
    ...DEFAULT_SITE_SETTINGS,
    socialLinks: {},
    promoBanners: [],
    updatedAt: new Date(0).toISOString(),
  };
}

// Public endpoint — no auth, and an out-of-window promo banner is already
// withheld by the backend. Never rejects: branding is decoration, and a failed
// settings call must not take a screen down with it.
export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const data = await apiFetch<{ settings: SiteSettings }>("/api/settings");
    return data.settings;
  } catch {
    return fallbackSettings();
  }
}
