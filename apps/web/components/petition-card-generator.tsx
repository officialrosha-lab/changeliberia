'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PetitionCard, CARD_SIZES, type CardSize } from './petition-card';
import { exportCardAsPNG, exportCardAsPDF, exportCardAsSVG } from '../lib/card-exporter';

interface PetitionCardGeneratorProps {
  petitionId: string;
  title: string;
  summary?: string;
  category?: string;
  goal: number;
  signatures: number;
  imageUrl?: string;
  petitionUrl: string;
  onClose: () => void;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function PetitionCardGenerator({
  petitionId,
  title,
  summary,
  category,
  goal,
  signatures,
  imageUrl,
  petitionUrl,
  onClose,
}: PetitionCardGeneratorProps) {
  const [selectedSize, setSelectedSize] = useState<CardSize>('square');
  const [exporting, setExporting] = useState(false);
  const [exportImageUrl, setExportImageUrl] = useState<string | undefined>(undefined);
  const exportRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.28);

  // Pre-fetch petition image as data URL so html2canvas sees no CORS issues
  useEffect(() => {
    if (!imageUrl) return;
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    fetch(proxyUrl)
      .then((r) => r.blob())
      .then(blobToDataUrl)
      .then(setExportImageUrl)
      .catch(() => setExportImageUrl(undefined));
  }, [imageUrl]);

  // Measure preview container and calculate scale
  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const { width: cw, height: ch } = CARD_SIZES[selectedSize as CardSize];
    setScale(Math.min((width - 48) / cw, (height - 48) / ch));
  }, [selectedSize]);

  const sizes: { size: CardSize; label: string; desc: string }[] = [
    { size: 'square', label: 'Square', desc: '1080×1080 (Instagram)' },
    { size: 'story', label: 'Story', desc: '1080×1920 (Stories)' },
    { size: 'landscape', label: 'Landscape', desc: '1200×630 (Facebook)' },
  ];

  const handleExport = async (format: 'png' | 'pdf' | 'svg') => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const filename = `petition-${petitionId}`;
      if (format === 'png') await exportCardAsPNG(exportRef.current, selectedSize, filename);
      else if (format === 'pdf') await exportCardAsPDF(exportRef.current, selectedSize, filename);
      else await exportCardAsSVG(exportRef.current, selectedSize, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export card. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const cardProps = { title, summary, category, goal, signatures, petitionUrl };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Download Petition Card</h2>
            <p className="text-xs text-zinc-500 dark:text-neutral-400">Share your campaign across social platforms</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition hover:bg-zinc-100 dark:hover:bg-neutral-800">
            <X className="h-5 w-5 text-zinc-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Hidden export card — full resolution, off-screen */}
        <div aria-hidden style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
          <div ref={exportRef}>
            <PetitionCard {...cardProps} imageUrl={exportImageUrl} size={selectedSize} />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

          {/* Left: Preview */}
          <div className="flex flex-1 flex-col border-r border-zinc-200 p-5 dark:border-neutral-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">Preview</p>
            <div
              ref={previewRef}
              className="flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-neutral-800"
            >
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
                {/* Preview uses original imageUrl (no CORS needed for display) */}
                <PetitionCard {...cardProps} imageUrl={imageUrl} size={selectedSize} />
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex w-full flex-col gap-5 overflow-y-auto p-5 md:w-72">

            {/* Card size */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">Card Size</p>
              <div className="space-y-2">
                {sizes.map(({ size, label, desc }) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-full rounded-xl border-2 p-3 text-left transition ${
                      selectedSize === size
                        ? 'border-[#002868] bg-blue-50 dark:bg-blue-950/30'
                        : 'border-zinc-200 bg-zinc-50 hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-800'
                    }`}
                  >
                    <p className={`text-sm font-bold ${selectedSize === size ? 'text-[#002868] dark:text-blue-300' : 'text-zinc-900 dark:text-white'}`}>{label}</p>
                    <p className="text-xs text-zinc-500 dark:text-neutral-400">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Download format */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">Download Format</p>
              <div className="space-y-2">
                {([
                  { format: 'png' as const, label: 'PNG', icon: '📸', hint: 'Best for sharing' },
                  { format: 'pdf' as const, label: 'PDF', icon: '📄', hint: 'Print quality' },
                  { format: 'svg' as const, label: 'SVG', icon: '✏️', hint: 'Vector format' },
                ] as const).map(({ format, label, icon, hint }) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    disabled={exporting}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left font-semibold transition ${
                      exporting
                        ? 'cursor-not-allowed border-zinc-200 opacity-50 dark:border-neutral-700'
                        : 'border-zinc-200 hover:border-[#002868] hover:bg-blue-50 dark:border-neutral-700 dark:hover:bg-blue-950/30'
                    }`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className="text-sm text-zinc-900 dark:text-white">{label}</p>
                      <p className="text-xs text-zinc-400 dark:text-neutral-500">{hint}</p>
                    </div>
                    {exporting && <span className="ml-auto text-xs text-blue-600 dark:text-blue-400">…</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>💡 Tip:</strong> Each card includes a QR code that links directly to your petition. Perfect for WhatsApp and Instagram Stories!
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-neutral-800">
              <a
                href={petitionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl bg-[#002868] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#001a4a]"
              >
                View Full Petition
              </a>
              <button
                onClick={onClose}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
