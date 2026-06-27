'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthMethod = 'phone' | 'email' | 'google';

export type AuthState = {
  token: string | null;
  setToken: (token: string | null) => void;
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
};

type MenuState = {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
};

export const useMenuStore = create<MenuState>()((set) => ({
  isMenuOpen: false,
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
  toggleMenu: () => set((s) => ({ isMenuOpen: !s.isMenuOpen })),
}));

function isTokenExpired(token: string): boolean {
  try {
    // JWT segments use base64url — pad and replace chars before decoding
    const segment = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = segment + '='.repeat((4 - (segment.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => {
        if (token && isTokenExpired(token)) {
          set({ token: null });
          return;
        }
        set({ token });
      },
      authMethod: 'phone',
      setAuthMethod: (method) => set({ authMethod: method }),
      userEmail: null,
      setUserEmail: (email) => set({ userEmail: email }),
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'vlv-auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const expiredToken = state.token && isTokenExpired(state.token);
          // Use the store's own setters so Zustand tracks the update properly
          if (expiredToken) state.setToken(null);
          state.setHydrated(true);
        }
      },
    },
  ),
);
