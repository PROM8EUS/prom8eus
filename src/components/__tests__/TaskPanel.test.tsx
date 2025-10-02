/**
 * TaskPanel Component Test
 * Tests the refactored TaskPanel functionality after extraction
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskPanel from '../TaskPanel';
import SubtaskSidebar from '../SubtaskSidebar';
import WorkflowTab from '../tabs/WorkflowTab';
import AgentTab from '../tabs/AgentTab';
import LLMTab from '../tabs/LLMTab';

// Mock the dependencies
jest.mock('@/lib/aiAnalysis', () => ({
  generateSubtasksWithAI: jest.fn().mockResolvedValue({
    aiEnabled: true,
    subtasks: [
      {
        id: 'test-1',
        title: 'Test Subtask 1',
        automationPotential: 80,
        systems: ['Test System'],
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
      workflows: [],
      total: 0,
      hasMore: false
    })
  }
}));

jest.mock('@/lib/trendAnalysis', () => ({
  analyzeTrends: jest.fn().mockReturnValue([])
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

describe('TaskPanel Component', () => {
  const mockTask = {
    title: 'Test Task',
    name: 'Test Task Name',
    description: 'Test task description',
    category: 'test',
    subtasks: [
      {
        id: 'subtask-1',
        title: 'Test Subtask 1',
        description: 'Test subtask description',
        automationPotential: 80,
        estimatedTime: 4,
        priority: 'high' as const,
        complexity: 'medium' as const,
        systems: ['Test System'],
        risks: ['Test Risk'],
        opportunities: ['Test Opportunity'],
        dependencies: []
      }
    ]
  };

  it('renders without crashing', () => {
    render(
      <TaskPanel 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Check if main components are rendered
    expect(screen.getByTestId('effort-section')).toBeInTheDocument();
    expect(screen.getByTestId('top-subtasks-section')).toBeInTheDocument();
    expect(screen.getByTestId('implementation-request-cta')).toBeInTheDocument();
  });

  it('renders SubtaskSidebar when visible', () => {
    render(
      <SubtaskSidebar 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
        selectedSubtaskId="subtask-1"
      />
    );
    
    // Check if subtask is rendered
    expect(screen.getByText('Test Subtask 1')).toBeInTheDocument();
  });

  it('renders tab components without crashing', () => {
    const mockSubtask = {
      id: 'test-subtask',
      title: 'Test Subtask',
      description: 'Test description',
      automationPotential: 0.8,
      estimatedTime: 4,
      priority: 'high' as const,
      complexity: 'medium' as const,
      systems: ['Test System'],
      dependencies: [],
      risks: [],
      opportunities: [],
      aiTools: []
    };

    // Test WorkflowTab
    render(
      <WorkflowTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );
    expect(screen.getByText('Workflow Solutions')).toBeInTheDocument();

    // Test AgentTab
    render(
      <AgentTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );
    expect(screen.getByText('AI Agent Solutions')).toBeInTheDocument();

    // Test LLMTab
    render(
      <LLMTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );
    expect(screen.getByText('LLM Prompt Solutions')).toBeInTheDocument();
  });

  it('handles empty subtasks gracefully', () => {
    const emptyTask = {
      ...mockTask,
      subtasks: []
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

  it('handles missing task data gracefully', () => {
    const minimalTask = {
      title: 'Minimal Task'
    };

    render(
      <TaskPanel 
        task={minimalTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Should still render without crashing
    expect(screen.getByTestId('effort-section')).toBeInTheDocument();
  });
});

describe('SubtaskSidebar Modern Navigation', () => {
  const mockTask = {
    title: 'Test Task',
    subtasks: [
      {
        id: 'subtask-1',
        title: 'High Automation Task',
        description: 'High automation potential',
        automationPotential: 90,
        estimatedTime: 2,
        priority: 'high' as const,
        complexity: 'low' as const,
        systems: ['System A'],
        risks: [],
        opportunities: [],
        dependencies: []
      },
      {
        id: 'subtask-2',
        title: 'Low Automation Task',
        description: 'Low automation potential',
        automationPotential: 30,
        estimatedTime: 8,
        priority: 'low' as const,
        complexity: 'high' as const,
        systems: ['System B'],
        risks: [],
        opportunities: [],
        dependencies: []
      }
    ]
  };

  it('renders search functionality', () => {
    render(
      <SubtaskSidebar 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Check if search input is rendered
    expect(screen.getByPlaceholderText('Search subtasks...')).toBeInTheDocument();
  });

  it('renders filter and sort controls', () => {
    render(
      <SubtaskSidebar 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Check if filter and sort dropdowns are rendered
    expect(screen.getByDisplayValue('All')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Automation')).toBeInTheDocument();
  });

  it('renders favorites functionality', () => {
    render(
      <SubtaskSidebar 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Check if favorites button is rendered
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('renders collapse/expand functionality', () => {
    render(
      <SubtaskSidebar 
        task={mockTask} 
        lang="en" 
        isVisible={true} 
      />
    );
    
    // Check if collapse button is rendered (ChevronRight icon)
    const collapseButton = screen.getByRole('button');
    expect(collapseButton).toBeInTheDocument();
  });
});
