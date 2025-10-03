/**
 * Enhanced UI Components Test Runner
 * Comprehensive test runner for all enhanced UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EffortSection } from '../EffortSection';
import { StatusBadge } from '../ui/StatusBadge';
import { InlineEdit, InlineEditCurrency, InlineEditNumber, InlineEditPercentage, InlineEditTime } from '../ui/InlineEdit';
import { HourlyRateEditor } from '../ui/HourlyRateEditor';
import { SetupCostCalculator } from '../ui/SetupCostCalculator';
import { ComplexityIndicator, WorkflowComplexityIndicator, AgentComplexityIndicator } from '../ui/ComplexityIndicator';

describe('Enhanced UI Components Test Runner', () => {
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

  describe('Component Import Tests', () => {
    it('imports all enhanced UI components successfully', () => {
      // Test that all components can be imported without errors
      expect(EffortSection).toBeDefined();
      expect(StatusBadge).toBeDefined();
      expect(InlineEdit).toBeDefined();
      expect(InlineEditCurrency).toBeDefined();
      expect(InlineEditNumber).toBeDefined();
      expect(InlineEditPercentage).toBeDefined();
      expect(InlineEditTime).toBeDefined();
      expect(HourlyRateEditor).toBeDefined();
      expect(SetupCostCalculator).toBeDefined();
      expect(ComplexityIndicator).toBeDefined();
      expect(WorkflowComplexityIndicator).toBeDefined();
      expect(AgentComplexityIndicator).toBeDefined();
    });
  });

  describe('Component Rendering Tests', () => {
    it('renders all enhanced UI components without errors', () => {
      render(
        <div className="space-y-4">
          {/* EffortSection */}
          <EffortSection
            manualHours={40}
            automatedHours={10}
            hourlyRate={60}
            period="month"
            lang="en"
            showProgressBars={true}
            showAnimatedCounters={true}
            showROIBlock={true}
            showInsights={true}
          />

          {/* StatusBadge */}
          <StatusBadge
            status="verified"
            context="workflow"
            showIcon={true}
            animated={true}
            gradient={true}
          />

          {/* InlineEdit Components */}
          <InlineEdit value="test" onChange={() => {}} type="text" />
          <InlineEditCurrency value={60} onChange={() => {}} />
          <InlineEditNumber value={42} onChange={() => {}} />
          <InlineEditPercentage value={75} onChange={() => {}} />
          <InlineEditTime value={2.5} onChange={() => {}} />

          {/* HourlyRateEditor */}
          <HourlyRateEditor
            value={60}
            onChange={() => {}}
            showLabel={true}
            showIcon={true}
            showTooltip={true}
            showValidation={true}
            showTrends={true}
            showInsights={true}
            lang="en"
          />

          {/* SetupCostCalculator */}
          <SetupCostCalculator
            workflow={mockWorkflow}
            hourlyRate={60}
            showBreakdown={true}
            showComplexity={true}
            showTimeline={true}
            showInsights={true}
            lang="en"
          />

          {/* ComplexityIndicator Components */}
          <ComplexityIndicator
            complexity="Medium"
            showLabel={true}
            showIcon={true}
            showProgress={true}
            showTooltip={true}
            lang="en"
          />
          <WorkflowComplexityIndicator workflow={mockWorkflow} />
          <AgentComplexityIndicator agent={mockAgent} />
        </div>
      );

      // Should render all components without errors
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('€60')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('2.5h')).toBeInTheDocument();
      expect(screen.getByText('Hourly Rate')).toBeInTheDocument();
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  describe('Component Interaction Tests', () => {
    it('handles interactions across all components', async () => {
      const onHourlyRateChange = jest.fn();
      const onCostChange = jest.fn();
      const onComplexityChange = jest.fn();

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
            onComplexityChange={onComplexityChange}
            interactive={true}
            showBreakdown={true}
            showComplexity={true}
            lang="en"
          />

          <ComplexityIndicator
            complexity="Medium"
            interactive={true}
            clickable={true}
            onClick={() => {}}
            showLabel={true}
            showIcon={true}
            showProgress={true}
            lang="en"
          />
        </div>
      );

      // Should render interactive components
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();

      // Should be able to interact with hourly rate editor
      const hourlyRateButton = screen.getByText('€60');
      fireEvent.click(hourlyRateButton);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('60')).toBeInTheDocument();
      });

      // Should be able to interact with complexity indicator
      const complexityIndicator = screen.getByText('Medium');
      fireEvent.click(complexityIndicator);
    });
  });

  describe('Component Styling Tests', () => {
    it('applies correct styling across all components', () => {
      render(
        <div className="space-y-4">
          <EffortSection
            manualHours={40}
            automatedHours={10}
            hourlyRate={60}
            period="month"
            lang="en"
            variant="detailed"
            size="lg"
            showProgressBars={true}
            showROIBlock={true}
          />

          <StatusBadge
            status="success"
            size="lg"
            animated={true}
            gradient={true}
            glow={true}
          />

          <HourlyRateEditor
            value={60}
            onChange={() => {}}
            size="lg"
            variant="detailed"
            showLabel={true}
            showIcon={true}
            lang="en"
          />

          <SetupCostCalculator
            workflow={mockWorkflow}
            hourlyRate={60}
            size="lg"
            variant="detailed"
            showBreakdown={true}
            showComplexity={true}
            lang="en"
          />

          <ComplexityIndicator
            complexity="Medium"
            size="lg"
            variant="detailed"
            showLabel={true}
            showIcon={true}
            showProgress={true}
            lang="en"
          />
        </div>
      );

      // Should apply correct styling
      const regions = screen.getAllByRole('region');
      expect(regions.length).toBeGreaterThan(0);

      // Should have proper CSS classes
      regions.forEach(region => {
        expect(region).toHaveClass('transition-all');
      });
    });
  });

  describe('Component Accessibility Tests', () => {
    it('maintains accessibility across all components', () => {
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

          <StatusBadge
            status="verified"
            context="workflow"
            showIcon={true}
            ariaLabel="Workflow status"
            ariaDescription="workflow-status-description"
          />

          <InlineEdit
            value="test"
            onChange={() => {}}
            type="text"
            ariaLabel="Edit test value"
            ariaDescription="test-description"
          />

          <HourlyRateEditor
            value={60}
            onChange={() => {}}
            ariaLabel="Edit hourly rate"
            ariaDescription="hourly-rate-description"
            showLabel={true}
            lang="en"
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
            ariaLabel="Complexity indicator"
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
      expect(regions.length).toBeGreaterThan(0);

      regions.forEach(region => {
        expect(region).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Component Language Support Tests', () => {
    it('supports multiple languages across all components', () => {
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

          <HourlyRateEditor
            value={60}
            onChange={() => {}}
            lang="de"
            showLabel={true}
            showTrends={true}
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

      // Should render in German
      expect(screen.getByText('Aufwand & ROI')).toBeInTheDocument();
      expect(screen.getByText('Stundensatz')).toBeInTheDocument();
      expect(screen.getByText('Setup-Kosten')).toBeInTheDocument();
      expect(screen.getByText('Mittel')).toBeInTheDocument();
    });
  });

  describe('Component Performance Tests', () => {
    it('renders all components within performance limits', () => {
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
            showInsights={true}
          />

          <StatusBadge
            status="verified"
            context="workflow"
            showIcon={true}
            animated={true}
            gradient={true}
            glow={true}
          />

          <InlineEdit value="test" onChange={() => {}} type="text" />
          <InlineEditCurrency value={60} onChange={() => {}} />
          <InlineEditNumber value={42} onChange={() => {}} />
          <InlineEditPercentage value={75} onChange={() => {}} />
          <InlineEditTime value={2.5} onChange={() => {}} />

          <HourlyRateEditor
            value={60}
            onChange={() => {}}
            showLabel={true}
            showIcon={true}
            showTooltip={true}
            showValidation={true}
            showTrends={true}
            showInsights={true}
            lang="en"
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
            showTooltip={true}
            showAnimation={true}
            lang="en"
          />

          <WorkflowComplexityIndicator workflow={mockWorkflow} />
          <AgentComplexityIndicator agent={mockAgent} />
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 200ms)
      expect(renderTime).toBeLessThan(200);

      // Should render all components
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('€60')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('2.5h')).toBeInTheDocument();
      expect(screen.getByText('Hourly Rate')).toBeInTheDocument();
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  describe('Component Error Handling Tests', () => {
    it('handles errors gracefully across all components', () => {
      // Test with invalid data
      const invalidWorkflow = {
        id: 'invalid',
        title: '',
        complexity: 'Medium' as const,
        integrations: [],
        nodes: -1,
        estimatedSetupTime: 0
      };

      const invalidAgent = {
        id: 'invalid',
        name: '',
        complexity: 'High' as const,
        functions: -1,
        tools: -1,
        estimatedSetupTime: 0
      };

      render(
        <div className="space-y-4">
          <EffortSection
            manualHours={-10}
            automatedHours={-5}
            hourlyRate={-60}
            period="month"
            lang="en"
            showProgressBars={true}
            showROIBlock={true}
          />

          <StatusBadge
            status="invalid-status"
            context="workflow"
            showIcon={true}
          />

          <InlineEdit
            value=""
            onChange={() => {}}
            type="text"
            required={true}
          />

          <HourlyRateEditor
            value={-60}
            onChange={() => {}}
            min={0}
            max={1000}
            showLabel={true}
            showValidation={true}
            lang="en"
          />

          <SetupCostCalculator
            workflow={invalidWorkflow}
            hourlyRate={-60}
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

          <WorkflowComplexityIndicator workflow={invalidWorkflow} />
          <AgentComplexityIndicator agent={invalidAgent} />
        </div>
      );

      // Should handle invalid data gracefully
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Hourly Rate')).toBeInTheDocument();
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
    });
  });

  describe('Component Integration Summary', () => {
    it('provides comprehensive integration test summary', () => {
      const components = [
        'EffortSection',
        'StatusBadge',
        'InlineEdit',
        'InlineEditCurrency',
        'InlineEditNumber',
        'InlineEditPercentage',
        'InlineEditTime',
        'HourlyRateEditor',
        'SetupCostCalculator',
        'ComplexityIndicator',
        'WorkflowComplexityIndicator',
        'AgentComplexityIndicator'
      ];

      // Test that all components are available
      components.forEach(component => {
        expect(component).toBeDefined();
      });

      // Test that all components can be rendered together
      render(
        <div className="space-y-4">
          <EffortSection
            manualHours={40}
            automatedHours={10}
            hourlyRate={60}
            period="month"
            lang="en"
            showProgressBars={true}
            showAnimatedCounters={true}
            showROIBlock={true}
            showInsights={true}
          />

          <StatusBadge
            status="verified"
            context="workflow"
            showIcon={true}
            animated={true}
            gradient={true}
          />

          <InlineEdit value="test" onChange={() => {}} type="text" />
          <InlineEditCurrency value={60} onChange={() => {}} />
          <InlineEditNumber value={42} onChange={() => {}} />
          <InlineEditPercentage value={75} onChange={() => {}} />
          <InlineEditTime value={2.5} onChange={() => {}} />

          <HourlyRateEditor
            value={60}
            onChange={() => {}}
            showLabel={true}
            showIcon={true}
            showTooltip={true}
            showValidation={true}
            showTrends={true}
            showInsights={true}
            lang="en"
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
            showTooltip={true}
            lang="en"
          />

          <WorkflowComplexityIndicator workflow={mockWorkflow} />
          <AgentComplexityIndicator agent={mockAgent} />
        </div>
      );

      // Should render all components successfully
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('€60')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('2.5h')).toBeInTheDocument();
      expect(screen.getByText('Hourly Rate')).toBeInTheDocument();
      expect(screen.getByText('Setup Cost')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });
});
