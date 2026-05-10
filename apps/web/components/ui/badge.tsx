import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors';
    const variantStyles = {
      default: 'bg-zinc-200 text-zinc-900 dark:bg-neutral-700 dark:text-neutral-50',
      outline: 'border border-zinc-200 bg-transparent text-zinc-900 dark:border-neutral-700 dark:text-neutral-50',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
