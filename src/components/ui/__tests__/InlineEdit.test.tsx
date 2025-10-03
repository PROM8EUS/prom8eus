/**
 * InlineEdit Tests
 * Tests the InlineEdit component with smooth transitions and validation feedback
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  InlineEdit, 
  InlineEditNumber, 
  InlineEditCurrency, 
  InlineEditPercentage, 
  InlineEditTime 
} from '../InlineEdit';

describe('InlineEdit Tests', () => {
  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} />);
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('renders with custom display value', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" displayValue="Custom Display" onChange={onChange} />);
      expect(screen.getByText('Custom Display')).toBeInTheDocument();
    });

    it('renders with placeholder when value is empty', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="" placeholder="Click to edit" onChange={onChange} />);
      expect(screen.getByText('Click to edit')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('enters edit mode when clicked', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      expect(screen.getByDisplayValue('test')).toBeInTheDocument();
    });

    it('shows save and cancel buttons in edit mode', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      expect(screen.getByLabelText('Save changes')).toBeInTheDocument();
      expect(screen.getByLabelText('Cancel editing')).toBeInTheDocument();
    });

    it('saves changes when save button is clicked', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      const saveButton = screen.getByLabelText('Save changes');
      fireEvent.click(saveButton);
      
      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('cancels changes when cancel button is clicked', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      const cancelButton = screen.getByLabelText('Cancel editing');
      fireEvent.click(cancelButton);
      
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('saves changes when Enter is pressed', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'new value' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('cancels changes when Escape is pressed', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'new value' } });
      fireEvent.keyDown(input, { key: 'Escape' });
      
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation error when value is invalid', () => {
      const onChange = jest.fn();
      const onValidate = jest.fn().mockReturnValue({ isValid: false, message: 'Invalid value' });
      
      render(<InlineEdit value="test" onChange={onChange} onValidate={onValidate} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'invalid' } });
      
      expect(screen.getByText('Invalid value')).toBeInTheDocument();
    });

    it('disables save button when validation fails', () => {
      const onChange = jest.fn();
      const onValidate = jest.fn().mockReturnValue({ isValid: false, message: 'Invalid value' });
      
      render(<InlineEdit value="test" onChange={onChange} onValidate={onValidate} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'invalid' } });
      
      const saveButton = screen.getByLabelText('Save changes');
      expect(saveButton).toBeDisabled();
    });

    it('shows validation success when value is valid', () => {
      const onChange = jest.fn();
      const onValidate = jest.fn().mockReturnValue({ isValid: true, message: 'Valid value' });
      
      render(<InlineEdit value="test" onChange={onChange} onValidate={onValidate} showSuccess={true} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'valid' } });
      
      expect(screen.getByText('Valid value')).toBeInTheDocument();
    });
  });

  describe('Number Input', () => {
    it('renders number input with correct type', () => {
      const onChange = jest.fn();
      render(<InlineEdit value={42} type="number" onChange={onChange} />);
      
      const button = screen.getByText('42');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('42');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('validates number input with min/max constraints', () => {
      const onChange = jest.fn();
      render(<InlineEdit value={50} type="number" min={0} max={100} onChange={onChange} />);
      
      const button = screen.getByText('50');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('50');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });
  });

  describe('Specialized Components', () => {
    it('renders InlineEditNumber with number parsing', () => {
      const onChange = jest.fn();
      render(<InlineEditNumber value={42} onChange={onChange} />);
      
      const button = screen.getByText('42');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('42');
      fireEvent.change(input, { target: { value: '100' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(onChange).toHaveBeenCalledWith(100);
    });

    it('renders InlineEditCurrency with currency formatting', () => {
      const onChange = jest.fn();
      render(<InlineEditCurrency value={42} onChange={onChange} />);
      
      expect(screen.getByText('€42')).toBeInTheDocument();
    });

    it('renders InlineEditPercentage with percentage formatting', () => {
      const onChange = jest.fn();
      render(<InlineEditPercentage value={42} onChange={onChange} />);
      
      expect(screen.getByText('42.0%')).toBeInTheDocument();
    });

    it('renders InlineEditTime with time formatting', () => {
      const onChange = jest.fn();
      render(<InlineEditTime value={42} onChange={onChange} />);
      
      expect(screen.getByText('42.0h')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} ariaLabel="Edit test value" />);
      
      const button = screen.getByLabelText('Edit test value');
      expect(button).toBeInTheDocument();
    });

    it('has correct aria-describedby', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} ariaDescription="test-description" />);
      
      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('aria-describedby', 'test-description');
    });

    it('has correct aria-invalid when validation fails', () => {
      const onChange = jest.fn();
      const onValidate = jest.fn().mockReturnValue({ isValid: false, message: 'Invalid' });
      
      render(<InlineEdit value="test" onChange={onChange} onValidate={onValidate} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'invalid' } });
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Disabled State', () => {
    it('does not enter edit mode when disabled', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} disabled={true} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      expect(screen.queryByDisplayValue('test')).not.toBeInTheDocument();
    });

    it('shows disabled styling when disabled', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} disabled={true} />);
      
      const button = screen.getByText('test');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Read Only State', () => {
    it('does not show edit icon when read only', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} readOnly={true} />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows read only styling when read only', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} readOnly={true} />);
      
      const button = screen.getByText('test');
      expect(button).toHaveClass('cursor-default');
    });
  });

  describe('Transitions', () => {
    it('applies transition classes when animating', () => {
      const onChange = jest.fn();
      render(<InlineEdit value="test" onChange={onChange} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const container = screen.getByRole('region');
      expect(container).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('Custom Formatting', () => {
    it('uses custom formatValue function', () => {
      const onChange = jest.fn();
      const formatValue = jest.fn().mockReturnValue('Formatted: test');
      
      render(<InlineEdit value="test" onChange={onChange} formatValue={formatValue} />);
      
      expect(formatValue).toHaveBeenCalledWith('test');
      expect(screen.getByText('Formatted: test')).toBeInTheDocument();
    });

    it('uses custom parseValue function', () => {
      const onChange = jest.fn();
      const parseValue = jest.fn().mockReturnValue('parsed');
      
      render(<InlineEdit value="test" onChange={onChange} parseValue={parseValue} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'new value' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(parseValue).toHaveBeenCalledWith('new value');
      expect(onChange).toHaveBeenCalledWith('parsed');
    });
  });

  describe('Callbacks', () => {
    it('calls onEditStart when editing starts', () => {
      const onChange = jest.fn();
      const onEditStart = jest.fn();
      
      render(<InlineEdit value="test" onChange={onChange} onEditStart={onEditStart} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      expect(onEditStart).toHaveBeenCalled();
    });

    it('calls onEditEnd when editing ends', () => {
      const onChange = jest.fn();
      const onEditEnd = jest.fn();
      
      render(<InlineEdit value="test" onChange={onChange} onEditEnd={onEditEnd} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(onEditEnd).toHaveBeenCalled();
    });

    it('calls onSave when value is saved', () => {
      const onChange = jest.fn();
      const onSave = jest.fn();
      
      render(<InlineEdit value="test" onChange={onChange} onSave={onSave} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'new value' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(onSave).toHaveBeenCalledWith('new value');
    });

    it('calls onCancel when editing is cancelled', () => {
      const onChange = jest.fn();
      const onCancel = jest.fn();
      
      render(<InlineEdit value="test" onChange={onChange} onCancel={onCancel} />);
      
      const button = screen.getByText('test');
      fireEvent.click(button);
      
      const input = screen.getByDisplayValue('test');
      fireEvent.keyDown(input, { key: 'Escape' });
      
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
