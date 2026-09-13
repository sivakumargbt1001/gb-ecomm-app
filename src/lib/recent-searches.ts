import * as SecureStore from "expo-secure-store";

const KEY = "search_recent";
export const RECENT_SEARCHES_MAX = 8;

// What the shopper looked for before, newest first, offered again the next
// time the search box is empty. Only on this device; the store never sees it.
export function pushRecentSearch(list: string[], query: string): string[] {
  const value = query.trim();
  if (!value) return list;
  const lower = value.toLowerCase();
  return [value, ...list.filter((item) => item.toLowerCase() !== lower)].slice(
    0,
    RECENT_SEARCHES_MAX,
  );
}

export async function loadRecentSearches(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export async function saveRecentSearches(list: string[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(list));
  } catch {
    // Losing the list is fine; failing a search over it is not.
  }
}
