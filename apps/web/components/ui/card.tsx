import React from 'react';

export type CardRounding = 'lg' | 'xl' | '2xl' | '3xl';

const roundingStyles: Record<CardRounding, string> = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Corner radius — the site's dominant style is '2xl'/'3xl'; 'lg' matches this component's original default. */
  rounded?: CardRounding;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ rounded = 'lg', className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`${roundingStyles[rounded]} border border-zinc-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className}`}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h2
    ref={ref}
    className={`text-2xl font-semibold leading-none tracking-tight text-zinc-900 dark:text-neutral-50 ${className}`}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));
CardContent.displayName = 'CardContent';
