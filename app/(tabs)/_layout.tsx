import { Tabs } from "expo-router";

import { useCart } from "../../src/lib/use-cart";

export default function TabsLayout() {
  const { count } = useCart();

  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen
        name="cart"
        options={{ title: "Cart", tabBarBadge: count > 0 ? count : undefined }}
      />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
    </Tabs>
  );
}
