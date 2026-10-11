const ACCESS = "inventory.access";
const REFRESH = "inventory.refresh";
const USERNAME = "inventory.username";

/**
 * Tokens live in localStorage so a refresh keeps you signed in.
 * Trade-off (see README): readable by any XSS; httpOnly cookies would be stronger.
 */
export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS),
  getRefresh: () => localStorage.getItem(REFRESH),
  getUsername: () => localStorage.getItem(USERNAME),
  setAccess: (token: string) => localStorage.setItem(ACCESS, token),
  setSession: (access: string, refresh: string, username: string) => {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
    localStorage.setItem(USERNAME, username);
  },
  clear: () => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USERNAME);
  },
};

export const AUTH_LOGOUT_EVENT = "inventory:auth-logout";
