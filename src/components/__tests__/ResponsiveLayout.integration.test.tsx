/**
 * Responsive Layout Integration Tests
 * Tests the responsive behavior of the TaskPanel layout components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskPanel from '../TaskPanel';

// Mock all the dependencies
jest.mock('@/lib/aiAnalysis', () => ({
  generateSubtasksWithAI: jest.fn().mockResolvedValue([])
}));

jest.mock('@/lib/openai', () => ({
  isOpenAIAvailable: jest.fn().mockReturnValue(true)
}));

jest.mock('@/lib/workflowIndexer', () => ({
  workflowIndexer: {
    searchWorkflows: jest.fn().mockResolvedValue({
      workflows: [],
      total: 0
    })
  }
}));

jest.mock('@/lib/trendAnalysis', () => ({
  analyzeTrends: jest.fn().mockReturnValue([])
}));

jest.mock('@/lib/workflowMatcher', () => ({
  matchWorkflowsToSubtasks: jest.fn().mockReturnValue([])
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const mockTask = {
  title: 'Responsive Test Task',
  description: 'Testing responsive layout',
  category: 'test',
  subtasks: [
    {
      id: 'subtask-1',
      title: 'Test Subtask 1',
      description: 'First test subtask',
      automationPotential: 80,
      estimatedTime: 4,
      priority: 'high' as const,
      complexity: 'medium' as const,
      systems: ['System A'],
      risks: ['Risk 1'],
      opportunities: ['Opportunity 1'],
      dependencies: []
    }
  ]
};

describe('Responsive Layout Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders with proper CSS Grid layout structure', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for the main grid container
    const gridContainer = document.querySelector('.grid.xl\\:grid-cols-12');
    expect(gridContainer).toBeInTheDocument();

    // Check for responsive column spans
    const headerSection = document.querySelector('.xl\\:col-span-12');
    expect(headerSection).toBeInTheDocument();

    const sidebarSection = document.querySelector('.xl\\:col-span-3');
    expect(sidebarSection).toBeInTheDocument();

    const contentSection = document.querySelector('.xl\\:col-span-9');
    expect(contentSection).toBeInTheDocument();
  });

  it('applies correct responsive breakpoint classes', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for responsive classes on sidebar
    const sidebar = document.querySelector('.xl\\:col-span-3.lg\\:col-span-4.md\\:col-span-6');
    expect(sidebar).toBeInTheDocument();

    // Check for responsive classes on main content
    const mainContent = document.querySelector('.xl\\:col-span-9.lg\\:col-span-8.md\\:col-span-6');
    expect(mainContent).toBeInTheDocument();
  });

  it('handles mobile-first responsive design', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for mobile-first grid classes
    const gridContainer = document.querySelector('.grid.grid-cols-1');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('xl:grid-cols-12');
  });

  it('applies sticky positioning to sidebar', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for sticky positioning on sidebar
    const stickySidebar = document.querySelector('.sticky.top-6');
    expect(stickySidebar).toBeInTheDocument();
  });

  it('handles backdrop blur and glassmorphism effects', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for backdrop blur effects
    const backdropElements = document.querySelectorAll('.backdrop-blur-sm');
    expect(backdropElements.length).toBeGreaterThan(0);

    // Check for glassmorphism styling
    const glassElements = document.querySelectorAll('.bg-white\\/80');
    expect(glassElements.length).toBeGreaterThan(0);
  });

  it('applies proper spacing and gap classes', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for gap classes
    const gapContainer = document.querySelector('.gap-6');
    expect(gapContainer).toBeInTheDocument();

    // Check for padding classes
    const paddedContainer = document.querySelector('.p-6');
    expect(paddedContainer).toBeInTheDocument();
  });

  it('handles max-width constraints correctly', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for max-width container
    const maxWidthContainer = document.querySelector('.max-w-7xl.mx-auto');
    expect(maxWidthContainer).toBeInTheDocument();
  });

  it('applies proper responsive typography', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for responsive text sizing
    const title = screen.getByText('Responsive Test Task');
    expect(title).toHaveClass('text-2xl');
  });

  it('handles responsive card layouts', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for card components with responsive styling
    const cards = document.querySelectorAll('.shadow-sm');
    expect(cards.length).toBeGreaterThan(0);

    // Check for hover effects
    const hoverCards = document.querySelectorAll('.hover\\:shadow-md');
    expect(hoverCards.length).toBeGreaterThan(0);
  });

  it('maintains accessibility across breakpoints', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for proper heading structure
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();

    // Check for button elements (help triggers, etc.)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('handles different language layouts consistently', () => {
    const { rerender } = render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check English layout
    expect(screen.getByText('Automation Solutions')).toBeInTheDocument();

    // Switch to German
    rerender(
      <TaskPanel 
        task={mockTask} 
        lang="de" 
        isVisible={true} 
      />
    );

    // Check German layout maintains same structure
    expect(screen.getByText('Automatisierungs-Lösungen')).toBeInTheDocument();
    
    // Grid structure should remain the same
    const gridContainer = document.querySelector('.grid.xl\\:grid-cols-12');
    expect(gridContainer).toBeInTheDocument();
  });

  it('handles empty content gracefully in responsive layout', () => {
    const emptyTask = {
      title: 'Empty Task',
      description: 'No content',
      category: 'test'
    };

    render(
      <TaskPanel 
        task={emptyTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Layout structure should still be present
    const gridContainer = document.querySelector('.grid.xl\\:grid-cols-12');
    expect(gridContainer).toBeInTheDocument();

    // Main sections should still be rendered
    expect(screen.getByText('Empty Task')).toBeInTheDocument();
    expect(screen.getByText('Automation Solutions')).toBeInTheDocument();
  });

  it('applies proper focus management for keyboard navigation', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check for focusable elements
    const focusableElements = document.querySelectorAll('button, [tabindex]');
    expect(focusableElements.length).toBeGreaterThan(0);

    // Check for proper tab order (this would need more specific testing)
    const firstButton = focusableElements[0];
    expect(firstButton).toBeInTheDocument();
  });
});
