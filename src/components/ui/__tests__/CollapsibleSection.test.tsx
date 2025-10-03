/**
 * CollapsibleSection Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollapsibleSection } from '../CollapsibleSection';
import { SmartDefaultsProvider } from '../../SmartDefaultsManager';

// Mock the SmartDefaultsProvider for testing
const MockSmartDefaultsProvider = ({ children }: { children: React.ReactNode }) => (
  <SmartDefaultsProvider>
    {children}
  </SmartDefaultsProvider>
);

describe('CollapsibleSection', () => {
  const defaultProps = {
    title: 'Test Section',
    description: 'Test description',
    children: <div>Test content</div>
  };

  it('renders without crashing', () => {
    render(
      <MockSmartDefaultsProvider>
        <CollapsibleSection {...defaultProps} />
      </MockSmartDefaultsProvider>
    );
    
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('shows content when expanded', () => {
    render(
      <MockSmartDefaultsProvider>
        <CollapsibleSection {...defaultProps} defaultExpanded={true} />
      </MockSmartDefaultsProvider>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('hides content when collapsed', () => {
    render(
      <MockSmartDefaultsProvider>
        <CollapsibleSection {...defaultProps} defaultExpanded={false} />
      </MockSmartDefaultsProvider>
    );
    
    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('toggles content when header is clicked', async () => {
    render(
      <MockSmartDefaultsProvider>
        <CollapsibleSection {...defaultProps} defaultExpanded={false} />
      </MockSmartDefaultsProvider>
    );
    
    const header = screen.getByText('Test Section').closest('div');
    fireEvent.click(header!);
    
    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  it('displays badge when provided', () => {
    render(
      <MockSmartDefaultsProvider>
        <CollapsibleSection 
          {...defaultProps} 
          badge={{ text: 'Test Badge', count: 5 }}
        />
      </MockSmartDefaultsProvider>
    );
    
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('applies priority styles correctly', () => {
    const { container } = render(
      <MockSmartDefaultsProvider>
        <CollapsibleSection {...defaultProps} priority="high" />
      </MockSmartDefaultsProvider>
    );
    
    const card = container.querySelector('.border-l-primary');
    expect(card).toBeInTheDocument();
  });

  it('calls onToggle when toggled', () => {
    const onToggle = jest.fn();
    
    render(
      <MockSmartDefaultsProvider>
        <CollapsibleSection {...defaultProps} onToggle={onToggle} />
      </MockSmartDefaultsProvider>
    );
    
    const header = screen.getByText('Test Section').closest('div');
    fireEvent.click(header!);
    
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('shows progress bar when enabled', () => {
    render(
      <MockSmartDefaultsProvider>
        <CollapsibleSection 
          {...defaultProps} 
          showProgress={true}
          progressValue={75}
          progressMax={100}
        />
      </MockSmartDefaultsProvider>
    );
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays empty state when no content', () => {
    render(
      <MockSmartDefaultsProvider>
        <CollapsibleSection 
          title="Empty Section"
          description="No content"
          children={null}
        />
      </MockSmartDefaultsProvider>
    );
    
    expect(screen.getByText(/No content available/)).toBeInTheDocument();
  });
});
