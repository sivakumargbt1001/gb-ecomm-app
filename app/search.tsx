import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SEARCH_QUERY_MAX } from "@geekbase-labs/shared-types";

import { ProductCard } from "../src/components/catalog/product-card";
import {
  loadRecentSearches,
  pushRecentSearch,
  saveRecentSearches,
} from "../src/lib/recent-searches";
import { searchScreenState } from "../src/lib/search";
import { useSiteTheme } from "../src/lib/site-theme-context";
import { useProductSearch } from "../src/lib/use-product-search";
import { useVoiceSearch } from "../src/lib/use-voice-search";

const SUGGESTIONS_MAX = 6;

// Typing shows suggestions — recent searches while the box is empty, matching
// product names once it is not — and a submit (return key, a suggestion, or
// the end of a spoken phrase) shows the grid. Opened with ?voice=1 from the
// header's mic, it starts listening straight away.
export default function SearchScreen() {
  const theme = useSiteTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { voice } = useLocalSearchParams<{ voice?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const search = useProductSearch(input);

  useEffect(() => {
    void loadRecentSearches().then(setRecent);
  }, []);

  const submit = (value: string) => {
    const query = value.trim();
    if (!query) return;
    setInput(query);
    setSubmitted(true);
    inputRef.current?.blur();
    const next = pushRecentSearch(recent, query);
    setRecent(next);
    void saveRecentSearches(next);
  };

  const type = (value: string) => {
    setInput(value);
    setSubmitted(false);
  };

  const voiceSearch = useVoiceSearch({
    onTranscript: (text, isFinal) => {
      if (isFinal) submit(text);
      else type(text);
    },
  });
  const startVoice = voiceSearch.start;

  useEffect(() => {
    if (voice === "1") void startVoice();
  }, [voice, startVoice]);

  const state = searchScreenState({
    query: search.query,
    isLoading: search.isLoading,
    isError: search.isError,
    total: search.total,
  });

  // Distinct product names that match, in the order the search ranked them.
  const suggestions = Array.from(
    new Set(search.items.map((item) => item.name.trim()).filter(Boolean)),
  ).slice(0, SUGGESTIONS_MAX);

  const showResults = submitted && search.query.length > 0;

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      <View
        className="flex-row items-center gap-2 border-b border-neutral-100 px-2 pb-2"
        style={{ paddingTop: insets.top + 4 }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-11 w-11 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </Pressable>
        <View className="h-11 flex-1 flex-row items-center rounded-lg border border-neutral-300 bg-neutral-50 pl-3">
          <Ionicons name="search-outline" size={20} color="#737373" />
          <TextInput
            ref={inputRef}
            testID="search-input"
            value={input}
            onChangeText={type}
            onSubmitEditing={() => submit(input)}
            placeholder={voiceSearch.listening ? "Listening…" : "Search products"}
            autoFocus={voice !== "1"}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            maxLength={SEARCH_QUERY_MAX}
            className="h-11 flex-1 pl-2 text-[15px] text-neutral-900"
          />
          {input.length > 0 ? (
            <Pressable
              testID="search-clear"
              onPress={() => type("")}
              accessibilityLabel="Clear search"
              hitSlop={8}
              className="h-11 w-9 items-center justify-center"
            >
              <Ionicons name="close-circle" size={18} color="#a3a3a3" />
            </Pressable>
          ) : null}
          <Pressable
            testID="search-voice"
            onPress={() => (voiceSearch.listening ? voiceSearch.stop() : void startVoice())}
            accessibilityRole="button"
            accessibilityLabel={voiceSearch.listening ? "Stop listening" : "Search by voice"}
            className="h-11 w-11 items-center justify-center"
          >
            <Ionicons
              name={voiceSearch.listening ? "mic" : "mic-outline"}
              size={22}
              color={voiceSearch.listening ? "#dc2626" : theme.colors.primary}
            />
          </Pressable>
        </View>
      </View>

      {voiceSearch.error ? (
        <Text testID="search-voice-error" className="px-4 py-2 text-xs text-red-600">
          {voiceSearch.error}
        </Text>
      ) : null}

      {showResults ? (
        <Results search={search} state={state} />
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled">
          {search.query.length === 0 ? (
            recent.length > 0 ? (
              <Section title="Recent searches">
                {recent.map((item) => (
                  <SuggestionRow
                    key={item}
                    icon="time-outline"
                    label={item}
                    onPress={() => submit(item)}
                  />
                ))}
              </Section>
            ) : (
              <Text testID="search-message" className="px-4 py-6 text-center text-neutral-500">
                Search the catalogue by name, brand or category.
              </Text>
            )
          ) : suggestions.length > 0 ? (
            <Section title="Suggestions">
              {suggestions.map((item) => (
                <SuggestionRow
                  key={item}
                  icon="search-outline"
                  label={item}
                  onPress={() => submit(item)}
                />
              ))}
            </Section>
          ) : search.isLoading ? (
            <ActivityIndicator className="my-6" />
          ) : (
            <SuggestionRow
              icon="search-outline"
              label={`Search for "${search.query}"`}
              onPress={() => submit(search.query)}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        {title}
      </Text>
      {children}
    </View>
  );
}

function SuggestionRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID="search-suggestion"
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-4 py-3 active:bg-neutral-50"
    >
      <Ionicons name={icon} size={18} color="#737373" />
      <Text className="flex-1 text-[15px] text-neutral-800" numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="arrow-up-outline" size={16} color="#a3a3a3" style={{ transform: [{ rotate: "-45deg" }] }} />
    </Pressable>
  );
}

function Results({
  search,
  state,
}: {
  search: ReturnType<typeof useProductSearch>;
  state: ReturnType<typeof searchScreenState>;
}) {
  if (state === "results") {
    return (
      <FlatList
        testID="search-results"
        data={search.items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16, padding: 16 }}
        columnWrapperStyle={{ gap: 16 }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (search.hasNextPage && !search.isFetchingNextPage) {
            void search.fetchNextPage();
          }
        }}
        ListFooterComponent={
          search.isFetchingNextPage ? <ActivityIndicator className="my-4" /> : null
        }
        renderItem={({ item }) => <ProductCard product={item} className="flex-1" />}
      />
    );
  }

  if (state === "loading") {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-3 px-6">
      <Text testID="search-message" className="text-center text-neutral-500">
        {state === "error"
          ? "Could not run that search."
          : `No products match "${search.query}".`}
      </Text>
      {state === "error" ? (
        <Pressable
          onPress={search.refetch}
          className="rounded-lg border border-neutral-300 px-4 py-2"
        >
          <Text className="text-neutral-700">Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
