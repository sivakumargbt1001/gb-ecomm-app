import { create } from "zustand";
import type { ProductSort } from "@geekbase-labs/shared-types";

// The catalog's category and sort live here rather than in the Home screen
// because the menu that changes them opens from the navigation header, which
// is rendered by the tabs layout, not the screen.
interface CatalogFilterState {
  categorySlug: string | undefined;
  sort: ProductSort;
  isMenuOpen: boolean;
  setCategorySlug: (slug: string | undefined) => void;
  setSort: (sort: ProductSort) => void;
  openMenu: () => void;
  closeMenu: () => void;
}

export const useCatalogFilterStore = create<CatalogFilterState>((set) => ({
  categorySlug: undefined,
  sort: "relevance",
  isMenuOpen: false,
  setCategorySlug: (categorySlug) => set({ categorySlug }),
  setSort: (sort) => set({ sort }),
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
}));
