/**
 * Simple Tests for Simplified Workflow Generator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateWorkflow, generateMultipleWorkflows, clearWorkflowCache, getWorkflowCacheStats } from '../workflowGeneratorSimplified';
import { DynamicSubtask } from '../schemas/analysis';
import { workflowCache } from '../services/simpleCache';

// Mock the feature toggle manager
vi.mock('../featureToggle', () => ({
  getFeatureToggleManager: vi.fn(() => ({
    isEnabled: vi.fn((toggle: string) => {
      if (toggle === 'unified_workflow_read') return true;
      if (toggle === 'unified_workflow_ai_generation') return true;
      return false;
    })
  })),
  isUnifiedWorkflowGeneratorEnabled: vi.fn(() => false) // Disable unified generator for tests
}));

// Mock the unified workflow generator
vi.mock('../workflowGeneratorUnified', () => ({
  unifiedWorkflowGenerator: {
    generateWorkflowForSubtask: vi.fn()
  }
}));

// Mock OpenAI client
vi.mock('../openai', () => ({
  openaiClient: {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }
}));

describe('SimplifiedWorkflowGenerator - Simple Tests', () => {
  const mockSubtask: DynamicSubtask = {
    id: 'task-1',
    title: 'Email Marketing Automation',
    description: 'Automated email campaigns for customer engagement',
    automationPotential: 85,
    estimatedTime: '2-4 hours',
    complexity: 'medium',
    category: 'Marketing',
    tags: ['email', 'automation', 'marketing'],
    dependencies: [],
    prerequisites: [],
    deliverables: ['Email templates', 'Automation rules'],
    successCriteria: ['Increased open rates', 'Reduced manual work'],
    risks: ['Spam filters', 'Email deliverability'],
    resources: ['Email platform', 'Customer data'],
    stakeholders: ['Marketing team', 'IT team']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearWorkflowCache();
  });

  afterEach(() => {
    clearWorkflowCache();
  });

  describe('generateWorkflow', () => {
    it('should generate workflow using fallback', async () => {
      const result = await generateWorkflow({
        subtask: mockSubtask,
        lang: 'en',
        timeoutMs: 10000
      });

      expect(result.workflow).toBeDefined();
      expect(result.workflow?.title).toContain('Email Marketing');
      expect(result.workflow?.source).toBe('ai-generated');
      expect(result.metadata?.source).toBe('ai');
    });

    it('should handle different languages', async () => {
      const resultEn = await generateWorkflow({
        subtask: mockSubtask,
        lang: 'en'
      });

      const resultDe = await generateWorkflow({
        subtask: mockSubtask,
        lang: 'de'
      });

      expect(resultEn.workflow).toBeDefined();
      expect(resultDe.workflow).toBeDefined();
      expect(resultEn.workflow?.id).not.toBe(resultDe.workflow?.id);
    });

    it('should use cache when available', async () => {
      // First generation
      const result1 = await generateWorkflow({
        subtask: mockSubtask,
        lang: 'en'
      }, {
        useCache: true
      });

      expect(result1.metadata?.source).toBe('ai');

      // Second generation should use cache
      const result2 = await generateWorkflow({
        subtask: mockSubtask,
        lang: 'en'
      }, {
        useCache: true
      });

      expect(result2.metadata?.source).toBe('cache');
      expect(result2.workflow?.id).toBe(result1.workflow?.id);
    });
  });

  describe('generateMultipleWorkflows', () => {
    it('should generate multiple workflows', async () => {
      const result = await generateMultipleWorkflows({
        subtask: mockSubtask,
        count: 3,
        lang: 'en'
      });

      expect(result.workflows.length).toBeGreaterThan(0);
      expect(result.workflows.length).toBeLessThanOrEqual(3);
      expect(result.metadata?.successCount).toBeGreaterThan(0);
    });

    it('should respect count limit', async () => {
      const result = await generateMultipleWorkflows({
        subtask: mockSubtask,
        count: 5,
        lang: 'en'
      });

      expect(result.workflows.length).toBeLessThanOrEqual(5);
    });
  });

  describe('cache management', () => {
    it('should clear workflow cache', () => {
      // Add some data to cache
      workflowCache.set('test-key', { id: 'test' } as any);
      expect(workflowCache.size()).toBe(1);

      // Clear cache
      clearWorkflowCache();
      expect(workflowCache.size()).toBe(0);
    });

    it('should provide cache statistics', () => {
      const stats = getWorkflowCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('totalHits');
      
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
      expect(typeof stats.totalRequests).toBe('number');
      expect(typeof stats.totalHits).toBe('number');
    });
  });

  describe('feature toggle integration', () => {
    it('should respect feature toggle settings', async () => {
      // Test that feature toggles are checked
      const result = await generateWorkflow({
        subtask: mockSubtask,
        lang: 'en'
      });

      // Should work with enabled toggles
      expect(result.workflow).toBeDefined();
      expect(result.metadata?.source).toBe('ai');
    });
  });
});
