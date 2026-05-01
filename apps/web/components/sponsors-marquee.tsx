'use client';

import { useState } from 'react';
import Image from 'next/image';

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string | null;
  type: string;
};

export function SponsorsMarquee({ sponsors }: { sponsors: Sponsor[] }) {
  const [paused, setPaused] = useState(false);

  if (!sponsors.length) return null;

  const duration = `${Math.max(sponsors.length * 3, 20)}s`;

  const LogoList = () => (
    <>
      {sponsors.map((s) => (
        <a
          key={s.id}
          href={s.websiteUrl ?? undefined}
          target={s.websiteUrl ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="mx-6 flex h-16 w-32 shrink-0 items-center justify-center"
          aria-label={s.name}
        >
          <Image
            src={s.logoUrl}
            alt={s.name}
            width={128}
            height={64}
            className="max-h-16 w-auto max-w-[128px] object-contain grayscale transition-all duration-300 hover:grayscale-0"
            unoptimized
          />
        </a>
      ))}
    </>
  );

  return (
    <>
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
      <div
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex min-w-max"
          style={{
            animation: `marquee-scroll ${duration} linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          <LogoList />
          <LogoList />
        </div>
      </div>
    </>
  );
}
