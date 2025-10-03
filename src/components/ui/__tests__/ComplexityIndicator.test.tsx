/**
 * ComplexityIndicator Tests
 * Tests the ComplexityIndicator component with visual complexity indicators
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  ComplexityIndicator, 
  WorkflowComplexityIndicator, 
  AgentComplexityIndicator 
} from '../ComplexityIndicator';

describe('ComplexityIndicator Tests', () => {
  const mockWorkflow = {
    complexity: 'Medium' as const,
    nodes: 5,
    integrations: ['Slack', 'Gmail']
  };

  const mockAgent = {
    complexity: 'High' as const,
    functions: 3,
    tools: 2
  };

  describe('Basic Functionality', () => {
    it('renders with low complexity', () => {
      render(<ComplexityIndicator complexity="Low" />);
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('renders with medium complexity', () => {
      render(<ComplexityIndicator complexity="Medium" />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('renders with high complexity', () => {
      render(<ComplexityIndicator complexity="High" />);
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('renders with custom value', () => {
      render(<ComplexityIndicator complexity="Medium" value={75} maxValue={100} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Display Options', () => {
    it('shows label when showLabel is true', () => {
      render(<ComplexityIndicator complexity="Medium" showLabel={true} />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<ComplexityIndicator complexity="Medium" showLabel={false} />);
      expect(screen.queryByText('Medium')).not.toBeInTheDocument();
    });

    it('shows icon when showIcon is true', () => {
      render(<ComplexityIndicator complexity="Medium" showIcon={true} />);
      // Icon should be present in the DOM
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      render(<ComplexityIndicator complexity="Medium" showIcon={false} />);
      // Icon should not be present
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('shows progress bar when showProgress is true', () => {
      render(<ComplexityIndicator complexity="Medium" showProgress={true} />);
      expect(screen.getByText('Complexity')).toBeInTheDocument();
    });

    it('hides progress bar when showProgress is false', () => {
      render(<ComplexityIndicator complexity="Medium" showProgress={false} />);
      expect(screen.queryByText('Complexity')).not.toBeInTheDocument();
    });

    it('shows tooltip when showTooltip is true', () => {
      render(<ComplexityIndicator complexity="Medium" showTooltip={true} />);
      // Tooltip trigger should be present
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('hides tooltip when showTooltip is false', () => {
      render(<ComplexityIndicator complexity="Medium" showTooltip={false} />);
      // Tooltip trigger should not be present
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size styling', () => {
      render(<ComplexityIndicator complexity="Medium" size="sm" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('text-xs');
    });

    it('applies medium size styling', () => {
      render(<ComplexityIndicator complexity="Medium" size="md" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('text-sm');
    });

    it('applies large size styling', () => {
      render(<ComplexityIndicator complexity="Medium" size="lg" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('text-base');
    });

    it('applies extra large size styling', () => {
      render(<ComplexityIndicator complexity="Medium" size="xl" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('text-lg');
    });
  });

  describe('Variant Styling', () => {
    it('applies default variant styling', () => {
      render(<ComplexityIndicator complexity="Medium" variant="default" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('p-3', 'space-y-2');
    });

    it('applies compact variant styling', () => {
      render(<ComplexityIndicator complexity="Medium" variant="compact" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('p-2', 'space-y-1');
    });

    it('applies minimal variant styling', () => {
      render(<ComplexityIndicator complexity="Medium" variant="minimal" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('p-1', 'space-y-1');
    });

    it('applies detailed variant styling', () => {
      render(<ComplexityIndicator complexity="Medium" variant="detailed" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('p-4', 'space-y-3');
    });
  });

  describe('Language Support', () => {
    it('renders German labels when lang is de', () => {
      render(<ComplexityIndicator complexity="Medium" lang="de" />);
      expect(screen.getByText('Mittel')).toBeInTheDocument();
    });

    it('renders English labels when lang is en', () => {
      render(<ComplexityIndicator complexity="Medium" lang="en" />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('shows German complexity descriptions', () => {
      render(<ComplexityIndicator complexity="Medium" lang="de" variant="detailed" />);
      expect(screen.getByText('Moderate Einrichtung')).toBeInTheDocument();
    });

    it('shows English complexity descriptions', () => {
      render(<ComplexityIndicator complexity="Medium" lang="en" variant="detailed" />);
      expect(screen.getByText('Moderate setup')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('calculates progress correctly for custom value', () => {
      render(<ComplexityIndicator complexity="Medium" value={75} maxValue={100} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('calculates progress correctly for default complexity values', () => {
      render(<ComplexityIndicator complexity="Low" />);
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('calculates progress correctly for medium complexity', () => {
      render(<ComplexityIndicator complexity="Medium" />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('calculates progress correctly for high complexity', () => {
      render(<ComplexityIndicator complexity="High" />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('caps progress at 100%', () => {
      render(<ComplexityIndicator complexity="Medium" value={150} maxValue={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('shows clickable styling when clickable is true', () => {
      render(<ComplexityIndicator complexity="Medium" clickable={true} />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('cursor-pointer');
    });

    it('calls onClick when clicked and clickable is true', () => {
      const onClick = jest.fn();
      render(<ComplexityIndicator complexity="Medium" clickable={true} onClick={onClick} />);
      
      const container = screen.getByRole('region');
      fireEvent.click(container);
      
      expect(onClick).toHaveBeenCalled();
    });

    it('does not call onClick when clickable is false', () => {
      const onClick = jest.fn();
      render(<ComplexityIndicator complexity="Medium" clickable={false} onClick={onClick} />);
      
      const container = screen.getByRole('region');
      fireEvent.click(container);
      
      expect(onClick).not.toHaveBeenCalled();
    });

    it('calls onHover when hovered', () => {
      const onHover = jest.fn();
      render(<ComplexityIndicator complexity="Medium" onHover={onHover} />);
      
      const container = screen.getByRole('region');
      fireEvent.mouseEnter(container);
      
      expect(onHover).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label', () => {
      render(<ComplexityIndicator complexity="Medium" ariaLabel="Custom complexity indicator" />);
      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('aria-label', 'Custom complexity indicator');
    });

    it('has correct aria-describedby', () => {
      render(<ComplexityIndicator complexity="Medium" ariaDescription="complexity-description" />);
      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('aria-describedby', 'complexity-description');
    });

    it('uses default aria-label when not provided', () => {
      render(<ComplexityIndicator complexity="Medium" />);
      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('aria-label', 'Medium');
    });
  });

  describe('Specialized Components', () => {
    it('renders WorkflowComplexityIndicator with workflow data', () => {
      render(<WorkflowComplexityIndicator workflow={mockWorkflow} />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument(); // 5 nodes out of 50 max
    });

    it('renders AgentComplexityIndicator with agent data', () => {
      render(<AgentComplexityIndicator agent={mockAgent} />);
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument(); // 5 total (3 functions + 2 tools) out of 20 max
    });

    it('has correct aria labels for workflow indicator', () => {
      render(<WorkflowComplexityIndicator workflow={mockWorkflow} />);
      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('aria-label', 'Workflow complexity: Medium');
      expect(container).toHaveAttribute('aria-describedby', '5 nodes, 2 integrations');
    });

    it('has correct aria labels for agent indicator', () => {
      render(<AgentComplexityIndicator agent={mockAgent} />);
      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('aria-label', 'Agent complexity: High');
      expect(container).toHaveAttribute('aria-describedby', '3 functions, 2 tools');
    });
  });

  describe('Animation Features', () => {
    it('shows animation when showAnimation is true', () => {
      render(<ComplexityIndicator complexity="Medium" showAnimation={true} />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('animate-pulse');
    });

    it('does not show animation when showAnimation is false', () => {
      render(<ComplexityIndicator complexity="Medium" showAnimation={false} />);
      const container = screen.getByRole('region');
      expect(container).not.toHaveClass('animate-pulse');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<ComplexityIndicator complexity="Medium" className="custom-class" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Value Display', () => {
    it('shows value display in detailed variant', () => {
      render(<ComplexityIndicator complexity="Medium" value={75} maxValue={100} variant="detailed" />);
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('of 100')).toBeInTheDocument();
    });

    it('does not show value display in non-detailed variants', () => {
      render(<ComplexityIndicator complexity="Medium" value={75} maxValue={100} variant="default" />);
      expect(screen.queryByText('75')).not.toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('shows hover effect when interactive', () => {
      render(<ComplexityIndicator complexity="Medium" interactive={true} />);
      const container = screen.getByRole('region');
      
      fireEvent.mouseEnter(container);
      expect(container).toHaveClass('scale-105');
    });

    it('does not show hover effect when not interactive', () => {
      render(<ComplexityIndicator complexity="Medium" interactive={false} />);
      const container = screen.getByRole('region');
      
      fireEvent.mouseEnter(container);
      expect(container).not.toHaveClass('scale-105');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero value', () => {
      render(<ComplexityIndicator complexity="Medium" value={0} maxValue={100} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles negative value', () => {
      render(<ComplexityIndicator complexity="Medium" value={-10} maxValue={100} />);
      expect(screen.getByText('0%')).toBeInTheDocument(); // Should cap at 0%
    });

    it('handles very large value', () => {
      render(<ComplexityIndicator complexity="Medium" value={1000} maxValue={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument(); // Should cap at 100%
    });

    it('handles zero maxValue', () => {
      render(<ComplexityIndicator complexity="Medium" value={50} maxValue={0} />);
      expect(screen.getByText('100%')).toBeInTheDocument(); // Should handle division by zero
    });
  });
});
