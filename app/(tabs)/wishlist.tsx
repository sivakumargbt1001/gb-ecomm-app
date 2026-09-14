import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import type { WishlistItem } from "@geekbase-labs/shared-types";

import { EmptyStateSuggestions } from "../../src/components/catalog/empty-state-suggestions";
import { WishlistHeart } from "../../src/components/wishlist/wishlist-heart";
import { formatPaise } from "../../src/lib/catalog-api";
import { useAuthStore } from "../../src/lib/auth-store";
import { useCart } from "../../src/lib/use-cart";
import { useWishlist } from "../../src/lib/use-wishlist";

function WishlistRow({ item }: { item: WishlistItem }) {
  const { product } = item;
  const cover = product.images[0];
  const { add } = useCart();
  // A line saved from the bag remembers its size; a product hearted on its
  // own does not, so one with variants has a choice to make first and its
  // button leads to the product screen. A remembered size that has since
  // sold out counts as no size.
  const savedVariant = product.variants.find((v) => v.id === item.variantId && v.stock > 0);
  const needsChoice = product.variants.length > 0 && !savedVariant;
  const addToBag = (thenCheckout: boolean) =>
    add.mutate(
      {
        productId: product.id,
        variantId: savedVariant?.id ?? null,
        quantity: 1,
        customOptionValues: {},
      },
      {
        onSuccess: () => router.push(thenCheckout ? "/checkout" : "/(tabs)/cart"),
      },
    );

  return (
    <View className="border-b border-neutral-100 px-4 py-4" testID="wishlist-row">
      <View className="flex-row items-center gap-4">
        <Pressable
          className="flex-1 flex-row items-center gap-4"
          onPress={() => router.push(`/product/${product.slug}`)}
        >
          <View className="h-16 w-16 overflow-hidden rounded-lg bg-neutral-100">
            {cover ? (
              <Image source={{ uri: cover.url }} className="h-full w-full" resizeMode="cover" />
            ) : null}
          </View>
          <View className="flex-1 gap-1">
            <Text numberOfLines={2} className="text-base font-medium text-neutral-900">
              {product.name}
            </Text>
            {savedVariant ? (
              <Text className="text-sm text-neutral-500" testID="wishlist-variant">
                {savedVariant.name}
              </Text>
            ) : null}
            <Text className="text-sm text-neutral-500">
              {formatPaise(savedVariant?.priceInPaise ?? product.priceInPaise)}
            </Text>
          </View>
        </Pressable>

        <WishlistHeart productId={product.id} productName={product.name} />
      </View>

      <View className="mt-3 flex-row gap-2">
        {needsChoice ? (
          <Pressable
            onPress={() => router.push(`/product/${product.slug}`)}
            testID="wishlist-choose"
            className="flex-1 items-center rounded-lg bg-black py-2.5"
          >
            <Text className="text-sm font-semibold text-white">Choose options & buy</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => addToBag(false)}
              disabled={add.isPending}
              testID="wishlist-add"
              className="flex-1 items-center rounded-lg border border-neutral-300 py-2.5 disabled:opacity-50"
            >
              <Text className="text-sm font-semibold text-neutral-900">Add to bag</Text>
            </Pressable>
            <Pressable
              onPress={() => addToBag(true)}
              disabled={add.isPending}
              testID="wishlist-buy"
              className="flex-1 items-center rounded-lg bg-black py-2.5 disabled:opacity-50"
            >
              <Text className="text-sm font-semibold text-white">Buy now</Text>
            </Pressable>
          </>
        )}
      </View>
      {add.isError ? <Text className="mt-2 text-xs text-red-600">{add.error.message}</Text> : null}
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
        <Text className="text-lg font-semibold text-neutral-900">Sign in to see your wishlist</Text>
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
      <EmptyStateSuggestions
        testID="wishlist-empty"
        title="Nothing saved yet"
        message="Tap the heart on a product to keep it here for later."
      />
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
