'use client';

import { useState } from 'react';
import { apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

const defaultOptionCount = 2;

export function AdminPollCreationPanel() {
  const token = useAuthStore((state) => state.token);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Civic');
  const [county, setCounty] = useState('');
  const [expiresAt, setExpiresAt] = useState(() => new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 16));
  const [options, setOptions] = useState<string[]>(Array(defaultOptionCount).fill(''));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateOption = (index: number, value: string) => {
    setOptions((current) => current.map((option, idx) => (idx === index ? value : option)));
  };

  const addOption = () => {
    setOptions((current) => [...current, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= defaultOptionCount) return;
    setOptions((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const cleanedOptions = options.map((option) => option.trim()).filter(Boolean);
    if (!title.trim() || cleanedOptions.length < 2) {
      setFeedback('Please provide a title and at least two options.');
      return;
    }

    if (!token) {
      setFeedback('Admin authentication is required.');
      return;
    }

    setSubmitting(true);

    try {
      await apiPost('/polls', {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        county: county.trim() || null,
        expiresAt: new Date(expiresAt).toISOString(),
        options: cleanedOptions,
      }, token);
      setFeedback('Poll created successfully.');
      setTitle('');
      setDescription('');
      setCounty('');
      setOptions(Array(defaultOptionCount).fill(''));
    } catch (error) {
      if (error instanceof Error) {
        setFeedback(error.message);
      } else {
        setFeedback('Failed to create poll.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Create a Civic Pulse poll</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
            Publish a new public poll to collect community sentiment and keep the petition ecosystem connected.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-200">Title</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What should Liberia prioritize next?"
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-200">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add context for why this poll matters to Liberians."
            rows={3}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-200">
            Category
            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-200">
            County (optional)
            <input
              type="text"
              value={county}
              onChange={(event) => setCounty(event.target.value)}
              placeholder="Montserrado"
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-200">
            Expires at
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Options</h3>
            <button
              type="button"
              onClick={addOption}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Add option
            </button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= defaultOptionCount}
                  className="text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:text-red-300 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {feedback ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
            {feedback}
          </div>
        ) : null}

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
