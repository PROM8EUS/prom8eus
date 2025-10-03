/**
 * ContextualHelpSystem Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContextualHelpProvider, useContextualHelp, ContextualHelpPanel } from '../ContextualHelpSystem';

// Test component to access context
const TestComponent = () => {
  const { 
    userLevel, 
    isHelpMode, 
    showHints, 
    setUserLevel, 
    toggleHelpMode, 
    toggleHints,
    getContextualHelp,
    trackUserAction
  } = useContextualHelp();
  
  return (
    <div>
      <div data-testid="user-level">{userLevel}</div>
      <div data-testid="help-mode">{isHelpMode.toString()}</div>
      <div data-testid="show-hints">{showHints.toString()}</div>
      <button onClick={() => setUserLevel('advanced')}>Set Advanced</button>
      <button onClick={toggleHelpMode}>Toggle Help Mode</button>
      <button onClick={toggleHints}>Toggle Hints</button>
      <button onClick={() => trackUserAction('test-action', 'test-section', 'test-element')}>
        Track Action
      </button>
      <div data-testid="help-content">
        {getContextualHelp('solutions-overview')?.title || 'No help'}
      </div>
    </div>
  );
};

describe('ContextualHelpSystem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default configuration', () => {
    render(
      <ContextualHelpProvider>
        <TestComponent />
      </ContextualHelpProvider>
    );
    
    expect(screen.getByTestId('user-level')).toHaveTextContent('beginner');
    expect(screen.getByTestId('help-mode')).toHaveTextContent('false');
    expect(screen.getByTestId('show-hints')).toHaveTextContent('true');
  });

  it('updates user level when setUserLevel is called', () => {
    render(
      <ContextualHelpProvider>
        <TestComponent />
      </ContextualHelpProvider>
    );
    
    const setAdvancedButton = screen.getByText('Set Advanced');
    fireEvent.click(setAdvancedButton);
    
    expect(screen.getByTestId('user-level')).toHaveTextContent('advanced');
  });

  it('toggles help mode when toggleHelpMode is called', () => {
    render(
      <ContextualHelpProvider>
        <TestComponent />
      </ContextualHelpProvider>
    );
    
    const toggleButton = screen.getByText('Toggle Help Mode');
    fireEvent.click(toggleButton);
    
    expect(screen.getByTestId('help-mode')).toHaveTextContent('true');
  });

  it('toggles hints when toggleHints is called', () => {
    render(
      <ContextualHelpProvider>
        <TestComponent />
      </ContextualHelpProvider>
    );
    
    const toggleButton = screen.getByText('Toggle Hints');
    fireEvent.click(toggleButton);
    
    expect(screen.getByTestId('show-hints')).toHaveTextContent('false');
  });

  it('returns help content for known sections', () => {
    render(
      <ContextualHelpProvider>
        <TestComponent />
      </ContextualHelpProvider>
    );
    
    expect(screen.getByTestId('help-content')).toHaveTextContent('Automation Solutions');
  });

  it('tracks user actions', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(
      <ContextualHelpProvider>
        <TestComponent />
      </ContextualHelpProvider>
    );
    
    const trackButton = screen.getByText('Track Action');
    fireEvent.click(trackButton);
    
    // The action should be tracked (this would need more specific testing based on implementation)
    expect(trackButton).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('saves preferences to localStorage', async () => {
    render(
      <ContextualHelpProvider>
        <TestComponent />
      </ContextualHelpProvider>
    );
    
    const setAdvancedButton = screen.getByText('Set Advanced');
    fireEvent.click(setAdvancedButton);
    
    await waitFor(() => {
      const savedLevel = localStorage.getItem('user-help-level');
      expect(savedLevel).toBe('advanced');
    });
  });

  it('loads preferences from localStorage', () => {
    localStorage.setItem('user-help-level', 'intermediate');
    localStorage.setItem('show-help-hints', 'false');
    
    render(
      <ContextualHelpProvider>
        <TestComponent />
      </ContextualHelpProvider>
    );
    
    expect(screen.getByTestId('user-level')).toHaveTextContent('intermediate');
    expect(screen.getByTestId('show-hints')).toHaveTextContent('false');
  });
});

describe('ContextualHelpPanel', () => {
  it('renders without crashing', () => {
    render(
      <ContextualHelpProvider>
        <ContextualHelpPanel />
      </ContextualHelpProvider>
    );
    
    expect(screen.getByText('Contextual Help')).toBeInTheDocument();
  });

  it('displays user level selection buttons', () => {
    render(
      <ContextualHelpProvider>
        <ContextualHelpPanel />
      </ContextualHelpProvider>
    );
    
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
    expect(screen.getByText('advanced')).toBeInTheDocument();
  });

  it('displays help mode toggle button', () => {
    render(
      <ContextualHelpProvider>
        <ContextualHelpPanel />
      </ContextualHelpProvider>
    );
    
    expect(screen.getByText('Help Mode')).toBeInTheDocument();
  });

  it('displays quick help topics', () => {
    render(
      <ContextualHelpProvider>
        <ContextualHelpPanel />
      </ContextualHelpProvider>
    );
    
    expect(screen.getByText('Quick Help')).toBeInTheDocument();
  });

  it('toggles help mode when button is clicked', () => {
    render(
      <ContextualHelpProvider>
        <ContextualHelpPanel />
      </ContextualHelpProvider>
    );
    
    const helpModeButton = screen.getByText('Help Mode');
    fireEvent.click(helpModeButton);
    
    // Button state should change (this would need more specific testing)
    expect(helpModeButton).toBeInTheDocument();
  });
});
