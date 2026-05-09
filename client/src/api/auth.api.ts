import { api } from "./axios.instance";
import type { AuthResponse } from "@/types/api.types";
import type { User } from "@/types/user.types";

export function login(email: string, password: string) {
  return api.post<AuthResponse>("/auth/login", { email, password });
}

export function register(email: string, password: string) {
  return api.post<AuthResponse>("/auth/register", { email, password });
}

export function getProfile() {
  return api.get<{ user: User }>("/auth/me");
}

export function logout() {
  localStorage.removeItem("parking_auth_token");
}
