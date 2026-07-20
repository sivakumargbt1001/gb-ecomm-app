import { create } from "zustand";

interface CartUiState {
  isCheckoutLoading: boolean;
  setCheckoutLoading: (loading: boolean) => void;
}

export const useCartUiStore = create<CartUiState>((set) => ({
  isCheckoutLoading: false,
  setCheckoutLoading: (loading) => set({ isCheckoutLoading: loading }),
}));
