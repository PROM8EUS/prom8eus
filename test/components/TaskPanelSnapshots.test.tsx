import React from 'react';
/**
 * Snapshot Tests for TaskPanel Components
 * Ensures UI consistency across changes
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TaskPanelSimplified } from '../../src/components/TaskPanelSimplified';
import SubtaskSidebarSimplified from '../../src/components/SubtaskSidebarSimplified';
import ExpandedSolutionTabsSimplified from '../../src/components/ExpandedSolutionTabsSimplified';
import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';

// Mock all dependencies for snapshot tests
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
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      oldestEntry: null,
      newestEntry: null
    })),
    clear: vi.fn(),
  }
}));

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

vi.mock('../ListWithSeparators', () => ({
  ListWithSeparators: ({ items }: any) => (
    <div data-testid="list-with-separators">
      {items.map((item: any) => (
        <div key={item.id} data-testid={`list-item-${item.id}`}>
          {item.title}
        </div>
      ))}
    </div>
  )
}));

vi.mock('../tabs/WorkflowTab', () => ({
  default: () => <div data-testid="workflow-tab">Workflow Tab</div>
}));

vi.mock('../tabs/AgentTab', () => ({
  default: () => <div data-testid="agent-tab">Agent Tab</div>
}));

vi.mock('../tabs/LLMTab', () => ({
  default: () => <div data-testid="llm-tab">LLM Tab</div>
}));

describe('TaskPanel Snapshot Tests', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Snapshot Test Task',
    description: 'Test Description for Snapshot',
    subtasks: [
      {
        id: 'subtask-1',
        title: 'Snapshot Subtask 1',
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

  const mockSubtask: DynamicSubtask = {
    id: 'subtask-1',
    title: 'Snapshot Subtask',
    description: 'Snapshot Description',
    systems: ['System A'],
    aiTools: ['Tool A'],
    selectedTools: [],
    manualHoursShare: 0.5,
    automationPotential: 0.7,
    risks: ['Risk A'],
    assumptions: ['Assumption A'],
    kpis: ['KPI A'],
    qualityGates: ['Gate A']
  };

  const mockWorkflows: UnifiedWorkflow[] = [
    {
      id: 'workflow-1',
      title: 'Snapshot Workflow',
      description: 'Snapshot Description',
      automationPotential: 75,
      complexity: 'medium',
      estimatedTime: '2 hours',
      systems: ['System A'],
      benefits: ['Benefit A'],
      steps: [],
      metadata: {
        created: new Date('2024-01-01'),
        version: '1.0',
        source: 'snapshot'
      }
    }
  ];

  const mockInsights = [
    {
      id: 'insight-1',
      title: 'Snapshot Insight',
      description: 'Snapshot Description',
      type: 'trend',
      confidence: 0.8
    }
  ];

  it('should match TaskPanelSimplified snapshot with task data', () => {
    const { container } = render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match TaskPanelSimplified snapshot with English language', () => {
    const { container } = render(
      <TaskPanelSimplified
        task={mockTask}
        lang="en"
        isVisible={true}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match TaskPanelSimplified snapshot when not visible', () => {
    const { container } = render(
      <TaskPanelSimplified
        task={mockTask}
        lang="de"
        isVisible={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match TaskPanelSimplified snapshot with null task', () => {
    const { container } = render(
      <TaskPanelSimplified
        task={null}
        lang="de"
        isVisible={true}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match SubtaskSidebarSimplified snapshot with subtasks', () => {
    const { container } = render(
      <SubtaskSidebarSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
        onSubtaskSelect={vi.fn()}
        selectedSubtaskId="all"
        subtasks={[mockSubtask]}
        isLoadingSubtasks={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match SubtaskSidebarSimplified snapshot with loading state', () => {
    const { container } = render(
      <SubtaskSidebarSimplified
        task={mockTask}
        lang="de"
        isVisible={true}
        onSubtaskSelect={vi.fn()}
        selectedSubtaskId="all"
        subtasks={[]}
        isLoadingSubtasks={true}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match SubtaskSidebarSimplified snapshot with empty state', () => {
    const { container } = render(
      <SubtaskSidebarSimplified
        task={{ ...mockTask, subtasks: [] }}
        lang="de"
        isVisible={true}
        onSubtaskSelect={vi.fn()}
        selectedSubtaskId="all"
        subtasks={[]}
        isLoadingSubtasks={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match SubtaskSidebarSimplified snapshot with English language', () => {
    const { container } = render(
      <SubtaskSidebarSimplified
        task={mockTask}
        lang="en"
        isVisible={true}
        onSubtaskSelect={vi.fn()}
        selectedSubtaskId="all"
        subtasks={[mockSubtask]}
        isLoadingSubtasks={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match ExpandedSolutionTabsSimplified snapshot with subtask', () => {
    const { container } = render(
      <ExpandedSolutionTabsSimplified
        subtask={mockSubtask}
        lang="de"
        workflows={mockWorkflows}
        insights={mockInsights}
        isGeneratingInitial={false}
        onLoadMore={vi.fn()}
        isLoadingMore={false}
        onWorkflowSelect={vi.fn()}
        onWorkflowDownload={vi.fn()}
        onWorkflowSetup={vi.fn()}
        onAgentSelect={vi.fn()}
        onAgentSetup={vi.fn()}
        onPromptSelect={vi.fn()}
        onPromptCopy={vi.fn()}
        onPromptOpenInService={vi.fn()}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match ExpandedSolutionTabsSimplified snapshot with null subtask', () => {
    const { container } = render(
      <ExpandedSolutionTabsSimplified
        subtask={null}
        lang="de"
        workflows={[]}
        insights={[]}
        isGeneratingInitial={false}
        onLoadMore={vi.fn()}
        isLoadingMore={false}
        onWorkflowSelect={vi.fn()}
        onWorkflowDownload={vi.fn()}
        onWorkflowSetup={vi.fn()}
        onAgentSelect={vi.fn()}
        onAgentSetup={vi.fn()}
        onPromptSelect={vi.fn()}
        onPromptCopy={vi.fn()}
        onPromptOpenInService={vi.fn()}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match ExpandedSolutionTabsSimplified snapshot with loading state', () => {
    const { container } = render(
      <ExpandedSolutionTabsSimplified
        subtask={mockSubtask}
        lang="de"
        workflows={[]}
        insights={[]}
        isGeneratingInitial={true}
        onLoadMore={vi.fn()}
        isLoadingMore={false}
        onWorkflowSelect={vi.fn()}
        onWorkflowDownload={vi.fn()}
        onWorkflowSetup={vi.fn()}
        onAgentSelect={vi.fn()}
        onAgentSetup={vi.fn()}
        onPromptSelect={vi.fn()}
        onPromptCopy={vi.fn()}
        onPromptOpenInService={vi.fn()}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match ExpandedSolutionTabsSimplified snapshot with English language', () => {
    const { container } = render(
      <ExpandedSolutionTabsSimplified
        subtask={mockSubtask}
        lang="en"
        workflows={mockWorkflows}
        insights={mockInsights}
        isGeneratingInitial={false}
        onLoadMore={vi.fn()}
        isLoadingMore={false}
        onWorkflowSelect={vi.fn()}
        onWorkflowDownload={vi.fn()}
        onWorkflowSetup={vi.fn()}
        onAgentSelect={vi.fn()}
        onAgentSetup={vi.fn()}
        onPromptSelect={vi.fn()}
        onPromptCopy={vi.fn()}
        onPromptOpenInService={vi.fn()}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match ExpandedSolutionTabsSimplified snapshot with custom className', () => {
    const { container } = render(
      <ExpandedSolutionTabsSimplified
        subtask={mockSubtask}
        lang="de"
        workflows={mockWorkflows}
        insights={mockInsights}
        isGeneratingInitial={false}
        onLoadMore={vi.fn()}
        isLoadingMore={false}
        onWorkflowSelect={vi.fn()}
        onWorkflowDownload={vi.fn()}
        onWorkflowSetup={vi.fn()}
        onAgentSelect={vi.fn()}
        onAgentSetup={vi.fn()}
        onPromptSelect={vi.fn()}
        onPromptCopy={vi.fn()}
        onPromptOpenInService={vi.fn()}
        className="custom-class"
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
