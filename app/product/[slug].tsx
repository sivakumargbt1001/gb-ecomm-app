import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { OptionField } from "../../src/components/catalog/option-field";
import {
  fetchProduct,
  fetchProductOptionFields,
  formatPaise,
} from "../../src/lib/catalog-api";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const productQuery = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
    enabled: Boolean(slug),
  });

  const optionFieldsQuery = useQuery({
    queryKey: ["product", slug, "option-fields"],
    queryFn: () => fetchProductOptionFields(slug),
    enabled: Boolean(slug),
  });

  if (productQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-neutral-500">Product not found.</Text>
      </View>
    );
  }

  const product = productQuery.data;
  const cover = product.images[0];
  const optionFields = optionFieldsQuery.data ?? [];

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: product.name }} />
      <ScrollView className="flex-1 bg-white" testID="product-detail">
        <View className="aspect-square bg-neutral-100">
          {cover ? (
            <Image
              source={{ uri: cover.url }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Text className="text-neutral-400">No image</Text>
            </View>
          )}
        </View>

        <View className="gap-6 p-5">
          <View className="gap-1">
            <Text className="text-2xl font-semibold text-neutral-900">
              {product.name}
            </Text>
            <Text className="text-xl font-semibold text-neutral-900">
              {formatPaise(product.priceInPaise)}
            </Text>
          </View>

          {product.description ? (
            <Text className="text-neutral-600">{product.description}</Text>
          ) : null}

          {product.variants.length > 0 ? (
            <View className="gap-2">
              <Text className="text-sm font-medium text-neutral-800">Options</Text>
              <View className="flex-row flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <View
                    key={variant.id}
                    testID="variant"
                    className={`rounded-lg border px-3 py-1.5 ${
                      variant.stock > 0 ? "border-neutral-300" : "border-neutral-200"
                    }`}
                  >
                    <Text
                      className={
                        variant.stock > 0
                          ? "text-sm text-neutral-800"
                          : "text-sm text-neutral-400 line-through"
                      }
                    >
                      {variant.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {optionFields.length > 0 ? (
            <View className="gap-4 rounded-xl border border-neutral-200 p-4">
              <Text className="text-sm font-medium text-neutral-800">
                Customize your order
              </Text>
              {optionFields.map((field) => (
                <OptionField key={field.id} field={field} />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
