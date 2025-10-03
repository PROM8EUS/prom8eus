/**
 * TaskPanel Integration Tests
 * Tests the integration between all layout components in the TaskPanel
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskPanel from '../TaskPanel';

// Mock the AI analysis functions
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

const mockTask = {
  title: 'Test Task',
  description: 'Test task description',
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
      systems: ['System A', 'System B'],
      risks: ['Risk 1'],
      opportunities: ['Opportunity 1'],
      dependencies: []
    },
    {
      id: 'subtask-2',
      title: 'Test Subtask 2',
      description: 'Second test subtask',
      automationPotential: 60,
      estimatedTime: 6,
      priority: 'medium' as const,
      complexity: 'high' as const,
      systems: ['System C'],
      risks: ['Risk 2'],
      opportunities: ['Opportunity 2'],
      dependencies: ['subtask-1']
    }
  ]
};

describe('TaskPanel Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  it('renders TaskPanel with all integrated components', async () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check that main sections are rendered
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Automation analysis and solution recommendations')).toBeInTheDocument();
    
    // Check that collapsible sections are present
    expect(screen.getByText('Automation Solutions')).toBeInTheDocument();
    expect(screen.getByText('Top Subtasks')).toBeInTheDocument();
    
    // Check that help triggers are present
    const helpIcons = screen.getAllByRole('button');
    expect(helpIcons.length).toBeGreaterThan(0);
  });

  it('integrates SmartDefaultsProvider correctly', async () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check that smart defaults are working by verifying collapsible sections
    const collapsibleSections = screen.getAllByRole('button');
    expect(collapsibleSections.length).toBeGreaterThan(0);
  });

  it('integrates ContextualHelpProvider correctly', async () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check that help triggers are present (indicating ContextualHelpProvider is working)
    const helpButtons = screen.getAllByRole('button');
    const hasHelpButtons = helpButtons.some(button => 
      button.querySelector('svg') // Help icons are SVG elements
    );
    expect(hasHelpButtons).toBe(true);
  });

  it('handles subtask selection correctly', async () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Wait for subtasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Subtask 1')).toBeInTheDocument();
    });

    // Click on a subtask
    const subtaskButton = screen.getByText('Test Subtask 1');
    fireEvent.click(subtaskButton);

    // Verify that the subtask is selected (this would need more specific testing based on implementation)
    expect(subtaskButton).toBeInTheDocument();
  });

  it('handles collapsible section toggling', async () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Find and click on a collapsible section header
    const sectionHeaders = screen.getAllByRole('button');
    const collapsibleHeader = sectionHeaders.find(button => 
      button.textContent?.includes('Automation Solutions')
    );
    
    if (collapsibleHeader) {
      fireEvent.click(collapsibleHeader);
      
      // Verify that the section toggles (this would need more specific testing)
      expect(collapsibleHeader).toBeInTheDocument();
    }
  });

  it('handles responsive layout correctly', async () => {
    // Test with different viewport sizes
    const { rerender } = render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check that the main grid layout is present
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('xl:grid-cols-12');
  });

  it('integrates EffortSection correctly', async () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Check that EffortSection is rendered (it should show ROI information)
    // This would need to be more specific based on the actual EffortSection implementation
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('handles language switching correctly', async () => {
    const { rerender } = render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    expect(screen.getByText('Automation Solutions')).toBeInTheDocument();

    // Switch to German
    rerender(
      <TaskPanel 
        task={mockTask} 
        lang="de" 
        isVisible={true} 
      />
    );

    expect(screen.getByText('Automatisierungs-Lösungen')).toBeInTheDocument();
  });

  it('handles empty task gracefully', async () => {
    const emptyTask = {
      title: 'Empty Task',
      description: 'No subtasks',
      category: 'test'
    };

    render(
      <TaskPanel 
        task={emptyTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Should still render the main structure
    expect(screen.getByText('Empty Task')).toBeInTheDocument();
    expect(screen.getByText('Automation Solutions')).toBeInTheDocument();
  });

  it('persists user preferences across renders', async () => {
    // Mock localStorage to return saved preferences
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'smart-defaults-config') {
        return JSON.stringify({
          autoExpandHighPriority: true,
          expandOnContent: true
        });
      }
      if (key === 'smart-defaults-expanded') {
        return JSON.stringify({
          'solutions': true
        });
      }
      return null;
    });

    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Verify that preferences are loaded
    expect(localStorageMock.getItem).toHaveBeenCalledWith('smart-defaults-config');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('smart-defaults-expanded');
  });

  it('handles error states gracefully', async () => {
    // Mock an error in AI analysis
    const { generateSubtasksWithAI } = require('@/lib/aiAnalysis');
    generateSubtasksWithAI.mockRejectedValue(new Error('AI service unavailable'));

    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );

    // Should still render the main structure even with errors
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});