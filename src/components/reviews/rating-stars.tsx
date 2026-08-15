import { Text } from "react-native";
import { RATING_MAX } from "@geekbase-labs/shared-types";

// Read-only display. The stars are decorative — the rating is repeated as text
// beside them, so a screen reader hears "4 out of 5" rather than five symbols.
export function RatingStars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const filled = Math.round(rating);

  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      className={className ?? "text-base"}
    >
      {Array.from({ length: RATING_MAX }, (_, index) =>
        index < filled ? "★" : "☆",
      ).join("")}
    </Text>
  );
}
