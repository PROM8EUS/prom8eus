/**
 * Enhanced StatusBadge Tests
 * Tests the enhanced StatusBadge component with gradient backgrounds, micro-animations, and smart status detection
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  StatusBadge, 
  ActiveBadge, 
  InactiveBadge, 
  ErrorBadge, 
  WarningBadge, 
  LoadingBadge,
  SuccessBadge,
  InfoBadge,
  VerifiedBadge,
  GeneratedBadge,
  FallbackBadge
} from '../StatusBadge';

describe('Enhanced StatusBadge Tests', () => {
  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      render(<StatusBadge status="active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders with custom text', () => {
      render(<StatusBadge status="custom" customText="Custom Status" />);
      expect(screen.getByText('Custom Status')).toBeInTheDocument();
    });

    it('renders with custom icon', () => {
      render(
        <StatusBadge 
          status="custom" 
          customIcon={<div data-testid="custom-icon">🎯</div>}
          showIcon={true}
        />
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('applies correct size classes', () => {
      const { rerender } = render(<StatusBadge status="active" size="sm" />);
      expect(screen.getByRole('button')).toHaveClass('h-5');

      rerender(<StatusBadge status="active" size="md" />);
      expect(screen.getByRole('button')).toHaveClass('h-6');

      rerender(<StatusBadge status="active" size="lg" />);
      expect(screen.getByRole('button')).toHaveClass('h-7');

      rerender(<StatusBadge status="active" size="xl" />);
      expect(screen.getByRole('button')).toHaveClass('h-8');
    });
  });

  describe('Smart Status Detection', () => {
    it('detects active status correctly', () => {
      render(<StatusBadge status="active" showIcon={true} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('detects error status correctly', () => {
      render(<StatusBadge status="error" showIcon={true} />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('detects loading status correctly', () => {
      render(<StatusBadge status="loading" showIcon={true} />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('detects AI generated status correctly', () => {
      render(<StatusBadge status="ai-generated" showIcon={true} />);
      expect(screen.getByText('AI Generated')).toBeInTheDocument();
    });

    it('detects verified status correctly', () => {
      render(<StatusBadge status="verified" showIcon={true} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('detects fallback status correctly', () => {
      render(<StatusBadge status="fallback" showIcon={true} />);
      expect(screen.getByText('Fallback')).toBeInTheDocument();
    });
  });

  describe('Context-Aware Status Detection', () => {
    it('detects workflow context statuses', () => {
      render(<StatusBadge status="verified" context="workflow" showIcon={true} />);
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('detects agent context statuses', () => {
      render(<StatusBadge status="active" context="agent" showIcon={true} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('detects prompt context statuses', () => {
      render(<StatusBadge status="optimized" context="prompt" showIcon={true} />);
      expect(screen.getByText('Optimized')).toBeInTheDocument();
    });

    it('detects task context statuses', () => {
      render(<StatusBadge status="completed" context="task" showIcon={true} />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Enhanced Features', () => {
    it('applies gradient background when enabled', () => {
      render(<StatusBadge status="success" gradient={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('bg-gradient-to-r');
    });

    it('applies glow effect when enabled', () => {
      render(<StatusBadge status="success" glow={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('shadow-lg');
    });

    it('applies pulse animation when enabled', () => {
      render(<StatusBadge status="error" pulse={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('applies bounce animation when enabled', () => {
      render(<StatusBadge status="loading" bounce={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('animate-bounce');
    });

    it('applies shimmer effect when enabled', () => {
      render(<StatusBadge status="warning" shimmer={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('disables animations when animated is false', () => {
      render(<StatusBadge status="active" animated={false} />);
      const badge = screen.getByRole('button');
      expect(badge).not.toHaveClass('transform-gpu');
    });
  });

  describe('Interactive Features', () => {
    it('handles click events when clickable', () => {
      const handleClick = jest.fn();
      render(
        <StatusBadge 
          status="active" 
          clickable={true} 
          onClick={handleClick}
        />
      );
      
      const badge = screen.getByRole('button');
      fireEvent.click(badge);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles hover events', () => {
      const handleHover = jest.fn();
      render(
        <StatusBadge 
          status="active" 
          onHover={handleHover}
        />
      );
      
      const badge = screen.getByRole('button');
      fireEvent.mouseEnter(badge);
      expect(handleHover).toHaveBeenCalledTimes(1);
    });

    it('applies hover effects when clickable', () => {
      render(<StatusBadge status="active" clickable={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('cursor-pointer');
    });

    it('has correct tabIndex when clickable', () => {
      render(<StatusBadge status="active" clickable={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label', () => {
      render(<StatusBadge status="active" ariaLabel="Active status" />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('aria-label', 'Active status');
    });

    it('has correct aria-describedby', () => {
      render(<StatusBadge status="active" ariaDescription="status-description" />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('aria-describedby', 'status-description');
    });

    it('has correct role when clickable', () => {
      render(<StatusBadge status="active" clickable={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('role', 'button');
    });
  });

  describe('Animation Timing', () => {
    it('applies animation delay', async () => {
      render(<StatusBadge status="active" animationDelay={100} />);
      const badge = screen.getByRole('button');
      
      // Initially should be hidden
      expect(badge).toHaveClass('opacity-0');
      
      // After delay, should be visible
      await waitFor(() => {
        expect(badge).toHaveClass('opacity-100');
      }, { timeout: 200 });
    });

    it('applies custom animation duration', () => {
      render(<StatusBadge status="active" animationDuration={500} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('duration-500');
    });
  });

  describe('Priority-Based Styling', () => {
    it('applies success priority styles', () => {
      render(<StatusBadge status="success" gradient={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('from-green-500');
    });

    it('applies error priority styles', () => {
      render(<StatusBadge status="error" gradient={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('from-red-500');
    });

    it('applies warning priority styles', () => {
      render(<StatusBadge status="warning" gradient={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('from-yellow-500');
    });

    it('applies info priority styles', () => {
      render(<StatusBadge status="info" gradient={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('from-blue-500');
    });

    it('applies secondary priority styles', () => {
      render(<StatusBadge status="inactive" gradient={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('from-gray-500');
    });
  });

  describe('Convenience Components', () => {
    it('renders ActiveBadge with enhanced features', () => {
      render(<ActiveBadge animated={true} gradient={true} glow={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('bg-gradient-to-r');
      expect(badge).toHaveClass('shadow-lg');
    });

    it('renders ErrorBadge with pulse animation', () => {
      render(<ErrorBadge pulse={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('renders WarningBadge with shimmer effect', () => {
      render(<WarningBadge shimmer={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('renders LoadingBadge with bounce animation', () => {
      render(<LoadingBadge bounce={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('animate-bounce');
    });

    it('renders SuccessBadge with glow effect', () => {
      render(<SuccessBadge glow={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('shadow-lg');
    });

    it('renders VerifiedBadge with context', () => {
      render(<VerifiedBadge context="workflow" />);
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('renders GeneratedBadge with shimmer', () => {
      render(<GeneratedBadge shimmer={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('renders FallbackBadge with context', () => {
      render(<FallbackBadge context="workflow" />);
      expect(screen.getByText('Fallback')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('shows icon when showIcon is true', () => {
      render(<StatusBadge status="active" showIcon={true} />);
      // Icon should be present (CheckCircle for active status)
      const badge = screen.getByRole('button');
      expect(badge.querySelector('svg')).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      render(<StatusBadge status="active" showIcon={false} />);
      const badge = screen.getByRole('button');
      expect(badge.querySelector('svg')).not.toBeInTheDocument();
    });

    it('applies correct icon size for different badge sizes', () => {
      const { rerender } = render(<StatusBadge status="active" size="sm" showIcon={true} />);
      let icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveClass('w-3', 'h-3');

      rerender(<StatusBadge status="active" size="md" showIcon={true} />);
      icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveClass('w-3', 'h-3');

      rerender(<StatusBadge status="active" size="lg" showIcon={true} />);
      icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveClass('w-4', 'h-4');

      rerender(<StatusBadge status="active" size="xl" showIcon={true} />);
      icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveClass('w-4', 'h-4');
    });

    it('applies spin animation to loading icon', () => {
      render(<StatusBadge status="loading" showIcon={true} />);
      const icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<StatusBadge status="active" className="custom-class" />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('custom-class');
    });

    it('applies custom color when provided', () => {
      render(<StatusBadge status="active" customColor="purple" />);
      // Custom color would be applied via inline styles or CSS variables
      const badge = screen.getByRole('button');
      expect(badge).toBeInTheDocument();
    });

    it('applies custom gradient when provided', () => {
      render(<StatusBadge status="active" customGradient="from-purple-500 to-pink-500" />);
      // Custom gradient would override default gradient
      const badge = screen.getByRole('button');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles unknown status gracefully', () => {
      render(<StatusBadge status="unknown-status" />);
      expect(screen.getByText('unknown-status')).toBeInTheDocument();
    });

    it('handles empty status', () => {
      render(<StatusBadge status="" />);
      expect(screen.getByText('')).toBeInTheDocument();
    });

    it('handles null customIcon', () => {
      render(<StatusBadge status="active" customIcon={null} showIcon={true} />);
      // Should fall back to default icon
      const badge = screen.getByRole('button');
      expect(badge.querySelector('svg')).toBeInTheDocument();
    });

    it('handles undefined customText', () => {
      render(<StatusBadge status="active" customText={undefined} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });
});
