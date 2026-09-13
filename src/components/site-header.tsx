import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCatalogFilterStore } from "../lib/catalog-filter-store";
import { useSiteTheme } from "../lib/site-theme-context";
import { SiteBrand } from "./site-brand";

// The chrome every tab shares, the way a marketplace app keeps its search box
// in reach on every screen: the menu button, the store's logo, and a search
// bar that opens the search screen (or starts listening, from the mic).
export function SiteHeader() {
  const theme = useSiteTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openMenu = useCatalogFilterStore((state) => state.openMenu);

  return (
    <View
      testID="site-header"
      className="border-b border-neutral-100 bg-white"
      style={{ paddingTop: insets.top }}
    >
      <View className="h-14 flex-row items-center">
        <Pressable
          testID="catalog-menu-open"
          onPress={openMenu}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          className="h-14 w-14 items-center justify-center"
        >
          <Ionicons name="menu" size={26} color={theme.colors.primary} />
        </Pressable>
        <View className="flex-1 items-center">
          <SiteBrand />
        </View>
        {/* Balances the menu button so the logo sits on the true centre. */}
        <View className="w-14" />
      </View>

      <View className="flex-row items-center gap-2 px-4 pb-3">
        <Pressable
          testID="search-bar"
          onPress={() => router.push("/search")}
          accessibilityRole="search"
          accessibilityLabel="Search products"
          className="h-11 flex-1 flex-row items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 pl-3"
        >
          <Ionicons name="search-outline" size={20} color="#737373" />
          <Text className="flex-1 text-[15px] text-neutral-500">Search products</Text>
          <Pressable
            testID="search-voice"
            onPress={() => router.push("/search?voice=1")}
            accessibilityRole="button"
            accessibilityLabel="Search by voice"
            hitSlop={8}
            className="h-11 w-11 items-center justify-center"
          >
            <Ionicons name="mic-outline" size={22} color={theme.colors.primary} />
          </Pressable>
        </Pressable>
      </View>
    </View>
  );
}
