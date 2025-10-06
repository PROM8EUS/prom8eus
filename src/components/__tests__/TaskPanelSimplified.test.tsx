/**
 * Tests for TaskPanelSimplified Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskPanelSimplified } from '../TaskPanelSimplified';
import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';

// Mock the services
vi.mock('@/lib/services/taskDataService', () => ({
  taskDataService: {
    fetchTaskData: vi.fn(),
    fetchWorkflowsForSubtask: vi.fn(),
    fetchAllWorkflows: vi.fn(),
    fetchInsights: vi.fn(),
  }
}));

vi.mock('@/lib/services/analysisCacheService', () => ({
  analysisCacheService: {
    getStats: vi.fn(() => ({
      totalEntries: 5,
      totalSize: 1024,
      hitRate: 0.8,
      oldestEntry: null,
      newestEntry: null
    })),
    clear: vi.fn(),
  }
}));

// Mock child components
vi.mock('../SubtaskSidebarSimplified', () => ({
  default: ({ onSubtaskSelect, selectedSubtaskId, subtasks }: any) => (
    <div data-testid="subtask-sidebar">
      <div>Selected: {selectedSubtaskId}</div>
      <div>Subtasks: {subtasks.length}</div>
      <button onClick={() => onSubtaskSelect('subtask-1')}>
        Select Subtask 1
      </button>
    </div>
  )
}));

vi.mock('../ExpandedSolutionTabsSimplified', () => ({
  default: ({ subtask, workflows, insights }: any) => (
    <div data-testid="solution-tabs">
      <div>Subtask: {subtask?.title || 'None'}</div>
      <div>Workflows: {workflows.length}</div>
      <div>Insights: {insights.length}</div>
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

describe('TaskPanelSimplified', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    subtasks: [
      {
        id: 'subtask-1',
        title: 'Subtask 1',
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
      }
    ]
  };

  const mockTaskData = {
    subtasks: [
      {
        id: 'subtask-1',
        title: 'Server Subtask 1',
        description: 'Server Description 1',
        systems: ['Server System A'],
        aiTools: ['Server Tool A'],
        selectedTools: [],
        manualHoursShare: 0.6,
        automationPotential: 0.8,
        risks: ['Server Risk A'],
        assumptions: ['Server Assumption A'],
        kpis: ['Server KPI A'],
        qualityGates: ['Server Gate A']
      }
    ],
    workflows: [
      {
        id: 'workflow-1',
        title: 'Test Workflow',
        description: 'Test Description',
        automationPotential: 75,
        complexity: 'medium',
        estimatedTime: '2 hours',
        systems: ['System A'],
        benefits: ['Benefit A'],
        steps: [],
        metadata: {
          created: new Date(),
          version: '1.0',
          source: 'test'
        }
      }
    ],
    insights: [
      {
        id: 'insight-1',
        title: 'Test Insight',
        description: 'Test Description',
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
  });

  it('should render loading state when task is not provided', () => {
    render(
      <TaskPanelSimplified
        task={null}
        lang="de"
        isVisible={true}
      />
    );

    expect(screen.getByText('Lade Aufgabe...')).toBeInTheDocument();
  });

  it('should render task header with correct information', () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('1 Unteraufgaben')).toBeInTheDocument();
  });

  it('should render subtask sidebar', () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    expect(screen.getByTestId('subtask-sidebar')).toBeInTheDocument();
  });

  it('should render solution tabs', () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    expect(screen.getByTestId('solution-tabs')).toBeInTheDocument();
  });

  it('should handle subtask selection', async () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    const selectButton = screen.getByText('Select Subtask 1');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('Selected: subtask-1')).toBeInTheDocument();
    });
  });

  it('should display cache statistics when available', () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    expect(screen.getByText(/Cache: 5 entries \(80% hit rate\)/)).toBeInTheDocument();
  });

  it('should render with English language', () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="en"
        isVisible={true}
      />
    );

    expect(screen.getByText('1 tasks')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={false}
      />
    );

    // Should not render the main content
    expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
  });

  it('should handle empty subtasks gracefully', () => {
    const taskWithoutSubtasks = {
      ...mockTask,
      subtasks: []
    };

    render(
      <TaskPanelSimplified
        task={taskWithoutSubtasks}
        lang="de"
        isVisible={true}
      />
    );

    expect(screen.getByText('0 Unteraufgaben')).toBeInTheDocument();
  });

  it('should render implementation CTA', () => {
    render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    expect(screen.getByTestId('implementation-cta')).toBeInTheDocument();
  });
});
