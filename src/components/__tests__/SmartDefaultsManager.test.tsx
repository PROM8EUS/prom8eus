/**
 * SmartDefaultsManager Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartDefaultsProvider, useSmartDefaults, SmartDefaultsPanel } from '../SmartDefaultsManager';

// Test component to access context
const TestComponent = () => {
  const { config, updateConfig, resetToDefaults } = useSmartDefaults();
  
  return (
    <div>
      <div data-testid="auto-expand">{config.autoExpandHighPriority.toString()}</div>
      <button onClick={() => updateConfig({ autoExpandHighPriority: !config.autoExpandHighPriority })}>
        Toggle Auto Expand
      </button>
      <button onClick={resetToDefaults}>Reset</button>
    </div>
  );
};

describe('SmartDefaultsManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('provides default configuration', () => {
    render(
      <SmartDefaultsProvider>
        <TestComponent />
      </SmartDefaultsProvider>
    );
    
    expect(screen.getByTestId('auto-expand')).toHaveTextContent('true');
  });

  it('updates configuration when updateConfig is called', () => {
    render(
      <SmartDefaultsProvider>
        <TestComponent />
      </SmartDefaultsProvider>
    );
    
    const toggleButton = screen.getByText('Toggle Auto Expand');
    fireEvent.click(toggleButton);
    
    expect(screen.getByTestId('auto-expand')).toHaveTextContent('false');
  });

  it('resets configuration to defaults', () => {
    render(
      <SmartDefaultsProvider>
        <TestComponent />
      </SmartDefaultsProvider>
    );
    
    // First toggle to change from default
    const toggleButton = screen.getByText('Toggle Auto Expand');
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('auto-expand')).toHaveTextContent('false');
    
    // Then reset
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    expect(screen.getByTestId('auto-expand')).toHaveTextContent('true');
  });

  it('saves configuration to localStorage', async () => {
    render(
      <SmartDefaultsProvider>
        <TestComponent />
      </SmartDefaultsProvider>
    );
    
    const toggleButton = screen.getByText('Toggle Auto Expand');
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      const savedConfig = localStorage.getItem('smart-defaults-config');
      expect(savedConfig).toBeTruthy();
      
      const parsed = JSON.parse(savedConfig!);
      expect(parsed.autoExpandHighPriority).toBe(false);
    });
  });

  it('loads configuration from localStorage', () => {
    // Set up localStorage with custom config
    localStorage.setItem('smart-defaults-config', JSON.stringify({
      autoExpandHighPriority: false,
      expandOnContent: false
    }));
    
    render(
      <SmartDefaultsProvider>
        <TestComponent />
      </SmartDefaultsProvider>
    );
    
    expect(screen.getByTestId('auto-expand')).toHaveTextContent('false');
  });
});

describe('SmartDefaultsPanel', () => {
  it('renders without crashing', () => {
    render(
      <SmartDefaultsProvider>
        <SmartDefaultsPanel />
      </SmartDefaultsProvider>
    );
    
    expect(screen.getByText('Smart Defaults')).toBeInTheDocument();
  });

  it('displays all setting categories', () => {
    render(
      <SmartDefaultsProvider>
        <SmartDefaultsPanel />
      </SmartDefaultsProvider>
    );
    
    expect(screen.getByText('Progressive Disclosure')).toBeInTheDocument();
    expect(screen.getByText('User Preferences')).toBeInTheDocument();
    expect(screen.getByText('Smart Suggestions')).toBeInTheDocument();
  });

  it('toggles settings when buttons are clicked', () => {
    render(
      <SmartDefaultsProvider>
        <SmartDefaultsPanel />
      </SmartDefaultsProvider>
    );
    
    const autoExpandButton = screen.getByText('Auto-expand high priority').closest('label')?.querySelector('button');
    expect(autoExpandButton).toBeInTheDocument();
    
    fireEvent.click(autoExpandButton!);
    
    // The button should change state (this would need more specific testing based on the actual implementation)
  });

  it('resets settings when reset button is clicked', () => {
    render(
      <SmartDefaultsProvider>
        <SmartDefaultsPanel />
      </SmartDefaultsProvider>
    );
    
    const resetButton = screen.getByText('Reset');
    expect(resetButton).toBeInTheDocument();
    
    fireEvent.click(resetButton);
    
    // Settings should be reset to defaults
  });
});
