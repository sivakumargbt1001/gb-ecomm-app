import { ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { ProductCard } from "./product-card";
import { fetchRecommendations } from "../../lib/recommendation-api";
import { recommendationSection } from "../../lib/recommendations";

export function ProductRecommendations({ productId }: { productId: string }) {
  const query = useQuery({
    queryKey: ["recommendations", productId],
    queryFn: () => fetchRecommendations(productId),
    enabled: Boolean(productId),
  });

  const state = recommendationSection({
    isLoading: query.isLoading,
    isError: query.isError,
    items: query.data,
  });
  if (state === "hidden") return null;

  return (
    <View
      testID="product-recommendations"
      className="gap-4 border-t border-neutral-200 pt-6"
    >
      <Text className="text-lg font-semibold text-neutral-900">
        Customers also bought
      </Text>
      {/* Horizontal on a phone: four cards down the page would push the reviews
          section out of reach. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {query.data!.map((product) => (
          <ProductCard key={product.id} product={product} className="w-40" />
        ))}
      </ScrollView>
    </View>
  );
}
