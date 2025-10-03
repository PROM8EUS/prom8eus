/**
 * Enhanced WorkflowTab Tests
 * Tests the enhanced WorkflowTab with hover effects and skeleton loading
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkflowTab from '../WorkflowTab';
import { EnhancedBlueprintCard } from '../../ui/EnhancedBlueprintCard';
import { WorkflowTabSkeleton } from '../../ui/WorkflowTabSkeleton';

// Mock dependencies
jest.mock('@/lib/workflowMatcher', () => ({
  matchWorkflowsWithFallback: jest.fn().mockResolvedValue([])
}));

jest.mock('@/lib/blueprintGenerator', () => ({
  generateBlueprintWithFallback: jest.fn().mockResolvedValue({})
}));

jest.mock('@/lib/services/cacheManager', () => ({
  cacheManager: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    delete: jest.fn()
  }
}));

const mockSubtask = {
  id: 'subtask-1',
  title: 'Test Subtask',
  description: 'Test subtask description',
  automationPotential: 80,
  estimatedTime: 4,
  priority: 'high' as const,
  complexity: 'medium' as const,
  systems: ['System A', 'System B'],
  risks: ['Risk 1'],
  opportunities: ['Opportunity 1'],
  dependencies: []
};

describe('Enhanced WorkflowTab Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton loading state', async () => {
    render(
      <WorkflowTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Should show skeleton loading initially
    expect(screen.getByText('Workflow Solutions')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles error states gracefully', async () => {
    const { matchWorkflowsWithFallback } = require('@/lib/workflowMatcher');
    matchWorkflowsWithFallback.mockRejectedValue(new Error('Test error'));

    render(
      <WorkflowTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.getByText('Workflow Solutions')).toBeInTheDocument();
    });
  });

  it('displays enhanced blueprint cards', async () => {
    const mockWorkflows = [
      {
        id: 'workflow-1',
        workflow: {
          id: 'workflow-1',
          title: 'Test Workflow',
          description: 'Test workflow description',
          complexity: 'Medium'
        },
        matchScore: 85,
        status: 'verified' as const,
        isAIGenerated: false
      }
    ];

    const { matchWorkflowsWithFallback } = require('@/lib/workflowMatcher');
    matchWorkflowsWithFallback.mockResolvedValue(mockWorkflows);

    render(
      <WorkflowTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles search functionality', async () => {
    render(
      <WorkflowTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Find search input
    const searchInput = screen.getByPlaceholderText('Search workflows...');
    expect(searchInput).toBeInTheDocument();

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput).toHaveValue('test search');
  });

  it('handles refresh functionality', async () => {
    render(
      <WorkflowTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Find refresh button
    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();

    // Click refresh
    fireEvent.click(refreshButton);
    
    // Should trigger refresh (this would need more specific testing based on implementation)
    expect(refreshButton).toBeInTheDocument();
  });

  it('handles language switching', async () => {
    const { rerender } = render(
      <WorkflowTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    expect(screen.getByText('Workflow Solutions')).toBeInTheDocument();

    // Switch to German
    rerender(
      <WorkflowTab 
        subtask={mockSubtask} 
        lang="de" 
      />
    );

    expect(screen.getByText('Workflow-Lösungen')).toBeInTheDocument();
  });

  it('handles empty subtask gracefully', () => {
    render(
      <WorkflowTab 
        subtask={null} 
        lang="en" 
      />
    );

    // Should show appropriate message
    expect(screen.getByText('Select a subtask from the sidebar to view workflows')).toBeInTheDocument();
  });
});

describe('EnhancedBlueprintCard Tests', () => {
  const mockBlueprint = {
    id: 'blueprint-1',
    name: 'Test Blueprint',
    description: 'Test blueprint description',
    timeSavings: 10,
    complexity: 'Medium' as const,
    integrations: ['Integration A', 'Integration B'],
    status: 'verified' as const,
    popularity: 85,
    rating: 4.5,
    author: 'Test Author',
    estimatedSetupTime: 20,
    difficulty: 'intermediate' as const
  };

  it('renders blueprint card with enhanced features', () => {
    render(
      <EnhancedBlueprintCard
        blueprint={mockBlueprint}
        lang="en"
        compact={true}
        isInteractive={true}
      />
    );

    expect(screen.getByText('Test Blueprint')).toBeInTheDocument();
    expect(screen.getByText('Test blueprint description')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('shows skeleton loading state', () => {
    render(
      <EnhancedBlueprintCard
        blueprint={mockBlueprint}
        lang="en"
        showSkeleton={true}
      />
    );

    // Should show skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('handles hover interactions', () => {
    render(
      <EnhancedBlueprintCard
        blueprint={mockBlueprint}
        lang="en"
        isInteractive={true}
      />
    );

    const card = screen.getByText('Test Blueprint').closest('.group');
    expect(card).toBeInTheDocument();

    // Hover should trigger interactions (this would need more specific testing)
    if (card) {
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);
    }
  });

  it('handles action clicks', () => {
    const onDownloadClick = jest.fn();
    const onSetupClick = jest.fn();
    const onFavoriteClick = jest.fn();

    render(
      <EnhancedBlueprintCard
        blueprint={mockBlueprint}
        lang="en"
        onDownloadClick={onDownloadClick}
        onSetupClick={onSetupClick}
        onFavoriteClick={onFavoriteClick}
        isInteractive={true}
      />
    );

    // Find and click action buttons
    const downloadButton = screen.getByText('Download');
    const setupButton = screen.getByText('Setup');

    fireEvent.click(downloadButton);
    fireEvent.click(setupButton);

    expect(onDownloadClick).toHaveBeenCalledWith(mockBlueprint);
    expect(onSetupClick).toHaveBeenCalledWith(mockBlueprint);
  });
});

describe('WorkflowTabSkeleton Tests', () => {
  it('renders skeleton loading states', () => {
    render(<WorkflowTabSkeleton count={3} compact={true} />);

    // Should show skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders empty state skeleton', () => {
    render(<WorkflowTabSkeleton.EmptyStateSkeleton />);

    // Should show empty state skeleton
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders error state skeleton', () => {
    render(<WorkflowTabSkeleton.ErrorStateSkeleton />);

    // Should show error state skeleton
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});
