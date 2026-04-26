'use client';

import { useState } from 'react';
import { FormInput } from './form-input';
import { FormTextarea } from './form-textarea';
import { PhoneInput } from './phone-input';
import { ImageUploadPreview } from './image-upload-preview';
import { useFormValidation, ValidationRules } from '../lib/form-validation';
import { motion } from 'framer-motion';

export function PetitionDraftForm({
  onSubmit,
  isLoading = false,
}: {
  onSubmit?: (data: Record<string, any>) => void;
  isLoading?: boolean;
}) {
  const form = useFormValidation({
    title: '',
    description: '',
    contact_email: '',
    contact_phone: '',
  });

  const [image, setImage] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const rules = {
      title: [
        ValidationRules.required('Title is required'),
        ValidationRules.minLength(10, 'Title must be at least 10 characters'),
        ValidationRules.maxLength(120, 'Title must be no more than 120 characters'),
      ],
      description: [
        ValidationRules.required('Description is required'),
        ValidationRules.minLength(20, 'Description must be at least 20 characters'),
        ValidationRules.maxLength(2000, 'Description must be no more than 2000 characters'),
      ],
      contact_email: [
        ValidationRules.required('Email is required'),
        ValidationRules.email('Please enter a valid email address'),
      ],
      contact_phone: [
        ValidationRules.required('Phone number is required'),
        ValidationRules.phone('Please enter a valid phone number'),
      ],
    };

    if (form.validateAll(rules)) {
      const data = {
        title: form.fields.title.value,
        description: form.fields.description.value,
        contact_email: form.fields.contact_email.value,
        contact_phone: form.fields.contact_phone.value,
        image,
      };
      onSubmit?.(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <FormInput
          label="Petition Title"
          placeholder="What is the main issue?"
          value={form.fields.title.value}
          onChange={(e) => form.setFieldValue('title', e.target.value)}
          onBlur={() => form.setFieldTouched('title', true)}
          error={form.fields.title.error}
          touched={form.fields.title.touched}
          showCharCount
          maxLength={120}
          required
          helperText="Be clear and specific about what you're petitioning for"
        />
      </div>

      {/* Description */}
      <div>
        <FormTextarea
          label="Petition Description"
          placeholder="Explain the background, impact, and what solution you're seeking..."
          value={form.fields.description.value}
          onChange={(e) => form.setFieldValue('description', e.target.value)}
          onBlur={() => form.setFieldTouched('description', true)}
          error={form.fields.description.error}
          touched={form.fields.description.touched}
          showCharCount
          maxLength={2000}
          rows={6}
          required
          helperText="Include details that will help people understand and support your cause"
        />
      </div>

      {/* Image Upload */}
      <div>
        <ImageUploadPreview
          label="Featured Image (Optional)"
          onImageSelect={(file) => setImage(file)}
          maxSize={5}
          acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
        />
        <p className="mt-2 text-xs text-zinc-500 dark:text-neutral-500">
          Images help people engage with your petition. Use a clear, compelling image.
        </p>
      </div>

      {/* Contact Email */}
      <div>
        <FormInput
          label="Contact Email"
          type="email"
          placeholder="your@email.com"
          value={form.fields.contact_email.value}
          onChange={(e) => form.setFieldValue('contact_email', e.target.value)}
          onBlur={() => form.setFieldTouched('contact_email', true)}
          error={form.fields.contact_email.error}
          touched={form.fields.contact_email.touched}
          required
          helperText="We'll contact you with updates about your petition"
        />
      </div>

      {/* Contact Phone */}
      <div>
        <PhoneInput
          label="Contact Phone (Optional)"
          value={form.fields.contact_phone.value}
          onChange={(value) => form.setFieldValue('contact_phone', value)}
          onBlur={() => form.setFieldTouched('contact_phone', true)}
          error={form.fields.contact_phone.error}
          touched={form.fields.contact_phone.touched}
          required
          helperText="Include your country code for international numbers"
        />
      </div>

      {/* Submit Error */}
      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4"
        >
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{submitError}</p>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:disabled:bg-neutral-700 px-6 py-3 text-base font-semibold text-white shadow-md transition-colors disabled:cursor-not-allowed min-h-11"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Submitting...
          </span>
        ) : (
          'Draft Petition'
        )}
      </motion.button>

      {/* Helper Text */}
      <p className="text-xs text-zinc-500 dark:text-neutral-500 text-center">
        Your petition will be saved as a draft for review before being published.
      </p>
    </form>
  );
}
