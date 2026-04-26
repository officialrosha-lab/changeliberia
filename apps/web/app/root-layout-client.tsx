'use client';

import React, { Suspense } from 'react';
import { Header } from '../components/header';
import { BottomNav } from '../components/bottom-nav';
import { LayoutProvider } from './layout-provider';

function HeaderContent() {
  return <Header />;
}

function BottomNavContent() {
  return <BottomNav />;
}

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <Suspense fallback={<div />}>
        <HeaderContent />
      </Suspense>
      <main className="pb-16 md:pb-0">{children}</main>
      <Suspense fallback={<div />}>
        <BottomNavContent />
      </Suspense>
    </LayoutProvider>
  );
}
