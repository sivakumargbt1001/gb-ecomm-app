import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { categoryTrail, type Category } from "@geekbase-labs/shared-types";

import { useCatalogFilterStore } from "../../lib/catalog-filter-store";

// The website's breadcrumb — Home › Clothing › Sarees — over a product. Each
// category is a tap: it narrows the Home grid to that category and goes
// there, since the app has no category page of its own. The last crumb is
// where the shopper is, so it is plain text.
export function Breadcrumbs({
  categoryId,
  categories,
  current,
}: {
  categoryId: string;
  categories: Category[];
  current: string;
}) {
  const setCategorySlug = useCatalogFilterStore((state) => state.setCategorySlug);
  const trail = categoryTrail(categoryId, categories);

  const goTo = (slug: string | undefined) => {
    setCategorySlug(slug);
    router.navigate("/(tabs)");
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID="breadcrumbs"
      accessibilityRole="header"
      accessibilityLabel="Breadcrumb"
      contentContainerClassName="flex-row items-center gap-1.5 px-5 pt-4"
    >
      <Crumb label="Home" onPress={() => goTo(undefined)} />
      {trail.map((category) => (
        <Crumb key={category.id} label={category.name} onPress={() => goTo(category.slug)} />
      ))}
      <Text numberOfLines={1} className="max-w-[60%] text-xs text-neutral-900">
        {current}
      </Text>
    </ScrollView>
  );
}

function Crumb({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <>
      <Pressable onPress={onPress} accessibilityRole="link" hitSlop={6}>
        <Text className="text-xs text-neutral-500">{label}</Text>
      </Pressable>
      <Text className="text-xs text-neutral-400">›</Text>
    </>
  );
}
