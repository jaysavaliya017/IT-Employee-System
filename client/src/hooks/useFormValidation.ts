import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ValidationErrors,
  ValidationRules,
  validateField,
  validateForm,
} from '../utils/validation';

interface UseFormValidationOptions<T> {
  initialValues: T;
  rules: ValidationRules<T>;
  onSubmit: (values: T) => Promise<void> | void;

  validateOnChange?: boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  rules,
  onSubmit,
  validateOnChange = true,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const touchedRef = useRef(touched);
  touchedRef.current = touched;

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => {
        const next = { ...prev, [field]: value };
        valuesRef.current = next;
        return next;
      });

      if (validateOnChange && touchedRef.current[field]) {
        const message = validateField(value, rules[field], { ...valuesRef.current, [field]: value });
        setErrors((prev) => ({ ...prev, [field]: message || undefined }));
      }
    },
    [rules, validateOnChange]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      setValue(target.name as keyof T, value);
    },
    [setValue]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const field = e.target.name as keyof T;
      touchedRef.current = { ...touchedRef.current, [field]: true };
      setTouched((prev) => ({ ...prev, [field]: true }));
      const message = validateField(valuesRef.current[field], rules[field], valuesRef.current);
      setErrors((prev) => ({ ...prev, [field]: message || undefined }));
    },
    [rules]
  );

  const validateAll = useCallback(() => {
    const nextErrors = validateForm(valuesRef.current, rules);
    setErrors(nextErrors);
    const allTouched = Object.keys(rules).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Partial<Record<keyof T, boolean>>
    );
    touchedRef.current = allTouched;
    setTouched(allTouched);
    return nextErrors;
  }, [rules]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const nextErrors = validateAll();
      const firstInvalid = Object.keys(nextErrors)[0];

      if (firstInvalid) {

        const node = document.querySelector<HTMLElement>(`[name="${firstInvalid}"]`);
        node?.focus();
        node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(valuesRef.current);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateAll, onSubmit]
  );

  const reset = useCallback(
    (nextValues?: T) => {
      const target = nextValues ?? initialValues;
      setValues(target);
      valuesRef.current = target;
      setErrors({});
      touchedRef.current = {};
      setTouched({});
      setIsSubmitting(false);
    },
    [initialValues]
  );

  const isValid = useMemo(
    () => Object.keys(validateForm(values, rules)).length === 0,
    [values, rules]
  );

  const fieldProps = useCallback(
    (field: keyof T) => ({
      name: String(field),
      value: values[field] ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
      'aria-invalid': Boolean(touched[field] && errors[field]),
      'aria-describedby': touched[field] && errors[field] ? `${String(field)}-error` : undefined,
    }),
    [values, handleChange, handleBlur, touched, errors]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    validateAll,
    reset,
    fieldProps,
  };
}

export default useFormValidation;
