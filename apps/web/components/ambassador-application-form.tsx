'use client';

import { useState, FormEvent } from 'react';
import { apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

const LIBERIAN_COUNTIES = [
  'Bomi',
  'Bong',
  'Gbarpolu',
  'Grand Bassa',
  'Grand Cape Mount',
  'Gredo',
  'Lofa',
  'Margibi',
  'Maryland',
  'Montserrado',
  'Nimba',
  'River Cess',
  'River Gee',
  'Sinoe',
  'Not specified',
];

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  motivation?: string;
  growthPlan?: string;
}

export function AmbassadorApplicationForm() {
  const { token } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    occupation: '',
    motivation: '',
    growthPlan: '',
    socialLinks: '',
  });

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'fullName':
        if (!value?.trim()) return 'Full name is required';
        if (value.length < 2) return 'Full name must be at least 2 characters';
        if (value.length > 100) return 'Full name cannot exceed 100 characters';
        return undefined;
      case 'email':
        if (!value?.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
        return undefined;
      case 'phone':
        if (!value?.trim()) return 'Phone number is required';
        if (value.length < 10) return 'Phone number must be at least 10 characters';
        if (value.length > 20) return 'Phone number cannot exceed 20 characters';
        return undefined;
      case 'location':
        if (!value) return 'County/location is required';
        return undefined;
      case 'motivation':
        if (!value?.trim()) return 'Tell us your motivation';
        if (value.length < 20) return 'Motivation must be at least 20 characters';
        if (value.length > 1000) return 'Motivation cannot exceed 1000 characters';
        return undefined;
      case 'growthPlan':
        if (!value?.trim()) return 'Tell us your growth plan';
        if (value.length < 20) return 'Growth plan must be at least 20 characters';
        if (value.length > 1000) return 'Growth plan cannot exceed 1000 characters';
        return undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    newErrors.fullName = validateField('fullName', formData.fullName);
    newErrors.email = validateField('email', formData.email);
    newErrors.phone = validateField('phone', formData.phone);
    newErrors.location = validateField('location', formData.location);
    newErrors.motivation = validateField('motivation', formData.motivation);
    newErrors.growthPlan = validateField('growthPlan', formData.growthPlan);

    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e !== undefined);
  };

  const handleChange = (e: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.currentTarget;
    const { name, value } = target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setGeneralError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await apiPost('/ambassadors/apply', formData);
      setSubmitted(true);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        location: '',
        occupation: '',
        motivation: '',
        growthPlan: '',
        socialLinks: '',
      });

      // Auto-reset after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (error: any) {
      const message = error?.message || 'Failed to submit application. Please try again.';
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="text-center">
          <p className="text-3xl">✅</p>
          <h3 className="mt-3 text-lg font-semibold text-emerald-700 dark:text-emerald-300">
            Application Received!
          </h3>
          <p className="mt-2 text-sm text-emerald-700/80 dark:text-emerald-300/80">
            Thank you for applying. We'll review your application and get back to you within 7-10 business days.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-emerald-600 px-6 py-2 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-300">{generalError}</p>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-zinc-900 dark:text-white">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          id="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Your full name"
          className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors ${
            errors.fullName
              ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-red-900/40 dark:bg-red-950/20'
              : 'border-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700'
          }`}
        />
        {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-900 dark:text-white">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors ${
            errors.email
              ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-red-900/40 dark:bg-red-950/20'
              : 'border-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700'
          }`}
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-900 dark:text-white">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+231 ..."
          className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors ${
            errors.phone
              ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-red-900/40 dark:bg-red-950/20'
              : 'border-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700'
          }`}
        />
        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
      </div>

      {/* County */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-zinc-900 dark:text-white">
          County/Location <span className="text-red-500">*</span>
        </label>
        <select
          name="location"
          id="location"
          value={formData.location}
          onChange={handleChange}
          className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors ${
            errors.location
              ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-red-900/40 dark:bg-red-950/20'
              : 'border-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700'
          }`}
        >
          <option value="">Select your county</option>
          {LIBERIAN_COUNTIES.map((county) => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </select>
        {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
      </div>

      {/* Occupation */}
      <div>
        <label htmlFor="occupation" className="block text-sm font-medium text-zinc-900 dark:text-white">
          Occupation (Optional)
        </label>
        <input
          type="text"
          name="occupation"
          id="occupation"
          value={formData.occupation}
          onChange={handleChange}
          placeholder="e.g., Teacher, Farmer, Trader"
          className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700"
        />
      </div>

      {/* Motivation */}
      <div>
        <label htmlFor="motivation" className="block text-sm font-medium text-zinc-900 dark:text-white">
          Why do you want to be a Voice for Change? <span className="text-red-500">*</span>
        </label>
        <textarea
          name="motivation"
          id="motivation"
          value={formData.motivation}
          onChange={handleChange}
          placeholder="Tell us what drives you..."
          rows={4}
          className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors ${
            errors.motivation
              ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-red-900/40 dark:bg-red-950/20'
              : 'border-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700'
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.motivation && <p className="text-xs text-red-500">{errors.motivation}</p>}
          <p className="text-xs text-zinc-500 dark:text-neutral-400">{formData.motivation.length} / 1000</p>
        </div>
      </div>

      {/* Growth Plan */}
      <div>
        <label htmlFor="growthPlan" className="block text-sm font-medium text-zinc-900 dark:text-white">
          How do you plan to grow as a Voice for Change? <span className="text-red-500">*</span>
        </label>
        <textarea
          name="growthPlan"
          id="growthPlan"
          value={formData.growthPlan}
          onChange={handleChange}
          placeholder="What's your vision for impact..."
          rows={4}
          className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors ${
            errors.growthPlan
              ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-red-900/40 dark:bg-red-950/20'
              : 'border-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700'
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.growthPlan && <p className="text-xs text-red-500">{errors.growthPlan}</p>}
          <p className="text-xs text-zinc-500 dark:text-neutral-400">{formData.growthPlan.length} / 1000</p>
        </div>
      </div>

      {/* Social Links */}
      <div>
        <label htmlFor="socialLinks" className="block text-sm font-medium text-zinc-900 dark:text-white">
          Social Media Links (Optional)
        </label>
        <input
          type="text"
          name="socialLinks"
          id="socialLinks"
          value={formData.socialLinks}
          onChange={handleChange}
          placeholder="e.g., @yourtwitter, instagram.com/yourprofile"
          className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-400">Help us learn more about you</p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-500 dark:hover:bg-emerald-400"
      >
        {loading ? 'Submitting...' : 'Submit Application'}
      </button>

      <p className="text-center text-xs text-zinc-500 dark:text-neutral-400">
        We'll review your application and get back to you soon.
      </p>
    </form>
  );
}
