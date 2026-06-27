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
  'Montserrado',
  'Grand Cape Mount',
  'Bomi',
  'Gbarpolu',
  'Lofa',
  'Bong',
  'Nimba',
  'Margibi',
  'Grand Bassa',
  'River Gee',
  'Grand Kru',
  'Sinoe',
  'Maryland',
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

export function PollSubmissionForm({ onSuccess }: { onSuccess?: () => void }) {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [options, setOptions] = useState<PollOption[]>([{ text: '' }, { text: '' }]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Infrastructure',
    county: '',
    expiresAt: '',
  });

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, { text: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const handleTextChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text: value } : o)));
  };

  const handleImageChange = (index: number, base64: string | undefined) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, imageUrl: base64 } : o)));
  };

  const handleSuggestion = (suggestion: string) => {
    if (options.length >= 6) return;
    if (options.some((o) => o.text.trim().toLowerCase() === suggestion.toLowerCase())) return;
    setOptions([...options, { text: suggestion }]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      if (!formData.title.trim()) throw new Error('Poll title is required');

      const validOptions = options.filter((o) => o.text.trim());
      if (validOptions.length < 2) throw new Error('Poll must have at least 2 options');

      if (!formData.expiresAt) throw new Error('Expiration date is required');
      if (new Date(formData.expiresAt) <= new Date()) throw new Error('Expiration date must be in the future');
      if (!token) throw new Error('Authentication required');

      await apiPost(
        '/polls/submit',
        {
          title: formData.title.trim(),
          description: formData.description || undefined,
          category: formData.category,
          county: formData.county || undefined,
          expiresAt: formData.expiresAt,
          options: validOptions.map((o) => ({ text: o.text.trim(), imageUrl: o.imageUrl })),
        },
        token,
      );

      setFormData({ title: '', description: '', category: 'Infrastructure', county: '', expiresAt: '' });
      setOptions([{ text: '' }, { text: '' }]);
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit poll');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = SUGGESTIONS[formData.category] ?? SUGGESTIONS.default;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-300">
          Poll Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="What should Liberia prioritize?"
          className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-emerald-800"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Provide context or background for your poll question..."
          rows={3}
          className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-emerald-800"
        />
      </div>

      {/* Category + County */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-300">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="county" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-300">
            County <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <select
            id="county"
            name="county"
            value={formData.county}
            onChange={handleInputChange}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            <option value="">Nationwide</option>
            {COUNTIES.map((county) => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Poll Options */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-neutral-300">
            Poll Options <span className="text-zinc-400 font-normal">(minimum 2)</span> *
          </label>
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

      {/* Expiration */}
      <div>
        <label htmlFor="expiresAt" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-300">
          Poll Expires At *
        </label>
        <input
          type="datetime-local"
          id="expiresAt"
          name="expiresAt"
          value={formData.expiresAt}
          onChange={handleInputChange}
          className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          required
        />
      </div>

      {/* Success */}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Your poll has been submitted! Our admin team will review it soon and notify you by email.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        {loading ? 'Submitting…' : 'Submit Poll Idea for Approval'}
      </button>

      <p className="text-xs text-zinc-500 dark:text-neutral-400">
        📧 You'll be notified by email once our admin team reviews and approves your poll.
      </p>
    </form>
  );
}
