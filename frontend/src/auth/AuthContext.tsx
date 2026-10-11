import { useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import * as authApi from "../api/auth";
import { AUTH_LOGOUT_EVENT, tokenStorage } from "../lib/tokenStorage";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState<string | null>(() =>
    tokenStorage.getAccess() ? tokenStorage.getUsername() ?? "user" : null,
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUsername(null);
    queryClient.clear(); // never leak one user's cached data to the next
  }, [queryClient]);

  // The axios layer fires this when a token refresh fails (session truly expired).
  useEffect(() => {
    window.addEventListener(AUTH_LOGOUT_EVENT, logout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, logout);
  }, [logout]);

  const login = useCallback(async (user: string, password: string) => {
    const tokens = await authApi.login(user, password);
    tokenStorage.setSession(tokens.access, tokens.refresh, user);
    setUsername(user);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ isAuthenticated: username !== null, username, login, logout }),
    [username, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
