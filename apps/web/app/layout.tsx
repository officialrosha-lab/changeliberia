import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { RootLayoutClient } from './root-layout-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Change Liberia',
  description: 'Change Liberia — the civic petition platform where Liberians raise issues, gather trusted support, and drive real change.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://changelib.org',
    siteName: 'Change Liberia',
    title: 'Change Liberia — Petition Platform for Liberia',
    description: 'Make your voice heard on issues that matter to Liberia. Sign and share petitions that drive real change in our community.',
    images: [
      {
        url: 'https://changelib.org/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Change Liberia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Change Liberia',
    description: 'Change Liberia — raise issues, gather trusted support, and drive real civic change in Liberia.',
    images: ['https://changelib.org/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-zinc-900 dark:bg-neutral-900 dark:text-neutral-50 antialiased transition-colors duration-300">
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
              fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || 'placeholder_pixel_id'}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || 'placeholder_pixel_id'}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
