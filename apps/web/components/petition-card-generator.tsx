'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PetitionCard, type CardSize } from './petition-card';
import { exportCardAsPNG, exportCardAsPDF, exportCardAsSVG } from '../lib/card-exporter';

const CARD_DIMENSIONS: Record<CardSize, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 628 },
};

interface PetitionCardGeneratorProps {
  petitionId: string;
  title: string;
  goal: number;
  signatures: number;
  imageUrl?: string;
  petitionUrl: string;
  onClose: () => void;
}

export function PetitionCardGenerator({
  petitionId,
  title,
  goal,
  signatures,
  imageUrl,
  petitionUrl,
  onClose,
}: PetitionCardGeneratorProps) {
  const [selectedSize, setSelectedSize] = useState<CardSize>('square');
  const [exporting, setExporting] = useState<boolean>(false);
  const exportRef = useRef<HTMLDivElement>(null);

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
      if (format === 'png') {
        await exportCardAsPNG(exportRef.current, selectedSize, filename);
      } else if (format === 'pdf') {
        await exportCardAsPDF(exportRef.current, selectedSize, filename);
      } else if (format === 'svg') {
        await exportCardAsSVG(exportRef.current, selectedSize, filename);
      }
    } catch (error) {
      console.error(`Export failed:`, error);
      alert('Failed to export card. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl h-[90vh] rounded-2xl bg-white shadow-xl dark:bg-neutral-900 flex flex-col">
        {/* Header */}
        <div className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between dark:border-neutral-800 dark:bg-neutral-900 flex-shrink-0">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Download Petition Card
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg transition dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5 text-zinc-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Off-screen export target — full resolution, not visible to user */}
        <div
          aria-hidden
          style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}
        >
          <div ref={exportRef}>
            <PetitionCard
              title={title}
              goal={goal}
              signatures={signatures}
              imageUrl={imageUrl}
              petitionUrl={petitionUrl}
              size={selectedSize}
            />
          </div>
        </div>

        {/* Main content - two columns layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Preview panel */}
          <div className="flex-1 border-r border-zinc-200 dark:border-neutral-800 p-6 overflow-y-auto flex flex-col">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Preview</h3>
            <div className="border border-zinc-200 rounded-lg bg-zinc-50 p-6 dark:border-neutral-700 dark:bg-neutral-800 flex items-center justify-center flex-grow overflow-hidden">
              <div
                style={{
                  transform: `scale(${Math.min(
                    (typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.35, 400) : 300) /
                      CARD_DIMENSIONS[selectedSize].width,
                    (typeof window !== 'undefined' ? Math.min(window.innerHeight * 0.5, 500) : 400) /
                      CARD_DIMENSIONS[selectedSize].height,
                  )})`,
                  transformOrigin: 'top center',
                }}
              >
                <PetitionCard
                  title={title}
                  goal={goal}
                  signatures={signatures}
                  imageUrl={imageUrl}
                  petitionUrl={petitionUrl}
                  size={selectedSize}
                />
              </div>
            </div>
          </div>

          {/* Right: Controls panel */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-neutral-800 p-6 overflow-y-auto flex flex-col gap-6">
            {/* Size selector */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                Card Size
              </h3>
              <div className="space-y-2">
                {sizes.map(({ size, label, desc }) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-full p-3 rounded-lg border-2 transition text-left ${
                      selectedSize === size
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-zinc-200 bg-zinc-50 hover:border-emerald-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-emerald-600'
                    }`}
                  >
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{label}</p>
                    <p className="text-xs text-zinc-600 dark:text-neutral-400">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Download options */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                Download Format
              </h3>
              <div className="space-y-2">
                {(
                  [
                    { format: 'png' as const, label: 'PNG', icon: '📸' },
                    { format: 'pdf' as const, label: 'PDF', icon: '📄' },
                    { format: 'svg' as const, label: 'SVG', icon: '✏️' },
                  ] as const
                ).map(({ format, label, icon }) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    disabled={exporting}
                    className={`w-full flex items-center gap-2 p-3 rounded-lg border-2 transition font-semibold ${
                      exporting
                        ? 'opacity-50 cursor-not-allowed border-zinc-200 dark:border-neutral-700'
                        : 'border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50 dark:border-neutral-700 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-sm text-zinc-900 dark:text-white">{label}</span>
                    {exporting && (
                      <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400">…</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-950/30 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-300">
                <strong>💡 Tip:</strong> Each card includes a QR code. Download and share across social media!
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-neutral-800">
              <a
                href={petitionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 transition text-center"
              >
                View Full Petition
              </a>
              <button
                onClick={onClose}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-100 transition dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
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
