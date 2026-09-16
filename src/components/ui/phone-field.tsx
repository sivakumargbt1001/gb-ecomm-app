import { Text, TextInput, View, type TextInputProps } from "react-native";
import {
  DEFAULT_CALLING_CODE,
  nationalPhone,
  normalizePhone,
} from "@geekbase-labs/shared-types";

// A phone box with the country code already in place: the shopper types the
// ten digits after a fixed "+91" and the field hands back E.164 — what every
// API here wants. A number typed with its own "+" code is kept as typed and
// shown whole, so the badge steps aside for it.
export function PhoneField({
  value,
  onChange,
  className = "rounded-lg border border-neutral-300",
  ...rest
}: {
  value: string | null | undefined;
  onChange: (e164: string) => void;
  className?: string;
} & Omit<TextInputProps, "value" | "onChange" | "onChangeText" | "keyboardType" | "className">) {
  const shown = nationalPhone(value ?? "");
  const foreign = shown.startsWith("+");

  return (
    <View className={`flex-row items-center overflow-hidden ${className}`}>
      {!foreign ? (
        <Text
          testID="phone-prefix"
          className="border-r border-neutral-300 bg-neutral-100 px-3 py-3 text-neutral-500"
        >
          {DEFAULT_CALLING_CODE}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        value={shown}
        onChangeText={(text) => onChange(normalizePhone(text))}
        keyboardType="phone-pad"
        autoComplete={rest.autoComplete ?? "tel-national"}
        textContentType={rest.textContentType ?? "telephoneNumber"}
        placeholder={rest.placeholder ?? "98765 43210"}
        className="flex-1 px-4 py-3 text-neutral-900"
      />
    </View>
  );
}
