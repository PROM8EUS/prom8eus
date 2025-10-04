/**
 * CollapsibleSection Component
 * Provides progressive disclosure with smooth animations and smart defaults
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Info,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string | React.ReactNode; // Updated to support ReactNode
  description?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    count?: number;
  };
  icon?: React.ComponentType<{ className?: string }>;
  priority?: 'high' | 'medium' | 'low';
  onToggle?: (expanded: boolean) => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showProgress?: boolean;
  progressValue?: number;
  progressMax?: number;
  smartDefaults?: {
    autoExpand?: boolean;
    expandOnContent?: boolean;
    collapseOnEmpty?: boolean;
    minContentHeight?: number;
  };
}

export function CollapsibleSection({
  title,
  description,
  children,
  defaultExpanded = false,
  badge,
  icon: Icon,
  priority = 'medium',
  onToggle,
  className = '',
  headerClassName = '',
  contentClassName = '',
  showProgress = false,
  progressValue = 0,
  progressMax = 100,
  smartDefaults = {
    autoExpand: false,
    expandOnContent: true,
    collapseOnEmpty: false,
    minContentHeight: 50
  }
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasContent, setHasContent] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  // Smart defaults logic
  useEffect(() => {
    if (smartDefaults.autoExpand && priority === 'high') {
      setIsExpanded(true);
    }
  }, [smartDefaults.autoExpand, priority]);

  // Check if content exists and apply smart defaults
  useEffect(() => {
    const contentElement = document.getElementById(`collapsible-content-${typeof title === 'string' ? title.replace(/\s+/g, '-').toLowerCase() : 'section'}`);
    if (contentElement) {
      const hasActualContent = contentElement.children.length > 0;
      setHasContent(hasActualContent);
      setContentHeight(contentElement.scrollHeight);

      // Smart defaults
      if (smartDefaults.expandOnContent && hasActualContent && !isExpanded) {
        setIsExpanded(true);
      }
      if (smartDefaults.collapseOnEmpty && !hasActualContent && isExpanded) {
        setIsExpanded(false);
      }
    }
  }, [children, isExpanded, smartDefaults, title]);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-primary bg-primary/5';
      case 'medium':
        return 'border-l-4 border-l-blue-500 bg-blue-50/50';
      case 'low':
        return 'border-l-4 border-l-gray-300 bg-gray-50/50';
      default:
        return '';
    }
  };

  const getPriorityIcon = () => {
    switch (priority) {
      case 'high':
        return <Target className="h-4 w-4 text-primary" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'low':
        return <Info className="h-4 w-4 text-gray-500" />;
      default:
        return Icon ? <Icon className="h-4 w-4 text-gray-500" /> : null;
    }
  };

  const progressPercentage = progressMax > 0 ? (progressValue / progressMax) * 100 : 0;

  return (
    <Card className={cn(
      'transition-all duration-300',
      getPriorityStyles(),
      className
    )}>
      <CardContent className="p-0">
        {/* Header */}
        <div 
          className={cn(
            'p-4 cursor-pointer transition-colors duration-200 hover:bg-muted/50',
            headerClassName
          )}
          onClick={handleToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Priority Icon */}
              <div className="flex-shrink-0">
                {getPriorityIcon()}
              </div>

              {/* Title and Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {typeof title === 'string' ? (
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {title}
                    </h3>
                  ) : (
                    title
                  )}
                  {badge && (
                    <Badge 
                      variant={badge.variant || 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {badge.count !== undefined && (
                        <span className="text-xs">{badge.count}</span>
                      )}
                      {badge.text}
                    </Badge>
                  )}
                </div>
                {description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>

              {/* Progress Bar (if enabled) */}
              {showProgress && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
              )}
            </div>

            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-8 w-8 p-0 flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          id={`collapsible-content-${typeof title === 'string' ? title.replace(/\s+/g, '-').toLowerCase() : 'section'}`}
          className={cn(
            isExpanded ? 'opacity-100' : 'opacity-0',
            contentClassName
          )}
          style={{
            maxHeight: isExpanded ? '999999px' : '0px',
            overflow: isExpanded ? 'visible' : 'hidden',
            transition: 'none'
          }}
        >
          <div className="p-4 pt-0">
            {hasContent ? (
              children
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="h-8 w-8 text-gray-300" />
                  <p className="text-sm">
                    No content available
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CollapsibleSection;
