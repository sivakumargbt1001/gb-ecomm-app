import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PincodeSchema } from "@geekbase-labs/shared-types";

import { useAuthStore } from "../../lib/auth-store";
import { formatPaise } from "../../lib/catalog-api";
import {
  describePincode,
  lookupDelivery,
  pincodeFromCoordinates,
} from "../../lib/delivery-api";
import { useDeliveryStore } from "../../lib/delivery-store";
import { useSiteTheme } from "../../lib/site-theme-context";
import { useAddresses } from "../../lib/use-addresses";

function estimateLabel(days: number): string {
  if (days === 0) return "Same-day delivery";
  if (days === 1) return "Delivery in 1 day";
  return `Delivery in ${days} days`;
}

// The website header's delivery location, as a row under the app's header:
// tap it for the dialog that checks a pincode, the device's position, or a
// saved address against where the store delivers.
export function DeliveryPicker() {
  const theme = useSiteTheme();
  const insets = useSafeAreaInsets();
  const pincode = useDeliveryStore((s) => s.pincode);
  const place = useDeliveryStore((s) => s.place);
  const quote = useDeliveryStore((s) => s.quote);
  const isPanelOpen = useDeliveryStore((s) => s.isPanelOpen);
  const hydrate = useDeliveryStore((s) => s.hydrate);
  const setQuote = useDeliveryStore((s) => s.setQuote);
  const setPlace = useDeliveryStore((s) => s.setPlace);
  const clear = useDeliveryStore((s) => s.clear);
  const openPanel = useDeliveryStore((s) => s.openPanel);
  const closePanel = useDeliveryStore((s) => s.closePanel);

  const user = useAuthStore((s) => s.user);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Re-quotes a remembered pincode, so a shopper is never shown a fee the store
  // has since changed.
  const remembered = useQuery({
    queryKey: ["delivery-quote", pincode],
    queryFn: () => lookupDelivery(pincode!),
    enabled: Boolean(pincode) && !quote,
  });

  useEffect(() => {
    if (remembered.data) setQuote(remembered.data.quote);
  }, [remembered.data, setQuote]);

  // The addresses a signed-in shopper already has. Their pincodes are the
  // fastest way to answer this question, and they are already on file.
  const saved = useAddresses();

  const check = useMutation({
    mutationFn: ({ pincode: value }: { pincode: string; place: string | null }) =>
      lookupDelivery(value),
    onSuccess: ({ quote: result }, { place: known }) => {
      // The store's own city and state, when it has them, name the pincode
      // better than any directory: they are what the fee was set against.
      const fromStore =
        result.city && result.state ? `${result.city}, ${result.state}` : null;
      setQuote(result, known ?? fromStore);
      setDraft("");
      if (!known && !fromStore) {
        void describePincode(result.pincode).then((name) => {
          if (name && useDeliveryStore.getState().pincode === result.pincode) {
            setPlace(name);
          }
        });
      }
    },
    onError: () => setError("Could not check that pincode. Try again."),
  });

  const submitPincode = (value: string, known: string | null = null) => {
    const parsed = PincodeSchema.safeParse(value);
    if (!parsed.success) {
      setError("Enter a six-digit pincode");
      return;
    }
    setError(null);
    check.mutate({ pincode: parsed.data, place: known });
  };

  // The device's own position, turned into a pincode and checked like a typed
  // one. Every way this can fail is told to the shopper in terms of what to do
  // next, since the typed route is always still there.
  const locateMe = async () => {
    setError(null);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError("Location access was denied. Enter your pincode instead.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const found = await pincodeFromCoordinates(
        position.coords.latitude,
        position.coords.longitude,
      );
      if (!found) {
        setError("Could not find a pincode for your location. Enter it instead.");
        return;
      }
      submitPincode(found.pincode, found.place);
    } catch {
      setError("Could not get your location. Enter your pincode instead.");
    } finally {
      setLocating(false);
    }
  };

  const label = place ?? (pincode ? `Deliver to ${pincode}` : "Select delivery location");

  return (
    <>
      <Pressable
        testID="delivery-trigger"
        onPress={openPanel}
        accessibilityRole="button"
        accessibilityLabel="Select delivery location"
        className="flex-row items-center gap-1.5 border-b border-neutral-100 px-4 py-2"
      >
        <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
        <Text className="flex-1 text-xs text-neutral-600" numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#737373" />
      </Pressable>

      <Modal
        visible={isPanelOpen}
        transparent
        animationType="fade"
        onRequestClose={closePanel}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        >
          <Pressable
            testID="delivery-backdrop"
            onPress={closePanel}
            accessibilityLabel="Close delivery address"
            className="flex-1"
          />
          <View
            testID="delivery-panel"
            className="max-h-[85%] rounded-t-2xl bg-white"
            style={{ paddingBottom: insets.bottom }}
          >
            <View className="flex-row items-center justify-between border-b border-neutral-100 px-5 py-4">
              <Text className="text-lg font-semibold text-neutral-900">
                Select delivery address
              </Text>
              <Pressable
                onPress={closePanel}
                accessibilityLabel="Close delivery address"
                className="p-1"
              >
                <Ionicons name="close" size={22} color={theme.colors.primary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 20, gap: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-row items-center gap-2">
                <View className="flex-1 flex-row items-center rounded-lg border border-neutral-300 px-3">
                  <Ionicons name="search" size={16} color="#737373" />
                  <TextInput
                    testID="delivery-pincode"
                    value={draft}
                    onChangeText={(text) => {
                      setDraft(text.replace(/\D/g, ""));
                      setError(null);
                    }}
                    onSubmitEditing={() => submitPincode(draft)}
                    placeholder="Search by pin code"
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="search"
                    className="h-10 flex-1 pl-2 text-sm text-neutral-900"
                  />
                </View>
                <Pressable
                  testID="delivery-check"
                  onPress={() => submitPincode(draft)}
                  disabled={check.isPending}
                  className="h-10 justify-center rounded-lg px-4"
                  style={{
                    backgroundColor: theme.colors.primary,
                    opacity: check.isPending ? 0.5 : 1,
                  }}
                >
                  <Text className="text-xs font-semibold uppercase tracking-wide text-white">
                    {check.isPending ? "Checking…" : "Check"}
                  </Text>
                </Pressable>
              </View>

              {error ? (
                <Text testID="delivery-error" className="text-xs text-red-600">
                  {error}
                </Text>
              ) : null}

              {quote && !quote.notConfigured ? (
                <View className="rounded-lg border border-neutral-200 p-4">
                  {quote.serviceable ? (
                    <View testID="delivery-serviceable" className="gap-1">
                      <Text className="text-sm font-medium text-neutral-900">
                        {quote.city}, {quote.state} · {quote.pincode}
                      </Text>
                      <Text className="text-sm text-neutral-500">
                        {estimateLabel(quote.estimatedDays ?? 0)}
                      </Text>
                      <Text className="text-sm text-neutral-500">
                        {quote.deliveryFeeInPaise === 0
                          ? "Free delivery"
                          : `Delivery ${formatPaise(quote.deliveryFeeInPaise ?? 0)}`}
                      </Text>
                    </View>
                  ) : (
                    <Text testID="delivery-unserviceable" className="text-sm text-red-600">
                      We do not deliver to {quote.pincode} yet.
                    </Text>
                  )}
                  <Pressable onPress={clear} className="mt-3 self-start">
                    <Text className="text-xs text-neutral-500 underline">
                      Change location
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <Pressable
                testID="delivery-current-location"
                onPress={() => void locateMe()}
                disabled={locating}
                className="flex-row items-center gap-3 border-b border-dashed border-neutral-200 pb-5"
                style={{ opacity: locating ? 0.6 : 1 }}
              >
                {locating ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Ionicons name="locate" size={20} color={theme.colors.primary} />
                )}
                <View className="flex-1">
                  <Text
                    className="text-sm font-medium"
                    style={{ color: theme.colors.primary }}
                  >
                    {locating ? "Finding your location…" : "Use my current location"}
                  </Text>
                  <Text className="text-xs text-neutral-500">Allow access to location</Text>
                </View>
              </Pressable>

              <View>
                <Text className="mb-3 text-sm font-semibold text-neutral-900">
                  Saved addresses
                </Text>
                {!user ? (
                  <Link href="/(auth)/login" asChild>
                    <Pressable onPress={closePanel}>
                      <Text
                        className="text-sm underline"
                        style={{ color: theme.colors.primary }}
                      >
                        Log in to see saved addresses
                      </Text>
                    </Pressable>
                  </Link>
                ) : saved.isLoading ? (
                  <Text className="text-sm text-neutral-500">Loading…</Text>
                ) : saved.addresses.length === 0 ? (
                  <Text className="text-sm text-neutral-500">
                    No saved addresses yet. They appear here once you place an order.
                  </Text>
                ) : (
                  <View className="gap-2">
                    {saved.addresses.map((address) => (
                      <Pressable
                        key={address.id}
                        testID="saved-address"
                        onPress={() => submitPincode(address.postalCode)}
                        className="rounded-lg border border-neutral-200 p-3"
                      >
                        <Text className="text-sm font-medium text-neutral-900">
                          {address.fullName}
                        </Text>
                        <Text className="text-sm text-neutral-500">
                          {address.line1}, {address.city} {address.postalCode}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
