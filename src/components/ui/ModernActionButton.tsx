/**
 * ModernActionButton Component
 * Enhanced action buttons with loading states, success feedback, and micro-interactions
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Check, 
  X, 
  Download, 
  Copy, 
  ExternalLink, 
  Settings, 
  Eye, 
  Star, 
  Share2, 
  Heart,
  Zap,
  Play,
  Pause,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Send,
  Upload,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActionType = 
  | 'download' 
  | 'copy' 
  | 'external' 
  | 'settings' 
  | 'view' 
  | 'favorite' 
  | 'share' 
  | 'like' 
  | 'play' 
  | 'pause' 
  | 'refresh' 
  | 'next' 
  | 'add' 
  | 'remove' 
  | 'edit' 
  | 'delete' 
  | 'save' 
  | 'send' 
  | 'upload' 
  | 'search' 
  | 'filter' 
  | 'more'
  | 'custom';

export type ActionState = 'idle' | 'loading' | 'success' | 'error';

export interface ModernActionButtonProps {
  action: ActionType;
  state?: ActionState;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  successDuration?: number; // milliseconds
  errorDuration?: number; // milliseconds
  onClick?: (e: React.MouseEvent) => void | Promise<void>;
  onStateChange?: (state: ActionState) => void;
  showIcon?: boolean;
  showText?: boolean;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  // Animation props
  animateOnHover?: boolean;
  animateOnClick?: boolean;
  bounceOnSuccess?: boolean;
  pulseOnLoading?: boolean;
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

// Icon mapping for different actions
const getActionIcon = (action: ActionType, state: ActionState = 'idle') => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (action) {
    case 'download':
      return <Download {...iconProps} />;
    case 'copy':
      return <Copy {...iconProps} />;
    case 'external':
      return <ExternalLink {...iconProps} />;
    case 'settings':
      return <Settings {...iconProps} />;
    case 'view':
      return <Eye {...iconProps} />;
    case 'favorite':
      return <Star {...iconProps} />;
    case 'share':
      return <Share2 {...iconProps} />;
    case 'like':
      return <Heart {...iconProps} />;
    case 'play':
      return <Play {...iconProps} />;
    case 'pause':
      return <Pause {...iconProps} />;
    case 'refresh':
      return <RefreshCw {...iconProps} />;
    case 'next':
      return <ChevronRight {...iconProps} />;
    case 'add':
      return <Plus {...iconProps} />;
    case 'remove':
      return <Minus {...iconProps} />;
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
    case 'more':
      return <MoreHorizontal {...iconProps} />;
    default:
      return <Zap {...iconProps} />;
  }
};

// State-based icon override
const getStateIcon = (state: ActionState) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (state) {
    case 'loading':
      return <Loader2 {...iconProps} />;
    case 'success':
      return <Check {...iconProps} />;
    case 'error':
      return <X {...iconProps} />;
    default:
      return null;
  }
};

// Default text for different actions
const getActionText = (action: ActionType, state: ActionState = 'idle') => {
  switch (action) {
    case 'download':
      return state === 'success' ? 'Downloaded!' : 'Download';
    case 'copy':
      return state === 'success' ? 'Copied!' : 'Copy';
    case 'external':
      return 'Open';
    case 'settings':
      return 'Settings';
    case 'view':
      return 'View';
    case 'favorite':
      return 'Favorite';
    case 'share':
      return 'Share';
    case 'like':
      return 'Like';
    case 'play':
      return 'Play';
    case 'pause':
      return 'Pause';
    case 'refresh':
      return 'Refresh';
    case 'next':
      return 'Next';
    case 'add':
      return 'Add';
    case 'remove':
      return 'Remove';
    case 'edit':
      return 'Edit';
    case 'delete':
      return 'Delete';
    case 'save':
      return state === 'success' ? 'Saved!' : 'Save';
    case 'send':
      return 'Send';
    case 'upload':
      return 'Upload';
    case 'search':
      return 'Search';
    case 'filter':
      return 'Filter';
    case 'more':
      return 'More';
    default:
      return 'Action';
  }
};

export const ModernActionButton: React.FC<ModernActionButtonProps> = ({
  action,
  state = 'idle',
  size = 'md',
  variant = 'default',
  children,
  className,
  disabled = false,
  loading = false,
  success = false,
  error = false,
  successDuration = 2000,
  errorDuration = 3000,
  onClick,
  onStateChange,
  showIcon = true,
  showText = true,
  iconPosition = 'left',
  fullWidth = false,
  animateOnHover = true,
  animateOnClick = true,
  bounceOnSuccess = true,
  pulseOnLoading = true,
  ariaLabel,
  ariaDescription
}) => {
  const [internalState, setInternalState] = useState<ActionState>(state);
  const [isAnimating, setIsAnimating] = useState(false);

  // Update internal state based on props
  useEffect(() => {
    if (loading) {
      setInternalState('loading');
    } else if (success) {
      setInternalState('success');
    } else if (error) {
      setInternalState('error');
    } else {
      setInternalState('idle');
    }
  }, [loading, success, error]);

  // Auto-reset success/error states
  useEffect(() => {
    if (internalState === 'success' && successDuration > 0) {
      const timer = setTimeout(() => {
        setInternalState('idle');
        onStateChange?.('idle');
      }, successDuration);
      return () => clearTimeout(timer);
    }
  }, [internalState, successDuration, onStateChange]);

  useEffect(() => {
    if (internalState === 'error' && errorDuration > 0) {
      const timer = setTimeout(() => {
        setInternalState('idle');
        onStateChange?.('idle');
      }, errorDuration);
      return () => clearTimeout(timer);
    }
  }, [internalState, errorDuration, onStateChange]);

  // Handle click with state management
  const handleClick = async (e: React.MouseEvent) => {
    if (disabled || internalState === 'loading') return;

    setIsAnimating(true);
    
    try {
      setInternalState('loading');
      onStateChange?.('loading');
      
      await onClick?.(e);
      
      setInternalState('success');
      onStateChange?.('success');
    } catch (error) {
      setInternalState('error');
      onStateChange?.('error');
    } finally {
      setIsAnimating(false);
    }
  };

  // Get current icon based on state
  const currentIcon = getStateIcon(internalState) || getActionIcon(action, internalState);
  
  // Get current text
  const currentText = children || getActionText(action, internalState);

  // Size classes
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  // State-based styling
  const getStateClasses = () => {
    switch (internalState) {
      case 'loading':
        return 'cursor-wait';
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white border-green-500';
      case 'error':
        return 'bg-red-500 hover:bg-red-600 text-white border-red-500';
      default:
        return '';
    }
  };

  // Animation classes
  const getAnimationClasses = () => {
    const classes = [];
    
    if (animateOnHover) {
      classes.push('transition-all duration-200 hover:scale-105');
    }
    
    if (animateOnClick && isAnimating) {
      classes.push('scale-95');
    }
    
    if (bounceOnSuccess && internalState === 'success') {
      classes.push('animate-bounce');
    }
    
    if (pulseOnLoading && internalState === 'loading') {
      classes.push('animate-pulse');
    }
    
    return classes.join(' ');
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || internalState === 'loading'}
      onClick={handleClick}
      className={cn(
        sizeClasses[size],
        getStateClasses(),
        getAnimationClasses(),
        fullWidth && 'w-full',
        className
      )}
      aria-label={ariaLabel || getActionText(action)}
      aria-describedby={ariaDescription}
    >
      {showIcon && iconPosition === 'left' && (
        <span className={cn(
          "flex items-center",
          internalState === 'loading' && 'animate-spin',
          internalState === 'success' && 'animate-bounce',
          showText && 'mr-2'
        )}>
          {currentIcon}
        </span>
      )}
      
      {showText && (
        <span className="flex-1 text-center">
          {currentText}
        </span>
      )}
      
      {showIcon && iconPosition === 'right' && (
        <span className={cn(
          "flex items-center",
          internalState === 'loading' && 'animate-spin',
          internalState === 'success' && 'animate-bounce',
          showText && 'ml-2'
        )}>
          {currentIcon}
        </span>
      )}
    </Button>
  );
};

// Specialized button components for common actions
export const DownloadButton: React.FC<Omit<ModernActionButtonProps, 'action'>> = (props) => (
  <ModernActionButton action="download" {...props} />
);

export const CopyButton: React.FC<Omit<ModernActionButtonProps, 'action'>> = (props) => (
  <ModernActionButton action="copy" {...props} />
);

export const ExternalLinkButton: React.FC<Omit<ModernActionButtonProps, 'action'>> = (props) => (
  <ModernActionButton action="external" {...props} />
);

export const SettingsButton: React.FC<Omit<ModernActionButtonProps, 'action'>> = (props) => (
  <ModernActionButton action="settings" {...props} />
);

export const ViewButton: React.FC<Omit<ModernActionButtonProps, 'action'>> = (props) => (
  <ModernActionButton action="view" {...props} />
);

export const FavoriteButton: React.FC<Omit<ModernActionButtonProps, 'action'>> = (props) => (
  <ModernActionButton action="favorite" {...props} />
);

export const ShareButton: React.FC<Omit<ModernActionButtonProps, 'action'>> = (props) => (
  <ModernActionButton action="share" {...props} />
);

export const RefreshButton: React.FC<Omit<ModernActionButtonProps, 'action'>> = (props) => (
  <ModernActionButton action="refresh" {...props} />
);

export const SaveButton: React.FC<Omit<ModernActionButtonProps, 'action'>> = (props) => (
  <ModernActionButton action="save" {...props} />
);

export const SendButton: React.FC<Omit<ModernActionButtonProps, 'action'>> = (props) => (
  <ModernActionButton action="send" {...props} />
);

export default ModernActionButton;
