/**
 * Workflow Generator Interfaces
 * 
 * Clear, minimal interfaces for workflow generation functionality
 */

import { DynamicSubtask } from '../schemas/analysis';
import { UnifiedWorkflow } from '../schemas/unifiedWorkflow';

/**
 * Core workflow generation request
 */
export interface WorkflowGenerationRequest {
  subtask: DynamicSubtask;
  lang?: 'de' | 'en';
  timeoutMs?: number;
  context?: WorkflowCreationContext;
}

/**
 * Workflow generation result
 */
export interface WorkflowGenerationResult {
  workflow?: UnifiedWorkflow;
  error?: string;
  metadata?: {
    generatedAt: string;
    source: 'ai' | 'cache' | 'fallback';
    processingTimeMs: number;
  };
}

/**
 * Multiple workflow generation request
 */
export interface MultipleWorkflowGenerationRequest {
  subtask: DynamicSubtask;
  count: number;
  lang?: 'de' | 'en';
  timeoutMs?: number;
  context?: WorkflowCreationContext;
}

/**
 * Multiple workflow generation result
 */
export interface MultipleWorkflowGenerationResult {
  workflows: UnifiedWorkflow[];
  errors: string[];
  metadata?: {
    generatedAt: string;
    totalProcessingTimeMs: number;
    successCount: number;
    errorCount: number;
  };
}

/**
 * Workflow cache management
 */
export interface WorkflowCacheManager {
  get(key: string): UnifiedWorkflow | null;
  set(key: string, workflow: UnifiedWorkflow, ttlMs?: number): void;
  clear(): void;
  clearForSubtask(subtaskId: string): void;
  getStats(): {
    size: number;
    hitRate: number;
    totalRequests: number;
  };
}

/**
 * Workflow generation options
 */
export interface WorkflowGenerationOptions {
  useCache?: boolean;
  useFallback?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Workflow creation context
 */
export interface WorkflowCreationContext {
  user_id?: string;
  user_role?: string;
  business_domain?: string;
  automation_potential?: number;
  complexity_preference?: 'low' | 'medium' | 'high';
}
