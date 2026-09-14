import { Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import type { ProductSort } from "@geekbase-labs/shared-types";

import { fetchProducts } from "../../lib/catalog-api";
import { fetchTrending } from "../../lib/recommendation-api";
import { useSiteTheme } from "../../lib/site-theme-context";
import { ProductCard } from "./product-card";

const RAIL_SIZE = 6;

// What an empty bag or wishlist shows instead of a blank screen: the message
// and a way back, centred, then what is new and what is selling — so the
// dead end becomes the start of a browse.
export function EmptyStateSuggestions({
  title,
  message,
  testID,
}: {
  title: string;
  message: string;
  testID: string;
}) {
  const theme = useSiteTheme();
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 24 }}>
      <View testID={testID} className="items-center px-6 py-12">
        <Text className="text-lg font-semibold text-neutral-900">{title}</Text>
        <Text className="mt-1 text-center text-sm text-neutral-500">{message}</Text>
        <Pressable
          onPress={() => router.navigate("/(tabs)")}
          className="mt-6 rounded-lg px-8 py-3"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="font-semibold text-white">Continue shopping</Text>
        </Pressable>
      </View>
      <SuggestionRail title="New arrivals" sort="newest" testID="new-arrivals" />
      <SuggestionRail title="Trending now" sort="relevance" testID="trending" />
    </ScrollView>
  );
}

function SuggestionRail({
  title,
  sort,
  testID,
}: {
  title: string;
  sort: ProductSort;
  testID: string;
}) {
  const query = useQuery({
    queryKey: ["suggestions", sort],
    queryFn: async () =>
      sort === "relevance"
        ? fetchTrending(RAIL_SIZE)
        : (await fetchProducts({ pageSize: RAIL_SIZE, sort })).items,
  });
  const products = query.data ?? [];
  if (products.length === 0) return null;

  return (
    <View testID={testID} className="gap-3 px-4 pb-6">
      <Text className="text-lg font-semibold text-neutral-900">{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-40" />
        ))}
      </ScrollView>
    </View>
  );
}
