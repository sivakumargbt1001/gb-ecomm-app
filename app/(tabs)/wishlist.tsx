import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import type { WishlistItem } from "@geekbase-labs/shared-types";

import { WishlistHeart } from "../../src/components/wishlist/wishlist-heart";
import { formatPaise } from "../../src/lib/catalog-api";
import { useAuthStore } from "../../src/lib/auth-store";
import { useWishlist } from "../../src/lib/use-wishlist";

function WishlistRow({ item }: { item: WishlistItem }) {
  const { product } = item;
  const cover = product.images[0];

  return (
    <View
      className="flex-row items-center gap-4 border-b border-neutral-100 px-4 py-4"
      testID="wishlist-row"
    >
      <Pressable
        className="flex-1 flex-row items-center gap-4"
        onPress={() => router.push(`/product/${product.slug}`)}
      >
        <View className="h-16 w-16 overflow-hidden rounded-lg bg-neutral-100">
          {cover ? (
            <Image
              source={{ uri: cover.url }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : null}
        </View>
        <View className="flex-1 gap-1">
          <Text numberOfLines={2} className="text-base font-medium text-neutral-900">
            {product.name}
          </Text>
          <Text className="text-sm text-neutral-500">
            {formatPaise(product.priceInPaise)}
          </Text>
        </View>
      </Pressable>

      <WishlistHeart productId={product.id} productName={product.name} />
    </View>
  );
}

export default function WishlistScreen() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const { items, isLoading, error } = useWishlist(Boolean(user));

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold text-neutral-900">
          Sign in to see your wishlist
        </Text>
        <Text className="mt-1 text-center text-sm text-neutral-500">
          Products you save are kept here across your devices.
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable className="mt-6 rounded-lg bg-black px-8 py-3">
            <Text className="font-semibold text-white">Log In</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-sm text-red-600" testID="wishlist-error">
          {error.message}
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold text-neutral-900">
          Nothing saved yet
        </Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Tap the heart on a product to keep it here.
        </Text>
        <Pressable
          onPress={() => router.navigate("/(tabs)")}
          className="mt-6 rounded-lg bg-black px-8 py-3"
        >
          <Text className="font-semibold text-white">Browse Products</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" testID="wishlist-screen">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WishlistRow item={item} />}
      />
    </View>
  );
}
