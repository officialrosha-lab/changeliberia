'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FadeInOnScroll } from './scroll-animations';
import { CreatePetitionCard } from './create-petition-card';
import { LiberiaMapBg } from './liberia-map-bg';
import { useWebSocket } from '../lib/useWebSocket';


export function HomeHero() {
  const [liveCount, setLiveCount] = useState(10247); // Initial count
  const { getTrending, onSignatureUpdate } = useWebSocket();

  // Get trending petitions on mount to get live counts
  useEffect(() => {
    getTrending();
  }, [getTrending]);

  // Listen for signature updates
  useEffect(() => {
    const unsubscribe = onSignatureUpdate((data) => {
      setLiveCount((prev) => prev + 1);
    });
    return unsubscribe;
  }, [onSignatureUpdate]);


  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col lg:flex-row">
      {/* LEFT — white/dark background with dotted Liberia map */}
      <div className="flex-1 relative bg-white dark:bg-black flex items-center justify-end overflow-hidden">
        <LiberiaMapBg />

        <FadeInOnScroll>
          <div className="relative z-10 w-full max-w-lg px-8 lg:px-14 py-14 lg:py-0">
            <div className="text-xs font-semibold text-black dark:text-white mb-3">
              🇱🇷 Liberia&apos;s civic petition platform
            </div>

            <h1 className="headline-serif text-4xl lg:text-6xl leading-tight text-black dark:text-white mb-4">
              Change Liberia<br />
              starts with{' '}
              <span className="text-emerald-600">you.</span>
            </h1>

            <p className="text-base text-zinc-700 dark:text-zinc-300 mb-5 max-w-sm">
              Join thousands of Liberians raising real issues — from roads in Sinkor to schools
              in Lofa. Gather verified support and move leaders to act.
            </p>

            <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              {liveCount.toLocaleString()} signatures today
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn-primary">
                Start a petition
              </button>
              <Link href="/petitions" className="text-black dark:text-white hover:text-emerald-600 transition-colors self-center text-sm">
                Browse causes →
              </Link>
            </div>
          </div>
        </FadeInOnScroll>
      </div>

      {/* RIGHT — solid emerald green background with card */}
      <div className="flex-1 relative bg-emerald-600 flex items-center justify-start overflow-hidden">
        {/* Illustration — behind the card */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/hero-3.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
          style={{ objectPosition: '50% 0%' }}
        />

        {/* Card on top */}
        <FadeInOnScroll>
          <div className="relative z-10 w-full max-w-lg px-8 lg:px-14 py-12 lg:py-0 flex items-center justify-center lg:justify-start">
            <CreatePetitionCard />
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
