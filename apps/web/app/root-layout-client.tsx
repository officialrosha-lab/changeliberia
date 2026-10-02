'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Header } from '../components/header';
import { BottomNav } from '../components/bottom-nav';
import { TrendingTicker } from '../components/trending-ticker';
import { FloatingFeedbackWidget } from '../components/floating-feedback-widget';
import { MobileMenuOverlay } from '../components/mobile-menu-overlay';
import { LayoutProvider } from './layout-provider';

function BottomNavContent() {
  return <BottomNav />;
}

// Embeddable petition widget — rendered bare inside third-party <iframe>s,
// so it skips the site header/nav/bottom-nav chrome entirely.
const EMBED_ROUTE = /^\/petitions\/[^/]+\/embed$/;

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmbedRoute = EMBED_ROUTE.test(pathname ?? '');

  if (isEmbedRoute) {
    return <LayoutProvider>{children}</LayoutProvider>;
  }

  return (
    <LayoutProvider>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="sticky top-0 z-50">
        <Suspense fallback={null}>
          <TrendingTicker />
        </Suspense>
        <Suspense fallback={<div className="h-14 border-b border-zinc-200 bg-white dark:border-neutral-700 dark:bg-neutral-900" />}>
          <Header />
        </Suspense>
      </div>
      <main id="main-content" className="pb-16 md:pb-0">{children}</main>
      <Suspense fallback={<div />}>
        <BottomNavContent />
      </Suspense>
      {/* Mounted outside the sticky z-50 wrapper to avoid stacking-context clipping */}
      <MobileMenuOverlay />
      <FloatingFeedbackWidget enabled={true} />
      <SpeedInsights />
    </LayoutProvider>
  );
}
