import { createElement, type ComponentType } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";
import { cssInterop } from "nativewind";
// The registry is internal to react-native-css-interop; the public
// cssInterop() only ever keys an entry by the component it wraps, and the
// key wanted here is React Native's own Text.
import { interopComponents } from "react-native-css-interop/dist/runtime/native/api";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";

// The website's one typeface, Plus Jakarta Sans, on every piece of text in
// the app. Native text has no inheritance, so rather than a class on each of
// the hundreds of <Text>s the family is injected as they render; and since a
// bundled font is one weight per file, the weight a style asks for picks the
// file rather than being synthesised (which Android will not do).

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  // A font that fails to load must not hold the whole app back.
  return loaded || error !== null;
}

export function familyFor(weight: TextStyle["fontWeight"]): string {
  const n =
    weight === "bold"
      ? 700
      : weight === "normal" || weight === undefined
        ? 400
        : Number(weight);
  if (n >= 700) return "PlusJakartaSans_700Bold";
  if (n >= 600) return "PlusJakartaSans_600SemiBold";
  if (n >= 500) return "PlusJakartaSans_500Medium";
  return "PlusJakartaSans_400Regular";
}

// The style a text element ends up with: the family for its weight on top of
// whatever it asked for. The weight itself is consumed by the family choice;
// leaving it on would make Android embolden an already-bold file.
export function withAppFont(style: TextStyle | TextStyle[] | undefined): TextStyle[] {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  // A caller that names its own family keeps it. Icon fonts reach here as a
  // plain <Text> whose glyphs live in the private use area, so swapping in
  // Jakarta would leave nothing to draw but .notdef boxes.
  if (flat?.fontFamily) return [flat];
  return [flat ?? {}, { fontFamily: familyFor(flat?.fontWeight), fontWeight: "normal" }];
}

// NativeWind's JSX runtime looks every <Text> up in a registry and renders the
// registered wrapper instead — the same mechanism that gives Text its
// `className`. Registering these here puts the typeface on that path, so
// plain <Text> and <Text className="font-semibold"> alike come out in
// Jakarta. `cssInterop: false` on the inner element is the runtime's own
// escape hatch, and stops the lookup recursing into this wrapper.
function AppText(props: TextProps) {
  return createElement(Text, {
    ...props,
    cssInterop: false,
    style: withAppFont(props.style as TextStyle | TextStyle[] | undefined),
  });
}
function AppTextInput(props: TextInputProps) {
  return createElement(TextInput, {
    ...props,
    cssInterop: false,
    style: withAppFont(props.style as TextStyle | TextStyle[] | undefined),
  });
}

type Registry = Map<ComponentType<unknown>, ComponentType<unknown>>;

let installed = false;
export function installAppFont(): void {
  if (installed) return;
  installed = true;
  const interopText = cssInterop(AppText, { className: "style" });
  const interopTextInput = cssInterop(AppTextInput, {
    className: { target: "style", nativeStyleToProp: { textAlign: true } },
  });
  const registry = interopComponents as unknown as Registry;
  registry.set(Text as ComponentType<unknown>, interopText as ComponentType<unknown>);
  registry.set(TextInput as ComponentType<unknown>, interopTextInput as ComponentType<unknown>);
}
