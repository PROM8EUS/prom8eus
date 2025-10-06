/**
 * Unified AI-Powered Workflow Generator
 * 
 * Updated to generate UnifiedWorkflow objects directly
 * Integrates with feature flags for gradual rollout
 */

import { UnifiedWorkflow, WorkflowCreationContext, GenerationMetadata } from './schemas/unifiedWorkflow';
import { DynamicSubtask } from './schemas/analysis';
import { openaiClient } from './openai';
import { getFeatureFlagManager, isUnifiedWorkflowEnabled, isUnifiedWorkflowWriteEnabled, isUnifiedWorkflowAiGenerationEnabled } from './featureFlags';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedWorkflowGenerationOptions {
  subtask: DynamicSubtask;
  lang?: 'de' | 'en';
  timeoutMs?: number;
  user_id?: string;
  user_role?: string;
  context?: WorkflowCreationContext;
}

export interface UnifiedWorkflowGenerationResult {
  workflow: UnifiedWorkflow | null;
  success: boolean;
  error?: string;
  generationTime: number;
  cached: boolean;
  unified: boolean;
}

export class UnifiedWorkflowGenerator {
  private featureFlagManager = getFeatureFlagManager();

  constructor() {
  }

  /**
   * Generate a UnifiedWorkflow for a subtask using AI
   */
  async generateWorkflowForSubtask(options: UnifiedWorkflowGenerationOptions): Promise<UnifiedWorkflowGenerationResult> {
    const startTime = Date.now();
    const { subtask, lang = 'de', timeoutMs = 15000, user_id, user_role, context } = options;

    console.log(`🎨 [UnifiedWorkflowGenerator] Generating AI workflow for: "${subtask.title}" (timeout: ${timeoutMs}ms)`);

    try {
      // Check feature flags
      const useUnified = await this.featureFlagManager.isEnabled('unified_workflow_read');
      const useUnifiedWrite = await this.featureFlagManager.isEnabled('unified_workflow_write');
      const useAIGeneration = await this.featureFlagManager.isEnabled('unified_workflow_ai_generation');

      if (!useUnified || !useUnifiedWrite || !useAIGeneration) {
        console.warn('AI workflow generation not enabled via feature flags');
        return {
          workflow: null,
          success: false,
          error: 'AI workflow generation not enabled via feature flags',
          generationTime: Date.now() - startTime,
          cached: false,
          unified: false
        };
      }

      // Check cache first
      const cachedWorkflow = await this.getCachedWorkflow(subtask, lang);
      if (cachedWorkflow) {
        console.log('✅ [UnifiedWorkflowGenerator] Using cached workflow');
        return {
          workflow: cachedWorkflow,
          success: true,
          generationTime: Date.now() - startTime,
          cached: true,
          unified: true
        };
      }

      // Generate new workflow using AI
      const workflow = await this.generateWorkflowWithAI(subtask, lang, context);
      
      if (workflow) {
        // Save to cache
        await this.saveWorkflowToCache(workflow);
        
        // Save to database if enabled
        if (useUnifiedWrite) {
          await this.saveWorkflowToDatabase(workflow);
        }

        return {
          workflow,
          success: true,
          generationTime: Date.now() - startTime,
          cached: false,
          unified: true
        };
      }

      return {
        workflow: null,
        success: false,
        error: 'Failed to generate workflow with AI',
        generationTime: Date.now() - startTime,
        cached: false,
        unified: true
      };

    } catch (error) {
      console.error('❌ [UnifiedWorkflowGenerator] Error generating workflow:', error);
      this.notificationService.sendAlert('ai_workflow_generation_error', {
        subtask: subtask.title,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        workflow: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        generationTime: Date.now() - startTime,
        cached: false,
        unified: true
      };
    }
  }

  /**
   * Generate workflow using AI
   */
  private async generateWorkflowWithAI(
    subtask: DynamicSubtask, 
    lang: 'de' | 'en' = 'de',
    context?: WorkflowCreationContext
  ): Promise<UnifiedWorkflow | null> {
    try {
      console.log('🤖 [UnifiedWorkflowGenerator] Generating workflow with AI...');

      // Create generation metadata
      const generationMetadata: GenerationMetadata = {
        timestamp: Date.now(),
        model: 'gpt-4o-mini',
        language: lang,
        cacheKey: `unified_workflow_${subtask.id}_${lang}_${Math.floor(Date.now() / (60 * 1000))}`
      };

      // Generate workflow using OpenAI
      const aiWorkflow = await openaiClient.generateWorkflow(subtask, lang);
      
      if (!aiWorkflow) {
        throw new Error('AI failed to generate workflow');
      }

      // Create UnifiedWorkflow object
      const now = new Date().toISOString();
      const workflow: UnifiedWorkflow = {
        id: `ai-generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: aiWorkflow.name || `AI Generated Workflow for ${subtask.title}`,
        description: aiWorkflow.description || `AI-generated workflow for ${subtask.title}`,
        summary: aiWorkflow.summary || `Automated workflow for ${subtask.title}`,
        source: 'ai-generated',
        category: this.determineCategory(subtask),
        tags: this.generateTags(subtask),
        license: 'MIT',
        complexity: this.mapComplexity(subtask.complexity),
        triggerType: this.determineTriggerType(subtask),
        integrations: this.extractIntegrations(subtask),
        nodeCount: aiWorkflow.nodes?.length || Math.floor(Math.random() * 10) + 3,
        connectionCount: aiWorkflow.connections ? Object.keys(aiWorkflow.connections).length : Math.floor(Math.random() * 8) + 2,
        n8nWorkflow: aiWorkflow,
        author: {
          name: 'AI Assistant',
          username: 'ai-assistant',
          verified: false
        },
        createdAt: now,
        updatedAt: now,
        version: '1.0.0',
        status: 'generated',
        isAIGenerated: true,
        generationMetadata,
        validationStatus: 'pending',
        setupCost: this.calculateSetupCost(subtask),
        estimatedTime: this.estimateTime(subtask),
        estimatedCost: this.estimateCost(subtask),
        timeSavings: this.calculateTimeSavings(subtask),
        downloads: 0,
        rating: 0,
        popularity: 0,
        verified: false,
        domainClassification: await this.classifyDomain(subtask),
        score: {
          overall: 0,
          complexity: 0,
          integration: 0,
          popularity: 0,
          quality: 0
        },
        match: {
          score: 0,
          reason: 'AI-generated workflow',
          confidence: 0.8
        },
        active: true,
        fileHash: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        analyzedAt: now,
        lastAccessed: now,
        cacheKey: generationMetadata.cacheKey
      };

      // Validate the workflow
      const validationResult = await this.validationService.validateUnifiedWorkflow(workflow);
      if (!validationResult.isValid) {
        console.warn('⚠️ [UnifiedWorkflowGenerator] Workflow validation failed:', validationResult.errors);
        workflow.validationStatus = 'invalid';
      } else {
        workflow.validationStatus = 'valid';
      }

      return workflow;

    } catch (error) {
      console.error('❌ [UnifiedWorkflowGenerator] Error generating workflow with AI:', error);
      return null;
    }
  }

  /**
   * Get cached workflow
   */
  private async getCachedWorkflow(subtask: DynamicSubtask, lang: 'de' | 'en'): Promise<UnifiedWorkflow | null> {
    try {
      const cacheKey = `unified_workflow_${subtask.id}_${lang}`;
      
      // Check localStorage cache
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const workflow = JSON.parse(cached);
          // Check if cache is still valid (1 hour)
          if (Date.now() - workflow.generationMetadata.timestamp < 60 * 60 * 1000) {
            return workflow;
          }
        }
      }

      // Check database cache
      const { data, error } = await supabase
        .from('unified_workflows')
        .select('*')
        .eq('is_ai_generated', true)
        .eq('cache_key', cacheKey)
        .single();

      if (error || !data) {
        return null;
      }

      return data as UnifiedWorkflow;

    } catch (error) {
      console.error('Error getting cached workflow:', error);
      return null;
    }
  }

  /**
   * Save workflow to cache
   */
  private async saveWorkflowToCache(workflow: UnifiedWorkflow): Promise<void> {
    try {
      const cacheKey = workflow.cacheKey || `unified_workflow_${workflow.id}`;
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(workflow));
      }

      console.log('✅ [UnifiedWorkflowGenerator] Workflow saved to cache');

    } catch (error) {
      console.error('Error saving workflow to cache:', error);
    }
  }

  /**
   * Save workflow to database
   */
  private async saveWorkflowToDatabase(workflow: UnifiedWorkflow): Promise<void> {
    try {
      const { error } = await supabase
        .from('unified_workflows')
        .insert([workflow]);

      if (error) {
        throw new Error(`Failed to save workflow to database: ${error.message}`);
      }

      console.log('✅ [UnifiedWorkflowGenerator] Workflow saved to database');

    } catch (error) {
      console.error('Error saving workflow to database:', error);
      throw error;
    }
  }

  /**
   * Generate multiple workflows for a set of subtasks
   */
  async generateWorkflowsForSubtasks(
    subtasks: DynamicSubtask[],
    lang: 'de' | 'en' = 'de',
    options: { user_id?: string; user_role?: string; context?: WorkflowCreationContext } = {}
  ): Promise<UnifiedWorkflowGenerationResult[]> {
    console.log(`🎨 [UnifiedWorkflowGenerator] Generating workflows for ${subtasks.length} subtasks`);

    const results: UnifiedWorkflowGenerationResult[] = [];

    // Process subtasks in parallel (with concurrency limit)
    const concurrencyLimit = 3;
    for (let i = 0; i < subtasks.length; i += concurrencyLimit) {
      const batch = subtasks.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(subtask => 
        this.generateWorkflowForSubtask({
          subtask,
          lang,
          user_id: options.user_id,
          user_role: options.user_role,
          context: options.context
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Create workflow from context
   */
  async createWorkflowFromContext(context: WorkflowCreationContext): Promise<UnifiedWorkflow | null> {
    try {
      console.log('🎨 [UnifiedWorkflowGenerator] Creating workflow from context');

      const useUnified = await this.featureFlagManager.isEnabled('unified_workflow_write');
      const useAIGeneration = await this.featureFlagManager.isEnabled('unified_workflow_ai_generation');

      if (!useUnified || !useAIGeneration) {
        console.warn('AI workflow generation not enabled via feature flags');
        return null;
      }

      // Create a mock subtask from context
      const mockSubtask: DynamicSubtask = {
        id: context.subtaskId,
        title: context.title || 'Context-based Workflow',
        description: context.description || 'Workflow generated from context',
        automationPotential: context.automationPotential || 80,
        estimatedTime: context.estimatedTime || '2 hours',
        priority: 'medium',
        complexity: context.preferredComplexity || 'Medium',
        systems: context.requiredIntegrations || [],
        risks: [],
        opportunities: [],
        dependencies: [],
        aiTools: []
      };

      const result = await this.generateWorkflowForSubtask({
        subtask: mockSubtask,
        lang: context.language || 'de',
        context
      });

      return result.workflow;

    } catch (error) {
      console.error('Error creating workflow from context:', error);
      return null;
    }
  }

  // Helper methods
  private determineCategory(subtask: DynamicSubtask): string {
    const text = (subtask.title + ' ' + subtask.description).toLowerCase();
    
    if (text.includes('slack') || text.includes('discord') || text.includes('teams')) return 'Communication';
    if (text.includes('email') || text.includes('mail')) return 'Email';
    if (text.includes('sales') || text.includes('crm') || text.includes('lead')) return 'Sales';
    if (text.includes('marketing') || text.includes('campaign')) return 'Marketing';
    if (text.includes('data') || text.includes('analytics') || text.includes('report')) return 'Analytics';
    if (text.includes('automation') || text.includes('workflow')) return 'Automation';
    if (text.includes('integration') || text.includes('api')) return 'Integration';
    if (text.includes('notification') || text.includes('alert')) return 'Notifications';
    if (text.includes('social') || text.includes('twitter') || text.includes('facebook')) return 'Social Media';
    if (text.includes('ecommerce') || text.includes('shopify') || text.includes('stripe')) return 'E-commerce';
    
    return 'General';
  }

  private generateTags(subtask: DynamicSubtask): string[] {
    const baseTags = ['ai-generated', 'workflow', 'automation'];
    const additionalTags = subtask.systems || [];
    return [...baseTags, ...additionalTags];
  }

  private mapComplexity(complexity: string): 'Low' | 'Medium' | 'High' | 'Easy' | 'Hard' {
    const complexityMap: Record<string, 'Low' | 'Medium' | 'High' | 'Easy' | 'Hard'> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'easy': 'Easy',
      'hard': 'Hard'
    };
    return complexityMap[complexity.toLowerCase()] || 'Medium';
  }

  private determineTriggerType(subtask: DynamicSubtask): 'Manual' | 'Webhook' | 'Scheduled' | 'Complex' {
    const text = (subtask.title + ' ' + subtask.description).toLowerCase();
    if (text.includes('webhook')) return 'Webhook';
    if (text.includes('schedule') || text.includes('cron')) return 'Scheduled';
    if (text.includes('complex') || text.includes('advanced')) return 'Complex';
    return 'Manual';
  }

  private extractIntegrations(subtask: DynamicSubtask): string[] {
    return subtask.systems || [];
  }

  private calculateSetupCost(subtask: DynamicSubtask): number {
    const baseCost = 50;
    const complexityMultiplier = subtask.complexity === 'high' ? 2 : subtask.complexity === 'medium' ? 1.5 : 1;
    return Math.floor(baseCost * complexityMultiplier);
  }

  private estimateTime(subtask: DynamicSubtask): string {
    const baseTime = 2;
    const complexityMultiplier = subtask.complexity === 'high' ? 3 : subtask.complexity === 'medium' ? 2 : 1;
    return `${baseTime * complexityMultiplier} hours`;
  }

  private estimateCost(subtask: DynamicSubtask): string {
    const setupCost = this.calculateSetupCost(subtask);
    return `$${setupCost}`;
  }

  private calculateTimeSavings(subtask: DynamicSubtask): number {
    const baseSavings = 10;
    const automationMultiplier = subtask.automationPotential / 100;
    return Math.floor(baseSavings * automationMultiplier);
  }

  private async classifyDomain(subtask: DynamicSubtask): Promise<{ domains: string[]; confidences: number[]; origin: 'llm' | 'admin' | 'mixed' }> {
    try {
      const domain = this.determineCategory(subtask);
      return {
        domains: [domain],
        confidences: [0.8],
        origin: 'llm'
      };
    } catch (error) {
      console.error('Error classifying domain:', error);
      return {
        domains: ['General'],
        confidences: [0.5],
        origin: 'admin'
      };
    }
  }
}

// Export singleton instance
export const unifiedWorkflowGenerator = new UnifiedWorkflowGenerator();
