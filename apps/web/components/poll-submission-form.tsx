'use client';

import { useState } from 'react';
import { apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

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

export function PollSubmissionForm({ onSuccess }: { onSuccess?: () => void }) {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>(['', '']);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Infrastructure',
    county: '',
    expiresAt: '',
  });

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Poll title is required');
      }

      if (options.filter((o) => o.trim()).length < 2) {
        throw new Error('Poll must have at least 2 options');
      }

      if (!formData.expiresAt) {
        throw new Error('Expiration date is required');
      }

      const expiresDate = new Date(formData.expiresAt);
      if (expiresDate <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }

      if (!token) {
        throw new Error('Authentication required');
      }

      await apiPost(
        '/polls/submit',
        {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          county: formData.county || undefined,
          expiresAt: formData.expiresAt,
          options: options.filter((o) => o.trim()),
        },
        token
      );

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Infrastructure',
        county: '',
        expiresAt: '',
      });
      setOptions(['', '']);

      window.alert('Your poll has been submitted! Our admin team will review it soon and notify you by email.');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit poll');
    } finally {
      setLoading(false);
    }
  };

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
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
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
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-300">
          Category *
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* County */}
      <div>
        <label htmlFor="county" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-300">
          County (optional - leave blank for nationwide)
        </label>
        <select
          id="county"
          name="county"
          value={formData.county}
          onChange={handleInputChange}
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        >
          <option value="">Nationwide</option>
          {COUNTIES.map((county) => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </select>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 dark:text-neutral-300 mb-3">
          Poll Options (minimum 2) *
        </label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddOption}
          className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
        >
          + Add Option
        </button>
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
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          required
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        {loading ? 'Submitting...' : 'Submit Poll Idea for Approval'}
      </button>

      <p className="text-xs text-zinc-600 dark:text-neutral-400">
        📧 You'll be notified by email once our admin team reviews and approves your poll.
      </p>
    </form>
  );
}
