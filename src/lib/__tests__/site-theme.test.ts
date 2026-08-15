import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@geekbase-labs/shared-types";

import { apiFetch } from "../api-client";
import { fetchSiteSettings } from "../site-settings-api";
import { DEFAULT_SITE_THEME, themeFromSettings } from "../site-theme";

jest.mock("../api-client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function settings(overrides: Partial<SiteSettings> = {}): SiteSettings {
  return {
    ...DEFAULT_SITE_SETTINGS,
    socialLinks: {},
    promoBanner: null,
    updatedAt: "2026-08-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("themeFromSettings", () => {
  it("falls back to the shared defaults before settings have loaded", () => {
    expect(themeFromSettings(undefined)).toEqual(DEFAULT_SITE_THEME);
    expect(DEFAULT_SITE_THEME.siteName).toBe(DEFAULT_SITE_SETTINGS.siteName);
    expect(DEFAULT_SITE_THEME.logoUrl).toBeNull();
  });

  it("maps configured branding onto the theme", () => {
    const theme = themeFromSettings(
      settings({
        siteName: "Geekbase Silks",
        logoUrl: "https://cdn.example.com/logo.png",
        primaryColor: "#a31621",
        secondaryColor: "#fcf7f8",
        accentColor: "#4c956c",
      }),
    );

    expect(theme.siteName).toBe("Geekbase Silks");
    expect(theme.logoUrl).toBe("https://cdn.example.com/logo.png");
    expect(theme.colors.primary).toBe("#a31621");
    expect(theme.colors.secondary).toBe("#fcf7f8");
    expect(theme.colors.accent).toBe("#4c956c");
  });

  it("keeps the default colour when a stored value is not a hex colour", () => {
    const theme = themeFromSettings(settings({ primaryColor: "rebeccapurple" }));
    expect(theme.colors.primary).toBe(DEFAULT_SITE_THEME.colors.primary);
  });

  it("treats an empty site name as unset rather than rendering a blank header", () => {
    const theme = themeFromSettings(settings({ siteName: "   " }));
    expect(theme.siteName).toBe(DEFAULT_SITE_THEME.siteName);
  });
});

describe("fetchSiteSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads the public settings endpoint and unwraps it", async () => {
    mockApiFetch.mockResolvedValue({ settings: settings({ siteName: "Silks" }) });

    const result = await fetchSiteSettings();

    expect(mockApiFetch).toHaveBeenCalledWith("/api/settings");
    expect(result.siteName).toBe("Silks");
  });

  // Branding is decoration: a shopper must still be able to use the app when the
  // settings call fails, so this never rejects.
  it("falls back to the defaults when the request fails", async () => {
    mockApiFetch.mockRejectedValue(new Error("offline"));

    const result = await fetchSiteSettings();

    expect(result.siteName).toBe(DEFAULT_SITE_SETTINGS.siteName);
    expect(result.promoBanner).toBeNull();
  });
});
