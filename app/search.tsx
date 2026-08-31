import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { SEARCH_QUERY_MAX } from "@geekbase-labs/shared-types";

import { ProductCard } from "../src/components/catalog/product-card";
import { searchScreenState } from "../src/lib/search";
import { useProductSearch } from "../src/lib/use-product-search";

export default function SearchScreen() {
  const [input, setInput] = useState("");
  const search = useProductSearch(input);

  const state = searchScreenState({
    query: search.query,
    isLoading: search.isLoading,
    isError: search.isError,
    total: search.total,
  });

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: true, title: "Search" }} />

      <View className="border-b border-neutral-100 p-4">
        <TextInput
          testID="search-input"
          value={input}
          onChangeText={setInput}
          placeholder="Search products"
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          maxLength={SEARCH_QUERY_MAX}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </View>

      {state === "results" ? (
        <FlatList
          testID="search-results"
          data={search.items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ gap: 16, padding: 16 }}
          columnWrapperStyle={{ gap: 16 }}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (search.hasNextPage && !search.isFetchingNextPage) {
              void search.fetchNextPage();
            }
          }}
          ListFooterComponent={
            search.isFetchingNextPage ? (
              <ActivityIndicator className="my-4" />
            ) : null
          }
          renderItem={({ item }) => (
            <ProductCard product={item} className="flex-1" />
          )}
        />
      ) : (
        <Message state={state} query={search.query} onRetry={search.refetch} />
      )}
    </View>
  );
}

function Message({
  state,
  query,
  onRetry,
}: {
  state: "prompt" | "loading" | "error" | "empty";
  query: string;
  onRetry: () => void;
}) {
  if (state === "loading") {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-3 px-6">
      <Text testID="search-message" className="text-center text-neutral-500">
        {state === "prompt"
          ? "Type to search the catalogue."
          : state === "error"
            ? "Could not run that search."
            : `No products match "${query}".`}
      </Text>
      {state === "error" ? (
        <Pressable
          onPress={onRetry}
          className="rounded-lg border border-neutral-300 px-4 py-2"
        >
          <Text className="text-neutral-700">Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
