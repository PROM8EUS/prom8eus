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

    // Generate workflow using OpenAI directly (simplified approach)
    if (isUnifiedWorkflowGeneratorEnabled()) {
      try {
        const workflow = await generateAIWorkflow(request);
        
        if (workflow) {
          // Cache the result
          if (options.useCache !== false) {
            const cacheKey = generateCacheKey(request);
            workflowCache.set(cacheKey, workflow);
          }

          return {
            workflow: workflow,
            metadata: {
              generatedAt: new Date().toISOString(),
              source: 'ai',
              processingTimeMs: Date.now() - startTime,
            }
          };
        }
      } catch (error) {
        console.warn('[WorkflowGeneratorSimplified] AI generation failed:', error);
        // Fall through to simple generation
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
 * Generate AI workflow using OpenAI directly
 */
async function generateAIWorkflow(request: WorkflowGenerationRequest): Promise<UnifiedWorkflow | null> {
  try {
    // Simple AI generation using OpenAI
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Create a workflow for the task: "${request.subtask.title}". 
                 Description: "${request.subtask.description || 'No description provided'}"
                 Language: ${request.lang || 'de'}
                 
                 Respond with a JSON object containing workflow details.`
      }],
      temperature: 0.7,
      max_tokens: 1000,
      timeout: request.timeoutMs || 15000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    // Create UnifiedWorkflow from AI response
    const workflow: UnifiedWorkflow = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${request.subtask.title} Workflow`,
      description: response.substring(0, 200) + '...',
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
        generated_by: 'ai-generator',
        subtask_id: request.subtask.id,
        language: request.lang || 'de',
        ai_response: response.substring(0, 500)
      }
    };

    return workflow;
  } catch (error) {
    console.error('[WorkflowGeneratorSimplified] AI generation error:', error);
    return null;
  }
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

// ===== LEGACY COMPATIBILITY FUNCTIONS =====
// These functions provide backward compatibility with existing components

/**
 * LEGACY: Generate workflow fast (backward compatibility)
 * Maps to new generateWorkflow interface
 */
export async function generateWorkflowFast(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'de',
  variation: number = 0,
  context: 'overarching' | 'subtask-specific' = 'subtask-specific'
): Promise<any> {
  console.log(`⚡ [WorkflowGeneratorSimplified] Fast generation for: "${subtask.title}"`);
  
  const result = await generateWorkflow({
    subtask,
    lang,
    timeoutMs: 8000, // Fast generation timeout
    context: {
      user_id: 'legacy',
      context: context,
      variation: variation
    }
  });

  // Convert UnifiedWorkflow to legacy GeneratedBlueprint format
  if (result.workflow) {
    return {
      id: result.workflow.id,
      name: result.workflow.title,
      description: result.workflow.description,
      category: result.workflow.category,
      complexity: result.workflow.complexity,
      integrations: result.workflow.integrations,
      estimatedTime: '2 hours',
      estimatedCost: '$100', 
      automationPotential: 75,
      isAIGenerated: true,
      generatedAt: result.metadata.generatedAt,
      status: 'active',
      generationMetadata: {
        timestamp: Date.now(),
        model: 'gpt-4o-mini',
        language: lang,
        cacheKey: `simplified_${subtask.id}_${lang}_${variation}`
      },
      setupCost: 100,
      validationStatus: 'valid',
      n8nWorkflow: {
        name: result.workflow.title,
        nodes: result.workflow.nodes,
        connections: result.workflow.connections,
        active: result.workflow.active,
        settings: {},
        versionId: '1.0.0'
      }
    };
  }

  return null;
}

/**
 * LEGACY: Generate UnifiedWorkflow directly (backward compatibility)
 */
export async function generateUnifiedWorkflow(
  subtask: DynamicSubtask,
  context: any
): Promise<any> {
  console.log(`🎯 [WorkflowGeneratorSimplified] Generating UnifiedWorkflow for: "${subtask.title}"`);
  
  const result = await generateWorkflow({
    subtask,
    lang: context.language || 'de',
    timeoutMs: context.timeoutMs || 15000,
    context: context
  });

  return result.workflow;
}

/**
 * LEGACY: Generate multiple UnifiedWorkflows (backward compatibility)  
 */
export async function generateMultipleUnifiedWorkflows(
  subtask: DynamicSubtask,
  count: number = 3,
  context: any
): Promise<any[]> {
  console.log(`🎯 [WorkflowGeneratorSimplified] Generating ${count} UnifiedWorkflows for: "${subtask.title}"`);
  
  const result = await generateMultipleWorkflows({
    subtask,
    count,
    lang: context.language || 'de',
    timeoutMs: context.timeoutMs || 15000,
    context: context
  });

  return result.workflows;
}

/**
 * LEGACY: Clear all workflow caches (backward compatibility)
 * Enhanced version that clears both simple cache and localStorage
 */
export function clearAllWorkflowCaches(): void {
  console.log('🧹 [WorkflowGeneratorSimplified] Clearing all workflow caches...');
  
  // Clear simple cache
  workflowCache.clear();
  
  // Also clear localStorage entries (backward compatibility)
  if (typeof window !== 'undefined' && window.localStorage) {
    const keys = Object.keys(localStorage);
    const workflowKeys = keys.filter(key => 
      key.includes('ai_metadata_') || 
      key.includes('fallback_') || 
      key.includes('workflow_') ||
      key.includes('subtask_') ||
      key.includes('blueprint_') ||
      key.includes('cache_') ||
      key.includes('simplified_')
    );
    
    workflowKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ [WorkflowGeneratorSimplified] Removed cache key: ${key}`);
    });
    
    console.log(`✅ [WorkflowGeneratorSimplified] Cleared ${workflowKeys.length} localStorage entries`);
  }
  
  // Clear any global generation tracking (backward compatibility)
  if (typeof window !== 'undefined') {
    if ((window as any).subtaskGenerationInProgress) {
      (window as any).subtaskGenerationInProgress.clear();
    }
  }
}
