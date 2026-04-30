'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';
import { ShareModal } from '../../../components/share-modal';

const turnstileSiteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';

const localKey = (petitionId: string) => `signed_petition_${petitionId}`;

export function SignForm({
  petitionId,
  signatureCount,
  goal,
}: {
  petitionId: string;
  signatureCount: number;
  goal: number;
}) {
  const token = useAuthStore((s) => s.token);
  const [name, setName] = useState('');
  const [count, setCount] = useState(signatureCount);
  const [hasSigned, setHasSigned] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showFollowPrompt, setShowFollowPrompt] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [petitionUrl, setPetitionUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPetitionUrl(window.location.href);
    }
  }, []);

  // Layer A: localStorage (instant, works for all users)
  // Layer B: API check (authoritative, logged-in users only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (localStorage.getItem(localKey(petitionId))) {
      setHasSigned(true);
      return;
    }

    if (!token) return;

    apiGet<{ signed: boolean }>(`/signatures/${petitionId}/has-signed`, token)
      .then(({ signed }) => {
        if (signed) {
          localStorage.setItem(localKey(petitionId), '1');
          setHasSigned(true);
        }
      })
      .catch(() => {/* silent — form stays visible */});
  }, [petitionId, token]);

  useEffect(() => {
    if (!token) return;
    apiGet<{ following: boolean }>(`/petitions/${petitionId}/follow`, token)
      .then(({ following: f }) => setFollowing(f))
      .catch(() => {});
  }, [petitionId, token]);

  // Live signature counter via SSE
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    const es = new EventSource(`${apiBase}/petitions/${petitionId}/live`);
    es.onmessage = () => { setCount((prev) => prev + 1); };
    es.onerror = () => { es.close(); };
    return () => { es.close(); };
  }, [petitionId]);

  const progress = Math.min(100, Math.round((count / goal) * 100));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    const tokenForRequest =
      captchaRequired && !turnstileSiteKey ? 'human-verified' : captchaToken;

    if (captchaRequired && turnstileSiteKey && !captchaToken) {
      setStatus('Complete the security check below, then tap Sign again.');
      return;
    }

    setSubmitting(true);
    setStatus('');

    try {
      const response = await apiPost<{
        signature: { id: string } | null;
        captchaRequired: boolean;
        riskReasons?: string[];
      }>('/signatures', {
        petitionId,
        name,
        deviceFingerprint: `web-${navigator.userAgent.slice(0, 40)}`,
        captchaToken:
          captchaRequired && tokenForRequest ? tokenForRequest : undefined,
      });

      if (response.captchaRequired && !response.signature) {
        setCaptchaRequired(true);
        setCaptchaToken(null);
        setStatus(
          turnstileSiteKey
            ? 'Complete the security check, then sign again.'
            : 'Security check required. Tap Sign again to confirm you are human.',
        );
        return;
      }

      // Mark as signed in both state and localStorage
      localStorage.setItem(localKey(petitionId), '1');
      setHasSigned(true);
      setCount((prev) => prev + 1);
      setCaptchaRequired(false);
      setCaptchaToken(null);
      setStatus('');
      setName('');
      // Show follow prompt first; share modal opens after
      setShowFollowPrompt(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('already signed')) {
        localStorage.setItem(localKey(petitionId), '1');
        setHasSigned(true);
      } else {
        setStatus(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleFollow() {
    if (!token) return;
    setFollowLoading(true);
    try {
      if (following) {
        await apiDelete(`/petitions/${petitionId}/follow`, token);
        setFollowing(false);
      } else {
        await apiPost(`/petitions/${petitionId}/follow`, {}, token);
        setFollowing(true);
      }
    } catch {
      // silent
    } finally {
      setFollowLoading(false);
    }
  }

  return (
    <>
      <div
        id="sign"
        className="sticky top-20 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
      >
        <p className="text-sm font-medium text-zinc-500 dark:text-neutral-400">Verified signatures</p>
        <p className="mt-1 text-4xl font-bold text-zinc-900 dark:text-neutral-50">{count.toLocaleString()}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {progress}% of {goal.toLocaleString()} goal
        </p>

        {hasSigned ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                You've already signed this petition
              </p>
            </div>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
              Thank you for your support. Help it grow by sharing with others.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowShare(true)}
                className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Share this petition
              </button>
              {token && (
                <button
                  type="button"
                  disabled={followLoading}
                  onClick={() => void toggleFollow()}
                  title={following ? 'Stop notifications' : 'Get notified of updates'}
                  className={`flex-shrink-0 rounded-full border px-3 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                    following
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  {followLoading ? '…' : following ? '🔔 Following' : '🔕 Follow'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 rounded-2xl bg-zinc-50 p-4 dark:bg-neutral-700">
              <p className="text-lg font-semibold text-zinc-900 dark:text-neutral-50">Sign this petition</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-300">
                Add your name to help this campaign gain momentum and show visible support.
              </p>
            </div>
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <input
                id="signer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-400"
              />
              {captchaRequired && turnstileSiteKey ? (
                <div className="flex justify-center py-2">
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onSuccess={(t) => setCaptchaToken(t)}
                  />
                </div>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-3 font-semibold text-zinc-900 shadow-sm transition-all hover:from-amber-300 hover:to-amber-400 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500"
              >
                {submitting ? 'Signing…' : captchaRequired ? 'Verify & Sign Petition' : 'Sign Petition'}
              </button>
            </form>
            {status ? (
              <p className="mt-2 text-xs text-amber-700">{status}</p>
            ) : null}
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              Verified signatures help campaign owners show decision-makers that real people support
              this issue. Your name is used only to support this petition.
            </p>
          </>
        )}
      </div>

      {/* Inline share panel — below the Verified Signatures card */}
      {petitionUrl && (
        <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-neutral-50">Share this petition</h3>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* QR code column */}
            <div className="flex flex-col items-center gap-2 sm:w-[140px] sm:shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(petitionUrl)}&size=110x110&margin=4`}
                alt="QR code"
                className="h-[110px] w-[110px] rounded-xl border border-zinc-200 dark:border-neutral-700"
              />
              <p className="text-center text-[11px] leading-snug text-zinc-500 dark:text-neutral-400">
                Share in person or use the QR code for your own material.
              </p>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(petitionUrl)}&size=300x300&margin=8`}
                download={`petition-${petitionId}-qr.png`}
                className="w-full rounded-full border border-zinc-300 px-3 py-2 text-center text-[11px] font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Download QR Code
              </a>
            </div>

            {/* Social icon buttons */}
            <div className="grid grid-cols-3 gap-3">
              {/* Copy link */}
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(petitionUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 transition hover:bg-zinc-200 dark:border-neutral-700 dark:bg-neutral-700">
                  {copied ? (
                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-zinc-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                  )}
                </span>
                <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">{copied ? 'Copied!' : 'Copy link'}</span>
              </button>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(petitionUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] transition hover:opacity-90">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </span>
                <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">Facebook</span>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Sign this petition: ${petitionUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] transition hover:opacity-90">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                </span>
                <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">WhatsApp</span>
              </a>

              {/* X / Twitter */}
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Sign this petition: ${petitionUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 transition hover:opacity-90 dark:bg-zinc-700">
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </span>
                <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">X</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent('Sign this petition')}&body=${encodeURIComponent(`I wanted to share this petition with you: ${petitionUrl}`)}`}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 transition hover:bg-zinc-200 dark:border-neutral-700 dark:bg-neutral-700">
                  <svg className="h-5 w-5 text-zinc-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </span>
                <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">Email</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {!hasSigned && (
        <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-3 md:hidden safe-bottom">
          <button
            type="button"
            onClick={() => document.getElementById('signer-name')?.focus()}
            className="w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-3 font-semibold text-zinc-900 shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            Add your name and sign
          </button>
        </div>
      )}

      {showFollowPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Stay in the loop</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-300">
              Get notified when there are major updates, milestones, or news about this petition.
            </p>

            {token ? (
              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={followLoading}
                  onClick={async () => {
                    if (!following) await toggleFollow();
                    setShowFollowPrompt(false);
                    setShowShare(true);
                  }}
                  className="w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  {followLoading ? 'Saving…' : following ? 'Already following ✓' : 'Yes, notify me'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowFollowPrompt(false); setShowShare(true); }}
                  className="w-full rounded-full border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  No thanks
                </button>
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-2">
                <a
                  href="/auth/signup"
                  className="block w-full rounded-full bg-emerald-600 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  Create an account to get updates
                </a>
                <button
                  type="button"
                  onClick={() => { setShowFollowPrompt(false); setShowShare(true); }}
                  className="w-full rounded-full border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  Skip
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showShare ? (
        <ShareModal
          petitionId={petitionId}
          petitionUrl={window.location.href}
          onClose={() => setShowShare(false)}
        />
      ) : null}
    </>
  );
}
