'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FormActionProps {
  onSubmit: () => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  className?: string;
}

export function FormActions({
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isLoading = false,
  isDisabled = false,
  variant = 'primary',
  fullWidth = false,
  className = '',
}: FormActionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex gap-3 ${fullWidth ? 'flex-col' : 'flex-col sm:flex-row'} ${className}`}
    >
      {onCancel && (
        <motion.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            px-6 py-2.5 rounded-lg font-semibold text-sm transition-all
            flex items-center justify-center gap-2
            ${fullWidth ? 'w-full' : 'sm:flex-1'}
            bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
            text-zinc-900 dark:text-zinc-100
            border border-zinc-200 dark:border-zinc-700
          `}
        >
          {cancelLabel}
        </motion.button>
      )}

      <motion.button
        type="button"
        onClick={onSubmit}
        disabled={isLoading || isDisabled}
        whileHover={!isLoading && !isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isLoading && !isDisabled ? { scale: 0.98 } : {}}
        className={`
          px-6 py-2.5 rounded-lg font-semibold text-sm transition-all
          flex items-center justify-center gap-2
          ${fullWidth ? 'w-full' : onCancel ? 'sm:flex-1' : ''}
          ${isLoading || isDisabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${variant === 'primary'
            ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl'
            : variant === 'secondary'
              ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
              : 'border-2 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }
        `}
      >
        {isLoading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}
        {submitLabel}
      </motion.button>
    </motion.div>
  );
}

interface FormButtonGroupProps {
  children: ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

export function FormButtonGroup({
  children,
  className = '',
  gap = 'md',
}: FormButtonGroupProps) {
  const gapClass = gap === 'sm' ? 'gap-2' : gap === 'lg' ? 'gap-4' : 'gap-3';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className={`flex flex-col sm:flex-row ${gapClass} ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface FormButtonProps {
  label: string;
  onClick: () => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  isLoading?: boolean;
  isDisabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FormButton({
  label,
  onClick,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
  icon,
  fullWidth = false,
  size = 'md',
  className = '',
}: FormButtonProps) {
  const sizeClass =
    size === 'sm'
      ? 'px-4 py-1.5 text-sm'
      : size === 'lg'
        ? 'px-8 py-3 text-base'
        : 'px-6 py-2.5 text-sm';

  const variantClass =
    variant === 'primary'
      ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl'
      : variant === 'secondary'
        ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
        : variant === 'outline'
          ? 'border-2 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          : variant === 'danger'
            ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white'
            : 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isLoading || isDisabled}
      whileHover={!isLoading && !isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isLoading && !isDisabled ? { scale: 0.98 } : {}}
      className={`
        rounded-lg font-semibold transition-all
        flex items-center justify-center gap-2
        ${sizeClass}
        ${variantClass}
        ${fullWidth ? 'w-full' : ''}
        ${isLoading || isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      {icon && <span>{icon}</span>}
      {label}
    </motion.button>
  );
}

interface StepNavigationProps {
  onPrevious: () => void;
  onNext?: () => void;
  onSubmit?: () => void | Promise<void>;
  canPreviousStep: boolean;
  canNextStep: boolean;
  previousLabel?: string;
  nextLabel?: string;
  isLastStep?: boolean;
  submitLabel?: string;
  isSubmitLoading?: boolean;
  className?: string;
}

export function StepNavigation({
  onPrevious,
  onNext,
  onSubmit,
  canPreviousStep,
  canNextStep,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  isLastStep = false,
  submitLabel = 'Submit',
  isSubmitLoading = false,
  className = '',
}: StepNavigationProps) {
  const handleNextClick = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    } else if (onNext) {
      onNext();
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex gap-3 pt-6 ${className}`}
    >
      <motion.button
        type="button"
        onClick={onPrevious}
        disabled={!canPreviousStep}
        whileHover={canPreviousStep ? { scale: 1.02 } : {}}
        whileTap={canPreviousStep ? { scale: 0.98 } : {}}
        className={`
          px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex-1
          flex items-center justify-center gap-2
          ${canPreviousStep
            ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 cursor-pointer'
            : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
          }
        `}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        {previousLabel}
      </motion.button>

      <motion.button
        type={isLastStep ? 'submit' : 'button'}
        onClick={handleNextClick}
        disabled={!canNextStep || isSubmitLoading}
        whileHover={canNextStep && !isSubmitLoading ? { scale: 1.02 } : {}}
        whileTap={canNextStep && !isSubmitLoading ? { scale: 0.98 } : {}}
        className={`
          px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex-1
          flex items-center justify-center gap-2
          ${canNextStep && !isSubmitLoading
            ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl cursor-pointer'
            : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 cursor-not-allowed opacity-60'
          }
        `}
      >
        {isSubmitLoading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}
        {isLastStep ? submitLabel : nextLabel}
        {isLastStep ? null : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </motion.button>
    </motion.div>
  );
}
