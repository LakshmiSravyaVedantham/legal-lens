import { createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string;
  organization_name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, orgName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  tokens: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

// Token storage helpers
const TOKEN_KEY = 'legallens_tokens';
const USER_KEY = 'legallens_user';

export function saveAuth(user: User, tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadAuth(): { user: User | null; tokens: AuthTokens | null } {
  try {
    const tokens = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    return { user, tokens };
  } catch {
    return { user: null, tokens: null };
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
