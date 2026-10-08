'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Header } from '../components/header';
import { BottomNav } from '../components/bottom-nav';
import { TrendingTicker } from '../components/trending-ticker';
import { MobileMenuOverlay } from '../components/mobile-menu-overlay';
import { AuthSessionBootstrap } from '../components/auth-session-bootstrap';
import { ServiceWorkerRegistration } from '../components/service-worker-registration';
import { LayoutProvider } from './layout-provider';

// Both widgets render nothing until a user interacts (feedback button click,
// beforeinstallprompt/iOS detection) and both pull framer-motion statically
// — loading them with next/dynamic keeps framer-motion out of the shared
// bundle every page pays for.
const FloatingFeedbackWidget = dynamic(
  () => import('../components/floating-feedback-widget').then((m) => m.FloatingFeedbackWidget),
  { ssr: false },
);
const InstallPrompt = dynamic(
  () => import('../components/install-prompt').then((m) => m.InstallPrompt),
  { ssr: false },
);

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
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { page_path: window.location.pathname });
              `,
            }}
          />
        </>
      )}
      {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && (
        <>
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
      <AuthSessionBootstrap />
      <ServiceWorkerRegistration />
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
      <InstallPrompt />
      <SpeedInsights />
    </LayoutProvider>
  );
}
