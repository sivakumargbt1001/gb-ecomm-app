import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { RATING_MAX } from "@geekbase-labs/shared-types";

import { useSiteTheme } from "../../lib/site-theme-context";
import { validateReviewDraft } from "../../lib/reviews";
import { useCreateReview } from "../../lib/use-reviews";

export function ReviewForm({ productId }: { productId: string }) {
  const create = useCreateReview(productId);
  const theme = useSiteTheme();
  // 0 is "untouched", which the draft validator rejects rather than treating as
  // a rating nobody gave.
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const draft = { productId, rating, text };
    const validation = validateReviewDraft(draft);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError(null);
    create.mutate(draft);
  }

  const message = error ?? create.error?.message ?? null;

  return (
    <View
      testID="review-form"
      className="gap-3 rounded-xl border border-neutral-200 p-4"
    >
      <Text className="text-base font-medium text-neutral-900">
        Write a review
      </Text>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Your rating"
        className="flex-row items-center gap-2"
      >
        {Array.from({ length: RATING_MAX }, (_, index) => {
          const value = index + 1;
          return (
            <Pressable
              key={value}
              testID={`rating-${value}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: rating === value }}
              accessibilityLabel={`${value} star${value === 1 ? "" : "s"}`}
              hitSlop={6}
              onPress={() => setRating(value)}
            >
              <Text
                className="text-2xl"
                style={{ color: value <= rating ? theme.colors.primary : "#a3a3a3" }}
              >
                {value <= rating ? "★" : "☆"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        testID="review-text"
        accessibilityLabel="Your review"
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={4}
        maxLength={2000}
        placeholder="What stood out? (optional)"
        className="min-h-[88px] rounded-lg border border-neutral-300 p-3 text-neutral-900"
        textAlignVertical="top"
      />

      {message ? (
        <Text testID="review-form-error" className="text-sm text-red-600">
          {message}
        </Text>
      ) : null}

      <Pressable
        testID="submit-review"
        onPress={submit}
        disabled={create.isPending}
        className="items-center rounded-lg py-3"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <Text className="text-base font-semibold text-white">
          {create.isPending ? "Submitting..." : "Submit review"}
        </Text>
      </Pressable>
    </View>
  );
}
