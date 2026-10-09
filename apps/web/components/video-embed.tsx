'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../lib/use-focus-trap';

const YOUTUBE_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;
const DIRECT_FILE_RE = /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i;
const TIKTOK_RE = /tiktok\.com/i;
const TIKTOK_VIDEO_ID_RE = /data-video-id="(\d+)"/;

/**
 * Renders a gallery video link as whatever actually plays it:
 * - YouTube/Vimeo links embed directly as an iframe.
 * - Direct video file links (.mp4 etc.) use a native <video> player.
 * - TikTok links open an in-app popup player instead of sending the
 *   visitor away from the site.
 * - Anything else we can't embed falls back to a "Watch video" link-out,
 *   since handing an arbitrary webpage URL to <video src> just renders a
 *   dead, undecodable player.
 */
export function PetitionVideoEmbed({ url, videoKey }: { url: string; videoKey: string }) {
  const youtubeMatch = url.match(YOUTUBE_RE);
  if (youtubeMatch) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
          className="h-full w-full"
          allowFullScreen
          title={videoKey}
        />
      </div>
    );
  }

  const vimeoMatch = url.match(VIMEO_RE);
  if (vimeoMatch) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          className="h-full w-full"
          allowFullScreen
          title={videoKey}
        />
      </div>
    );
  }

  if (DIRECT_FILE_RE.test(url)) {
    return <video src={url} controls className="w-full rounded-2xl bg-black" />;
  }

  if (TIKTOK_RE.test(url)) {
    return <TikTokPopupPlayer url={url} />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/30"
    >
      <WatchIcon />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-zinc-900 dark:text-neutral-100">Watch video</span>
        <span className="block truncate text-xs text-zinc-500 dark:text-neutral-400">{url}</span>
      </span>
    </a>
  );
}

function WatchIcon() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-neutral-700">
      ▶
    </span>
  );
}

function OpenOnTikTokLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-neutral-100 dark:text-neutral-900"
    >
      Open on TikTok ↗
    </a>
  );
}

function TikTokPopupPlayer({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const dialogRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false));

  async function handleOpen() {
    setOpen(true);
    if (videoId || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      // The oEmbed call resolves vt.tiktok.com short links to the
      // canonical numeric video ID, which TikTok's own embed/v2 iframe
      // endpoint plays directly — no embed.js script dependency, so
      // there's nothing here for TikTok's embed-script rate limiter to
      // trip on across repeated popup opens.
      const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('oEmbed request failed');
      const data = (await res.json()) as { html?: string };
      const idMatch = data.html?.match(TIKTOK_VIDEO_ID_RE);
      if (!idMatch) throw new Error('Could not resolve TikTok video id');
      setVideoId(idMatch[1]);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/30"
      >
        <WatchIcon />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-zinc-900 dark:text-neutral-100">Watch video</span>
          <span className="block truncate text-xs text-zinc-500 dark:text-neutral-400">TikTok · tap to play</span>
        </span>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Video player"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-neutral-900"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>

              {loading && (
                <div className="flex h-80 items-center justify-center text-sm text-zinc-500 dark:text-neutral-400">
                  Loading video…
                </div>
              )}
              {failed && (
                <div className="flex h-80 flex-col items-center justify-center gap-3 px-4 text-center">
                  <p className="text-sm text-zinc-600 dark:text-neutral-400">
                    Couldn&apos;t load the preview here.
                  </p>
                  <OpenOnTikTokLink url={url} />
                </div>
              )}
              {videoId && (
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${videoId}`}
                  className="h-[600px] max-h-[80vh] w-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  title="TikTok video player"
                />
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
