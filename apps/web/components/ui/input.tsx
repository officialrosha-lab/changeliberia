import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-sm',
};

/** Shared class string so non-<input> form elements (textarea, select) can match exactly. */
export function inputVariants({
  size = 'md',
  className = '',
}: {
  size?: InputSize;
  className?: string;
} = {}) {
  return [
    'w-full rounded-2xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400',
    'outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500',
    sizeStyles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = 'md', className = '', ...props }, ref) => (
    <input ref={ref} className={inputVariants({ size: inputSize, className })} {...props} />
  ),
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  inputSize?: InputSize;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ inputSize = 'md', className = '', ...props }, ref) => (
    <textarea ref={ref} className={inputVariants({ size: inputSize, className })} {...props} />
  ),
);
Textarea.displayName = 'Textarea';
