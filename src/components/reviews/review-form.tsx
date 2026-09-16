import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { RATING_MAX, type Review } from "@geekbase-labs/shared-types";

import { useSiteTheme } from "../../lib/site-theme-context";
import { validateReviewDraft } from "../../lib/reviews";
import { useCreateReview, useUpdateReview } from "../../lib/use-reviews";

// One form for both writing and editing: with `existing` it opens on what the
// shopper wrote and saves over it, and `onDone` lets the caller close it —
// after a save, or when they change their mind.
export function ReviewForm({
  productId,
  existing,
  onDone,
}: {
  productId: string;
  existing?: Review;
  onDone?: () => void;
}) {
  const create = useCreateReview(productId);
  const update = useUpdateReview(productId, existing?.id ?? "");
  const mutation = existing ? update : create;
  const theme = useSiteTheme();
  // 0 is "untouched", which the draft validator rejects rather than treating as
  // a rating nobody gave.
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.text ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const draft = { productId, rating, text };
    const validation = validateReviewDraft(draft);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError(null);
    if (existing) {
      update.mutate({ rating, text }, { onSuccess: () => onDone?.() });
    } else {
      create.mutate(draft, { onSuccess: () => onDone?.() });
    }
  }

  const message = error ?? mutation.error?.message ?? null;

  return (
    <View
      testID="review-form"
      className="gap-3 rounded-xl border border-neutral-200 p-4"
    >
      <Text className="text-base font-medium text-neutral-900">
        {existing ? "Edit your review" : "Write a review"}
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
        disabled={mutation.isPending}
        className="items-center rounded-lg py-3"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <Text className="text-base font-semibold text-white">
          {existing
            ? mutation.isPending
              ? "Saving..."
              : "Save changes"
            : mutation.isPending
              ? "Submitting..."
              : "Submit review"}
        </Text>
      </Pressable>
      {existing && onDone ? (
        <Pressable
          testID="cancel-edit-review"
          onPress={onDone}
          disabled={mutation.isPending}
          className="items-center rounded-lg border border-neutral-300 py-3"
        >
          <Text className="text-base font-medium text-neutral-800">Cancel</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
