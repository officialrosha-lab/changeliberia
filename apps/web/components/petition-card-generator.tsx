'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PetitionCard, type CardSize } from './petition-card';
import { exportCardAsPNG, exportCardAsPDF, exportCardAsSVG } from '../lib/card-exporter';

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
  const [exporting, setExporting] = useState<CardSize | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const sizes: { size: CardSize; label: string; desc: string }[] = [
    { size: 'square', label: 'Square', desc: '1080×1080 (Instagram)' },
    { size: 'story', label: 'Story', desc: '1080×1920 (Stories)' },
    { size: 'landscape', label: 'Landscape', desc: '1200×630 (Facebook)' },
  ];

  const handleExport = async (format: 'png' | 'pdf' | 'svg') => {
    if (!cardRef.current) return;

    setExporting(selectedSize);
    try {
      const filename = `petition-${petitionId}`;
      if (format === 'png') {
        await exportCardAsPNG(cardRef.current, selectedSize, filename);
      } else if (format === 'pdf') {
        await exportCardAsPDF(cardRef.current, selectedSize, filename);
      } else if (format === 'svg') {
        await exportCardAsSVG(cardRef.current, selectedSize, filename);
      }
    } catch (error) {
      console.error(`Export failed:`, error);
      alert('Failed to export card. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl dark:bg-neutral-900 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between dark:border-neutral-800 dark:bg-neutral-900">
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

        <div className="p-6 space-y-6">
          {/* Size selector */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
              Choose card size
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {sizes.map(({ size, label, desc }) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`p-3 rounded-lg border-2 transition text-left ${
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

          {/* Preview */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Preview</h3>
            <div className="border border-zinc-200 rounded-lg bg-zinc-50 p-4 overflow-x-auto dark:border-neutral-700 dark:bg-neutral-800">
              <div ref={cardRef} className="inline-block">
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

          {/* Download options */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
              Download formats
            </h3>
            <div className="grid grid-cols-3 gap-3">
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
                  disabled={exporting === selectedSize}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                    exporting === selectedSize
                      ? 'opacity-50 cursor-not-allowed'
                      : 'border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50 dark:border-neutral-700 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">{label}</span>
                  {exporting === selectedSize && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Exporting…</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-950/30 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>💡 Tip:</strong> Each card includes a QR code that links to your petition.
              Download in all sizes and share across social media to maximize reach!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4 flex gap-3 dark:border-neutral-800 dark:bg-neutral-800">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-100 transition dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Close
          </button>
          <a
            href={petitionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 transition text-center"
          >
            View Full Petition
          </a>
        </div>
      </div>
    </div>
  );
}
