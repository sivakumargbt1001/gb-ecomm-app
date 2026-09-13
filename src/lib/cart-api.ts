import type {
  AddCartItemInput,
  Address,
  Cart,
  CartContactInput,
  CheckoutInput,
  CheckoutResult,
  CreateAddressInput,
  UpdateAddressInput,
} from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";
import { getGuestId } from "./guest-id";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

async function guestHeaders(): Promise<Record<string, string>> {
  const guestId = await getGuestId();
  return { "X-Guest-Id": guestId };
}

export async function getCart(): Promise<Cart> {
  const headers = await guestHeaders();
  const data = await apiFetch<{ cart: Cart }>("/api/cart", { headers });
  return data.cart;
}

export async function addCartItem(input: AddCartItemInput): Promise<Cart> {
  const headers = await guestHeaders();
  const data = await apiFetch<{ cart: Cart }>("/api/cart/items", {
    method: "POST",
    body: input,
    headers,
  });
  return data.cart;
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<Cart> {
  const headers = await guestHeaders();
  const data = await apiFetch<{ cart: Cart }>(
    `/api/cart/items/${encodeURIComponent(itemId)}`,
    { method: "PATCH", body: { quantity }, headers },
  );
  return data.cart;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const headers = await guestHeaders();
  const data = await apiFetch<{ cart: Cart }>(
    `/api/cart/items/${encodeURIComponent(itemId)}`,
    { method: "DELETE", headers },
  );
  return data.cart;
}

export async function setCartContact(input: CartContactInput): Promise<Cart> {
  const headers = await guestHeaders();
  const data = await apiFetch<{ cart: Cart }>("/api/cart/contact", {
    method: "PATCH",
    body: input,
    headers,
  });
  return data.cart;
}

export async function mergeGuestCart(): Promise<Cart> {
  const headers = await guestHeaders();
  const data = await apiFetch<{ cart: Cart }>("/api/cart/merge", {
    method: "POST",
    headers,
  });
  return data.cart;
}

export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  const headers = await guestHeaders();
  return apiFetch<CheckoutResult>("/api/cart/checkout", {
    method: "POST",
    body: input,
    headers,
  });
}

export async function listAddresses(): Promise<Address[]> {
  const data = await apiFetch<{ addresses: Address[] }>("/api/cart/addresses");
  return data.addresses;
}

export async function createAddress(
  input: CreateAddressInput,
): Promise<Address> {
  const data = await apiFetch<{ address: Address }>("/api/cart/addresses", {
    method: "POST",
    body: input,
  });
  return data.address;
}

export async function updateAddress(
  id: string,
  input: UpdateAddressInput,
): Promise<Address> {
  const data = await apiFetch<{ address: Address }>(
    `/api/cart/addresses/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input },
  );
  return data.address;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiFetch<void>(`/api/cart/addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function uploadOptionFile(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<{ url: string; key: string }> {
  const headers = await guestHeaders();
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const response = await fetch(
    `${API_BASE_URL}/api/cart/uploads`,
    {
      method: "POST",
      body: formData,
      headers,
    },
  );

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as { url: string; key: string };
}
