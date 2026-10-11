import { api } from "./client";

export interface TokenPair {
  access: string;
  refresh: string;
}

export async function login(username: string, password: string): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>("/auth/token/", { username, password });
  return data;
}
