'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthMethod = 'phone' | 'email' | 'google';

export type AuthUser = {
  id: string;
  email: string | null;
  fullName: string;
  role: string;
};

export type AuthState = {
  // Derived from a server-side session check (GET /users/me, authenticated
  // via the httpOnly access_token cookie) rather than a client-readable
  // token — there's no longer a JWT this code can inspect directly.
  isAuthenticated: boolean;
  user: AuthUser | null;
  setSession: (user: AuthUser | null) => void;
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  // True once the initial session check above has resolved (either way).
  // Callers should wait for this before rendering auth-gated UI, the same
  // role `hydrated` played when auth state was read synchronously from
  // persisted storage.
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
      isAuthenticated: false,
      user: null,
      setSession: (user) =>
        set({
          isAuthenticated: !!user,
          user,
          userEmail: user?.email ?? null,
        }),
      authMethod: 'phone',
      setAuthMethod: (method) => set({ authMethod: method }),
      userEmail: null,
      setUserEmail: (email) => set({ userEmail: email }),
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'vlv-auth-storage',
      // Auth state is never trusted from localStorage — it's re-derived
      // from the server on every load (see components/auth-session-bootstrap.tsx)
      // since the real credential lives in an httpOnly cookie this code
      // can't read. Only the last-used login method is worth remembering
      // across visits.
      partialize: (state) => ({ authMethod: state.authMethod }),
    },
  ),
);
