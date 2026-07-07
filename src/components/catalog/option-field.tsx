import { Text, TextInput, View } from "react-native";
import type { ProductOptionField } from "@geekbase-labs/shared-types";

export function OptionField({ field }: { field: ProductOptionField }) {
  return (
    <View className="gap-1" testID="option-field">
      <Text className="text-sm font-medium text-neutral-800">
        {field.label}
        {field.required ? <Text className="text-red-500"> *</Text> : null}
      </Text>

      {field.fieldType === "text" ? (
        <TextInput
          placeholder="Enter value"
          className="h-10 rounded-lg border border-neutral-300 px-3"
        />
      ) : null}

      {field.fieldType === "number" ? (
        <TextInput
          keyboardType="numeric"
          placeholder="0"
          className="h-10 rounded-lg border border-neutral-300 px-3"
        />
      ) : null}

      {field.fieldType === "dropdown" ? (
        <View className="flex-row flex-wrap gap-2">
          {(field.validation?.choices ?? []).map((choice) => (
            <View
              key={choice}
              className="rounded-full border border-neutral-300 px-3 py-1"
            >
              <Text className="text-sm text-neutral-700">{choice}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {field.fieldType === "file" ? (
        <Text className="text-sm text-neutral-500">
          File upload available at checkout
        </Text>
      ) : null}
    </View>
  );
}
