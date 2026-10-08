import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { RootLayoutClient } from './root-layout-client';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
  variable: '--font-inter',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-playfair',
});

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#059669',
};

export const metadata: Metadata = {
  title: 'Change Liberia',
  description: 'Change Liberia — the civic petition platform where Liberians raise issues, gather trusted support, and drive real change.',
  metadataBase: new URL('https://changeliberia.org'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://changeliberia.org',
    siteName: 'Change Liberia',
    title: 'Change Liberia — Petition Platform for Liberia',
    description: 'Make your voice heard on issues that matter to Liberia. Sign and share petitions that drive real change in our community.',
    images: [
      {
        url: 'https://changeliberia.org/og-image.png',
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
    images: ['https://changeliberia.org/og-image.png'],
  },
  // favicon.ico / icon.png / apple-icon.png in app/ are picked up automatically
  // by Next's file-convention metadata — no explicit `icons` entry needed.
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Change Liberia',
  url: 'https://changeliberia.org',
  logo: 'https://changeliberia.org/icon.png',
  description:
    'Change Liberia is the civic petition platform where Liberians raise issues, gather trusted support, and drive real change.',
  areaServed: {
    '@type': 'Country',
    name: 'Liberia',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Change Liberia',
  url: 'https://changeliberia.org',
  description:
    'Sign and start petitions on the issues that matter to Liberia — infrastructure, healthcare, education, and government accountability.',
  inLanguage: 'en',
  publisher: { '@type': 'Organization', name: 'Change Liberia' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfairDisplay.variable}`}>
      <head>
        {/* Inlined (not in globals.css) so it's part of the initial HTML and
            still applies if the main stylesheet never arrives — a dropped
            request on a slow connection otherwise leaves <img>/<svg> at
            their raw pixel size, blowing out the layout width. Wrapped in
            Tailwind's "base" layer (same name it uses — CSS layers merge by
            name regardless of which stylesheet declares them) so sizing
            utility classes, which live in the higher-priority "utilities"
            layer, still win when a specific size is intended; unlayered CSS
            always beats layered CSS regardless of specificity, so without
            this it silently overrode every sized img/svg on the site. */}
        <style dangerouslySetInnerHTML={{ __html: '@layer base{img,svg,video{max-width:100%;height:auto}}' }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="bg-white text-zinc-900 dark:bg-neutral-900 dark:text-neutral-50 antialiased transition-colors duration-300">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
