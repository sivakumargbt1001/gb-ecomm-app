import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateAddressSchema, type CreateAddressInput } from "@geekbase-labs/shared-types";
import type { z } from "zod";

import {
  SignInRequired,
  inputClass,
  primaryButtonClass,
} from "../../src/components/account/sign-in-required";
import { useAddresses, useAddressMutations } from "../../src/lib/use-addresses";

type AddressFormValues = z.input<typeof CreateAddressSchema>;

const FIELDS: {
  name: Exclude<keyof AddressFormValues, "isDefault" | "country">;
  label: string;
  placeholder: string;
  keyboard?: "phone-pad" | "number-pad";
}[] = [
  { name: "fullName", label: "Full name", placeholder: "Asha Rao" },
  { name: "phone", label: "Phone", placeholder: "+919876543210", keyboard: "phone-pad" },
  { name: "line1", label: "Address line 1", placeholder: "1 MG Road" },
  { name: "line2", label: "Address line 2 (optional)", placeholder: "Flat 4B" },
  { name: "city", label: "City", placeholder: "Bengaluru" },
  { name: "state", label: "State", placeholder: "Karnataka" },
  { name: "postalCode", label: "PIN code", placeholder: "560001", keyboard: "number-pad" },
];

export default function AddressFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <SignInRequired>
      <Stack.Screen options={{ title: id ? "Edit address" : "Add address" }} />
      <AddressForm addressId={id} />
    </SignInRequired>
  );
}

function AddressForm({ addressId }: { addressId?: string }) {
  const { addresses, isLoading } = useAddresses();
  const { create, update } = useAddressMutations();
  const existing = addressId ? addresses.find((a) => a.id === addressId) : undefined;

  // Editing waits for the list so the form opens filled in; on a fresh add the
  // first address a shopper saves becomes their default.
  if (addressId && isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-sm text-neutral-500">Loading…</Text>
      </View>
    );
  }

  return (
    <AddressFields
      key={existing?.id ?? "new"}
      initial={{
        fullName: existing?.fullName ?? "",
        phone: existing?.phone ?? "",
        line1: existing?.line1 ?? "",
        line2: existing?.line2 ?? "",
        city: existing?.city ?? "",
        state: existing?.state ?? "",
        postalCode: existing?.postalCode ?? "",
        country: existing?.country ?? "IN",
        isDefault: existing?.isDefault ?? addresses.length === 0,
      }}
      busy={create.isPending || update.isPending}
      error={(create.error ?? update.error)?.message ?? null}
      onSubmit={(values) => {
        const input = { ...values, line2: values.line2?.trim() ? values.line2 : null };
        const done = { onSuccess: () => router.back() };
        if (existing) update.mutate({ id: existing.id, input }, done);
        else create.mutate(input, done);
      }}
      submitLabel={existing ? "Save changes" : "Save address"}
    />
  );
}

function AddressFields({
  initial,
  busy,
  error,
  onSubmit,
  submitLabel,
}: {
  initial: AddressFormValues;
  busy: boolean;
  error: string | null;
  onSubmit: (values: CreateAddressInput) => void;
  submitLabel: string;
}) {
  const form = useForm<AddressFormValues, unknown, CreateAddressInput>({
    resolver: zodResolver(CreateAddressSchema),
    defaultValues: initial,
  });

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, gap: 16 }}>
      {FIELDS.map(({ name, label, placeholder, keyboard }) => (
        <View key={name} className="gap-1">
          <Text className="text-sm font-medium text-neutral-800">{label}</Text>
          <Controller
            control={form.control}
            name={name}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                keyboardType={keyboard ?? "default"}
                autoCapitalize={name === "phone" ? "none" : "words"}
                className={inputClass}
                testID={`address-${name}`}
              />
            )}
          />
          {form.formState.errors[name] ? (
            <Text className="text-xs text-red-600">{form.formState.errors[name]?.message}</Text>
          ) : null}
        </View>
      ))}

      <Controller
        control={form.control}
        name="isDefault"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-neutral-800">Use as my default delivery address</Text>
            <Switch value={Boolean(value)} onValueChange={onChange} testID="address-default-toggle" />
          </View>
        )}
      />

      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

      <Pressable
        onPress={form.handleSubmit(onSubmit)}
        disabled={busy}
        className={primaryButtonClass}
        testID="address-save"
      >
        <Text className="font-semibold text-white">{busy ? "Saving…" : submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}
