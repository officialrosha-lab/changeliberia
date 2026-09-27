'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600',
  secondary:
    'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 focus:ring-zinc-400 dark:bg-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-600',
  ghost:
    'bg-transparent text-zinc-700 hover:bg-zinc-100 focus:ring-zinc-400 dark:text-neutral-300 dark:hover:bg-neutral-800',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
};

/** Shared class string so non-<button> elements (e.g. a Next `Link` styled as a CTA) can match exactly. */
export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return [
    'inline-flex items-center justify-center rounded-full font-semibold',
    'transition active:scale-95 outline-none',
    'focus:ring-2 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus:ring-offset-zinc-950 dark:focus-visible:ring-offset-zinc-950',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    variantStyles[variant],
    sizeStyles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={isLoading || disabled}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {isLoading && (
        <motion.svg
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 2v4m0 12v4M4.22 4.22l2.83 2.83m4 0l2.83-2.83M4 12h4m12 0h4m-4.22 7.78l-2.83-2.83m-4 0l-2.83 2.83"
          />
        </motion.svg>
      )}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  ),
);
Button.displayName = 'Button';
