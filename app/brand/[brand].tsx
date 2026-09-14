import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import { ProductGridScreen } from "../../src/components/catalog/product-grid-screen";

// Every listing under one brand name — where the brand line on a product
// leads. The name comes off the route as the product spelled it.
export default function BrandScreen() {
  const { brand: raw } = useLocalSearchParams<{ brand: string }>();
  const brand = decodeURIComponent(raw ?? "").trim();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: brand }} />
      <ProductGridScreen
        queryKey={["products", "brand", brand]}
        query={{ brand }}
        emptyText="No products under this brand yet."
        header={
          <View className="pb-1">
            <Text testID="brand-name" className="text-2xl font-semibold text-neutral-900">
              {brand}
            </Text>
          </View>
        }
      />
    </>
  );
}
