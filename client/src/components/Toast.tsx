import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />,
  };

  const bgClasses = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgClasses[toast.type]} shadow-sm`}
    >
      {icons[toast.type]}
      <p className="text-sm text-gray-700 flex-1">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="p-1 hover:bg-gray-100 rounded">
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts?: ToastMessage[];
  onClose?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts: externalToasts, onClose }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>(externalToasts || []);

  React.useEffect(() => {
    const unsubscribe = toast.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toastItem) => (
        <Toast
          key={toastItem.id}
          toast={toastItem}
          onClose={onClose || ((id) => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
          })}
        />
      ))}
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
};

// Global state for toast notifications
let globalToasts: ToastMessage[] = [];
let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];

export const toast = {
  success: (message: string) => {
    const id = Date.now().toString();
    globalToasts = [...globalToasts, { id, type: 'success', message }];
    toastListeners.forEach((listener) => listener(globalToasts));
    setTimeout(() => {
      globalToasts = globalToasts.filter((t) => t.id !== id);
      toastListeners.forEach((listener) => listener(globalToasts));
    }, 5000);
  },
  error: (message: string) => {
    const id = Date.now().toString();
    globalToasts = [...globalToasts, { id, type: 'error', message }];
    toastListeners.forEach((listener) => listener(globalToasts));
    setTimeout(() => {
      globalToasts = globalToasts.filter((t) => t.id !== id);
      toastListeners.forEach((listener) => listener(globalToasts));
    }, 5000);
  },
  info: (message: string) => {
    const id = Date.now().toString();
    globalToasts = [...globalToasts, { id, type: 'info', message }];
    toastListeners.forEach((listener) => listener(globalToasts));
    setTimeout(() => {
      globalToasts = globalToasts.filter((t) => t.id !== id);
      toastListeners.forEach((listener) => listener(globalToasts));
    }, 5000);
  },
  addToast: (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    globalToasts = [...globalToasts, { id, type, message }];
    toastListeners.forEach((listener) => listener(globalToasts));
    setTimeout(() => {
      globalToasts = globalToasts.filter((t) => t.id !== id);
      toastListeners.forEach((listener) => listener(globalToasts));
    }, 5000);
  },
  subscribe: (listener: (toasts: ToastMessage[]) => void) => {
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  },
};
