import type { User } from "@geekbase-labs/shared-types";
import { create } from "zustand";

export type AuthStatus = "authenticated" | "guest" | "loading";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) =>
    set({
      user,
      status: user ? "authenticated" : "guest",
    }),
  setStatus: (status) => set({ status }),
  logout: () => set({ user: null, status: "guest" }),
}));
