import { Pressable, Text, TextInput, View } from "react-native";
import type { ProductOptionField } from "@geekbase-labs/shared-types";

type Props = {
  field: ProductOptionField;
  value: string | number | undefined;
  onChangeValue: (value: string | number) => void;
  onPickFile?: () => void;
  fileName?: string;
};

export function OptionField({
  field,
  value,
  onChangeValue,
  onPickFile,
  fileName,
}: Props) {
  return (
    <View className="gap-1" testID="option-field">
      <Text className="text-sm font-medium text-neutral-800">
        {field.label}
        {field.required ? <Text className="text-red-500"> *</Text> : null}
      </Text>

      {field.fieldType === "text" ? (
        <TextInput
          value={String(value ?? "")}
          onChangeText={onChangeValue}
          placeholder="Enter value"
          className="h-10 rounded-lg border border-neutral-300 px-3"
          testID={`option-field-text-${field.id}`}
        />
      ) : null}

      {field.fieldType === "number" ? (
        <TextInput
          value={value !== undefined ? String(value) : ""}
          onChangeText={(text) => {
            const num = Number(text);
            if (!Number.isNaN(num)) onChangeValue(num);
          }}
          keyboardType="numeric"
          placeholder="0"
          className="h-10 rounded-lg border border-neutral-300 px-3"
          testID={`option-field-number-${field.id}`}
        />
      ) : null}

      {field.fieldType === "dropdown" ? (
        <View className="flex-row flex-wrap gap-2">
          {(field.validation?.choices ?? []).map((choice) => (
            <Pressable
              key={choice}
              onPress={() => onChangeValue(choice)}
              className={`rounded-full border px-3 py-1 ${
                value === choice
                  ? "border-black bg-black"
                  : "border-neutral-300"
              }`}
            >
              <Text
                className={`text-sm ${
                  value === choice ? "text-white" : "text-neutral-700"
                }`}
              >
                {choice}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {field.fieldType === "file" ? (
        <View className="gap-1">
          <Pressable
            onPress={onPickFile}
            className="h-10 items-center justify-center rounded-lg border border-dashed border-neutral-300"
            testID={`option-field-file-${field.id}`}
          >
            <Text className="text-sm text-neutral-500">
              {fileName ?? "Tap to select file"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
