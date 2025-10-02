/**
 * TaskPanel Integration Test
 * Tests the integration between TaskPanel, SubtaskSidebar, and Tab components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskPanel from '../TaskPanel';

// Mock all the dependencies
jest.mock('@/lib/aiAnalysis', () => ({
  generateSubtasksWithAI: jest.fn().mockResolvedValue({
    aiEnabled: true,
    subtasks: [
      {
        id: 'generated-1',
        title: 'Generated Subtask 1',
        automationPotential: 75,
        systems: ['Generated System'],
        risks: []
      }
    ]
  })
}));

jest.mock('@/lib/openai', () => ({
  isOpenAIAvailable: jest.fn().mockReturnValue(true)
}));

jest.mock('@/lib/workflowIndexer', () => ({
  workflowIndexer: {
    searchWorkflows: jest.fn().mockResolvedValue({
      workflows: [
        {
          id: 'workflow-1',
          title: 'Test Workflow',
          description: 'A test workflow',
          category: 'automation',
          integrations: ['n8n'],
          complexity: 'Medium'
        }
      ],
      total: 1,
      hasMore: false
    })
  }
}));

jest.mock('@/lib/trendAnalysis', () => ({
  analyzeTrends: jest.fn().mockReturnValue([
    {
      type: 'trend',
      title: 'Test Trend',
      description: 'A test trend'
    }
  ])
}));

jest.mock('@/lib/workflowMatcher', () => ({
  matchWorkflowsWithFallback: jest.fn().mockResolvedValue([
    {
      workflow: {
        id: 'workflow-1',
        title: 'Test Workflow',
        description: 'A test workflow'
      },
      matchScore: 85,
      matchReasons: ['Good match'],
      relevantIntegrations: ['n8n'],
      estimatedTimeSavings: 4,
      status: 'verified',
      isAIGenerated: false,
      setupCost: 500,
      validationStatus: 'valid'
    }
  ])
}));

jest.mock('@/lib/blueprintGenerator', () => ({
  generateBlueprintWithFallback: jest.fn().mockResolvedValue({
    id: 'blueprint-1',
    name: 'Test Blueprint',
    description: 'A test blueprint',
    timeSavings: 4,
    complexity: 'Medium',
    integrations: ['n8n'],
    category: 'AI Generated',
    isAIGenerated: true,
    generatedAt: new Date().toISOString(),
    status: 'generated',
    generationMetadata: {
      timestamp: Date.now(),
      model: 'gpt-4o-mini',
      language: 'en',
      cacheKey: 'test-key'
    },
    setupCost: 500,
    downloadUrl: 'https://example.com/download',
    validationStatus: 'valid',
    n8nWorkflow: {
      name: 'Test Workflow',
      nodes: [],
      connections: {},
      active: true,
      settings: {},
      versionId: '1'
    }
  })
}));

jest.mock('@/lib/services/agentGenerator', () => ({
  generateAgentWithFallback: jest.fn().mockResolvedValue({
    id: 'agent-1',
    name: 'Test Agent',
    description: 'A test agent',
    functions: ['function1', 'function2'],
    tools: ['tool1', 'tool2'],
    technologyStack: 'Python',
    complexity: 'Medium',
    isAIGenerated: true,
    generatedAt: new Date().toISOString(),
    status: 'generated',
    generationMetadata: {
      timestamp: Date.now(),
      model: 'gpt-4o-mini',
      language: 'en',
      cacheKey: 'test-key'
    },
    setupCost: 300,
    agentConfig: {
      name: 'Test Agent',
      description: 'A test agent'
    }
  })
}));

jest.mock('@/lib/services/promptGenerator', () => ({
  generatePromptVariations: jest.fn().mockResolvedValue(new Map([
    ['chatgpt-formal', {
      id: 'prompt-1',
      name: 'Test Prompt',
      description: 'A test prompt',
      prompt: 'Test prompt content',
      preview: 'Test preview',
      service: 'ChatGPT',
      style: 'formal',
      isAIGenerated: true,
      generatedAt: new Date().toISOString(),
      status: 'generated',
      generationMetadata: {
        timestamp: Date.now(),
        model: 'gpt-4o-mini',
        language: 'en',
        cacheKey: 'test-key'
      },
      config: {
        temperature: 0.7,
        maxTokens: 500,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
      }
    }]
  ]))
}));

jest.mock('@/lib/services/cacheManager', () => ({
  cacheManager: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock the UI components
jest.mock('../EffortSection', () => {
  return function MockEffortSection() {
    return <div data-testid="effort-section">Effort Section</div>;
  };
});

jest.mock('../TopSubtasksSection', () => {
  return function MockTopSubtasksSection() {
    return <div data-testid="top-subtasks-section">Top Subtasks Section</div>;
  };
});

jest.mock('../InsightsTrendsSection', () => {
  return function MockInsightsTrendsSection() {
    return <div data-testid="insights-trends-section">Insights Trends Section</div>;
  };
});

jest.mock('../ImplementationRequestCTA', () => {
  return function MockImplementationRequestCTA() {
    return <div data-testid="implementation-request-cta">Implementation Request CTA</div>;
  };
});

describe('TaskPanel Integration Tests', () => {
  const mockTask = {
    title: 'Integration Test Task',
    name: 'Integration Test Task Name',
    description: 'Integration test task description',
    category: 'integration-test',
    subtasks: [
      {
        id: 'integration-subtask-1',
        title: 'Integration Subtask 1',
        description: 'Integration subtask description',
        automationPotential: 85,
        estimatedTime: 3,
        priority: 'high' as const,
        complexity: 'medium' as const,
        systems: ['Integration System'],
        risks: ['Integration Risk'],
        opportunities: ['Integration Opportunity'],
        dependencies: []
      },
      {
        id: 'integration-subtask-2',
        title: 'Integration Subtask 2',
        description: 'Another integration subtask',
        automationPotential: 60,
        estimatedTime: 5,
        priority: 'medium' as const,
        complexity: 'high' as const,
        systems: ['Another System'],
        risks: [],
        opportunities: [],
        dependencies: []
      }
    ]
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders complete TaskPanel with all components', async () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Check if all main sections are rendered
    expect(screen.getByTestId('effort-section')).toBeInTheDocument();
    expect(screen.getByTestId('top-subtasks-section')).toBeInTheDocument();
    expect(screen.getByTestId('implementation-request-cta')).toBeInTheDocument();
    
    // Check if subtasks are rendered
    expect(screen.getByText('Integration Subtask 1')).toBeInTheDocument();
    expect(screen.getByText('Integration Subtask 2')).toBeInTheDocument();
  });

  it('handles subtask selection and tab switching', async () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Integration Subtask 1')).toBeInTheDocument();
    });
    
    // Click on a subtask
    const subtask = screen.getByText('Integration Subtask 1');
    fireEvent.click(subtask);
    
    // Check if tabs are rendered
    await waitFor(() => {
      expect(screen.getByText('Workflows')).toBeInTheDocument();
      expect(screen.getByText('Agents')).toBeInTheDocument();
      expect(screen.getByText('LLMs')).toBeInTheDocument();
    });
  });

  it('handles tab switching between Workflows, Agents, and LLMs', async () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Integration Subtask 1')).toBeInTheDocument();
    });
    
    // Click on a subtask to show tabs
    const subtask = screen.getByText('Integration Subtask 1');
    fireEvent.click(subtask);
    
    // Wait for tabs to appear
    await waitFor(() => {
      expect(screen.getByText('Workflows')).toBeInTheDocument();
    });
    
    // Click on Agents tab
    const agentsTab = screen.getByText('Agents');
    fireEvent.click(agentsTab);
    
    // Click on LLMs tab
    const llmsTab = screen.getByText('LLMs');
    fireEvent.click(llmsTab);
    
    // Click back on Workflows tab
    const workflowsTab = screen.getByText('Workflows');
    fireEvent.click(workflowsTab);
  });

  it('handles "All Solutions" selection', async () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('All (Complete Solutions)')).toBeInTheDocument();
    });
    
    // Click on "All Solutions"
    const allSolutions = screen.getByText('All (Complete Solutions)');
    fireEvent.click(allSolutions);
    
    // Check if tabs are still rendered
    await waitFor(() => {
      expect(screen.getByText('Workflows')).toBeInTheDocument();
    });
  });

  it('handles empty task gracefully', () => {
    const emptyTask = {
      title: 'Empty Task'
    };

    render(
      <TaskPanel 
        task={emptyTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Should still render without crashing
    expect(screen.getByTestId('effort-section')).toBeInTheDocument();
  });

  it('handles task without subtasks', async () => {
    const taskWithoutSubtasks = {
      ...mockTask,
      subtasks: []
    };

    render(
      <TaskPanel 
        task={taskWithoutSubtasks} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Should still render without crashing
    expect(screen.getByTestId('effort-section')).toBeInTheDocument();
    
    // Should show fallback subtasks
    await waitFor(() => {
      expect(screen.getByText('Aufgabe planen und strukturieren')).toBeInTheDocument();
    });
  });
});
