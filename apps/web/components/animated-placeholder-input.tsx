'use client';

import { forwardRef, InputHTMLAttributes, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnimatedPlaceholderInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suggestions?: string[];
  error?: string | null;
  touched?: boolean;
  icon?: React.ReactNode;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
  variant?: 'default' | 'card';
}

const defaultSuggestions = [
  'Fix the drainage on Tubman Boulevard — it floods every rainy season...',
  'Improve healthcare access in rural counties...',
  'Build better roads to connect remote communities...',
  'Support affordable education for underprivileged children...',
  'Address water shortage in Monrovia...',
  'Create job opportunities for youth in Liberia...',
];

export const AnimatedPlaceholderInput = forwardRef<HTMLInputElement, AnimatedPlaceholderInputProps>(
  (
    {
      label,
      suggestions = defaultSuggestions,
      error,
      touched,
      icon,
      helperText,
      showCharCount,
      maxLength,
      variant = 'default',
      ...props
    },
    ref,
  ) => {
    const hasError = touched && error;
    const currentLength = (props.value as string)?.length || 0;
    const [displayedText, setDisplayedText] = useState('');
    const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [hasUserInput, setHasUserInput] = useState(false);

    const currentSuggestion = suggestions[currentSuggestionIndex];

    useEffect(() => {
      if (hasUserInput || !currentSuggestion) return;

      let timeout: NodeJS.Timeout;

      if (isTyping) {
        // Typing animation
        if (displayedText.length < currentSuggestion.length) {
          timeout = setTimeout(() => {
            setDisplayedText(currentSuggestion.slice(0, displayedText.length + 1));
          }, 30);
        } else {
          // Wait before deleting
          timeout = setTimeout(() => {
            setIsTyping(false);
          }, 2500);
        }
      } else {
        // Deleting animation
        if (displayedText.length > 0) {
          timeout = setTimeout(() => {
            setDisplayedText(displayedText.slice(0, -1));
          }, 20);
        } else {
          // Move to next suggestion
          setCurrentSuggestionIndex((prev) => (prev + 1) % suggestions.length);
          setIsTyping(true);
        }
      }

      return () => clearTimeout(timeout);
    }, [displayedText, isTyping, currentSuggestion, hasUserInput, suggestions]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length > 0) {
        setHasUserInput(true);
      } else {
        setHasUserInput(false);
      }
      props.onChange?.(e);
    };

    if (variant === 'card') {
      return (
        <div className="w-full">
          {label && (
            <label className="block text-lg font-semibold text-zinc-900 dark:text-neutral-100 mb-6">
              {label}
              {props.required && <span className="text-emerald-500 ml-2">*</span>}
            </label>
          )}

          <div className="relative overflow-hidden rounded-xl">
            {icon && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-neutral-500 z-10">
                {icon}
              </div>
            )}

            <input
              ref={ref}
              className={`w-full rounded-xl border-2 px-6 py-4 text-base transition-all focus:outline-none ${
                icon ? 'pl-12' : ''
              } ${
                hasError
                  ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 dark:border-red-900 dark:bg-red-950/20'
                  : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600 dark:focus:border-emerald-500'
              } placeholder-transparent`}
              maxLength={maxLength}
              placeholder="Type something..."
              onChange={handleChange}
              {...props}
            />

            {/* Animated placeholder text */}
            {!hasUserInput && !props.value && (
              <motion.div
                className="absolute left-6 right-6 top-4 text-base text-zinc-500 dark:text-neutral-400 pointer-events-none overflow-hidden whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="inline-flex items-baseline max-w-full">
                  <span className="truncate">{displayedText}</span>
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block flex-shrink-0 w-0.5 h-5 bg-emerald-500 ml-0.5 align-text-bottom"
                  />
                </span>
              </motion.div>
            )}

            {touched && error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"
                aria-hidden="true"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18.101 12.93a1 1 0 00-1.415-1.414L10 16.586 3.314 9.9a1 1 0 00-1.414 1.414l7.071 7.071a1 1 0 001.414 0l9.101-9.101z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
            )}

            {touched && !error && props.value && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"
                aria-hidden="true"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
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
              className="mt-3 text-sm"
            >
              {hasError && <p className="text-red-500 font-medium">{error}</p>}
              {!hasError && helperText && <p className="text-zinc-500 dark:text-neutral-400">{helperText}</p>}
              {showCharCount && maxLength && (
                <p
                  className={`text-xs ${currentLength > maxLength * 0.9 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-zinc-500 dark:text-neutral-400'}`}
                >
                  {currentLength} / {maxLength} characters
                </p>
              )}
            </motion.div>
          )}
        </div>
      );
    }

    // Default variant
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
            } placeholder-transparent`}
            maxLength={maxLength}
            placeholder="Type something..."
            onChange={handleChange}
            {...props}
          />

          {/* Animated placeholder text */}
          {!hasUserInput && !props.value && (
            <motion.div
              className="absolute left-4 top-2.5 text-sm text-zinc-400 dark:text-neutral-500 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="inline-block">
                {displayedText}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-4 bg-emerald-500 ml-0.5 align-text-bottom"
                />
              </span>
            </motion.div>
          )}

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

          {touched && !error && props.value && (
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
              <p
                className={`text-xs ${currentLength > maxLength * 0.9 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-zinc-500 dark:text-neutral-400'}`}
              >
                {currentLength} / {maxLength} characters
              </p>
            )}
          </motion.div>
        )}
      </div>
    );
  },
);

AnimatedPlaceholderInput.displayName = 'AnimatedPlaceholderInput';
