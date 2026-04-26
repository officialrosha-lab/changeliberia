'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
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
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setShowShare(true);
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
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="mt-3 w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Share this petition
            </button>
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
