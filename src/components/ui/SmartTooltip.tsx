/**
 * SmartTooltip Component
 * Provides contextual help with intelligent positioning and progressive disclosure
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  X, 
  ChevronRight, 
  ExternalLink,
  BookOpen,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipContent {
  title: string;
  description: string;
  examples?: string[];
  tips?: string[];
  links?: Array<{
    text: string;
    url: string;
    external?: boolean;
  }>;
  related?: string[];
}

interface SmartTooltipProps {
  content: TooltipContent;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger?: 'hover' | 'click' | 'focus';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'info' | 'warning' | 'success' | 'help';
  showIcon?: boolean;
  persistent?: boolean;
  className?: string;
  onOpen?: () => void;
  onClose?: () => void;
  lang?: 'de' | 'en';
}

export function SmartTooltip({
  content,
  children,
  position = 'auto',
  trigger = 'hover',
  size = 'md',
  variant = 'default',
  showIcon = true,
  persistent = false,
  className = '',
  onOpen,
  onClose,
  lang = 'en'
}: SmartTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [showDetails, setShowDetails] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Auto-positioning logic
  useEffect(() => {
    if (isVisible && position === 'auto' && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Calculate available space in each direction
      const spaceTop = rect.top;
      const spaceBottom = viewport.height - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = viewport.width - rect.right;

      // Determine best position
      let bestPosition = 'bottom';
      if (spaceBottom < 200 && spaceTop > spaceBottom) {
        bestPosition = 'top';
      } else if (spaceRight < 300 && spaceLeft > spaceRight) {
        bestPosition = 'left';
      } else if (spaceLeft < 300 && spaceRight > spaceLeft) {
        bestPosition = 'right';
      }

      setActualPosition(bestPosition as any);
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
      onOpen?.();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover' && !persistent) {
      setIsVisible(false);
      onClose?.();
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
      if (!isVisible) {
        onOpen?.();
      } else {
        onClose?.();
      }
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus') {
      setIsVisible(true);
      onOpen?.();
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus' && !persistent) {
      setIsVisible(false);
      onClose?.();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'help':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getVariantIcon = () => {
    switch (variant) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'help':
        return <HelpCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'max-w-xs';
      case 'lg':
        return 'max-w-md';
      default:
        return 'max-w-sm';
    }
  };

  const getPositionStyles = () => {
    const baseStyles = 'absolute z-50';
    switch (actualPosition) {
      case 'top':
        return `${baseStyles} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseStyles} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseStyles} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseStyles} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseStyles} top-full left-1/2 transform -translate-x-1/2 mt-2`;
    }
  };

  return (
    <div 
      ref={triggerRef}
      className={cn('relative inline-block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={trigger === 'focus' ? 0 : undefined}
    >
      {/* Trigger Element */}
      <div className="flex items-center gap-1">
        {children}
        {showIcon && (
          <div className="flex-shrink-0">
            {getVariantIcon()}
          </div>
        )}
      </div>

      {/* Tooltip Content */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            getPositionStyles(),
            getSizeStyles(),
            getVariantStyles(),
            'rounded-lg shadow-lg border p-4 transition-all duration-200'
          )}
        >
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getVariantIcon()}
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {content.title}
                    </h4>
                  </div>
                  {persistent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setIsVisible(false);
                        onClose?.();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 leading-relaxed">
                  {content.description}
                </p>

                {/* Examples */}
                {content.examples && content.examples.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-yellow-600" />
                      <span className="text-xs font-medium text-gray-600">
                        {lang === 'de' ? 'Beispiele:' : 'Examples:'}
                      </span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      {content.examples.map((example, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tips */}
                {content.tips && content.tips.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-medium text-gray-600">
                        {lang === 'de' ? 'Tipps:' : 'Tips:'}
                      </span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      {content.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Links */}
                {content.links && content.links.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-gray-600">
                        {lang === 'de' ? 'Weitere Informationen:' : 'Learn more:'}
                      </span>
                    </div>
                    <div className="space-y-1 ml-4">
                      {content.links.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target={link.external ? '_blank' : '_self'}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {link.text}
                          {link.external && <ExternalLink className="h-3 w-3" />}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Topics */}
                {content.related && content.related.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-gray-600" />
                      <span className="text-xs font-medium text-gray-600">
                        {lang === 'de' ? 'Verwandte Themen:' : 'Related topics:'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-4">
                      {content.related.map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progressive Disclosure Toggle */}
                {size === 'sm' && (content.examples || content.tips || content.links) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs h-6"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails 
                      ? (lang === 'de' ? 'Weniger anzeigen' : 'Show less')
                      : (lang === 'de' ? 'Mehr anzeigen' : 'Show more')
                    }
                    <ChevronRight className={cn(
                      'h-3 w-3 ml-1 transition-transform',
                      showDetails && 'rotate-90'
                    )} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default SmartTooltip;
