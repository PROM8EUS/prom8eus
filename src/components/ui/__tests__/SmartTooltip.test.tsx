/**
 * SmartTooltip Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartTooltip } from '../SmartTooltip';

const mockContent = {
  title: 'Test Tooltip',
  description: 'This is a test tooltip description',
  examples: ['Example 1', 'Example 2'],
  tips: ['Tip 1', 'Tip 2'],
  links: [
    { text: 'Link 1', url: 'https://example.com', external: true }
  ],
  related: ['Related 1', 'Related 2']
};

describe('SmartTooltip', () => {
  it('renders without crashing', () => {
    render(
      <SmartTooltip content={mockContent}>
        <button>Test Button</button>
      </SmartTooltip>
    );
    
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('shows tooltip on hover when trigger is hover', async () => {
    render(
      <SmartTooltip content={mockContent} trigger="hover">
        <button>Test Button</button>
      </SmartTooltip>
    );
    
    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);
    
    await waitFor(() => {
      expect(screen.getByText('Test Tooltip')).toBeInTheDocument();
    });
  });

  it('shows tooltip on click when trigger is click', async () => {
    render(
      <SmartTooltip content={mockContent} trigger="click">
        <button>Test Button</button>
      </SmartTooltip>
    );
    
    const button = screen.getByText('Test Button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Test Tooltip')).toBeInTheDocument();
    });
  });

  it('displays all content sections when provided', async () => {
    render(
      <SmartTooltip content={mockContent} trigger="click">
        <button>Test Button</button>
      </SmartTooltip>
    );
    
    const button = screen.getByText('Test Button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Test Tooltip')).toBeInTheDocument();
      expect(screen.getByText('This is a test tooltip description')).toBeInTheDocument();
      expect(screen.getByText('Examples:')).toBeInTheDocument();
      expect(screen.getByText('Tips:')).toBeInTheDocument();
      expect(screen.getByText('Learn more:')).toBeInTheDocument();
      expect(screen.getByText('Related topics:')).toBeInTheDocument();
    });
  });

  it('applies correct variant styles', async () => {
    const { container } = render(
      <SmartTooltip content={mockContent} trigger="click" variant="warning">
        <button>Test Button</button>
      </SmartTooltip>
    );
    
    const button = screen.getByText('Test Button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const tooltip = container.querySelector('.border-yellow-200');
      expect(tooltip).toBeInTheDocument();
    });
  });

  it('calls onOpen and onClose callbacks', async () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    
    render(
      <SmartTooltip 
        content={mockContent} 
        trigger="click" 
        onOpen={onOpen}
        onClose={onClose}
      >
        <button>Test Button</button>
      </SmartTooltip>
    );
    
    const button = screen.getByText('Test Button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(onOpen).toHaveBeenCalled();
    });
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows close button when persistent', async () => {
    render(
      <SmartTooltip content={mockContent} trigger="click" persistent={true}>
        <button>Test Button</button>
      </SmartTooltip>
    );
    
    const button = screen.getByText('Test Button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: '' });
      expect(closeButton).toBeInTheDocument();
    });
  });

  it('displays progress information when showProgress is enabled', async () => {
    render(
      <SmartTooltip 
        content={mockContent} 
        trigger="click" 
        showProgress={true}
        progressValue={75}
        progressMax={100}
      >
        <button>Test Button</button>
      </SmartTooltip>
    );
    
    const button = screen.getByText('Test Button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });
});
