import { Pressable, Text } from "react-native";
import { router } from "expo-router";

import { useAuthStore } from "../../lib/auth-store";
import { useSiteTheme } from "../../lib/site-theme-context";
import { useWishlistToggle } from "../../lib/use-wishlist";

export function WishlistHeart({
  productId,
  productName,
  className,
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const theme = useSiteTheme();
  const { isSaved, isPending, toggle } = useWishlistToggle(productId);

  // Showing an empty heart before the session resolves would tell a returning
  // shopper their saved products aren't saved.
  if (status === "loading") return null;

  return (
    <Pressable
      testID="wishlist-toggle"
      accessibilityRole="button"
      accessibilityState={{ selected: isSaved, disabled: isPending }}
      accessibilityLabel={
        isSaved
          ? `Remove ${productName} from your wishlist`
          : `Save ${productName} to your wishlist`
      }
      disabled={isPending}
      onPress={() => (user ? toggle() : router.push("/(auth)/login"))}
      hitSlop={8}
      className={`h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white ${
        className ?? ""
      }`}
    >
      <Text
        className="text-base"
        style={{ color: isSaved ? theme.colors.primary : "#525252" }}
      >
        {isSaved ? "♥" : "♡"}
      </Text>
    </Pressable>
  );
}
