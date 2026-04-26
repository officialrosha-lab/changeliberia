'use client';

import { forwardRef, InputHTMLAttributes, useCallback } from 'react';
import { FormInput } from './form-input';

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string | null;
  touched?: boolean;
  helperText?: string;
  onChange?: (value: string) => void;
  format?: 'US' | 'INTL' | 'PLAIN';
}

function formatUSPhoneNumber(input: string): string {
  const cleaned = input.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

function formatIntlPhoneNumber(input: string): string {
  const cleaned = input.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.startsWith('1')) {
    return formatUSPhoneNumber(cleaned);
  }
  // For international, just add spaces for readability
  if (cleaned.length <= 3) return `+${cleaned}`;
  if (cleaned.length <= 6) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, touched, helperText, onChange, format = 'US', value = '', ...props }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        let formatted = input;

        if (format === 'US') {
          formatted = formatUSPhoneNumber(input);
        } else if (format === 'INTL') {
          formatted = formatIntlPhoneNumber(input);
        }

        onChange?.(formatted);
      },
      [format, onChange]
    );

    return (
      <FormInput
        ref={ref}
        type="tel"
        label={label}
        error={error}
        touched={touched}
        helperText={helperText}
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        }
        value={value}
        onChange={handleChange}
        placeholder={format === 'US' ? '(555) 123-4567' : '+1 555 123 4567'}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
