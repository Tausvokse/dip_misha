import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const auth = useAuthStore();

  useEffect(() => {
    void auth.restoreSession();
  }, []);

  return auth;
}
