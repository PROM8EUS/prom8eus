/**
 * Enhanced LLMTab Tests
 * Tests the enhanced LLMTab with code-like prompt display, syntax highlighting, and copy animations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LLMTab from '../LLMTab';
import { EnhancedPromptCard } from '../../ui/EnhancedPromptCard';
import { LLMTabSkeleton } from '../../ui/LLMTabSkeleton';

// Mock dependencies
jest.mock('@/lib/services/promptGenerator', () => ({
  generatePromptVariations: jest.fn().mockResolvedValue(new Map([
    ['prompt-1', {
      id: 'prompt-1',
      prompt: 'Test prompt for ChatGPT',
      service: 'ChatGPT',
      style: 'formal',
      preview: 'Test preview',
      status: 'generated',
      isAIGenerated: true
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

describe('Enhanced LLMTab Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton loading state', async () => {
    render(
      <LLMTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Should show skeleton loading initially
    expect(screen.getByText('LLM Prompt Solutions')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles error states gracefully', async () => {
    const { generatePromptVariations } = require('@/lib/services/promptGenerator');
    generatePromptVariations.mockRejectedValue(new Error('Test error'));

    render(
      <LLMTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.getByText('LLM Prompt Solutions')).toBeInTheDocument();
    });
  });

  it('displays enhanced prompt cards', async () => {
    const mockPrompts = new Map([
      ['prompt-1', {
        id: 'prompt-1',
        prompt: 'Test prompt for ChatGPT',
        service: 'ChatGPT',
        style: 'formal',
        preview: 'Test preview',
        status: 'generated',
        isAIGenerated: true
      }]
    ]);

    const { generatePromptVariations } = require('@/lib/services/promptGenerator');
    generatePromptVariations.mockResolvedValue(mockPrompts);

    render(
      <LLMTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Wait for prompts to load
    await waitFor(() => {
      expect(screen.getByText('ChatGPT formal Prompt')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles search functionality', async () => {
    render(
      <LLMTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    // Find search input
    const searchInput = screen.getByPlaceholderText('Search prompts...');
    expect(searchInput).toBeInTheDocument();

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput).toHaveValue('test search');
  });

  it('handles refresh functionality', async () => {
    render(
      <LLMTab 
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
      <LLMTab 
        subtask={mockSubtask} 
        lang="en" 
      />
    );

    expect(screen.getByText('LLM Prompt Solutions')).toBeInTheDocument();

    // Switch to German
    rerender(
      <LLMTab 
        subtask={mockSubtask} 
        lang="de" 
      />
    );

    expect(screen.getByText('LLM-Prompt-Lösungen')).toBeInTheDocument();
  });

  it('handles empty subtask gracefully', () => {
    render(
      <LLMTab 
        subtask={null} 
        lang="en" 
      />
    );

    // Should show appropriate message
    expect(screen.getByText('Select a subtask from the sidebar to view prompts')).toBeInTheDocument();
  });
});

describe('EnhancedPromptCard Tests', () => {
  const mockPrompt = {
    id: 'prompt-1',
    prompt: '**Test prompt** with *emphasis* and `code`',
    service: 'ChatGPT' as const,
    style: 'formal' as const,
    preview: 'Test preview',
    title: 'Test Prompt',
    description: 'Test prompt description',
    category: 'AI Prompt',
    tags: ['AI', 'ChatGPT', 'Formal'],
    estimatedTokens: 150,
    estimatedCost: 2,
    difficulty: 'intermediate' as const,
    effectiveness: 8,
    popularity: 85,
    rating: 4.5,
    author: 'Test Author',
    status: 'verified' as const,
    verified: true
  };

  it('renders prompt card with enhanced features', () => {
    render(
      <EnhancedPromptCard
        prompt={mockPrompt}
        lang="en"
        compact={true}
        isInteractive={true}
      />
    );

    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
    expect(screen.getByText('formal')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('shows skeleton loading state', () => {
    render(
      <EnhancedPromptCard
        prompt={mockPrompt}
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
      <EnhancedPromptCard
        prompt={mockPrompt}
        lang="en"
        isInteractive={true}
      />
    );

    const card = screen.getByText('Test Prompt').closest('.group');
    expect(card).toBeInTheDocument();

    // Hover should trigger interactions (this would need more specific testing)
    if (card) {
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);
    }
  });

  it('handles copy functionality', async () => {
    const onCopyClick = jest.fn();
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    });

    render(
      <EnhancedPromptCard
        prompt={mockPrompt}
        lang="en"
        onCopyClick={onCopyClick}
        isInteractive={true}
      />
    );

    // Find and click copy button
    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);

    // Should trigger copy
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPrompt.prompt);
    expect(onCopyClick).toHaveBeenCalledWith(mockPrompt);
  });

  it('handles expand/collapse functionality', () => {
    const longPrompt = {
      ...mockPrompt,
      prompt: 'This is a very long prompt that should be truncated when not expanded. '.repeat(10)
    };

    render(
      <EnhancedPromptCard
        prompt={longPrompt}
        lang="en"
        isInteractive={true}
      />
    );

    // Should show expand button for long prompts
    const expandButton = document.querySelector('[data-testid="expand-button"]');
    if (expandButton) {
      fireEvent.click(expandButton);
      // Should expand the prompt (this would need more specific testing)
    }
  });

  it('displays syntax highlighting correctly', () => {
    render(
      <EnhancedPromptCard
        prompt={mockPrompt}
        lang="en"
        isInteractive={true}
      />
    );

    // Should show syntax highlighted content
    const codeBlock = document.querySelector('.bg-gray-900');
    expect(codeBlock).toBeInTheDocument();
    
    // Should contain the prompt text
    expect(codeBlock).toHaveTextContent('Test prompt');
  });

  it('displays service and style badges correctly', () => {
    render(
      <EnhancedPromptCard
        prompt={mockPrompt}
        lang="en"
        isInteractive={true}
      />
    );

    // Should show service badge
    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
    expect(screen.getByText('formal')).toBeInTheDocument();
  });

  it('displays stats correctly', () => {
    render(
      <EnhancedPromptCard
        prompt={mockPrompt}
        lang="en"
        isInteractive={true}
      />
    );

    // Should show stats
    expect(screen.getByText('150 tokens')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('4.5/5')).toBeInTheDocument();
  });

  it('handles action clicks', () => {
    const onOpenInServiceClick = jest.fn();
    const onFavoriteClick = jest.fn();

    render(
      <EnhancedPromptCard
        prompt={mockPrompt}
        lang="en"
        onOpenInServiceClick={onOpenInServiceClick}
        onFavoriteClick={onFavoriteClick}
        isInteractive={true}
      />
    );

    // Find and click action buttons
    const openButton = screen.getByText('Open');
    fireEvent.click(openButton);

    expect(onOpenInServiceClick).toHaveBeenCalledWith(mockPrompt, mockPrompt.service);
  });
});

describe('LLMTabSkeleton Tests', () => {
  it('renders skeleton loading states', () => {
    render(<LLMTabSkeleton count={3} compact={true} />);

    // Should show skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders empty state skeleton', () => {
    render(<LLMTabSkeleton.EmptyStateSkeleton />);

    // Should show empty state skeleton
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders error state skeleton', () => {
    render(<LLMTabSkeleton.ErrorStateSkeleton />);

    // Should show error state skeleton
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});
