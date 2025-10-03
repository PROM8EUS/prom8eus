/**
 * ActionToast Component
 * Toast notifications for action feedback with smooth animations
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  X, 
  AlertCircle, 
  Info, 
  Loader2, 
  Download, 
  Copy, 
  Share2, 
  Settings,
  Star,
  Heart,
  Eye,
  Edit,
  Trash2,
  Save,
  Send,
  Upload,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export type ToastAction = 
  | 'download' 
  | 'copy' 
  | 'share' 
  | 'settings' 
  | 'favorite' 
  | 'like' 
  | 'view' 
  | 'edit' 
  | 'delete' 
  | 'save' 
  | 'send' 
  | 'upload' 
  | 'search' 
  | 'filter'
  | 'custom';

export interface ActionToastProps {
  id: string;
  type: ToastType;
  action?: ToastAction;
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = persistent
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
  onClose?: (id: string) => void;
  onAction?: (action: ToastAction) => void;
  showProgress?: boolean;
  progress?: number; // 0-100
  // Animation props
  enterAnimation?: 'slide' | 'fade' | 'bounce' | 'scale';
  exitAnimation?: 'slide' | 'fade' | 'bounce' | 'scale';
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

// Icon mapping for different actions
const getActionIcon = (action: ToastAction) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (action) {
    case 'download':
      return <Download {...iconProps} />;
    case 'copy':
      return <Copy {...iconProps} />;
    case 'share':
      return <Share2 {...iconProps} />;
    case 'settings':
      return <Settings {...iconProps} />;
    case 'favorite':
      return <Star {...iconProps} />;
    case 'like':
      return <Heart {...iconProps} />;
    case 'view':
      return <Eye {...iconProps} />;
    case 'edit':
      return <Edit {...iconProps} />;
    case 'delete':
      return <Trash2 {...iconProps} />;
    case 'save':
      return <Save {...iconProps} />;
    case 'send':
      return <Send {...iconProps} />;
    case 'upload':
      return <Upload {...iconProps} />;
    case 'search':
      return <Search {...iconProps} />;
    case 'filter':
      return <Filter {...iconProps} />;
    default:
      return null;
  }
};

// Type-based icon
const getTypeIcon = (type: ToastType) => {
  const iconProps = { className: "h-5 w-5" };
  
  switch (type) {
    case 'success':
      return <Check {...iconProps} />;
    case 'error':
      return <X {...iconProps} />;
    case 'warning':
      return <AlertCircle {...iconProps} />;
    case 'info':
      return <Info {...iconProps} />;
    case 'loading':
      return <Loader2 {...iconProps} className="h-5 w-5 animate-spin" />;
    default:
      return <Info {...iconProps} />;
  }
};

// Type-based styling
const getTypeStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        container: 'bg-green-50 border-green-200 text-green-800',
        icon: 'text-green-500',
        progress: 'bg-green-500'
      };
    case 'error':
      return {
        container: 'bg-red-50 border-red-200 text-red-800',
        icon: 'text-red-500',
        progress: 'bg-red-500'
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: 'text-yellow-500',
        progress: 'bg-yellow-500'
      };
    case 'info':
      return {
        container: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: 'text-blue-500',
        progress: 'bg-blue-500'
      };
    case 'loading':
      return {
        container: 'bg-gray-50 border-gray-200 text-gray-800',
        icon: 'text-gray-500',
        progress: 'bg-gray-500'
      };
    default:
      return {
        container: 'bg-gray-50 border-gray-200 text-gray-800',
        icon: 'text-gray-500',
        progress: 'bg-gray-500'
      };
  }
};

// Animation classes
const getAnimationClasses = (enterAnimation: string, exitAnimation: string, isVisible: boolean) => {
  const baseClasses = 'transition-all duration-300 ease-in-out';
  
  if (isVisible) {
    switch (enterAnimation) {
      case 'slide':
        return `${baseClasses} translate-x-0 opacity-100`;
      case 'fade':
        return `${baseClasses} opacity-100`;
      case 'bounce':
        return `${baseClasses} scale-100 opacity-100`;
      case 'scale':
        return `${baseClasses} scale-100 opacity-100`;
      default:
        return `${baseClasses} translate-x-0 opacity-100`;
    }
  } else {
    switch (exitAnimation) {
      case 'slide':
        return `${baseClasses} translate-x-full opacity-0`;
      case 'fade':
        return `${baseClasses} opacity-0`;
      case 'bounce':
        return `${baseClasses} scale-95 opacity-0`;
      case 'scale':
        return `${baseClasses} scale-95 opacity-0`;
      default:
        return `${baseClasses} translate-x-full opacity-0`;
    }
  }
};

export const ActionToast: React.FC<ActionToastProps> = ({
  id,
  type,
  action,
  title,
  message,
  duration = 5000,
  position = 'top-right',
  className,
  onClose,
  onAction,
  showProgress = true,
  progress = 100,
  enterAnimation = 'slide',
  exitAnimation = 'slide',
  ariaLabel,
  ariaDescription
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(100);
  const toastRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss timer
  useEffect(() => {
    if (duration > 0 && isVisible && !isExiting) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, isVisible, isExiting]);

  // Progress animation
  useEffect(() => {
    if (showProgress && duration > 0 && isVisible && !isExiting) {
      const startTime = Date.now();
      const startProgress = 100;
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const newProgress = (remaining / duration) * 100;
        
        setCurrentProgress(newProgress);
        
        if (newProgress > 0 && isVisible && !isExiting) {
          requestAnimationFrame(updateProgress);
        }
      };
      
      requestAnimationFrame(updateProgress);
    }
  }, [showProgress, duration, isVisible, isExiting]);

  const handleClose = () => {
    if (isExiting) return;
    
    setIsExiting(true);
    setIsVisible(false);
    
    setTimeout(() => {
      onClose?.(id);
    }, 300); // Match animation duration
  };

  const handleAction = () => {
    if (action) {
      onAction?.(action);
    }
  };

  const typeStyles = getTypeStyles(type);
  const animationClasses = getAnimationClasses(enterAnimation, exitAnimation, isVisible);

  return (
    <div
      ref={toastRef}
      className={cn(
        'relative max-w-sm w-full bg-white rounded-lg shadow-lg border p-4',
        'backdrop-blur-sm bg-white/95',
        typeStyles.container,
        animationClasses,
        className
      )}
      role="alert"
      aria-live="polite"
      aria-label={ariaLabel || title}
      aria-describedby={ariaDescription}
    >
      {/* Progress bar */}
      {showProgress && duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <div
            ref={progressRef}
            className={cn(
              'h-full transition-all duration-100 ease-linear',
              typeStyles.progress
            )}
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0', typeStyles.icon)}>
          {action ? getActionIcon(action) : getTypeIcon(type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {title}
          </h4>
          {message && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Action button (if applicable) */}
      {action && onAction && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={handleAction}
            className={cn(
              'text-sm font-medium transition-colors',
              typeStyles.icon,
              'hover:underline'
            )}
          >
            {action === 'copy' ? 'View Details' : 
             action === 'download' ? 'Open File' :
             action === 'share' ? 'Share Again' :
             'Learn More'}
          </button>
        </div>
      )}
    </div>
  );
};

// Toast container component
export interface ToastContainerProps {
  toasts: ActionToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
  className?: string;
  onToastClose?: (id: string) => void;
  onToastAction?: (action: ToastAction) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  maxToasts = 5,
  className,
  onToastClose,
  onToastAction
}) => {
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  // Limit number of toasts
  const visibleToasts = toasts.slice(0, maxToasts);

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2',
        positionClasses[position],
        className
      )}
    >
      {visibleToasts.map((toast, index) => (
        <ActionToast
          key={toast.id}
          {...toast}
          onClose={onToastClose}
          onAction={onToastAction}
        />
      ))}
    </div>
  );
};

export default ActionToast;
