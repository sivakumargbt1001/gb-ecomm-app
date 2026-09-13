import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import type { DeliveryQuote } from "@geekbase-labs/shared-types";

const PINCODE_KEY = "gb_delivery_pincode";
const PLACE_KEY = "gb_delivery_place";

// The chosen pincode outlives the launch: a shopper who set it last week
// should not be asked again. Only the pincode is kept, never the quote — fees
// and estimates are the store's to change, and a stale one shown as current
// is worse than a brief "checking".
async function readStored(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeStored(key: string, value: string | null): Promise<void> {
  try {
    if (value) await SecureStore.setItemAsync(key, value);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    // Losing the choice across launches is acceptable; failing the pick is not.
  }
}

interface DeliveryState {
  pincode: string | null;
  // "Locality, City, State" for the header, when something could name it.
  place: string | null;
  quote: DeliveryQuote | null;
  isPanelOpen: boolean;
  hydrate: () => Promise<void>;
  setQuote: (quote: DeliveryQuote, place?: string | null) => void;
  setPlace: (place: string | null) => void;
  clear: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  pincode: null,
  place: null,
  quote: null,
  isPanelOpen: false,
  hydrate: async () => {
    const [pincode, place] = await Promise.all([
      readStored(PINCODE_KEY),
      readStored(PLACE_KEY),
    ]);
    set({ pincode, place });
  },
  // A pincode the store will deliver to closes the panel: the header now says
  // where, and the shopper is done. A refusal keeps it open, so the reason and
  // the search box stay in front of them.
  //
  // An omitted place keeps the current one — the re-quote of a remembered
  // pincode on launch knows nothing about names — while an explicit null
  // clears it for a freshly typed pincode until a name is looked up.
  setQuote: (quote, place) => {
    void writeStored(PINCODE_KEY, quote.pincode);
    const nextPlace = place === undefined ? get().place : place;
    void writeStored(PLACE_KEY, nextPlace);
    set({
      pincode: quote.pincode,
      place: nextPlace,
      quote,
      isPanelOpen: !quote.serviceable,
    });
  },
  setPlace: (place) => {
    void writeStored(PLACE_KEY, place);
    set({ place });
  },
  clear: () => {
    void writeStored(PINCODE_KEY, null);
    void writeStored(PLACE_KEY, null);
    set({ pincode: null, place: null, quote: null });
  },
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
}));
