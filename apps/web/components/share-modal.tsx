'use client';

import { useState } from 'react';
import { FacebookShareDialog } from './facebook-share-dialog';
import { useFocusTrap } from '../lib/use-focus-trap';

type Props = {
  petitionUrl: string;
  petitionId: string;
  onClose: () => void;
  title?: string;
  goal?: number;
  signatures?: number;
  imageUrl?: string;
  reachEstimate?: number;
  activeChallenge?: {
    title: string;
    progress: number;
    goalValue: number;
  };
};

export function ShareModal({
  petitionUrl,
  petitionId,
  onClose,
  title,
  signatures,
  reachEstimate = 250,
  activeChallenge
}: Props) {
  const [showFacebookDialog, setShowFacebookDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

  const shareCardSrc =
    typeof signatures === 'number'
      ? `/share-card/${petitionId}?count=${signatures}`
      : `/share-card/${petitionId}`;

  const shareText = title
    ? `I just signed "${title}" — join me:`
    : 'I just signed this petition:';
  const wa = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${petitionUrl}`)}`;
  const x = `https://x.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${petitionUrl}`)}`;
  const mail = `mailto:?subject=${encodeURIComponent('Sign this petition')}&body=${encodeURIComponent(`${shareText} ${petitionUrl}`)}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(petitionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const challengeProgress = activeChallenge
    ? Math.round((activeChallenge.progress / activeChallenge.goalValue) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 dark:bg-neutral-900"
      >
        <h3 id="share-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-white">Share this petition now</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">Your share brings more verified voices.</p>

        {/* Share card preview */}
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800" style={{ aspectRatio: '4 / 5' }}>
          {!imgError && (
            // eslint-disable-next-line @next/next/no-img-element -- generated PNG served from our own route, not an optimizable static asset
            <img
              src={shareCardSrc}
              alt="Preview of this petition's share card"
              className={`h-full w-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          )}
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600 dark:border-neutral-600" />
            </div>
          )}
        </div>

        {/* Reach estimate badge */}
        <div className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          🌐 Estimated reach: {reachEstimate} people
        </div>

        {/* Active challenge progress */}
        {activeChallenge && (
          <div className="mt-3 rounded-lg bg-purple-50 p-3 dark:bg-purple-950/30">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-purple-700 dark:text-purple-300">{activeChallenge.title}</span>
              <span className="text-purple-600 dark:text-purple-400">{challengeProgress}%</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-purple-200 dark:bg-purple-900">
              <div
                className="h-full rounded-full bg-purple-600 dark:bg-purple-500 transition-all"
                style={{ width: `${challengeProgress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
              {activeChallenge.progress} of {activeChallenge.goalValue} shares
            </p>
          </div>
        )}

        {/* Share mediums */}
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 transition hover:bg-zinc-200 dark:border-neutral-700 dark:bg-neutral-700">
              {copied ? (
                <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-zinc-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              )}
            </span>
            <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFacebookDialog(true)}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877F2] transition hover:opacity-90">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </span>
            <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">Facebook</span>
          </button>

          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] transition hover:opacity-90">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
            </span>
            <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">WhatsApp</span>
          </a>

          <a
            href={x}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 transition hover:opacity-90 dark:bg-zinc-700">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </span>
            <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">X</span>
          </a>

          <a
            href={mail}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 transition hover:bg-zinc-200 dark:border-neutral-700 dark:bg-neutral-700">
              <svg className="h-4 w-4 text-zinc-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </span>
            <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">Email</span>
          </a>
        </div>

        <a
          href={shareCardSrc}
          download={`petition-${petitionId}-share-card.png`}
          className="mt-4 block w-full rounded-xl border border-zinc-300 px-4 py-3 text-center font-semibold hover:bg-zinc-50 transition dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Download share card
        </a>

        <button
          onClick={onClose}
          className="mt-3 w-full text-sm text-zinc-500 hover:text-zinc-700 dark:text-neutral-400 dark:hover:text-neutral-300"
        >
          Close
        </button>
      </div>

      {/* Facebook share dialog modal */}
      {showFacebookDialog && (
        <FacebookShareDialog
          petitionId={petitionId}
          petitionUrl={petitionUrl}
          networkSize={reachEstimate}
          onClose={() => setShowFacebookDialog(false)}
        />
      )}
    </div>
  );
}
