'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  touched?: boolean;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, touched, helperText, showCharCount, maxLength, ...props }, ref) => {
    const hasError = touched && error;
    const currentLength = (props.value as string)?.length || 0;
    const charPercentage = maxLength ? (currentLength / maxLength) * 100 : 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-100 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            className={`w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 resize-none ${
              hasError
                ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20 dark:border-red-900 dark:bg-red-950/20 dark:focus:border-red-500'
                : 'border-zinc-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-emerald-500'
            }`}
            maxLength={maxLength}
            {...props}
          />

          {/* Progress bar */}
          {maxLength && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-neutral-700 rounded-b-lg overflow-hidden">
              <motion.div
                className={`h-full transition-colors ${
                  charPercentage > 90
                    ? 'bg-red-500'
                    : charPercentage > 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${charPercentage}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          )}
        </div>

        {(hasError || helperText || showCharCount) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2"
          >
            {hasError && <p className="text-xs text-red-500 font-medium">{error}</p>}
            {!hasError && helperText && <p className="text-xs text-zinc-500 dark:text-neutral-400">{helperText}</p>}

            {showCharCount && maxLength && (
              <div className="flex items-center justify-between mt-1">
                <p
                  className={`text-xs ${
                    charPercentage > 90
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : charPercentage > 70
                        ? 'text-amber-600 dark:text-amber-400 font-medium'
                        : 'text-zinc-500 dark:text-neutral-400'
                  }`}
                >
                  {currentLength} / {maxLength}
                </p>
                <p className="text-xs text-zinc-500 dark:text-neutral-400">
                  {maxLength - currentLength} remaining
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
