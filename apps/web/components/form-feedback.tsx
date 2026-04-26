'use client';

import { motion, AnimatePresence } from 'framer-motion';

export type FormSubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface FormFeedbackProps {
  state: FormSubmitState;
  successMessage?: string;
  errorMessage?: string;
  onDismiss?: () => void;
}

export function FormFeedback({
  state,
  successMessage = 'Success! Your submission was received.',
  errorMessage = 'Something went wrong. Please try again.',
  onDismiss,
}: FormFeedbackProps) {
  const isVisible = state === 'success' || state === 'error';

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={state}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`rounded-lg border px-4 py-4 flex items-start gap-3 ${
            state === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
          }`}
        >
          {state === 'success' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
              className="flex-shrink-0 h-6 w-6 text-emerald-600 dark:text-emerald-400 mt-0.5"
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
              className="flex-shrink-0 h-6 w-6 text-red-600 dark:text-red-400 mt-0.5"
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
          )}

          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-semibold ${
                state === 'success'
                  ? 'text-emerald-900 dark:text-emerald-200'
                  : 'text-red-900 dark:text-red-200'
              }`}
            >
              {state === 'success' ? successMessage : errorMessage}
            </p>
          </div>

          {onDismiss && (
            <motion.button
              type="button"
              onClick={onDismiss}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 h-5 w-5 transition-colors ${
                state === 'success'
                  ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300'
                  : 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
              }`}
              aria-label="Dismiss message"
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
