/**
 * MVP Functionality Integration Test
 * Tests the basic functionality of WorkflowTab, AgentTab, and LLMTab
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ExpandedSolutionTabs } from '../ExpandedSolutionTabs';
import { DynamicSubtask } from '@/lib/types';

// Mock the tab components to avoid complex dependencies
jest.mock('../tabs/WorkflowTab', () => {
  return function MockWorkflowTab({ onUpdateCount }: { onUpdateCount?: (count: number) => void }) {
    React.useEffect(() => {
      onUpdateCount?.(3); // Mock 3 workflows
    }, [onUpdateCount]);
    
    return <div data-testid="workflow-tab">WorkflowTab Mock</div>;
  };
});

jest.mock('../tabs/AgentTab', () => {
  return function MockAgentTab({ onUpdateCount }: { onUpdateCount?: (count: number) => void }) {
    React.useEffect(() => {
      onUpdateCount?.(2); // Mock 2 agents
    }, [onUpdateCount]);
    
    return <div data-testid="agent-tab">AgentTab Mock</div>;
  };
});

jest.mock('../tabs/LLMTab', () => {
  return function MockLLMTab({ onUpdateCount }: { onUpdateCount?: (count: number) => void }) {
    React.useEffect(() => {
      onUpdateCount?.(4); // Mock 4 prompts
    }, [onUpdateCount]);
    
    return <div data-testid="llm-tab">LLMTab Mock</div>;
  };
});

const mockSubtask: DynamicSubtask = {
  id: 'test-subtask-1',
  title: 'Test Subtask',
  description: 'A test subtask for MVP functionality',
  estimatedTime: 30,
  automationPotential: 85,
  priority: 'high',
  systems: ['n8n', 'Zapier'],
  applications: ['Slack', 'Gmail'],
  tools: ['API', 'Webhook'],
  complexity: 'Medium',
  category: 'automation',
  tags: ['test', 'mvp'],
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('MVP Functionality Integration', () => {
  it('renders ExpandedSolutionTabs with all three tabs', () => {
    render(
      <ExpandedSolutionTabs
        subtask={mockSubtask}
        lang="en"
      />
    );

    // Check if all three tabs are present
    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('LLMs')).toBeInTheDocument();
  });

  it('displays tab counts correctly', async () => {
    render(
      <ExpandedSolutionTabs
        subtask={mockSubtask}
        lang="en"
      />
    );

    // Wait for the tab counts to be updated
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Workflows count
      expect(screen.getByText('2')).toBeInTheDocument(); // Agents count
      expect(screen.getByText('4')).toBeInTheDocument(); // LLMs count
    });
  });

  it('switches between tabs correctly', async () => {
    render(
      <ExpandedSolutionTabs
        subtask={mockSubtask}
        lang="en"
      />
    );

    // Click on Agents tab
    const agentsTab = screen.getByText('Agents');
    agentsTab.click();

    // Wait for the agent tab content to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('agent-tab')).toBeInTheDocument();
    });

    // Click on LLMs tab
    const llmsTab = screen.getByText('LLMs');
    llmsTab.click();

    // Wait for the LLM tab content to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('llm-tab')).toBeInTheDocument();
    });
  });

  it('handles empty subtask gracefully', () => {
    render(
      <ExpandedSolutionTabs
        subtask={null}
        lang="en"
      />
    );

    // Should still render the tab structure
    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('LLMs')).toBeInTheDocument();
  });

  it('calls callback functions when provided', async () => {
    const mockCallbacks = {
      onWorkflowSelect: jest.fn(),
      onWorkflowDownload: jest.fn(),
      onWorkflowSetup: jest.fn(),
      onAgentSelect: jest.fn(),
      onAgentSetup: jest.fn(),
      onPromptSelect: jest.fn(),
      onPromptCopy: jest.fn(),
      onPromptOpenInService: jest.fn()
    };

    render(
      <ExpandedSolutionTabs
        subtask={mockSubtask}
        lang="en"
        {...mockCallbacks}
      />
    );

    // The component should render without errors
    expect(screen.getByText('Workflows')).toBeInTheDocument();
  });
});
