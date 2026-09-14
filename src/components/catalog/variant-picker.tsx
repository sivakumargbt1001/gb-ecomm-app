import { Image, Pressable, ScrollView, Text, View } from "react-native";
import {
  colorSummary,
  discountPercent,
  findVariant,
  imagesForColor,
  sameOption,
  variantColors,
  variantForColor,
  variantSizes,
  type ProductImage,
  type ProductVariant,
} from "@geekbase-labs/shared-types";

import { formatPaise } from "../../lib/catalog-api";

// Colour cards and size chips over a product's SKUs, using the same shared
// selection rules as the website: a size is tappable only when that exact
// colour/size SKU exists and has stock.
export function VariantPicker({
  variants,
  images,
  selected,
  onSelect,
}: {
  variants: ProductVariant[];
  images: ProductImage[];
  selected: ProductVariant | undefined;
  onSelect: (variantId: string) => void;
}) {
  const colors = variantColors(variants);
  const sizes = variantSizes(variants);
  const color = selected?.color ?? null;
  const size = selected?.size ?? null;

  return (
    <View className="gap-5">
      {colors.length > 0 ? (
        <View className="gap-2">
          <Text className="text-sm text-neutral-800">
            Colour:{" "}
            <Text testID="selected-color" className="font-semibold">
              {color}
            </Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {colors.map((c) => {
              const summary = colorSummary(variants, c);
              if (!summary) return null;
              const thumb = imagesForColor(images, c)[0];
              const active = sameOption(c, color);
              const off = discountPercent(summary.priceInPaise, summary.mrpInPaise);
              return (
                <Pressable
                  key={c}
                  testID="color-option"
                  accessibilityRole="button"
                  accessibilityLabel={summary.inStock ? c : `${c} (out of stock)`}
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    const next = variantForColor(variants, c, size);
                    if (next) onSelect(next.id);
                  }}
                  className={`w-24 overflow-hidden rounded-lg border ${
                    active ? "border-2 border-black" : "border-neutral-300"
                  } ${summary.inStock ? "" : "opacity-60"}`}
                >
                  <View className="h-24 w-full items-center justify-center bg-neutral-100">
                    {thumb ? (
                      <Image source={{ uri: thumb.url }} className="h-full w-full" resizeMode="cover" />
                    ) : (
                      <Text className="px-1 text-center text-xs text-neutral-700">{c}</Text>
                    )}
                  </View>
                  <View className="border-t border-neutral-200 px-2 py-1.5">
                    <Text className="text-sm text-neutral-900">{formatPaise(summary.priceInPaise)}</Text>
                    {off !== null && summary.mrpInPaise !== null ? (
                      <Text className="text-xs text-neutral-500 line-through">
                        {formatPaise(summary.mrpInPaise)}
                      </Text>
                    ) : null}
                    {!summary.inStock ? (
                      <Text className="text-xs text-red-600">Out of stock</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {sizes.length > 0 ? (
        <View className="gap-2">
          <Text className="text-sm text-neutral-800">
            Size:{" "}
            <Text testID="selected-size" className="font-semibold">
              {size}
            </Text>
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {sizes.map((s) => {
              const variant = findVariant(variants, colors.length > 0 ? color : null, s);
              const available = variant !== undefined && variant.stock > 0;
              const active = sameOption(s, size);
              return (
                <Pressable
                  key={s}
                  testID="size-option"
                  accessibilityRole="button"
                  accessibilityLabel={available ? s : `${s} (unavailable)`}
                  accessibilityState={{ selected: active, disabled: !available }}
                  disabled={!available}
                  onPress={() => variant && onSelect(variant.id)}
                  className={`min-w-[56px] items-center rounded-lg border px-3 py-2 ${
                    active
                      ? "border-2 border-black bg-neutral-100"
                      : available
                        ? "border-neutral-300"
                        : "border-neutral-200"
                  }`}
                >
                  <Text
                    className={
                      available ? "text-sm text-neutral-900" : "text-sm text-neutral-400 line-through"
                    }
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
