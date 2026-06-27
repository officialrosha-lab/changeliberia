'use client';

import { useState } from 'react';
import { FacebookShareDialog } from './facebook-share-dialog';

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
  title = 'This Petition',
  goal = 1000,
  signatures = 0,
  imageUrl,
  reachEstimate = 250,
  activeChallenge 
}: Props) {
  const [showFacebookDialog, setShowFacebookDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const wa = `https://wa.me/?text=${encodeURIComponent(`I just signed this petition: ${petitionUrl}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(petitionUrl)}`;

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
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-neutral-900">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Share this petition now</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">Your share brings more verified voices.</p>
        
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

        <div className="mt-4 grid gap-2">
          <a 
            href={wa} 
            target="_blank" 
            rel="noreferrer" 
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-center font-semibold text-white transition dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            WhatsApp
          </a>
          
          <button 
            onClick={() => setShowFacebookDialog(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-center font-semibold text-white transition dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Facebook
          </button>

          <button
            onClick={handleCopyLink} 
            className="rounded-xl border border-zinc-300 px-4 py-3 font-semibold hover:bg-zinc-50 transition dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {copied ? '✓ Link copied!' : 'Copy link'}
          </button>
        </div>

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
