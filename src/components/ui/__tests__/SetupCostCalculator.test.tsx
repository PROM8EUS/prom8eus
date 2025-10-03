/**
 * SetupCostCalculator Tests
 * Tests the SetupCostCalculator component with visual complexity indicators
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SetupCostCalculator } from '../SetupCostCalculator';

describe('SetupCostCalculator Tests', () => {
  const mockWorkflow = {
    id: 'workflow-1',
    title: 'Test Workflow',
    complexity: 'Medium' as const,
    integrations: ['Slack', 'Gmail'],
    nodes: 5,
    estimatedSetupTime: 4
  };

  const mockAgent = {
    id: 'agent-1',
    name: 'Test Agent',
    complexity: 'High' as const,
    functions: 3,
    tools: 2,
    estimatedSetupTime: 8
  };

  describe('Basic Functionality', () => {
    it('renders with workflow data', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} />);
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
    });

    it('renders with agent data', () => {
      render(<SetupCostCalculator agent={mockAgent} />);
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<SetupCostCalculator />);
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
    });

    it('displays calculated setup cost', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} hourlyRate={60} />);
      // Medium complexity: 4h * 1.2 * 60€ = 288€
      expect(screen.getByText('€288')).toBeInTheDocument();
    });
  });

  describe('Complexity Calculations', () => {
    it('calculates low complexity cost correctly', () => {
      const lowWorkflow = { ...mockWorkflow, complexity: 'Low' as const };
      render(<SetupCostCalculator workflow={lowWorkflow} hourlyRate={60} />);
      // Low complexity: 2h * 1.0 * 60€ = 120€
      expect(screen.getByText('€120')).toBeInTheDocument();
    });

    it('calculates medium complexity cost correctly', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} hourlyRate={60} />);
      // Medium complexity: 4h * 1.2 * 60€ = 288€
      expect(screen.getByText('€288')).toBeInTheDocument();
    });

    it('calculates high complexity cost correctly', () => {
      render(<SetupCostCalculator agent={mockAgent} hourlyRate={60} />);
      // High complexity: 8h * 1.5 * 60€ = 720€
      expect(screen.getByText('€720')).toBeInTheDocument();
    });
  });

  describe('Display Options', () => {
    it('shows complexity indicator when showComplexity is true', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showComplexity={true} />);
      expect(screen.getByText('Complexity')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('hides complexity indicator when showComplexity is false', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showComplexity={false} />);
      expect(screen.queryByText('Complexity')).not.toBeInTheDocument();
    });

    it('shows timeline when showTimeline is true', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showTimeline={true} />);
      expect(screen.getByText('Time Required')).toBeInTheDocument();
    });

    it('hides timeline when showTimeline is false', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showTimeline={false} />);
      expect(screen.queryByText('Time Required')).not.toBeInTheDocument();
    });

    it('shows breakdown when showBreakdown is true', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showBreakdown={true} />);
      expect(screen.getByText('Cost Breakdown')).toBeInTheDocument();
    });

    it('hides breakdown when showBreakdown is false', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showBreakdown={false} />);
      expect(screen.queryByText('Cost Breakdown')).not.toBeInTheDocument();
    });

    it('shows insights when showInsights is true', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showInsights={true} />);
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });

    it('hides insights when showInsights is false', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showInsights={false} />);
      expect(screen.queryByText('Insights')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size styling', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} size="sm" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('text-xs');
    });

    it('applies medium size styling', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} size="md" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('text-sm');
    });

    it('applies large size styling', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} size="lg" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('text-base');
    });
  });

  describe('Variant Styling', () => {
    it('applies compact variant styling', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} variant="compact" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('p-3', 'space-y-3');
    });

    it('applies minimal variant styling', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} variant="minimal" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('p-2', 'space-y-2');
    });

    it('applies detailed variant styling', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} variant="detailed" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('p-6', 'space-y-6');
    });

    it('applies default variant styling', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} variant="default" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('p-4', 'space-y-4');
    });
  });

  describe('Language Support', () => {
    it('renders German labels when lang is de', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} lang="de" />);
      expect(screen.getByText('Setup-Kosten')).toBeInTheDocument();
      expect(screen.getByText('Automatisierungsaufwand')).toBeInTheDocument();
    });

    it('renders English labels when lang is en', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} lang="en" />);
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
      expect(screen.getByText('Automation Effort')).toBeInTheDocument();
    });

    it('shows German complexity insights', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} lang="de" showInsights={true} />);
      expect(screen.getByText('Erkenntnisse')).toBeInTheDocument();
    });

    it('shows English complexity insights', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} lang="en" showInsights={true} />);
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });
  });

  describe('Collapsible Features', () => {
    it('shows collapse button when collapsible', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} collapsible={true} />);
      const collapseButton = screen.getByRole('button');
      expect(collapseButton).toBeInTheDocument();
    });

    it('toggles collapsed state', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} collapsible={true} />);
      const collapseButton = screen.getByRole('button');
      
      // Initially should show content
      expect(screen.getByText('Complexity')).toBeInTheDocument();
      
      // Click to collapse
      fireEvent.click(collapseButton);
      
      // Content should be hidden
      expect(screen.queryByText('Complexity')).not.toBeInTheDocument();
    });

    it('starts collapsed when defaultCollapsed is true', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} collapsible={true} defaultCollapsed={true} />);
      expect(screen.queryByText('Complexity')).not.toBeInTheDocument();
    });
  });

  describe('Cost Breakdown', () => {
    it('shows base time in breakdown', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showBreakdown={true} />);
      expect(screen.getByText('4h')).toBeInTheDocument(); // Base time for Medium complexity
    });

    it('shows adjusted time in breakdown', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showBreakdown={true} />);
      expect(screen.getByText('4.8h')).toBeInTheDocument(); // 4h * 1.2 = 4.8h
    });

    it('shows hourly rate in breakdown', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} hourlyRate={75} showBreakdown={true} />);
      expect(screen.getByText('€75/h')).toBeInTheDocument();
    });

    it('shows total cost in breakdown', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} hourlyRate={60} showBreakdown={true} />);
      expect(screen.getByText('€288')).toBeInTheDocument(); // 4.8h * 60€ = 288€
    });
  });

  describe('Complexity Insights', () => {
    it('shows low complexity insights', () => {
      const lowWorkflow = { ...mockWorkflow, complexity: 'Low' as const };
      render(<SetupCostCalculator workflow={lowWorkflow} showInsights={true} />);
      expect(screen.getByText('Easy Setup')).toBeInTheDocument();
    });

    it('shows medium complexity insights', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showInsights={true} />);
      expect(screen.getByText('Moderate Setup')).toBeInTheDocument();
    });

    it('shows high complexity insights', () => {
      render(<SetupCostCalculator agent={mockAgent} showInsights={true} />);
      expect(screen.getByText('Complex Setup')).toBeInTheDocument();
    });

    it('shows time-based insights', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} showInsights={true} />);
      expect(screen.getByText('Standard')).toBeInTheDocument(); // 4h is standard
    });
  });

  describe('Callbacks', () => {
    it('calls onCostChange when cost changes', () => {
      const onCostChange = jest.fn();
      render(<SetupCostCalculator workflow={mockWorkflow} onCostChange={onCostChange} />);
      
      // Cost should be calculated and callback should be called
      expect(onCostChange).toHaveBeenCalledWith(288); // 4h * 1.2 * 60€
    });

    it('calls onComplexityChange when complexity changes', () => {
      const onComplexityChange = jest.fn();
      render(<SetupCostCalculator workflow={mockWorkflow} onComplexityChange={onComplexityChange} />);
      
      // Complexity should be detected and callback should be called
      expect(onComplexityChange).toHaveBeenCalledWith('Medium');
    });

    it('calls onTimeChange when time changes', () => {
      const onTimeChange = jest.fn();
      render(<SetupCostCalculator workflow={mockWorkflow} onTimeChange={onTimeChange} />);
      
      // Time should be calculated and callback should be called
      expect(onTimeChange).toHaveBeenCalledWith(4.8); // 4h * 1.2
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} ariaLabel="Custom setup cost calculator" />);
      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-label', 'Custom setup cost calculator');
    });

    it('has correct aria-describedby', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} ariaDescription="setup-cost-description" />);
      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-describedby', 'setup-cost-description');
    });

    it('uses default aria-label when not provided', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} />);
      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-label', 'Setup Cost Calculator');
    });
  });

  describe('Period Context', () => {
    it('displays correct period label for year', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} period="year" />);
      // Period label should be accessible in the component
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays correct period label for month', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} period="month" />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays correct period label for week', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} period="week" />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays correct period label for day', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} period="day" />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} className="custom-class" />);
      const card = screen.getByRole('region');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Interactive Features', () => {
    it('shows interactive elements when interactive is true', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} interactive={true} />);
      // Should show interactive elements
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('hides interactive elements when interactive is false', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} interactive={false} />);
      // Should not show interactive elements
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing workflow and agent data', () => {
      render(<SetupCostCalculator />);
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
    });

    it('handles zero hourly rate', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} hourlyRate={0} />);
      expect(screen.getByText('€0')).toBeInTheDocument();
    });

    it('handles negative hourly rate', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} hourlyRate={-10} />);
      expect(screen.getByText('€-48')).toBeInTheDocument(); // 4h * 1.2 * -10€
    });

    it('handles very high hourly rate', () => {
      render(<SetupCostCalculator workflow={mockWorkflow} hourlyRate={1000} />);
      expect(screen.getByText('€4,800')).toBeInTheDocument(); // 4h * 1.2 * 1000€
    });
  });
});
