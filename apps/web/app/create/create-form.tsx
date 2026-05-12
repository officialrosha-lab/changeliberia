'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState, useRef, ChangeEvent, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

type PetitionPayload = {
  title: string;
  summary: string;
  description: string;
  category?: string;
  categories?: string[];
  tags?: string[];
  petitionType?: string;
  priorActions?: string;
  isAnonymous?: boolean;
  displayName?: string;
  county?: string;
  imageUrl?: string;
  goal: number;
};

const PETITION_TYPES = [
  { value: 'government', label: 'Government action', icon: '🏛️', hint: 'Requesting a law, policy, or official response' },
  { value: 'ngo', label: 'NGO partnership', icon: '🤝', hint: 'Seeking support or funding from an NGO' },
  { value: 'social', label: 'Social movement', icon: '✊', hint: "Raising awareness — you'll handle distribution" },
  { value: 'community', label: 'Community campaign', icon: '🏘️', hint: 'Local action at council or neighbourhood level' },
];

const CATEGORIES = [
  { id: 'infrastructure', label: '🏗️ Infrastructure' },
  { id: 'education', label: '📚 Education' },
  { id: 'health', label: '🏥 Health' },
  { id: 'agriculture', label: '🌾 Agriculture' },
  { id: 'governance', label: '⚖️ Governance' },
  { id: 'youth', label: '🎓 Youth & Jobs' },
  { id: 'environment', label: '🌿 Environment' },
  { id: 'women', label: '👩 Women & Gender' },
  { id: 'human-rights', label: '✊ Human Rights' },
];

const COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
];

const STEPS = [
  { n: 1, label: 'Issue details' },
  { n: 2, label: 'Categories & location' },
  { n: 3, label: 'Story' },
  { n: 4, label: 'Campaign media' },
  { n: 5, label: 'Identity & privacy' },
];

type CreatedPetition = { id: string };

const inputCls =
  'mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-emerald-800';

export function CreatePetitionForm() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPayload = useRef<PetitionPayload | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verificationLoaded, setVerificationLoaded] = useState(!token);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [systemSettings, setSystemSettings] = useState<{ phoneVerificationRequired: boolean } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // New fields
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPetitionType, setSelectedPetitionType] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Image
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imageUrlValue, setImageUrlValue] = useState('');
  const [imagePreviewSrc, setImagePreviewSrc] = useState('');

  const prefillTitle = searchParams.get('title') ?? '';

  useEffect(() => {
    // Always fetch system settings (public endpoint)
    apiGet<{ phoneVerificationRequired: boolean }>('/settings/system')
      .then(setSystemSettings)
      .catch(() => setSystemSettings({ phoneVerificationRequired: true })); // Default to required if fetch fails

    if (!token) { setVerificationLoaded(true); return; }
    apiGet<{ phone: boolean }>('/verification/completed', token)
      .then(({ phone }) => { setPhoneVerified(phone); setVerificationLoaded(true); })
      .catch(() => setVerificationLoaded(true));
  }, [token]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const scrollToStep = (n: number) => {
    sectionRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadStatus('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadStatus('Image file must be smaller than 5MB'); return; }
    setUploadedImageFile(file);
    setUploadStatus(`Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    setImagePreviewSrc(URL.createObjectURL(file));
    setImageUrlValue('');
  };

  const handleImageUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setImageUrlValue(val);
    if (val) { setImagePreviewSrc(val); setUploadedImageFile(null); setUploadStatus(''); if (fileInputRef.current) fileInputRef.current.value = ''; }
    else setImagePreviewSrc('');
  };

  async function doSubmitPetition(payload: PetitionPayload, authToken: string) {
    setSubmitting(true);
    setStatus('');
    try {
      await apiPost<CreatedPetition>('/petitions', payload, authToken);
      setStatus('Petition submitted for review. Taking you to your dashboard…');
      window.setTimeout(() => router.push('/dashboard'), 700);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('phone')) {
        setStatus('Please verify your phone number in your dashboard before creating a petition.');
      } else {
        setStatus(msg || 'We could not submit your petition right now. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    let finalImageUrl = String(form.get('imageUrl') ?? '').trim();

    if (uploadedImageFile) {
      try {
        const reader = new FileReader();
        finalImageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedImageFile);
        });
      } catch {
        setStatus('Could not process the image file. Please try again.');
        return;
      }
    }

    const tagsRaw = String(form.get('tags') ?? '').trim();
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const priorActions = String(form.get('priorActions') ?? '').trim();
    const displayName = String(form.get('displayName') ?? '').trim();

    const payload: PetitionPayload = {
      title: String(form.get('title')),
      summary: String(form.get('summary')),
      description: String(form.get('description')),
      category: selectedCategories[0] || undefined,
      categories: selectedCategories.length ? selectedCategories : undefined,
      tags: tags.length ? tags : undefined,
      petitionType: selectedPetitionType || undefined,
      priorActions: priorActions || undefined,
      isAnonymous,
      displayName: isAnonymous && displayName ? displayName : undefined,
      county: selectedCounty || undefined,
      imageUrl: finalImageUrl || undefined,
      goal: Number(form.get('goal') ?? 1000),
    };

    if (!token) {
      pendingPayload.current = payload;
      setShowAuthModal(true);
      return;
    }
    await doSubmitPetition(payload, token);
  }

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      let data: { accessToken: string };
      if (authTab === 'login') {
        data = await apiPost<{ accessToken: string }>('/auth/login/email', { email: authEmail, password: authPassword });
      } else {
        data = await apiPost<{ accessToken: string }>('/auth/signup/email', { fullName: authFullName, phone: authPhone, email: authEmail, password: authPassword });
      }
      setToken(data.accessToken);
      setShowAuthModal(false);
      if (pendingPayload.current) {
        await doSubmitPetition(pendingPayload.current, data.accessToken);
        pendingPayload.current = null;
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  return (
    <>
      <p className="mt-4 max-w-2xl text-zinc-600 dark:text-neutral-400">
        Fill in each section below. Your petition will be reviewed before it appears publicly.
      </p>

      {/* Verification states */}
      {!verificationLoaded && (
        <div className="mt-6 flex items-center gap-3 text-sm text-zinc-500 dark:text-neutral-400">
          <svg className="h-4 w-4 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Checking account status…
        </div>
      )}

      {verificationLoaded && !token && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          You can draft your petition here, but you will need to{' '}
          <Link href="/auth/login" className="font-semibold underline">log in</Link>{' '}
          or{' '}
          <Link href="/auth/signup" className="font-semibold underline">create an account</Link>{' '}
          and verify your phone before submitting.
        </div>
      )}

      {verificationLoaded && token && systemSettings?.phoneVerificationRequired && !phoneVerified && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-bold text-amber-900 dark:text-amber-200">Verify your account to launch a petition</h2>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">Phone verification is required before launching a petition.</p>
          <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-400 active:scale-95">
            Complete verification →
          </Link>
        </div>
      )}

      {verificationLoaded && (!token || phoneVerified || !systemSettings?.phoneVerificationRequired) && (
        <>
          {/* Step progress indicator */}
          <nav className="mt-8 mb-6 hidden sm:flex items-center gap-1 overflow-x-auto" aria-label="Form sections">
            {STEPS.map((s, i) => (
              <button
                key={s.n}
                type="button"
                onClick={() => scrollToStep(s.n)}
                className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-extrabold text-white dark:bg-emerald-500">
                  {s.n}
                </span>
                {s.label}
                {i < STEPS.length - 1 && <span className="ml-1 text-zinc-300 dark:text-neutral-600">›</span>}
              </button>
            ))}
          </nav>

          <form onSubmit={submit} className="space-y-6">
            {/* STEP 1 — Issue details */}
            <section
              ref={(el) => { sectionRefs.current[0] = el; }}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">Step 1</p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">Issue details</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
                Describe what needs to change. Be specific, local, and actionable.
              </p>

              <div className="mt-4">
                <label htmlFor="title" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">I want to…</label>
                <input id="title" name="title" required key={prefillTitle} defaultValue={prefillTitle}
                  placeholder="e.g. Fix drainage on 12th Street in Sinkor before the rainy season"
                  className={inputCls} />
              </div>
              <div className="mt-4">
                <label htmlFor="summary" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">One-line summary</label>
                <input id="summary" name="summary" required placeholder="Explain the issue in one sentence." className={inputCls} />
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                  Petition type <span className="font-normal text-zinc-500">(optional)</span>
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PETITION_TYPES.map(({ value, label, icon, hint }) => (
                    <button key={value} type="button"
                      onClick={() => setSelectedPetitionType(selectedPetitionType === value ? null : value)}
                      className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all active:scale-95 ${
                        selectedPetitionType === value
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm dark:border-emerald-400 dark:bg-emerald-950/40'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-neutral-700 dark:bg-neutral-800'
                      }`}
                    >
                      <span className="text-xl">{icon}</span>
                      <span className={`mt-1.5 text-xs font-semibold leading-tight ${selectedPetitionType === value ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-800 dark:text-neutral-200'}`}>{label}</span>
                      <span className="mt-1 text-[10px] leading-snug text-zinc-500 dark:text-neutral-500">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* STEP 2 — Categories & location */}
            <section
              ref={(el) => { sectionRefs.current[1] = el; }}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">Step 2</p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">Categories &amp; location</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
                Select all sectors that apply. Multiple categories are encouraged.
              </p>

              <div className="mt-4">
                <p className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">Categories</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CATEGORIES.map(({ id, label }) => (
                    <button key={id} type="button" onClick={() => toggleCategory(id)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                        selectedCategories.includes(id)
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                    Selected: {selectedCategories.map((c) => c.replace('-', ' ')).join(', ')}
                  </p>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="county" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                    County <span className="font-normal text-zinc-500">(optional)</span>
                  </label>
                  <select id="county" value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}
                    className={inputCls}>
                    <option value="">Select a county…</option>
                    {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="tags" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                    Tags <span className="font-normal text-zinc-500">(optional, comma separated)</span>
                  </label>
                  <input id="tags" name="tags" placeholder="e.g. roads, flooding, Sinkor"
                    className={inputCls} />
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="priorActions" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                  Prior actions taken <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-neutral-500">
                  What steps have you already taken to resolve this issue? (Letters sent, meetings attended, etc.)
                </p>
                <textarea id="priorActions" name="priorActions" rows={3}
                  placeholder="e.g. We wrote to the County Superintendent in January 2025 and received no response. We raised it at the community meeting on 12 March."
                  className={`${inputCls} resize-none`} />
              </div>
            </section>

            {/* STEP 3 — Story */}
            <section
              ref={(el) => { sectionRefs.current[2] = el; }}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">Step 3</p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">Why does it matter?</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
                Describe who is affected, what harm is happening, and why people should act now.
              </p>
              <div className="mt-4">
                <label htmlFor="description" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">Petition story</label>
                <textarea id="description" name="description" required rows={8}
                  placeholder="Tell the story in plain language. Mention the place, the people affected, and what support can achieve."
                  className={`${inputCls} resize-none`} />
              </div>
            </section>

            {/* STEP 4 — Campaign media */}
            <section
              ref={(el) => { sectionRefs.current[3] = el; }}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">Step 4</p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">Campaign media</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">Add a photo and set your signature goal.</p>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px]">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="imageUrl" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">Image URL</label>
                    <input id="imageUrl" name="imageUrl" type="url" value={imageUrlValue}
                      onChange={handleImageUrlChange} placeholder="https://example.com/image.jpg"
                      className={inputCls} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-neutral-700" />
                    <span className="text-xs font-medium text-zinc-400 dark:text-neutral-500">OR</span>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-neutral-700" />
                  </div>
                  <div>
                    <label htmlFor="imageFile" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">Upload an image</label>
                    <input ref={fileInputRef} id="imageFile" type="file" accept="image/*"
                      onChange={handleImageFileChange}
                      className="mt-2 block w-full cursor-pointer rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-600 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-700 hover:border-zinc-400 hover:file:bg-zinc-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:file:bg-neutral-700 dark:file:text-neutral-300" />
                    {uploadStatus && (
                      <p className={`mt-1.5 text-xs ${uploadStatus.includes('Selected') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {uploadStatus}
                      </p>
                    )}
                  </div>
                  {imagePreviewSrc && (
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-neutral-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreviewSrc} alt="Preview" className="h-40 w-full object-cover"
                        onError={() => setImagePreviewSrc('')} />
                      <button type="button" onClick={() => { setImagePreviewSrc(''); setImageUrlValue(''); setUploadedImageFile(null); setUploadStatus(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white hover:bg-black/70">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="goal" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">Signature goal</label>
                  <input id="goal" name="goal" type="number" defaultValue={1000} min={100}
                    placeholder="1000" className={inputCls} />
                </div>
              </div>
            </section>

            {/* STEP 5 — Identity & privacy */}
            <section
              ref={(el) => { sectionRefs.current[4] = el; }}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">Step 5</p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">Identity &amp; privacy</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
                Choose how your name appears on the petition page.
              </p>

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded accent-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-50">Remain anonymous</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-neutral-400">
                      Your legal name will not be shown publicly. Your identity is still stored securely on our servers and may be used to verify authenticity with authorities.
                    </p>
                  </div>
                </label>

                {isAnonymous && (
                  <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-neutral-700">
                    <label htmlFor="displayName" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                      Public display name <span className="font-normal text-zinc-500">(optional)</span>
                    </label>
                    <input id="displayName" name="displayName" placeholder="e.g. A Concerned Citizen"
                      className={inputCls} />
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-zinc-400 dark:text-neutral-500">
                🔒 All user data is stored securely. We comply with applicable data protection laws and never share identity data with third parties without a lawful order.
              </p>
            </section>

            {/* Submit */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-2 dark:border-neutral-800">
              <button type="button" onClick={() => history.back()}
                className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                Back
              </button>
              <div className="text-right">
                <p className="mb-2 text-xs text-zinc-500 dark:text-neutral-500">
                  After submission, your petition goes to review before it appears publicly.
                </p>
                <button type="submit" disabled={submitting}
                  className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:shadow-md hover:from-amber-300 hover:to-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500">
                  {submitting ? 'Submitting…' : 'Submit for review'}
                </button>
              </div>
            </div>
          </form>

          {status && (
            <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">{status}</p>
          )}
        </>
      )}

      {/* Auth modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-neutral-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Sign in to submit your petition</h2>
              <button type="button" onClick={() => setShowAuthModal(false)}
                className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-neutral-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex border-b border-zinc-100 dark:border-neutral-800">
              {(['login', 'signup'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => { setAuthTab(tab); setAuthError(''); }}
                  className={`flex-1 py-3 text-sm font-semibold transition ${authTab === tab ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400' : 'text-zinc-500 hover:text-zinc-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}>
                  {tab === 'login' ? 'Log in' : 'Sign up'}
                </button>
              ))}
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-4 p-5">
              {authTab === 'signup' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-neutral-300">Full name</label>
                    <input type="text" required value={authFullName} onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-neutral-300">Phone number</label>
                    <input type="tel" required value={authPhone} onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+231 70 000 0000"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
                  </div>
                </>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-neutral-300">Email</label>
                <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-neutral-300">Password</label>
                <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
              </div>
              {authError && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{authError}</p>
              )}
              <button type="submit" disabled={authSubmitting}
                className="w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:from-amber-300 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60 dark:from-amber-500 dark:to-amber-600">
                {authSubmitting
                  ? (authTab === 'login' ? 'Signing in…' : 'Creating account…')
                  : (authTab === 'login' ? 'Sign in & submit petition' : 'Create account & submit petition')}
              </button>
              <p className="text-center text-xs text-zinc-500 dark:text-neutral-400">
                {authTab === 'login' ? (
                  <>No account yet?{' '}
                    <button type="button" onClick={() => setAuthTab('signup')} className="font-semibold text-amber-600 hover:underline">Sign up</button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button type="button" onClick={() => setAuthTab('login')} className="font-semibold text-amber-600 hover:underline">Log in</button>
                  </>
                )}
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
