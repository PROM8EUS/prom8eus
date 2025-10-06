/**
 * Tests for ExpandedSolutionTabsSimplified Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpandedSolutionTabsSimplified from '../ExpandedSolutionTabsSimplified';
import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';

// Mock the tab components
vi.mock('../tabs/WorkflowTab', () => ({
  default: ({ subtask, workflows, onWorkflowSelect }: any) => (
    <div data-testid="workflow-tab">
      <div>Subtask: {subtask?.title || 'None'}</div>
      <div>Workflows: {workflows.length}</div>
      <button onClick={() => onWorkflowSelect?.({ id: 'workflow-1', title: 'Test Workflow' })}>
        Select Workflow
      </button>
    </div>
  )
}));

vi.mock('../tabs/AgentTab', () => ({
  default: ({ subtask, onAgentSelect }: any) => (
    <div data-testid="agent-tab">
      <div>Subtask: {subtask?.title || 'None'}</div>
      <button onClick={() => onAgentSelect?.({ id: 'agent-1', name: 'Test Agent' })}>
        Select Agent
      </button>
    </div>
  )
}));

vi.mock('../tabs/LLMTab', () => ({
  default: ({ subtask, onPromptSelect }: any) => (
    <div data-testid="llm-tab">
      <div>Subtask: {subtask?.title || 'None'}</div>
      <button onClick={() => onPromptSelect?.({ id: 'prompt-1', title: 'Test Prompt' })}>
        Select Prompt
      </button>
    </div>
  )
}));

describe('ExpandedSolutionTabsSimplified', () => {
  const mockSubtask: DynamicSubtask = {
    id: 'subtask-1',
    title: 'Test Subtask',
    description: 'Test Description',
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
    },
    {
      id: 'workflow-2',
      title: 'Test Workflow 2',
      description: 'Test Description 2',
      automationPotential: 80,
      complexity: 'high',
      estimatedTime: '3 hours',
      systems: ['System B'],
      benefits: ['Benefit B'],
      steps: [],
      metadata: {
        created: new Date(),
        version: '1.0',
        source: 'test'
      }
    }
  ];

  const mockInsights = [
    {
      id: 'insight-1',
      title: 'Test Insight',
      description: 'Test Description',
      type: 'trend',
      confidence: 0.8
    }
  ];

  const defaultProps = {
    subtask: mockSubtask,
    lang: 'de' as const,
    workflows: mockWorkflows,
    insights: mockInsights,
    isGeneratingInitial: false,
    onLoadMore: vi.fn(),
    isLoadingMore: false,
    onWorkflowSelect: vi.fn(),
    onWorkflowDownload: vi.fn(),
    onWorkflowSetup: vi.fn(),
    onAgentSelect: vi.fn(),
    onAgentSetup: vi.fn(),
    onPromptSelect: vi.fn(),
    onPromptCopy: vi.fn(),
    onPromptOpenInService: vi.fn(),
    className: 'test-class'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no subtask provided', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} subtask={null} />);

    expect(screen.getByText('Wählen Sie eine Unteraufgabe aus, um Lösungen anzuzeigen')).toBeInTheDocument();
  });

  it('should render subtask header with title and description', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} />);

    expect(screen.getByText('Test Subtask')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should render tab navigation with correct labels in German', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} />);

    expect(screen.getByText('Workflow-Lösungen')).toBeInTheDocument();
    expect(screen.getByText('AI-Agent Lösungen')).toBeInTheDocument();
    expect(screen.getByText('LLM-Prompt Lösungen')).toBeInTheDocument();
  });

  it('should render tab navigation with correct labels in English', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} lang="en" />);

    expect(screen.getByText('Workflow Solutions')).toBeInTheDocument();
    expect(screen.getByText('AI Agent Solutions')).toBeInTheDocument();
    expect(screen.getByText('LLM Prompt Solutions')).toBeInTheDocument();
  });

  it('should display workflow count in badge', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} />);

    expect(screen.getByText('2')).toBeInTheDocument(); // Workflow count badge
  });

  it('should default to workflows tab', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} />);

    expect(screen.getByTestId('workflow-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('agent-tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('llm-tab')).not.toBeInTheDocument();
  });

  it('should switch to agents tab when clicked', async () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} />);

    const agentsTab = screen.getByText('AI-Agent Lösungen');
    fireEvent.click(agentsTab);

    await waitFor(() => {
      expect(screen.getByTestId('agent-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('workflow-tab')).not.toBeInTheDocument();
    });
  });

  it('should switch to LLM tab when clicked', async () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} />);

    const llmTab = screen.getByText('LLM-Prompt Lösungen');
    fireEvent.click(llmTab);

    await waitFor(() => {
      expect(screen.getByTestId('llm-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('workflow-tab')).not.toBeInTheDocument();
    });
  });

  it('should pass correct props to WorkflowTab', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} />);

    expect(screen.getByText('Subtask: Test Subtask')).toBeInTheDocument();
    expect(screen.getByText('Workflows: 2')).toBeInTheDocument();
  });

  it('should handle workflow selection', () => {
    const onWorkflowSelect = vi.fn();
    render(<ExpandedSolutionTabsSimplified {...defaultProps} onWorkflowSelect={onWorkflowSelect} />);

    const selectButton = screen.getByText('Select Workflow');
    fireEvent.click(selectButton);

    expect(onWorkflowSelect).toHaveBeenCalledWith({
      id: 'workflow-1',
      title: 'Test Workflow'
    });
  });

  it('should handle agent selection', async () => {
    const onAgentSelect = vi.fn();
    render(<ExpandedSolutionTabsSimplified {...defaultProps} onAgentSelect={onAgentSelect} />);

    // Switch to agents tab
    const agentsTab = screen.getByText('AI-Agent Lösungen');
    fireEvent.click(agentsTab);

    await waitFor(() => {
      const selectButton = screen.getByText('Select Agent');
      fireEvent.click(selectButton);
    });

    expect(onAgentSelect).toHaveBeenCalledWith({
      id: 'agent-1',
      name: 'Test Agent'
    });
  });

  it('should handle prompt selection', async () => {
    const onPromptSelect = vi.fn();
    render(<ExpandedSolutionTabsSimplified {...defaultProps} onPromptSelect={onPromptSelect} />);

    // Switch to LLM tab
    const llmTab = screen.getByText('LLM-Prompt Lösungen');
    fireEvent.click(llmTab);

    await waitFor(() => {
      const selectButton = screen.getByText('Select Prompt');
      fireEvent.click(selectButton);
    });

    expect(onPromptSelect).toHaveBeenCalledWith({
      id: 'prompt-1',
      title: 'Test Prompt'
    });
  });

  it('should render loading state when generating initial', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} isGeneratingInitial={true} />);

    expect(screen.getByText('Lade Inhalt...')).toBeInTheDocument();
  });

  it('should render loading state in English', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} lang="en" isGeneratingInitial={true} />);

    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<ExpandedSolutionTabsSimplified {...defaultProps} />);
    
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('should handle subtask without description', () => {
    const subtaskWithoutDescription = {
      ...mockSubtask,
      description: ''
    };

    render(<ExpandedSolutionTabsSimplified {...defaultProps} subtask={subtaskWithoutDescription} />);

    expect(screen.getByText('Test Subtask')).toBeInTheDocument();
    // Description should not be rendered
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  it('should show empty state message in English', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} subtask={null} lang="en" />);

    expect(screen.getByText('Select a subtask to view solutions')).toBeInTheDocument();
  });

  it('should handle empty workflows array', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} workflows={[]} />);

    expect(screen.getByText('Workflows: 0')).toBeInTheDocument();
  });

  it('should handle empty insights array', () => {
    render(<ExpandedSolutionTabsSimplified {...defaultProps} insights={[]} />);

    // Should still render normally
    expect(screen.getByText('Test Subtask')).toBeInTheDocument();
  });
});
