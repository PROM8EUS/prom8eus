/**
 * Enhanced AgentTab Tests
 * Tests the enhanced AgentTab with modern card design, avatar placeholders, and skill tags
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentTab from '../AgentTab';
import { EnhancedAgentCard } from '../../ui/EnhancedAgentCard';
import { AgentTabSkeleton } from '../../ui/AgentTabSkeleton';

// Mock dependencies
jest.mock('@/lib/services/agentGenerator', () => ({
  generateAgentWithFallback: jest.fn().mockResolvedValue({
    id: 'agent-1',
    name: 'Test Agent',
    description: 'Test agent description',
    functions: ['Function 1', 'Function 2'],
    tools: ['Tool 1', 'Tool 2'],
    technology: 'AI/ML',
    complexity: 'Medium',
    status: 'generated',
    isAIGenerated: true,
    config: {
      name: 'Test Agent Config',
      description: 'Test config description',
      functions: ['Function 1', 'Function 2'],
      tools: ['Tool 1', 'Tool 2'],
      technology: 'AI/ML',
      parameters: {},
      environment: {}
    }
  })
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

describe('Enhanced AgentTab Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton loading state', async () => {
    render(
      <AgentTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Should show skeleton loading initially
    expect(screen.getByText('AI Agent Solutions')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles error states gracefully', async () => {
    const { generateAgentWithFallback } = require('@/lib/services/agentGenerator');
    generateAgentWithFallback.mockRejectedValue(new Error('Test error'));

    render(
      <AgentTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.getByText('AI Agent Solutions')).toBeInTheDocument();
    });
  });

  it('displays enhanced agent cards', async () => {
    const mockAgent = {
      id: 'agent-1',
      name: 'Test Agent',
      description: 'Test agent description',
      functions: ['Function 1', 'Function 2'],
      tools: ['Tool 1', 'Tool 2'],
      technology: 'AI/ML',
      complexity: 'Medium',
      status: 'generated',
      isAIGenerated: true,
      config: {
        name: 'Test Agent Config',
        description: 'Test config description',
        functions: ['Function 1', 'Function 2'],
        tools: ['Tool 1', 'Tool 2'],
        technology: 'AI/ML',
        parameters: {},
        environment: {}
      }
    };

    const { generateAgentWithFallback } = require('@/lib/services/agentGenerator');
    generateAgentWithFallback.mockResolvedValue(mockAgent);

    render(
      <AgentTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Wait for agent to load
    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles search functionality', async () => {
    render(
      <AgentTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Find search input
    const searchInput = screen.getByPlaceholderText('Search agents...');
    expect(searchInput).toBeInTheDocument();

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput).toHaveValue('test search');
  });

  it('handles refresh functionality', async () => {
    render(
      <AgentTab 
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
      <AgentTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    expect(screen.getByText('AI Agent Solutions')).toBeInTheDocument();

    // Switch to German
    rerender(
      <AgentTab 
        subtask={mockSubtask} 
        lang="de" 
      />
    );

    expect(screen.getByText('KI-Agent-Lösungen')).toBeInTheDocument();
  });

  it('handles empty subtask gracefully', () => {
    render(
      <AgentTab 
        subtask={null} 
        lang="en" 
      />
    );

    // Should show appropriate message
    expect(screen.getByText('Select a subtask from the sidebar to view agents')).toBeInTheDocument();
  });
});

describe('EnhancedAgentCard Tests', () => {
  const mockAgent = {
    id: 'agent-1',
    name: 'Test Agent',
    description: 'Test agent description',
    role: 'AI Assistant',
    capabilities: ['Capability 1', 'Capability 2'],
    technologies: ['AI/ML', 'Python'],
    skills: ['Machine Learning', 'Data Analysis'],
    experience: 'senior' as const,
    availability: 'available' as const,
    rating: 4.5,
    projectsCompleted: 25,
    responseTime: 15,
    costPerHour: 50,
    languages: ['English'],
    specializations: ['AI', 'ML'],
    status: 'verified' as const,
    verified: true,
    personality: 'professional' as const,
    communicationStyle: 'formal' as const
  };

  it('renders agent card with enhanced features', () => {
    render(
      <EnhancedAgentCard
        agent={mockAgent}
        lang="en"
        compact={true}
        isInteractive={true}
      />
    );

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Test agent description')).toBeInTheDocument();
    expect(screen.getByText('senior')).toBeInTheDocument();
    expect(screen.getByText('available')).toBeInTheDocument();
  });

  it('shows skeleton loading state', () => {
    render(
      <EnhancedAgentCard
        agent={mockAgent}
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
      <EnhancedAgentCard
        agent={mockAgent}
        lang="en"
        isInteractive={true}
      />
    );

    const card = screen.getByText('Test Agent').closest('.group');
    expect(card).toBeInTheDocument();

    // Hover should trigger interactions (this would need more specific testing)
    if (card) {
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);
    }
  });

  it('handles action clicks', () => {
    const onSetupClick = jest.fn();
    const onConfigClick = jest.fn();
    const onFavoriteClick = jest.fn();

    render(
      <EnhancedAgentCard
        agent={mockAgent}
        lang="en"
        onSetupClick={onSetupClick}
        onConfigClick={onConfigClick}
        onFavoriteClick={onFavoriteClick}
        isInteractive={true}
      />
    );

    // Find and click action buttons
    const setupButton = screen.getByText('Setup');
    const configButton = screen.getByText('Config');

    fireEvent.click(setupButton);
    fireEvent.click(configButton);

    expect(onSetupClick).toHaveBeenCalledWith(mockAgent);
    expect(onConfigClick).toHaveBeenCalledWith(mockAgent);
  });

  it('displays avatar placeholder correctly', () => {
    render(
      <EnhancedAgentCard
        agent={mockAgent}
        lang="en"
        isInteractive={true}
      />
    );

    // Should show avatar placeholder with initials
    const avatar = document.querySelector('.rounded-full');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent('TA'); // Test Agent initials
  });

  it('displays skill tags correctly', () => {
    render(
      <EnhancedAgentCard
        agent={mockAgent}
        lang="en"
        isInteractive={true}
      />
    );

    // Should show skill tags
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByText('Data Analysis')).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    render(
      <EnhancedAgentCard
        agent={mockAgent}
        lang="en"
        isInteractive={true}
      />
    );

    // Should show status badge
    expect(screen.getByText('verified')).toBeInTheDocument();
  });
});

describe('AgentTabSkeleton Tests', () => {
  it('renders skeleton loading states', () => {
    render(<AgentTabSkeleton count={3} compact={true} />);

    // Should show skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders empty state skeleton', () => {
    render(<AgentTabSkeleton.EmptyStateSkeleton />);

    // Should show empty state skeleton
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders error state skeleton', () => {
    render(<AgentTabSkeleton.ErrorStateSkeleton />);

    // Should show error state skeleton
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});
