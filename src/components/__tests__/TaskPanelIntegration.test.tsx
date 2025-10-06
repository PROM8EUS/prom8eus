/**
 * Integration Tests for TaskPanel Architecture
 * Tests the interaction between TaskPanel, SubtaskSidebar, and ExpandedSolutionTabs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskPanelSimplified } from '../TaskPanelSimplified';
import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';

// Mock the services with realistic responses
const mockTaskDataService = {
  fetchTaskData: vi.fn(),
  fetchWorkflowsForSubtask: vi.fn(),
  fetchAllWorkflows: vi.fn(),
  fetchInsights: vi.fn(),
};

const mockAnalysisCacheService = {
  getStats: vi.fn(() => ({
    totalEntries: 3,
    totalSize: 2048,
    hitRate: 0.75,
    oldestEntry: null,
    newestEntry: null
  })),
  clear: vi.fn(),
};

vi.mock('@/lib/services/taskDataService', () => ({
  taskDataService: mockTaskDataService
}));

vi.mock('@/lib/services/analysisCacheService', () => ({
  analysisCacheService: mockAnalysisCacheService
}));

// Mock child components with realistic behavior
vi.mock('../SubtaskSidebarSimplified', () => ({
  default: ({ onSubtaskSelect, selectedSubtaskId, subtasks, isLoadingSubtasks }: any) => (
    <div data-testid="subtask-sidebar">
      <div>Selected: {selectedSubtaskId}</div>
      <div>Subtasks: {subtasks.length}</div>
      <div>Loading: {isLoadingSubtasks ? 'Yes' : 'No'}</div>
      <button onClick={() => onSubtaskSelect('all')}>Select All</button>
      <button onClick={() => onSubtaskSelect('subtask-1')}>Select Subtask 1</button>
      <button onClick={() => onSubtaskSelect('subtask-2')}>Select Subtask 2</button>
    </div>
  )
}));

vi.mock('../ExpandedSolutionTabsSimplified', () => ({
  default: ({ subtask, workflows, insights, onLoadMore, isLoadingMore }: any) => (
    <div data-testid="solution-tabs">
      <div>Subtask: {subtask?.title || 'None'}</div>
      <div>Workflows: {workflows.length}</div>
      <div>Insights: {insights.length}</div>
      <div>Loading More: {isLoadingMore ? 'Yes' : 'No'}</div>
      <button onClick={onLoadMore}>Load More</button>
    </div>
  )
}));

// Mock other dependencies
vi.mock('../SmartDefaultsManager', () => ({
  SmartDefaultsProvider: ({ children }: any) => children,
  useSmartDefaults: () => ({
    getSectionDefaults: vi.fn(() => ({})),
  }),
}));

vi.mock('../ContextualHelpSystem', () => ({
  ContextualHelpProvider: ({ children }: any) => children,
  useContextualHelp: () => ({
    getHelpContent: vi.fn(() => ({})),
  }),
}));

vi.mock('../HelpTrigger', () => ({
  HelpTrigger: () => <div data-testid="help-trigger">Help</div>,
}));

vi.mock('../EffortSection', () => ({
  EffortSection: () => <div data-testid="effort-section">Effort</div>,
}));

vi.mock('../InsightsTrendsSection', () => ({
  InsightsTrendsSection: () => <div data-testid="insights-section">Insights</div>,
}));

vi.mock('../ImplementationRequestCTA', () => ({
  ImplementationRequestCTA: () => <div data-testid="implementation-cta">CTA</div>,
}));

vi.mock('../ui/CollapsibleSection', () => ({
  CollapsibleSection: ({ children, title }: any) => (
    <div data-testid="collapsible-section">
      <div>{title}</div>
      {children}
    </div>
  ),
}));

describe('TaskPanel Integration Tests', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Integration Test Task',
    description: 'Test Description for Integration',
    subtasks: [
      {
        id: 'subtask-1',
        title: 'Integration Subtask 1',
        description: 'Description 1',
        systems: ['System A'],
        aiTools: ['Tool A'],
        selectedTools: [],
        manualHoursShare: 0.5,
        automationPotential: 0.7,
        risks: ['Risk A'],
        assumptions: ['Assumption A'],
        kpis: ['KPI A'],
        qualityGates: ['Gate A']
      },
      {
        id: 'subtask-2',
        title: 'Integration Subtask 2',
        description: 'Description 2',
        systems: ['System B'],
        aiTools: ['Tool B'],
        selectedTools: [],
        manualHoursShare: 0.6,
        automationPotential: 0.8,
        risks: ['Risk B'],
        assumptions: ['Assumption B'],
        kpis: ['KPI B'],
        qualityGates: ['Gate B']
      }
    ]
  };

  const mockServerData = {
    subtasks: [
      {
        id: 'subtask-1',
        title: 'Server Subtask 1',
        description: 'Server Description 1',
        systems: ['Server System A'],
        aiTools: ['Server Tool A'],
        selectedTools: [],
        manualHoursShare: 0.5,
        automationPotential: 0.7,
        risks: ['Server Risk A'],
        assumptions: ['Server Assumption A'],
        kpis: ['Server KPI A'],
        qualityGates: ['Server Gate A']
      }
    ],
    workflows: [
      {
        id: 'workflow-1',
        title: 'Server Workflow 1',
        description: 'Server Description',
        automationPotential: 75,
        complexity: 'medium',
        estimatedTime: '2 hours',
        systems: ['System A'],
        benefits: ['Benefit A'],
        steps: [],
        metadata: {
          created: new Date(),
          version: '1.0',
          source: 'server'
        }
      }
    ],
    insights: [
      {
        id: 'insight-1',
        title: 'Server Insight',
        description: 'Server Description',
        type: 'trend',
        confidence: 0.8
      }
    ],
    businessCase: {
      automationRatio: 75,
      manualHours: 40,
      automatedHours: 10,
      estimatedSavings: 1800
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockTaskDataService.fetchTaskData.mockResolvedValue(mockServerData);
    mockTaskDataService.fetchWorkflowsForSubtask.mockResolvedValue([]);
    mockTaskDataService.fetchAllWorkflows.mockResolvedValue([]);
    mockTaskDataService.fetchInsights.mockResolvedValue([]);
  });

  it('should load and display server data on mount', async () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    // Should show loading state initially
    expect(screen.getByText('Lade Aufgabe...')).toBeInTheDocument();

    // Wait for server data to load
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });

    // Should call fetchTaskData
    expect(mockTaskDataService.fetchTaskData).toHaveBeenCalledWith('task-1');

    // Should display server data
    expect(screen.getByText('Server Subtask 1')).toBeInTheDocument();
    expect(screen.getByText('Server Workflow 1')).toBeInTheDocument();
  });

  it('should handle subtask selection and load workflows', async () => {
    const mockWorkflowsForSubtask = [
      {
        id: 'workflow-subtask-1',
        title: 'Subtask Workflow',
        description: 'Subtask Description',
        automationPotential: 80,
        complexity: 'high',
        estimatedTime: '3 hours',
        systems: ['Subtask System'],
        benefits: ['Subtask Benefit'],
        steps: [],
        metadata: {
          created: new Date(),
          version: '1.0',
          source: 'subtask'
        }
      }
    ];

    mockTaskDataService.fetchWorkflowsForSubtask.mockResolvedValue(mockWorkflowsForSubtask);

    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });

    // Select a specific subtask
    const selectSubtaskButton = screen.getByText('Select Subtask 1');
    fireEvent.click(selectSubtaskButton);

    // Should call fetchWorkflowsForSubtask
    await waitFor(() => {
      expect(mockTaskDataService.fetchWorkflowsForSubtask).toHaveBeenCalledWith({
        taskId: 'task-1',
        subtaskId: 'subtask-1',
        limit: 10
      });
    });
  });

  it('should handle "all" subtask selection and load all workflows', async () => {
    const mockAllWorkflows = [
      {
        id: 'workflow-all-1',
        title: 'All Workflow 1',
        description: 'All Description',
        automationPotential: 70,
        complexity: 'medium',
        estimatedTime: '2 hours',
        systems: ['All System'],
        benefits: ['All Benefit'],
        steps: [],
        metadata: {
          created: new Date(),
          version: '1.0',
          source: 'all'
        }
      }
    ];

    mockTaskDataService.fetchAllWorkflows.mockResolvedValue(mockAllWorkflows);

    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });

    // Select "all" subtasks
    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);

    // Should call fetchAllWorkflows
    await waitFor(() => {
      expect(mockTaskDataService.fetchAllWorkflows).toHaveBeenCalledWith('task-1');
    });
  });

  it('should handle load more workflows', async () => {
    const mockMoreWorkflows = [
      {
        id: 'workflow-more-1',
        title: 'More Workflow',
        description: 'More Description',
        automationPotential: 85,
        complexity: 'high',
        estimatedTime: '4 hours',
        systems: ['More System'],
        benefits: ['More Benefit'],
        steps: [],
        metadata: {
          created: new Date(),
          version: '1.0',
          source: 'more'
        }
      }
    ];

    mockTaskDataService.fetchAllWorkflows
      .mockResolvedValueOnce(mockServerData.workflows) // Initial load
      .mockResolvedValueOnce(mockMoreWorkflows); // Load more

    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });

    // Click load more
    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    // Should call fetchAllWorkflows with offset
    await waitFor(() => {
      expect(mockTaskDataService.fetchAllWorkflows).toHaveBeenCalledWith(
        'task-1',
        10,
        1 // offset based on current workflows length
      );
    });
  });

  it('should display cache statistics', async () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });

    // Should display cache statistics
    expect(screen.getByText(/Cache: 3 entries \(75% hit rate\)/)).toBeInTheDocument();
  });

  it('should handle server errors gracefully', async () => {
    mockTaskDataService.fetchTaskData.mockRejectedValue(new Error('Server error'));

    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    // Should show loading state initially
    expect(screen.getByText('Lade Aufgabe...')).toBeInTheDocument();

    // Should handle error and still render with fallback data
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });

    // Should fall back to task.subtasks
    expect(screen.getByText('Integration Subtask 1')).toBeInTheDocument();
  });

  it('should not load data when not visible', () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={false}
      />
    );

    // Should not call fetchTaskData
    expect(mockTaskDataService.fetchTaskData).not.toHaveBeenCalled();
  });

  it('should handle language switching', async () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="en"
        isVisible={true}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });

    // Should display English text
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
  });

  it('should handle empty server data', async () => {
    mockTaskDataService.fetchTaskData.mockResolvedValue({
      subtasks: [],
      workflows: [],
      insights: [],
      businessCase: {
        automationRatio: 0,
        manualHours: 0,
        automatedHours: 0,
        estimatedSavings: 0
      }
    });

    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });

    // Should fall back to task.subtasks
    expect(screen.getByText('Integration Subtask 1')).toBeInTheDocument();
  });
});
