/**
 * Simplified Workflow Generator
 * 
 * Clean, minimal workflow generation with clear interfaces
 */

import { DynamicSubtask } from './schemas/analysis';
import { UnifiedWorkflow } from './schemas/unifiedWorkflow';
import { openaiClient } from './openai';
import { 
  WorkflowGenerationRequest, 
  WorkflowGenerationResult, 
  MultipleWorkflowGenerationRequest,
  MultipleWorkflowGenerationResult,
  WorkflowGenerationOptions
} from './interfaces/workflowGenerator';
import { workflowCache } from './services/simpleCache';
import { getFeatureToggleManager, isUnifiedWorkflowGeneratorEnabled } from './featureToggle';

/**
 * Generate a single workflow for a subtask
 */
export async function generateWorkflow(
  request: WorkflowGenerationRequest,
  options: WorkflowGenerationOptions = {}
): Promise<WorkflowGenerationResult> {
  const startTime = Date.now();
  
  try {
    // Check feature toggles
    const featureToggleManager = getFeatureToggleManager();
    const useUnified = featureToggleManager.isEnabled('unified_workflow_read');
    const useAIGeneration = featureToggleManager.isEnabled('unified_workflow_ai_generation');
    
    if (!useUnified || !useAIGeneration) {
      return {
        error: 'Workflow generation is disabled',
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'fallback',
          processingTimeMs: Date.now() - startTime,
        }
      };
    }

    // Check cache first
    if (options.useCache !== false) {
      const cacheKey = generateCacheKey(request);
      const cached = workflowCache.get(cacheKey);
      if (cached) {
        return {
          workflow: cached,
          metadata: {
            generatedAt: new Date().toISOString(),
            source: 'cache',
            processingTimeMs: Date.now() - startTime,
          }
        };
      }
    }

    // Use unified generator if enabled
    if (isUnifiedWorkflowGeneratorEnabled()) {
      const { unifiedWorkflowGenerator } = await import('./workflowGeneratorUnified');
      const result = await unifiedWorkflowGenerator.generateWorkflowForSubtask({
        subtask: request.subtask,
        lang: request.lang,
        timeoutMs: request.timeoutMs,
        context: request.context
      });

      if (result.workflow) {
        // Cache the result
        if (options.useCache !== false) {
          const cacheKey = generateCacheKey(request);
          workflowCache.set(cacheKey, result.workflow);
        }

        return {
          workflow: result.workflow,
          metadata: {
            generatedAt: new Date().toISOString(),
            source: 'ai',
            processingTimeMs: Date.now() - startTime,
          }
        };
      }
    }

    // Fallback to simple generation
    const workflow = await generateSimpleWorkflow(request);
    
    if (workflow) {
      // Cache the result
      if (options.useCache !== false) {
        const cacheKey = generateCacheKey(request);
        workflowCache.set(cacheKey, workflow);
      }

      return {
        workflow,
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'ai',
          processingTimeMs: Date.now() - startTime,
        }
      };
    }

    return {
      error: 'Failed to generate workflow',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'fallback',
        processingTimeMs: Date.now() - startTime,
      }
    };

  } catch (error) {
    console.error('[WorkflowGenerator] Error generating workflow:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'fallback',
        processingTimeMs: Date.now() - startTime,
      }
    };
  }
}

/**
 * Generate multiple workflows for a subtask
 */
export async function generateMultipleWorkflows(
  request: MultipleWorkflowGenerationRequest,
  options: WorkflowGenerationOptions = {}
): Promise<MultipleWorkflowGenerationResult> {
  const startTime = Date.now();
  const workflows: UnifiedWorkflow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < request.count; i++) {
    try {
      const result = await generateWorkflow({
        subtask: request.subtask,
        lang: request.lang,
        timeoutMs: request.timeoutMs,
        context: request.context
      }, options);

      if (result.workflow) {
        workflows.push(result.workflow);
      } else if (result.error) {
        errors.push(result.error);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return {
    workflows,
    errors,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalProcessingTimeMs: Date.now() - startTime,
      successCount: workflows.length,
      errorCount: errors.length,
    }
  };
}

/**
 * Generate a simple workflow (fallback)
 */
async function generateSimpleWorkflow(request: WorkflowGenerationRequest): Promise<UnifiedWorkflow | null> {
  try {
    // Simple workflow generation logic
    const workflow: UnifiedWorkflow = {
      id: `simple-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${request.subtask.title} Workflow`,
      description: `Automated workflow for ${request.subtask.title}`,
      source: 'ai-generated',
      category: 'automation',
      complexity: 'medium',
      trigger_type: 'manual',
      integrations: [],
      nodes: [],
      connections: {},
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      tags: [request.subtask.title.toLowerCase().replace(/\s+/g, '-')],
      metadata: {
        generated_by: 'simple-generator',
        subtask_id: request.subtask.id,
        language: request.lang || 'de',
      }
    };

    return workflow;
  } catch (error) {
    console.error('[WorkflowGenerator] Error in simple generation:', error);
    return null;
  }
}

/**
 * Generate cache key for request
 */
function generateCacheKey(request: WorkflowGenerationRequest): string {
  const key = `${request.subtask.id}-${request.lang || 'de'}-${request.context?.user_id || 'anonymous'}`;
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Clear workflow cache
 */
export function clearWorkflowCache(): void {
  workflowCache.clear();
}

/**
 * Clear workflow cache for specific subtask
 */
export function clearWorkflowCacheForSubtask(subtaskId: string): void {
  workflowCache.clearPattern(`.*${subtaskId}.*`);
}

/**
 * Get workflow cache statistics
 */
export function getWorkflowCacheStats() {
  return workflowCache.getStats();
}
