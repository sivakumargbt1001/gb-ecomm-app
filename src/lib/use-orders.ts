import type { Cart } from "@geekbase-labs/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getOrder, listOrders, reorder } from "./order-api";

export const ORDERS_KEY = ["orders"] as const;
const CART_KEY = ["cart"] as const;

export function orderKey(id: string) {
  return [...ORDERS_KEY, id] as const;
}

export function useOrders(enabled: boolean) {
  const query = useQuery({
    queryKey: ORDERS_KEY,
    queryFn: listOrders,
    enabled,
  });

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useOrder(id: string, enabled: boolean) {
  const query = useQuery({
    queryKey: orderKey(id),
    queryFn: () => getOrder(id),
    enabled,
  });

  return {
    order: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useBuyAgain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => reorder(orderId),
    onSuccess: (cart: Cart) => queryClient.setQueryData(CART_KEY, cart),
  });
}
