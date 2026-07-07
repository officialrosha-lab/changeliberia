'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete, getApiBase } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';
import { ShareModal } from '../../../components/share-modal';

const turnstileSiteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';

const localKey = (petitionId: string) => `signed_petition_${petitionId}`;
const savedLocationKey = 'change_liberia_saved_location';

const RELATIONSHIP_OPTIONS = [
  { value: 'LIVES_HERE', label: 'I live here' },
  { value: 'WORKS_HERE', label: 'I work here' },
  { value: 'ATTENDS_SCHOOL_HERE', label: 'I attend school here' },
  { value: 'OWNS_PROPERTY_HERE', label: 'I own property here' },
  { value: 'BUSINESS_OPERATES_HERE', label: 'My business operates here' },
  { value: 'FREQUENTLY_USES_AREA', label: 'I frequently use this area' },
  { value: 'OTHER', label: 'Other' },
] as const;

type SavedLocation = { county?: string; district?: string; community?: string };

function loadSavedLocation(): SavedLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(savedLocationKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocation(location: SavedLocation) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(savedLocationKey, JSON.stringify(location));
  } catch {
    /* best-effort */
  }
}

/** Compares a saved/profile location against the fields the petition's impact scope actually requires. */
function locationMatchesScope(
  scope: string | null | undefined,
  petitionCounty: string | null | undefined,
  petitionDistrict: string | null | undefined,
  petitionCommunity: string | null | undefined,
  candidate: SavedLocation | null,
): boolean {
  if (!candidate || !candidate.county || !petitionCounty) return false;
  if (candidate.county !== petitionCounty) return false;
  if (scope === 'COUNTY') return true;
  if (scope === 'DISTRICT') return !petitionDistrict || candidate.district === petitionDistrict;
  if (scope === 'COMMUNITY') {
    if (petitionDistrict && candidate.district !== petitionDistrict) return false;
    return !petitionCommunity || candidate.community === petitionCommunity;
  }
  return false;
}

export function SignForm({
  petitionId,
  signatureCount,
  goal,
  title = 'This Petition',
  imageUrl,
  impactScope,
  county,
  district,
  community,
}: {
  petitionId: string;
  signatureCount: number;
  goal: number;
  title?: string;
  imageUrl?: string;
  impactScope?: string | null;
  county?: string | null;
  district?: string | null;
  community?: string | null;
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
  const [copiedShort, setCopiedShort] = useState(false);
  const [petitionUrl, setPetitionUrl] = useState('');
  const [shortUrl, setShortUrl] = useState<string | null>(null);

  // Petition Location Verification & Impact Area System (Phase 1)
  const needsLocationFlow = !!impactScope && impactScope !== 'NATIONAL';
  const [locationStep, setLocationStep] = useState<'none' | 'affected' | 'relationship' | 'location'>('none');
  const [personallyAffected, setPersonallyAffected] = useState<boolean | null>(null);
  const [relationshipType, setRelationshipType] = useState<string | null>(null);
  const [confirmedCounty, setConfirmedCounty] = useState('');
  const [confirmedDistrict, setConfirmedDistrict] = useState('');
  const [confirmedCommunity, setConfirmedCommunity] = useState('');
  const [knownLocation, setKnownLocation] = useState<SavedLocation | null>(null);

  useEffect(() => {
    if (!needsLocationFlow) return;
    if (token) {
      apiGet<{ county?: string; district?: string; community?: string }>('/users/me', token)
        .then((profile) => setKnownLocation({ county: profile.county, district: profile.district, community: profile.community }))
        .catch(() => setKnownLocation(loadSavedLocation()));
    } else {
      setKnownLocation(loadSavedLocation());
    }
  }, [needsLocationFlow, token]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPetitionUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    apiGet<{ shortCode: string; shortUrl: string }>(`/petitions/${petitionId}/share-link`)
      .then((data) => setShortUrl(data.shortUrl))
      .catch(() => {/* best-effort */});
  }, [petitionId]);

  // Signed-state check:
  // - Authenticated users: always ask the server (localStorage may be stale across devices)
  // - Anonymous users: use localStorage as a best-effort hint
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (token) {
      let cancelled = false;
      apiGet<{ signed: boolean }>(`/signatures/${petitionId}/has-signed`, token)
        .then(({ signed }) => {
          if (cancelled) return;
          setHasSigned(signed);
          if (signed) localStorage.setItem(localKey(petitionId), '1');
          else localStorage.removeItem(localKey(petitionId));
        })
        .catch(() => {
          if (cancelled) return;
          // Fall back to localStorage on network error
          setHasSigned(localStorage.getItem(localKey(petitionId)) !== null);
        });
      return () => { cancelled = true; };
    }

    setHasSigned(localStorage.getItem(localKey(petitionId)) !== null);
  }, [petitionId, token]);

  useEffect(() => {
    if (!token) return;
    apiGet<{ following: boolean }>(`/petitions/${petitionId}/follow`, token)
      .then(({ following: f }) => setFollowing(f))
      .catch(() => {});
  }, [petitionId, token]);

  // Live signature counter via SSE
  useEffect(() => {
    const es = new EventSource(`${getApiBase()}/petitions/${petitionId}/live`);
    es.onmessage = () => { setCount((prev) => prev + 1); };
    es.onerror = () => { es.close(); };
    return () => { es.close(); };
  }, [petitionId]);

  const progress = Math.min(100, Math.round((count / goal) * 100));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    // Petition Location Verification & Impact Area System (Phase 1): route
    // through the lightweight 1-2 tap flow before actually signing, unless
    // the petition has no impact scope or is NATIONAL (everyone is
    // considered directly affected nationally — no need to ask).
    if (needsLocationFlow && locationStep === 'none') {
      setLocationStep('affected');
      return;
    }

    void submitSignature();
  }

  function answerAffected(affected: boolean) {
    setPersonallyAffected(affected);
    if (!affected) {
      void submitSignature();
      return;
    }
    setLocationStep('relationship');
  }

  function answerRelationship(value: string) {
    setRelationshipType(value);
    const matches = locationMatchesScope(impactScope, county, district, community, knownLocation);
    if (matches) {
      // Profile/saved location already matches — skip Step 3 entirely.
      void submitSignature();
      return;
    }
    if (knownLocation?.county) {
      setConfirmedCounty(knownLocation.county);
      setConfirmedDistrict(knownLocation.district ?? '');
      setConfirmedCommunity(knownLocation.community ?? '');
    }
    setLocationStep('location');
  }

  async function submitSignature() {
    const tokenForRequest =
      captchaRequired && !turnstileSiteKey ? 'human-verified' : captchaToken;

    if (captchaRequired && turnstileSiteKey && !captchaToken) {
      setStatus('Complete the security check below, then tap Sign again.');
      return;
    }

    setSubmitting(true);
    setStatus('');

    const usingConfirmedLocation = locationStep === 'location';
    if (usingConfirmedLocation && confirmedCounty) {
      saveLocation({ county: confirmedCounty, district: confirmedDistrict, community: confirmedCommunity });
    }

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
        personallyAffected: needsLocationFlow ? personallyAffected : undefined,
        relationshipType: personallyAffected ? (relationshipType ?? undefined) : undefined,
        confirmedCounty: usingConfirmedLocation ? confirmedCounty || undefined : undefined,
        confirmedDistrict: usingConfirmedLocation ? confirmedDistrict || undefined : undefined,
        confirmedCommunity: usingConfirmedLocation ? confirmedCommunity || undefined : undefined,
        locationSource: usingConfirmedLocation ? 'user_confirmed' : undefined,
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
      setLocationStep('none');

      // Track petition signature as a Lead conversion — best-effort
      try {
        if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
          (window as any).fbq('track', 'Lead', { content_name: title, content_category: 'Petition' });
        }
      } catch { /* analytics must not break the sign flow */ }

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
            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowShare(true)}
                className="flex-1 min-w-[140px] rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
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
            {locationStep === 'none' && (
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
            )}

            {locationStep === 'affected' && (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-neutral-600 dark:bg-neutral-700">
                <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-50">
                  Are you personally affected by this issue?
                </p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => answerAffected(true)}
                    className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                    ✅ Yes
                  </button>
                  <button type="button" onClick={() => answerAffected(false)}
                    className="flex-1 rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-500 dark:text-neutral-200">
                    🤝 No, supporting
                  </button>
                </div>
                <button type="button" onClick={() => setLocationStep('none')}
                  className="mt-2 text-xs font-medium text-zinc-400 hover:underline">
                  Back
                </button>
              </div>
            )}

            {locationStep === 'relationship' && (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-neutral-600 dark:bg-neutral-700">
                <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-50">
                  How are you connected to this issue?
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {RELATIONSHIP_OPTIONS.map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => answerRelationship(value)}
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-neutral-500 dark:text-neutral-200 dark:hover:bg-neutral-600">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {locationStep === 'location' && (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-neutral-600 dark:bg-neutral-700">
                <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-50">Confirm your location</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-400">
                  This helps us show accurate, aggregated support statistics. Never shared publicly.
                </p>
                <div className="mt-3 space-y-2">
                  <input value={confirmedCounty} onChange={(e) => setConfirmedCounty(e.target.value)}
                    placeholder="County" list="sign-form-counties"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100" />
                  {(impactScope === 'DISTRICT' || impactScope === 'COMMUNITY') && (
                    <input value={confirmedDistrict} onChange={(e) => setConfirmedDistrict(e.target.value)}
                      placeholder="District"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100" />
                  )}
                  {impactScope === 'COMMUNITY' && (
                    <input value={confirmedCommunity} onChange={(e) => setConfirmedCommunity(e.target.value)}
                      placeholder="Community / Town"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100" />
                  )}
                </div>
                {captchaRequired && turnstileSiteKey ? (
                  <div className="flex justify-center py-2">
                    <Turnstile siteKey={turnstileSiteKey} onSuccess={(t) => setCaptchaToken(t)} />
                  </div>
                ) : null}
                <button type="button" disabled={submitting} onClick={() => void submitSignature()}
                  className="mt-3 w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-3 font-semibold text-zinc-900 shadow-sm transition-all hover:from-amber-300 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? 'Signing…' : 'Confirm & Sign'}
                </button>
              </div>
            )}

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

          {/* Row 1: QR code + short link */}
          <div className="mt-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(petitionUrl)}&size=96x96&margin=4`}
              alt="QR code"
              className="h-24 w-24 shrink-0 rounded-xl border border-zinc-200 dark:border-neutral-700"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {shortUrl && (
                <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300">
                    {shortUrl.replace('https://', '')}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(shortUrl);
                      setCopiedShort(true);
                      setTimeout(() => setCopiedShort(false), 2000);
                    }}
                    className="flex-shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {copiedShort ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(petitionUrl)}&size=300x300&margin=8`}
                download={`petition-${petitionId}-qr.png`}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-center text-[11px] font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Download QR Code
              </a>
            </div>
          </div>

          {/* Row 2: Social buttons — full card width */}
          <div className="mt-4 flex justify-between">
            {/* Copy link */}
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(petitionUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
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

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(petitionUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877F2] transition hover:opacity-90">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
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
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] transition hover:opacity-90">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </span>
              <span className="text-[10px] font-medium text-zinc-600 dark:text-neutral-400">WhatsApp</span>
            </a>

            {/* X */}
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Sign this petition: ${petitionUrl}`)}`}
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

            {/* Email */}
            <a
              href={`mailto:?subject=${encodeURIComponent('Sign this petition')}&body=${encodeURIComponent(`I wanted to share this petition with you: ${petitionUrl}`)}`}
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
          title={title}
          goal={goal}
          signatures={count}
          imageUrl={imageUrl}
          onClose={() => setShowShare(false)}
        />
      ) : null}
    </>
  );
}
