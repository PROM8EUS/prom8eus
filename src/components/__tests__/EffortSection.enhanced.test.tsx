/**
 * Enhanced EffortSection Tests
 * Tests the enhanced EffortSection component with progress bars, animated counters, and modern ROIBlock integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EffortSection } from '../EffortSection';

describe('Enhanced EffortSection Tests', () => {
  const defaultProps = {
    manualHours: 40,
    automatedHours: 10,
    hourlyRate: 60,
    period: 'month' as const,
    lang: 'en' as const
  };

  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      render(<EffortSection {...defaultProps} />);
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
    });

    it('renders with German language', () => {
      render(<EffortSection {...defaultProps} lang="de" />);
      expect(screen.getByText('Aufwand & ROI')).toBeInTheDocument();
    });

    it('displays correct manual and automated hours', () => {
      render(<EffortSection {...defaultProps} />);
      expect(screen.getByText('40.0h')).toBeInTheDocument();
      expect(screen.getByText('10.0h')).toBeInTheDocument();
    });

    it('calculates and displays savings correctly', () => {
      render(<EffortSection {...defaultProps} />);
      // 40 - 10 = 30 hours saved
      expect(screen.getByText('30.0h')).toBeInTheDocument();
    });
  });

  describe('Enhanced Features', () => {
    it('shows progress bars when enabled', () => {
      render(<EffortSection {...defaultProps} showProgressBars={true} />);
      expect(screen.getByText('Time Comparison')).toBeInTheDocument();
    });

    it('hides progress bars when disabled', () => {
      render(<EffortSection {...defaultProps} showProgressBars={false} />);
      expect(screen.queryByText('Time Comparison')).not.toBeInTheDocument();
    });

    it('shows ROI block when enabled', () => {
      render(<EffortSection {...defaultProps} showROIBlock={true} />);
      expect(screen.getByText('ROI Overview')).toBeInTheDocument();
    });

    it('hides ROI block when disabled', () => {
      render(<EffortSection {...defaultProps} showROIBlock={false} />);
      expect(screen.queryByText('ROI Overview')).not.toBeInTheDocument();
    });

    it('shows detailed breakdown when enabled', () => {
      render(<EffortSection {...defaultProps} showDetailedBreakdown={true} />);
      expect(screen.getByText('Detailed Breakdown')).toBeInTheDocument();
    });

    it('shows insights when enabled', () => {
      render(<EffortSection {...defaultProps} showInsights={true} />);
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });
  });

  describe('Variant Styling', () => {
    it('applies compact variant styling', () => {
      render(<EffortSection {...defaultProps} variant="compact" />);
      const card = screen.getByRole('region');
      expect(card).toHaveClass('p-3');
    });

    it('applies detailed variant styling', () => {
      render(<EffortSection {...defaultProps} variant="detailed" />);
      const card = screen.getByRole('region');
      expect(card).toHaveClass('p-6');
    });

    it('applies minimal variant styling', () => {
      render(<EffortSection {...defaultProps} variant="minimal" />);
      const card = screen.getByRole('region');
      expect(card).toHaveClass('p-2');
    });

    it('applies default variant styling', () => {
      render(<EffortSection {...defaultProps} variant="default" />);
      const card = screen.getByRole('region');
      expect(card).toHaveClass('p-5');
    });
  });

  describe('Interactive Features', () => {
    it('allows editing hourly rate when interactive', () => {
      const onHourlyRateChange = jest.fn();
      render(
        <EffortSection 
          {...defaultProps} 
          interactive={true} 
          onHourlyRateChange={onHourlyRateChange}
        />
      );
      
      const editButton = screen.getByText('[60 €/h]');
      fireEvent.click(editButton);
      
      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    });

    it('saves hourly rate changes', () => {
      const onHourlyRateChange = jest.fn();
      render(
        <EffortSection 
          {...defaultProps} 
          interactive={true} 
          onHourlyRateChange={onHourlyRateChange}
        />
      );
      
      const editButton = screen.getByText('[60 €/h]');
      fireEvent.click(editButton);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: '80' } });
      
      const saveButton = screen.getByRole('button', { name: /check/i });
      fireEvent.click(saveButton);
      
      expect(onHourlyRateChange).toHaveBeenCalledWith(80);
    });

    it('cancels hourly rate changes', () => {
      const onHourlyRateChange = jest.fn();
      render(
        <EffortSection 
          {...defaultProps} 
          interactive={true} 
          onHourlyRateChange={onHourlyRateChange}
        />
      );
      
      const editButton = screen.getByText('[60 €/h]');
      fireEvent.click(editButton);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: '80' } });
      
      const cancelButton = screen.getByRole('button', { name: /x/i });
      fireEvent.click(cancelButton);
      
      expect(onHourlyRateChange).not.toHaveBeenCalled();
      expect(screen.getByText('[60 €/h]')).toBeInTheDocument();
    });

    it('disables interactive features when interactive is false', () => {
      render(<EffortSection {...defaultProps} interactive={false} />);
      expect(screen.queryByText('[60 €/h]')).not.toBeInTheDocument();
    });
  });

  describe('Collapsible Features', () => {
    it('shows collapse button when collapsible', () => {
      render(<EffortSection {...defaultProps} collapsible={true} />);
      const collapseButton = screen.getByRole('button');
      expect(collapseButton).toBeInTheDocument();
    });

    it('toggles collapsed state', () => {
      render(<EffortSection {...defaultProps} collapsible={true} />);
      const collapseButton = screen.getByRole('button');
      
      // Initially should show content
      expect(screen.getByText('Time Comparison')).toBeInTheDocument();
      
      // Click to collapse
      fireEvent.click(collapseButton);
      
      // Content should be hidden
      expect(screen.queryByText('Time Comparison')).not.toBeInTheDocument();
    });

    it('starts collapsed when defaultCollapsed is true', () => {
      render(<EffortSection {...defaultProps} collapsible={true} defaultCollapsed={true} />);
      expect(screen.queryByText('Time Comparison')).not.toBeInTheDocument();
    });
  });

  describe('Data Visualization', () => {
    it('shows percentages when enabled', () => {
      render(<EffortSection {...defaultProps} showPercentage={true} />);
      // Should show percentage badges
      const badges = screen.getAllByText(/\d+%/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('hides percentages when disabled', () => {
      render(<EffortSection {...defaultProps} showPercentage={false} />);
      const badges = screen.queryAllByText(/\d+%/);
      expect(badges).toHaveLength(0);
    });

    it('shows currency when enabled', () => {
      render(<EffortSection {...defaultProps} showCurrency={true} />);
      expect(screen.getByText(/€/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label', () => {
      render(<EffortSection {...defaultProps} ariaLabel="Custom effort overview" />);
      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-label', 'Custom effort overview');
    });

    it('has correct aria-describedby', () => {
      render(<EffortSection {...defaultProps} ariaDescription="effort-description" />);
      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-describedby', 'effort-description');
    });

    it('uses default aria-label when not provided', () => {
      render(<EffortSection {...defaultProps} />);
      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-label', 'Effort and ROI Overview');
    });
  });

  describe('Animation Features', () => {
    it('disables animations when animated is false', () => {
      render(<EffortSection {...defaultProps} animated={false} />);
      // Should still render but without animations
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
    });

    it('enables animations by default', () => {
      render(<EffortSection {...defaultProps} />);
      // Should render with animations
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
    });
  });

  describe('Period Calculations', () => {
    it('displays correct period labels', () => {
      const { rerender } = render(<EffortSection {...defaultProps} period="year" />);
      expect(screen.getByText(/year/)).toBeInTheDocument();

      rerender(<EffortSection {...defaultProps} period="week" />);
      expect(screen.getByText(/week/)).toBeInTheDocument();

      rerender(<EffortSection {...defaultProps} period="day" />);
      expect(screen.getByText(/day/)).toBeInTheDocument();
    });

    it('displays correct German period labels', () => {
      const { rerender } = render(<EffortSection {...defaultProps} period="year" lang="de" />);
      expect(screen.getByText(/Jahr/)).toBeInTheDocument();

      rerender(<EffortSection {...defaultProps} period="week" lang="de" />);
      expect(screen.getByText(/Woche/)).toBeInTheDocument();

      rerender(<EffortSection {...defaultProps} period="day" lang="de" />);
      expect(screen.getByText(/Tag/)).toBeInTheDocument();
    });
  });

  describe('ROI Calculations', () => {
    it('calculates correct savings', () => {
      render(<EffortSection {...defaultProps} />);
      // 40 - 10 = 30 hours saved
      expect(screen.getByText('30.0h')).toBeInTheDocument();
    });

    it('calculates correct cost savings', () => {
      render(<EffortSection {...defaultProps} />);
      // 30 hours * 60€/hour = 1800€ saved
      expect(screen.getByText('1,800€')).toBeInTheDocument();
    });

    it('calculates correct savings percentage', () => {
      render(<EffortSection {...defaultProps} />);
      // (30/40) * 100 = 75%
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Progress Bars', () => {
    it('renders progress bars with correct values', () => {
      render(<EffortSection {...defaultProps} showProgressBars={true} />);
      
      // Should show both manual and automated progress bars
      expect(screen.getByText('Before (Manual)')).toBeInTheDocument();
      expect(screen.getByText('After (Automated)')).toBeInTheDocument();
    });

    it('shows correct progress bar percentages', () => {
      render(<EffortSection {...defaultProps} showProgressBars={true} showPercentage={true} />);
      
      // Manual: 100% (40/40)
      // Automated: 25% (10/40)
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });

  describe('Insights Section', () => {
    it('shows efficiency insights', () => {
      render(<EffortSection {...defaultProps} showInsights={true} />);
      expect(screen.getByText(/You save 75% of your time/)).toBeInTheDocument();
    });

    it('shows ROI insights', () => {
      render(<EffortSection {...defaultProps} showInsights={true} />);
      expect(screen.getByText(/ROI of/)).toBeInTheDocument();
    });

    it('shows German insights', () => {
      render(<EffortSection {...defaultProps} showInsights={true} lang="de" />);
      expect(screen.getByText(/Sie sparen 75% Ihrer Zeit/)).toBeInTheDocument();
    });
  });

  describe('Detailed Breakdown', () => {
    it('shows manual and automated costs', () => {
      render(<EffortSection {...defaultProps} showDetailedBreakdown={true} />);
      
      // Manual: 40 * 60 = 2400€
      // Automated: 10 * 60 = 600€
      expect(screen.getByText('2,400€')).toBeInTheDocument();
      expect(screen.getByText('600€')).toBeInTheDocument();
    });

    it('shows German cost labels', () => {
      render(<EffortSection {...defaultProps} showDetailedBreakdown={true} lang="de" />);
      expect(screen.getByText('Manuelle Kosten')).toBeInTheDocument();
      expect(screen.getByText('Automatisierte Kosten')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles zero manual hours', () => {
      render(<EffortSection {...defaultProps} manualHours={0} />);
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
    });

    it('handles zero automated hours', () => {
      render(<EffortSection {...defaultProps} automatedHours={0} />);
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
    });

    it('handles zero hourly rate', () => {
      render(<EffortSection {...defaultProps} hourlyRate={0} />);
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
    });

    it('handles negative values gracefully', () => {
      render(<EffortSection {...defaultProps} manualHours={-10} />);
      expect(screen.getByText('Effort & ROI')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<EffortSection {...defaultProps} className="custom-class" />);
      const card = screen.getByRole('region');
      expect(card).toHaveClass('custom-class');
    });

    it('maintains default styling when no custom className', () => {
      render(<EffortSection {...defaultProps} />);
      const card = screen.getByRole('region');
      expect(card).toHaveClass('bg-gradient-to-br');
    });
  });
});
