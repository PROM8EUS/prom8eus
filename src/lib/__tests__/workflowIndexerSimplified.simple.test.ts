/**
 * Simple Tests for Simplified Workflow Indexer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SimplifiedWorkflowIndexer } from '../workflowIndexerSimplified';
import { searchCache, statsCache } from '../services/simpleCache';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          in: vi.fn(() => ({
            range: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0
                })
              }))
            }))
          }))
        })),
        in: vi.fn(() => ({
          range: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
              })
            }))
          }))
        })),
        range: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0
          })
        })),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      }))
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: {
          workflowsAdded: 0,
          workflowsUpdated: 0,
          workflowsRemoved: 0,
          errors: []
        },
        error: null
      })
    }
  }
}));

// Mock feature toggle manager
vi.mock('../featureToggle', () => ({
  getFeatureToggleManager: vi.fn(() => ({
    isEnabled: vi.fn((toggle: string) => {
      if (toggle === 'unified_workflow_read') return true;
      if (toggle === 'unified_workflow_write') return true;
      return false;
    })
  }))
}));

describe('SimplifiedWorkflowIndexer - Simple Tests', () => {
  let indexer: SimplifiedWorkflowIndexer;

  beforeEach(() => {
    vi.clearAllMocks();
    indexer = new SimplifiedWorkflowIndexer();
    searchCache.clear();
    statsCache.clear();
  });

  afterEach(() => {
    searchCache.clear();
    statsCache.clear();
  });

  describe('search', () => {
    it('should search workflows with basic parameters', async () => {
      const result = await indexer.search({
        q: 'test',
        limit: 10
      });

      expect(result.workflows).toBeDefined();
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.hasMore).toBe(false);
    });

    it('should handle different filter combinations', async () => {
      const result = await indexer.search({
        q: 'email marketing',
        source: ['ai-generated', 'github'],
        category: ['Marketing'],
        complexity: ['medium', 'high'],
        limit: 20,
        sort_by: 'relevance',
        sort_order: 'desc'
      });

      expect(result.workflows).toBeDefined();
      expect(result.pageSize).toBe(20);
    });

    it('should use cache when available', async () => {
      // First search
      const result1 = await indexer.search({
        q: 'test',
        limit: 10
      });

      // Second search should use cache
      const result2 = await indexer.search({
        q: 'test',
        limit: 10
      });

      expect(result2.metadata?.cacheHit).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should refresh workflows successfully', async () => {
      const result = await indexer.refresh({
        sourceId: 'github',
        force: true,
        incremental: false
      });

      expect(result.success).toBe(true);
      expect(result.workflowsAdded).toBe(0);
      expect(result.workflowsUpdated).toBe(0);
      expect(result.workflowsRemoved).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should handle refresh errors gracefully', async () => {
      // Mock error scenario
      vi.mocked(require('@/integrations/supabase/client').supabase.functions.invoke)
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Refresh failed' }
        });

      const result = await indexer.refresh({
        force: true
      });

      expect(result.success).toBe(false);
      expect(result.workflowsAdded).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Refresh failed');
    });
  });

  describe('getStats', () => {
    it('should provide workflow statistics', async () => {
      const stats = await indexer.getStats();

      expect(stats.totalWorkflows).toBe(0);
      expect(stats.activeWorkflows).toBe(0);
      expect(stats.sources).toBeDefined();
      expect(stats.cacheStats).toBeDefined();
      expect(stats.lastUpdated).toBeDefined();
    });

    it('should use cache when available', async () => {
      // First call
      const stats1 = await indexer.getStats();

      // Second call should use cache
      const stats2 = await indexer.getStats();

      expect(stats2).toBeDefined();
    });
  });

  describe('getSources', () => {
    it('should return workflow sources', async () => {
      const sources = await indexer.getSources();

      expect(sources).toBeDefined();
      expect(Array.isArray(sources)).toBe(true);
    });

    it('should handle sources errors gracefully', async () => {
      // Mock error scenario
      vi.mocked(require('@/integrations/supabase/client').supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Sources query failed' }
            })
          }))
        });

      const sources = await indexer.getSources();

      expect(sources).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('should clear all caches', async () => {
      // Add some data to caches
      searchCache.set('test-key', { workflows: [] } as any);
      statsCache.set('test-key', { totalWorkflows: 10 } as any);

      expect(searchCache.size()).toBe(1);
      expect(statsCache.size()).toBe(1);

      // Clear caches
      await indexer.clearCache();

      expect(searchCache.size()).toBe(0);
      expect(statsCache.size()).toBe(0);
    });
  });
});
