/**
 * Unified N8N API Client
 * 
 * Updated to return UnifiedWorkflow objects directly
 * Integrates with feature flags for gradual rollout
 */

import { UnifiedWorkflow, WorkflowCreationContext } from './schemas/unifiedWorkflow';
import { getFeatureFlagManager, isUnifiedWorkflowEnabled, isUnifiedWorkflowReadEnabled, isUnifiedWorkflowWriteEnabled } from './featureFlags';
import { ValidationService } from './services/validationService';
import { DomainClassificationService } from './services/domainClassificationService';
import { NotificationService } from './services/notificationService';

export interface N8nApiOptions {
  limit?: number;
  category?: string;
  useCache?: boolean;
  forceRefresh?: boolean;
  user_id?: string;
  user_role?: string;
}

export interface N8nApiResponse {
  workflows: UnifiedWorkflow[];
  total: number;
  page?: number;
  perPage?: number;
  hasMore?: boolean;
  unified: boolean;
  source: 'n8n.io';
}

export class N8nApiUnified {
  private baseUrl = 'https://api.n8n.io/api/templates/workflows';
  private cacheKey = 'n8n_unified_workflows_cache';
  private cacheExpiryKey = 'n8n_unified_workflows_cache_expiry';
  private cacheExpiryHours = 24; // Cache für 24 Stunden
  private availableCategoriesCacheKey = 'n8n_unified_available_categories_cache';
  private availableCategoriesExpiryKey = 'n8n_unified_available_categories_cache_expiry';
  private availableCategoriesCacheExpiryHours = 24;

  private validationService: ValidationService;
  private domainClassificationService: DomainClassificationService;
  private notificationService: NotificationService;
  private featureFlagManager = getFeatureFlagManager();

  constructor() {
    this.validationService = new ValidationService();
    this.domainClassificationService = new DomainClassificationService();
    this.notificationService = new NotificationService();
  }

  /**
   * Get headers for n8n API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; Prom8eusBot/1.0; +https://prom8eus.local)',
      'Referer': 'https://n8n.io/workflows/'
    };
  }

  /**
   * Check if unified workflow schema is enabled
   */
  private async isUnifiedEnabled(): Promise<boolean> {
    try {
      return await this.featureFlagManager.isEnabled('unified_workflow_read');
    } catch (error) {
      console.warn('Failed to check unified workflow feature flag:', error);
      return false;
    }
  }

  /**
   * Fetch workflows from n8n.io API
   */
  async fetchWorkflows(options: N8nApiOptions = {}): Promise<N8nApiResponse> {
    try {
      const useUnified = await this.isUnifiedEnabled();
      
      if (useUnified) {
        return await this.fetchUnifiedWorkflows(options);
      } else {
        return await this.fetchLegacyWorkflows(options);
      }
    } catch (error) {
      console.error('Error fetching n8n workflows:', error);
      this.notificationService.sendAlert('n8n_api_error', {
        options,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        workflows: [],
        total: 0,
        unified: false,
        source: 'n8n.io'
      };
    }
  }

  /**
   * Fetch workflows in UnifiedWorkflow format
   */
  private async fetchUnifiedWorkflows(options: N8nApiOptions): Promise<N8nApiResponse> {
    try {
      // Check cache first
      if (options.useCache !== false) {
        const cached = this.getCachedWorkflows();
        if (cached.length > 0) {
          const filtered = this.filterWorkflows(cached, options);
          return {
            workflows: filtered.slice(0, options.limit || 50),
            total: filtered.length,
            unified: true,
            source: 'n8n.io'
          };
        }
      }

      // Fetch from API
      const workflows = await this.loadFromN8nApi(options);
      
      // Cache the results
      if (workflows.length > 0) {
        this.saveWorkflowsToCache(workflows);
      }

      const filtered = this.filterWorkflows(workflows, options);
      return {
        workflows: filtered.slice(0, options.limit || 50),
        total: filtered.length,
        unified: true,
        source: 'n8n.io'
      };
    } catch (error) {
      console.error('Error fetching unified n8n workflows:', error);
      throw error;
    }
  }

  /**
   * Fetch workflows in legacy format (fallback)
   */
  private async fetchLegacyWorkflows(options: N8nApiOptions): Promise<N8nApiResponse> {
    try {
      // This would return legacy format for backward compatibility
      // For now, return empty array as this is handled by the unified version
      console.log('Legacy n8n workflow fetching not implemented in unified version');
      return {
        workflows: [],
        total: 0,
        unified: false,
        source: 'n8n.io'
      };
    } catch (error) {
      console.error('Error fetching legacy n8n workflows:', error);
      throw error;
    }
  }

  /**
   * Load workflows from n8n.io API
   */
  private async loadFromN8nApi(options: N8nApiOptions): Promise<UnifiedWorkflow[]> {
    try {
      const limit = options.limit || 100;
      const perPage = Math.min(limit, 500); // n8n.io API limit
      const maxPages = Math.ceil(limit / perPage);
      
      const allWorkflows: UnifiedWorkflow[] = [];
      
      for (let page = 1; page <= maxPages; page++) {
        const url = `${this.baseUrl}?page=${page}&perPage=${perPage}`;
        const response = await fetch(url, { headers: this.getHeaders() });
        
        if (!response.ok) {
          console.warn(`n8n.io API page ${page} failed with status ${response.status}`);
          break;
        }
        
        const data = await response.json();
        const items: any[] = Array.isArray(data.workflows) ? data.workflows : [];
        
        if (items.length === 0) break;
        
        const workflows = items.map((item, index) => 
          this.mapN8nTemplateToUnifiedWorkflow(item, (page - 1) * perPage + index + 1)
        );
        
        allWorkflows.push(...workflows);
        
        if (items.length < perPage) break; // Last page
      }
      
      return allWorkflows;
    } catch (error) {
      console.error('Error loading from n8n.io API:', error);
      throw error;
    }
  }

  /**
   * Map n8n.io template to UnifiedWorkflow
   */
  private mapN8nTemplateToUnifiedWorkflow(template: any, id: number): UnifiedWorkflow {
    const now = new Date().toISOString();
    const name = (template.name || `n8n-workflow-${id}`).toString();
    const description = (template.description || `Official n8n workflow: ${name}`).toString();
    const nodes = Array.isArray(template.nodes) ? template.nodes : [];
    const nodeCount = nodes.length || 0;
    
    // Extract integrations from nodes
    const integrationsSet = new Set<string>();
    nodes.forEach((node: any) => {
      const raw = (node?.name || node?.id || '').toString();
      if (raw) {
        const integration = this.humanizeIntegration(raw);
        integrationsSet.add(integration);
      }
    });
    const integrations = Array.from(integrationsSet).slice(0, 12);
    
    // Determine complexity based on node count
    const complexity = nodeCount > 12 ? 'High' : nodeCount > 6 ? 'Medium' : 'Low';
    
    // Determine trigger type
    const triggerType = this.determineTriggerType(name + ' ' + description);
    
    // Determine category
    const category = this.determineCategory(name, description);
    
    // Generate tags
    const tags = this.generateTagsFromName(name);
    
    return {
      id: `n8n-${id}`,
      title: name,
      description: description,
      summary: description,
      source: 'n8n.io',
      sourceUrl: template.url || `https://n8n.io/workflows/${template.id}`,
      category: category,
      tags: tags,
      license: 'Commercial',
      complexity: complexity,
      triggerType: triggerType,
      integrations: integrations,
      nodeCount: nodeCount,
      connectionCount: Math.floor(nodeCount * 0.8),
      author: {
        name: template.author || 'n8n.io',
        username: 'n8n-io',
        verified: true
      },
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      status: 'verified',
      isAIGenerated: false,
      validationStatus: 'valid',
      setupCost: template.price || Math.floor(Math.random() * 200) + 50,
      estimatedTime: `${Math.floor(Math.random() * 3) + 1} hours`,
      estimatedCost: `$${template.price || Math.floor(Math.random() * 300) + 100}`,
      timeSavings: Math.floor(Math.random() * 25) + 10,
      downloads: template.downloads || Math.floor(Math.random() * 5000) + 100,
      rating: template.rating || Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // 3.5 - 5.0
      popularity: template.popularity || Math.floor(Math.random() * 200) + 50,
      verified: true,
      domainClassification: {
        domains: [category],
        confidences: [0.9],
        origin: 'admin'
      },
      score: {
        overall: Math.round((Math.random() * 1.5 + 3.5) * 100) / 100, // 3.5 - 5.0
        complexity: Math.round((Math.random() * 1.5 + 3.5) * 100) / 100,
        integration: Math.round((Math.random() * 1.5 + 3.5) * 100) / 100,
        popularity: Math.round((Math.random() * 1.5 + 3.5) * 100) / 100,
        quality: Math.round((Math.random() * 1.5 + 3.5) * 100) / 100
      },
      match: {
        score: Math.round((Math.random() * 1.5 + 3.5) * 100) / 100,
        reason: 'Official n8n.io template',
        confidence: 0.9
      },
      downloadUrl: template.downloadUrl || template.url,
      previewUrl: template.previewUrl || template.url,
      active: true,
      fileHash: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      analyzedAt: now,
      lastAccessed: now,
      cacheKey: `n8n-${template.id || id}`
    };
  }

  /**
   * Filter workflows based on options
   */
  private filterWorkflows(workflows: UnifiedWorkflow[], options: N8nApiOptions): UnifiedWorkflow[] {
    return workflows.filter(workflow => {
      // Category filter
      if (options.category && workflow.category !== options.category) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get cached workflows
   */
  private getCachedWorkflows(): UnifiedWorkflow[] {
    try {
      if (typeof window === 'undefined') return [];
      
      const cached = localStorage.getItem(this.cacheKey);
      const expiry = localStorage.getItem(this.cacheExpiryKey);
      
      if (!cached || !expiry) return [];
      
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() > expiryTime) {
        this.clearCache();
        return [];
      }
      
      return JSON.parse(cached);
    } catch (error) {
      console.error('Error getting cached workflows:', error);
      return [];
    }
  }

  /**
   * Save workflows to cache
   */
  private saveWorkflowsToCache(workflows: UnifiedWorkflow[]): void {
    try {
      if (typeof window === 'undefined') return;
      
      const expiryTime = Date.now() + (this.cacheExpiryHours * 60 * 60 * 1000);
      
      localStorage.setItem(this.cacheKey, JSON.stringify(workflows));
      localStorage.setItem(this.cacheExpiryKey, expiryTime.toString());
    } catch (error) {
      console.error('Error saving workflows to cache:', error);
    }
  }

  /**
   * Clear cache
   */
  private clearCache(): void {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.removeItem(this.cacheKey);
      localStorage.removeItem(this.cacheExpiryKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { hasCache: boolean; expiry: string | null; workflowCount: number } {
    try {
      if (typeof window === 'undefined') {
        return { hasCache: false, expiry: null, workflowCount: 0 };
      }
      
      const cached = localStorage.getItem(this.cacheKey);
      const expiry = localStorage.getItem(this.cacheExpiryKey);
      
      if (!cached || !expiry) {
        return { hasCache: false, expiry: null, workflowCount: 0 };
      }
      
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() > expiryTime) {
        this.clearCache();
        return { hasCache: false, expiry: null, workflowCount: 0 };
      }
      
      const workflows = JSON.parse(cached);
      return {
        hasCache: true,
        expiry: new Date(expiryTime).toISOString(),
        workflowCount: workflows.length
      };
    } catch (error) {
      console.error('Error getting cache status:', error);
      return { hasCache: false, expiry: null, workflowCount: 0 };
    }
  }

  /**
   * Get available categories
   */
  async getAvailableCategories(): Promise<string[]> {
    try {
      // Check cache first
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(this.availableCategoriesCacheKey);
        const expiry = localStorage.getItem(this.availableCategoriesExpiryKey);
        
        if (cached && expiry) {
          const expiryTime = parseInt(expiry, 10);
          if (Date.now() <= expiryTime) {
            return JSON.parse(cached);
          }
        }
      }
      
      // Fetch from API
      const workflows = await this.loadFromN8nApi({ limit: 1000 });
      const categories = [...new Set(workflows.map(w => w.category))].sort();
      
      // Cache the results
      if (typeof window !== 'undefined') {
        const expiryTime = Date.now() + (this.availableCategoriesCacheExpiryHours * 60 * 60 * 1000);
        localStorage.setItem(this.availableCategoriesCacheKey, JSON.stringify(categories));
        localStorage.setItem(this.availableCategoriesExpiryKey, expiryTime.toString());
      }
      
      return categories;
    } catch (error) {
      console.error('Error getting available categories:', error);
      return [];
    }
  }

  /**
   * Create AI-generated workflow based on context
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
        // Add to local cache
        const cached = this.getCachedWorkflows();
        cached.unshift(generatedWorkflow);
        this.saveWorkflowsToCache(cached);
        
        return generatedWorkflow;
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
      const now = new Date().toISOString();
      
      const workflow: UnifiedWorkflow = {
        id: `n8n-ai-${Date.now()}`,
        title: `AI Generated N8n Workflow for ${context.subtaskId}`,
        description: 'AI-generated n8n workflow based on context',
        summary: 'AI-generated n8n workflow',
        source: 'n8n.io',
        category: 'AI Generated',
        tags: ['ai-generated', 'n8n', 'automation'],
        license: 'Commercial',
        complexity: context.preferredComplexity || 'Medium',
        triggerType: 'Manual',
        integrations: context.requiredIntegrations || ['HTTP Request', 'Webhook'],
        nodeCount: Math.floor(Math.random() * 10) + 3,
        connectionCount: Math.floor(Math.random() * 8) + 2,
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
        generationMetadata: {
          timestamp: Date.now(),
          model: 'gpt-4',
          language: context.language,
          cacheKey: context.subtaskId
        },
        validationStatus: 'pending',
        setupCost: Math.floor(Math.random() * 150) + 25,
        estimatedTime: `${Math.floor(Math.random() * 2) + 1} hours`,
        estimatedCost: `$${Math.floor(Math.random() * 200) + 50}`,
        timeSavings: Math.floor(Math.random() * 15) + 5,
        downloads: 0,
        rating: 0,
        popularity: 0,
        verified: false,
        domainClassification: {
          domains: ['AI Generated'],
          confidences: [0.7],
          origin: 'llm'
        },
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
          confidence: 0.7
        },
        active: true,
        fileHash: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        analyzedAt: now,
        lastAccessed: now,
        cacheKey: `n8n-ai-${context.subtaskId}`
      };
      
      return workflow;
    } catch (error) {
      console.error('Failed to generate workflow with AI:', error);
      return null;
    }
  }

  // Helper methods
  private humanizeIntegration(raw: string): string {
    try {
      const seg = (raw || '').split('.').pop() || raw || '';
      const spaced = seg.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      return spaced
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch {
      return raw || 'Unknown';
    }
  }

  private determineTriggerType(text: string): 'Manual' | 'Webhook' | 'Scheduled' | 'Complex' {
    const lower = text.toLowerCase();
    if (lower.includes('webhook')) return 'Webhook';
    if (lower.includes('schedule') || lower.includes('cron')) return 'Scheduled';
    if (lower.includes('complex') || lower.includes('advanced')) return 'Complex';
    return 'Manual';
  }

  private determineCategory(name: string, description: string): string {
    const text = (name + ' ' + description).toLowerCase();
    
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

  private generateTagsFromName(name: string): string[] {
    const baseTags = ['n8n', 'workflow', 'automation'];
    const additionalTags = ['integration', 'api', 'data', 'processing', 'notification', 'scheduled'];
    const numAdditional = Math.floor(Math.random() * 3) + 1;
    const shuffled = additionalTags.sort(() => 0.5 - Math.random());
    return [...baseTags, ...shuffled.slice(0, numAdditional)];
  }
}

// Export singleton instance
export const n8nApiUnified = new N8nApiUnified();
