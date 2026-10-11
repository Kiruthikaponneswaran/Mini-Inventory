import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { AUTH_LOGOUT_EVENT, tokenStorage } from "../lib/tokenStorage";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single-flight refresh: if several requests 401 at once they all wait on one refresh call.
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error("No refresh token");
  // Bare axios on purpose: going through `api` would re-enter this interceptor.
  const { data } = await axios.post<{ access: string }>(`${API_URL}/auth/token/refresh/`, { refresh });
  tokenStorage.setAccess(data.access);
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthEndpoint = original?.url?.includes("/auth/token");

    if (error.response?.status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true;
      try {
        refreshing ??= refreshAccessToken().finally(() => {
          refreshing = null;
        });
        const access = await refreshing;
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch {
        tokenStorage.clear();
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
      }
    }
    return Promise.reject(error);
  },
);
