'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  icon,
  className = '',
}: FormSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      viewport={{ once: true, margin: '-100px' }}
      className={`space-y-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
            viewport={{ once: true }}
            className="text-emerald-600 dark:text-emerald-400 mt-1"
          >
            {icon}
          </motion.div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

interface FormFieldWrapperProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormFieldWrapper({
  label,
  description,
  required,
  error,
  children,
  className = '',
}: FormFieldWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      viewport={{ once: true }}
      className={`space-y-2 ${className}`}
    >
      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
        {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{description}</p>
      )}
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-xs text-red-600 dark:text-red-400 mt-1"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}

interface FormCardProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export function FormCard({ children, className = '', compact = false }: FormCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        rounded-xl border border-zinc-200 dark:border-zinc-800
        bg-white dark:bg-zinc-950
        shadow-sm hover:shadow-md transition-shadow duration-300
        ${compact ? 'p-4 md:p-6' : 'p-6 md:p-8'}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
