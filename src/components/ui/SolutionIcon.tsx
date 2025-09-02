import React from 'react';
import { SolutionType } from '../../types/solutions';
import { cn } from '../../lib/utils';

interface SolutionIconProps {
  type: SolutionType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
}

export default function SolutionIcon({ 
  type, 
  size = 'md', 
  className,
  showLabel = false,
  variant = 'default'
}: SolutionIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const iconClasses = cn(
    sizeClasses[size],
    'flex-shrink-0',
    className
  );

  const renderIcon = () => {
    switch (type) {
      case 'workflow':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={iconClasses}
          >
            {/* Workflow icon - connected nodes */}
            <circle cx="6" cy="6" r="2" />
            <circle cx="18" cy="6" r="2" />
            <circle cx="6" cy="18" r="2" />
            <circle cx="18" cy="18" r="2" />
            <path d="M8 6h8" />
            <path d="M6 8v8" />
            <path d="M18 8v8" />
            <path d="M8 18h8" />
          </svg>
        );

      case 'agent':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={iconClasses}
          >
            {/* AI Agent icon - brain/neural network */}
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.23 2.5 2.5 0 0 1-1.04-2.7 2.5 2.5 0 0 1 1.04-2.7 2.5 2.5 0 0 1 2.96-3.23A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.23 2.5 2.5 0 0 0 1.04-2.7 2.5 2.5 0 0 0-1.04-2.7 2.5 2.5 0 0 0-2.96-3.23A2.5 2.5 0 0 0 14.5 2Z" />
          </svg>
        );

      default:
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={iconClasses}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'workflow':
        return variant === 'filled' 
          ? 'text-blue-600 bg-blue-100' 
          : variant === 'outlined'
          ? 'text-blue-600 border-blue-600'
          : 'text-blue-600';
      case 'agent':
        return variant === 'filled'
          ? 'text-purple-600 bg-purple-100'
          : variant === 'outlined'
          ? 'text-purple-600 border-purple-600'
          : 'text-purple-600';
      default:
        return variant === 'filled'
          ? 'text-gray-600 bg-gray-100'
          : variant === 'outlined'
          ? 'text-gray-600 border-gray-600'
          : 'text-gray-600';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'workflow':
        return 'Workflow';
      case 'agent':
        return 'AI Agent';
      default:
        return 'Solution';
    }
  };

  if (variant === 'filled') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium',
        getTypeColor()
      )}>
        {renderIcon()}
        {showLabel && <span>{getTypeLabel()}</span>}
      </div>
    );
  }

  if (variant === 'outlined') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border',
        getTypeColor()
      )}>
        {renderIcon()}
        {showLabel && <span>{getTypeLabel()}</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      {renderIcon()}
      {showLabel && (
        <span className={cn('text-sm font-medium', getTypeColor())}>
          {getTypeLabel()}
        </span>
      )}
    </div>
  );
}

// Export individual icon components for specific use cases
export function WorkflowIcon({ size = 'md', className, variant = 'default' }: Omit<SolutionIconProps, 'type'>) {
  return (
    <SolutionIcon 
      type="workflow" 
      size={size} 
      className={className} 
      variant={variant} 
    />
  );
}

export function AgentIcon({ size = 'md', className, variant = 'default' }: Omit<SolutionIconProps, 'type'>) {
  return (
    <SolutionIcon 
      type="agent" 
      size={size} 
      className={className} 
      variant={variant} 
    />
  );
}

// Export icon with label for common use cases
export function SolutionIconWithLabel({ 
  type, 
  size = 'md', 
  className,
  variant = 'default' 
}: Omit<SolutionIconProps, 'showLabel'>) {
  return (
    <SolutionIcon 
      type={type} 
      size={size} 
      className={className} 
      showLabel={true}
      variant={variant}
    />
  );
}
