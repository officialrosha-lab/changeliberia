'use client';

import { useState } from 'react';

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
  const [estimatedReach, setEstimatedReach] = useState(networkSize);

  const handleFacebookShare = async () => {
    try {
      setLoading(true);

      // Create share link via API
      const response = await fetch('/api/facebook/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petitionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const { data } = await response.json();
      const { shareUrl, prefilledMessage, reachEstimate } = data;

      // If Facebook SDK is loaded, use Share Dialog
      if (typeof window !== 'undefined' && (window as any).FB) {
        (window as any).FB.ui({
          method: 'share',
          href: shareUrl,
          hashtag: '#ChangeLiberia',
          quote: prefilledMessage,
          display: 'popup',
        }, function(response: any) {
          if (response) {
            setShared(true);
            setEstimatedReach(reachEstimate || networkSize);
          }
        });
      } else {
        // Fallback to standard share
        const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(prefilledMessage)}`;
        window.open(fb, '_blank', 'width=600,height=400');
        setShared(true);
      }

      // Record share event
      if (data.shortCode) {
        await fetch('/api/facebook/record-share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            petitionId,
            shortCode: data.shortCode,
          }),
        }).catch(() => null); // Don't block on recording error
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Share on Facebook</h3>
          <button 
            onClick={onClose}
            className="text-2xl text-zinc-400 hover:text-zinc-600"
          >
            ×
          </button>
        </div>

        {shared ? (
          <div className="mt-4 rounded-lg bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-green-800">Thanks for sharing!</p>
                <p className="mt-1 text-sm text-green-700">
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
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">Estimated reach</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {Math.round(estimatedReach)} people
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Based on your network size and engagement
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm font-semibold text-purple-900">Sharing benefits</p>
              <ul className="mt-2 space-y-1 text-xs text-purple-700">
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
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
