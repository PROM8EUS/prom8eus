import { vi } from 'vitest';

/**
 * Mock OpenAI Client for testing
 */
export const mockOpenAIClient = {
  analyzeJobDescription: vi.fn(),
  generateCompleteAnalysis: vi.fn(),
  chatCompletion: vi.fn(),
};

export const mockIsOpenAIAvailable = vi.fn();

// Mock the entire openai module
vi.mock('../../../openai', () => ({
  openaiClient: mockOpenAIClient,
  isOpenAIAvailable: mockIsOpenAIAvailable,
}));

// Mock the catalog module
vi.mock('../../../catalog/aiTools', () => ({
  getToolsByIndustry: vi.fn((industry: string) => [
    { id: 'chatgpt', name: 'ChatGPT', category: industry },
    { id: 'claude', name: 'Claude', category: industry },
  ]),
}));
