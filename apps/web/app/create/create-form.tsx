'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState, useRef, ChangeEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiPost, apiPostFormData } from '../../lib/api';
import { useCounties } from '../../lib/use-counties';
import { useAuthStore, type AuthUser } from '../../lib/store';
import { useToast } from '../../lib/toast-context';
import { Card } from '../../components/ui/card';

const DRAFT_KEY = 'change_liberia_petition_draft';

type PetitionDraft = {
  title?: string;
  summary?: string;
  description?: string;
  tags?: string;
  priorActions?: string;
  goal?: string;
  displayName?: string;
  selectedCategories?: string[];
  selectedPetitionType?: string | null;
  selectedCounty?: string;
  isAnonymous?: boolean;
  impactScope?: PetitionPayload['impactScope'];
  selectedDistrict?: string;
  selectedCommunity?: string;
  selectedLandmark?: string;
  selectedCounties?: string[];
  imageUrlValue?: string;
  currentStep?: number;
  savedAt?: number;
};

function loadDraft(): PetitionDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* best-effort */
  }
}

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
  impactScope?: 'COMMUNITY' | 'DISTRICT' | 'COUNTY' | 'MULTI_COUNTY' | 'NATIONAL';
  district?: string;
  community?: string;
  landmark?: string;
  counties?: string[];
};

const PETITION_TYPES = [
  { value: 'government', label: 'Government action', icon: '🏛️', hint: 'Requesting a law, policy, or official response' },
  { value: 'ngo', label: 'NGO partnership', icon: '🤝', hint: 'Seeking support or funding from an NGO' },
  { value: 'social', label: 'Social movement', icon: '✊', hint: "Raising awareness — you'll handle distribution" },
  { value: 'community', label: 'Community campaign', icon: '🏘️', hint: 'Local action at council or neighbourhood level' },
];

const IMPACT_SCOPES = [
  { value: 'COMMUNITY', label: 'Community', icon: '🏘', hint: 'A specific town/neighborhood is directly affected' },
  { value: 'DISTRICT', label: 'District', icon: '🏛', hint: 'An entire district is directly affected' },
  { value: 'COUNTY', label: 'County', icon: '🌍', hint: 'An entire county is directly affected' },
  { value: 'MULTI_COUNTY', label: 'Multi-County', icon: '🗺', hint: 'Several counties are directly affected' },
  { value: 'NATIONAL', label: 'National', icon: '🇱🇷', hint: 'Every Liberian is considered directly affected' },
] as const;

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pendingPayload = useRef<PetitionPayload | null>(null);
  const { counties: countyOptions } = useCounties();
  const COUNTIES = countyOptions.map((c) => c.name);
  const [draft] = useState<PetitionDraft | null>(() => loadDraft());
  const [draftRestored, setDraftRestored] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; summary?: string; description?: string }>({});
  const [currentStep, setCurrentStep] = useState(() => draft?.currentStep ?? 1);
  const [maxStepReached, setMaxStepReached] = useState(() => draft?.currentStep ?? 1);

  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // New fields — initialized from a saved draft when one exists
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => draft?.selectedCategories ?? []);
  const [selectedPetitionType, setSelectedPetitionType] = useState<string | null>(() => draft?.selectedPetitionType ?? null);
  const [selectedCounty, setSelectedCounty] = useState(() => draft?.selectedCounty ?? '');
  const [isAnonymous, setIsAnonymous] = useState(() => draft?.isAnonymous ?? false);

  // Petition Location Verification & Impact Area System (Phase 1)
  const [impactScope, setImpactScope] = useState<PetitionPayload['impactScope']>(() => draft?.impactScope ?? 'COUNTY');
  const [selectedDistrict, setSelectedDistrict] = useState(() => draft?.selectedDistrict ?? '');
  const [selectedCommunity, setSelectedCommunity] = useState(() => draft?.selectedCommunity ?? '');
  const [selectedLandmark, setSelectedLandmark] = useState(() => draft?.selectedLandmark ?? '');
  const [selectedCounties, setSelectedCounties] = useState<string[]>(() => draft?.selectedCounties ?? []);

  // Image
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imageUrlValue, setImageUrlValue] = useState(() => draft?.imageUrlValue ?? '');
  const [imagePreviewSrc, setImagePreviewSrc] = useState(() => draft?.imageUrlValue ?? '');

  // Additional gallery images (beyond the single cover image above) and
  // external video links — uploaded/attached right after the petition is
  // created, via POST /petitions/:id/media[/link].
  const [additionalImages, setAdditionalImages] = useState<{ file: File; preview: string }[]>([]);
  const additionalImageInputRef = useRef<HTMLInputElement>(null);
  const [videoUrlDraft, setVideoUrlDraft] = useState('');
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [mediaError, setMediaError] = useState('');

  const MAX_ADDITIONAL_IMAGES = 4;
  const MAX_VIDEO_LINKS = 3;

  const prefillTitle = searchParams.get('title') ?? '';

  // Restore the uncontrolled text fields (title/summary/description/tags/
  // priorActions/goal/displayName) from a saved draft on mount — these use
  // defaultValue rather than React state, so restoring them means setting
  // the DOM value directly once the form has mounted.
  useEffect(() => {
    if (!draft || !formRef.current) return;
    const form = formRef.current;
    const setVal = (name: string, val?: string) => {
      if (!val) return;
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) el.value = val;
    };
    // An explicit ?title= prefill link takes priority over an older draft.
    setVal('title', prefillTitle ? undefined : draft.title);
    setVal('summary', draft.summary);
    setVal('description', draft.description);
    setVal('tags', draft.tags);
    setVal('priorActions', draft.priorActions);
    setVal('goal', draft.goal);
    setVal('displayName', draft.displayName);
    if (draft.title || draft.summary || draft.description) setDraftRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave the draft (debounced) whenever any field changes.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    let timeout: ReturnType<typeof setTimeout>;
    const saveDraft = () => {
      const fd = new FormData(form);
      const nextDraft: PetitionDraft = {
        title: String(fd.get('title') ?? ''),
        summary: String(fd.get('summary') ?? ''),
        description: String(fd.get('description') ?? ''),
        tags: String(fd.get('tags') ?? ''),
        priorActions: String(fd.get('priorActions') ?? ''),
        goal: String(fd.get('goal') ?? ''),
        displayName: String(fd.get('displayName') ?? ''),
        selectedCategories,
        selectedPetitionType,
        selectedCounty,
        isAnonymous,
        impactScope,
        selectedDistrict,
        selectedCommunity,
        selectedLandmark,
        selectedCounties,
        imageUrlValue,
        currentStep,
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
      } catch {
        /* best-effort */
      }
    };
    const onInput = () => {
      clearTimeout(timeout);
      timeout = setTimeout(saveDraft, 500);
    };
    form.addEventListener('input', onInput);
    // Also save immediately when a button-driven (non-text-input) field changes.
    saveDraft();
    return () => {
      form.removeEventListener('input', onInput);
      clearTimeout(timeout);
    };
  }, [
    selectedCategories,
    selectedPetitionType,
    selectedCounty,
    isAnonymous,
    impactScope,
    selectedDistrict,
    selectedCommunity,
    selectedLandmark,
    selectedCounties,
    imageUrlValue,
    currentStep,
  ]);

  // Block render only until hydrated — guests can draft a petition here too
  // (autosaved locally); they're only asked to log in at submit time, via
  // the auth modal in submit() below, which resumes the same submission
  // with whatever they've already typed instead of losing it to a redirect.
  if (!hydrated) return null;

  function dismissDraftBanner() {
    setDraftRestored(false);
  }

  function discardDraft() {
    clearDraft();
    window.location.reload();
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleCounty = (county: string) => {
    setSelectedCounties((prev) =>
      prev.includes(county) ? prev.filter((c) => c !== county) : [...prev, county],
    );
  };

  function getFieldValue(name: string): string {
    const form = formRef.current;
    if (!form) return '';
    const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
    return el?.value.trim() ?? '';
  }

  // Validates just the current step's required fields, gating advancement —
  // the wizard only lets you move forward once the visible step is valid.
  function validateStep(n: number): boolean {
    if (n === 1) {
      const titleVal = getFieldValue('title');
      const summaryVal = getFieldValue('summary');
      const next: typeof fieldErrors = {
        title: titleVal ? undefined : 'Tell us what needs to change.',
        summary: summaryVal ? undefined : 'Add a one-sentence summary.',
      };
      setFieldErrors((prev) => ({ ...prev, ...next }));
      return !next.title && !next.summary;
    }
    if (n === 3) {
      const descriptionVal = getFieldValue('description');
      const next: typeof fieldErrors = {
        description: descriptionVal ? undefined : 'Share the full story — this helps reviewers and supporters.',
      };
      setFieldErrors((prev) => ({ ...prev, ...next }));
      return !next.description;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(currentStep)) return;
    const next = Math.min(currentStep + 1, STEPS.length);
    setCurrentStep(next);
    setMaxStepReached((m) => Math.max(m, next));
  }

  function goBack() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  function goToStep(n: number) {
    if (n > maxStepReached) return;
    setCurrentStep(n);
  }

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

  const handleAdditionalImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setMediaError('');

    const room = MAX_ADDITIONAL_IMAGES - additionalImages.length;
    if (room <= 0) {
      setMediaError(`You can add up to ${MAX_ADDITIONAL_IMAGES} extra images.`);
      if (additionalImageInputRef.current) additionalImageInputRef.current.value = '';
      return;
    }

    const accepted: { file: File; preview: string }[] = [];
    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 8 * 1024 * 1024) {
        setMediaError('Each image must be smaller than 8MB.');
        continue;
      }
      accepted.push({ file, preview: URL.createObjectURL(file) });
    }
    if (accepted.length) setAdditionalImages((prev) => [...prev, ...accepted]);
    if (additionalImageInputRef.current) additionalImageInputRef.current.value = '';
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addVideoUrl = () => {
    const val = videoUrlDraft.trim();
    if (!val) return;
    if (!/^https?:\/\//i.test(val)) {
      setMediaError('Video links must start with http:// or https://');
      return;
    }
    if (videoUrls.length >= MAX_VIDEO_LINKS) {
      setMediaError(`You can add up to ${MAX_VIDEO_LINKS} video links.`);
      return;
    }
    if (videoUrls.includes(val)) { setVideoUrlDraft(''); return; }
    setMediaError('');
    setVideoUrls((prev) => [...prev, val]);
    setVideoUrlDraft('');
  };

  const removeVideoUrl = (index: number) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  async function attachAdditionalMedia(petitionId: string) {
    let failures = 0;

    for (const { file } of additionalImages) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        await apiPostFormData(`/petitions/${petitionId}/media`, fd);
      } catch {
        failures += 1;
      }
    }

    for (const url of videoUrls) {
      try {
        await apiPost(`/petitions/${petitionId}/media/link`, { url, type: 'VIDEO' });
      } catch {
        failures += 1;
      }
    }

    if (failures > 0) {
      toast.show(
        `Petition submitted, but ${failures} extra media item${failures > 1 ? 's' : ''} failed to attach. You can leave those out — the petition itself was created fine.`,
        'error',
      );
    }
  }

  async function doSubmitPetition(payload: PetitionPayload) {
    setSubmitting(true);
    setStatus('');
    try {
      const created = await apiPost<CreatedPetition>('/petitions', payload);
      if (additionalImages.length || videoUrls.length) {
        setStatus('Attaching photos and videos…');
        await attachAdditionalMedia(created.id);
      }
      clearDraft();
      toast.show('Petition submitted for review.', 'success');
      setStatus('Petition submitted for review. Taking you to your dashboard…');
      window.setTimeout(() => router.push('/dashboard'), 700);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      toast.show(msg || 'We could not submit your petition right now. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const titleVal = String(form.get('title') ?? '').trim();
    const summaryVal = String(form.get('summary') ?? '').trim();
    const descriptionVal = String(form.get('description') ?? '').trim();
    const errors: typeof fieldErrors = {};
    if (!titleVal) errors.title = 'Tell us what needs to change.';
    if (!summaryVal) errors.summary = 'Add a one-sentence summary.';
    if (!descriptionVal) errors.description = 'Share the full story — this helps reviewers and supporters.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const invalidStep = errors.title || errors.summary ? 1 : 3;
      setCurrentStep(invalidStep);
      setMaxStepReached((m) => Math.max(m, invalidStep));
      return;
    }

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
        toast.show('Could not process the image file. Please try again.', 'error');
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
      county: impactScope === 'MULTI_COUNTY' ? undefined : selectedCounty || undefined,
      imageUrl: finalImageUrl || undefined,
      goal: Number(form.get('goal') ?? 1000),
      impactScope,
      district: (impactScope === 'DISTRICT' || impactScope === 'COMMUNITY') ? selectedDistrict || undefined : undefined,
      community: impactScope === 'COMMUNITY' ? selectedCommunity || undefined : undefined,
      landmark: impactScope === 'COMMUNITY' ? selectedLandmark || undefined : undefined,
      counties: impactScope === 'MULTI_COUNTY' ? selectedCounties : undefined,
    };

    if (!isAuthenticated) {
      pendingPayload.current = payload;
      setShowAuthModal(true);
      return;
    }
    await doSubmitPetition(payload);
  }

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      if (authTab === 'login') {
        const data = await apiPost<{ user: AuthUser }>('/auth/login/email', {
          email: authEmail,
          password: authPassword,
        });
        setSession(data.user);
        setShowAuthModal(false);
        if (pendingPayload.current) {
          await doSubmitPetition(pendingPayload.current);
          pendingPayload.current = null;
        }
      } else {
        // Signup requires email verification before a session exists —
        // there's no token to log the user in with immediately. Save the
        // draft (already persisted via the form's own autosave) and send
        // them to verify, rather than pretending this can submit now.
        await apiPost('/auth/signup/email', {
          fullName: authFullName,
          phone: authPhone,
          email: authEmail,
          password: authPassword,
        });
        setShowAuthModal(false);
        toast.show(
          'Account created — check your email to verify it, then come back and sign in to submit your petition.',
          'success',
        );
        router.push(`/auth/verify-email?email=${encodeURIComponent(authEmail)}`);
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

      {draftRestored && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <span>We restored your unsaved draft from earlier.</span>
          <div className="flex gap-3">
            <button type="button" onClick={discardDraft} className="font-semibold underline hover:no-underline">
              Clear draft &amp; start fresh
            </button>
            <button type="button" onClick={dismissDraftBanner} className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <>
          {/* Step progress indicator */}
          <div className="mt-8">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-neutral-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-neutral-400">
              Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1]?.label}
            </p>
          </div>
          <nav className="mt-3 mb-6 hidden sm:flex items-center gap-1 overflow-x-auto" aria-label="Form sections">
            {STEPS.map((s, i) => {
              const isCurrent = s.n === currentStep;
              const isLocked = s.n > maxStepReached;
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => goToStep(s.n)}
                  disabled={isLocked}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : isLocked
                        ? 'cursor-not-allowed border-zinc-200 bg-white text-zinc-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-600'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${
                      isLocked ? 'bg-zinc-300 dark:bg-neutral-700' : 'bg-emerald-600 dark:bg-emerald-500'
                    }`}
                  >
                    {s.n}
                  </span>
                  {s.label}
                  {i < STEPS.length - 1 && <span className="ml-1 text-zinc-300 dark:text-neutral-600">›</span>}
                </button>
              );
            })}
          </nav>

          <form
            ref={formRef}
            onSubmit={submit}
            noValidate
            className="space-y-6"
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
              if (currentStep !== STEPS.length) {
                e.preventDefault();
                goNext();
              }
            }}
          >
            {/* STEP 1 — Issue details */}
            <Card
              rounded="2xl"
              className={currentStep === 1 ? 'bg-zinc-50 p-5' : 'hidden bg-zinc-50 p-5'}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">Step 1</p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">Issue details</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
                Describe what needs to change. Be specific, local, and actionable.
              </p>

              <div className="mt-4">
                <label htmlFor="title" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">I want to…</label>
                <input id="title" name="title" required key={prefillTitle} defaultValue={prefillTitle}
                  onChange={() => fieldErrors.title && setFieldErrors((prev) => ({ ...prev, title: undefined }))}
                  aria-invalid={!!fieldErrors.title} aria-describedby={fieldErrors.title ? 'title-error' : undefined}
                  placeholder="e.g. Fix drainage on 12th Street in Sinkor before the rainy season"
                  className={inputCls} />
                {fieldErrors.title && <p id="title-error" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{fieldErrors.title}</p>}
              </div>
              <div className="mt-4">
                <label htmlFor="summary" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">One-line summary</label>
                <input id="summary" name="summary" required placeholder="Explain the issue in one sentence."
                  onChange={() => fieldErrors.summary && setFieldErrors((prev) => ({ ...prev, summary: undefined }))}
                  aria-invalid={!!fieldErrors.summary} aria-describedby={fieldErrors.summary ? 'summary-error' : undefined}
                  className={inputCls} />
                {fieldErrors.summary && <p id="summary-error" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{fieldErrors.summary}</p>}
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
            </Card>

            {/* STEP 2 — Categories & location */}
            <Card
              rounded="2xl"
              className={currentStep === 2 ? 'bg-zinc-50 p-5' : 'hidden bg-zinc-50 p-5'}
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

              <div className="mt-5">
                <p className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">Who does this issue affect?</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-neutral-500">
                  This defines the geographic area directly affected and helps us classify supporters accurately.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {IMPACT_SCOPES.map(({ value, label, icon, hint }) => (
                    <button key={value} type="button"
                      onClick={() => setImpactScope(value)}
                      className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all active:scale-95 ${
                        impactScope === value
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm dark:border-emerald-400 dark:bg-emerald-950/40'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-neutral-700 dark:bg-neutral-800'
                      }`}
                    >
                      <span className="text-xl">{icon}</span>
                      <span className={`mt-1.5 text-xs font-semibold leading-tight ${impactScope === value ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-800 dark:text-neutral-200'}`}>{label}</span>
                      <span className="mt-1 text-[10px] leading-snug text-zinc-500 dark:text-neutral-500">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {impactScope === 'MULTI_COUNTY' ? (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">Counties affected</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {COUNTIES.map((c) => (
                        <button key={c} type="button" onClick={() => toggleCounty(c)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                            selectedCounties.includes(c)
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : impactScope !== 'NATIONAL' ? (
                  <div>
                    <label htmlFor="county" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                      County
                    </label>
                    <select id="county" value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}
                      className={inputCls}>
                      <option value="">Select a county…</option>
                      {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ) : null}
                <div>
                  <label htmlFor="tags" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                    Tags <span className="font-normal text-zinc-500">(optional, comma separated)</span>
                  </label>
                  <input id="tags" name="tags" placeholder="e.g. roads, flooding, Sinkor"
                    className={inputCls} />
                </div>
                {(impactScope === 'DISTRICT' || impactScope === 'COMMUNITY') && (
                  <div>
                    <label htmlFor="district" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">District</label>
                    <input id="district" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}
                      placeholder="e.g. District 10" className={inputCls} />
                  </div>
                )}
                {impactScope === 'COMMUNITY' && (
                  <>
                    <div>
                      <label htmlFor="community" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">Community / Town</label>
                      <input id="community" value={selectedCommunity} onChange={(e) => setSelectedCommunity(e.target.value)}
                        placeholder="e.g. Sinkor" className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="landmark" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                        Landmark / Street <span className="font-normal text-zinc-500">(optional)</span>
                      </label>
                      <input id="landmark" value={selectedLandmark} onChange={(e) => setSelectedLandmark(e.target.value)}
                        placeholder="e.g. 12th Street" className={inputCls} />
                    </div>
                  </>
                )}
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
            </Card>

            {/* STEP 3 — Story */}
            <Card
              rounded="2xl"
              className={currentStep === 3 ? 'bg-zinc-50 p-5' : 'hidden bg-zinc-50 p-5'}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">Step 3</p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">Why does it matter?</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
                Describe who is affected, what harm is happening, and why people should act now.
              </p>
              <div className="mt-4">
                <label htmlFor="description" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">Petition story</label>
                <textarea id="description" name="description" required rows={8}
                  onChange={() => fieldErrors.description && setFieldErrors((prev) => ({ ...prev, description: undefined }))}
                  aria-invalid={!!fieldErrors.description} aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                  placeholder="Tell the story in plain language. Mention the place, the people affected, and what support can achieve."
                  className={`${inputCls} resize-none`} />
                {fieldErrors.description && <p id="description-error" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{fieldErrors.description}</p>}
              </div>
            </Card>

            {/* STEP 4 — Campaign media */}
            <Card
              rounded="2xl"
              className={currentStep === 4 ? 'bg-zinc-50 p-5' : 'hidden bg-zinc-50 p-5'}
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
                      <img src={imagePreviewSrc} alt="Cover photo preview" className="h-40 w-full object-cover"
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

              {/* Additional gallery images */}
              <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-neutral-700">
                <label htmlFor="additionalImages" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                  More photos <span className="font-normal text-zinc-400 dark:text-neutral-500">(optional, up to {MAX_ADDITIONAL_IMAGES})</span>
                </label>
                <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-400">Shown as a gallery on your petition page, alongside the cover photo above.</p>
                <input ref={additionalImageInputRef} id="additionalImages" type="file" accept="image/*" multiple
                  disabled={additionalImages.length >= MAX_ADDITIONAL_IMAGES}
                  onChange={handleAdditionalImagesChange}
                  className="mt-2 block w-full cursor-pointer rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-600 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-700 hover:border-zinc-400 hover:file:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:file:bg-neutral-700 dark:file:text-neutral-300" />
                {additionalImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {additionalImages.map((img, i) => (
                      <div key={i} className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-neutral-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.preview} alt={`Additional photo ${i + 1} preview`} className="h-20 w-full object-cover" />
                        <button type="button" onClick={() => removeAdditionalImage(i)}
                          className="absolute right-1 top-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white hover:bg-black/70">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video links */}
              <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-neutral-700">
                <label htmlFor="videoUrlDraft" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                  Video links <span className="font-normal text-zinc-400 dark:text-neutral-500">(optional, up to {MAX_VIDEO_LINKS})</span>
                </label>
                <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-400">A YouTube or Vimeo link, or a direct link to a video file.</p>
                <div className="mt-2 flex gap-2">
                  <input id="videoUrlDraft" type="url" value={videoUrlDraft}
                    onChange={(e) => setVideoUrlDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVideoUrl(); } }}
                    placeholder="https://youtube.com/watch?v=…"
                    disabled={videoUrls.length >= MAX_VIDEO_LINKS}
                    className={`${inputCls} mt-0 disabled:cursor-not-allowed disabled:opacity-50`} />
                  <button type="button" onClick={addVideoUrl}
                    disabled={videoUrls.length >= MAX_VIDEO_LINKS || !videoUrlDraft.trim()}
                    className="shrink-0 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900">
                    Add
                  </button>
                </div>
                {videoUrls.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {videoUrls.map((url, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        <span className="truncate">{url}</span>
                        <button type="button" onClick={() => removeVideoUrl(i)}
                          className="shrink-0 font-semibold text-red-500 hover:text-red-600">
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {mediaError && <p className="mt-2 text-xs text-red-500">{mediaError}</p>}
              </div>
            </Card>

            {/* STEP 5 — Identity & privacy */}
            <Card
              rounded="2xl"
              className={currentStep === 5 ? 'bg-zinc-50 p-5' : 'hidden bg-zinc-50 p-5'}
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
            </Card>

            {/* Step navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-2 dark:border-neutral-800">
              <button
                type="button"
                onClick={currentStep === 1 ? () => history.back() : goBack}
                className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </button>
              {currentStep === STEPS.length ? (
                <div className="text-right">
                  <p className="mb-2 text-xs text-zinc-500 dark:text-neutral-500">
                    After submission, your petition goes to review before it appears publicly.
                  </p>
                  <button type="submit" disabled={submitting}
                    className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:shadow-md hover:from-amber-300 hover:to-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500">
                    {submitting ? 'Submitting…' : 'Submit for review'}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={goNext}
                  className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400">
                  Next — {STEPS[currentStep]?.label}
                </button>
              )}
            </div>
          </form>

          {status && (
            <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">{status}</p>
          )}
        </>

      {/* Auth modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-neutral-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Sign in to submit your petition</h2>
              <button type="button" onClick={() => setShowAuthModal(false)}
                className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-neutral-800">
                <X className="h-5 w-5" />
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
