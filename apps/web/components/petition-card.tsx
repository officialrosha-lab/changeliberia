'use client';

import { useMemo } from 'react';

export type CardSize = 'square' | 'story' | 'landscape';

interface PetitionCardProps {
  title: string;
  goal: number;
  signatures: number;
  imageUrl?: string;
  petitionUrl: string;
  size: CardSize;
}

// Optimized dimensions for social media platforms
const CARD_DIMENSIONS: Record<CardSize, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },           // Instagram Feed
  story: { width: 1080, height: 1920 },            // Instagram Story
  landscape: { width: 1200, height: 628 },         // Facebook Feed (optimal ratio)
};

export function PetitionCard({
  title,
  goal,
  signatures,
  imageUrl,
  petitionUrl,
  size,
}: PetitionCardProps) {
  const dimensions = CARD_DIMENSIONS[size];
  const progress = Math.min(100, Math.round((signatures / goal) * 100));

  const qrCodeUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(petitionUrl)}&size=200x200&margin=4`,
    [petitionUrl],
  );

  const isSquare = size === 'square';
  const isStory = size === 'story';
  const isLandscape = size === 'landscape';

  return (
    <div
      className="flex flex-col bg-white overflow-hidden"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        position: 'relative',
      }}
    >
      {/* Clean white background */}
      <div className="absolute inset-0 bg-white" />

      {/* Hero image section */}
      {imageUrl && (
        <div
          className="relative overflow-hidden"
          style={{
            height: isLandscape ? '35%' : isStory ? '40%' : '45%',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/30" />
        </div>
      )}

      {/* Content section */}
      <div
        className="relative flex flex-col justify-between"
        style={{
          flex: 1,
          padding: isLandscape ? '1.25rem' : '1.5rem',
        }}
      >
        {/* Title */}
        <div>
          <h1
            className="font-black text-black leading-tight"
            style={{
              fontSize: isLandscape ? '28px' : isStory ? '44px' : '52px',
              letterSpacing: '-0.5px',
              marginBottom: isLandscape ? '0.75rem' : '1rem',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: isLandscape ? 2 : isStory ? 3 : 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </h1>
        </div>

        {/* Stats grid */}
        <div
          className="grid gap-2 mb-3"
          style={{
            gridTemplateColumns: isLandscape ? '1fr 1fr' : '1fr',
          }}
        >
          {/* Signatures */}
          <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-300">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              ✓ Signatures
            </p>
            <p className="text-3xl font-black text-emerald-900 mt-1 leading-none">
              {signatures.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-700 mt-0.5">of {goal.toLocaleString()}</p>
          </div>

          {/* Progress */}
          <div className="rounded-xl bg-blue-50 p-3 border border-blue-300">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">📊 Progress</p>
            <div className="mt-2 h-2.5 bg-blue-200 rounded-full overflow-hidden border border-blue-300">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-blue-900 mt-1 font-bold">{progress}% of goal</p>
          </div>
        </div>

        {/* Bottom section with QR and CTA */}
        <div
          className="flex items-end justify-between gap-3"
          style={{
            marginTop: isLandscape ? '0.25rem' : '0.5rem',
          }}
        >
          {/* QR Code */}
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="QR code"
              style={{
                width: isLandscape ? '100px' : '120px',
                height: isLandscape ? '100px' : '120px',
                border: '4px solid white',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            />
          </div>

          {/* CTA Button */}
          <div className="flex-1">
            <div
              className="rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white font-black text-center shadow-lg hover:shadow-xl transition-shadow"
              style={{
                padding: isLandscape ? '0.9rem 1.2rem' : '1.25rem 1.75rem',
                fontSize: isLandscape ? '16px' : isStory ? '20px' : '24px',
                boxShadow: '0 8px 20px rgba(5, 150, 105, 0.35)',
                letterSpacing: '-0.3px',
              }}
            >
              Sign Now
            </div>
          </div>
        </div>
      </div>

      {/* Change Liberia branding footer */}
      <div
        className="absolute bottom-1.5 left-1.5 text-xs font-black text-emerald-700"
        style={{
          fontSize: isLandscape ? '11px' : '13px',
          letterSpacing: '0.5px',
        }}
      >
        Change Liberia
      </div>
    </div>
  );
}
