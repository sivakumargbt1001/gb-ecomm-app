import type React from "react";
import { type ColorValue, Image } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { SiteHeader } from "../../src/components/site-header";
import { CatalogMenu } from "../../src/components/storefront/catalog-menu";
import { useCart } from "../../src/lib/use-cart";
import { useSiteTheme } from "../../src/lib/site-theme-context";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// The store's own mark stands in for a generic cart glyph, as on the website.
const CART_MARK = require("../../assets/pimkart-cart-mark.png");

function CartTabIcon({ size, focused }: { size: number; focused: boolean }) {
  return (
    <Image
      source={CART_MARK}
      resizeMode="contain"
      style={{ width: size, height: size, opacity: focused ? 1 : 0.6 }}
    />
  );
}

function tabIcon(focusedName: IconName, name: IconName) {
  return function TabIcon({
    color,
    size,
    focused,
  }: {
    color: ColorValue;
    size: number;
    focused: boolean;
  }) {
    return <Ionicons name={focused ? focusedName : name} color={color} size={size} />;
  };
}

export default function TabsLayout() {
  const { count } = useCart();
  const theme = useSiteTheme();

  return (
    <>
      {/* Mounted once, above every tab, so the menu opens from any of them. */}
      <CatalogMenu />
      <Tabs
        screenOptions={{
          header: () => <SiteHeader />,
          tabBarActiveTintColor: theme.colors.accent,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Home", tabBarIcon: tabIcon("home", "home-outline") }}
        />
        <Tabs.Screen name="wishlist" options={{ title: "Wishlist", tabBarIcon: tabIcon("heart", "heart-outline") }} />
        <Tabs.Screen
          name="cart"
          options={{
            title: "Cart",
            tabBarIcon: CartTabIcon,
            tabBarBadge: count > 0 ? count : undefined,
          }}
        />
        <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: tabIcon("receipt", "receipt-outline") }} />
        <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: tabIcon("person", "person-outline") }} />
      </Tabs>
    </>
  );
}
