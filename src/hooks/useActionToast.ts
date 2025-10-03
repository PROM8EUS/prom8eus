/**
 * useActionToast Hook
 * Manages toast notifications for action feedback
 */

import { useState, useCallback, useRef } from 'react';
import { ActionToastProps, ToastType, ToastAction } from '@/components/ui/ActionToast';

export interface ToastOptions {
  type?: ToastType;
  action?: ToastAction;
  title: string;
  message?: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showProgress?: boolean;
  progress?: number;
  enterAnimation?: 'slide' | 'fade' | 'bounce' | 'scale';
  exitAnimation?: 'slide' | 'fade' | 'bounce' | 'scale';
  onAction?: (action: ToastAction) => void;
}

export interface UseActionToastReturn {
  toasts: ActionToastProps[];
  showToast: (options: ToastOptions) => string;
  showSuccess: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  showError: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  showWarning: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  showInfo: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  showLoading: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  updateToast: (id: string, updates: Partial<ToastOptions>) => void;
  clearToasts: () => void;
}

export const useActionToast = (): UseActionToastReturn => {
  const [toasts, setToasts] = useState<ActionToastProps[]>([]);
  const toastIdCounter = useRef(0);

  // Generate unique toast ID
  const generateToastId = useCallback(() => {
    return `toast-${++toastIdCounter.current}-${Date.now()}`;
  }, []);

  // Show a toast
  const showToast = useCallback((options: ToastOptions): string => {
    const id = generateToastId();
    const toast: ActionToastProps = {
      id,
      type: options.type || 'info',
      action: options.action,
      title: options.title,
      message: options.message,
      duration: options.duration ?? 5000,
      position: options.position || 'top-right',
      showProgress: options.showProgress ?? true,
      progress: options.progress ?? 100,
      enterAnimation: options.enterAnimation || 'slide',
      exitAnimation: options.exitAnimation || 'slide',
      onAction: options.onAction
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, [generateToastId]);

  // Show success toast
  const showSuccess = useCallback((
    title: string, 
    message?: string, 
    options: Partial<ToastOptions> = {}
  ): string => {
    return showToast({
      ...options,
      type: 'success',
      title,
      message,
      duration: options.duration ?? 3000
    });
  }, [showToast]);

  // Show error toast
  const showError = useCallback((
    title: string, 
    message?: string, 
    options: Partial<ToastOptions> = {}
  ): string => {
    return showToast({
      ...options,
      type: 'error',
      title,
      message,
      duration: options.duration ?? 7000
    });
  }, [showToast]);

  // Show warning toast
  const showWarning = useCallback((
    title: string, 
    message?: string, 
    options: Partial<ToastOptions> = {}
  ): string => {
    return showToast({
      ...options,
      type: 'warning',
      title,
      message,
      duration: options.duration ?? 5000
    });
  }, [showToast]);

  // Show info toast
  const showInfo = useCallback((
    title: string, 
    message?: string, 
    options: Partial<ToastOptions> = {}
  ): string => {
    return showToast({
      ...options,
      type: 'info',
      title,
      message,
      duration: options.duration ?? 4000
    });
  }, [showToast]);

  // Show loading toast
  const showLoading = useCallback((
    title: string, 
    message?: string, 
    options: Partial<ToastOptions> = {}
  ): string => {
    return showToast({
      ...options,
      type: 'loading',
      title,
      message,
      duration: options.duration ?? 0, // Persistent until dismissed
      showProgress: false
    });
  }, [showToast]);

  // Dismiss a specific toast
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Update a specific toast
  const updateToast = useCallback((id: string, updates: Partial<ToastOptions>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id 
        ? { ...toast, ...updates }
        : toast
    ));
  }, []);

  // Clear all toasts (alias for dismissAll)
  const clearToasts = useCallback(() => {
    dismissAll();
  }, [dismissAll]);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismissToast,
    dismissAll,
    updateToast,
    clearToasts
  };
};

// Predefined toast configurations for common actions
export const createActionToasts = {
  // Download actions
  downloadStarted: (filename: string) => ({
    type: 'info' as ToastType,
    action: 'download' as ToastAction,
    title: 'Download Started',
    message: `Downloading ${filename}...`,
    duration: 3000
  }),
  
  downloadCompleted: (filename: string) => ({
    type: 'success' as ToastType,
    action: 'download' as ToastAction,
    title: 'Download Complete',
    message: `${filename} has been downloaded successfully`,
    duration: 4000
  }),
  
  downloadFailed: (filename: string, error?: string) => ({
    type: 'error' as ToastType,
    action: 'download' as ToastAction,
    title: 'Download Failed',
    message: `Failed to download ${filename}${error ? `: ${error}` : ''}`,
    duration: 7000
  }),

  // Copy actions
  copySuccess: (content: string) => ({
    type: 'success' as ToastType,
    action: 'copy' as ToastAction,
    title: 'Copied to Clipboard',
    message: content.length > 50 ? `${content.substring(0, 50)}...` : content,
    duration: 3000
  }),
  
  copyFailed: (error?: string) => ({
    type: 'error' as ToastType,
    action: 'copy' as ToastAction,
    title: 'Copy Failed',
    message: error || 'Failed to copy to clipboard',
    duration: 5000
  }),

  // Save actions
  saveStarted: (filename: string) => ({
    type: 'info' as ToastType,
    action: 'save' as ToastAction,
    title: 'Saving...',
    message: `Saving ${filename}`,
    duration: 0 // Persistent
  }),
  
  saveCompleted: (filename: string) => ({
    type: 'success' as ToastType,
    action: 'save' as ToastAction,
    title: 'Saved Successfully',
    message: `${filename} has been saved`,
    duration: 3000
  }),
  
  saveFailed: (filename: string, error?: string) => ({
    type: 'error' as ToastType,
    action: 'save' as ToastAction,
    title: 'Save Failed',
    message: `Failed to save ${filename}${error ? `: ${error}` : ''}`,
    duration: 7000
  }),

  // Share actions
  shareSuccess: (platform: string) => ({
    type: 'success' as ToastType,
    action: 'share' as ToastAction,
    title: 'Shared Successfully',
    message: `Content shared to ${platform}`,
    duration: 3000
  }),
  
  shareFailed: (platform: string, error?: string) => ({
    type: 'error' as ToastType,
    action: 'share' as ToastAction,
    title: 'Share Failed',
    message: `Failed to share to ${platform}${error ? `: ${error}` : ''}`,
    duration: 5000
  }),

  // Delete actions
  deleteConfirm: (item: string) => ({
    type: 'warning' as ToastType,
    action: 'delete' as ToastAction,
    title: 'Delete Confirmation',
    message: `Are you sure you want to delete ${item}?`,
    duration: 0 // Persistent until action
  }),
  
  deleteCompleted: (item: string) => ({
    type: 'success' as ToastType,
    action: 'delete' as ToastAction,
    title: 'Deleted Successfully',
    message: `${item} has been deleted`,
    duration: 3000
  }),
  
  deleteFailed: (item: string, error?: string) => ({
    type: 'error' as ToastType,
    action: 'delete' as ToastAction,
    title: 'Delete Failed',
    message: `Failed to delete ${item}${error ? `: ${error}` : ''}`,
    duration: 7000
  }),

  // Upload actions
  uploadStarted: (filename: string) => ({
    type: 'info' as ToastType,
    action: 'upload' as ToastAction,
    title: 'Upload Started',
    message: `Uploading ${filename}...`,
    duration: 0 // Persistent
  }),
  
  uploadCompleted: (filename: string) => ({
    type: 'success' as ToastType,
    action: 'upload' as ToastAction,
    title: 'Upload Complete',
    message: `${filename} has been uploaded successfully`,
    duration: 4000
  }),
  
  uploadFailed: (filename: string, error?: string) => ({
    type: 'error' as ToastType,
    action: 'upload' as ToastAction,
    title: 'Upload Failed',
    message: `Failed to upload ${filename}${error ? `: ${error}` : ''}`,
    duration: 7000
  })
};

export default useActionToast;
