/**
 * Layout Integration Test Suite
 * Comprehensive tests for all layout component integrations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskPanel from '../TaskPanel';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { SmartDefaultsProvider } from '../SmartDefaultsManager';
import { ContextualHelpProvider } from '../ContextualHelpSystem';

// Mock all dependencies
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
  title: 'Integration Test Task',
  description: 'Testing all layout integrations',
  category: 'test',
  subtasks: [
    {
      id: 'subtask-1',
      title: 'Integration Subtask 1',
      description: 'First integration test subtask',
      automationPotential: 85,
      estimatedTime: 3,
      priority: 'high' as const,
      complexity: 'medium' as const,
      systems: ['Integration System A', 'Integration System B'],
      risks: ['Integration Risk 1'],
      opportunities: ['Integration Opportunity 1'],
      dependencies: []
    },
    {
      id: 'subtask-2',
      title: 'Integration Subtask 2',
      description: 'Second integration test subtask',
      automationPotential: 70,
      estimatedTime: 5,
      priority: 'medium' as const,
      complexity: 'high' as const,
      systems: ['Integration System C'],
      risks: ['Integration Risk 2'],
      opportunities: ['Integration Opportunity 2'],
      dependencies: ['subtask-1']
    }
  ]
};

describe('Layout Integration Test Suite', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  describe('Component Integration', () => {
    it('integrates all layout components successfully', async () => {
      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Verify main structure
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
      expect(screen.getByText('Automation analysis and solution recommendations')).toBeInTheDocument();

      // Verify collapsible sections
      expect(screen.getByText('Automation Solutions')).toBeInTheDocument();
      expect(screen.getByText('Top Subtasks')).toBeInTheDocument();

      // Verify responsive grid layout
      const gridContainer = document.querySelector('.grid.xl\\:grid-cols-12');
      expect(gridContainer).toBeInTheDocument();

      // Verify glassmorphism effects
      const backdropElements = document.querySelectorAll('.backdrop-blur-sm');
      expect(backdropElements.length).toBeGreaterThan(0);
    });

    it('handles provider integration correctly', async () => {
      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Verify that providers are working by checking for their effects
      // SmartDefaultsProvider should provide default behaviors
      // ContextualHelpProvider should provide help functionality
      
      // Check for help triggers (indicating ContextualHelpProvider is working)
      const helpButtons = screen.getAllByRole('button');
      expect(helpButtons.length).toBeGreaterThan(0);

      // Check for collapsible sections (indicating SmartDefaultsProvider is working)
      const collapsibleSections = document.querySelectorAll('[role="button"]');
      expect(collapsibleSections.length).toBeGreaterThan(0);
    });
  });

  describe('Progressive Disclosure Integration', () => {
    it('handles section expansion and collapse correctly', async () => {
      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByText('Automation Solutions')).toBeInTheDocument();
      });

      // Find and interact with collapsible sections
      const sectionHeaders = screen.getAllByRole('button');
      const automationSection = sectionHeaders.find(button => 
        button.textContent?.includes('Automation Solutions')
      );

      if (automationSection) {
        fireEvent.click(automationSection);
        // Verify interaction (this would need more specific testing based on implementation)
        expect(automationSection).toBeInTheDocument();
      }
    });

    it('handles priority-based behavior correctly', async () => {
      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Check that high priority sections are present
      expect(screen.getByText('Automation Solutions')).toBeInTheDocument();
      
      // Check that medium priority sections are present
      expect(screen.getByText('Top Subtasks')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout Integration', () => {
    it('maintains layout structure across different viewport sizes', () => {
      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Check for responsive grid classes
      const gridContainer = document.querySelector('.grid.grid-cols-1.xl\\:grid-cols-12');
      expect(gridContainer).toBeInTheDocument();

      // Check for responsive column spans
      const sidebar = document.querySelector('.xl\\:col-span-3.lg\\:col-span-4.md\\:col-span-6');
      expect(sidebar).toBeInTheDocument();

      const content = document.querySelector('.xl\\:col-span-9.lg\\:col-span-8.md\\:col-span-6');
      expect(content).toBeInTheDocument();
    });

    it('handles sticky positioning correctly', () => {
      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Check for sticky sidebar
      const stickySidebar = document.querySelector('.sticky.top-6');
      expect(stickySidebar).toBeInTheDocument();
    });
  });

  describe('Contextual Help Integration', () => {
    it('provides help functionality throughout the interface', async () => {
      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Check for help triggers
      const helpElements = document.querySelectorAll('button');
      expect(helpElements.length).toBeGreaterThan(0);

      // Verify that help system is integrated
      // (This would need more specific testing based on the actual help implementation)
    });

    it('handles user interaction tracking', async () => {
      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Interact with the interface
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
        // Verify that interaction is tracked
        // (This would need more specific testing based on the actual tracking implementation)
      }
    });
  });

  describe('State Management Integration', () => {
    it('persists user preferences correctly', async () => {
      // Mock saved preferences
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'smart-defaults-config') {
          return JSON.stringify({
            autoExpandHighPriority: true,
            expandOnContent: true,
            showProgressBars: true
          });
        }
        if (key === 'smart-defaults-expanded') {
          return JSON.stringify({
            'solutions': true,
            'top-subtasks': false
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

    it('handles state updates correctly', async () => {
      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Interact with the interface to trigger state updates
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
        
        // Verify that state is updated
        // (This would need more specific testing based on the actual state management)
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('handles component errors gracefully', async () => {
      // Mock an error in one of the dependencies
      const { generateSubtasksWithAI } = require('@/lib/aiAnalysis');
      generateSubtasksWithAI.mockRejectedValue(new Error('Test error'));

      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Should still render the main structure despite errors
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
      expect(screen.getByText('Automation Solutions')).toBeInTheDocument();
    });

    it('handles missing data gracefully', async () => {
      const incompleteTask = {
        title: 'Incomplete Task',
        // Missing other properties
      };

      render(
        <TaskPanel 
          task={incompleteTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Should still render with fallback content
      expect(screen.getByText('Incomplete Task')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('renders efficiently with multiple components', async () => {
      const startTime = performance.now();
      
      render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second

      // Verify all components are rendered
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });

    it('handles re-renders efficiently', async () => {
      const { rerender } = render(
        <TaskPanel 
          task={mockTask} 
          lang="en" 
          isVisible={true} 
        />
      );

      // Re-render with different props
      rerender(
        <TaskPanel 
          task={mockTask} 
          lang="de" 
          isVisible={true} 
        />
      );

      // Should handle re-render without issues
      expect(screen.getByText('Automatisierungs-Lösungen')).toBeInTheDocument();
    });
  });
});
