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

const CARD_DIMENSIONS: Record<CardSize, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 630 },
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
      className="flex flex-col bg-white"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        position: 'relative',
      }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50" />

      {/* Hero image section */}
      {imageUrl && (
        <div
          className="relative overflow-hidden"
          style={{
            height: isLandscape ? '50%' : isStory ? '35%' : '40%',
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
        </div>
      )}

      {/* Content section */}
      <div
        className="relative flex flex-col justify-between p-8"
        style={{
          flex: 1,
          paddingTop: imageUrl ? '1.5rem' : '2rem',
          paddingBottom: isLandscape ? '1.5rem' : '2rem',
        }}
      >
        {/* Title */}
        <div>
          <h1
            className="font-black text-zinc-900"
            style={{
              fontSize: isLandscape ? '20px' : isStory ? '36px' : '40px',
              lineHeight: '1.2',
              marginBottom: '1rem',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: isLandscape ? 2 : isStory ? 3 : 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </h1>
        </div>

        {/* Stats grid */}
        <div
          className="grid gap-3 mb-4"
          style={{
            gridTemplateColumns: isLandscape ? '1fr 1fr' : '1fr',
          }}
        >
          {/* Signatures */}
          <div className="rounded-2xl bg-white/80 p-4 backdrop-blur-sm border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Verified Signatures
            </p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {signatures.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600 mt-1">of {goal.toLocaleString()} goal</p>
          </div>

          {/* Progress */}
          <div className="rounded-2xl bg-white/80 p-4 backdrop-blur-sm border border-blue-200">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Progress</p>
            <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1 font-bold">{progress}% to goal</p>
          </div>
        </div>

        {/* Bottom section with QR and CTA */}
        <div
          className="flex items-end justify-between gap-4"
          style={{
            marginTop: isLandscape ? '0.5rem' : '1rem',
          }}
        >
          {/* QR Code */}
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="QR code"
              style={{
                width: isLandscape ? '80px' : '100px',
                height: isLandscape ? '80px' : '100px',
                border: '3px solid white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
          </div>

          {/* CTA Button */}
          <div className="flex-1">
            <div
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-center"
              style={{
                padding: isLandscape ? '0.75rem 1rem' : '1rem 1.5rem',
                fontSize: isLandscape ? '14px' : isStory ? '18px' : '20px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              Sign This Petition
            </div>
          </div>
        </div>
      </div>

      {/* Change Liberia branding */}
      <div
        className="absolute bottom-2 right-4 text-xs font-bold text-zinc-400"
        style={{
          fontSize: isLandscape ? '10px' : '12px',
        }}
      >
        Change Liberia
      </div>
    </div>
  );
}
