import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import type { Order } from "@geekbase-labs/shared-types";

import { formatPaise } from "../../src/lib/catalog-api";
import { useAuthStore } from "../../src/lib/auth-store";
import {
  formatOrderDate,
  orderItemCount,
  orderStatusLabel,
} from "../../src/lib/order-status";
import { useBuyAgain, useOrders } from "../../src/lib/use-orders";
import { PointsSummary } from "../../src/components/loyalty/points-summary";

function OrderRow({ order }: { order: Order }) {
  const buyAgain = useBuyAgain();
  const count = orderItemCount(order);

  return (
    <View
      className="border-b border-neutral-100 px-4 py-4"
      testID="order-row"
    >
      <Pressable onPress={() => router.push(`/order/${order.id}`)}>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium text-neutral-900">
            Order #{order.id.slice(0, 8)}
          </Text>
          <Text className="text-base font-semibold text-neutral-900">
            {formatPaise(order.totalInPaise)}
          </Text>
        </View>
        <Text className="mt-1 text-sm text-neutral-500">
          {formatOrderDate(order.createdAt)} · {count}{" "}
          {count === 1 ? "item" : "items"}
        </Text>
        <Text className="mt-1 text-sm font-medium text-neutral-700">
          {orderStatusLabel(order.status)}
        </Text>
      </Pressable>

      <View className="mt-3 flex-row items-center gap-3">
        <Pressable
          onPress={() =>
            buyAgain.mutate(order.id, {
              onSuccess: () => router.push("/(tabs)/cart"),
            })
          }
          disabled={buyAgain.isPending}
          className="rounded-lg border border-neutral-300 px-4 py-2"
          testID="buy-again"
        >
          <Text className="text-sm font-medium text-neutral-800">
            {buyAgain.isPending ? "Adding..." : "Buy again"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/order/${order.id}`)}
          className="rounded-lg bg-black px-4 py-2"
          testID="view-order"
        >
          <Text className="text-sm font-semibold text-white">View order</Text>
        </Pressable>
      </View>

      {buyAgain.isError ? (
        <Text className="mt-2 text-xs text-red-600">
          {buyAgain.error.message}
        </Text>
      ) : null}
    </View>
  );
}

export default function OrdersScreen() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const { orders, isLoading, error } = useOrders(Boolean(user));

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold text-neutral-900">
          Sign in to see your orders
        </Text>
        <Text className="mt-1 text-center text-sm text-neutral-500">
          Your order history and delivery tracking live here.
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable className="mt-6 rounded-lg bg-black px-8 py-3">
            <Text className="font-semibold text-white">Log In</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-sm text-red-600" testID="orders-error">
          {error.message}
        </Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold text-neutral-900">
          No orders yet
        </Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Anything you buy will show up here.
        </Text>
        <Pressable
          onPress={() => router.navigate("/(tabs)")}
          className="mt-6 rounded-lg bg-black px-8 py-3"
        >
          <Text className="font-semibold text-white">Browse Products</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" testID="orders-screen">
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        ListHeaderComponent={PointsSummary}
        renderItem={({ item }) => <OrderRow order={item} />}
      />
    </View>
  );
}
