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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
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
        if (state) state.hydrated = true;
      },
    },
  ),
);
