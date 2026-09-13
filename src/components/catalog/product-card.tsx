import { Image, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import type { Product } from "@geekbase-labs/shared-types";

import { WishlistHeart } from "../wishlist/wishlist-heart";
import { formatPaise, totalStock } from "../../lib/catalog-api";

// Extracted from the catalog tab so the recommendations row renders the same
// card. `className` carries only the caller's layout — the grid stretches its
// cards, the recommendations row gives them a fixed width.
export function ProductCard({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const stock = totalStock(product);
  const cover = product.images[0];

  return (
    <View
      testID="product-card"
      className={`overflow-hidden rounded-xl border border-neutral-200 ${className}`}
    >
      {/* A sibling of the Link, not a child: nesting it would make every tap on
          the heart navigate as well. */}
      <View className="absolute right-2 top-2 z-10">
        <WishlistHeart productId={product.id} productName={product.name} />
      </View>
      <Link href={`/product/${product.slug}`} asChild>
        <Pressable>
          <View className="aspect-square bg-neutral-100">
            {cover ? (
              <Image
                source={{ uri: cover.url }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Text className="text-xs text-neutral-400">No image</Text>
              </View>
            )}
          </View>
          <View className="gap-1 p-3">
            {product.brand ? (
              <Text
                numberOfLines={1}
                className="text-xs uppercase tracking-wide text-neutral-500"
              >
                {product.brand}
              </Text>
            ) : null}
            <Text numberOfLines={2} className="font-medium text-neutral-900">
              {product.name}
            </Text>
            <Text className="font-semibold text-neutral-900">
              {formatPaise(product.priceInPaise)}
            </Text>
            {stock !== null && stock <= 0 ? (
              <Text className="text-xs text-red-500">Sold out</Text>
            ) : null}
          </View>
        </Pressable>
      </Link>
    </View>
  );
}
