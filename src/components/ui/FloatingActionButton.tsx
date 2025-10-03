/**
 * FloatingActionButton Component
 * Floating action button with expandable menu and smooth animations
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  X, 
  ChevronUp, 
  ChevronDown,
  Download,
  Copy,
  Share2,
  Settings,
  RefreshCw,
  Star,
  Heart,
  Eye,
  Edit,
  Trash2,
  Save,
  Send,
  Upload,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModernActionButton, ActionType } from './ModernActionButton';

export interface FloatingActionItem {
  id: string;
  action: ActionType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  icon?: React.ReactNode;
}

export interface FloatingActionButtonProps {
  items: FloatingActionItem[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  className?: string;
  disabled?: boolean;
  autoClose?: boolean;
  closeOnClick?: boolean;
  showLabels?: boolean;
  expandDirection?: 'up' | 'down' | 'left' | 'right' | 'auto';
  maxItems?: number;
  // Animation props
  animationDuration?: number;
  staggerDelay?: number;
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  items,
  position = 'bottom-right',
  size = 'md',
  variant = 'default',
  className,
  disabled = false,
  autoClose = true,
  closeOnClick = true,
  showLabels = true,
  expandDirection = 'auto',
  maxItems = 5,
  animationDuration = 200,
  staggerDelay = 50,
  ariaLabel = 'Floating action menu',
  ariaDescription
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        buttonRef.current &&
        menuRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Auto-close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Determine expand direction based on position
  const getExpandDirection = () => {
    if (expandDirection !== 'auto') return expandDirection;
    
    switch (position) {
      case 'bottom-right':
      case 'bottom-left':
        return 'up';
      case 'top-right':
      case 'top-left':
        return 'down';
      default:
        return 'up';
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    
    setIsAnimating(true);
    setIsOpen(!isOpen);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  };

  const handleClose = () => {
    if (!isOpen) return;
    
    setIsAnimating(true);
    setIsOpen(false);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  };

  const handleItemClick = (item: FloatingActionItem) => {
    if (item.disabled) return;
    
    item.onClick();
    
    if (closeOnClick) {
      handleClose();
    }
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
    'center': 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-14 w-14'
  };

  // Expand direction classes
  const expandDirectionClasses = {
    up: 'flex-col-reverse',
    down: 'flex-col',
    left: 'flex-row-reverse',
    right: 'flex-row'
  };

  // Get visible items (respect maxItems)
  const visibleItems = items.slice(0, maxItems);
  const hasMoreItems = items.length > maxItems;

  return (
    <div className={cn('relative z-50', positionClasses[position], className)}>
      {/* Main FAB Button */}
      <Button
        ref={buttonRef}
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
          'focus:ring-2 focus:ring-primary focus:ring-offset-2',
          sizeClasses[size],
          isOpen && 'rotate-45',
          isAnimating && 'scale-95'
        )}
        aria-label={ariaLabel}
        aria-describedby={ariaDescription}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </Button>

      {/* Expandable Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            'absolute flex items-center gap-2 transition-all duration-300',
            expandDirectionClasses[getExpandDirection()],
            getExpandDirection() === 'up' && 'bottom-full mb-2',
            getExpandDirection() === 'down' && 'top-full mt-2',
            getExpandDirection() === 'left' && 'right-full mr-2',
            getExpandDirection() === 'right' && 'left-full ml-2'
          )}
          role="menu"
          aria-label="Action menu"
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'transition-all duration-300 ease-out',
                'opacity-0 translate-y-2',
                isOpen && 'opacity-100 translate-y-0'
              )}
              style={{
                transitionDelay: `${index * staggerDelay}ms`
              }}
            >
              <ModernActionButton
                action={item.action}
                size="sm"
                variant={item.variant || 'outline'}
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'rounded-full shadow-md hover:shadow-lg',
                  'transition-all duration-200 hover:scale-105',
                  showLabels && 'min-w-0'
                )}
                showText={showLabels}
                showIcon={true}
                aria-label={item.label}
              >
                {showLabels && item.label}
              </ModernActionButton>
            </div>
          ))}

          {/* More items indicator */}
          {hasMoreItems && (
            <div
              className={cn(
                'transition-all duration-300 ease-out',
                'opacity-0 translate-y-2',
                isOpen && 'opacity-100 translate-y-0'
              )}
              style={{
                transitionDelay: `${visibleItems.length * staggerDelay}ms`
              }}
            >
              <Button
                variant="outline"
                size="sm"
                className="rounded-full shadow-md hover:shadow-lg"
                aria-label={`${items.length - maxItems} more actions`}
              >
                +{items.length - maxItems}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// Specialized FAB components
export const QuickActionsFAB: React.FC<Omit<FloatingActionButtonProps, 'items'>> = (props) => {
  const defaultItems: FloatingActionItem[] = [
    {
      id: 'download',
      action: 'download',
      label: 'Download',
      onClick: () => console.log('Download clicked')
    },
    {
      id: 'copy',
      action: 'copy',
      label: 'Copy',
      onClick: () => console.log('Copy clicked')
    },
    {
      id: 'share',
      action: 'share',
      label: 'Share',
      onClick: () => console.log('Share clicked')
    }
  ];

  return <FloatingActionButton items={defaultItems} {...props} />;
};

export const EditActionsFAB: React.FC<Omit<FloatingActionButtonProps, 'items'>> = (props) => {
  const defaultItems: FloatingActionItem[] = [
    {
      id: 'edit',
      action: 'edit',
      label: 'Edit',
      onClick: () => console.log('Edit clicked')
    },
    {
      id: 'save',
      action: 'save',
      label: 'Save',
      onClick: () => console.log('Save clicked')
    },
    {
      id: 'delete',
      action: 'delete',
      label: 'Delete',
      onClick: () => console.log('Delete clicked'),
      variant: 'destructive'
    }
  ];

  return <FloatingActionButton items={defaultItems} {...props} />;
};

export default FloatingActionButton;
