import { create } from "zustand";
import { getProfile, login as loginRequest, logout as logoutRequest } from "@/api/auth.api";
import type { User } from "@/types/user.types";

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("parking_auth_token"),
  isLoading: false,
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await loginRequest(email, password);
      localStorage.setItem("parking_auth_token", data.token);
      set({ user: data.user, token: data.token });
    } finally {
      set({ isLoading: false });
    }
  },
  restoreSession: async () => {
    const token = localStorage.getItem("parking_auth_token");
    if (!token) {
      return;
    }

    set({ isLoading: true, token });
    try {
      const { data } = await getProfile();
      set({ user: data.user, token });
    } catch {
      logoutRequest();
      localStorage.removeItem("parking_auth_token");
      set({ user: null, token: null });
    } finally {
      set({ isLoading: false });
    }
  },
  logout: () => {
    logoutRequest();
    localStorage.removeItem("parking_auth_token");
    set({ user: null, token: null });
    // Примусове перезавантаження вікна гарантує очищення всіх станів Zustand (бронювань та карти)
    window.location.href = "/login";
  },
}));