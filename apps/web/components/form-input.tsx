'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  touched?: boolean;
  icon?: React.ReactNode;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched, icon, helperText, showCharCount, maxLength, ...props }, ref) => {
    const hasError = touched && error;
    const currentLength = (props.value as string)?.length || 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-100 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-neutral-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
              icon ? 'pl-11' : ''
            } ${
              hasError
                ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20 dark:border-red-900 dark:bg-red-950/20 dark:focus:border-red-500'
                : 'border-zinc-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-emerald-500'
            }`}
            maxLength={maxLength}
            {...props}
          />

          {touched && error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"
              aria-hidden="true"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18.101 12.93a1 1 0 00-1.415-1.414L10 16.586 3.314 9.9a1 1 0 00-1.414 1.414l7.071 7.071a1 1 0 001.414 0l9.101-9.101z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
          )}

          {touched && !error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"
              aria-hidden="true"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
          )}
        </div>

        {(hasError || helperText || showCharCount) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 text-xs"
          >
            {hasError && <p className="text-red-500 font-medium">{error}</p>}
            {!hasError && helperText && <p className="text-zinc-500 dark:text-neutral-400">{helperText}</p>}
            {showCharCount && maxLength && (
              <p className={`text-xs ${currentLength > maxLength * 0.9 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-zinc-500 dark:text-neutral-400'}`}>
                {currentLength} / {maxLength} characters
              </p>
            )}
          </motion.div>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
