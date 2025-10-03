/**
 * Enhanced UI Components Integration Tests
 * Tests the integration of all enhanced UI components working together
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EffortSection } from '../EffortSection';
import { StatusBadge } from '../ui/StatusBadge';
import { InlineEdit, InlineEditCurrency } from '../ui/InlineEdit';
import { HourlyRateEditor } from '../ui/HourlyRateEditor';
import { SetupCostCalculator } from '../ui/SetupCostCalculator';
import { ComplexityIndicator } from '../ui/ComplexityIndicator';

describe('Enhanced UI Components Integration Tests', () => {
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

  describe('EffortSection with Enhanced Components', () => {
    it('integrates EffortSection with HourlyRateEditor', () => {
      const onHourlyRateChange = jest.fn();
      render(
        <EffortSection
          manualHours={40}
          automatedHours={10}
          hourlyRate={60}
          period="month"
          lang="en"
          onHourlyRateChange={onHourlyRateChange}
          interactive={true}
          showProgressBars={true}
          showAnimatedCounters={true}
          showROIBlock={true}
        />
      );

      // Should render EffortSection with enhanced features
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
      expect(screen.getByText('Time Comparison')).toBeInTheDocument();
      expect(screen.getByText('ROI Overview')).toBeInTheDocument();
      
      // Should show hourly rate editor
      expect(screen.getByText('€60')).toBeInTheDocument();
    });

    it('integrates EffortSection with progress bars and animated counters', () => {
      render(
        <EffortSection
          manualHours={40}
          automatedHours={10}
          hourlyRate={60}
          period="month"
          lang="en"
          showProgressBars={true}
          showAnimatedCounters={true}
          animated={true}
        />
      );

      // Should show progress bars
      expect(screen.getByText('Before (Manual)')).toBeInTheDocument();
      expect(screen.getByText('After (Automated)')).toBeInTheDocument();
      
      // Should show animated counters
      expect(screen.getByText('40.0h')).toBeInTheDocument();
      expect(screen.getByText('10.0h')).toBeInTheDocument();
    });

    it('integrates EffortSection with ROI block and insights', () => {
      render(
        <EffortSection
          manualHours={40}
          automatedHours={10}
          hourlyRate={60}
          period="month"
          lang="en"
          showROIBlock={true}
          showInsights={true}
        />
      );

      // Should show ROI block
      expect(screen.getByText('ROI Overview')).toBeInTheDocument();
      expect(screen.getByText('30.0h')).toBeInTheDocument(); // Saved hours
      expect(screen.getByText('1,800€')).toBeInTheDocument(); // Saved cost
      
      // Should show insights
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });
  });

  describe('StatusBadge Integration', () => {
    it('integrates StatusBadge with different contexts', () => {
      render(
        <div>
          <StatusBadge status="verified" context="workflow" showIcon={true} />
          <StatusBadge status="generated" context="agent" showIcon={true} />
          <StatusBadge status="fallback" context="prompt" showIcon={true} />
        </div>
      );

      // Should show different status badges
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('AI Generated')).toBeInTheDocument();
      expect(screen.getByText('Fallback')).toBeInTheDocument();
    });

    it('integrates StatusBadge with animations and effects', () => {
      render(
        <div>
          <StatusBadge status="success" animated={true} gradient={true} glow={true} />
          <StatusBadge status="warning" animated={true} shimmer={true} />
          <StatusBadge status="error" animated={true} pulse={true} />
        </div>
      );

      // Should show animated status badges
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('InlineEdit Integration', () => {
    it('integrates InlineEdit with different types', () => {
      const onChange = jest.fn();
      render(
        <div>
          <InlineEdit value="test" onChange={onChange} type="text" />
          <InlineEditCurrency value={60} onChange={onChange} />
        </div>
      );

      // Should show different inline edit components
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('€60')).toBeInTheDocument();
    });

    it('integrates InlineEdit with validation', () => {
      const onChange = jest.fn();
      const onValidate = jest.fn().mockReturnValue({ isValid: true });
      
      render(
        <InlineEdit
          value="test"
          onChange={onChange}
          onValidate={onValidate}
          showValidation={true}
        />
      );

      // Should show inline edit with validation
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });

  describe('HourlyRateEditor Integration', () => {
    it('integrates HourlyRateEditor with different configurations', () => {
      const onChange = jest.fn();
      render(
        <div>
          <HourlyRateEditor
            value={60}
            onChange={onChange}
            showLabel={true}
            showIcon={true}
            showTooltip={true}
            showValidation={true}
            showTrends={true}
            showInsights={true}
            lang="en"
          />
        </div>
      );

      // Should show hourly rate editor with all features
      expect(screen.getByText('Hourly Rate')).toBeInTheDocument();
      expect(screen.getByText('€60')).toBeInTheDocument();
    });

    it('integrates HourlyRateEditor with different sizes and variants', () => {
      const onChange = jest.fn();
      render(
        <div>
          <HourlyRateEditor
            value={60}
            onChange={onChange}
            size="sm"
            variant="compact"
            showLabel={true}
          />
          <HourlyRateEditor
            value={60}
            onChange={onChange}
            size="lg"
            variant="detailed"
            showLabel={true}
          />
        </div>
      );

      // Should show different sized hourly rate editors
      expect(screen.getAllByText('Hourly Rate')).toHaveLength(2);
      expect(screen.getAllByText('€60')).toHaveLength(2);
    });
  });

  describe('SetupCostCalculator Integration', () => {
    it('integrates SetupCostCalculator with workflow data', () => {
      render(
        <SetupCostCalculator
          workflow={mockWorkflow}
          hourlyRate={60}
          showBreakdown={true}
          showComplexity={true}
          showTimeline={true}
          showInsights={true}
          lang="en"
        />
      );

      // Should show setup cost calculator with workflow data
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
      expect(screen.getByText('€288')).toBeInTheDocument(); // 4h * 1.2 * 60€
      expect(screen.getByText('Complexity')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('integrates SetupCostCalculator with agent data', () => {
      render(
        <SetupCostCalculator
          agent={mockAgent}
          hourlyRate={60}
          showBreakdown={true}
          showComplexity={true}
          showTimeline={true}
          showInsights={true}
          lang="en"
        />
      );

      // Should show setup cost calculator with agent data
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
      expect(screen.getByText('€720')).toBeInTheDocument(); // 8h * 1.5 * 60€
      expect(screen.getByText('Complexity')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  describe('ComplexityIndicator Integration', () => {
    it('integrates ComplexityIndicator with different complexities', () => {
      render(
        <div>
          <ComplexityIndicator complexity="Low" showLabel={true} showIcon={true} showProgress={true} />
          <ComplexityIndicator complexity="Medium" showLabel={true} showIcon={true} showProgress={true} />
          <ComplexityIndicator complexity="High" showLabel={true} showIcon={true} showProgress={true} />
        </div>
      );

      // Should show different complexity indicators
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('integrates ComplexityIndicator with different sizes and variants', () => {
      render(
        <div>
          <ComplexityIndicator
            complexity="Medium"
            size="sm"
            variant="compact"
            showLabel={true}
            showIcon={true}
            showProgress={true}
          />
          <ComplexityIndicator
            complexity="Medium"
            size="lg"
            variant="detailed"
            showLabel={true}
            showIcon={true}
            showProgress={true}
          />
        </div>
      );

      // Should show different sized complexity indicators
      expect(screen.getAllByText('Medium')).toHaveLength(2);
    });
  });

  describe('Cross-Component Integration', () => {
    it('integrates all components in a complete workflow', () => {
      const onHourlyRateChange = jest.fn();
      const onCostChange = jest.fn();
      const onComplexityChange = jest.fn();

      render(
        <div className="space-y-4">
          {/* EffortSection with enhanced features */}
          <EffortSection
            manualHours={40}
            automatedHours={10}
            hourlyRate={60}
            period="month"
            lang="en"
            onHourlyRateChange={onHourlyRateChange}
            interactive={true}
            showProgressBars={true}
            showAnimatedCounters={true}
            showROIBlock={true}
            showInsights={true}
          />

          {/* SetupCostCalculator with workflow data */}
          <SetupCostCalculator
            workflow={mockWorkflow}
            hourlyRate={60}
            onCostChange={onCostChange}
            onComplexityChange={onComplexityChange}
            showBreakdown={true}
            showComplexity={true}
            showTimeline={true}
            showInsights={true}
            lang="en"
          />

          {/* ComplexityIndicator */}
          <ComplexityIndicator
            complexity="Medium"
            showLabel={true}
            showIcon={true}
            showProgress={true}
            showTooltip={true}
            lang="en"
          />

          {/* StatusBadge */}
          <StatusBadge
            status="verified"
            context="workflow"
            showIcon={true}
            animated={true}
            gradient={true}
          />
        </div>
      );

      // Should render all components together
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('integrates components with German language', () => {
      render(
        <div className="space-y-4">
          <EffortSection
            manualHours={40}
            automatedHours={10}
            hourlyRate={60}
            period="month"
            lang="de"
            showProgressBars={true}
            showROIBlock={true}
            showInsights={true}
          />

          <SetupCostCalculator
            workflow={mockWorkflow}
            hourlyRate={60}
            lang="de"
            showBreakdown={true}
            showComplexity={true}
            showInsights={true}
          />

          <ComplexityIndicator
            complexity="Medium"
            lang="de"
            showLabel={true}
            showIcon={true}
            showProgress={true}
          />
        </div>
      );

      // Should render all components in German
      expect(screen.getByText('Aufwand & ROI')).toBeInTheDocument();
      expect(screen.getByText('Setup-Kosten')).toBeInTheDocument();
      expect(screen.getByText('Mittel')).toBeInTheDocument();
    });
  });

  describe('Interactive Integration', () => {
    it('integrates interactive features across components', async () => {
      const onHourlyRateChange = jest.fn();
      const onCostChange = jest.fn();

      render(
        <div className="space-y-4">
          <EffortSection
            manualHours={40}
            automatedHours={10}
            hourlyRate={60}
            period="month"
            lang="en"
            onHourlyRateChange={onHourlyRateChange}
            interactive={true}
            showProgressBars={true}
            showROIBlock={true}
          />

          <SetupCostCalculator
            workflow={mockWorkflow}
            hourlyRate={60}
            onCostChange={onCostChange}
            interactive={true}
            showBreakdown={true}
            showComplexity={true}
            lang="en"
          />
        </div>
      );

      // Should render interactive components
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();

      // Should show hourly rate editor
      const hourlyRateButton = screen.getByText('€60');
      expect(hourlyRateButton).toBeInTheDocument();

      // Should be able to interact with hourly rate editor
      fireEvent.click(hourlyRateButton);
      
      // Should show input field
      await waitFor(() => {
        expect(screen.getByDisplayValue('60')).toBeInTheDocument();
      });
    });

    it('integrates collapsible features across components', () => {
      render(
        <div className="space-y-4">
          <EffortSection
            manualHours={40}
            automatedHours={10}
            hourlyRate={60}
            period="month"
            lang="en"
            collapsible={true}
            showProgressBars={true}
            showROIBlock={true}
          />

          <SetupCostCalculator
            workflow={mockWorkflow}
            hourlyRate={60}
            collapsible={true}
            showBreakdown={true}
            showComplexity={true}
            lang="en"
          />
        </div>
      );

      // Should show collapse buttons
      const collapseButtons = screen.getAllByRole('button');
      expect(collapseButtons.length).toBeGreaterThan(0);

      // Should be able to collapse components
      collapseButtons.forEach(button => {
        fireEvent.click(button);
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('integrates accessibility features across components', () => {
      render(
        <div className="space-y-4">
          <EffortSection
            manualHours={40}
            automatedHours={10}
            hourlyRate={60}
            period="month"
            lang="en"
            ariaLabel="Effort and ROI overview"
            ariaDescription="effort-description"
            showProgressBars={true}
            showROIBlock={true}
          />

          <SetupCostCalculator
            workflow={mockWorkflow}
            hourlyRate={60}
            ariaLabel="Setup cost calculator"
            ariaDescription="setup-cost-description"
            showBreakdown={true}
            showComplexity={true}
            lang="en"
          />

          <ComplexityIndicator
            complexity="Medium"
            ariaLabel="Workflow complexity indicator"
            ariaDescription="complexity-description"
            showLabel={true}
            showIcon={true}
            showProgress={true}
            lang="en"
          />
        </div>
      );

      // Should have proper ARIA attributes
      const regions = screen.getAllByRole('region');
      expect(regions).toHaveLength(3);

      regions.forEach(region => {
        expect(region).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Performance Integration', () => {
    it('integrates components with performance optimizations', () => {
      const startTime = performance.now();
      
      render(
        <div className="space-y-4">
          <EffortSection
            manualHours={40}
            automatedHours={10}
            hourlyRate={60}
            period="month"
            lang="en"
            animated={true}
            showProgressBars={true}
            showAnimatedCounters={true}
            showROIBlock={true}
          />

          <SetupCostCalculator
            workflow={mockWorkflow}
            hourlyRate={60}
            showBreakdown={true}
            showComplexity={true}
            showTimeline={true}
            showInsights={true}
            lang="en"
          />

          <ComplexityIndicator
            complexity="Medium"
            showLabel={true}
            showIcon={true}
            showProgress={true}
            showAnimation={true}
            lang="en"
          />
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);

      // Should render all components
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('integrates error handling across components', () => {
      // Test with invalid data
      const invalidWorkflow = {
        id: 'invalid',
        title: '',
        complexity: 'Medium' as const,
        integrations: [],
        nodes: -1,
        estimatedSetupTime: 0
      };

      render(
        <div className="space-y-4">
          <EffortSection
            manualHours={0}
            automatedHours={0}
            hourlyRate={0}
            period="month"
            lang="en"
            showProgressBars={true}
            showROIBlock={true}
          />

          <SetupCostCalculator
            workflow={invalidWorkflow}
            hourlyRate={0}
            showBreakdown={true}
            showComplexity={true}
            lang="en"
          />

          <ComplexityIndicator
            complexity="Medium"
            value={-10}
            maxValue={0}
            showLabel={true}
            showIcon={true}
            showProgress={true}
            lang="en"
          />
        </div>
      );

      // Should handle invalid data gracefully
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });
});
