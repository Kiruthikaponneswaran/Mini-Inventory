import type { ReactNode } from "react";

import { useAuth } from "../auth/AuthContext";

export function Layout({ children }: { children: ReactNode }) {
  const { username, logout } = useAuth();
  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">📦 Mini Inventory</span>
        <div className="topbar-right">
          <span className="muted user">{username}</span>
          <button className="btn btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
