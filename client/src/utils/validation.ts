

export type ValidationRule<T = any> = (value: any, allValues: T) => string | null;
export type ValidationRules<T> = Partial<Record<keyof T, ValidationRule<T>[]>>;
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

const isEmpty = (value: any): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

export const required =
  (label = 'This field'): ValidationRule =>
  (value) =>
    isEmpty(value) ? `${label} is required` : null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export const email =
  (message = 'Enter a valid email address'): ValidationRule =>
  (value) => {
    if (isEmpty(value)) return null;
    return EMAIL_PATTERN.test(String(value).trim()) ? null : message;
  };

export const minLength =
  (length: number, label = 'This field'): ValidationRule =>
  (value) => {
    if (isEmpty(value)) return null;
    return String(value).trim().length < length ? `${label} must be at least ${length} characters` : null;
  };

export const maxLength =
  (length: number, label = 'This field'): ValidationRule =>
  (value) => {
    if (isEmpty(value)) return null;
    return String(value).trim().length > length ? `${label} cannot exceed ${length} characters` : null;
  };

export const pattern =
  (regex: RegExp, message: string): ValidationRule =>
  (value) => {
    if (isEmpty(value)) return null;
    return regex.test(String(value).trim()) ? null : message;
  };

export const phone =
  (message = 'Enter a valid 10 digit mobile number'): ValidationRule =>
  (value) => {
    if (isEmpty(value)) return null;
    const digits = String(value).replace(/[\s\-()+]/g, '');
    return /^(91)?[6-9]\d{9}$/.test(digits) ? null : message;
  };

export const numeric =
  (label = 'This field'): ValidationRule =>
  (value) => {
    if (isEmpty(value)) return null;
    return Number.isNaN(Number(value)) ? `${label} must be a number` : null;
  };

export const min =
  (limit: number, label = 'This field'): ValidationRule =>
  (value) => {
    if (isEmpty(value)) return null;
    return Number(value) < limit ? `${label} must be at least ${limit}` : null;
  };

export const max =
  (limit: number, label = 'This field'): ValidationRule =>
  (value) => {
    if (isEmpty(value)) return null;
    return Number(value) > limit ? `${label} cannot exceed ${limit}` : null;
  };

export const notBefore =
  (otherField: string, message: string): ValidationRule =>
  (value, allValues: any) => {
    if (isEmpty(value) || isEmpty(allValues?.[otherField])) return null;
    return new Date(value) < new Date(allValues[otherField]) ? message : null;
  };

export const notInPast =
  (message = 'Date cannot be in the past'): ValidationRule =>
  (value) => {
    if (isEmpty(value)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(value) < today ? message : null;
  };

export const matches =
  (otherField: string, message: string): ValidationRule =>
  (value, allValues: any) => {
    if (isEmpty(value)) return null;
    return value !== allValues?.[otherField] ? message : null;
  };

export const password =
  (minChars = 8): ValidationRule =>
  (value) => {
    if (isEmpty(value)) return null;
    const text = String(value);
    if (text.length < minChars) return `Password must be at least ${minChars} characters`;
    if (!/[a-z]/.test(text)) return 'Password must include a lowercase letter';
    if (!/[A-Z]/.test(text)) return 'Password must include an uppercase letter';
    if (!/\d/.test(text)) return 'Password must include a number';
    return null;
  };

export const validateField = <T,>(value: any, rules: ValidationRule<T>[] = [], allValues: T): string | null => {
  for (const rule of rules) {
    const message = rule(value, allValues);
    if (message) return message;
  }
  return null;
};

export const validateForm = <T extends Record<string, any>>(
  values: T,
  rules: ValidationRules<T>
): ValidationErrors<T> => {
  const errors: ValidationErrors<T> = {};

  (Object.keys(rules) as (keyof T)[]).forEach((field) => {
    const message = validateField(values[field], rules[field], values);
    if (message) errors[field] = message;
  });

  return errors;
};

export const mapServerErrors = <T,>(serverErrors: any): ValidationErrors<T> => {
  const errors: ValidationErrors<T> = {};
  if (!Array.isArray(serverErrors)) return errors;

  serverErrors.forEach((item: any) => {
    const field = item?.field ?? item?.path;
    const message = item?.message;

    const key = String(field ?? '').split('.').pop();
    if (key && message) {
      (errors as any)[key] = message;
    }
  });

  return errors;
};
