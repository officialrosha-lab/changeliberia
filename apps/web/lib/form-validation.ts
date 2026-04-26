import { useState, useCallback, useRef } from 'react';

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface FieldState {
  value: string;
  error: string | null;
  touched: boolean;
}

export interface UseFormValidationReturn {
  fields: Record<string, FieldState>;
  setFieldValue: (name: string, value: string) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  validateField: (name: string, rules: ValidationRule[]) => boolean;
  validateAll: (rules: Record<string, ValidationRule[]>) => boolean;
  clearField: (name: string) => void;
  clearAll: () => void;
}

export function useFormValidation(initialValues: Record<string, string> = {}): UseFormValidationReturn {
  const [fields, setFields] = useState<Record<string, FieldState>>(() => {
    const initial: Record<string, FieldState> = {};
    for (const key in initialValues) {
      initial[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
      };
    }
    return initial;
  });

  const setFieldValue = useCallback((name: string, value: string) => {
    setFields((prev) => ({
      ...prev,
      [name]: { ...prev[name], value },
    }));
  }, []);

  const setFieldTouched = useCallback((name: string, touched: boolean) => {
    setFields((prev) => ({
      ...prev,
      [name]: { ...prev[name], touched },
    }));
  }, []);

  const validateField = useCallback((name: string, rules: ValidationRule[]): boolean => {
    const field = fields[name];
    if (!field) {
      setFields((prev) => ({
        ...prev,
        [name]: { value: '', error: null, touched: false },
      }));
      return true;
    }

    for (const rule of rules) {
      if (!rule.validate(field.value)) {
        setFields((prev) => ({
          ...prev,
          [name]: { ...prev[name], error: rule.message },
        }));
        return false;
      }
    }

    setFields((prev) => ({
      ...prev,
      [name]: { ...prev[name], error: null },
    }));
    return true;
  }, [fields]);

  const validateAll = useCallback((rules: Record<string, ValidationRule[]>): boolean => {
    let isValid = true;
    for (const fieldName in rules) {
      if (!validateField(fieldName, rules[fieldName])) {
        isValid = false;
      }
    }
    return isValid;
  }, [validateField]);

  const clearField = useCallback((name: string) => {
    setFields((prev) => ({
      ...prev,
      [name]: { value: '', error: null, touched: false },
    }));
  }, []);

  const clearAll = useCallback(() => {
    setFields((prev) => {
      const cleared: Record<string, FieldState> = {};
      for (const key in prev) {
        cleared[key] = { value: '', error: null, touched: false };
      }
      return cleared;
    });
  }, []);

  return {
    fields,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateAll,
    clearField,
    clearAll,
  };
}

// Common validation rules
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
  }),

  minLength: (min: number, message = `Minimum ${min} characters required`): ValidationRule => ({
    validate: (value) => value.length >= min,
    message,
  }),

  maxLength: (max: number, message = `Maximum ${max} characters`): ValidationRule => ({
    validate: (value) => value.length <= max,
    message,
  }),

  email: (message = 'Please enter a valid email'): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    validate: (value) => /^(\+\d{1,3})?[-.\s]?\(?(\d{1,4})\)?[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})$/.test(value.replace(/\D/g, '')),
    message,
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    validate: (value) => regex.test(value),
    message,
  }),

  match: (matchValue: string, message = 'Fields do not match'): ValidationRule => ({
    validate: (value) => value === matchValue,
    message,
  }),
};
