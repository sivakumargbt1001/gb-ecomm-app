import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address, CreateAddressInput, UpdateAddressInput } from "@geekbase-labs/shared-types";

import { useAuthStore } from "./auth-store";
import { createAddress, deleteAddress, listAddresses, updateAddress } from "./cart-api";

export const ADDRESSES_KEY = ["addresses"] as const;

export function sortAddresses(addresses: Address[]): Address[] {
  return [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

// The saved delivery addresses, default first. The account screens and
// checkout read the same list, so a change in one shows in the other.
export function useAddresses() {
  const user = useAuthStore((state) => state.user);
  const query = useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: async () => sortAddresses(await listAddresses()),
    enabled: Boolean(user),
  });
  return { addresses: query.data ?? [], isLoading: query.isLoading, error: query.error };
}

export function useAddressMutations() {
  const queryClient = useQueryClient();
  // The server decides which address is default (setting one clears the
  // others), so every write refetches rather than patching the cache.
  const refresh = () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });

  const create = useMutation({
    mutationFn: (input: CreateAddressInput) => createAddress(input),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAddressInput }) =>
      updateAddress(id, input),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: refresh,
  });
  const setDefault = useMutation({
    mutationFn: (id: string) => updateAddress(id, { isDefault: true }),
    onSuccess: refresh,
  });

  return { create, update, remove, setDefault };
}
