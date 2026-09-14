import { ActivityIndicator, Image, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { ProductGridScreen } from "../../src/components/catalog/product-grid-screen";
import { StoreAvatar, StoreStats } from "../../src/components/catalog/sold-by-card";
import { fetchStore } from "../../src/lib/catalog-api";

// A merchant's shopfront: banner, logo, name and numbers, then everything
// they sell — where a product's "View shop" leads.
export default function StoreScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const storeQuery = useQuery({
    queryKey: ["store", slug],
    queryFn: () => fetchStore(slug),
    enabled: Boolean(slug),
  });

  if (storeQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }
  if (storeQuery.isError || !storeQuery.data) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Store" }} />
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="text-center text-neutral-500">Store not found.</Text>
        </View>
      </>
    );
  }

  const store = storeQuery.data;
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: store.name }} />
      <ProductGridScreen
        queryKey={["products", "store", store.slug]}
        query={{ storeSlug: store.slug }}
        emptyText="This store has no products yet."
        header={
          <View testID="store-header" className="gap-4 pb-2">
            {store.bannerUrl ? (
              <Image
                testID="store-banner"
                source={{ uri: store.bannerUrl }}
                className="aspect-[3/1] w-full rounded-xl"
                resizeMode="cover"
              />
            ) : null}
            <View className="flex-row items-center gap-4">
              <StoreAvatar store={store} size={72} />
              <View className="flex-1 gap-1">
                <Text
                  testID="store-name"
                  className="text-2xl font-semibold text-neutral-900"
                >
                  {store.name}
                </Text>
                <StoreStats store={store} />
              </View>
            </View>
            {store.about ? (
              <Text className="text-sm leading-5 text-neutral-600">
                {store.about}
              </Text>
            ) : null}
          </View>
        }
      />
    </>
  );
}
