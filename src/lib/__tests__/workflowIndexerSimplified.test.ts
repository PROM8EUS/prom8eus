/**
 * Tests for Simplified Workflow Indexer
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
                limit: vi.fn()
              }))
            }))
          }))
        })),
        in: vi.fn(() => ({
          range: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn()
            }))
          }))
        })),
        range: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn()
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn()
        })),
        limit: vi.fn()
      }))
    })),
    functions: {
      invoke: vi.fn()
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

describe('SimplifiedWorkflowIndexer', () => {
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
      // Mock successful search
      const mockWorkflows = [
        { id: '1', title: 'Workflow 1', source: 'ai-generated' },
        { id: '2', title: 'Workflow 2', source: 'github' }
      ];

      vi.mocked(require('@/integrations/supabase/client').supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            or: vi.fn(() => ({
              in: vi.fn(() => ({
                range: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn()
                  }))
                }))
              }))
            }))
          }))
        });

      // Mock the final query result
      const mockQuery = {
        range: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn()
          }))
        }))
      };

      vi.mocked(require('@/integrations/supabase/client').supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => mockQuery)
        });

      // Mock the final result
      mockQuery.range().order().limit.mockResolvedValueOnce({
        data: mockWorkflows,
        error: null,
        count: 2
      });

      const result = await indexer.search({
        q: 'test',
        limit: 10
      });

      expect(result.workflows).toBeDefined();
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.hasMore).toBe(false);
    });

    it('should handle search errors gracefully', async () => {
      // Mock error scenario
      vi.mocked(require('@/integrations/supabase/client').supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            range: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: { message: 'Database error' },
                  count: 0
                })
              }))
            }))
          }))
        });

      const result = await indexer.search({
        q: 'test',
        limit: 10
      });

      expect(result.workflows).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
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

    it('should respect feature toggle settings', async () => {
      // Mock feature toggle disabled
      vi.mocked(require('../featureToggle').getFeatureToggleManager)
        .mockReturnValueOnce({
          isEnabled: vi.fn((toggle: string) => {
            if (toggle === 'unified_workflow_read') return false;
            return false;
          })
        });

      const result = await indexer.search({
        q: 'test',
        limit: 10
      });

      expect(result.workflows).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should refresh workflows successfully', async () => {
      // Mock successful refresh
      vi.mocked(require('@/integrations/supabase/client').supabase.functions.invoke)
        .mockResolvedValueOnce({
          data: {
            workflowsAdded: 5,
            workflowsUpdated: 2,
            workflowsRemoved: 1,
            errors: []
          },
          error: null
        });

      const result = await indexer.refresh({
        sourceId: 'github',
        force: true,
        incremental: false
      });

      expect(result.success).toBe(true);
      expect(result.workflowsAdded).toBe(5);
      expect(result.workflowsUpdated).toBe(2);
      expect(result.workflowsRemoved).toBe(1);
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

    it('should respect feature toggle settings', async () => {
      // Mock feature toggle disabled
      vi.mocked(require('../featureToggle').getFeatureToggleManager)
        .mockReturnValueOnce({
          isEnabled: vi.fn((toggle: string) => {
            if (toggle === 'unified_workflow_write') return false;
            return false;
          })
        });

      const result = await indexer.refresh({
        force: true
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Workflow refresh is disabled');
    });
  });

  describe('getStats', () => {
    it('should provide workflow statistics', async () => {
      // Mock successful stats query
      const mockData = [
        { source: 'ai-generated', active: true, created_at: '2024-01-01' },
        { source: 'github', active: true, created_at: '2024-01-02' },
        { source: 'ai-generated', active: false, created_at: '2024-01-03' }
      ];

      vi.mocked(require('@/integrations/supabase/client').supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            limit: vi.fn().mockResolvedValueOnce({
              data: mockData,
              error: null
            })
          }))
        });

      // Mock sources query
      vi.mocked(require('@/integrations/supabase/client').supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValueOnce({
              data: [
                { id: '1', name: 'GitHub', type: 'github', enabled: true, workflow_count: 10, health: 'healthy' }
              ],
              error: null
            })
          }))
        });

      const stats = await indexer.getStats();

      expect(stats.totalWorkflows).toBe(3);
      expect(stats.activeWorkflows).toBe(2);
      expect(stats.sources).toBeDefined();
      expect(stats.cacheStats).toBeDefined();
      expect(stats.lastUpdated).toBeDefined();
    });

    it('should handle stats errors gracefully', async () => {
      // Mock error scenario
      vi.mocked(require('@/integrations/supabase/client').supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            limit: vi.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'Stats query failed' }
            })
          }))
        });

      const stats = await indexer.getStats();

      expect(stats.totalWorkflows).toBe(0);
      expect(stats.activeWorkflows).toBe(0);
      expect(stats.sources).toEqual([]);
      expect(stats.cacheStats.size).toBe(0);
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
      // Mock successful sources query
      const mockSources = [
        { id: '1', name: 'GitHub', type: 'github', enabled: true, workflow_count: 10, health: 'healthy' },
        { id: '2', name: 'n8n.io', type: 'n8n.io', enabled: true, workflow_count: 5, health: 'warning' }
      ];

      vi.mocked(require('@/integrations/supabase/client').supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValueOnce({
              data: mockSources,
              error: null
            })
          }))
        });

      const sources = await indexer.getSources();

      expect(sources).toHaveLength(2);
      expect(sources[0].name).toBe('GitHub');
      expect(sources[0].type).toBe('github');
      expect(sources[0].enabled).toBe(true);
      expect(sources[0].workflowCount).toBe(10);
      expect(sources[0].health).toBe('healthy');
    });

    it('should handle sources errors gracefully', async () => {
      // Mock error scenario
      vi.mocked(require('@/integrations/supabase/client').supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValueOnce({
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
