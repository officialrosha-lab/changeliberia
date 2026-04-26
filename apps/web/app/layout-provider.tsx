'use client';

import React from 'react';
import { ThemeProvider } from '../lib/theme-context';
import { ToastProvider } from '../lib/toast-context';
import { ToastContainer } from '../components/toast-container';

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <>{children}</>
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  );
}
