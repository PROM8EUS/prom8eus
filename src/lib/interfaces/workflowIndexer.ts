/**
 * Workflow Indexer Interfaces
 * 
 * Clear, minimal interfaces for workflow indexing and search functionality
 */

import { UnifiedWorkflow } from '../schemas/unifiedWorkflow';

/**
 * Workflow search parameters
 */
export interface WorkflowSearchParams {
  q?: string;
  source?: string | string[];
  category?: string | string[];
  complexity?: 'low' | 'medium' | 'high' | string[];
  trigger_type?: string | string[];
  limit?: number;
  offset?: number;
  sort_by?: 'relevance' | 'created_at' | 'downloads' | 'rating';
  sort_order?: 'asc' | 'desc';
}

/**
 * Workflow search result
 */
export interface WorkflowSearchResult {
  workflows: UnifiedWorkflow[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  metadata?: {
    searchTimeMs: number;
    cacheHit: boolean;
    filters: Record<string, any>;
  };
}

/**
 * Workflow source management
 */
export interface WorkflowSource {
  id: string;
  name: string;
  type: 'github' | 'n8n.io' | 'ai-generated' | 'manual';
  url?: string;
  enabled: boolean;
  lastSync?: string;
  workflowCount: number;
  health: 'healthy' | 'warning' | 'error';
}

/**
 * Workflow indexer statistics
 */
export interface WorkflowIndexerStats {
  totalWorkflows: number;
  activeWorkflows: number;
  sources: WorkflowSource[];
  cacheStats: {
    size: number;
    hitRate: number;
    totalRequests: number;
  };
  lastUpdated: string;
}

/**
 * Workflow refresh request
 */
export interface WorkflowRefreshRequest {
  sourceId?: string;
  force?: boolean;
  incremental?: boolean;
}

/**
 * Workflow refresh result
 */
export interface WorkflowRefreshResult {
  success: boolean;
  workflowsAdded: number;
  workflowsUpdated: number;
  workflowsRemoved: number;
  errors: string[];
  processingTimeMs: number;
}

/**
 * Workflow indexer configuration
 */
export interface WorkflowIndexerConfig {
  cacheEnabled: boolean;
  cacheTTLMs: number;
  maxCacheSize: number;
  refreshIntervalMs: number;
  batchSize: number;
  retryAttempts: number;
  timeoutMs: number;
}

/**
 * Workflow indexer operations
 */
export interface WorkflowIndexerOperations {
  search(params: WorkflowSearchParams): Promise<WorkflowSearchResult>;
  refresh(request?: WorkflowRefreshRequest): Promise<WorkflowRefreshResult>;
  getStats(): Promise<WorkflowIndexerStats>;
  getSources(): Promise<WorkflowSource[]>;
  clearCache(): Promise<void>;
}
