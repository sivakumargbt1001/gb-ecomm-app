import { Image } from "react-native";

import { useSiteTheme } from "../lib/site-theme-context";

// Bundled rather than put in DEFAULT_SITE_SETTINGS, mirroring the website's
// own fallback: a store that uploads its logo in admin settings overrides it.
const DEFAULT_LOGO = require("../../assets/pimkart-logo.png");

// The store's identity in the navigation header: its logo when one is
// configured, the shipped Pimkart logo otherwise. Used as the Home tab's
// headerTitle.
export function SiteBrand() {
  const theme = useSiteTheme();

  return (
    <Image
      testID="site-logo"
      source={theme.logoUrl ? { uri: theme.logoUrl } : DEFAULT_LOGO}
      accessibilityLabel={theme.siteName}
      resizeMode="contain"
      style={{ width: 140, height: 28 }}
    />
  );
}
