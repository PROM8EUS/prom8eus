/**
 * ComplexityIndicator Component
 * Visual complexity indicators with modern design patterns and animations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Zap, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Gauge,
  Timer,
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarHeart,
  CalendarStar,
  Edit3,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Share2,
  Copy,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Diamond,
  Heart,
  Star,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Award,
  Trophy,
  Medal,
  Crown,
  Gem,
  Coins,
  Banknote,
  CreditCard,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComplexityIndicatorProps {
  complexity: 'Low' | 'Medium' | 'High';
  value?: number;
  maxValue?: number;
  // Display options
  showLabel?: boolean;
  showIcon?: boolean;
  showProgress?: boolean;
  showTooltip?: boolean;
  showAnimation?: boolean;
  // Styling
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'compact' | 'minimal' | 'detailed';
  // Behavior
  interactive?: boolean;
  clickable?: boolean;
  // Context
  lang?: 'de' | 'en';
  // Callbacks
  onClick?: () => void;
  onHover?: () => void;
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

export const ComplexityIndicator: React.FC<ComplexityIndicatorProps> = ({
  complexity,
  value,
  maxValue = 100,
  // Display options
  showLabel = true,
  showIcon = true,
  showProgress = true,
  showTooltip = true,
  showAnimation = true,
  // Styling
  className,
  size = 'md',
  variant = 'default',
  // Behavior
  interactive = false,
  clickable = false,
  // Context
  lang = 'en',
  // Callbacks
  onClick,
  onHover,
  // Accessibility
  ariaLabel,
  ariaDescription
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get complexity configuration
  const getComplexityConfig = useCallback(() => {
    const configs = {
      Low: {
        label: lang === 'de' ? 'Niedrig' : 'Low',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        progressColor: 'bg-green-500',
        icon: <CheckCircle className="h-4 w-4" />,
        description: lang === 'de' ? 'Einfache Einrichtung' : 'Easy setup',
        value: 25
      },
      Medium: {
        label: lang === 'de' ? 'Mittel' : 'Medium',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        progressColor: 'bg-yellow-500',
        icon: <AlertCircle className="h-4 w-4" />,
        description: lang === 'de' ? 'Moderate Einrichtung' : 'Moderate setup',
        value: 50
      },
      High: {
        label: lang === 'de' ? 'Hoch' : 'High',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        progressColor: 'bg-red-500',
        icon: <AlertCircle className="h-4 w-4" />,
        description: lang === 'de' ? 'Komplexe Einrichtung' : 'Complex setup',
        value: 75
      }
    };
    return configs[complexity];
  }, [complexity, lang]);

  // Get size classes
  const getSizeClasses = useCallback(() => {
    const sizes = {
      sm: {
        container: 'text-xs',
        badge: 'text-xs px-2 py-1',
        icon: 'h-3 w-3',
        progress: 'h-1'
      },
      md: {
        container: 'text-sm',
        badge: 'text-sm px-2.5 py-1.5',
        icon: 'h-4 w-4',
        progress: 'h-2'
      },
      lg: {
        container: 'text-base',
        badge: 'text-base px-3 py-2',
        icon: 'h-5 w-5',
        progress: 'h-3'
      },
      xl: {
        container: 'text-lg',
        badge: 'text-lg px-4 py-2.5',
        icon: 'h-6 w-6',
        progress: 'h-4'
      }
    };
    return sizes[size];
  }, [size]);

  // Get variant classes
  const getVariantClasses = useCallback(() => {
    const variants = {
      default: 'p-3 space-y-2',
      compact: 'p-2 space-y-1',
      minimal: 'p-1 space-y-1',
      detailed: 'p-4 space-y-3'
    };
    return variants[variant];
  }, [variant]);

  // Calculate progress value
  const progressValue = useMemo(() => {
    if (value !== undefined) {
      return Math.min((value / maxValue) * 100, 100);
    }
    return getComplexityConfig().value;
  }, [value, maxValue, getComplexityConfig]);

  // Handle click
  const handleClick = useCallback(() => {
    if (clickable && onClick) {
      onClick();
    }
  }, [clickable, onClick]);

  // Handle hover
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHover?.();
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Animation effect
  useEffect(() => {
    if (showAnimation) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation, complexity]);

  const config = getComplexityConfig();
  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative transition-all duration-300',
              config.bgColor,
              config.borderColor,
              'border rounded-lg',
              variantClasses,
              clickable && 'cursor-pointer hover:shadow-md',
              isHovered && 'scale-105',
              isAnimating && 'animate-pulse',
              className
            )}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label={ariaLabel || config.label}
            aria-describedby={ariaDescription}
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              {showIcon && (
                <div className={cn('flex-shrink-0', config.color)}>
                  {config.icon}
                </div>
              )}
              
              {showLabel && (
                <div className="flex-1">
                  <div className={cn('font-medium', config.color, sizeClasses.container)}>
                    {config.label}
                  </div>
                  {variant === 'detailed' && (
                    <div className="text-xs text-muted-foreground">
                      {config.description}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {showProgress && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    {lang === 'de' ? 'Komplexität' : 'Complexity'}
                  </span>
                  <span className={cn('font-medium', config.color)}>
                    {Math.round(progressValue)}%
                  </span>
                </div>
                
                <div className={cn('bg-muted rounded-full overflow-hidden', sizeClasses.progress)}>
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-1000 ease-out',
                      config.progressColor
                    )}
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            )}

            {/* Value Display */}
            {value !== undefined && variant === 'detailed' && (
              <div className="text-center">
                <div className={cn('font-bold', config.color, sizeClasses.container)}>
                  {value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lang === 'de' ? 'von' : 'of'} {maxValue}
                </div>
              </div>
            )}

            {/* Hover Effect */}
            {isHovered && interactive && (
              <div className="absolute inset-0 bg-white/20 rounded-lg pointer-events-none" />
            )}
          </div>
        </TooltipTrigger>
        
        {showTooltip && (
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium">{config.label}</div>
              <div className="text-sm text-muted-foreground">
                {config.description}
              </div>
              {value !== undefined && (
                <div className="text-xs text-muted-foreground">
                  {lang === 'de' ? 'Wert' : 'Value'}: {value} / {maxValue}
                </div>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

// Specialized complexity indicators
export const WorkflowComplexityIndicator: React.FC<Omit<ComplexityIndicatorProps, 'complexity'> & {
  workflow: {
    complexity: 'Low' | 'Medium' | 'High';
    nodes: number;
    integrations: string[];
  };
}> = ({ workflow, ...props }) => {
  return (
    <ComplexityIndicator
      {...props}
      complexity={workflow.complexity}
      value={workflow.nodes}
      maxValue={50}
      ariaLabel={`Workflow complexity: ${workflow.complexity}`}
      ariaDescription={`${workflow.nodes} nodes, ${workflow.integrations.length} integrations`}
    />
  );
};

export const AgentComplexityIndicator: React.FC<Omit<ComplexityIndicatorProps, 'complexity'> & {
  agent: {
    complexity: 'Low' | 'Medium' | 'High';
    functions: number;
    tools: number;
  };
}> = ({ agent, ...props }) => {
  return (
    <ComplexityIndicator
      {...props}
      complexity={agent.complexity}
      value={agent.functions + agent.tools}
      maxValue={20}
      ariaLabel={`Agent complexity: ${agent.complexity}`}
      ariaDescription={`${agent.functions} functions, ${agent.tools} tools`}
    />
  );
};

export default ComplexityIndicator;
