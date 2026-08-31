import { create } from "zustand";

interface PushState {
  token: string | null;
  setToken: (token: string | null) => void;
}

// The token this install is currently registered under, so logging out can
// hand the backend the exact row to drop.
export const usePushStore = create<PushState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}));
