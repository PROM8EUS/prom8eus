/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use the new unified schema files instead:
 * - For WorkflowIndex: use @/lib/schemas/workflowIndex
 * - For N8nWorkflow: use @/lib/schemas/n8nWorkflow
 * - For WorkflowIndexer: use @/lib/workflowIndexerUnified
 * - For N8nApi: use @/lib/n8nApiUnified
 */

/**
 * Refactored N8N Workflow Indexer
 * 
 * Main class for workflow management using modular architecture
 */

import { getGitHubConfig } from './config';
import { supabase } from '@/integrations/supabase/client';
import { openaiClient } from './openai';
import { WorkflowIndex, AgentIndex, SolutionIndex } from './schemas/workflowIndex';
import { WorkflowCacheManager, CacheConfig, CacheStats } from './workflowCacheManager';
import { WorkflowDataProcessor, WorkflowStats } from './workflowDataProcessor';

export interface WorkflowSearchParams {
  query?: string;
  category?: string;
  source?: string;
  complexity?: 'Low' | 'Medium' | 'High';
  integrations?: string[];
  tags?: string[];
  limit?: number;
  offset?: number;
}

export class WorkflowIndexer {
  private baseUrl = 'https://api.github.com/repos/Zie619/n8n-workflows';
  private workflows: WorkflowIndex[] = [];
  private agents: AgentIndex[] = [];
  private stats: WorkflowStats | null = null;
  private githubConfig = getGitHubConfig();
  private lastFetchTime: number | null = null;
  private currentSourceKey: string | undefined = undefined;
  private cacheManager: WorkflowCacheManager;
  private dataProcessor: WorkflowDataProcessor;

  constructor() {
    this.cacheManager = new WorkflowCacheManager();
    this.dataProcessor = new WorkflowDataProcessor();
    this.initializeStats();
    
    // Load from server-side cache asynchronously (server-only)
    if (typeof window === 'undefined') {
      this.loadFromServerCache();
    } else {
      console.warn('Skipping initial server cache load in browser');
    }
  }

  // Helper methods for unified solution handling
  getAllSolutions(): SolutionIndex[] {
    return [...this.workflows, ...this.agents];
  }

  getWorkflows(): WorkflowIndex[] {
    return [...this.workflows];
  }

  getAgents(): AgentIndex[] {
    return [...this.agents];
  }

  getStats(): WorkflowStats | null {
    return this.stats;
  }

  /**
   * Search workflows and agents
   */
  searchSolutions(params: WorkflowSearchParams): SolutionIndex[] {
    let results = this.getAllSolutions();

    // Apply filters
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(solution => 
        solution.title.toLowerCase().includes(query) ||
        solution.summary.toLowerCase().includes(query) ||
        (solution.tags && solution.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    if (params.category) {
      results = results.filter(solution => 
        'category' in solution && solution.category === params.category
      );
    }

    if (params.source) {
      results = results.filter(solution => solution.source === params.source);
    }

    if (params.complexity) {
      results = results.filter(solution => 
        'complexity' in solution && solution.complexity === params.complexity
      );
    }

    if (params.integrations && params.integrations.length > 0) {
      results = results.filter(solution => 
        'integrations' in solution && 
        params.integrations!.some(integration => 
          solution.integrations.includes(integration)
        )
      );
    }

    if (params.tags && params.tags.length > 0) {
      results = results.filter(solution => 
        solution.tags && 
        params.tags!.some(tag => solution.tags!.includes(tag))
      );
    }

    // Apply pagination
    if (params.offset) {
      results = results.slice(params.offset);
    }
    if (params.limit) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  /**
   * Get workflows by source
   */
  getWorkflowsBySource(source: string): WorkflowIndex[] {
    return this.workflows.filter(workflow => workflow.source === source);
  }

  /**
   * Get agents by source
   */
  getAgentsBySource(source: string): AgentIndex[] {
    return this.agents.filter(agent => agent.source === source);
  }

  /**
   * Get solutions by source
   */
  getSolutionsBySource(source: string): SolutionIndex[] {
    return this.getAllSolutions().filter(solution => solution.source === source);
  }

  /**
   * Load workflows from server cache
   */
  private async loadFromServerCache(source?: string): Promise<void> {
    try {
      await this.cacheManager.loadFromServerCache(source);
      const cachedWorkflows = this.cacheManager.get<SolutionIndex[]>(`workflows_${source || 'all'}`);
      
      if (cachedWorkflows) {
        this.processCachedWorkflows(cachedWorkflows);
      }
    } catch (error) {
      console.warn('Failed to load server cache:', error);
    }
  }

  /**
   * Process cached workflows
   */
  private processCachedWorkflows(cachedWorkflows: SolutionIndex[]): void {
    const workflows: WorkflowIndex[] = [];
    const agents: AgentIndex[] = [];

    for (const solution of cachedWorkflows) {
      if ('category' in solution && 'integrations' in solution) {
        workflows.push(solution as WorkflowIndex);
      } else if ('model' in solution && 'provider' in solution) {
        agents.push(solution as AgentIndex);
      }
    }

    this.workflows = workflows;
    this.agents = agents;
    this.updateStats();
  }

  /**
   * Save workflows to server cache
   */
  async saveToServerCache(source?: string): Promise<void> {
    const solutions = this.getAllSolutions();
    await this.cacheManager.saveToServerCache(solutions, source);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.cacheManager.getCacheStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): void {
    this.stats = {
      totalWorkflows: 0,
      totalAgents: 0,
      totalSolutions: 0,
      sources: {},
      categories: {},
      lastUpdated: null
    };
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats = WorkflowDataProcessor.calculateStats(this.workflows, this.agents);
  }

  /**
   * Add workflows
   */
  addWorkflows(workflows: any[]): void {
    const processedWorkflows = WorkflowDataProcessor.processSolutions(workflows)
      .filter(solution => 'category' in solution) as WorkflowIndex[];
    
    this.workflows.push(...processedWorkflows);
    this.updateStats();
  }

  /**
   * Add agents
   */
  addAgents(agents: any[]): void {
    const processedAgents = WorkflowDataProcessor.processSolutions(agents)
      .filter(solution => 'model' in solution) as AgentIndex[];
    
    this.agents.push(...processedAgents);
    this.updateStats();
  }

  /**
   * Add solutions (workflows and agents)
   */
  addSolutions(solutions: any[]): void {
    const processedSolutions = WorkflowDataProcessor.processSolutions(solutions);
    
    for (const solution of processedSolutions) {
      if ('category' in solution && 'integrations' in solution) {
        this.workflows.push(solution as WorkflowIndex);
      } else if ('model' in solution && 'provider' in solution) {
        this.agents.push(solution as AgentIndex);
      }
    }
    
    this.updateStats();
  }

  /**
   * Destroy indexer and cleanup resources
   */
  destroy(): void {
    this.cacheManager.destroy();
    this.workflows = [];
    this.agents = [];
    this.stats = null;
  }
}

// Export singleton instance
export const workflowIndexer = new WorkflowIndexer();
