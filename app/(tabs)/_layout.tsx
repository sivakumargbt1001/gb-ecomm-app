import { Pressable, Text } from "react-native";
import { Link, Tabs } from "expo-router";

import { SiteBrand } from "../../src/components/site-brand";
import { useCart } from "../../src/lib/use-cart";
import { useSiteTheme } from "../../src/lib/site-theme-context";

export default function TabsLayout() {
  const { count } = useCart();
  const theme = useSiteTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.colors.accent,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: () => <SiteBrand />,
          headerRight: () => (
            <Link href="/search" asChild>
              <Pressable
                testID="search-open"
                className="px-4"
                accessibilityLabel="Search products"
              >
                <Text className="text-lg">🔍</Text>
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen name="wishlist" options={{ title: "Wishlist" }} />
      <Tabs.Screen
        name="cart"
        options={{ title: "Cart", tabBarBadge: count > 0 ? count : undefined }}
      />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
    </Tabs>
  );
}
