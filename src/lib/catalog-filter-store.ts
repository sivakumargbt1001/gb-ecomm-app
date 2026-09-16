import { create } from "zustand";
import type { ProductSort, SpecFilters } from "@geekbase-labs/shared-types";

// The catalog's category, sort and narrowing live here rather than in the
// Home screen because the menu that changes them opens from the navigation
// header, which is rendered by the tabs layout, not the screen.
interface CatalogFilterState {
  categorySlug: string | undefined;
  sort: ProductSort;
  // Any-of within each; a spec key's values are any-of, keys are all-of —
  // the same shape the website keeps in its URL.
  sizes: string[];
  colors: string[];
  specs: SpecFilters;
  isMenuOpen: boolean;
  setCategorySlug: (slug: string | undefined) => void;
  setSort: (sort: ProductSort) => void;
  toggleSize: (size: string) => void;
  toggleColor: (color: string) => void;
  toggleSpec: (key: string, value: string) => void;
  clearNarrowing: () => void;
  openMenu: () => void;
  closeMenu: () => void;
}

// Tick or untick one value, matched without regard to case so "xxl" from a
// deep link unticks the menu's "XXL".
export function toggleValue(values: string[], value: string): string[] {
  const rest = values.filter((v) => v.toLowerCase() !== value.toLowerCase());
  return rest.length === values.length ? [...values, value] : rest;
}

// A key whose last value was unticked leaves the map, so "no gender picked"
// and "gender: []" cannot drift apart.
export function toggleSpecValue(specs: SpecFilters, key: string, value: string): SpecFilters {
  const next = toggleValue(specs[key] ?? [], value);
  const { [key]: _dropped, ...rest } = specs;
  return next.length > 0 ? { ...rest, [key]: next } : rest;
}

export function isValueSelected(values: string[], value: string): boolean {
  return values.some((v) => v.toLowerCase() === value.toLowerCase());
}

// How many values are ticked across size, colour and every spec — the badge
// on the header's filter button, so a narrowed grid never looks like the
// whole shop.
export function countNarrowing(state: Pick<CatalogFilterState, "sizes" | "colors" | "specs">): number {
  return (
    state.sizes.length +
    state.colors.length +
    Object.values(state.specs).reduce((sum, values) => sum + values.length, 0)
  );
}

export const useCatalogFilterStore = create<CatalogFilterState>((set) => ({
  categorySlug: undefined,
  sort: "relevance",
  sizes: [],
  colors: [],
  specs: {},
  isMenuOpen: false,
  // A new category is a new shelf: what was ticked on the old one may not
  // exist here, so the narrowing starts over with it.
  setCategorySlug: (categorySlug) => set({ categorySlug, sizes: [], colors: [], specs: {} }),
  setSort: (sort) => set({ sort }),
  toggleSize: (size) => set((state) => ({ sizes: toggleValue(state.sizes, size) })),
  toggleColor: (color) => set((state) => ({ colors: toggleValue(state.colors, color) })),
  toggleSpec: (key, value) =>
    set((state) => ({ specs: toggleSpecValue(state.specs, key, value) })),
  clearNarrowing: () => set({ sizes: [], colors: [], specs: {} }),
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
}));
