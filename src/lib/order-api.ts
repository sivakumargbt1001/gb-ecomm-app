import type { Cart, Order } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

export async function listOrders(): Promise<Order[]> {
  const data = await apiFetch<{ orders: Order[] }>("/api/orders");
  return data.orders;
}

export async function getOrder(id: string): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(
    `/api/orders/${encodeURIComponent(id)}`,
  );
  return data.order;
}

// Rebuilds a cart from a past order's line items, custom option values
// included — the backend snapshots them onto the order at checkout.
export async function reorder(id: string): Promise<Cart> {
  const data = await apiFetch<{ cart: Cart }>(
    `/api/orders/${encodeURIComponent(id)}/reorder`,
    { method: "POST" },
  );
  return data.cart;
}
