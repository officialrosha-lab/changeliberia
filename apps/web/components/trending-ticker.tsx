'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TrendingItem {
  id: string;
  title: string;
  signaturesCount: number;
}

const FALLBACK_TEXT = 'Change Liberia · Civic petitions for all 15 counties of Liberia · Sign. Share. Speak up.';

export function TrendingTicker() {
  const [items, setItems] = useState<TrendingItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

    fetch(`${apiBase}/petitions/browse/all`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { trending?: TrendingItem[] } | null) => {
        if (mounted && data?.trending && Array.isArray(data.trending) && data.trending.length > 0) {
          setItems(data.trending.map((p) => ({ id: p.id, title: p.title, signaturesCount: p.signaturesCount ?? 0 })));
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const showFallback = items.length === 0;

  return (
    <div className="text-white overflow-hidden" style={{ backgroundColor: '#002D62' }}>
      <div className="flex items-center h-8">
        {/* Pinned label */}
        <div className="shrink-0 flex items-center gap-2 px-3 border-r border-red-700 h-full bg-red-600">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap">
            Trending
          </span>
        </div>

        {/* Scrolling area */}
        <div className="flex-1 overflow-hidden relative">
          {showFallback ? (
            <div className="animate-ticker inline-flex whitespace-nowrap">
              {[0, 1].map((dupe) => (
                <span key={dupe} className="inline-flex items-center gap-0 text-xs text-emerald-50">
                  <span className="px-6">{FALLBACK_TEXT}</span>
                  <span className="text-blue-300 px-2" aria-hidden>·</span>
                  <span className="px-6">{FALLBACK_TEXT}</span>
                  <span className="text-blue-300 px-2" aria-hidden>·</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="animate-ticker inline-flex whitespace-nowrap">
              {[0, 1].map((dupe) => (
                <span key={dupe} className="inline-flex items-center">
                  {items.map((item, i) => (
                    <span key={`${dupe}-${item.id}`} className="inline-flex items-center text-xs">
                      <Link
                        href={`/petitions/${item.id}`}
                        className="px-5 text-white hover:text-blue-200 hover:underline transition-colors"
                        tabIndex={dupe === 0 ? 0 : -1}
                      >
                        🔥 <span className="font-medium">{item.title}</span>
                        {item.signaturesCount > 0 && (
                          <span className="text-blue-200 ml-1">
                            — {item.signaturesCount.toLocaleString()} signatures
                          </span>
                        )}
                      </Link>
                      {i < items.length - 1 && (
                        <span className="text-blue-300" aria-hidden>·</span>
                      )}
                    </span>
                  ))}
                  <span className="text-emerald-500 px-4" aria-hidden>·</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
