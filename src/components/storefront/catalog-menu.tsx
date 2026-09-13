import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ProductSort } from "@geekbase-labs/shared-types";

import { fetchCategories } from "../../lib/catalog-api";
import { useCatalogFilterStore } from "../../lib/catalog-filter-store";
import { useSiteTheme } from "../../lib/site-theme-context";

export const SORTS: { value: ProductSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name A–Z" },
];

// The website's phone header tucks its category links behind a hamburger
// button; this is the app's version of that panel, with the sort options
// underneath so every way of narrowing the grid lives in one place.
export function CatalogMenu() {
  const theme = useSiteTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categorySlug, sort, isMenuOpen, setCategorySlug, setSort, closeMenu } =
    useCatalogFilterStore();
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  // Top-level only, as on the website's nav row.
  const categories = (categoriesQuery.data ?? []).filter(
    (category) => category.parentId == null,
  );

  // A pick narrows the Home grid, so it also brings the shopper there when
  // the menu was opened from another tab.
  const done = () => {
    closeMenu();
    router.navigate("/(tabs)");
  };
  const pickCategory = (slug: string | undefined) => {
    setCategorySlug(slug);
    done();
  };
  const pickSort = (value: ProductSort) => {
    setSort(value);
    done();
  };

  return (
    <Modal
      visible={isMenuOpen}
      transparent
      animationType="fade"
      onRequestClose={closeMenu}
    >
      <View className="flex-1 flex-row">
        <View
          testID="catalog-menu"
          className="w-4/5 max-w-sm bg-white"
          style={{ paddingTop: insets.top }}
        >
          <View className="flex-row items-center justify-between border-b border-neutral-100 px-4 py-3">
            <Text className="text-base font-semibold text-neutral-900">Menu</Text>
            <Pressable
              testID="catalog-menu-close"
              onPress={closeMenu}
              accessibilityLabel="Close menu"
              className="p-2"
            >
              <Ionicons name="close" size={22} color={theme.colors.primary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <SectionTitle>Categories</SectionTitle>
            <MenuItem
              label="All"
              active={categorySlug === undefined}
              accent={theme.colors.accent}
              onPress={() => pickCategory(undefined)}
            />
            {categories.map((category) => (
              <MenuItem
                key={category.id}
                label={category.name}
                active={categorySlug === category.slug}
                accent={theme.colors.accent}
                onPress={() => pickCategory(category.slug)}
              />
            ))}

            <SectionTitle>Sort by</SectionTitle>
            {SORTS.map((option) => (
              <MenuItem
                key={option.value}
                label={option.label}
                active={sort === option.value}
                accent={theme.colors.accent}
                onPress={() => pickSort(option.value)}
              />
            ))}
          </ScrollView>
        </View>

        <Pressable
          testID="catalog-menu-backdrop"
          onPress={closeMenu}
          accessibilityLabel="Close menu"
          className="flex-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        />
      </View>
    </Modal>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="px-4 pb-1 pt-5 text-xs font-semibold uppercase tracking-widest text-neutral-500">
      {children}
    </Text>
  );
}

function MenuItem({
  label,
  active,
  accent,
  onPress,
}: {
  label: string;
  active: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="flex-row items-center justify-between px-4 py-3 active:bg-neutral-50"
    >
      <Text
        className={`text-[15px] ${active ? "font-semibold" : "text-neutral-800"}`}
        style={active ? { color: accent } : undefined}
      >
        {label}
      </Text>
      {active ? <Ionicons name="checkmark" size={18} color={accent} /> : null}
    </Pressable>
  );
}
