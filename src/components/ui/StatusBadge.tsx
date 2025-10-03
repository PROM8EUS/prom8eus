import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Loader2,
  Sparkles,
  Zap,
  Shield,
  Target,
  Activity,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  RefreshCw,
  Download,
  Upload,
  Copy,
  ExternalLink,
  Settings,
  Eye,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Info,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Send,
  Search,
  Filter,
  MoreHorizontal,
  Archive,
  FlaskConical,
  Building,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'error' | 'warning' | 'loading' | 'pending' | 'success' | 'info' | 'verified' | 'generated' | 'fallback' | 'ai-generated' | 'verified' | 'draft' | 'published' | 'archived' | 'deleted' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused' | 'stopped' | 'enabled' | 'disabled' | 'configured' | 'not-configured' | 'valid' | 'invalid' | 'expired' | 'upcoming' | 'trending' | 'popular' | 'new' | 'updated' | 'deprecated' | 'beta' | 'alpha' | 'stable' | 'experimental' | 'premium' | 'free' | 'pro' | 'enterprise' | 'community' | 'official' | 'third-party' | 'custom' | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  className?: string;
  // Enhanced features
  animated?: boolean;
  gradient?: boolean;
  glow?: boolean;
  pulse?: boolean;
  bounce?: boolean;
  shimmer?: boolean;
  // Smart detection
  autoDetect?: boolean;
  context?: 'workflow' | 'agent' | 'prompt' | 'task' | 'user' | 'system' | 'general';
  // Customization
  customIcon?: React.ReactNode;
  customText?: string;
  customColor?: string;
  customGradient?: string;
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
  // Interaction
  clickable?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  // Animation timing
  animationDuration?: number;
  animationDelay?: number;
}

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = false, 
  className = '',
  // Enhanced features
  animated = true,
  gradient = true,
  glow = false,
  pulse = false,
  bounce = false,
  shimmer = false,
  // Smart detection
  autoDetect = true,
  context = 'general',
  // Customization
  customIcon,
  customText,
  customColor,
  customGradient,
  // Accessibility
  ariaLabel,
  ariaDescription,
  // Interaction
  clickable = false,
  onClick,
  onHover,
  // Animation timing
  animationDuration = 300,
  animationDelay = 0
}: StatusBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Animation entrance effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  // Smart status detection with context awareness
  const getSmartStatusConfig = (status: string, context: string) => {
    const normalizedStatus = status.toLowerCase();
    
    // Context-specific status mappings
    const contextMappings = {
      workflow: {
        'verified': { icon: CheckCircle2, text: 'Verified', priority: 'success' },
        'generated': { icon: Sparkles, text: 'AI Generated', priority: 'info' },
        'fallback': { icon: AlertCircle, text: 'Fallback', priority: 'warning' },
        'draft': { icon: Edit, text: 'Draft', priority: 'secondary' },
        'published': { icon: CheckCircle, text: 'Published', priority: 'success' },
        'archived': { icon: Archive, text: 'Archived', priority: 'secondary' }
      },
      agent: {
        'active': { icon: Activity, text: 'Active', priority: 'success' },
        'idle': { icon: Pause, text: 'Idle', priority: 'secondary' },
        'busy': { icon: Loader2, text: 'Busy', priority: 'info' },
        'error': { icon: XCircle, text: 'Error', priority: 'error' },
        'offline': { icon: X, text: 'Offline', priority: 'secondary' }
      },
      prompt: {
        'optimized': { icon: Target, text: 'Optimized', priority: 'success' },
        'draft': { icon: Edit, text: 'Draft', priority: 'secondary' },
        'tested': { icon: CheckCircle, text: 'Tested', priority: 'success' },
        'needs-review': { icon: AlertTriangle, text: 'Needs Review', priority: 'warning' }
      },
      task: {
        'completed': { icon: CheckCircle, text: 'Completed', priority: 'success' },
        'in-progress': { icon: Clock, text: 'In Progress', priority: 'info' },
        'pending': { icon: Pause, text: 'Pending', priority: 'warning' },
        'cancelled': { icon: X, text: 'Cancelled', priority: 'secondary' }
      }
    };

    // Try context-specific mapping first
    if (contextMappings[context]?.[normalizedStatus]) {
      return contextMappings[context][normalizedStatus];
    }

    // Fallback to general status mapping
    switch (normalizedStatus) {
      case 'active':
      case 'aktiv':
      case 'enabled':
      case 'running':
      case 'success':
      case 'configured':
      case 'valid':
      case 'verified':
        return { icon: CheckCircle, text: 'Active', priority: 'success' };
      
      case 'inactive':
      case 'inaktiv':
      case 'disabled':
      case 'stopped':
      case 'missing':
      case 'not-configured':
      case 'not configured':
        return { icon: XCircle, text: 'Inactive', priority: 'secondary' };
      
      case 'error':
      case 'failed':
      case 'invalid':
      case 'ungültig':
      case 'fehler':
        return { icon: XCircle, text: 'Error', priority: 'error' };
      
      case 'warning':
      case 'warnung':
      case 'pending':
      case 'ausstehend':
        return { icon: AlertTriangle, text: 'Warning', priority: 'warning' };
      
      case 'loading':
      case 'laden':
      case 'processing':
      case 'verarbeitung':
      case 'busy':
        return { icon: Loader2, text: 'Loading', priority: 'info' };
      
      case 'info':
      case 'information':
        return { icon: Info, text: 'Info', priority: 'info' };
      
      case 'ai-generated':
      case 'generated':
        return { icon: Sparkles, text: 'AI Generated', priority: 'info' };
      
      case 'fallback':
        return { icon: AlertCircle, text: 'Fallback', priority: 'warning' };
      
      case 'draft':
        return { icon: Edit, text: 'Draft', priority: 'secondary' };
      
      case 'published':
        return { icon: CheckCircle, text: 'Published', priority: 'success' };
      
      case 'archived':
        return { icon: Archive, text: 'Archived', priority: 'secondary' };
      
      case 'deleted':
        return { icon: Trash2, text: 'Deleted', priority: 'error' };
      
      case 'scheduled':
        return { icon: Clock, text: 'Scheduled', priority: 'info' };
      
      case 'completed':
        return { icon: CheckCircle, text: 'Completed', priority: 'success' };
      
      case 'cancelled':
        return { icon: X, text: 'Cancelled', priority: 'secondary' };
      
      case 'paused':
        return { icon: Pause, text: 'Paused', priority: 'warning' };
      
      case 'expired':
        return { icon: Clock, text: 'Expired', priority: 'warning' };
      
      case 'upcoming':
        return { icon: TrendingUp, text: 'Upcoming', priority: 'info' };
      
      case 'trending':
        return { icon: TrendingUp, text: 'Trending', priority: 'success' };
      
      case 'popular':
        return { icon: Star, text: 'Popular', priority: 'success' };
      
      case 'new':
        return { icon: Plus, text: 'New', priority: 'info' };
      
      case 'updated':
        return { icon: RefreshCw, text: 'Updated', priority: 'info' };
      
      case 'deprecated':
        return { icon: AlertTriangle, text: 'Deprecated', priority: 'warning' };
      
      case 'beta':
        return { icon: Zap, text: 'Beta', priority: 'info' };
      
      case 'alpha':
        return { icon: Zap, text: 'Alpha', priority: 'warning' };
      
      case 'stable':
        return { icon: Shield, text: 'Stable', priority: 'success' };
      
      case 'experimental':
        return { icon: FlaskConical, text: 'Experimental', priority: 'warning' };
      
      case 'premium':
        return { icon: Star, text: 'Premium', priority: 'success' };
      
      case 'free':
        return { icon: Heart, text: 'Free', priority: 'info' };
      
      case 'pro':
        return { icon: Zap, text: 'Pro', priority: 'success' };
      
      case 'enterprise':
        return { icon: Building, text: 'Enterprise', priority: 'success' };
      
      case 'community':
        return { icon: Users, text: 'Community', priority: 'info' };
      
      case 'official':
        return { icon: Shield, text: 'Official', priority: 'success' };
      
      case 'third-party':
        return { icon: ExternalLink, text: 'Third Party', priority: 'secondary' };
      
      case 'custom':
        return { icon: Settings, text: 'Custom', priority: 'info' };
      
      default:
        return { icon: Clock, text: status, priority: 'secondary' };
    }
  };

  const statusConfig = autoDetect ? getSmartStatusConfig(status, context) : {
    icon: customIcon || Clock,
    text: customText || status,
    priority: 'secondary' as const
  };

  const Icon = statusConfig.icon;

  // Priority-based styling with gradients and animations
  const getPriorityStyles = (priority: string) => {
    const baseStyles = {
      success: {
        gradient: 'bg-gradient-to-r from-green-500 to-emerald-500',
        glow: 'shadow-green-500/50',
        text: 'text-white',
        border: 'border-green-500/20',
        pulse: 'animate-pulse',
        shimmer: 'bg-gradient-to-r from-green-400 via-green-500 to-emerald-500'
      },
      error: {
        gradient: 'bg-gradient-to-r from-red-500 to-rose-500',
        glow: 'shadow-red-500/50',
        text: 'text-white',
        border: 'border-red-500/20',
        pulse: 'animate-pulse',
        shimmer: 'bg-gradient-to-r from-red-400 via-red-500 to-rose-500'
      },
      warning: {
        gradient: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        glow: 'shadow-yellow-500/50',
        text: 'text-white',
        border: 'border-yellow-500/20',
        pulse: 'animate-pulse',
        shimmer: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500'
      },
      info: {
        gradient: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        glow: 'shadow-blue-500/50',
        text: 'text-white',
        border: 'border-blue-500/20',
        pulse: 'animate-pulse',
        shimmer: 'bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500'
      },
      secondary: {
        gradient: 'bg-gradient-to-r from-gray-500 to-slate-500',
        glow: 'shadow-gray-500/50',
        text: 'text-white',
        border: 'border-gray-500/20',
        pulse: 'animate-pulse',
        shimmer: 'bg-gradient-to-r from-gray-400 via-gray-500 to-slate-500'
      }
    };

    return baseStyles[priority] || baseStyles.secondary;
  };

  const priorityStyles = getPriorityStyles(statusConfig.priority);

  // Size classes with enhanced styling
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 h-5',
    md: 'text-sm px-2.5 py-1.5 h-6',
    lg: 'text-base px-3 py-2 h-7',
    xl: 'text-lg px-4 py-2.5 h-8'
  };

  // Animation classes
  const animationClasses = cn(
    'transition-all duration-300 ease-in-out',
    animated && 'transform-gpu',
    isVisible && 'opacity-100 scale-100',
    !isVisible && 'opacity-0 scale-95',
    isHovered && clickable && 'scale-105',
    bounce && 'animate-bounce',
    pulse && priorityStyles.pulse,
    shimmer && 'animate-pulse',
    Icon === Loader2 && 'animate-spin'
  );

  // Gradient and glow effects
  const effectClasses = cn(
    gradient && priorityStyles.gradient,
    !gradient && 'bg-white border border-gray-200',
    glow && `shadow-lg ${priorityStyles.glow}`,
    priorityStyles.text,
    priorityStyles.border
  );

  // Shimmer effect
  const shimmerEffect = shimmer ? (
    <div className={cn(
      'absolute inset-0 rounded-full opacity-75',
      priorityStyles.shimmer,
      'animate-pulse'
    )} />
  ) : null;

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'relative overflow-hidden',
        sizeClasses[size],
        effectClasses,
        animationClasses,
        clickable && 'cursor-pointer hover:shadow-lg',
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel || statusConfig.text}
      aria-describedby={ariaDescription}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {shimmerEffect}
      
      <div className="relative flex items-center space-x-1">
        {showIcon && (
          <Icon 
            className={cn(
              'flex-shrink-0',
              size === 'sm' && 'w-3 h-3',
              size === 'md' && 'w-3 h-3',
              size === 'lg' && 'w-4 h-4',
              size === 'xl' && 'w-4 h-4',
              Icon === Loader2 && 'animate-spin'
            )} 
          />
        )}
        <span className="font-medium truncate">
          {statusConfig.text}
        </span>
      </div>
    </Badge>
  );
}

// Enhanced convenience components with modern features
export function ActiveBadge({ 
  size = 'md', 
  className = '',
  animated = true,
  gradient = true,
  glow = false
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
  animated?: boolean;
  gradient?: boolean;
  glow?: boolean;
}) {
  return (
    <StatusBadge 
      status="active" 
      size={size} 
      className={className}
      animated={animated}
      gradient={gradient}
      glow={glow}
      showIcon={true}
    />
  );
}

export function InactiveBadge({ 
  size = 'md', 
  className = '',
  animated = true,
  gradient = true
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
  animated?: boolean;
  gradient?: boolean;
}) {
  return (
    <StatusBadge 
      status="inactive" 
      size={size} 
      className={className}
      animated={animated}
      gradient={gradient}
      showIcon={true}
    />
  );
}

export function ErrorBadge({ 
  size = 'md', 
  className = '',
  animated = true,
  gradient = true,
  pulse = true
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
  animated?: boolean;
  gradient?: boolean;
  pulse?: boolean;
}) {
  return (
    <StatusBadge 
      status="error" 
      size={size} 
      className={className}
      animated={animated}
      gradient={gradient}
      pulse={pulse}
      showIcon={true}
    />
  );
}

export function WarningBadge({ 
  size = 'md', 
  className = '',
  animated = true,
  gradient = true,
  shimmer = true
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
  animated?: boolean;
  gradient?: boolean;
  shimmer?: boolean;
}) {
  return (
    <StatusBadge 
      status="warning" 
      size={size} 
      className={className}
      animated={animated}
      gradient={gradient}
      shimmer={shimmer}
      showIcon={true}
    />
  );
}

export function LoadingBadge({ 
  size = 'md', 
  className = '',
  animated = true,
  gradient = true,
  bounce = true
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
  animated?: boolean;
  gradient?: boolean;
  bounce?: boolean;
}) {
  return (
    <StatusBadge 
      status="loading" 
      size={size} 
      className={className}
      animated={animated}
      gradient={gradient}
      bounce={bounce}
      showIcon={true}
    />
  );
}

// New enhanced convenience components
export function SuccessBadge({ 
  size = 'md', 
  className = '',
  animated = true,
  gradient = true,
  glow = true
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
  animated?: boolean;
  gradient?: boolean;
  glow?: boolean;
}) {
  return (
    <StatusBadge 
      status="success" 
      size={size} 
      className={className}
      animated={animated}
      gradient={gradient}
      glow={glow}
      showIcon={true}
    />
  );
}

export function InfoBadge({ 
  size = 'md', 
  className = '',
  animated = true,
  gradient = true
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
  animated?: boolean;
  gradient?: boolean;
}) {
  return (
    <StatusBadge 
      status="info" 
      size={size} 
      className={className}
      animated={animated}
      gradient={gradient}
      showIcon={true}
    />
  );
}

export function VerifiedBadge({ 
  size = 'md', 
  className = '',
  animated = true,
  gradient = true,
  glow = true,
  context = 'workflow'
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
  animated?: boolean;
  gradient?: boolean;
  glow?: boolean;
  context?: 'workflow' | 'agent' | 'prompt' | 'task' | 'user' | 'system' | 'general';
}) {
  return (
    <StatusBadge 
      status="verified" 
      size={size} 
      className={className}
      animated={animated}
      gradient={gradient}
      glow={glow}
      context={context}
      showIcon={true}
    />
  );
}

export function GeneratedBadge({ 
  size = 'md', 
  className = '',
  animated = true,
  gradient = true,
  shimmer = true,
  context = 'workflow'
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
  animated?: boolean;
  gradient?: boolean;
  shimmer?: boolean;
  context?: 'workflow' | 'agent' | 'prompt' | 'task' | 'user' | 'system' | 'general';
}) {
  return (
    <StatusBadge 
      status="generated" 
      size={size} 
      className={className}
      animated={animated}
      gradient={gradient}
      shimmer={shimmer}
      context={context}
      showIcon={true}
    />
  );
}

export function FallbackBadge({ 
  size = 'md', 
  className = '',
  animated = true,
  gradient = true,
  context = 'workflow'
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
  animated?: boolean;
  gradient?: boolean;
  context?: 'workflow' | 'agent' | 'prompt' | 'task' | 'user' | 'system' | 'general';
}) {
  return (
    <StatusBadge 
      status="fallback" 
      size={size} 
      className={className}
      animated={animated}
      gradient={gradient}
      context={context}
      showIcon={true}
    />
  );
}
