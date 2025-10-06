import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Workflow, Bot, Shield, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SolutionType = 'workflow' | 'agent';

export interface TypeBadgeProps {
  type: SolutionType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function TypeBadge({ 
  type, 
  size = 'sm', 
  showLabel = true,
  showIcon = true,
  className = '',
  variant = 'outline'
}: TypeBadgeProps) {
  const getTypeConfig = (type: SolutionType) => {
    switch (type) {
      case 'workflow':
        return {
          label: 'Workflow',
          reliabilityLabel: 'Reliable',
          icon: <Workflow className="h-4 w-4" />,
          reliabilityIcon: <Shield className="h-4 w-4" />,
          color: 'text-primary-700 bg-primary/10 border-primary/30',
          reliabilityColor: 'text-primary-700 bg-primary/10 border-primary/30',
          description: 'Predefined automation workflow with reliable, predictable outcomes',
          reliabilityDescription: 'Tested and proven workflow with consistent results'
        };
      case 'agent':
        return {
          label: 'Agent',
          reliabilityLabel: 'Adaptive',
          icon: <Bot className="h-4 w-4" />,
          reliabilityIcon: <Zap className="h-4 w-4" />,
          color: 'text-primary-700 bg-primary/10 border-primary/30',
          reliabilityColor: 'text-primary-700 bg-primary/10 border-primary/30',
          description: 'AI agent with adaptive capabilities that may vary in outcomes',
          reliabilityDescription: 'AI-powered agent with adaptive behavior and variable outcomes'
        };
      default:
        return {
          label: 'Unknown',
          reliabilityLabel: 'Unknown',
          icon: <Info className="h-3 w-3" />,
          reliabilityIcon: <Info className="h-3 w-3" />,
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          reliabilityColor: 'text-gray-700 bg-gray-50 border-gray-200',
          description: 'Unknown solution type',
          reliabilityDescription: 'Unknown reliability characteristics'
        };
    }
  };

  const config = getTypeConfig(type);
  
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

  const badgeContent = (
    <div className="flex items-center gap-1">
      {showIcon && config.icon}
      {showLabel && (
        <span className="font-medium">
          {config.label}
        </span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={variant}
            className={cn(
              sizeClasses[size],
              'border font-medium cursor-pointer hover:shadow-sm transition-shadow',
              config.color,
              className
            )}
          >
            {badgeContent}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium text-sm">
              {config.label} Solution
            </div>
            <div className="text-sm text-gray-600">
              {config.description}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ReliabilityBadgeProps {
  type: SolutionType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function ReliabilityBadge({ 
  type, 
  size = 'sm', 
  showLabel = true,
  showIcon = true,
  className = '',
  variant = 'outline'
}: ReliabilityBadgeProps) {
  const getReliabilityConfig = (type: SolutionType) => {
    switch (type) {
      case 'workflow':
        return {
          label: 'Reliable',
          icon: <Shield className="h-3 w-3" />,
          color: 'text-green-700 bg-green-50 border-green-200',
          description: 'Tested and proven workflow with consistent, predictable results'
        };
      case 'agent':
        return {
          label: 'Adaptive',
          icon: <Zap className="h-3 w-3" />,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          description: 'AI-powered agent with adaptive behavior and variable outcomes'
        };
      default:
        return {
          label: 'Unknown',
          icon: <Info className="h-3 w-3" />,
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          description: 'Unknown reliability characteristics'
        };
    }
  };

  const config = getReliabilityConfig(type);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const badgeContent = (
    <div className="flex items-center gap-1">
      {showIcon && config.icon}
      {showLabel && (
        <span className="font-medium">
          {config.label}
        </span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={variant}
            className={cn(
              sizeClasses[size],
              'border font-medium cursor-pointer hover:shadow-sm transition-shadow',
              config.color,
              className
            )}
          >
            {badgeContent}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium text-sm">
              {config.label} {type === 'workflow' ? 'Workflow' : 'Agent'}
            </div>
            <div className="text-sm text-gray-600">
              {config.description}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CombinedTypeBadgeProps {
  type: SolutionType;
  size?: 'sm' | 'md' | 'lg';
  showReliability?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function CombinedTypeBadge({ 
  type, 
  size = 'sm', 
  showReliability = true,
  className = '',
  variant = 'outline'
}: CombinedTypeBadgeProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <TypeBadge 
        type={type} 
        size={size} 
        showLabel={true}
        showIcon={true}
        variant={variant}
      />
      {showReliability && (
        <ReliabilityBadge 
          type={type} 
          size={size} 
          showLabel={true}
          showIcon={true}
          variant={variant}
        />
      )}
    </div>
  );
}

// Utility function to get type from solution data
export function getSolutionType(solution: any): SolutionType {
  if (!solution || typeof solution !== 'object') {
    return 'workflow'; // Default fallback for invalid input
  }
  
  if (solution.type) {
    return solution.type;
  }
  
  // Fallback logic based on available fields
  if (solution.capabilities || solution.model || solution.provider) {
    return 'agent';
  }
  
  if (solution.integrations || solution.category || solution.complexity) {
    return 'workflow';
  }
  
  return 'workflow'; // Default fallback
}

// Utility function to get type display name
export function getTypeDisplayName(type: SolutionType): string {
  switch (type) {
    case 'workflow':
      return 'Workflow';
    case 'agent':
      return 'AI Agent';
    default:
      return 'Unknown';
  }
}

// Utility function to get reliability display name
export function getReliabilityDisplayName(type: SolutionType): string {
  switch (type) {
    case 'workflow':
      return 'Reliable';
    case 'agent':
      return 'Adaptive';
    default:
      return 'Unknown';
  }
}

export default TypeBadge;
