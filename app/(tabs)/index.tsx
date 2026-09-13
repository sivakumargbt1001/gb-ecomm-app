import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { ProductCard } from "../../src/components/catalog/product-card";
import { DeliveryPicker } from "../../src/components/delivery/delivery-picker";
import { SORTS } from "../../src/components/storefront/catalog-menu";
import { PromoBannerRail } from "../../src/components/storefront/promo-banner-rail";
import { fetchCategories, fetchProducts } from "../../src/lib/catalog-api";
import { useCatalogFilterStore } from "../../src/lib/catalog-filter-store";
import { useSiteTheme } from "../../src/lib/site-theme-context";

export default function CatalogScreen() {
  const theme = useSiteTheme();
  const { categorySlug, sort, openMenu } = useCatalogFilterStore();

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const productsQuery = useQuery({
    queryKey: ["products", categorySlug, sort],
    queryFn: () => fetchProducts({ categorySlug, sort }),
  });

  // The selected category's intro, the same words the website shows above
  // its grid, so a shopper on either sees the same page.
  const selectedCategory = categorySlug
    ? categoriesQuery.data?.find((category) => category.slug === categorySlug)
    : undefined;

  return (
    <View className="flex-1 bg-white">
      {theme.announcement ? (
        <Text
          testID="header-announcement"
          className="bg-neutral-900 px-4 py-2 text-center text-xs tracking-wide text-white"
        >
          {theme.announcement}
        </Text>
      ) : null}

      <DeliveryPicker />

      {/* What the grid is currently narrowed to; the ☰ button in the header
          is where it changes. */}
      <Pressable
        testID="catalog-filter-summary"
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        className="flex-row items-center justify-between border-b border-neutral-100 px-4 py-2.5"
      >
        <Text className="text-sm font-medium text-neutral-900" numberOfLines={1}>
          {selectedCategory?.name ?? "All products"}
        </Text>
        <Text className="text-xs text-neutral-500">
          {SORTS.find((option) => option.value === sort)?.label}
        </Text>
      </Pressable>

      {selectedCategory?.description ? (
        <Text
          testID="category-intro"
          className="border-b border-neutral-100 px-4 py-3 text-sm leading-5 text-neutral-600"
          numberOfLines={3}
        >
          {selectedCategory.description}
        </Text>
      ) : null}

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
          ListHeaderComponent={<PromoBannerRail />}
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

