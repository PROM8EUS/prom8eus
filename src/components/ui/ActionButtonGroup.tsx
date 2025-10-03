/**
 * ActionButtonGroup Component
 * Groups multiple action buttons with consistent spacing and responsive behavior
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ModernActionButton, ModernActionButtonProps } from './ModernActionButton';

export interface ActionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  alignment?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
  responsive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
  spacing = 'normal',
  alignment = 'start',
  wrap = true,
  responsive = true,
  size = 'md',
  variant = 'default'
}) => {
  // Spacing classes
  const spacingClasses = {
    tight: orientation === 'horizontal' ? 'gap-1' : 'gap-1',
    normal: orientation === 'horizontal' ? 'gap-2' : 'gap-2',
    loose: orientation === 'horizontal' ? 'gap-4' : 'gap-4'
  };

  // Alignment classes
  const alignmentClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    stretch: 'justify-stretch'
  };

  // Orientation classes
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };

  // Responsive classes
  const responsiveClasses = responsive ? {
    horizontal: 'flex-col sm:flex-row',
    vertical: 'flex-col'
  } : orientationClasses;

  return (
    <div
      className={cn(
        'flex',
        responsiveClasses[orientation],
        spacingClasses[spacing],
        alignmentClasses[alignment],
        wrap && 'flex-wrap',
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement<ModernActionButtonProps>(child)) {
          return React.cloneElement(child, {
            size: child.props.size || size,
            variant: child.props.variant || variant,
            ...child.props
          });
        }
        return child;
      })}
    </div>
  );
};

// Specialized button group components
export const PrimaryActionGroup: React.FC<Omit<ActionButtonGroupProps, 'variant'>> = (props) => (
  <ActionButtonGroup variant="default" {...props} />
);

export const SecondaryActionGroup: React.FC<Omit<ActionButtonGroupProps, 'variant'>> = (props) => (
  <ActionButtonGroup variant="outline" {...props} />
);

export const GhostActionGroup: React.FC<Omit<ActionButtonGroupProps, 'variant'>> = (props) => (
  <ActionButtonGroup variant="ghost" {...props} />
);

export const CompactActionGroup: React.FC<Omit<ActionButtonGroupProps, 'size' | 'spacing'>> = (props) => (
  <ActionButtonGroup size="sm" spacing="tight" {...props} />
);

export const SpacedActionGroup: React.FC<Omit<ActionButtonGroupProps, 'spacing'>> = (props) => (
  <ActionButtonGroup spacing="loose" {...props} />
);

export default ActionButtonGroup;
