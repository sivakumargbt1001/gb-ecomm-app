import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { cardColorSwatches, type Product } from "@geekbase-labs/shared-types";

// The colours a product comes in, as a row of small circles under its name
// on a card — each the colour's own photo when the merchant tagged one, a
// plain dot in that colour otherwise — and "+N" for the rest. Each opens the
// product on that colour. Silent for a single-colour product.
export function ColorSwatches({
  product,
}: {
  product: Pick<Product, "slug" | "variants" | "images">;
}) {
  const { swatches, more } = cardColorSwatches(product.variants, product.images);
  if (swatches.length === 0) return null;

  return (
    <View
      testID="color-swatches"
      accessibilityLabel={`Available in ${swatches.length + more} colours`}
      className="flex-row items-center gap-1.5"
    >
      {swatches.map((swatch) => (
        <Pressable
          key={swatch.color}
          testID={`color-swatch-${swatch.color}`}
          accessibilityRole="link"
          accessibilityLabel={swatch.color}
          hitSlop={6}
          onPress={() =>
            router.push({
              pathname: "/product/[slug]",
              params: { slug: product.slug, color: swatch.color },
            })
          }
          className="h-5 w-5 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100"
          // React Native accepts CSS colour names; an unknown one is ignored
          // and the neutral background shows through.
          style={swatch.imageUrl ? undefined : { backgroundColor: swatch.color.toLowerCase() }}
        >
          {swatch.imageUrl ? (
            <Image source={{ uri: swatch.imageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : null}
        </Pressable>
      ))}
      {more > 0 ? (
        <Text testID="color-swatches-more" className="text-xs text-neutral-500">
          +{more}
        </Text>
      ) : null}
    </View>
  );
}
