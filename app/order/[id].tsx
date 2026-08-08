import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import type { OrderLineItem } from "@geekbase-labs/shared-types";

import { formatPaise } from "../../src/lib/catalog-api";
import { useAuthStore } from "../../src/lib/auth-store";
import {
  formatOrderDate,
  orderStatusLabel,
  orderTimeline,
  type TimelineStep,
} from "../../src/lib/order-status";
import { useBuyAgain, useOrder } from "../../src/lib/use-orders";

function TimelineRow({ step }: { step: TimelineStep }) {
  const cancelled = step.status === "cancelled";

  return (
    <View className="flex-row items-center gap-3 py-2" testID={`timeline-${step.state}`}>
      <View
        className={
          step.state === "upcoming"
            ? "h-6 w-6 rounded-full border border-neutral-300"
            : cancelled
              ? "h-6 w-6 rounded-full bg-red-600"
              : "h-6 w-6 rounded-full bg-black"
        }
      />
      <Text
        className={
          step.state === "upcoming"
            ? "text-sm text-neutral-400"
            : "text-sm font-medium text-neutral-900"
        }
      >
        {step.label}
      </Text>
    </View>
  );
}

function LineItem({ item }: { item: OrderLineItem }) {
  const options = Object.values(item.customOptionValues);

  return (
    <View
      className="flex-row items-start justify-between border-b border-neutral-100 py-3"
      testID="order-item"
    >
      <View className="flex-1 pr-3">
        <Text className="text-base font-medium text-neutral-900">{item.name}</Text>
        <Text className="mt-0.5 text-sm text-neutral-500">
          {item.quantity} × {formatPaise(item.unitPriceInPaise)}
        </Text>
        {options.length > 0 ? (
          <Text className="mt-0.5 text-xs text-neutral-400">
            {options.join(", ")}
          </Text>
        ) : null}
      </View>
      <Text className="text-base font-semibold text-neutral-900">
        {formatPaise(item.unitPriceInPaise * item.quantity)}
      </Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { order, isLoading, error } = useOrder(id, Boolean(user) && Boolean(id));
  const buyAgain = useBuyAgain();

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Stack.Screen options={{ headerShown: true, title: "Order" }} />
        <Text className="text-lg font-semibold text-neutral-900">
          Sign in to see this order
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ headerShown: true, title: "Order" }} />
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Stack.Screen options={{ headerShown: true, title: "Order" }} />
        <Text className="text-sm text-red-600" testID="order-error">
          {error?.message ?? "Order not found"}
        </Text>
        <Pressable
          onPress={() => router.navigate("/(tabs)/orders")}
          className="mt-6 rounded-lg bg-black px-8 py-3"
        >
          <Text className="font-semibold text-white">Back to orders</Text>
        </Pressable>
      </View>
    );
  }

  const address = order.shippingAddress;

  return (
    <ScrollView className="flex-1 bg-white" testID="order-detail">
      <Stack.Screen
        options={{ headerShown: true, title: `Order #${order.id.slice(0, 8)}` }}
      />

      <View className="px-4 py-4">
        <Text className="text-sm text-neutral-500">
          Placed {formatOrderDate(order.createdAt)}
        </Text>
        <Text className="mt-1 text-lg font-semibold text-neutral-900">
          {orderStatusLabel(order.status)}
        </Text>
      </View>

      <View className="border-t border-neutral-100 px-4 py-4" testID="order-timeline">
        {orderTimeline(order.status).map((step) => (
          <TimelineRow key={step.status} step={step} />
        ))}
      </View>

      {order.trackingLink || order.courierName ? (
        <View
          className="border-t border-neutral-100 px-4 py-4"
          testID="order-tracking"
        >
          <Text className="text-base font-semibold text-neutral-900">Shipment</Text>
          {order.courierName ? (
            <Text className="mt-1 text-sm text-neutral-600">
              Courier: {order.courierName}
            </Text>
          ) : null}
          {order.trackingLink ? (
            <Pressable
              onPress={() => Linking.openURL(order.trackingLink as string)}
              className="mt-3 self-start rounded-lg border border-neutral-300 px-4 py-2"
              testID="track-shipment"
            >
              <Text className="text-sm font-medium text-neutral-800">
                Track shipment
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className="border-t border-neutral-100 px-4 py-4">
        <Text className="mb-2 text-base font-semibold text-neutral-900">Items</Text>
        {order.items.map((item) => (
          <LineItem key={item.id} item={item} />
        ))}
        <View className="flex-row items-center justify-between pt-3">
          <Text className="text-base font-semibold text-neutral-900">Total</Text>
          <Text className="text-base font-semibold text-neutral-900" testID="order-total">
            {formatPaise(order.totalInPaise)}
          </Text>
        </View>
      </View>

      <View className="border-t border-neutral-100 px-4 py-4">
        <Text className="mb-2 text-base font-semibold text-neutral-900">
          Shipping to
        </Text>
        <Text className="text-sm text-neutral-900">{address.fullName}</Text>
        <Text className="text-sm text-neutral-600">{address.line1}</Text>
        {address.line2 ? (
          <Text className="text-sm text-neutral-600">{address.line2}</Text>
        ) : null}
        <Text className="text-sm text-neutral-600">
          {address.city}, {address.state} {address.postalCode}
        </Text>
        <Text className="text-sm text-neutral-600">{address.country}</Text>
        <Text className="text-sm text-neutral-600">{address.phone}</Text>
      </View>

      <View className="px-4 pb-10 pt-2">
        <Pressable
          onPress={() =>
            buyAgain.mutate(order.id, {
              onSuccess: () => router.push("/(tabs)/cart"),
            })
          }
          disabled={buyAgain.isPending}
          className="items-center rounded-lg bg-black py-4"
          testID="buy-again"
        >
          <Text className="text-base font-semibold text-white">
            {buyAgain.isPending ? "Adding..." : "Buy again"}
          </Text>
        </Pressable>
        {buyAgain.isError ? (
          <Text className="mt-2 text-xs text-red-600">
            {buyAgain.error.message}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
