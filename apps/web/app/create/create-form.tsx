'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState, useRef, ChangeEvent } from 'react';
import { apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

type CreatedPetition = { id: string };

export function CreatePetitionForm() {
  const token = useAuthStore((s) => s.token);
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imageUrlValue, setImageUrlValue] = useState('');
  const [imagePreviewSrc, setImagePreviewSrc] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const prefillTitle = searchParams.get('title') ?? '';

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        setUploadStatus('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadStatus('Image file must be smaller than 5MB');
        return;
      }
      
      setUploadedImageFile(file);
      setUploadStatus(`Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewSrc(previewUrl);
      setImageUrlValue('');
    }
  };

  const handleImageUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setImageUrlValue(val);
    if (val) {
      setImagePreviewSrc(val);
      setUploadedImageFile(null);
      setUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setImagePreviewSrc('');
    }
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setStatus('Sign in or create an account before submitting your petition.');
      return;
    }

    setSubmitting(true);
    setStatus('');
    const form = new FormData(e.currentTarget);
    let finalImageUrl = String(form.get('imageUrl')).trim();

    // If user uploaded a file, convert to data URL or upload
    if (uploadedImageFile) {
      try {
        const reader = new FileReader();
        finalImageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedImageFile);
        });
      } catch (err) {
        setStatus('Could not process the image file. Please try again.');
        setSubmitting(false);
        return;
      }
    }

    try {
      await apiPost<CreatedPetition>(
        '/petitions',
        {
          title: String(form.get('title')),
          summary: String(form.get('summary')),
          description: String(form.get('description')),
          category: selectedCategory || undefined,
          imageUrl: finalImageUrl || undefined,
          goal: Number(form.get('goal')),
        },
        token,
      );
      setStatus('Petition submitted for review. Taking you to your dashboard...');
      window.setTimeout(() => router.push('/dashboard'), 700);
    } catch {
      setStatus('We could not submit your petition right now. Please review your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <p className="mt-4 max-w-2xl text-zinc-600">
        First, tell us about your issue. Keep it specific, local, and actionable so supporters
        immediately understand what must change.
      </p>

      {!token ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          You can draft your petition here, but you will need to{' '}
          <Link href="/auth/login" className="font-semibold underline">
            log in
          </Link>{' '}
          or{' '}
          <Link href="/auth/signup" className="font-semibold underline">
            create an account
          </Link>{' '}
          before submitting it for approval.
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-8 space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">
            Step 1
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">What should change?</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
            Use a direct sentence that names the issue and the action you want.
          </p>
          <div className="mt-4">
            <label htmlFor="title" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
              I want to...
            </label>
            <input
              id="title"
              key={prefillTitle}
              name="title"
              required
              defaultValue={prefillTitle}
              placeholder="e.g. Fix drainage on 12th Street in Sinkor before the rainy season"
              className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="summary" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
              One-line summary
            </label>
            <input
              id="summary"
              name="summary"
              required
              placeholder="Explain the issue in one sentence supporters can repeat."
              className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
              Cause / category <span className="font-normal text-zinc-500 dark:text-neutral-400">(optional)</span>
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-neutral-500">
              Pick the one that best describes your petition so supporters can find it.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { id: 'infrastructure', label: '🏗️ Infrastructure' },
                { id: 'education',      label: '📚 Education' },
                { id: 'health',         label: '🏥 Health' },
                { id: 'agriculture',    label: '🌾 Agriculture' },
                { id: 'governance',     label: '⚖️ Governance' },
                { id: 'youth',          label: '🎓 Youth & Jobs' },
                { id: 'environment',    label: '🌿 Environment' },
                { id: 'women',          label: '👩 Women & Gender' },
                { id: 'human-rights',   label: '✊ Human Rights' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === id ? '' : id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                    selectedCategory === id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {selectedCategory && (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                Selected: <span className="font-semibold capitalize">{selectedCategory.replace('-', ' ')}</span>
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">
            Step 2
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">Why does it matter?</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
            Describe who is affected, what harm is happening, and why people should act now.
          </p>
          <div className="mt-4">
            <label htmlFor="description" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
              Petition story
            </label>
            <textarea
              id="description"
              name="description"
              required
              placeholder="Tell the story in plain language. Mention the place, the people affected, and what support can achieve."
              rows={8}
              className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">
            Step 3
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">Campaign details</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
            Add a helpful image and choose an early signature goal for momentum.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px]">
            <div className="space-y-4">
              <div>
                <label htmlFor="imageUrl" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                  Image URL
                </label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={imageUrlValue}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-neutral-700" />
                <span className="text-xs font-medium text-zinc-400 dark:text-neutral-500">OR</span>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-neutral-700" />
              </div>

              <div>
                <label htmlFor="imageFile" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                  Upload an image
                </label>
                <input
                  ref={fileInputRef}
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="mt-2 block w-full cursor-pointer rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-600 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-700 hover:border-zinc-400 hover:file:bg-zinc-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:file:bg-neutral-700 dark:file:text-neutral-300 dark:hover:border-neutral-600"
                />
                {uploadStatus && (
                  <p className={`mt-1.5 text-xs ${uploadStatus.includes('Selected') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {uploadStatus}
                  </p>
                )}
              </div>

              {imagePreviewSrc && (
                <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-neutral-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreviewSrc}
                    alt="Preview"
                    className="h-40 w-full object-cover"
                    onError={() => setImagePreviewSrc('')}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreviewSrc('');
                      setImageUrlValue('');
                      setUploadedImageFile(null);
                      setUploadStatus('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white hover:bg-black/70"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="goal" className="text-sm font-semibold text-zinc-800 dark:text-neutral-200">
                Signature goal
              </label>
              <input
                id="goal"
                name="goal"
                type="number"
                defaultValue={1000}
                min={100}
                placeholder="1000"
                className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-neutral-800 pt-2">
          <button
            type="button"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            onClick={() => history.back()}
          >
            Back
          </button>
          <div className="text-right">
            <p className="mb-2 text-xs text-zinc-500 dark:text-neutral-500">
              After submission, your petition goes to review before it appears publicly.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:shadow-md hover:from-amber-300 hover:to-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500"
            >
              {submitting ? 'Submitting...' : 'Submit for review'}
            </button>
          </div>
        </div>
      </form>
      {status ? <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400 font-medium">{status}</p> : null}
    </>
  );
}
