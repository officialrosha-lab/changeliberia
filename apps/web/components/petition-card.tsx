'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export type CardSize = 'square' | 'story' | 'landscape';

export const CARD_SIZES: Record<CardSize, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 630 },
};

const BLUE = '#002868';
const RED = '#BF0A30';
const GOLD = '#C9A227';

// Per-size config for portrait layouts (square + story)
const PORTRAIT_CFG = {
  square: {
    headerH: 80, heroH: 370, overlap: 56, footerH: 80,
    logoSz: 40, logoFontSz: 15, logoTextSz: 21, catFontSz: 16, catPad: '6px 18px',
    titleSz: 52, titleClamp: 2, summarySz: 21, summaryClamp: 2,
    sigSz: 70, sigLabelSz: 20, barH: 14,
    ctaSz: 25, ctaP: 22, tagSz: 18, qrSz: 68,
    cardPad: 44, cardRad: 24,
    headerPad: '0 36px',
  },
  story: {
    headerH: 100, heroH: 700, overlap: 70, footerH: 90,
    logoSz: 50, logoFontSz: 19, logoTextSz: 27, catFontSz: 20, catPad: '8px 24px',
    titleSz: 64, titleClamp: 3, summarySz: 28, summaryClamp: 2,
    sigSz: 84, sigLabelSz: 26, barH: 18,
    ctaSz: 32, ctaP: 30, tagSz: 22, qrSz: 82,
    cardPad: 56, cardRad: 32,
    headerPad: '0 48px',
  },
} as const;

export interface PetitionCardProps {
  title: string;
  summary?: string;
  goal: number;
  signatures: number;
  imageUrl?: string;
  petitionUrl: string;
  category?: string;
  size: CardSize;
}

function useQRCode(url: string): string {
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setDataUrl)
      .catch(() => {});
  }, [url]);
  return dataUrl;
}

export function PetitionCard({ title, summary, goal, signatures, imageUrl, petitionUrl, category, size }: PetitionCardProps) {
  const qrDataUrl = useQRCode(petitionUrl);
  const progress = Math.min(100, Math.round((signatures / goal) * 100));
  const { width, height } = CARD_SIZES[size];

  const civicPattern = 'repeating-linear-gradient(45deg, rgba(0,40,104,0.025) 0, rgba(0,40,104,0.025) 1px, transparent 0, transparent 50%)';

  const QRSlot = ({ sz }: { sz: number }) =>
    qrDataUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={qrDataUrl} alt="QR code" style={{ width: sz, height: sz, borderRadius: 8, border: '2px solid #E5E7EB', display: 'block', flexShrink: 0 }} />
    ) : (
      <div style={{ width: sz, height: sz, background: '#E5E7EB', borderRadius: 8, flexShrink: 0 }} />
    );

  const ProgressBar = ({ barH, sigSz, sigLabelSz }: { barH: number; sigSz: number; sigLabelSz: number }) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: sigSz, fontWeight: 900, color: BLUE, lineHeight: 1, letterSpacing: '-1px' }}>
          {signatures.toLocaleString()}
        </span>
        <span style={{ fontSize: sigLabelSz, fontWeight: 600, color: '#6B7280' }}>signatures</span>
      </div>
      <div style={{ height: barH, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(2, progress)}%`, background: `linear-gradient(90deg, ${BLUE}, ${RED})`, borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: sigLabelSz * 0.75, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>of {goal.toLocaleString()} goal</span>
        <span style={{ fontSize: sigLabelSz * 0.75, fontWeight: 700, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>{progress}%</span>
      </div>
    </div>
  );

  // ── LANDSCAPE ──────────────────────────────────────────────────────────────
  if (size === 'landscape') {
    return (
      <div style={{ width, height, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, -apple-system, sans-serif', background: '#fff', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: civicPattern, backgroundSize: '16px 16px', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ height: 64, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${RED}, ${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 14, flexShrink: 0 }}>CL</div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: '-0.3px' }}>Change Liberia</span>
          </div>
          {category && (
            <span style={{ background: RED, color: '#fff', borderRadius: 999, padding: '5px 16px', fontSize: 14, fontWeight: 700 }}>{category}</span>
          )}
        </div>

        {/* Two-column body */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative', zIndex: 1 }}>
          {/* Left: content */}
          <div style={{ flex: 1, padding: '28px 40px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#111827', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {title}
              </h1>
              {summary && (
                <p style={{ margin: '10px 0 0', fontSize: 17, color: '#6B7280', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {summary}
                </p>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: BLUE, lineHeight: 1, letterSpacing: '-1px' }}>{signatures.toLocaleString()}</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#6B7280' }}>signatures</span>
              </div>
              <div style={{ height: 10, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(2, progress)}%`, background: `linear-gradient(90deg, ${BLUE}, ${RED})`, borderRadius: 999 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>of {goal.toLocaleString()} goal</span>
                <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 700 }}>{progress}%</span>
              </div>
            </div>
            <div style={{ background: RED, color: '#fff', borderRadius: 999, textAlign: 'center', fontSize: 22, fontWeight: 800, padding: '14px 0', letterSpacing: '-0.2px' }}>
              ✍️ Sign This Petition
            </div>
          </div>

          {/* Right: image */}
          <div style={{ width: 380, position: 'relative', flexShrink: 0 }}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${BLUE} 0%, #001540 100%)` }} />
            )}
            {/* QR overlay */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, background: '#fff', borderRadius: 10, padding: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
              <QRSlot sz={96} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ height: 44, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 17 }}>Your Voice. Your Action. Liberia's Future.</span>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>www.changelib.org</span>
        </div>
      </div>
    );
  }

  // ── SQUARE / STORY (portrait) ───────────────────────────────────────────────
  const cfg = PORTRAIT_CFG[size];
  const mainH = height - cfg.headerH - cfg.footerH;
  const glassTop = Math.min(cfg.heroH - cfg.overlap, mainH - 400);

  return (
    <div style={{ width, height, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, -apple-system, sans-serif', background: '#fff', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: civicPattern, backgroundSize: '20px 20px', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ height: cfg.headerH, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: cfg.headerPad, flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: cfg.logoSz, height: cfg.logoSz, borderRadius: '50%', background: `linear-gradient(135deg, ${RED}, ${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: cfg.logoFontSz, flexShrink: 0 }}>CL</div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: cfg.logoTextSz, letterSpacing: '-0.3px' }}>Change Liberia</span>
        </div>
        {category && (
          <span style={{ background: RED, color: '#fff', borderRadius: 999, padding: cfg.catPad, fontSize: cfg.catFontSz, fontWeight: 700 }}>{category}</span>
        )}
      </div>

      {/* Main area: hero + glass card */}
      <div style={{ height: mainH, position: 'relative', flexShrink: 0 }}>
        {/* Hero image or gradient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: cfg.heroH, overflow: 'hidden' }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${BLUE} 0%, #001540 60%, #0a1a60 100%)` }}>
              {/* Star accent */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: size === 'story' ? 160 : 120, opacity: 0.08, color: '#fff' }}>⭐</div>
            </div>
          )}
          {/* Gradient overlay at bottom of hero */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: `linear-gradient(to top, rgba(0,15,60,0.80), transparent)` }} />
        </div>

        {/* Glass card */}
        <div style={{
          position: 'absolute',
          top: glassTop,
          left: 40,
          right: 40,
          bottom: 0,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: `${cfg.cardRad}px ${cfg.cardRad}px 0 0`,
          boxShadow: '0 -4px 32px rgba(0,0,0,0.14), 0 8px 32px rgba(0,0,0,0.08)',
          padding: cfg.cardPad,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          zIndex: 1,
        }}>
          {/* Title */}
          <h1 style={{ margin: 0, fontSize: cfg.titleSz, fontWeight: 900, color: '#111827', lineHeight: 1.15, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: cfg.titleClamp, WebkitBoxOrient: 'vertical' }}>
            {title}
          </h1>

          {/* Summary */}
          {summary && (
            <p style={{ margin: 0, fontSize: cfg.summarySz, color: '#6B7280', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: cfg.summaryClamp, WebkitBoxOrient: 'vertical' }}>
              {summary}
            </p>
          )}

          {/* Signatures + progress */}
          <ProgressBar barH={cfg.barH} sigSz={cfg.sigSz} sigLabelSz={cfg.sigLabelSz} />

          {/* CTA */}
          <div style={{ background: RED, color: '#fff', borderRadius: 999, textAlign: 'center', fontSize: cfg.ctaSz, fontWeight: 800, padding: `${cfg.ctaP}px 0`, letterSpacing: '-0.3px' }}>
            ✍️ Sign This Petition
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: cfg.footerH, background: '#fff', borderTop: `4px solid ${GOLD}`, display: 'flex', alignItems: 'center', padding: `0 ${cfg.cardPad}px`, gap: 20, flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <QRSlot sz={cfg.qrSz} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: cfg.tagSz, color: '#374151' }}>Your Voice. Your Action. Liberia's Future.</p>
          <p style={{ margin: '4px 0 0', fontSize: cfg.tagSz * 0.8, color: '#9CA3AF' }}>www.changelib.org</p>
        </div>
      </div>
    </div>
  );
}
