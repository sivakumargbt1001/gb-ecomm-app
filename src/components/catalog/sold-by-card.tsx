import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { StoreProfile } from "@geekbase-labs/shared-types";

import { RatingStars } from "../reviews/rating-stars";

// Who a shopper is buying from. A merchant's store shows its logo, rating
// across everything it sells and how much that is, with a way through to the
// store screen; a listing the site itself sells names the site, with no link.
export function SoldByCard({
  store,
  siteName,
}: {
  store: StoreProfile | null;
  siteName: string;
}) {
  const router = useRouter();

  return (
    <View
      testID="sold-by"
      className="gap-3 rounded-xl border border-neutral-200 p-4"
    >
      <Text className="text-base font-semibold text-neutral-900">Sold by</Text>
      {store ? (
        <View className="flex-row items-center gap-3">
          <StoreAvatar store={store} size={56} />
          <View className="flex-1 gap-1">
            <Text
              testID="sold-by-name"
              className="text-base font-semibold text-neutral-900"
              numberOfLines={1}
            >
              {store.name}
            </Text>
            <StoreStats store={store} />
          </View>
          <Pressable
            testID="view-shop"
            onPress={() => router.push(`/store/${store.slug}`)}
            accessibilityRole="button"
            accessibilityLabel={`View ${store.name}`}
            className="rounded-lg border border-neutral-900 px-3 py-2"
          >
            <Text className="text-sm font-semibold text-neutral-900">
              View shop
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <Ionicons name="storefront-outline" size={24} color="#737373" />
          </View>
          <Text
            testID="sold-by-name"
            className="text-base font-semibold text-neutral-900"
          >
            {siteName}
          </Text>
        </View>
      )}
    </View>
  );
}

export function StoreAvatar({
  store,
  size,
}: {
  store: Pick<StoreProfile, "logoUrl">;
  size: number;
}) {
  return store.logoUrl ? (
    <Image
      source={{ uri: store.logoUrl }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="border border-neutral-200"
      resizeMode="cover"
    />
  ) : (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-neutral-100"
    >
      <Ionicons name="storefront-outline" size={size * 0.45} color="#737373" />
    </View>
  );
}

// Rating, how many ratings, and how many products — the row every
// marketplace puts under a seller's name.
export function StoreStats({
  store,
}: {
  store: Pick<StoreProfile, "averageRating" | "ratingCount" | "productCount">;
}) {
  return (
    <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
      {store.averageRating !== null ? (
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-semibold text-neutral-900">
            {store.averageRating.toFixed(1)}
          </Text>
          <RatingStars rating={store.averageRating} className="text-xs" />
          <Text className="text-sm text-neutral-500">
            {store.ratingCount.toLocaleString("en-IN")}{" "}
            {store.ratingCount === 1 ? "rating" : "ratings"}
          </Text>
        </View>
      ) : (
        <Text className="text-sm text-neutral-500">No ratings yet</Text>
      )}
      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-semibold text-neutral-900">
          {store.productCount.toLocaleString("en-IN")}
        </Text>
        <Text className="text-sm text-neutral-500">
          {store.productCount === 1 ? "product" : "products"}
        </Text>
      </View>
    </View>
  );
}
