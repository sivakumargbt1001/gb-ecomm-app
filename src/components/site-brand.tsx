import { Image, Text } from "react-native";

import { useSiteTheme } from "../lib/site-theme-context";

// The store's identity in the navigation header: its logo when one is
// configured, its name otherwise. Used as the Home tab's headerTitle.
export function SiteBrand() {
  const theme = useSiteTheme();

  if (theme.logoUrl) {
    return (
      <Image
        testID="site-logo"
        source={{ uri: theme.logoUrl }}
        accessibilityLabel={theme.siteName}
        resizeMode="contain"
        style={{ width: 140, height: 28 }}
      />
    );
  }

  return (
    <Text
      testID="site-name"
      className="text-lg font-semibold"
      style={{ color: theme.colors.primary }}
    >
      {theme.siteName}
    </Text>
  );
}
