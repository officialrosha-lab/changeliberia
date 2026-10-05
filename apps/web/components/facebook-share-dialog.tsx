'use client';

import { useState } from 'react';
import { apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface FacebookSDK {
  ui: (
    params: { method: string; href: string; hashtag?: string; quote?: string; display?: string },
    callback: (response: { post_id?: string } | null) => void,
  ) => void;
}

type Props = {
  petitionId: string;
  petitionUrl: string;
  networkSize: number;
  onClose: () => void;
};

export function FacebookShareDialog({
  petitionId,
  petitionUrl,
  networkSize,
  onClose
}: Props) {
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const [estimatedReach] = useState(networkSize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Fire-and-forget: recording a share must never block the share itself,
  // and the endpoint requires auth — anonymous shares simply go unrecorded.
  const recordShare = () => {
    if (!isAuthenticated) return;
    apiPost('/facebook/record-share', { petitionId, method: 'dialog' }).catch(() => null);
  };

  const handleFacebookShare = async () => {
    try {
      setLoading(true);

      const quote = 'Join our petition! Together we can make change. 🇱🇷 #ChangeLiberia';

      // If Facebook SDK is loaded, use Share Dialog
      const fb = (window as unknown as { FB?: FacebookSDK }).FB;
      if (typeof window !== 'undefined' && fb) {
        fb.ui({
          method: 'share',
          href: petitionUrl,
          hashtag: '#ChangeLiberia',
          quote,
          display: 'popup',
        }, function(response) {
          if (response) {
            setShared(true);
            recordShare();
          }
        });
      } else {
        // Fallback to standard share
        const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(petitionUrl)}&quote=${encodeURIComponent(quote)}`;
        window.open(fb, '_blank', 'width=600,height=400');
        setShared(true);
        recordShare();
      }
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to standard share
      const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(petitionUrl)}`;
      window.open(fb, '_blank', 'width=600,height=400');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Share on Facebook</h3>
          <button
            onClick={onClose}
            className="text-2xl text-zinc-400 hover:text-zinc-600 dark:text-neutral-500 dark:hover:text-neutral-300"
          >
            ×
          </button>
        </div>

        {shared ? (
          <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">Thanks for sharing!</p>
                <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                  Your share could reach up to {Math.round(estimatedReach * 1.2)} people.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/40">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Estimated reach</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round(estimatedReach)} people
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                Based on your network size and engagement
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950/30">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">Sharing benefits</p>
              <ul className="mt-2 space-y-1 text-xs text-purple-700 dark:text-purple-300">
                <li>✓ Earn Trust Points for every share</li>
                <li>✓ Unlock social badges</li>
                <li>✓ Track your viral impact</li>
                <li>✓ Compete on leaderboards</li>
              </ul>
            </div>

            <button
              onClick={handleFacebookShare}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Preparing...
                </>
              ) : (
                <>
                  <span>f</span>
                  Share Now
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 transition dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
