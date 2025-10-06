/**
 * Unified Workflow Indexer
 * 
 * Refactored to use UnifiedWorkflow schema instead of WorkflowIndex
 * Integrates with feature flags for gradual rollout
 */

import { getGitHubConfig } from './config';
import { supabase } from '@/integrations/supabase/client';
import { openaiClient } from './openai';
import { UnifiedWorkflow, WorkflowSearchParams, WorkflowCreationContext } from './schemas/unifiedWorkflow';
import { WorkflowCacheManager, CacheConfig, CacheStats } from './workflowCacheManager';
import { WorkflowDataProcessor, WorkflowStats } from './workflowDataProcessor';
import { getFeatureFlagManager, isUnifiedWorkflowEnabled, isUnifiedWorkflowReadEnabled, isUnifiedWorkflowWriteEnabled } from './featureFlags';
import { ValidationService } from './services/validationService';
import { DomainClassificationService } from './services/domainClassificationService';
import { NotificationService } from './services/notificationService';

export interface UnifiedWorkflowSearchParams extends WorkflowSearchParams {
  user_id?: string;
  user_role?: string;
}

export interface UnifiedWorkflowStats {
  total: number;
  active: number;
  inactive: number;
  ai_generated: number;
  verified: number;
  by_complexity: Record<string, number>;
  by_trigger_type: Record<string, number>;
  by_source: Record<string, number>;
  total_downloads: number;
  average_rating: number;
  top_categories: Array<{ category: string; count: number }>;
  top_integrations: Array<{ integration: string; count: number }>;
}

export class UnifiedWorkflowIndexer {
  private baseUrl = 'https://api.github.com/repos/Zie619/n8n-workflows';
  private workflows: UnifiedWorkflow[] = [];
  private stats: UnifiedWorkflowStats | null = null;
  private githubConfig = getGitHubConfig();
  private lastFetchTime: number | null = null;
  private currentSourceKey: string | undefined = undefined;
  private cacheManager: WorkflowCacheManager;
  private dataProcessor: WorkflowDataProcessor;
  private validationService: ValidationService;
  private domainClassificationService: DomainClassificationService;
  private notificationService: NotificationService;
  private featureFlagManager = getFeatureFlagManager();

  constructor() {
    this.cacheManager = new WorkflowCacheManager();
    this.dataProcessor = new WorkflowDataProcessor();
    this.validationService = new ValidationService();
    this.domainClassificationService = new DomainClassificationService();
    this.notificationService = new NotificationService();
    this.initializeStats();
    
    // Load from server-side cache asynchronously (server-only)
    if (typeof window === 'undefined') {
      this.loadFromServerCache();
    } else {
      console.warn('Skipping initial server cache load in browser');
    }
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): void {
    this.stats = {
      total: 0,
      active: 0,
      inactive: 0,
      ai_generated: 0,
      verified: 0,
      by_complexity: {},
      by_trigger_type: {},
      by_source: {},
      total_downloads: 0,
      average_rating: 0,
      top_categories: [],
      top_integrations: []
    };
  }

  /**
   * Load workflows from server cache
   */
  private async loadFromServerCache(source?: string): Promise<void> {
    try {
      const normalizedSource = this.normalizeSourceKey(source) || 'all';
      
      // Check if unified workflow schema is enabled
      const useUnified = await this.featureFlagManager.isEnabled('unified_workflow_read');
      
      if (useUnified) {
        await this.loadFromUnifiedWorkflows(normalizedSource);
      } else {
        await this.loadFromLegacyCache(normalizedSource);
      }
    } catch (error) {
      console.error('Failed to load from server cache:', error);
      this.notificationService.sendAlert('cache_load_error', {
        source: source || 'all',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Load workflows from unified_workflows table
   */
  private async loadFromUnifiedWorkflows(source: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('unified_workflows')
        .select('*')
        .eq('active', true)
        .order('popularity', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      this.workflows = data || [];
      this.currentSourceKey = source;
      this.lastFetchTime = Date.now();
      
      console.log(`Loaded ${this.workflows.length} workflows from unified_workflows table`);
    } catch (error) {
      console.error('Failed to load from unified_workflows:', error);
      throw error;
    }
  }

  /**
   * Load workflows from legacy cache (fallback)
   */
  private async loadFromLegacyCache(source: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('workflow_cache')
        .select('source, workflows')
        .like('source', `${source}%`)
        .eq('version', 'v1.5.0');

      if (error) {
        throw new Error(`Legacy cache error: ${error.message}`);
      }

      const allWorkflows: any[] = [];
      const rows: any[] = Array.isArray(data) ? data : (data ? [data] : []);
      
      rows.forEach(r => {
        const arr: any[] = (r?.workflows || []) as any[];
        arr.forEach(w => allWorkflows.push(w));
      });

      // Convert legacy workflows to UnifiedWorkflow format
      this.workflows = allWorkflows.map(workflow => this.convertLegacyToUnified(workflow));
      this.currentSourceKey = source;
      this.lastFetchTime = Date.now();
      
      console.log(`Loaded ${this.workflows.length} workflows from legacy cache`);
    } catch (error) {
      console.error('Failed to load from legacy cache:', error);
      throw error;
    }
  }

  /**
   * Convert legacy WorkflowIndex to UnifiedWorkflow
   */
  private convertLegacyToUnified(legacy: any): UnifiedWorkflow {
    return {
      id: String(legacy.id),
      title: String(legacy.title || legacy.name || ''),
      description: String(legacy.summary || legacy.description || ''),
      summary: String(legacy.summary || legacy.description || ''),
      source: this.mapSourceType(legacy.source),
      sourceUrl: legacy.link,
      category: String(legacy.category || 'Other'),
      tags: Array.isArray(legacy.tags) ? legacy.tags : [],
      license: legacy.license || 'Unknown',
      complexity: this.mapComplexity(legacy.complexity),
      triggerType: this.mapTriggerType(legacy.triggerType),
      integrations: Array.isArray(legacy.integrations) ? legacy.integrations : [],
      nodeCount: legacy.nodeCount,
      connectionCount: legacy.connectionCount,
      author: legacy.authorName ? {
        name: legacy.authorName,
        username: legacy.authorUsername,
        avatar: legacy.authorAvatar,
        verified: legacy.authorVerified
      } : undefined,
      createdAt: legacy.analyzedAt || new Date().toISOString(),
      status: 'verified',
      isAIGenerated: false,
      validationStatus: 'valid',
      downloads: legacy.downloads || 0,
      rating: legacy.rating,
      popularity: legacy.popularity || 0,
      verified: legacy.verified || false,
      domainClassification: legacy.domains ? {
        domains: legacy.domains,
        confidences: legacy.domain_confidences || [],
        origin: legacy.domain_origin || 'admin'
      } : undefined,
      fileHash: legacy.fileHash,
      analyzedAt: legacy.analyzedAt,
      lastAccessed: legacy.lastAccessed,
      cacheKey: legacy.cacheKey,
      active: legacy.active !== false
    };
  }

  /**
   * Map source type to UnifiedWorkflow source type
   */
  private mapSourceType(source: string): 'github' | 'n8n.io' | 'ai-generated' | 'manual' | 'api' {
    const sourceMap: Record<string, 'github' | 'n8n.io' | 'ai-generated' | 'manual' | 'api'> = {
      'github': 'github',
      'n8n.io': 'n8n.io',
      'ai-generated': 'ai-generated',
      'manual': 'manual',
      'api': 'api'
    };
    return sourceMap[source] || 'manual';
  }

  /**
   * Map complexity to UnifiedWorkflow complexity
   */
  private mapComplexity(complexity: any): 'Low' | 'Medium' | 'High' | 'Easy' | 'Hard' {
    if (typeof complexity === 'string') {
      const complexityMap: Record<string, 'Low' | 'Medium' | 'High' | 'Easy' | 'Hard'> = {
        'Low': 'Low',
        'Medium': 'Medium',
        'High': 'High',
        'Easy': 'Easy',
        'Hard': 'Hard',
        'simple': 'Low',
        'medium': 'Medium',
        'complex': 'High',
        'enterprise': 'High'
      };
      return complexityMap[complexity] || 'Medium';
    }
    return 'Medium';
  }

  /**
   * Map trigger type to UnifiedWorkflow trigger type
   */
  private mapTriggerType(triggerType: any): 'Manual' | 'Webhook' | 'Scheduled' | 'Complex' {
    if (typeof triggerType === 'string') {
      const triggerMap: Record<string, 'Manual' | 'Webhook' | 'Scheduled' | 'Complex'> = {
        'Manual': 'Manual',
        'Webhook': 'Webhook',
        'Scheduled': 'Scheduled',
        'Complex': 'Complex'
      };
      return triggerMap[triggerType] || 'Manual';
    }
    return 'Manual';
  }

  /**
   * Normalize source key
   */
  private normalizeSourceKey(source?: string): string | undefined {
    if (!source || source === 'all') return undefined;
    return source.toLowerCase();
  }

  /**
   * Search workflows with unified parameters
   */
  async searchWorkflows(params: UnifiedWorkflowSearchParams = {}): Promise<{
    workflows: UnifiedWorkflow[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const requestedSource = this.normalizeSourceKey(params.source) || this.currentSourceKey || 'all';

      if (params.source) {
        const normalized = this.normalizeSourceKey(params.source) || 'all';
        if (this.currentSourceKey !== normalized) {
          if (typeof window === 'undefined') {
            await this.loadFromServerCache(normalized);
          } else {
            console.warn('Skipping server cache reload in browser');
          }
        }
      }

      if (this.workflows.length === 0) {
        await this.loadFromServerCache(params.source);
      }

      if (this.workflows.length > 0) {
        this.updateStatsFromWorkflows(this.workflows);
        const filteredWorkflows = this.filterWorkflows(this.workflows, params);

        const offset = params.offset || 0;
        const limit = params.limit || 20;
        const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit);

        return { 
          workflows: paginatedWorkflows, 
          total: filteredWorkflows.length, 
          hasMore: offset + limit < filteredWorkflows.length 
        };
      }

      // Fallback to real workflow loading
      const realWorkflows = await this.loadRealWorkflows(params);
      return { workflows: realWorkflows, total: realWorkflows.length, hasMore: false };
    } catch (error) {
      console.error('Search workflows error:', error);
      this.notificationService.sendAlert('search_error', {
        params,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { workflows: [], total: 0, hasMore: false };
    }
  }

  /**
   * Filter workflows based on search parameters
   */
  private filterWorkflows(workflows: UnifiedWorkflow[], params: UnifiedWorkflowSearchParams): UnifiedWorkflow[] {
    return workflows.filter(workflow => {
      // Query filter
      if (params.query) {
        const query = params.query.toLowerCase();
        const searchText = `${workflow.title} ${workflow.description} ${workflow.summary} ${workflow.category} ${workflow.tags.join(' ')} ${workflow.integrations.join(' ')}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }

      // Source filter
      if (params.source && workflow.source !== params.source) return false;

      // Category filter
      if (params.category && workflow.category !== params.category) return false;

      // Complexity filter
      if (params.complexity && workflow.complexity !== params.complexity) return false;

      // Integrations filter
      if (params.integrations && params.integrations.length > 0) {
        const hasMatchingIntegration = params.integrations.some(integration => 
          workflow.integrations.includes(integration)
        );
        if (!hasMatchingIntegration) return false;
      }

      // Tags filter
      if (params.tags && params.tags.length > 0) {
        const hasMatchingTag = params.tags.some(tag => 
          workflow.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // AI Generated filter
      if (params.isAIGenerated !== undefined && workflow.isAIGenerated !== params.isAIGenerated) return false;

      // Status filter
      if (params.status && workflow.status !== params.status) return false;

      // Verified filter
      if (params.verified !== undefined && workflow.verified !== params.verified) return false;

      return true;
    });
  }

  /**
   * Load real workflows from GitHub API
   */
  private async loadRealWorkflows(params: UnifiedWorkflowSearchParams): Promise<UnifiedWorkflow[]> {
    try {
      // This would integrate with the existing GitHub API loading logic
      // For now, return empty array as this is handled by the cache system
      console.log('Loading real workflows from GitHub API (not implemented in unified version)');
      return [];
    } catch (error) {
      console.error('Failed to load real workflows:', error);
      return [];
    }
  }

  /**
   * Update statistics from workflows
   */
  private updateStatsFromWorkflows(workflows: UnifiedWorkflow[]): void {
    if (!this.stats) return;

    this.stats.total = workflows.length;
    this.stats.active = workflows.filter(w => w.active).length;
    this.stats.inactive = workflows.filter(w => !w.active).length;
    this.stats.ai_generated = workflows.filter(w => w.isAIGenerated).length;
    this.stats.verified = workflows.filter(w => w.verified).length;
    this.stats.total_downloads = workflows.reduce((sum, w) => sum + (w.downloads || 0), 0);
    
    const ratings = workflows.filter(w => w.rating).map(w => w.rating!);
    this.stats.average_rating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

    // Count by complexity
    this.stats.by_complexity = {};
    workflows.forEach(w => {
      this.stats!.by_complexity[w.complexity] = (this.stats!.by_complexity[w.complexity] || 0) + 1;
    });

    // Count by trigger type
    this.stats.by_trigger_type = {};
    workflows.forEach(w => {
      this.stats!.by_trigger_type[w.triggerType] = (this.stats!.by_trigger_type[w.triggerType] || 0) + 1;
    });

    // Count by source
    this.stats.by_source = {};
    workflows.forEach(w => {
      this.stats!.by_source[w.source] = (this.stats!.by_source[w.source] || 0) + 1;
    });

    // Top categories
    const categoryCounts: Record<string, number> = {};
    workflows.forEach(w => {
      categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
    });
    this.stats.top_categories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top integrations
    const integrationCounts: Record<string, number> = {};
    workflows.forEach(w => {
      w.integrations.forEach(integration => {
        integrationCounts[integration] = (integrationCounts[integration] || 0) + 1;
      });
    });
    this.stats.top_integrations = Object.entries(integrationCounts)
      .map(([integration, count]) => ({ integration, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get workflow statistics
   */
  async getStats(): Promise<UnifiedWorkflowStats | null> {
    if (this.workflows.length === 0) {
      await this.loadFromServerCache();
    }
    return this.stats;
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): UnifiedWorkflow[] {
    return this.workflows;
  }

  /**
   * Get workflow by ID
   */
  getWorkflowById(id: string): UnifiedWorkflow | undefined {
    return this.workflows.find(w => w.id === id);
  }

  /**
   * Create new AI-generated workflow
   */
  async createAIGeneratedWorkflow(context: WorkflowCreationContext): Promise<UnifiedWorkflow | null> {
    try {
      const useUnified = await this.featureFlagManager.isEnabled('unified_workflow_write');
      const useAIGeneration = await this.featureFlagManager.isEnabled('unified_workflow_ai_generation');

      if (!useUnified || !useAIGeneration) {
        console.warn('AI workflow generation not enabled via feature flags');
        return null;
      }

      // Generate workflow using AI
      const generatedWorkflow = await this.generateWorkflowWithAI(context);
      
      if (generatedWorkflow) {
        // Save to unified_workflows table
        const { data, error } = await supabase
          .from('unified_workflows')
          .insert([generatedWorkflow])
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to save AI-generated workflow: ${error.message}`);
        }

        // Add to local cache
        this.workflows.unshift(data);
        this.updateStatsFromWorkflows(this.workflows);

        return data;
      }

      return null;
    } catch (error) {
      console.error('Failed to create AI-generated workflow:', error);
      this.notificationService.sendAlert('ai_generation_error', {
        context,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Generate workflow using AI
   */
  private async generateWorkflowWithAI(context: WorkflowCreationContext): Promise<UnifiedWorkflow | null> {
    try {
      // This would integrate with the existing AI generation logic
      // For now, return a placeholder
      const workflow: UnifiedWorkflow = {
        id: `ai-generated-${Date.now()}`,
        title: `AI Generated Workflow for ${context.subtaskId}`,
        description: 'AI-generated workflow based on context',
        summary: 'AI-generated workflow',
        source: 'ai-generated',
        category: 'AI Generated',
        tags: [],
        complexity: context.preferredComplexity || 'Medium',
        triggerType: 'Manual',
        integrations: context.requiredIntegrations || [],
        createdAt: new Date().toISOString(),
        status: 'generated',
        isAIGenerated: true,
        generationMetadata: {
          timestamp: Date.now(),
          model: 'gpt-4',
          language: context.language,
          cacheKey: context.subtaskId
        },
        validationStatus: 'pending',
        active: true
      };

      return workflow;
    } catch (error) {
      console.error('Failed to generate workflow with AI:', error);
      return null;
    }
  }

  /**
   * Update workflow popularity
   */
  async updateWorkflowPopularity(workflowId: string): Promise<void> {
    try {
      const useUnified = await this.featureFlagManager.isEnabled('unified_workflow_write');
      
      if (useUnified) {
        await supabase.rpc('update_workflow_popularity', { workflow_id: workflowId });
      }
    } catch (error) {
      console.error('Failed to update workflow popularity:', error);
    }
  }

  /**
   * Increment workflow downloads
   */
  async incrementWorkflowDownloads(workflowId: string): Promise<void> {
    try {
      const useUnified = await this.featureFlagManager.isEnabled('unified_workflow_write');
      
      if (useUnified) {
        await supabase.rpc('increment_workflow_downloads', { workflow_id: workflowId });
      }
    } catch (error) {
      console.error('Failed to increment workflow downloads:', error);
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus(source?: string): Promise<{ hasCache: boolean; lastFetch: Date | null; workflowCount: number }> {
    try {
      const normalizedSource = this.normalizeSourceKey(source) || 'all';
      
      if (this.currentSourceKey === normalizedSource && this.workflows.length > 0) {
        return {
          hasCache: true,
          lastFetch: this.lastFetchTime ? new Date(this.lastFetchTime) : null,
          workflowCount: this.workflows.length
        };
      }

      return { hasCache: false, lastFetch: null, workflowCount: 0 };
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return { hasCache: false, lastFetch: null, workflowCount: 0 };
    }
  }
}

// Export singleton instance
export const unifiedWorkflowIndexer = new UnifiedWorkflowIndexer();
