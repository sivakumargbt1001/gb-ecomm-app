import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useSiteTheme } from "../../lib/site-theme-context";

const PERKS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "car-outline", label: "Track every order" },
  { icon: "bag-check-outline", label: "Easy 7-day returns" },
  { icon: "gift-outline", label: "Rewards on every purchase" },
  { icon: "sparkles-outline", label: "Early access to sales" },
];

// The frame around sign-in and sign-up, as on the website: the form in a
// card, then the dark panel selling the account underneath it — the thing
// the visitor came to do is the first thing they see.
export function AuthShell({ children }: { children: React.ReactNode }) {
  const { siteName } = useSiteTheme();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 24 }}
    >
      <View
        testID="auth-form"
        className="w-full max-w-md space-y-6 self-center rounded-2xl border border-gray-200 bg-white p-8"
      >
        {children}
      </View>

      <View
        testID="auth-perks"
        accessibilityLabel={`Why join ${siteName}`}
        className="w-full max-w-md self-center gap-8 rounded-2xl bg-gray-900 p-8"
      >
        <View className="gap-3">
          <Text className="text-2xl font-bold uppercase tracking-tight text-white">
            {siteName} <Text className="font-light">Rewards</Text>
          </Text>
          <Text className="text-lg text-white/90">
            Countless perks, for free. It does not get better than this.
          </Text>
        </View>
        <View className="gap-4">
          <Text className="text-sm font-semibold uppercase tracking-wide text-white/70">
            What you get
          </Text>
          {PERKS.map(({ icon, label }) => (
            <View key={label} className="flex-row items-center gap-4">
              <View className="h-11 w-11 items-center justify-center rounded-full border border-white/30">
                <Ionicons name={icon} size={20} color="#FFFFFF" />
              </View>
              <Text className="flex-1 text-base font-medium uppercase tracking-wide text-white">
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
