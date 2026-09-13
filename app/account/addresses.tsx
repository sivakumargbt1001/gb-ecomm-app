import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import type { Address } from "@geekbase-labs/shared-types";

import {
  SignInRequired,
  primaryButtonClass,
} from "../../src/components/account/sign-in-required";
import { useAddresses, useAddressMutations } from "../../src/lib/use-addresses";

export default function AddressesScreen() {
  return (
    <SignInRequired>
      <Stack.Screen options={{ title: "Addresses" }} />
      <AddressBook />
    </SignInRequired>
  );
}

function AddressBook() {
  const { addresses, isLoading, error } = useAddresses();
  const { remove, setDefault } = useAddressMutations();

  const confirmRemove = (address: Address) => {
    Alert.alert("Remove address?", `${address.fullName}, ${address.line1}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => remove.mutate(address.id) },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, gap: 12 }}>
      {isLoading ? (
        <Text className="text-sm text-neutral-500">Loading your addresses…</Text>
      ) : error ? (
        <Text className="text-sm text-red-600">{error.message}</Text>
      ) : addresses.length === 0 ? (
        <Text className="text-sm text-neutral-500" testID="addresses-empty">
          You haven&apos;t saved any addresses yet. Add one to check out faster.
        </Text>
      ) : (
        addresses.map((address) => (
          <View
            key={address.id}
            testID="address-card"
            className="gap-3 rounded-xl border border-neutral-200 p-4"
          >
            <View className="gap-0.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-medium text-neutral-900">{address.fullName}</Text>
                {address.isDefault ? (
                  <Text
                    testID="address-default"
                    className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700"
                  >
                    Default
                  </Text>
                ) : null}
              </View>
              <Text className="text-sm text-neutral-600">{address.line1}</Text>
              {address.line2 ? (
                <Text className="text-sm text-neutral-600">{address.line2}</Text>
              ) : null}
              <Text className="text-sm text-neutral-600">
                {address.city}, {address.state} {address.postalCode}
              </Text>
              <Text className="text-sm text-neutral-600">{address.phone}</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <Link href={{ pathname: "/account/address-form", params: { id: address.id } }} asChild>
                <Pressable className="rounded-lg border border-neutral-300 px-3 py-2">
                  <Text className="text-sm font-medium text-neutral-900">Edit</Text>
                </Pressable>
              </Link>
              {!address.isDefault ? (
                <Pressable
                  onPress={() => setDefault.mutate(address.id)}
                  disabled={setDefault.isPending}
                  className="rounded-lg border border-neutral-300 px-3 py-2 disabled:opacity-50"
                >
                  <Text className="text-sm font-medium text-neutral-900">Set as default</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => confirmRemove(address)}
                disabled={remove.isPending}
                className="rounded-lg px-3 py-2 disabled:opacity-50"
              >
                <Text className="text-sm font-medium text-red-600">Remove</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {remove.isError || setDefault.isError ? (
        <Text className="text-sm text-red-600">
          {(remove.error ?? setDefault.error)?.message}
        </Text>
      ) : null}

      <Link href="/account/address-form" asChild>
        <Pressable className={primaryButtonClass} testID="address-add">
          <Text className="font-semibold text-white">Add address</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}
