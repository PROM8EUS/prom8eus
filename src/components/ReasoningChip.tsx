import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Lightbulb, Target, Zap, Star, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReasoningItem {
  type: 'positive' | 'negative' | 'neutral' | 'warning' | 'info';
  message: string;
  icon?: React.ReactNode;
  weight?: number; // 0-1, for sorting/prioritization
}

export interface ReasoningData {
  items: ReasoningItem[];
  overallScore?: number;
  confidence?: number;
  tier?: string;
  type: 'workflow' | 'agent';
}

interface ReasoningChipProps {
  reasoning: ReasoningData;
  size?: 'sm' | 'md' | 'lg';
  maxItems?: number;
  showScore?: boolean;
  className?: string;
}

export function ReasoningChip({ 
  reasoning, 
  size = 'sm', 
  maxItems = 3,
  showScore = true,
  className = '' 
}: ReasoningChipProps) {
  const getReasoningIcon = (type: ReasoningItem['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'negative':
        return <XCircle className="h-3 w-3 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-amber-600" />;
      case 'info':
        return <Info className="h-3 w-3 text-blue-600" />;
      default:
        return <Lightbulb className="h-3 w-3 text-gray-600" />;
    }
  };

  const getReasoningColor = (type: ReasoningItem['type']) => {
    switch (type) {
      case 'positive':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'info':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // Sort reasoning items by weight (highest first) and limit to maxItems
  const sortedItems = reasoning.items
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, maxItems);

  const remainingCount = reasoning.items.length - maxItems;

  if (sortedItems.length === 0) {
    return null;
  }

  const chipContent = (
    <div className="flex items-center gap-1">
      {reasoning.type === 'workflow' ? (
        <Target className={iconSizes[size]} />
      ) : (
        <Zap className={iconSizes[size]} />
      )}
      <span className="font-medium">
        {reasoning.type === 'workflow' ? 'Workflow' : 'Agent'} Match
      </span>
      {showScore && reasoning.overallScore !== undefined && (
        <span className="ml-1 text-xs opacity-75">
          ({reasoning.overallScore}/100)
        </span>
      )}
      {reasoning.tier && (
        <span className="ml-1 text-xs opacity-75">
          • {reasoning.tier}
        </span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              sizeClasses[size],
              'border font-medium cursor-pointer hover:shadow-sm transition-shadow',
              className
            )}
          >
            {chipContent}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            <div className="font-medium text-sm">
              {reasoning.type === 'workflow' ? 'Workflow Match Details' : 'Agent Assessment Details'}
            </div>
            
            {reasoning.overallScore !== undefined && (
              <div className="text-xs text-gray-600">
                Overall Score: {reasoning.overallScore}/100
                {reasoning.confidence && ` (${reasoning.confidence}% confidence)`}
              </div>
            )}

            {reasoning.tier && (
              <div className="text-xs text-gray-600">
                Tier: {reasoning.tier}
              </div>
            )}

            <div className="space-y-1">
              {sortedItems.map((item, index) => (
                <div key={`reasoning-${index}-${item.text?.slice(0, 20) || 'item'}`} className="flex items-start gap-2 text-xs">
                  {item.icon || getReasoningIcon(item.type)}
                  <span className={getReasoningColor(item.type)}>
                    {item.message}
                  </span>
                </div>
              ))}
              
              {remainingCount > 0 && (
                <div className="text-xs text-gray-500 italic">
                  +{remainingCount} more factors...
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ReasoningDisplayProps {
  reasoning: ReasoningData;
  showHeader?: boolean;
  maxItems?: number;
  className?: string;
}

export function ReasoningDisplay({ 
  reasoning, 
  showHeader = true,
  maxItems = 5,
  className = '' 
}: ReasoningDisplayProps) {
  const getReasoningIcon = (type: ReasoningItem['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-gray-600" />;
    }
  };

  const getReasoningColor = (type: ReasoningItem['type']) => {
    switch (type) {
      case 'positive':
        return 'text-green-800';
      case 'negative':
        return 'text-red-800';
      case 'warning':
        return 'text-amber-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  // Sort reasoning items by weight (highest first) and limit to maxItems
  const sortedItems = reasoning.items
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, maxItems);

  const remainingCount = reasoning.items.length - maxItems;

  if (sortedItems.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {reasoning.type === 'workflow' ? (
              <Target className="h-4 w-4 text-blue-600" />
            ) : (
              <Zap className="h-4 w-4 text-purple-600" />
            )}
            {reasoning.type === 'workflow' ? 'Workflow Match Analysis' : 'Agent Assessment Analysis'}
            {reasoning.overallScore !== undefined && (
              <span className="text-xs text-gray-500 ml-auto">
                {reasoning.overallScore}/100
              </span>
            )}
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="space-y-2">
        {reasoning.overallScore !== undefined && (
          <div className="text-sm text-gray-600 mb-3">
            <div className="flex items-center justify-between">
              <span>Overall Score: {reasoning.overallScore}/100</span>
              {reasoning.confidence && (
                <span className="text-xs text-gray-500">
                  {reasoning.confidence}% confidence
                </span>
              )}
            </div>
            {reasoning.tier && (
              <div className="text-xs text-gray-500 mt-1">
                Tier: {reasoning.tier}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {sortedItems.map((item, index) => (
            <div key={`reasoning-display-${index}-${item.text?.slice(0, 20) || 'item'}`} className="flex items-start gap-2 text-sm">
              {item.icon || getReasoningIcon(item.type)}
              <span className={getReasoningColor(item.type)}>
                {item.message}
              </span>
            </div>
          ))}
          
          {remainingCount > 0 && (
            <div className="text-xs text-gray-500 italic pt-2 border-t">
              +{remainingCount} additional factors considered...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function to convert workflow reasoning to ReasoningData
export function convertWorkflowReasoning(
  reasoning: string[], 
  overallScore: number, 
  confidence: number
): ReasoningData {
  const items: ReasoningItem[] = reasoning.map((reason, index) => {
    let type: ReasoningItem['type'] = 'neutral';
    let weight = 0.5;

    // Determine type and weight based on reasoning content
    if (reason.toLowerCase().includes('excellent') || reason.toLowerCase().includes('perfect')) {
      type = 'positive';
      weight = 0.9;
    } else if (reason.toLowerCase().includes('good') || reason.toLowerCase().includes('strong')) {
      type = 'positive';
      weight = 0.7;
    } else if (reason.toLowerCase().includes('no') || reason.toLowerCase().includes('missing')) {
      type = 'negative';
      weight = 0.3;
    } else if (reason.toLowerCase().includes('partial') || reason.toLowerCase().includes('some')) {
      type = 'warning';
      weight = 0.5;
    } else if (reason.toLowerCase().includes('category') || reason.toLowerCase().includes('domain')) {
      type = 'info';
      weight = 0.6;
    }

    return {
      type,
      message: reason,
      weight
    };
  });

  return {
    items,
    overallScore,
    confidence,
    type: 'workflow'
  };
}

// Utility function to convert agent reasoning to ReasoningData
export function convertAgentReasoning(
  reasoning: string[], 
  overallScore: number, 
  tier: string,
  confidence: number
): ReasoningData {
  const items: ReasoningItem[] = reasoning.map((reason, index) => {
    let type: ReasoningItem['type'] = 'neutral';
    let weight = 0.5;

    // Determine type and weight based on reasoning content
    if (reason.toLowerCase().includes('excellent') || reason.toLowerCase().includes('perfect')) {
      type = 'positive';
      weight = 0.9;
    } else if (reason.toLowerCase().includes('good') || reason.toLowerCase().includes('strong')) {
      type = 'positive';
      weight = 0.7;
    } else if (reason.toLowerCase().includes('no') || reason.toLowerCase().includes('missing')) {
      type = 'negative';
      weight = 0.3;
    } else if (reason.toLowerCase().includes('partial') || reason.toLowerCase().includes('some')) {
      type = 'warning';
      weight = 0.5;
    } else if (reason.toLowerCase().includes('capability') || reason.toLowerCase().includes('domain')) {
      type = 'info';
      weight = 0.6;
    } else if (reason.toLowerCase().includes('high-quality') || reason.toLowerCase().includes('reliable')) {
      type = 'positive';
      weight = 0.8;
    }

    return {
      type,
      message: reason,
      weight
    };
  });

  return {
    items,
    overallScore,
    confidence,
    tier,
    type: 'agent'
  };
}

export default ReasoningChip;
