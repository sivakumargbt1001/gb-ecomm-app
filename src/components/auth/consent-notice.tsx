import { Linking, Pressable, Text, View } from "react-native";

import { useSiteTheme } from "../../lib/site-theme-context";

// The policies live on the website; the app opens them in the browser. Set
// EXPO_PUBLIC_WEBSITE_URL for the store's real domain.
const WEBSITE_URL = process.env.EXPO_PUBLIC_WEBSITE_URL ?? "https://pimkart.com";

function PolicyLink({ path, label }: { path: string; label: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => Linking.openURL(`${WEBSITE_URL}${path}`)}
      hitSlop={4}
    >
      <Text className="text-xs text-gray-700 underline">{label}</Text>
    </Pressable>
  );
}

// Shown under every sign-in and sign-up form: continuing is how a shopper
// accepts the terms, so the terms have to be one tap away at that moment.
export function ConsentNotice() {
  const theme = useSiteTheme();
  return (
    <View
      testID="consent-notice"
      className="flex-row flex-wrap items-center justify-center gap-x-1"
    >
      <Text className="text-xs text-gray-500">
        By continuing, you agree to {theme.siteName}&apos;s
      </Text>
      <PolicyLink path="/terms" label="Conditions of Use" />
      <Text className="text-xs text-gray-500">and</Text>
      <PolicyLink path="/privacy" label="Privacy Notice" />
      <Text className="text-xs text-gray-500">.</Text>
    </View>
  );
}
