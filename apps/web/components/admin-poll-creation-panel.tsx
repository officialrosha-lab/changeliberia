'use client';

import { useState } from 'react';
import { apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { PollOptionInput } from './poll-option-input';

const CATEGORIES = [
  'Infrastructure',
  'Education',
  'Health',
  'Agriculture',
  'Governance',
  'Youth & Jobs',
  'Environment',
  'Women & Gender',
  'Human Rights',
];

const COUNTIES = [
  'Montserrado', 'Grand Cape Mount', 'Bomi', 'Gbarpolu', 'Lofa',
  'Bong', 'Nimba', 'Margibi', 'Grand Bassa', 'River Gee',
  'Grand Kru', 'Sinoe', 'Maryland',
];

const SUGGESTIONS: Record<string, string[]> = {
  default:           ['Yes', 'No', 'Not sure', 'Need more information'],
  Infrastructure:    ['Repair roads first', 'Fix water supply', 'Expand electricity', 'Fix drainage'],
  Education:         ['Build more schools', 'Train more teachers', 'Provide scholarships', 'Expand internet access'],
  Health:            ['More hospitals', 'Free healthcare', 'Train more nurses', 'Better medicine supply'],
  Governance:        ['Hold officials accountable', 'Increase transparency', 'Reduce corruption', 'Strengthen rule of law'],
  Agriculture:       ['Subsidise seeds', 'Build rural roads', 'Expand irrigation', 'Train farmers'],
  'Youth & Jobs':    ['Create apprenticeships', 'Fund startups', 'Expand TVET', 'Public works programme'],
  Environment:       ['Plant more trees', 'Ban single-use plastic', 'Clean up rivers', 'Enforce logging laws'],
  'Women & Gender':  ['Equal pay enforcement', 'End child marriage', 'More women in government', 'Safe spaces'],
  'Human Rights':    ['Strengthen judiciary', 'Free press protection', 'Police accountability', 'Prison reform'],
};

type PollOption = { text: string; imageUrl?: string };

export function AdminPollCreationPanel() {
  const token = useAuthStore((state) => state.token);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [county, setCounty] = useState('');
  const [expiresAt, setExpiresAt] = useState(
    () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 16),
  );
  const [options, setOptions] = useState<PollOption[]>([{ text: '' }, { text: '' }]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTextChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text: value } : o)));
  };

  const handleImageChange = (index: number, base64: string | undefined) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, imageUrl: base64 } : o)));
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddOption = () => {
    if (options.length < 6) setOptions((prev) => [...prev, { text: '' }]);
  };

  const handleSuggestion = (suggestion: string) => {
    if (options.length >= 6) return;
    if (options.some((o) => o.text.trim().toLowerCase() === suggestion.toLowerCase())) return;
    setOptions((prev) => [...prev, { text: suggestion }]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validOptions = options.filter((o) => o.text.trim());
    if (!title.trim() || validOptions.length < 2) {
      setFeedback({ type: 'error', message: 'Please provide a title and at least two options.' });
      return;
    }
    if (!token) {
      setFeedback({ type: 'error', message: 'Admin authentication is required.' });
      return;
    }

    setSubmitting(true);
    try {
      await apiPost(
        '/polls',
        {
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          county: county.trim() || undefined,
          expiresAt: new Date(expiresAt).toISOString(),
          options: validOptions.map((o) => ({ text: o.text.trim(), imageUrl: o.imageUrl })),
        },
        token,
      );
      setFeedback({ type: 'success', message: 'Poll created and published successfully.' });
      setTitle('');
      setDescription('');
      setCategory('Infrastructure');
      setCounty('');
      setOptions([{ text: '' }, { text: '' }]);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to create poll.' });
    } finally {
      setSubmitting(false);
    }
  };

  const suggestions = SUGGESTIONS[category] ?? SUGGESTIONS.default;

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Create a Civic Pulse poll</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
          Publish a new public poll to collect community sentiment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-200">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What should Liberia prioritize next?"
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-200">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context for why this poll matters to Liberians."
            rows={3}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </div>

        {/* Category + County */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-200">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-200">County (optional)</label>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
            >
              <option value="">Nationwide</option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expiry */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-200">Expires at</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </div>

        {/* Options */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">
              Options <span className="font-normal text-zinc-400">(min 2, max 6)</span>
            </h3>
            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                + Add option
              </button>
            )}
          </div>

          <div className="space-y-2">
            {options.map((option, index) => (
              <PollOptionInput
                key={index}
                index={index}
                text={option.text}
                imageUrl={option.imageUrl}
                onTextChange={handleTextChange}
                onImageChange={handleImageChange}
                onRemove={handleRemoveOption}
                canRemove={options.length > 2}
              />
            ))}
          </div>

          {/* Suggestion chips */}
          <div className="mt-3">
            <p className="text-xs text-zinc-500 dark:text-neutral-400 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const alreadyUsed = options.some((o) => o.text.trim().toLowerCase() === s.toLowerCase());
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={alreadyUsed || options.length >= 6}
                    onClick={() => handleSuggestion(s)}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`rounded-2xl border p-4 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Creating poll…' : 'Create poll'}
        </button>
      </form>
    </section>
  );
}
