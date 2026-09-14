import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { formatPaise } from "../../lib/catalog-api";
import { deliveryDateLabel } from "../../lib/delivery-date";
import { useDeliveryStore } from "../../lib/delivery-store";
import { useSiteTheme } from "../../lib/site-theme-context";

// The product screen's answer to "when would I get this?": the chosen
// pincode and the date its quote promises. The picker that changes the
// pincode lives on the Home tab, so changing it goes there and opens it.
export function DeliveryDetails() {
  const router = useRouter();
  const theme = useSiteTheme();
  const pincode = useDeliveryStore((s) => s.pincode);
  const place = useDeliveryStore((s) => s.place);
  const quote = useDeliveryStore((s) => s.quote);
  const openPanel = useDeliveryStore((s) => s.openPanel);
  const change = () => {
    router.navigate("/(tabs)");
    openPanel();
  };

  return (
    <View
      testID="delivery-details"
      className="gap-2 rounded-xl border border-neutral-200 p-4"
    >
      <Text className="text-base font-semibold text-neutral-900">
        Delivery details
      </Text>
      <Pressable
        onPress={change}
        accessibilityRole="button"
        className="flex-row items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2"
      >
        <View className="flex-1 flex-row items-center gap-2">
          <Ionicons name="location-outline" size={16} color="#737373" />
          <Text className="flex-1 text-sm text-neutral-800" numberOfLines={1}>
            {pincode ? (
              <>
                <Text className="font-semibold">{pincode}</Text>
                {place ? ` · ${place}` : ""}
              </>
            ) : (
              "No delivery location chosen"
            )}
          </Text>
        </View>
        <Text className="text-sm font-semibold" style={{ color: theme.colors.accent }}>
          {pincode ? "Change" : "Select location"}
        </Text>
      </Pressable>
      {quote ? (
        <View className="flex-row items-center gap-2 px-3" testID="delivery-estimate">
          <Ionicons name="car-outline" size={16} color="#737373" />
          {quote.serviceable ? (
            <Text className="text-sm text-neutral-800">
              Delivery by{" "}
              <Text className="font-semibold">
                {deliveryDateLabel(quote.estimatedDays ?? 0)}
              </Text>
              {quote.deliveryFeeInPaise === 0
                ? " · Free delivery"
                : quote.deliveryFeeInPaise
                  ? ` · ${formatPaise(quote.deliveryFeeInPaise)} delivery`
                  : ""}
            </Text>
          ) : (
            <Text className="text-sm text-red-600">
              Not deliverable to {pincode} yet
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
