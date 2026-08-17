import { Text, TextInput, View } from "react-native";

// Rendered by both signup methods so a shopper who switches from email to phone
// keeps the code they were sent, and so the two paths cannot drift apart on what
// a referral code looks like. It accepts a pasted link as well as a bare code —
// on a phone, the link is what arrives.
export function ReferralCodeField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}) {
  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-gray-900">
        Referral code <Text className="text-gray-500">(optional)</Text>
      </Text>
      <TextInput
        testID="referral-code-input"
        value={value}
        onChangeText={onChange}
        placeholder="REF-XXXXXXXX or a link"
        autoCapitalize="characters"
        autoCorrect={false}
        className="rounded-lg border border-gray-300 px-4 py-3"
      />
      {error && (
        <Text testID="referral-code-error" className="text-xs font-medium text-red-600">
          {error}
        </Text>
      )}
    </View>
  );
}
