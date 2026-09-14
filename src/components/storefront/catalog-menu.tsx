import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Category, ProductSort } from "@geekbase-labs/shared-types";

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
  // The whole tree, grouped by parent: the website's nav opens a panel of a
  // category's children, and here those unfold beneath the category instead.
  const childrenOf = new Map<string | null, Category[]>();
  for (const category of [...(categoriesQuery.data ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  )) {
    const siblings = childrenOf.get(category.parentId) ?? [];
    siblings.push(category);
    childrenOf.set(category.parentId, siblings);
  }
  const categories = childrenOf.get(null) ?? [];

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
              <CategoryItem
                key={category.id}
                category={category}
                childrenOf={childrenOf}
                activeSlug={categorySlug}
                accent={theme.colors.accent}
                onPick={pickCategory}
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

// A category row. One with children carries a chevron that unfolds them,
// indented, beneath it — to any depth the tree goes — while the row itself
// still picks the category, so a shopper can browse all of "Women" or open
// it up and pick "Dresses" without a second screen.
function CategoryItem({
  category,
  childrenOf,
  activeSlug,
  accent,
  onPick,
  depth = 0,
}: {
  category: Category;
  childrenOf: Map<string | null, Category[]>;
  activeSlug: string | undefined;
  accent: string;
  onPick: (slug: string) => void;
  depth?: number;
}) {
  const children = childrenOf.get(category.id) ?? [];
  // A branch holding the chosen category starts open, so reopening the menu
  // shows where the shopper is.
  const holdsActive = (node: Category): boolean =>
    node.slug === activeSlug ||
    (childrenOf.get(node.id) ?? []).some(holdsActive);
  const [isExpanded, setIsExpanded] = useState(() =>
    children.some(holdsActive),
  );

  return (
    <>
      <MenuItem
        label={category.name}
        active={activeSlug === category.slug}
        accent={accent}
        onPress={() => onPick(category.slug)}
        indent={depth}
        trailing={
          children.length > 0 ? (
            <Pressable
              testID={`catalog-menu-expand-${category.slug}`}
              onPress={() => setIsExpanded((expanded) => !expanded)}
              accessibilityRole="button"
              accessibilityLabel={`${isExpanded ? "Hide" : "Show"} ${category.name} categories`}
              accessibilityState={{ expanded: isExpanded }}
              hitSlop={8}
              className="-my-2 -mr-2 p-2"
            >
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#737373"
              />
            </Pressable>
          ) : null
        }
      />
      {isExpanded &&
        children.map((child) => (
          <CategoryItem
            key={child.id}
            category={child}
            childrenOf={childrenOf}
            activeSlug={activeSlug}
            accent={accent}
            onPick={onPick}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

function MenuItem({
  label,
  active,
  accent,
  onPress,
  indent = 0,
  trailing,
}: {
  label: string;
  active: boolean;
  accent: string;
  onPress: () => void;
  indent?: number;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="flex-row items-center justify-between px-4 py-3 active:bg-neutral-50"
      style={indent > 0 ? { paddingLeft: 16 + indent * 16 } : undefined}
    >
      <Text
        className={`flex-1 text-[15px] ${active ? "font-semibold" : "text-neutral-800"}`}
        style={active ? { color: accent } : undefined}
      >
        {label}
      </Text>
      {active ? <Ionicons name="checkmark" size={18} color={accent} /> : null}
      {trailing}
    </Pressable>
  );
}
