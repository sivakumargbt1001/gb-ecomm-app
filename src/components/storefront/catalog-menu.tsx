import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  compareSizes,
  filterableSpecFields,
  type Category,
  type ProductSort,
} from "@geekbase-labs/shared-types";

import { fetchCategories } from "../../lib/catalog-api";
import {
  countNarrowing,
  isValueSelected,
  useCatalogFilterStore,
} from "../../lib/catalog-filter-store";
import { useSiteTheme } from "../../lib/site-theme-context";
import { useCatalogProducts } from "../../lib/use-catalog-products";

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
  const filters = useCatalogFilterStore();
  const {
    categorySlug,
    sort,
    sizes,
    colors,
    specs,
    isMenuOpen,
    setCategorySlug,
    setSort,
    toggleSize,
    toggleColor,
    toggleSpec,
    clearNarrowing,
    closeMenu,
  } = filters;
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  // The grid's own query, for what can still be narrowed by. A value the
  // shopper already ticked stays listed even if a later pick would drop it.
  const facets = useCatalogProducts().data?.facets ?? { sizes: [], colors: [] };
  const sizeOptions = withSelected(facets.sizes, sizes).sort(compareSizes);
  const colorOptions = withSelected(facets.colors, colors).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  const specFields = filterableSpecFields(categoriesQuery.data ?? [], categorySlug);
  const narrowed = countNarrowing(filters);
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

            {(sizeOptions.length > 0 || colorOptions.length > 0 || specFields.length > 0) && (
              <View className="flex-row items-center justify-between pr-4">
                <SectionTitle>Filters</SectionTitle>
                {narrowed > 0 ? (
                  <Pressable testID="clear-narrowing" onPress={clearNarrowing} hitSlop={8}>
                    <Text className="text-xs text-neutral-500 underline">Clear</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
            {sizeOptions.length > 0 && (
              <FilterSection title="Size" count={sizes.length}>
                {sizeOptions.map((size) => (
                  <TickItem
                    key={size}
                    label={size}
                    checked={isValueSelected(sizes, size)}
                    accent={theme.colors.accent}
                    onPress={() => toggleSize(size)}
                  />
                ))}
              </FilterSection>
            )}
            {colorOptions.length > 0 && (
              <FilterSection title="Colour" count={colors.length}>
                {colorOptions.map((color) => (
                  <TickItem
                    key={color}
                    label={color}
                    checked={isValueSelected(colors, color)}
                    accent={theme.colors.accent}
                    onPress={() => toggleColor(color)}
                  />
                ))}
              </FilterSection>
            )}
            {specFields.map((field) => {
              const selected = specs[field.key] ?? [];
              return (
                <FilterSection key={field.key} title={field.label} count={selected.length}>
                  {withSelected(field.choices, selected).map((choice) => (
                    <TickItem
                      key={choice}
                      label={choice}
                      checked={isValueSelected(selected, choice)}
                      accent={theme.colors.accent}
                      onPress={() => toggleSpec(field.key, choice)}
                    />
                  ))}
                </FilterSection>
              );
            })}

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

function withSelected(options: string[], selected: string[]): string[] {
  const lower = new Set(options.map((o) => o.toLowerCase()));
  return [...options, ...selected.filter((s) => !lower.has(s.toLowerCase()))];
}

// A folding group of tick rows, closed unless something in it is ticked —
// the website's sidebar sections, with the same +/− and count.
function FilterSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(count > 0);
  return (
    <View testID={`filter-section-${title}`}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${count > 0 ? `, ${count} selected` : ""}`}
        className="flex-row items-center justify-between px-4 py-3 active:bg-neutral-50"
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-[15px] font-medium text-neutral-900">{title}</Text>
          {count > 0 ? (
            <View className="rounded-full bg-neutral-900 px-1.5">
              <Text testID="filter-section-count" className="text-[11px] font-medium text-white">
                {count}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="text-lg leading-none text-neutral-500">{open ? "−" : "+"}</Text>
      </Pressable>
      {open ? <View className="pb-1">{children}</View> : null}
    </View>
  );
}

// One tickable value. Ticking never closes the menu: a shopper narrowing by
// size usually wants a colour too.
function TickItem({
  label,
  checked,
  accent,
  onPress,
}: {
  label: string;
  checked: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="flex-row items-center gap-3 py-2 pl-6 pr-4 active:bg-neutral-50"
    >
      <Ionicons
        name={checked ? "checkbox" : "square-outline"}
        size={20}
        color={checked ? accent : "#a3a3a3"}
      />
      <Text className={`text-[15px] ${checked ? "font-semibold text-neutral-900" : "text-neutral-800"}`}>
        {label}
      </Text>
    </Pressable>
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
