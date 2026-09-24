import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { CartItem, WishlistItem } from "@geekbase-labs/shared-types";

import { EmptyStateSuggestions } from "../../src/components/catalog/empty-state-suggestions";
import { ProductRecommendations } from "../../src/components/catalog/product-recommendations";
import { useCart } from "../../src/lib/use-cart";
import { formatPaise } from "../../src/lib/catalog-api";
import { deliveryDateLabel } from "../../src/lib/delivery-date";
import { priceBag, useDeliveryFeeRule } from "../../src/lib/delivery-fee";
import { useDeliveryStore } from "../../src/lib/delivery-store";
import { useSiteTheme } from "../../src/lib/site-theme-context";
import { useAuthStore } from "../../src/lib/auth-store";
import { WISHLIST_KEY } from "../../src/lib/use-wishlist";
import { withSavedItem } from "../../src/lib/wishlist";
import { addWishlistItem } from "../../src/lib/wishlist-api";

function CartItemRow({ item, deliveryBy }: { item: CartItem; deliveryBy: string | null }) {
  const { updateQuantity, remove } = useCart();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Save for later moves the line to the wishlist, size and all, so the
  // wishlist can offer to buy it without asking for the size again. Needs an
  // account, since the wishlist is the shopper's own.
  const saveForLater = async () => {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    const saved = await addWishlistItem(item.productId, item.variantId);
    queryClient.setQueryData<WishlistItem[]>(WISHLIST_KEY, (prev) =>
      withSavedItem(prev ?? [], saved),
    );
    remove.mutate(item.id);
  };

  return (
    <View className="border-b border-neutral-100" testID="cart-item">
      <View className="flex-row gap-3 px-4 py-4">
        <Pressable
          onPress={() => router.push(`/product/${item.productSlug}`)}
          accessibilityRole="link"
          accessibilityLabel={item.productName}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              className="h-20 w-20 rounded-md border border-neutral-200"
              resizeMode="cover"
            />
          ) : (
            <View className="h-20 w-20 items-center justify-center rounded-md border border-neutral-200">
              <Text className="text-[10px] text-neutral-400">No image</Text>
            </View>
          )}
        </Pressable>

        <View className="flex-1 gap-1">
          <Pressable onPress={() => router.push(`/product/${item.productSlug}`)}>
            <Text className="text-base font-medium text-neutral-900" numberOfLines={2}>
              {item.productName}
            </Text>
          </Pressable>
          {item.variantName ? (
            <Text className="text-sm text-neutral-500">{item.variantName}</Text>
          ) : null}
          {item.options.map((option) => (
            <Text key={option.fieldId} className="text-sm text-neutral-500" numberOfLines={1}>
              {option.label}: {option.value}
            </Text>
          ))}

          <View className="mt-1 flex-row items-center gap-3">
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
              <Text className="min-w-[24px] text-center text-sm font-medium">{item.quantity}</Text>
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
            <Text className="text-base font-semibold text-neutral-900">
              {formatPaise(item.unitPriceInPaise * item.quantity)}
            </Text>
            {item.quantity > 1 ? (
              <Text className="text-xs text-neutral-500">
                {formatPaise(item.unitPriceInPaise)} each
              </Text>
            ) : null}
          </View>

          {deliveryBy ? (
            <Text className="mt-1 text-sm text-neutral-500" testID="bag-delivery-by">
              Delivery by <Text className="text-neutral-900">{deliveryBy}</Text>
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row border-t border-neutral-100">
        <Pressable
          onPress={() => void saveForLater()}
          className="flex-1 flex-row items-center justify-center gap-2 py-3"
          testID="item-save-for-later"
        >
          <Ionicons name="bookmark-outline" size={16} color="#404040" />
          <Text className="text-sm font-semibold text-neutral-800">Save for later</Text>
        </Pressable>
        <View className="w-px bg-neutral-100" />
        <Pressable
          onPress={() => remove.mutate(item.id)}
          className="flex-1 flex-row items-center justify-center gap-2 py-3"
          testID="item-remove"
        >
          <Ionicons name="trash-outline" size={16} color="#404040" />
          <Text className="text-sm font-semibold text-neutral-800">Remove</Text>
        </Pressable>
        <View className="w-px bg-neutral-100" />
        <Pressable
          onPress={() => router.push("/checkout")}
          className="flex-1 flex-row items-center justify-center gap-2 py-3"
          testID="item-buy-now"
        >
          <Ionicons name="flash-outline" size={16} color="#404040" />
          <Text className="text-sm font-semibold text-neutral-800">Buy this now</Text>
        </Pressable>
      </View>
    </View>
  );
}

// The bag: the lines, where they are going and when, the price broken down,
// and the order button pinned to the bottom — the same page the website
// shows, folded to a phone.
export default function CartScreen() {
  const theme = useSiteTheme();
  const { cart, isLoading, count, updateQuantity } = useCart();
  const pincode = useDeliveryStore((s) => s.pincode);
  const place = useDeliveryStore((s) => s.place);
  const quote = useDeliveryStore((s) => s.quote);
  const feeRule = useDeliveryFeeRule();
  const openPanel = useDeliveryStore((s) => s.openPanel);

  // The delivery picker lives on the Home tab, so changing the location
  // goes there and opens it.
  const changeDelivery = () => {
    router.navigate("/(tabs)");
    openPanel();
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyStateSuggestions
        testID="cart-empty"
        title="Your bag is empty"
        message="Nothing in here yet. Have a look at what's new and what everyone is buying."
      />
    );
  }

  // The fee follows the bag, not the pincode. Coupons and points come off at
  // checkout, which prices the fee again on what is left.
  const { deliveryFeeInPaise, shortfallInPaise, totalInPaise } = priceBag(
    cart.subtotalInPaise,
    feeRule,
  );
  const deliveryBy =
    quote?.serviceable && quote.estimatedDays !== null
      ? deliveryDateLabel(quote.estimatedDays)
      : null;
  const firstItem = cart.items[0];

  return (
    <View className="flex-1 bg-white" testID="cart-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Pressable
          onPress={changeDelivery}
          testID="bag-deliver-to"
          accessibilityRole="button"
          className="flex-row items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3"
        >
          <View className="flex-1 flex-row items-center gap-2">
            <Ionicons name="location-outline" size={18} color="#737373" />
            <Text className="flex-1 text-sm text-neutral-800" numberOfLines={1}>
              {pincode ? (
                <>
                  Deliver to: <Text className="font-semibold">{place ?? pincode}</Text>
                </>
              ) : (
                "Select a delivery location to see delivery dates"
              )}
            </Text>
          </View>
          <Text className="text-sm font-semibold" style={{ color: theme.colors.accent }}>
            {pincode ? "Change" : "Select"}
          </Text>
        </Pressable>
        {quote && !quote.serviceable ? (
          <Text className="px-4 pt-3 text-sm text-red-600" testID="bag-unserviceable">
            We don&apos;t deliver to {pincode} yet. Choose another location.
          </Text>
        ) : null}

        {updateQuantity.isError ? (
          <Text className="px-4 pt-3 text-sm text-red-600" testID="bag-quantity-error">
            {updateQuantity.error.message}
          </Text>
        ) : null}

        {cart.items.map((item) => (
          <CartItemRow key={item.id} item={item} deliveryBy={deliveryBy} />
        ))}

        <View
          className="mx-4 mt-4 gap-2 rounded-xl border border-neutral-200 p-4"
          testID="price-details"
        >
          <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Price details
          </Text>
          <View className="flex-row justify-between pt-1">
            <Text className="text-sm text-neutral-800">
              Price ({count} {count === 1 ? "item" : "items"})
            </Text>
            <Text className="text-sm text-neutral-800" testID="bag-subtotal">
              {formatPaise(cart.subtotalInPaise)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-neutral-800">Delivery</Text>
            <Text
              className={`text-sm ${deliveryFeeInPaise === 0 ? "text-emerald-700" : "text-neutral-800"}`}
              testID="bag-delivery-fee"
            >
              {deliveryFeeInPaise === 0 ? "Free" : formatPaise(deliveryFeeInPaise)}
            </Text>
          </View>
          {shortfallInPaise > 0 ? (
            <Text className="text-xs text-neutral-600" testID="bag-free-delivery-nudge">
              Add {formatPaise(shortfallInPaise)} more for free delivery
            </Text>
          ) : null}
          <View className="flex-row justify-between border-t border-dashed border-neutral-200 pt-2">
            <Text className="text-base font-semibold text-neutral-900">Total amount</Text>
            <Text className="text-base font-semibold text-neutral-900" testID="bag-total">
              {formatPaise(totalInPaise)}
            </Text>
          </View>
          <Text className="pt-1 text-xs text-neutral-500">
            Have a coupon? Apply it at checkout.
          </Text>
        </View>

        <View className="flex-row items-start gap-2 px-5 pt-4">
          <Ionicons name="shield-checkmark-outline" size={18} color="#737373" />
          <Text className="flex-1 text-xs text-neutral-500">
            Safe and secure payments. Easy returns. 100% authentic products.
          </Text>
        </View>

        {firstItem ? (
          <View className="px-4 pt-6">
            <ProductRecommendations
              productId={firstItem.productId}
              title="Items you may have missed"
            />
          </View>
        ) : null}
      </ScrollView>

      <View className="flex-row items-center justify-between gap-4 border-t border-neutral-200 px-4 pb-8 pt-3">
        <View>
          <Text className="text-xs text-neutral-500">Total</Text>
          <Text className="text-lg font-semibold text-neutral-900">
            {formatPaise(totalInPaise)}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/checkout")}
          className="items-center rounded-lg px-8 py-3.5"
          style={{ backgroundColor: theme.colors.primary }}
          testID="checkout-button"
        >
          <Text className="text-base font-semibold text-white">Place order</Text>
        </Pressable>
      </View>
    </View>
  );
}
