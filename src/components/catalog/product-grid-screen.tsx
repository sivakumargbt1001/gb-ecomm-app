import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { ProductSort } from "@geekbase-labs/shared-types";

import { SORTS } from "../storefront/catalog-menu";
import { fetchProducts, type CatalogQuery } from "../../lib/catalog-api";
import { ProductCard } from "./product-card";

// A grid of every product matching one filter — a brand, a store — with the
// sort row the home grid has. The header is whatever the screen puts above
// it: a store's banner and numbers, or a brand's name.
export function ProductGridScreen({
  queryKey,
  query,
  header,
  emptyText,
}: {
  queryKey: readonly unknown[];
  query: Omit<CatalogQuery, "sort">;
  header?: React.ReactNode;
  emptyText: string;
}) {
  const [sort, setSort] = useState<ProductSort>("relevance");
  const productsQuery = useQuery({
    queryKey: [...queryKey, sort],
    queryFn: () => fetchProducts({ ...query, sort }),
  });
  const total = productsQuery.data?.total;

  const listHeader = (
    <View>
      {header}
      <View className="flex-row items-center justify-between py-3">
        <Text className="text-sm font-medium text-neutral-900">
          {total === undefined
            ? "All products"
            : `${total} ${total === 1 ? "product" : "products"}`}
        </Text>
        <SortPicker value={sort} onChange={setSort} />
      </View>
    </View>
  );

  if (productsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }
  if (productsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-neutral-500">
          Could not load products.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      testID="product-list"
      className="flex-1 bg-white"
      data={productsQuery.data?.items ?? []}
      keyExtractor={(item) => item.id}
      numColumns={2}
      ListHeaderComponent={listHeader}
      contentContainerStyle={{ gap: 16, padding: 16 }}
      columnWrapperStyle={{ gap: 16 }}
      ListEmptyComponent={
        <Text className="mt-16 text-center text-neutral-500">{emptyText}</Text>
      }
      renderItem={({ item }) => (
        <ProductCard product={item} className="flex-1" />
      )}
    />
  );
}

// Cycles through the sorts on tap: one control, no sheet, for a row that has
// little room beside the count.
function SortPicker({
  value,
  onChange,
}: {
  value: ProductSort;
  onChange: (next: ProductSort) => void;
}) {
  const index = SORTS.findIndex((option) => option.value === value);
  const label = SORTS[index]?.label ?? "Relevance";
  return (
    <Pressable
      testID="sort-picker"
      onPress={() => onChange(SORTS[(index + 1) % SORTS.length]!.value)}
      accessibilityRole="button"
      accessibilityLabel={`Sort by ${label}. Tap for the next sort.`}
      className="flex-row items-center gap-1 rounded-full border border-neutral-300 px-3 py-1"
    >
      <Text className="text-xs text-neutral-700">Sort: {label}</Text>
    </Pressable>
  );
}
