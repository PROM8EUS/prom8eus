/**
 * InlineEdit Component
 * Advanced inline editing with smooth transitions, validation feedback, and modern UX patterns
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Info,
  DollarSign,
  Percent,
  Clock,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
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
  PiggyBank,
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
  CalendarStar
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InlineEditProps {
  value: string | number;
  onChange: (value: string | number) => void;
  onSave?: (value: string | number) => void;
  onCancel?: () => void;
  onValidate?: (value: string | number) => { isValid: boolean; message?: string };
  // Display options
  displayValue?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'url' | 'tel';
  // Styling
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  // Behavior
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  selectOnFocus?: boolean;
  // Validation
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  // Visual feedback
  showValidation?: boolean;
  showSuccess?: boolean;
  showError?: boolean;
  // Icons
  editIcon?: React.ReactNode;
  saveIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;
  // Transitions
  transitionDuration?: number;
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
  // Formatting
  formatValue?: (value: string | number) => string;
  parseValue?: (value: string) => string | number;
  // Advanced features
  allowEmpty?: boolean;
  trimWhitespace?: boolean;
  // Callbacks
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  onValidate,
  // Display options
  displayValue,
  placeholder = 'Click to edit',
  type = 'text',
  // Styling
  className,
  inputClassName,
  buttonClassName,
  // Behavior
  disabled = false,
  readOnly = false,
  autoFocus = false,
  selectOnFocus = true,
  // Validation
  required = false,
  min,
  max,
  step,
  pattern,
  // Visual feedback
  showValidation = true,
  showSuccess = true,
  showError = true,
  // Icons
  editIcon = <Edit3 className="h-3 w-3" />,
  saveIcon = <Check className="h-3 w-3" />,
  cancelIcon = <X className="h-3 w-3" />,
  // Transitions
  transitionDuration = 200,
  // Accessibility
  ariaLabel,
  ariaDescription,
  // Formatting
  formatValue,
  parseValue,
  // Advanced features
  allowEmpty = true,
  trimWhitespace = true,
  // Callbacks
  onEditStart,
  onEditEnd,
  onKeyDown,
  onKeyUp,
  onBlur,
  onFocus
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string | number>(value);
  const [validation, setValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update temp value when prop value changes
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current && autoFocus) {
      inputRef.current.focus();
      if (selectOnFocus) {
        inputRef.current.select();
      }
    }
  }, [isEditing, autoFocus, selectOnFocus]);

  // Validate value
  const validateValue = useCallback((val: string | number) => {
    if (!onValidate) {
      // Basic validation
      if (required && (!val || val === '')) {
        return { isValid: false, message: 'This field is required' };
      }
      
      if (type === 'number') {
        const numVal = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(numVal)) {
          return { isValid: false, message: 'Please enter a valid number' };
        }
        if (min !== undefined && numVal < min) {
          return { isValid: false, message: `Value must be at least ${min}` };
        }
        if (max !== undefined && numVal > max) {
          return { isValid: false, message: `Value must be at most ${max}` };
        }
      }
      
      if (pattern && typeof val === 'string') {
        const regex = new RegExp(pattern);
        if (!regex.test(val)) {
          return { isValid: false, message: 'Invalid format' };
        }
      }
      
      return { isValid: true };
    }
    
    return onValidate(val);
  }, [onValidate, required, type, min, max, pattern]);

  // Handle edit start
  const handleEditStart = useCallback(() => {
    if (disabled || readOnly) return;
    
    setIsEditing(true);
    setTempValue(value);
    setValidation({ isValid: true });
    setIsAnimating(true);
    onEditStart?.();
    
    // Focus input after animation
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (selectOnFocus) {
          inputRef.current.select();
        }
      }
    }, transitionDuration / 2);
  }, [disabled, readOnly, value, selectOnFocus, transitionDuration, onEditStart]);

  // Handle save
  const handleSave = useCallback(() => {
    const trimmedValue = trimWhitespace && typeof tempValue === 'string' 
      ? tempValue.trim() 
      : tempValue;
    
    // Check if value is empty and not allowed
    if (!allowEmpty && (!trimmedValue || trimmedValue === '')) {
      setValidation({ isValid: false, message: 'Value cannot be empty' });
      return;
    }
    
    // Validate value
    const validationResult = validateValue(trimmedValue);
    setValidation(validationResult);
    
    if (validationResult.isValid) {
      const parsedValue = parseValue ? parseValue(String(trimmedValue)) : trimmedValue;
      
      onChange(parsedValue);
      onSave?.(parsedValue);
      setIsEditing(false);
      setIsAnimating(false);
      setShowFeedback(true);
      onEditEnd?.();
      
      // Hide feedback after delay
      setTimeout(() => {
        setShowFeedback(false);
      }, 2000);
    }
  }, [tempValue, trimWhitespace, allowEmpty, validateValue, parseValue, onChange, onSave, onEditEnd]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setTempValue(value);
    setValidation({ isValid: true });
    setIsEditing(false);
    setIsAnimating(false);
    onCancel?.();
    onEditEnd?.();
  }, [value, onCancel, onEditEnd]);

  // Handle key events
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    onKeyDown?.(event);
    
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel, onKeyDown]);

  // Handle input change
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setTempValue(newValue);
    
    // Real-time validation
    if (showValidation) {
      const validationResult = validateValue(newValue);
      setValidation(validationResult);
    }
  }, [showValidation, validateValue]);

  // Handle blur
  const handleBlur = useCallback((event: React.FocusEvent) => {
    onBlur?.(event);
    
    // Auto-save on blur if value is valid
    if (validation.isValid) {
      handleSave();
    } else {
      handleCancel();
    }
  }, [validation.isValid, handleSave, handleCancel, onBlur]);

  // Handle focus
  const handleFocus = useCallback((event: React.FocusEvent) => {
    onFocus?.(event);
  }, [onFocus]);

  // Format display value
  const getDisplayValue = useCallback(() => {
    if (displayValue) return displayValue;
    if (formatValue) return formatValue(value);
    return String(value);
  }, [displayValue, formatValue, value]);

  // Get validation icon
  const getValidationIcon = () => {
    if (!showValidation || !validation.message) return null;
    
    if (validation.isValid) {
      return showSuccess ? <CheckCircle className="h-4 w-4 text-green-500" /> : null;
    } else {
      return showError ? <AlertCircle className="h-4 w-4 text-red-500" /> : null;
    }
  };

  // Get validation message color
  const getValidationColor = () => {
    if (!validation.message) return '';
    return validation.isValid ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative inline-flex items-center gap-2 transition-all duration-200',
        isEditing && 'bg-background border border-primary/20 rounded-md px-2 py-1',
        isAnimating && 'transform scale-105',
        className
      )}
      aria-label={ariaLabel}
      aria-describedby={ariaDescription}
    >
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type={type}
            value={tempValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onKeyUp={onKeyUp}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            step={step}
            pattern={pattern}
            className={cn(
              'h-6 px-2 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none',
              validation.isValid ? 'text-foreground' : 'text-red-600',
              inputClassName
            )}
            aria-invalid={!validation.isValid}
            aria-describedby={validation.message ? 'validation-message' : undefined}
          />
          
          {getValidationIcon()}
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!validation.isValid}
              className={cn(
                'h-6 w-6 p-0 transition-colors',
                validation.isValid 
                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                  : 'text-gray-400 cursor-not-allowed',
                buttonClassName
              )}
              aria-label="Save changes"
            >
              {saveIcon}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className={cn(
                'h-6 w-6 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors',
                buttonClassName
              )}
              aria-label="Cancel editing"
            >
              {cancelIcon}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleEditStart}
          disabled={disabled || readOnly}
          className={cn(
            'inline-flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200',
            'hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            disabled && 'opacity-50 cursor-not-allowed',
            readOnly && 'cursor-default',
            showFeedback && validation.isValid && 'bg-green-50 text-green-700',
            showFeedback && !validation.isValid && 'bg-red-50 text-red-700'
          )}
          aria-label={ariaLabel || 'Edit value'}
        >
          <span className="text-sm font-medium">
            {getDisplayValue()}
          </span>
          {!readOnly && (
            <span className="opacity-60 hover:opacity-100 transition-opacity">
              {editIcon}
            </span>
          )}
        </button>
      )}
      
      {/* Validation message */}
      {validation.message && (
        <div 
          id="validation-message"
          className={cn(
            'absolute top-full left-0 mt-1 text-xs transition-all duration-200',
            getValidationColor(),
            isEditing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
          )}
        >
          {validation.message}
        </div>
      )}
    </div>
  );
};

// Specialized components for common use cases
export const InlineEditNumber: React.FC<Omit<InlineEditProps, 'type' | 'parseValue'>> = (props) => {
  return (
    <InlineEdit
      {...props}
      type="number"
      parseValue={(value) => parseFloat(value) || 0}
    />
  );
};

export const InlineEditCurrency: React.FC<Omit<InlineEditProps, 'type' | 'parseValue' | 'formatValue'>> = (props) => {
  return (
    <InlineEdit
      {...props}
      type="number"
      parseValue={(value) => parseFloat(value) || 0}
      formatValue={(value) => `€${Number(value).toLocaleString('de-DE')}`}
      min={0}
      step={0.01}
    />
  );
};

export const InlineEditPercentage: React.FC<Omit<InlineEditProps, 'type' | 'parseValue' | 'formatValue'>> = (props) => {
  return (
    <InlineEdit
      {...props}
      type="number"
      parseValue={(value) => parseFloat(value) || 0}
      formatValue={(value) => `${Number(value).toFixed(1)}%`}
      min={0}
      max={100}
      step={0.1}
    />
  );
};

export const InlineEditTime: React.FC<Omit<InlineEditProps, 'type' | 'parseValue' | 'formatValue'>> = (props) => {
  return (
    <InlineEdit
      {...props}
      type="number"
      parseValue={(value) => parseFloat(value) || 0}
      formatValue={(value) => `${Number(value).toFixed(1)}h`}
      min={0}
      step={0.1}
    />
  );
};

export default InlineEdit;
