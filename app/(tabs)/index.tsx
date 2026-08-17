import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { ProductSort } from "@geekbase-labs/shared-types";

import { ProductCard } from "../../src/components/catalog/product-card";
import { fetchCategories, fetchProducts } from "../../src/lib/catalog-api";

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "name_asc", label: "A–Z" },
];

export default function CatalogScreen() {
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const [sort, setSort] = useState<ProductSort>("newest");

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const productsQuery = useQuery({
    queryKey: ["products", categorySlug, sort],
    queryFn: () => fetchProducts({ categorySlug, sort }),
  });

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-14 border-b border-neutral-100"
        contentContainerStyle={{ alignItems: "center", gap: 8, paddingHorizontal: 16 }}
      >
        <Chip
          label="All"
          active={categorySlug === undefined}
          onPress={() => setCategorySlug(undefined)}
        />
        {(categoriesQuery.data ?? []).map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            active={categorySlug === category.slug}
            onPress={() => setCategorySlug(category.slug)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12 border-b border-neutral-100"
        contentContainerStyle={{ alignItems: "center", gap: 8, paddingHorizontal: 16 }}
      >
        {SORTS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={sort === option.value}
            onPress={() => setSort(option.value)}
          />
        ))}
      </ScrollView>

      {productsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : productsQuery.isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-neutral-500">
            Could not load products.
          </Text>
        </View>
      ) : (
        <FlatList
          testID="product-list"
          data={productsQuery.data?.items ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ gap: 16, padding: 16 }}
          columnWrapperStyle={{ gap: 16 }}
          ListEmptyComponent={
            <Text className="mt-16 text-center text-neutral-500">
              No products found.
            </Text>
          }
          renderItem={({ item }) => (
            <ProductCard product={item} className="flex-1" />
          )}
        />
      )}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${
        active ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
      }`}
    >
      <Text className={active ? "text-sm text-white" : "text-sm text-neutral-700"}>
        {label}
      </Text>
    </Pressable>
  );
}
