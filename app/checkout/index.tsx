import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CartContactSchema,
  CheckoutAddressSchema,
  type CartContactInput,
  type CheckoutResult,
  type CouponPreview,
} from "@geekbase-labs/shared-types";
import type { z } from "zod";
import { useTrackEvent } from "../../src/lib/use-track-event";
import { useCart } from "../../src/lib/use-cart";
import { checkout, setCartContact } from "../../src/lib/cart-api";
import { formatPaise } from "../../src/lib/catalog-api";
import { useCartUiStore } from "../../src/lib/cart-store";
import { appliedDiscount, checkoutCouponCode } from "../../src/lib/coupon";
import { checkoutRedeemPoints, redeemedValueInPaise } from "../../src/lib/loyalty";
import { useLoyaltyBalance } from "../../src/lib/use-loyalty";
import { CouponField } from "../../src/components/checkout/coupon-field";
import { LoyaltyField } from "../../src/components/checkout/loyalty-field";

type CheckoutAddressForm = z.input<typeof CheckoutAddressSchema>;

type Step = "contact" | "address" | "review";

export default function CheckoutScreen() {
  const { cart, isLoading, refetch } = useCart();
  const [step, setStep] = useState<Step>("contact");
  const [savedContact, setSavedContact] = useState<CartContactInput | null>(
    null,
  );
  const [savedAddress, setSavedAddress] = useState<CheckoutAddressForm | null>(
    null,
  );
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [points, setPoints] = useState(0);
  const { balance } = useLoyaltyBalance();
  const setCheckoutLoading = useCartUiStore((s) => s.setCheckoutLoading);
  const isCheckoutLoading = useCartUiStore((s) => s.isCheckoutLoading);

  useTrackEvent("checkout_started");

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Checkout" }} />
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator />
        </View>
      </>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: "Checkout" }} />
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="text-lg font-semibold text-neutral-900">
            Your cart is empty
          </Text>
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            className="mt-6 rounded-lg bg-black px-8 py-3"
          >
            <Text className="font-semibold text-white">Browse Products</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Checkout" }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {step === "contact" ? (
          <ContactStep
            initial={savedContact}
            onNext={(data) => {
              setSavedContact(data);
              setStep("address");
            }}
          />
        ) : step === "address" ? (
          <AddressStep
            initial={savedAddress}
            onBack={() => setStep("contact")}
            onNext={(data) => {
              setSavedAddress(data);
              setStep("review");
            }}
          />
        ) : (
          <ReviewStep
            cart={cart}
            contact={savedContact!}
            address={savedAddress!}
            coupon={coupon}
            onCouponChange={setCoupon}
            points={points}
            onPointsChange={setPoints}
            isLoading={isCheckoutLoading}
            onBack={() => setStep("address")}
            onPay={async () => {
              setCheckoutLoading(true);
              try {
                await setCartContact(savedContact!);

                const addr = savedAddress!;
                // Re-priced server-side regardless; a code that no longer
                // matches the cart is withheld rather than sent.
                const couponCode = checkoutCouponCode(
                  coupon,
                  cart.subtotalInPaise,
                );
                const applied = appliedDiscount(coupon, cart.subtotalInPaise);
                // Re-capped server-side against the balance and the merchant's
                // ceiling; points the order can no longer take are withheld.
                const redeemPoints = balance
                  ? checkoutRedeemPoints({
                      points,
                      balance: balance.balance,
                      maxRedemptionPercent: balance.maxRedemptionPercent,
                      subtotalInPaise: cart.subtotalInPaise,
                      payableInPaise: applied.totalInPaise,
                    })
                  : undefined;
                const result = await checkout({
                  shippingAddress: { ...addr, country: addr.country ?? "IN" },
                  contactEmail: savedContact!.contactEmail ?? undefined,
                  contactPhone: savedContact!.contactPhone ?? undefined,
                  whatsappOptIn: savedContact!.whatsappOptIn ?? false,
                  ...(couponCode ? { couponCode } : {}),
                  ...(redeemPoints ? { redeemPoints } : {}),
                });

                await refetch();
                handlePayment(result);
              } catch (err) {
                Alert.alert(
                  "Checkout failed",
                  err instanceof Error ? err.message : "Please try again.",
                );
              } finally {
                setCheckoutLoading(false);
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </>
  );
}

function handlePayment(result: CheckoutResult) {
  router.replace({
    pathname: "/checkout/confirmation",
    params: {
      orderId: result.order.id,
      total: String(result.order.totalInPaise),
      razorpayOrderId: result.razorpay.orderId,
    },
  });
}

function ContactStep({
  initial,
  onNext,
}: {
  initial: CartContactInput | null;
  onNext: (data: CartContactInput) => void;
}) {
  const form = useForm<CartContactInput>({
    resolver: zodResolver(CartContactSchema),
    defaultValues: {
      contactEmail: initial?.contactEmail ?? "",
      contactPhone: initial?.contactPhone ?? "",
      whatsappOptIn: initial?.whatsappOptIn ?? false,
    },
  });

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 20, gap: 20 }}
    >
      <View className="gap-1">
        <Text className="text-xl font-semibold text-neutral-900">
          Contact Information
        </Text>
        <Text className="text-sm text-neutral-500">
          So we can send order updates
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-800">Email</Text>
        <Controller
          control={form.control}
          name="contactEmail"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              className="rounded-lg border border-neutral-300 px-4 py-3"
              testID="contact-email"
            />
          )}
        />
        {form.formState.errors.contactEmail ? (
          <Text className="text-xs text-red-600">
            {form.formState.errors.contactEmail.message}
          </Text>
        ) : null}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-800">Phone</Text>
        <Controller
          control={form.control}
          name="contactPhone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="+919876543210"
              keyboardType="phone-pad"
              className="rounded-lg border border-neutral-300 px-4 py-3"
              testID="contact-phone"
            />
          )}
        />
        {form.formState.errors.contactPhone ? (
          <Text className="text-xs text-red-600">
            {form.formState.errors.contactPhone.message}
          </Text>
        ) : null}
      </View>

      <Controller
        control={form.control}
        name="whatsappOptIn"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
            <Text className="text-sm text-neutral-700">
              Receive updates via WhatsApp
            </Text>
            <Switch
              value={value ?? false}
              onValueChange={onChange}
              testID="whatsapp-opt-in"
            />
          </View>
        )}
      />

      <Pressable
        onPress={form.handleSubmit((data) => {
          if (!data.contactEmail && !data.contactPhone) {
            Alert.alert(
              "Contact required",
              "Please provide an email or phone number.",
            );
            return;
          }
          onNext(data);
        })}
        className="items-center rounded-lg bg-black py-4"
        testID="contact-next"
      >
        <Text className="text-base font-semibold text-white">
          Continue to Address
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function AddressStep({
  initial,
  onBack,
  onNext,
}: {
  initial: CheckoutAddressForm | null;
  onBack: () => void;
  onNext: (data: CheckoutAddressForm) => void;
}) {
  const form = useForm<CheckoutAddressForm>({
    resolver: zodResolver(CheckoutAddressSchema),
    defaultValues: {
      fullName: initial?.fullName ?? "",
      phone: initial?.phone ?? "",
      line1: initial?.line1 ?? "",
      line2: initial?.line2 ?? "",
      city: initial?.city ?? "",
      state: initial?.state ?? "",
      postalCode: initial?.postalCode ?? "",
      country: initial?.country ?? "IN",
    },
  });

  const fields: {
    name: keyof CheckoutAddressForm;
    label: string;
    placeholder: string;
    keyboard?: "phone-pad";
  }[] = [
    { name: "fullName", label: "Full Name", placeholder: "John Doe" },
    {
      name: "phone",
      label: "Phone",
      placeholder: "+919876543210",
      keyboard: "phone-pad",
    },
    { name: "line1", label: "Address Line 1", placeholder: "123 Main Street" },
    {
      name: "line2",
      label: "Address Line 2 (optional)",
      placeholder: "Apt 4B",
    },
    { name: "city", label: "City", placeholder: "Mumbai" },
    { name: "state", label: "State", placeholder: "Maharashtra" },
    { name: "postalCode", label: "Postal Code", placeholder: "400001" },
  ];

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 20, gap: 16 }}
    >
      <Text className="text-xl font-semibold text-neutral-900">
        Shipping Address
      </Text>

      {fields.map(({ name, label, placeholder, keyboard }) => (
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
                className="rounded-lg border border-neutral-300 px-4 py-3"
                testID={`address-${name}`}
              />
            )}
          />
          {form.formState.errors[name] ? (
            <Text className="text-xs text-red-600">
              {form.formState.errors[name]?.message}
            </Text>
          ) : null}
        </View>
      ))}

      <View className="flex-row gap-3">
        <Pressable
          onPress={onBack}
          className="flex-1 items-center rounded-lg border border-neutral-300 py-4"
        >
          <Text className="text-base font-semibold text-neutral-700">Back</Text>
        </Pressable>
        <Pressable
          onPress={form.handleSubmit(onNext)}
          className="flex-1 items-center rounded-lg bg-black py-4"
          testID="address-next"
        >
          <Text className="text-base font-semibold text-white">
            Review Order
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ReviewStep({
  cart,
  contact,
  address,
  coupon,
  onCouponChange,
  points,
  onPointsChange,
  isLoading,
  onBack,
  onPay,
}: {
  cart: NonNullable<ReturnType<typeof useCart>["cart"]>;
  contact: CartContactInput;
  address: CheckoutAddressForm;
  coupon: CouponPreview | null;
  onCouponChange: (preview: CouponPreview | null) => void;
  points: number;
  onPointsChange: (points: number) => void;
  isLoading: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  const applied = appliedDiscount(coupon, cart.subtotalInPaise);
  // Points come off what the coupon left, the same order the server prices in.
  const pointsDiscountInPaise = Math.min(
    redeemedValueInPaise(points),
    applied.totalInPaise,
  );
  const payableInPaise = applied.totalInPaise - pointsDiscountInPaise;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 20, gap: 20 }}
    >
      <Text className="text-xl font-semibold text-neutral-900">
        Review & Pay
      </Text>

      <View className="gap-2 rounded-lg border border-neutral-200 p-4">
        <Text className="text-sm font-medium text-neutral-800">Contact</Text>
        {contact.contactEmail ? (
          <Text className="text-sm text-neutral-600">
            {contact.contactEmail}
          </Text>
        ) : null}
        {contact.contactPhone ? (
          <Text className="text-sm text-neutral-600">
            {contact.contactPhone}
          </Text>
        ) : null}
        {contact.whatsappOptIn ? (
          <Text className="text-xs text-green-700">WhatsApp updates: On</Text>
        ) : null}
      </View>

      <View className="gap-2 rounded-lg border border-neutral-200 p-4">
        <Text className="text-sm font-medium text-neutral-800">
          Shipping Address
        </Text>
        <Text className="text-sm text-neutral-600">{address.fullName}</Text>
        <Text className="text-sm text-neutral-600">
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
        </Text>
        <Text className="text-sm text-neutral-600">
          {address.city}, {address.state} {address.postalCode}
        </Text>
        <Text className="text-sm text-neutral-600">{address.phone}</Text>
      </View>

      <View className="gap-2 rounded-lg border border-neutral-200 p-4">
        <Text className="text-sm font-medium text-neutral-800">
          Order Summary
        </Text>
        {cart.items.map((item) => (
          <View key={item.id} className="flex-row justify-between py-1">
            <Text className="text-sm text-neutral-600">
              {item.productId.slice(0, 8)}... x {item.quantity}
            </Text>
            <Text className="text-sm text-neutral-900">
              {formatPaise(item.unitPriceInPaise * item.quantity)}
            </Text>
          </View>
        ))}
        <View className="mt-2 flex-row justify-between border-t border-neutral-100 pt-2">
          <Text className="text-sm text-neutral-600">Subtotal</Text>
          <Text testID="checkout-subtotal" className="text-sm text-neutral-900">
            {formatPaise(cart.subtotalInPaise)}
          </Text>
        </View>
        {applied.discountInPaise > 0 ? (
          <View className="flex-row justify-between">
            <Text className="text-sm text-neutral-600">
              Discount{coupon ? ` (${coupon.code})` : ""}
            </Text>
            <Text testID="checkout-discount" className="text-sm text-neutral-900">
              −{formatPaise(applied.discountInPaise)}
            </Text>
          </View>
        ) : null}
        {pointsDiscountInPaise > 0 ? (
          <View className="flex-row justify-between">
            <Text className="text-sm text-neutral-600">Points ({points})</Text>
            <Text testID="checkout-points" className="text-sm text-neutral-900">
              −{formatPaise(pointsDiscountInPaise)}
            </Text>
          </View>
        ) : null}
        <View className="flex-row justify-between">
          <Text className="text-base font-semibold text-neutral-900">
            Total
          </Text>
          <Text
            testID="checkout-total"
            className="text-base font-semibold text-neutral-900"
          >
            {formatPaise(payableInPaise)}
          </Text>
        </View>
      </View>

      <CouponField
        subtotalInPaise={cart.subtotalInPaise}
        preview={coupon}
        onPreviewChange={onCouponChange}
      />

      <LoyaltyField
        subtotalInPaise={cart.subtotalInPaise}
        payableInPaise={applied.totalInPaise}
        points={points}
        onPointsChange={onPointsChange}
      />

      <View className="flex-row gap-3">
        <Pressable
          onPress={onBack}
          disabled={isLoading}
          className="flex-1 items-center rounded-lg border border-neutral-300 py-4 disabled:opacity-50"
        >
          <Text className="text-base font-semibold text-neutral-700">Back</Text>
        </Pressable>
        <Pressable
          onPress={onPay}
          disabled={isLoading}
          className="flex-1 items-center rounded-lg bg-black py-4 disabled:opacity-50"
          testID="pay-button"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-semibold text-white">
              Pay {formatPaise(payableInPaise)}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
