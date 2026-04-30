'use client';

import React, { Suspense } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Header } from '../components/header';
import { BottomNav } from '../components/bottom-nav';
import { TrendingTicker } from '../components/trending-ticker';
import { LayoutProvider } from './layout-provider';

function BottomNavContent() {
  return <BottomNav />;
}

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''}>
    <LayoutProvider>
      <div className="sticky top-0 z-50">
        <Suspense fallback={null}>
          <TrendingTicker />
        </Suspense>
        <Suspense fallback={<div className="h-14 border-b border-zinc-200 bg-white dark:border-neutral-700 dark:bg-neutral-900" />}>
          <Header />
        </Suspense>
      </div>
      <main className="pb-16 md:pb-0">{children}</main>
      <Suspense fallback={<div />}>
        <BottomNavContent />
      </Suspense>
    </LayoutProvider>
    </GoogleOAuthProvider>
  );
}
