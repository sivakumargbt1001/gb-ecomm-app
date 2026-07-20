import { Pressable, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";

import { formatPaise } from "../../src/lib/catalog-api";

export default function OrderConfirmationScreen() {
  const { orderId, total, razorpayOrderId } = useLocalSearchParams<{
    orderId: string;
    total: string;
    razorpayOrderId: string;
  }>();

  return (
    <>
      <Stack.Screen
        options={{ title: "Order Confirmed", headerBackVisible: false }}
      />
      <View
        className="flex-1 items-center justify-center bg-white px-6"
        testID="order-confirmation"
      >
        <View className="w-full max-w-sm items-center gap-6 rounded-2xl border border-neutral-200 p-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Text className="text-3xl">✓</Text>
          </View>

          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-neutral-900">
              Thank you!
            </Text>
            <Text className="text-center text-sm text-neutral-500">
              Your order has been placed successfully.
            </Text>
          </View>

          <View className="w-full gap-3 rounded-lg bg-neutral-50 p-4">
            <View className="flex-row justify-between">
              <Text className="text-sm text-neutral-500">Order ID</Text>
              <Text className="text-sm font-medium text-neutral-900">
                {orderId?.slice(0, 8)}...
              </Text>
            </View>
            {total ? (
              <View className="flex-row justify-between">
                <Text className="text-sm text-neutral-500">Total</Text>
                <Text className="text-sm font-medium text-neutral-900">
                  {formatPaise(Number(total))}
                </Text>
              </View>
            ) : null}
            {razorpayOrderId ? (
              <View className="flex-row justify-between">
                <Text className="text-sm text-neutral-500">Payment Ref</Text>
                <Text className="text-sm font-medium text-neutral-900">
                  {razorpayOrderId.slice(0, 16)}...
                </Text>
              </View>
            ) : null}
            <View className="flex-row justify-between">
              <Text className="text-sm text-neutral-500">Status</Text>
              <Text className="text-sm font-medium text-amber-600">
                Payment Pending
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.replace("/(tabs)")}
            className="w-full items-center rounded-lg bg-black py-3"
            testID="continue-shopping"
          >
            <Text className="font-semibold text-white">Continue Shopping</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
