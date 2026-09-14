import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  effectiveSpecFields,
  type Category,
  type Product,
} from "@geekbase-labs/shared-types";

// A product's answers to its category's spec fields, laid out as the website
// does: highlights in a grid up top, the rest behind "Additional details".
// Field order and labels come from the category; an answer whose field the
// category no longer defines is still shown, under its stored key.
export type SpecRow = { key: string; label: string; value: string };

export function splitSpecs(
  product: Pick<Product, "specs" | "categoryId">,
  categories: Category[],
): { highlights: SpecRow[]; details: SpecRow[] } {
  const fields = effectiveSpecFields(product.categoryId, categories);
  const known = new Set(fields.map((field) => field.key));
  const highlights: SpecRow[] = [];
  const details: SpecRow[] = [];

  for (const field of fields) {
    const value = product.specs[field.key];
    if (!value) continue;
    (field.highlight ? highlights : details).push({
      key: field.key,
      label: field.label,
      value,
    });
  }
  for (const [key, value] of Object.entries(product.specs)) {
    if (known.has(key) || !value) continue;
    const words = key.replace(/_/g, " ");
    details.push({
      key,
      label: words.charAt(0).toUpperCase() + words.slice(1),
      value,
    });
  }
  return { highlights, details };
}

export function ProductSpecs({
  product,
  categories,
}: {
  product: Pick<Product, "specs" | "categoryId">;
  categories: Category[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { highlights, details } = splitSpecs(product, categories);
  if (highlights.length === 0 && details.length === 0) return null;

  // With nothing flagged as a highlight the first few details step up, so
  // the block never opens with a folded list and nothing above it.
  const shown = highlights.length > 0 ? highlights : details.slice(0, 4);
  const rest = highlights.length > 0 ? details : details.slice(4);

  return (
    <View
      testID="product-specs"
      className="gap-3 rounded-xl border border-neutral-200 p-4"
    >
      <Text className="text-base font-semibold text-neutral-900">
        Product highlights
      </Text>
      <SpecGrid rows={shown} bold />
      {rest.length > 0 ? (
        <View className="border-t border-neutral-200 pt-3">
          <Pressable
            testID="product-details-toggle"
            onPress={() => setIsOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
            className="flex-row items-center justify-between"
          >
            <Text className="text-sm font-semibold text-neutral-900">
              Additional details
            </Text>
            <Ionicons
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#525252"
            />
          </Pressable>
          {isOpen ? (
            <View className="pt-3" testID="product-details">
              <SpecGrid rows={rest} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function SpecGrid({ rows, bold = false }: { rows: SpecRow[]; bold?: boolean }) {
  return (
    <View className="flex-row flex-wrap gap-y-3">
      {rows.map((row) => (
        <View key={row.key} className="w-1/2 gap-0.5 pr-3">
          <Text className="text-[11px] uppercase tracking-wide text-neutral-500">
            {row.label}
          </Text>
          <Text
            className={`text-sm text-neutral-900 ${bold ? "font-medium" : ""}`}
          >
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
