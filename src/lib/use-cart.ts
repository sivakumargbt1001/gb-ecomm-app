import type { AddCartItemInput, Cart } from "@geekbase-labs/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "./cart-api";

const CART_KEY = ["cart"] as const;

export function useCart() {
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: CART_KEY,
    queryFn: getCart,
  });

  const setCartData = (cart: Cart) => {
    queryClient.setQueryData(CART_KEY, cart);
  };

  const add = useMutation({
    mutationFn: (input: AddCartItemInput) => addCartItem(input),
    onSuccess: setCartData,
  });

  const update = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: setCartData,
  });

  const remove = useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: setCartData,
  });

  const cart = cartQuery.data ?? null;
  const count =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return {
    cart,
    isLoading: cartQuery.isLoading,
    count,
    add,
    updateQuantity: update,
    remove,
    refetch: cartQuery.refetch,
  };
}
