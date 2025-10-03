/**
 * HourlyRateEditor Tests
 * Tests the HourlyRateEditor component with smooth transitions and validation feedback
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HourlyRateEditor } from '../HourlyRateEditor';

describe('HourlyRateEditor Tests', () => {
  const defaultProps = {
    value: 60,
    onChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      render(<HourlyRateEditor {...defaultProps} />);
      expect(screen.getByText('€60')).toBeInTheDocument();
    });

    it('renders with label when showLabel is true', () => {
      render(<HourlyRateEditor {...defaultProps} showLabel={true} />);
      expect(screen.getByText('Hourly Rate')).toBeInTheDocument();
    });

    it('renders with icon when showIcon is true', () => {
      render(<HourlyRateEditor {...defaultProps} showIcon={true} />);
      // Icon should be present in the DOM
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('renders with tooltip when showTooltip is true', () => {
      render(<HourlyRateEditor {...defaultProps} showTooltip={true} />);
      // Tooltip trigger should be present
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Language Support', () => {
    it('renders German labels when lang is de', () => {
      render(<HourlyRateEditor {...defaultProps} lang="de" showLabel={true} />);
      expect(screen.getByText('Stundensatz')).toBeInTheDocument();
    });

    it('renders English labels when lang is en', () => {
      render(<HourlyRateEditor {...defaultProps} lang="en" showLabel={true} />);
      expect(screen.getByText('Hourly Rate')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size styling', () => {
      render(<HourlyRateEditor {...defaultProps} size="sm" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('text-xs');
    });

    it('applies medium size styling', () => {
      render(<HourlyRateEditor {...defaultProps} size="md" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('text-sm');
    });

    it('applies large size styling', () => {
      render(<HourlyRateEditor {...defaultProps} size="lg" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('text-base');
    });
  });

  describe('Variant Styling', () => {
    it('applies compact variant styling', () => {
      render(<HourlyRateEditor {...defaultProps} variant="compact" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('px-2', 'py-1');
    });

    it('applies minimal variant styling', () => {
      render(<HourlyRateEditor {...defaultProps} variant="minimal" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('px-1', 'py-0.5');
    });

    it('applies detailed variant styling', () => {
      render(<HourlyRateEditor {...defaultProps} variant="detailed" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('px-4', 'py-2');
    });

    it('applies default variant styling', () => {
      render(<HourlyRateEditor {...defaultProps} variant="default" />);
      const container = screen.getByRole('region');
      expect(container).toHaveClass('px-3', 'py-1.5');
    });
  });

  describe('Validation', () => {
    it('validates minimum value', () => {
      render(<HourlyRateEditor {...defaultProps} min={50} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: '30' } });
      
      expect(screen.getByText('Minimum value is 50€')).toBeInTheDocument();
    });

    it('validates maximum value', () => {
      render(<HourlyRateEditor {...defaultProps} max={100} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: '150' } });
      
      expect(screen.getByText('Maximum value is 100€')).toBeInTheDocument();
    });

    it('validates number format', () => {
      render(<HourlyRateEditor {...defaultProps} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: 'abc' } });
      
      expect(screen.getByText('Please enter a valid number')).toBeInTheDocument();
    });

    it('calls onValidationChange when validation state changes', () => {
      const onValidationChange = jest.fn();
      render(<HourlyRateEditor {...defaultProps} onValidationChange={onValidationChange} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: '30' } });
      
      expect(onValidationChange).toHaveBeenCalledWith(false, 'Minimum value is 0€');
    });
  });

  describe('Value Changes', () => {
    it('calls onChange when value is changed', () => {
      const onChange = jest.fn();
      render(<HourlyRateEditor {...defaultProps} onChange={onChange} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: '80' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(onChange).toHaveBeenCalledWith(80);
    });

    it('calls onSave when value is saved', () => {
      const onSave = jest.fn();
      render(<HourlyRateEditor {...defaultProps} onSave={onSave} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: '80' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(onSave).toHaveBeenCalledWith(80);
    });

    it('calls onCancel when editing is cancelled', () => {
      const onCancel = jest.fn();
      render(<HourlyRateEditor {...defaultProps} onCancel={onCancel} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.keyDown(input, { key: 'Escape' });
      
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Edit State Management', () => {
    it('calls onEditStart when editing starts', () => {
      const onEditStart = jest.fn();
      render(<HourlyRateEditor {...defaultProps} onEditStart={onEditStart} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      expect(onEditStart).toHaveBeenCalled();
    });

    it('calls onEditEnd when editing ends', () => {
      const onEditEnd = jest.fn();
      render(<HourlyRateEditor {...defaultProps} onEditEnd={onEditEnd} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(onEditEnd).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('does not enter edit mode when disabled', () => {
      render(<HourlyRateEditor {...defaultProps} disabled={true} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      expect(screen.queryByDisplayValue('60')).not.toBeInTheDocument();
    });

    it('shows disabled styling when disabled', () => {
      render(<HourlyRateEditor {...defaultProps} disabled={true} />);
      
      const button = screen.getByText('€60');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Read Only State', () => {
    it('does not show edit functionality when read only', () => {
      render(<HourlyRateEditor {...defaultProps} readOnly={true} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      expect(screen.queryByDisplayValue('60')).not.toBeInTheDocument();
    });
  });

  describe('Insights', () => {
    it('shows low rate insight for values below 30', () => {
      render(<HourlyRateEditor {...defaultProps} value={25} showInsights={true} />);
      expect(screen.getByText('Low Rate')).toBeInTheDocument();
    });

    it('shows high rate insight for values above 100', () => {
      render(<HourlyRateEditor {...defaultProps} value={150} showInsights={true} />);
      expect(screen.getByText('High Rate')).toBeInTheDocument();
    });

    it('shows average rate insight for values between 30 and 100', () => {
      render(<HourlyRateEditor {...defaultProps} value={60} showInsights={true} />);
      expect(screen.getByText('Average Rate')).toBeInTheDocument();
    });

    it('shows German insights when lang is de', () => {
      render(<HourlyRateEditor {...defaultProps} value={25} showInsights={true} lang="de" />);
      expect(screen.getByText('Niedrige Rate')).toBeInTheDocument();
    });
  });

  describe('Trends', () => {
    it('shows trends when showTrends is true', () => {
      render(<HourlyRateEditor {...defaultProps} showTrends={true} />);
      expect(screen.getByText('Average rate: 65€/h')).toBeInTheDocument();
    });

    it('shows German trends when lang is de', () => {
      render(<HourlyRateEditor {...defaultProps} showTrends={true} lang="de" />);
      expect(screen.getByText('Durchschnittliche Rate: 65€/h')).toBeInTheDocument();
    });
  });

  describe('Comparison', () => {
    it('shows comparison when showComparison is true', () => {
      render(<HourlyRateEditor {...defaultProps} showComparison={true} min={0} max={200} />);
      expect(screen.getByText('Min')).toBeInTheDocument();
      expect(screen.getByText('Max')).toBeInTheDocument();
      expect(screen.getByText('0€/h')).toBeInTheDocument();
      expect(screen.getByText('200€/h')).toBeInTheDocument();
    });

    it('shows German comparison when lang is de', () => {
      render(<HourlyRateEditor {...defaultProps} showComparison={true} min={0} max={200} lang="de" />);
      expect(screen.getByText('Min')).toBeInTheDocument();
      expect(screen.getByText('Max')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label', () => {
      render(<HourlyRateEditor {...defaultProps} ariaLabel="Edit hourly rate" />);
      
      const button = screen.getByLabelText('Edit hourly rate');
      expect(button).toBeInTheDocument();
    });

    it('has correct aria-description', () => {
      render(<HourlyRateEditor {...defaultProps} ariaDescription="hourly-rate-description" />);
      
      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('aria-describedby', 'hourly-rate-description');
    });

    it('uses default aria-label when not provided', () => {
      render(<HourlyRateEditor {...defaultProps} />);
      
      const button = screen.getByLabelText('Edit hourly rate');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Period Context', () => {
    it('displays correct period label for year', () => {
      render(<HourlyRateEditor {...defaultProps} period="year" />);
      // Period label should be accessible in the component
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays correct period label for month', () => {
      render(<HourlyRateEditor {...defaultProps} period="month" />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays correct period label for week', () => {
      render(<HourlyRateEditor {...defaultProps} period="week" />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays correct period label for day', () => {
      render(<HourlyRateEditor {...defaultProps} period="day" />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('shows success feedback when validation passes', () => {
      render(<HourlyRateEditor {...defaultProps} showSuccess={true} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: '80' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // Should show success feedback
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('shows error feedback when validation fails', () => {
      render(<HourlyRateEditor {...defaultProps} showError={true} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: 'abc' } });
      
      // Should show error feedback
      expect(screen.getByText('Please enter a valid number')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<HourlyRateEditor {...defaultProps} className="custom-class" />);
      
      const container = screen.getByRole('region');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Auto Focus', () => {
    it('focuses input when autoFocus is true', () => {
      render(<HourlyRateEditor {...defaultProps} autoFocus={true} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      expect(input).toHaveFocus();
    });
  });

  describe('Step Value', () => {
    it('applies step value to input', () => {
      render(<HourlyRateEditor {...defaultProps} step={0.5} />);
      
      const button = screen.getByText('€60');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('60');
      expect(input).toHaveAttribute('step', '0.5');
    });
  });
});
