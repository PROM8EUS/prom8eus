/**
 * HourlyRateEditor Component
 * Specialized inline editor for hourly rates with smooth transitions and validation feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import { InlineEditCurrency } from './InlineEdit';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Target,
  Zap,
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

export interface HourlyRateEditorProps {
  value: number;
  onChange: (value: number) => void;
  onSave?: (value: number) => void;
  onCancel?: () => void;
  // Display options
  showLabel?: boolean;
  showIcon?: boolean;
  showTooltip?: boolean;
  showValidation?: boolean;
  showSuccess?: boolean;
  showError?: boolean;
  // Styling
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'minimal' | 'detailed';
  // Behavior
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  // Validation
  min?: number;
  max?: number;
  step?: number;
  // Visual feedback
  showTrends?: boolean;
  showComparison?: boolean;
  showInsights?: boolean;
  // Context
  period?: 'year' | 'month' | 'week' | 'day';
  lang?: 'de' | 'en';
  // Callbacks
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onValidationChange?: (isValid: boolean, message?: string) => void;
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

export const HourlyRateEditor: React.FC<HourlyRateEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  // Display options
  showLabel = true,
  showIcon = true,
  showTooltip = true,
  showValidation = true,
  showSuccess = true,
  showError = true,
  // Styling
  className,
  size = 'md',
  variant = 'default',
  // Behavior
  disabled = false,
  readOnly = false,
  autoFocus = false,
  // Validation
  min = 0,
  max = 1000,
  step = 1,
  // Visual feedback
  showTrends = false,
  showComparison = false,
  showInsights = false,
  // Context
  period = 'month',
  lang = 'en',
  // Callbacks
  onEditStart,
  onEditEnd,
  onValidationChange,
  // Accessibility
  ariaLabel,
  ariaDescription
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  const [showFeedback, setShowFeedback] = useState(false);

  // Size-based styling
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'text-xs',
          label: 'text-xs',
          value: 'text-sm',
          icon: 'h-3 w-3'
        };
      case 'lg':
        return {
          container: 'text-base',
          label: 'text-sm',
          value: 'text-lg',
          icon: 'h-5 w-5'
        };
      default:
        return {
          container: 'text-sm',
          label: 'text-xs',
          value: 'text-sm',
          icon: 'h-4 w-4'
        };
    }
  };

  // Variant-based styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'px-2 py-1';
      case 'minimal':
        return 'px-1 py-0.5';
      case 'detailed':
        return 'px-4 py-2';
      default:
        return 'px-3 py-1.5';
    }
  };

  // Validation function
  const validateValue = useCallback((val: number) => {
    if (val < min) {
      return { isValid: false, message: `Minimum value is ${min}€` };
    }
    if (val > max) {
      return { isValid: false, message: `Maximum value is ${max}€` };
    }
    if (isNaN(val)) {
      return { isValid: false, message: 'Please enter a valid number' };
    }
    return { isValid: true };
  }, [min, max]);

  // Handle validation change
  const handleValidationChange = useCallback((isValid: boolean, message?: string) => {
    setValidation({ isValid, message });
    onValidationChange?.(isValid, message);
  }, [onValidationChange]);

  // Handle edit start
  const handleEditStart = useCallback(() => {
    setIsEditing(true);
    setValidation({ isValid: true });
    onEditStart?.();
  }, [onEditStart]);

  // Handle edit end
  const handleEditEnd = useCallback(() => {
    setIsEditing(false);
    setShowFeedback(true);
    onEditEnd?.();
    
    // Hide feedback after delay
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  }, [onEditEnd]);

  // Handle save
  const handleSave = useCallback((newValue: number) => {
    const validationResult = validateValue(newValue);
    setValidation(validationResult);
    
    if (validationResult.isValid) {
      onChange(newValue);
      onSave?.(newValue);
      handleEditEnd();
    }
  }, [validateValue, onChange, onSave, handleEditEnd]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setValidation({ isValid: true });
    onCancel?.();
    handleEditEnd();
  }, [onCancel, handleEditEnd]);

  // Get period label
  const getPeriodLabel = () => {
    const labels = {
      year: lang === 'de' ? 'Jahr' : 'year',
      month: lang === 'de' ? 'Monat' : 'month',
      week: lang === 'de' ? 'Woche' : 'week',
      day: lang === 'de' ? 'Tag' : 'day'
    };
    return labels[period];
  };

  // Get label text
  const getLabelText = () => {
    if (lang === 'de') {
      return 'Stundensatz';
    }
    return 'Hourly Rate';
  };

  // Get tooltip content
  const getTooltipContent = () => {
    if (lang === 'de') {
      return 'Klicken Sie hier, um den Stundensatz zu bearbeiten. Dieser wird für ROI-Berechnungen verwendet.';
    }
    return 'Click here to edit the hourly rate. This is used for ROI calculations.';
  };

  // Get insights
  const getInsights = () => {
    if (!showInsights) return null;
    
    const insights = [];
    
    if (value < 30) {
      insights.push(lang === 'de' ? 'Niedrige Rate' : 'Low Rate');
    } else if (value > 100) {
      insights.push(lang === 'de' ? 'Hohe Rate' : 'High Rate');
    } else {
      insights.push(lang === 'de' ? 'Durchschnittliche Rate' : 'Average Rate');
    }
    
    return insights;
  };

  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();
  const insights = getInsights();

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and Icon */}
      {showLabel && (
        <div className="flex items-center gap-2">
          {showIcon && (
            <div className="p-1 bg-primary/10 rounded">
              <DollarSign className={cn('text-primary', sizeClasses.icon)} />
            </div>
          )}
          <span className={cn('font-medium text-foreground', sizeClasses.label)}>
            {getLabelText()}
          </span>
          {showTooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className={cn('text-muted-foreground cursor-help', sizeClasses.icon)} />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{getTooltipContent()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Main Editor */}
      <div className="flex items-center gap-2">
        <InlineEditCurrency
          value={value}
          onChange={handleSave}
          onSave={handleSave}
          onCancel={handleCancel}
          onValidate={validateValue}
          onEditStart={handleEditStart}
          onEditEnd={handleEditEnd}
          onValidationChange={handleValidationChange}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          min={min}
          max={max}
          step={step}
          showValidation={showValidation}
          showSuccess={showSuccess}
          showError={showError}
          className={cn(
            'transition-all duration-200',
            showFeedback && validation.isValid && 'bg-green-50 border-green-200',
            showFeedback && !validation.isValid && 'bg-red-50 border-red-200'
          )}
          ariaLabel={ariaLabel || getLabelText()}
          ariaDescription={ariaDescription}
        />
        
        <span className={cn('text-muted-foreground', sizeClasses.label)}>
          /h
        </span>
      </div>

      {/* Validation Message */}
      {validation.message && (
        <div className={cn(
          'text-xs transition-all duration-200',
          validation.isValid ? 'text-green-600' : 'text-red-600'
        )}>
          {validation.message}
        </div>
      )}

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {insights.map((insight, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs"
            >
              {insight}
            </Badge>
          ))}
        </div>
      )}

      {/* Trends */}
      {showTrends && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>
            {lang === 'de' 
              ? `Durchschnittliche Rate: 65€/h`
              : `Average rate: 65€/h`
            }
          </span>
        </div>
      )}

      {/* Comparison */}
      {showComparison && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">
              {lang === 'de' ? 'Min' : 'Min'}
            </div>
            <div className="font-medium">
              {min}€/h
            </div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">
              {lang === 'de' ? 'Max' : 'Max'}
            </div>
            <div className="font-medium">
              {max}€/h
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HourlyRateEditor;
