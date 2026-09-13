import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { ProductOptionField } from "@geekbase-labs/shared-types";
import * as DocumentPicker from "expo-document-picker";

import { OptionField } from "../../src/components/catalog/option-field";
import { ProductRecommendations } from "../../src/components/catalog/product-recommendations";
import { ProductReviews } from "../../src/components/reviews/product-reviews";
import { WishlistHeart } from "../../src/components/wishlist/wishlist-heart";
import {
  fetchProduct,
  fetchProductOptionFields,
  formatPaise,
} from "../../src/lib/catalog-api";
import { trackEvent } from "../../src/lib/analytics";
import { useTrackEvent } from "../../src/lib/use-track-event";
import { useCart } from "../../src/lib/use-cart";
import { useSiteTheme } from "../../src/lib/site-theme-context";
import { uploadOptionFile } from "../../src/lib/cart-api";

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

  const { add } = useCart();
  const theme = useSiteTheme();

  // Above the loading and not-found early returns, so the hook order is stable;
  // `enabled` holds the event back until the product itself has loaded.
  const viewedProductId = productQuery.data?.id;
  useTrackEvent(
    "product_viewed",
    viewedProductId ? { productId: viewedProductId } : {},
    Boolean(viewedProductId),
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const [optionValues, setOptionValues] = useState<
    Record<string, string | number>
  >({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

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
  const variants = product.variants;

  const effectiveVariantId =
    selectedVariantId ??
    (variants.length > 0
      ? (variants.find((v) => v.stock > 0)?.id ?? variants[0].id)
      : null);

  const selectedVariant = variants.find((v) => v.id === effectiveVariantId);

  const isSoldOut =
    variants.length > 0 && variants.every((v) => v.stock <= 0);
  const variantSoldOut = selectedVariant ? selectedVariant.stock <= 0 : false;

  function setOptionValue(fieldId: string, value: string | number) {
    setOptionValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handlePickFile(field: ProductOptionField) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;

      const asset = result.assets[0];
      setUploading(true);
      try {
        const uploaded = await uploadOptionFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? "application/octet-stream",
        });
        setOptionValues((prev) => ({ ...prev, [field.id]: uploaded.url }));
        setFileNames((prev) => ({ ...prev, [field.id]: asset.name }));
      } finally {
        setUploading(false);
      }
    } catch {
      Alert.alert("Upload failed", "Could not upload the file. Please try again.");
    }
  }

  function validateRequiredFields(): boolean {
    for (const field of optionFields) {
      if (field.required && !optionValues[field.id]) {
        Alert.alert("Required field", `Please fill in "${field.label}".`);
        return false;
      }
    }
    return true;
  }

  function handleAddToCart() {
    if (!validateRequiredFields()) return;

    add.mutate(
      {
        productId: product.id,
        variantId: effectiveVariantId ?? undefined,
        quantity,
        customOptionValues: optionValues,
      },
      {
        onSuccess: () => {
          // Reported after the server accepted the line, so the funnel counts
          // real additions rather than taps that failed on stock.
          void trackEvent("added_to_cart", {
            productId: product.id,
            valueInPaise:
              (selectedVariant?.priceInPaise ?? product.priceInPaise) * quantity,
          });
          router.navigate("/(tabs)/cart");
        },
      },
    );
  }

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
            {product.brand ? (
              <Text
                testID="product-brand"
                className="text-xs uppercase tracking-wide text-neutral-500"
              >
                {product.brand}
              </Text>
            ) : null}
            <View className="flex-row items-start justify-between gap-4">
              <Text className="flex-1 text-2xl font-semibold text-neutral-900">
                {product.name}
              </Text>
              <WishlistHeart productId={product.id} productName={product.name} />
            </View>
            <Text className="text-xl font-semibold text-neutral-900">
              {formatPaise(
                selectedVariant?.priceInPaise ?? product.priceInPaise,
              )}
            </Text>
          </View>

          {product.condition !== "new" ? (
            <View className="self-start rounded-full bg-amber-50 px-3 py-1">
              <Text testID="product-condition" className="text-xs font-medium text-amber-800">
                {product.condition === "refurbished" ? "Refurbished" : "Pre-owned"}
              </Text>
            </View>
          ) : null}

          {product.description ? (
            <Text className="text-neutral-600">{product.description}</Text>
          ) : null}

          {variants.length > 0 ? (
            <View className="gap-2">
              <Text className="text-sm font-medium text-neutral-800">
                Options
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {variants.map((variant) => {
                  const isSelected = variant.id === effectiveVariantId;
                  const outOfStock = variant.stock <= 0;
                  return (
                    <Pressable
                      key={variant.id}
                      testID="variant"
                      onPress={() => {
                        if (!outOfStock) setSelectedVariantId(variant.id);
                      }}
                      className={`rounded-lg border px-3 py-1.5 ${
                        isSelected
                          ? "border-black bg-black"
                          : outOfStock
                            ? "border-neutral-200"
                            : "border-neutral-300"
                      }`}
                    >
                      <Text
                        className={
                          isSelected
                            ? "text-sm text-white"
                            : outOfStock
                              ? "text-sm text-neutral-400 line-through"
                              : "text-sm text-neutral-800"
                        }
                      >
                        {variant.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {optionFields.length > 0 ? (
            <View className="gap-4 rounded-xl border border-neutral-200 p-4">
              <Text className="text-sm font-medium text-neutral-800">
                Customize your order
              </Text>
              {optionFields.map((field) => (
                <OptionField
                  key={field.id}
                  field={field}
                  value={optionValues[field.id]}
                  onChangeValue={(val) => setOptionValue(field.id, val)}
                  onPickFile={() => handlePickFile(field)}
                  fileName={fileNames[field.id]}
                />
              ))}
            </View>
          ) : null}

          {/* Quantity */}
          <View className="flex-row items-center gap-4">
            <Text className="text-sm font-medium text-neutral-800">Qty</Text>
            <View className="flex-row items-center rounded-lg border border-neutral-300">
              <Pressable
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2"
                testID="qty-minus"
              >
                <Text className="text-lg font-semibold text-neutral-700">
                  -
                </Text>
              </Pressable>
              <Text
                className="min-w-[32px] text-center text-base font-medium"
                testID="qty-value"
              >
                {quantity}
              </Text>
              <Pressable
                onPress={() => setQuantity((q) => Math.min(99, q + 1))}
                className="px-4 py-2"
                testID="qty-plus"
              >
                <Text className="text-lg font-semibold text-neutral-700">
                  +
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Add to Cart */}
          <Pressable
            onPress={handleAddToCart}
            disabled={
              add.isPending || isSoldOut || variantSoldOut || uploading
            }
            className="items-center rounded-lg py-4 disabled:opacity-50"
            style={{ backgroundColor: theme.colors.primary }}
            testID="add-to-cart-button"
          >
            <Text className="text-base font-semibold text-white">
              {isSoldOut || variantSoldOut
                ? "Sold Out"
                : add.isPending
                  ? "Adding..."
                  : uploading
                    ? "Uploading..."
                    : "Add to Cart"}
            </Text>
          </Pressable>

          {add.isError ? (
            <Text className="text-center text-sm text-red-600">
              {add.error.message}
            </Text>
          ) : null}

          <ProductRecommendations productId={product.id} />

          <ProductReviews productId={product.id} />
        </View>
      </ScrollView>
    </>
  );
}
