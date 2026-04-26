import React from 'react';
import { components } from './theme';

/**
 * Button Component
 * Supports multiple variants: primary, secondary, ghost, danger
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, className, ...props }, ref) => {
    const variantClass = components.button[variant];
    const sizeClass = {
      sm: 'px-3 py-2 text-xs',
      md: 'px-5 py-3 text-sm',
      lg: 'px-6 py-4 text-base',
    }[size];

    return (
      <button
        ref={ref}
        className={`${variantClass} ${sizeClass} ${className || ''}`}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Card Component
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={`${components.card} ${className || ''}`} {...props}>
      {children}
    </div>
  )
);

Card.displayName = 'Card';

/**
 * Input Component
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`${components.input} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className || ''}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      {helpText && <span className="text-xs text-neutral-500 dark:text-neutral-400">{helpText}</span>}
    </div>
  )
);

Input.displayName = 'Input';

/**
 * Badge Component
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', children, className, ...props }, ref) => (
    <span
      ref={ref}
      className={`${components.badge[variant]} ${className || ''}`}
      {...props}
    >
      {children}
    </span>
  )
);

Badge.displayName = 'Badge';

/**
 * Modal/Dialog Backdrop
 */
export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, children, title, className, ...props }, ref) => {
    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 dark:bg-black/70"
          onClick={onClose}
          role="presentation"
        />

        {/* Modal */}
        <div
          ref={ref}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className || ''}`}
          {...props}
        >
          <div
            className="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 dark:bg-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                {title}
              </h2>
            )}
            {children}
          </div>
        </div>
      </>
    );
  }
);

Modal.displayName = 'Modal';

/**
 * Toast/Alert Notification
 */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  duration?: number;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ type = 'info', title, message, onClose, duration = 5000, className, ...props }, ref) => {
    const bgColor = {
      success: 'bg-green-50 dark:bg-green-900',
      error: 'bg-red-50 dark:bg-red-900',
      warning: 'bg-yellow-50 dark:bg-yellow-900',
      info: 'bg-blue-50 dark:bg-blue-900',
    }[type];

    const borderColor = {
      success: 'border-green-200 dark:border-green-700',
      error: 'border-red-200 dark:border-red-700',
      warning: 'border-yellow-200 dark:border-yellow-700',
      info: 'border-blue-200 dark:border-blue-700',
    }[type];

    const textColor = {
      success: 'text-green-800 dark:text-green-100',
      error: 'text-red-800 dark:text-red-100',
      warning: 'text-yellow-800 dark:text-yellow-100',
      info: 'text-blue-800 dark:text-blue-100',
    }[type];

    React.useEffect(() => {
      if (onClose && duration) {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, onClose]);

    return (
      <div
        ref={ref}
        className={`${bgColor} ${borderColor} ${textColor} rounded-lg border p-4 shadow-lg ${className || ''}`}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-semibold">{title}</p>
            {message && <p className="text-sm opacity-90 mt-1">{message}</p>}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-lg opacity-50 hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

/**
 * Skeleton Loader
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  height?: string;
  width?: string;
  circle?: boolean;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ count = 1, height = 'h-4', width = 'w-full', circle = false, className, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} ${width} ${circle ? 'rounded-full' : 'rounded'} bg-neutral-200 dark:bg-neutral-700 animate-pulse ${i < count - 1 ? 'mb-3' : ''}`}
        />
      ))}
    </div>
  )
);

Skeleton.displayName = 'Skeleton';

/**
 * Textarea Component
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  charCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, charCount = false, maxLength, className, ...props }, ref) => {
    const [count, setCount] = React.useState(0);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          maxLength={maxLength}
          className={`w-full rounded-lg border border-neutral-300 px-4 py-2 text-base text-neutral-900 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400 transition-colors duration-200 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className || ''}`}
          onChange={(e) => {
            setCount(e.target.value.length);
            props.onChange?.(e);
          }}
          {...props}
        />
        <div className="flex justify-between items-center">
          <div>
            {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
            {helpText && <span className="text-xs text-neutral-500 dark:text-neutral-400">{helpText}</span>}
          </div>
          {charCount && maxLength && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {count} / {maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Avatar Component
 */
export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
}

export const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ initials, size = 'md', status, className, ...props }, ref) => {
    const sizeMap = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
    };

    const statusMap = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
    };

    if (props.src) {
      return (
        <div className="relative">
          <img
            ref={ref}
            className={`${sizeMap[size]} rounded-full object-cover ${className || ''}`}
            {...props}
          />
          {status && (
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusMap[status]}`} />
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <div
          className={`${sizeMap[size]} rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold ${className || ''}`}
        >
          {initials || '?'}
        </div>
        {status && (
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusMap[status]}`} />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * Progress Bar Component
 */
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: 'emerald' | 'amber' | 'red' | 'blue';
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, label, showPercent = true, color = 'emerald', className, ...props }, ref) => {
    const percent = Math.round((value / max) * 100);
    const colorMap = {
      emerald: 'bg-emerald-600',
      amber: 'bg-amber-600',
      red: 'bg-red-600',
      blue: 'bg-blue-600',
    };

    return (
      <div ref={ref} className={className} {...props}>
        {(label || showPercent) && (
          <div className="flex justify-between items-center mb-2">
            {label && <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{label}</span>}
            {showPercent && <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{percent}%</span>}
          </div>
        )}
        <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
          <div
            className={`h-full ${colorMap[color]} transition-all duration-300`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';
