import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Link, Stack } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import {
  SignInRequired,
  inputClass,
  primaryButtonClass,
} from "../../src/components/account/sign-in-required";
import { updateProfile } from "../../src/lib/account-api";
import { useAuthStore } from "../../src/lib/auth-store";

function ContactRow({
  label,
  value,
  verified,
  href,
  testID,
}: {
  label: string;
  value: string | null;
  verified: boolean;
  href: "/account/change-email" | "/account/change-phone";
  testID: string;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-3" testID={testID}>
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-medium text-neutral-900">{label}</Text>
        <Text className="text-sm text-neutral-500">
          {value ?? "Not added yet"}
          {value && verified ? "  ✓" : ""}
        </Text>
      </View>
      <Link href={href} asChild>
        <Pressable className="rounded-lg border border-neutral-300 px-3 py-2">
          <Text className="text-sm font-medium text-neutral-900">{value ? "Change" : "Add"}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

export default function ProfileScreen() {
  return (
    <SignInRequired>
      <Stack.Screen options={{ title: "Profile" }} />
      <ProfileForm />
    </SignInRequired>
  );
}

function ProfileForm() {
  const user = useAuthStore((state) => state.user)!;
  const setUser = useAuthStore((state) => state.setUser);
  const [name, setName] = useState(user.name ?? "");
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => updateProfile({ name: name.trim() || null }),
    onSuccess: (updated) => {
      setUser(updated);
      setName(updated.name ?? "");
      setSaved(true);
    },
  });

  const dirty = (name.trim() || null) !== (user.name ?? null);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <View className="gap-3 rounded-xl border border-neutral-200 p-4">
        <Text className="text-base font-semibold text-neutral-900">Personal details</Text>
        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-800">Name</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              setSaved(false);
            }}
            placeholder="Your name"
            autoComplete="name"
            autoCapitalize="words"
            maxLength={120}
            className={inputClass}
            testID="profile-name"
          />
        </View>
        {save.isError ? (
          <Text className="text-sm text-red-600">{save.error.message}</Text>
        ) : null}
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => save.mutate()}
            disabled={save.isPending || !dirty}
            className={`${primaryButtonClass} px-6`}
            testID="profile-save"
          >
            <Text className="font-semibold text-white">{save.isPending ? "Saving…" : "Save"}</Text>
          </Pressable>
          {saved && !dirty ? <Text className="text-sm text-neutral-500">Saved</Text> : null}
        </View>
      </View>

      <View className="rounded-xl border border-neutral-200 px-4 py-1">
        <Text className="pt-3 text-base font-semibold text-neutral-900">Sign-in details</Text>
        <ContactRow
          label="Email"
          value={user.email}
          verified={user.emailVerified}
          href="/account/change-email"
          testID="contact-email"
        />
        <View className="h-px bg-neutral-100" />
        <ContactRow
          label="Mobile number"
          value={user.phone}
          verified={user.phoneVerified}
          href="/account/change-phone"
          testID="contact-phone"
        />
      </View>
    </ScrollView>
  );
}
