import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;

  duration?: number;
}

const MAX_VISIBLE = 4;
const DEFAULT_DURATION = 4500;
const ERROR_DURATION = 6500;

type Listener = (toasts: ToastMessage[]) => void;

let items: ToastMessage[] = [];
let listeners: Listener[] = [];
let seq = 0;

const makeId = () => `toast_${Date.now().toString(36)}_${(seq++).toString(36)}`;

const emit = () => {
  const snapshot = items.slice();
  listeners.forEach((listener) => listener(snapshot));
};

const removeToast = (id: string) => {
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return;
  items = next;
  emit();
};

const pushToast = (
  type: ToastType,
  message: string,
  options: { title?: string; duration?: number } = {}
): string => {
  const text = typeof message === 'string' ? message.trim() : String(message ?? '').trim();
  if (!text) return '';

  const existing = items.find((item) => item.type === type && item.message === text);
  if (existing) {

    const refreshedId = makeId();
    items = items.map((item) => (item.id === existing.id ? { ...item, id: refreshedId } : item));
    emit();
    return refreshedId;
  }

  const id = makeId();
  const duration =
    options.duration !== undefined ? options.duration : type === 'error' ? ERROR_DURATION : DEFAULT_DURATION;

  items = [...items, { id, type, message: text, title: options.title, duration }];

  if (items.length > MAX_VISIBLE) {
    items = items.slice(items.length - MAX_VISIBLE);
  }

  emit();
  return id;
};

export const toast = {
  success: (message: string, options?: { title?: string; duration?: number }) =>
    pushToast('success', message, options),
  error: (message: string, options?: { title?: string; duration?: number }) =>
    pushToast('error', message, options),
  info: (message: string, options?: { title?: string; duration?: number }) =>
    pushToast('info', message, options),
  warning: (message: string, options?: { title?: string; duration?: number }) =>
    pushToast('warning', message, options),

  addToast: (type: ToastType, message: string) => pushToast(type, message),

  dismiss: (id: string) => removeToast(id),
  dismissAll: () => {
    items = [];
    emit();
  },

  promise: async <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string | ((value: T) => string); error: string | ((err: any) => string) }
  ): Promise<T> => {
    const loadingId = pushToast('info', messages.loading, { duration: 0 });
    try {
      const value = await promise;
      removeToast(loadingId);
      pushToast('success', typeof messages.success === 'function' ? messages.success(value) : messages.success);
      return value;
    } catch (err) {
      removeToast(loadingId);
      pushToast('error', typeof messages.error === 'function' ? messages.error(err) : messages.error);
      throw err;
    }
  },

  subscribe: (listener: Listener) => {
    listeners.push(listener);
    listener(items.slice());
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
  error: <XCircle className="w-5 h-5 text-red-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
  info: <AlertCircle className="w-5 h-5 text-primary-600" />,
};

const SHELL: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-primary-200 bg-primary-50',
};

const BAR: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-primary-500',
};

export const Toast: React.FC<ToastProps> = ({ toast: item, onClose }) => {
  const [leaving, setLeaving] = useState(false);
  const duration = item.duration === undefined ? DEFAULT_DURATION : item.duration;

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(Date.now());

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLeaving(true);
    setTimeout(() => onCloseRef.current(item.id), 200);
  }, [item.id]);

  const startTimer = useCallback(() => {
    if (duration <= 0) return;
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(dismiss, remainingRef.current);
  }, [duration, dismiss]);

  const pauseTimer = useCallback(() => {
    if (duration <= 0 || !timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
  }, [duration]);

  useEffect(() => {
    remainingRef.current = duration;
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, duration, startTimer]);

  return (
    <div
      role={item.type === 'error' ? 'alert' : 'status'}
      aria-live={item.type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      className={`toast-item ${leaving ? 'toast-item-leaving' : ''} relative overflow-hidden flex items-start gap-3 pl-4 pr-3 py-3 rounded-xl border shadow-lg shadow-slate-900/5 ${SHELL[item.type]}`}
    >
      <span className="mt-0.5 shrink-0">{ICONS[item.type]}</span>

      <div className="flex-1 min-w-0">
        {item.title && <p className="text-sm font-semibold text-slate-900">{item.title}</p>}
        <p className="text-sm text-slate-700 break-words">{item.message}</p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-600"
      >
        <X className="w-4 h-4" />
      </button>

      {duration > 0 && (
        <span
          className={`absolute bottom-0 left-0 h-0.5 ${BAR[item.type]} toast-progress`}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts?: ToastMessage[];
  onClose?: (id: string) => void;
  position?: 'bottom-right' | 'top-right' | 'top-center';
}

const POSITIONS: Record<NonNullable<ToastContainerProps['position']>, string> = {
  'bottom-right': 'bottom-4 right-4 items-end',
  'top-right': 'top-4 right-4 items-end',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts: externalToasts,
  onClose,
  position = 'bottom-right',
}) => {
  const [globalToasts, setGlobalToasts] = useState<ToastMessage[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => toast.subscribe(setGlobalToasts), []);

  const visible = useMemo(() => {
    const merged: ToastMessage[] = [];
    const seen = new Set<string>();
    [...(externalToasts || []), ...globalToasts].forEach((item) => {
      if (!item || seen.has(item.id) || dismissedIds.includes(item.id)) return;
      seen.add(item.id);
      merged.push(item);
    });
    return merged.slice(-MAX_VISIBLE);
  }, [externalToasts, globalToasts, dismissedIds]);

  const handleClose = useCallback(
    (id: string) => {
      setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      removeToast(id);
      onClose?.(id);
    },
    [onClose]
  );

  if (visible.length === 0) return null;

  return (
    <div className={`fixed z-[100] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0 pointer-events-none ${POSITIONS[position]}`}>
      {visible.map((item) => (
        <div key={item.id} className="pointer-events-auto w-full">
          <Toast toast={item} onClose={handleClose} />
        </div>
      ))}
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => toast.subscribe(setToasts), []);

  const addToast = useCallback((type: ToastType, message: string) => pushToast(type, message), []);
  const removeToastById = useCallback((id: string) => removeToast(id), []);

  return { toasts, addToast, removeToast: removeToastById };
};

export default toast;
