import { toast } from '../components/Toast';

export const getApiErrorMessage = (error: any, fallback = 'Something went wrong. Please try again.'): string => {

  const response = error?.response;
  if (response) {
    const data = response.data;

    if (data && typeof data === 'object' && !(data instanceof Blob)) {
      if (typeof data.message === 'string' && data.message.trim()) return data.message;
      if (Array.isArray(data.errors) && data.errors[0]?.message) return data.errors[0].message;
    }

    switch (response.status) {
      case 400:
        return 'Some of the details are invalid. Please check and try again.';
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return "You don't have permission to do this.";
      case 404:
        return 'That item could not be found.';
      case 409:
        return 'This conflicts with something that already exists.';
      case 413:
        return 'That file is too large to upload.';
      case 429:
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        if (response.status >= 500) return 'The server ran into a problem. Please try again shortly.';
    }
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check your connection and try again.';
  }

  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }

  if (typeof error?.message === 'string' && error.message && error.message !== 'Network Error') {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) return error;

  return fallback;
};

export const notifyApiError = (error: any, fallback?: string): string => {
  const message = getApiErrorMessage(error, fallback);
  toast.error(message);
  return message;
};
