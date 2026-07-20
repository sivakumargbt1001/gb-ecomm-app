import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import type { CartItem } from "@geekbase-labs/shared-types";

import { useCart } from "../../src/lib/use-cart";
import { formatPaise } from "../../src/lib/catalog-api";

function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, remove } = useCart();

  return (
    <View
      className="flex-row items-center border-b border-neutral-100 px-4 py-4"
      testID="cart-item"
    >
      <View className="flex-1 gap-1">
        <Text className="text-base font-medium text-neutral-900">
          {item.productId.slice(0, 8)}...
        </Text>
        <Text className="text-sm text-neutral-500">
          {formatPaise(item.unitPriceInPaise)} each
        </Text>
        {Object.keys(item.customOptionValues).length > 0 ? (
          <Text className="text-xs text-neutral-400">
            {Object.values(item.customOptionValues).join(", ")}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center rounded-lg border border-neutral-300">
          <Pressable
            onPress={() => {
              if (item.quantity <= 1) {
                remove.mutate(item.id);
              } else {
                updateQuantity.mutate({
                  itemId: item.id,
                  quantity: item.quantity - 1,
                });
              }
            }}
            className="px-3 py-1.5"
            testID="item-qty-minus"
          >
            <Text className="text-sm font-semibold text-neutral-700">-</Text>
          </Pressable>
          <Text className="min-w-[24px] text-center text-sm font-medium">
            {item.quantity}
          </Text>
          <Pressable
            onPress={() =>
              updateQuantity.mutate({
                itemId: item.id,
                quantity: item.quantity + 1,
              })
            }
            className="px-3 py-1.5"
            testID="item-qty-plus"
          >
            <Text className="text-sm font-semibold text-neutral-700">+</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => remove.mutate(item.id)}
          className="px-2 py-1"
          testID="item-remove"
        >
          <Text className="text-sm font-medium text-red-600">Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { cart, isLoading, count } = useCart();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold text-neutral-900">
          Your cart is empty
        </Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Browse products and add items to get started.
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
    <View className="flex-1 bg-white" testID="cart-screen">
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CartItemRow item={item} />}
      />

      <View className="border-t border-neutral-200 px-4 pb-8 pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base text-neutral-600">
            Subtotal ({count} {count === 1 ? "item" : "items"})
          </Text>
          <Text className="text-lg font-semibold text-neutral-900">
            {formatPaise(cart.subtotalInPaise)}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/checkout")}
          className="mt-4 items-center rounded-lg bg-black py-4"
          testID="checkout-button"
        >
          <Text className="text-base font-semibold text-white">
            Proceed to Checkout
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
