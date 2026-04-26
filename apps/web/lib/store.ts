'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthMethod = 'phone' | 'email' | 'google';

type AuthState = {
  token: string | null;
  setToken: (token: string | null) => void;
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      authMethod: 'phone',
      setAuthMethod: (method) => set({ authMethod: method }),
      userEmail: null,
      setUserEmail: (email) => set({ userEmail: email }),
    }),
    { name: 'vlv-auth-storage' },
  ),
);
