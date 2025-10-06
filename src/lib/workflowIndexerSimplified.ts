/**
 * Simplified Workflow Indexer
 * 
 * Clean, minimal workflow indexing and search with clear interfaces
 */

import { UnifiedWorkflow } from './schemas/unifiedWorkflow';
import { supabase } from '@/integrations/supabase/client';
import { 
  WorkflowSearchParams, 
  WorkflowSearchResult, 
  WorkflowIndexerStats,
  WorkflowRefreshRequest,
  WorkflowRefreshResult,
  WorkflowSource,
  WorkflowIndexerConfig
} from './interfaces/workflowIndexer';
import { searchCache, statsCache } from './services/simpleCache';
import { getFeatureToggleManager } from './featureToggle';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: WorkflowIndexerConfig = {
  cacheEnabled: true,
  cacheTTLMs: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
  refreshIntervalMs: 30 * 60 * 1000, // 30 minutes
  batchSize: 50,
  retryAttempts: 3,
  timeoutMs: 10000,
};

/**
 * Simplified Workflow Indexer
 */
export class SimplifiedWorkflowIndexer {
  private config: WorkflowIndexerConfig;

  constructor(config: Partial<WorkflowIndexerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Search workflows
   */
  async search(params: WorkflowSearchParams): Promise<WorkflowSearchResult> {
    const startTime = Date.now();
    
    try {
      // Check feature toggles
      const featureToggleManager = getFeatureToggleManager();
      const useUnified = featureToggleManager.isEnabled('unified_workflow_read');
      
      if (!useUnified) {
        return {
          workflows: [],
          total: 0,
          page: 1,
          pageSize: params.limit || 10,
          hasMore: false,
          metadata: {
            searchTimeMs: Date.now() - startTime,
            cacheHit: false,
            filters: params,
          }
        };
      }

      // Check cache first
      if (this.config.cacheEnabled) {
        const cacheKey = this.generateSearchCacheKey(params);
        const cached = searchCache.get(cacheKey);
        if (cached) {
          return {
            ...cached,
            metadata: {
              searchTimeMs: Date.now() - startTime,
              cacheHit: true,
              filters: params,
            }
          };
        }
      }

      // Build query
      let query = supabase
        .from('unified_workflows')
        .select('*', { count: 'exact' });

      // Apply filters
      if (params.q) {
        query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
      }

      if (params.source) {
        const sources = Array.isArray(params.source) ? params.source : [params.source];
        query = query.in('source', sources);
      }

      if (params.category) {
        const categories = Array.isArray(params.category) ? params.category : [params.category];
        query = query.in('category', categories);
      }

      if (params.complexity) {
        const complexities = Array.isArray(params.complexity) ? params.complexity : [params.complexity];
        query = query.in('complexity', complexities);
      }

      // Apply pagination
      const limit = params.limit || 10;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Apply sorting
      const sortBy = params.sort_by || 'created_at';
      const sortOrder = params.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      const result: WorkflowSearchResult = {
        workflows: data || [],
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasMore: (offset + limit) < (count || 0),
        metadata: {
          searchTimeMs: Date.now() - startTime,
          cacheHit: false,
          filters: params,
        }
      };

      // Cache the result
      if (this.config.cacheEnabled) {
        const cacheKey = this.generateSearchCacheKey(params);
        searchCache.set(cacheKey, result, this.config.cacheTTLMs);
      }

      return result;

    } catch (error) {
      console.error('[WorkflowIndexer] Search error:', error);
      return {
        workflows: [],
        total: 0,
        page: 1,
        pageSize: params.limit || 10,
        hasMore: false,
        metadata: {
          searchTimeMs: Date.now() - startTime,
          cacheHit: false,
          filters: params,
        }
      };
    }
  }

  /**
   * Refresh workflows
   */
  async refresh(request: WorkflowRefreshRequest = {}): Promise<WorkflowRefreshResult> {
    const startTime = Date.now();
    
    try {
      // Check feature toggles
      const featureToggleManager = getFeatureToggleManager();
      const useUnified = featureToggleManager.isEnabled('unified_workflow_write');
      
      if (!useUnified) {
        return {
          success: false,
          workflowsAdded: 0,
          workflowsUpdated: 0,
          workflowsRemoved: 0,
          errors: ['Workflow refresh is disabled'],
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Call Supabase function to refresh workflows
      const { data, error } = await supabase.functions.invoke('index-workflows-unified', {
        body: {
          sources: request.sourceId ? [request.sourceId] : undefined,
          force: request.force || false,
          incremental: request.incremental !== false,
        }
      });

      if (error) {
        throw new Error(`Refresh failed: ${error.message}`);
      }

      // Clear relevant caches
      if (this.config.cacheEnabled) {
        searchCache.clear();
        statsCache.clear();
      }

      return {
        success: true,
        workflowsAdded: data?.workflowsAdded || 0,
        workflowsUpdated: data?.workflowsUpdated || 0,
        workflowsRemoved: data?.workflowsRemoved || 0,
        errors: data?.errors || [],
        processingTimeMs: Date.now() - startTime,
      };

    } catch (error) {
      console.error('[WorkflowIndexer] Refresh error:', error);
      return {
        success: false,
        workflowsAdded: 0,
        workflowsUpdated: 0,
        workflowsRemoved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Get indexer statistics
   */
  async getStats(): Promise<WorkflowIndexerStats> {
    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = statsCache.get('workflow-stats');
        if (cached) {
          return cached;
        }
      }

      // Get stats from database
      const { data, error } = await supabase
        .from('unified_workflows')
        .select('source, complexity, active, created_at')
        .limit(10000); // Reasonable limit for stats

      if (error) {
        throw new Error(`Stats query failed: ${error.message}`);
      }

      // Calculate stats
      const stats: WorkflowIndexerStats = {
        totalWorkflows: data?.length || 0,
        activeWorkflows: data?.filter(w => w.active).length || 0,
        sources: await this.getSources(),
        cacheStats: {
          size: searchCache.size(),
          hitRate: searchCache.getStats().hitRate,
          totalRequests: searchCache.getStats().totalRequests,
        },
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result
      if (this.config.cacheEnabled) {
        statsCache.set('workflow-stats', stats, this.config.cacheTTLMs);
      }

      return stats;

    } catch (error) {
      console.error('[WorkflowIndexer] Stats error:', error);
      return {
        totalWorkflows: 0,
        activeWorkflows: 0,
        sources: [],
        cacheStats: {
          size: 0,
          hitRate: 0,
          totalRequests: 0,
        },
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get workflow sources
   */
  async getSources(): Promise<WorkflowSource[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_sources')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(`Sources query failed: ${error.message}`);
      }

      return data?.map(source => ({
        id: source.id,
        name: source.name,
        type: source.type,
        url: source.url,
        enabled: source.enabled,
        lastSync: source.last_sync,
        workflowCount: source.workflow_count || 0,
        health: source.health || 'healthy',
      })) || [];

    } catch (error) {
      console.error('[WorkflowIndexer] Sources error:', error);
      return [];
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    searchCache.clear();
    statsCache.clear();
  }

  /**
   * Generate cache key for search parameters
   */
  private generateSearchCacheKey(params: WorkflowSearchParams): string {
    const key = JSON.stringify(params);
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }
}

/**
 * Global instance
 */
export const simplifiedWorkflowIndexer = new SimplifiedWorkflowIndexer();
