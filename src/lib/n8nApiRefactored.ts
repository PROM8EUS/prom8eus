/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use the new unified schema files instead:
 * - For WorkflowIndex: use @/lib/schemas/workflowIndex
 * - For N8nWorkflow: use @/lib/schemas/n8nWorkflow
 * - For WorkflowIndexer: use @/lib/workflowIndexerUnified
 * - For N8nApi: use @/lib/n8nApiUnified
 */

/**
 * Refactored N8N API Client
 * 
 * Main class for n8n API interactions using modular architecture
 */

import { N8nWorkflow, N8nApiResponse, N8nWorkflowFile, N8nCategory } from './schemas/n8nWorkflow';
import { N8nWorkflowParser } from './n8nWorkflowParser';
import { N8nDataMapper } from './n8nDataMapper';
import { getFeatureFlagManager } from './featureFlags';

export interface N8nApiOptions {
  limit?: number;
  category?: string;
  useCache?: boolean;
  forceRefresh?: boolean;
}

export class N8nApi {
  private baseUrl = 'https://api.github.com';
  private githubToken: string | null = null;
  private cacheKey = 'n8n_workflows_cache';
  private cacheExpiryKey = 'n8n_workflows_cache_expiry';
  private cacheExpiryHours = 24; // Cache für 24 Stunden
  private availableCategoriesCacheKey = 'n8n_available_categories_cache';
  private availableCategoriesExpiryKey = 'n8n_available_categories_cache_expiry';
  private availableCategoriesCacheExpiryHours = 24;
  private featureFlagManager = getFeatureFlagManager();

  constructor() {
    // First try environment variable, then localStorage
    const envToken = import.meta.env.VITE_GITHUB_TOKEN;
    this.githubToken = envToken || localStorage.getItem('github_token');
  }

  /**
   * Set GitHub token
   */
  setGitHubToken(token: string): void {
    this.githubToken = token;
    localStorage.setItem('github_token', token);
  }

  /**
   * Check if GitHub token is available
   */
  private hasToken(): boolean {
    return typeof this.githubToken === 'string' && this.githubToken.length > 0;
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
   * Get headers for GitHub API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'PROM8EUS/1.0'
    };
    if (this.hasToken()) {
      headers['Authorization'] = `token ${this.githubToken}` as string;
    }
    return headers;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    try {
      const expiry = localStorage.getItem(this.cacheExpiryKey);
      if (!expiry) return false;
      
      const expiryTime = new Date(expiry).getTime();
      const now = new Date().getTime();
      
      return now < expiryTime;
    } catch (error) {
      console.warn('Error checking cache validity:', error);
      return false;
    }
  }

  /**
   * Get workflows from cache
   */
  private getCachedWorkflows(): N8nWorkflow[] {
    try {
      if (!this.isCacheValid()) {
        return [];
      }
      
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return [];
      
      return JSON.parse(cached);
    } catch (error) {
      console.warn('Error reading cached workflows:', error);
      return [];
    }
  }

  /**
   * Save workflows to cache
   */
  private saveWorkflowsToCache(workflows: N8nWorkflow[]): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(workflows));
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + this.cacheExpiryHours);
      localStorage.setItem(this.cacheExpiryKey, expiryTime.toISOString());
    } catch (error) {
      console.warn('Error saving workflows to cache:', error);
    }
  }

  /**
   * Convert UnifiedWorkflow to N8nWorkflow for backward compatibility
   */
  private convertUnifiedToN8nWorkflow(workflow: any): N8nWorkflow {
    return {
      id: workflow.id,
      name: workflow.title,
      description: workflow.description,
      category: workflow.category,
      difficulty: workflow.complexity === 'Low' ? 'Easy' : workflow.complexity === 'High' ? 'Hard' : 'Medium',
      estimatedTime: workflow.estimatedTime || '1 hour',
      estimatedCost: workflow.estimatedCost || '$50',
      nodes: workflow.nodeCount || 0,
      connections: workflow.connectionCount || 0,
      downloads: workflow.downloads || 0,
      rating: workflow.rating || 0,
      createdAt: workflow.createdAt,
      url: workflow.sourceUrl || '',
      jsonUrl: workflow.downloadUrl || workflow.sourceUrl || '',
      active: workflow.active !== false,
      triggerType: workflow.triggerType || 'Manual',
      integrations: workflow.integrations || [],
      author: workflow.author?.name
    };
  }

  /**
   * Get available categories from cache
   */
  private getCachedCategories(): string[] {
    try {
      const expiry = localStorage.getItem(this.availableCategoriesExpiryKey);
      if (!expiry) return [];
      
      const expiryTime = new Date(expiry).getTime();
      const now = new Date().getTime();
      
      if (now >= expiryTime) return [];
      
      const cached = localStorage.getItem(this.availableCategoriesCacheKey);
      if (!cached) return [];
      
      return JSON.parse(cached);
    } catch (error) {
      console.warn('Error reading cached categories:', error);
      return [];
    }
  }

  /**
   * Save categories to cache
   */
  private saveCategoriesToCache(categories: string[]): void {
    try {
      localStorage.setItem(this.availableCategoriesCacheKey, JSON.stringify(categories));
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + this.availableCategoriesCacheExpiryHours);
      localStorage.setItem(this.availableCategoriesExpiryKey, expiryTime.toISOString());
    } catch (error) {
      console.warn('Error saving categories to cache:', error);
    }
  }

  /**
   * Fetch workflows from GitHub API
   */
  async fetchWorkflows(options: N8nApiOptions = {}): Promise<N8nWorkflow[]> {
    const { limit, useCache = true, forceRefresh = false } = options;

    // Check if unified workflow schema is enabled
    const useUnified = await this.isUnifiedEnabled();
    
    if (useUnified) {
      // Use unified n8n API
      const { n8nApiUnified } = await import('./n8nApiUnified');
      const response = await n8nApiUnified.fetchWorkflows({
        ...options,
        user_id: options.user_id,
        user_role: options.user_role
      });
      
      // Convert UnifiedWorkflow to N8nWorkflow for backward compatibility
      return response.workflows.map(workflow => this.convertUnifiedToN8nWorkflow(workflow));
    }

    // Legacy implementation
    // Check cache first if not forcing refresh
    if (useCache && !forceRefresh) {
      const cachedWorkflows = this.getCachedWorkflows();
      if (cachedWorkflows.length > 0) {
        return limit ? cachedWorkflows.slice(0, limit) : cachedWorkflows;
      }
    }

    // If no client token, skip direct GitHub calls to avoid 401
    if (!this.hasToken()) {
      console.info('Skipping direct GitHub fetch (no client token).');
      return this.getFallbackWorkflows(limit ?? 20);
    }

    try {
      // Get all workflow categories from the repository
      const categoriesResponse = await fetch(
        'https://api.github.com/repos/Zie619/n8n-workflows/contents/workflows',
        {
          headers: this.getHeaders()
        }
      );
      
      if (!categoriesResponse.ok) {
        if (categoriesResponse.status === 403) {
          console.warn('GitHub API rate limit exceeded, using fallback workflows');
          const fallbackWorkflows = this.getFallbackWorkflows(limit || 20);
          this.saveWorkflowsToCache(fallbackWorkflows);
          return fallbackWorkflows;
        }
        throw new Error(`Failed to fetch categories: ${categoriesResponse.status}`);
      }
      
      const categories = await categoriesResponse.json();
      const workflows: N8nWorkflow[] = [];
      
      // Process each category to find workflow files
      const categoriesToProcess = categories;
      
      let processedCategories = 0;
      for (const category of categoriesToProcess) {
        try {
          const categoryWorkflows = await this.fetchWorkflowsFromCategory(category);
          workflows.push(...categoryWorkflows);
          processedCategories++;
          
          // Limit processing for performance
          if (limit && workflows.length >= limit) {
            break;
          }
        } catch (error) {
          console.warn(`Failed to fetch workflows from category ${category.name}:`, error);
        }
      }
      
      console.log(`Processed ${processedCategories} categories, found ${workflows.length} workflows`);
      
      // Save to cache
      this.saveWorkflowsToCache(workflows);
      
      return limit ? workflows.slice(0, limit) : workflows;
      
    } catch (error) {
      console.error('Error fetching workflows:', error);
      return this.getFallbackWorkflows(limit ?? 20);
    }
  }

  /**
   * Fetch workflows from a specific category
   */
  private async fetchWorkflowsFromCategory(category: N8nCategory): Promise<N8nWorkflow[]> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/Zie619/n8n-workflows/contents/workflows/${category.name}`,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category ${category.name}: ${response.status}`);
      }
      
      const files = await response.json() as N8nWorkflowFile[];
      const workflowFiles = files.filter(file => file.name.endsWith('.json'));
      
      return N8nWorkflowParser.parseWorkflowFiles(workflowFiles);
      
    } catch (error) {
      console.warn(`Error fetching workflows from category ${category.name}:`, error);
      return [];
    }
  }

  /**
   * Get available categories
   */
  async getAvailableCategories(): Promise<string[]> {
    // Check cache first
    const cachedCategories = this.getCachedCategories();
    if (cachedCategories.length > 0) {
      return cachedCategories;
    }

    if (!this.hasToken()) {
      return this.getFallbackCategories();
    }

    try {
      const response = await fetch(
        'https://api.github.com/repos/Zie619/n8n-workflows/contents/workflows',
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      
      const categories = await response.json() as N8nCategory[];
      const categoryNames = categories.map(cat => cat.name);
      
      // Save to cache
      this.saveCategoriesToCache(categoryNames);
      
      return categoryNames;
      
    } catch (error) {
      console.error('Error fetching categories:', error);
      return this.getFallbackCategories();
    }
  }

  /**
   * Get fallback workflows when API is unavailable
   */
  private getFallbackWorkflows(limit: number): N8nWorkflow[] {
    const fallbackWorkflows: N8nWorkflow[] = [
      {
        id: 'fallback-1',
        name: 'Email Marketing Automation',
        description: 'Automate email marketing campaigns with customer segmentation',
        category: 'marketing',
        difficulty: 'Medium',
        estimatedTime: '1 h',
        estimatedCost: '€50',
        nodes: 8,
        connections: 12,
        downloads: 150,
        rating: 4.5,
        createdAt: new Date().toISOString(),
        url: 'https://n8n.io/workflows/email-marketing',
        jsonUrl: 'https://n8n.io/workflows/email-marketing.json',
        active: true,
        triggerType: 'Scheduled',
        integrations: ['Gmail', 'Mailchimp', 'HubSpot'],
        author: 'n8n Team'
      },
      {
        id: 'fallback-2',
        name: 'CRM Lead Processing',
        description: 'Process and qualify leads from multiple sources',
        category: 'sales',
        difficulty: 'Easy',
        estimatedTime: '30 min',
        estimatedCost: '€25',
        nodes: 5,
        connections: 8,
        downloads: 200,
        rating: 4.2,
        createdAt: new Date().toISOString(),
        url: 'https://n8n.io/workflows/crm-leads',
        jsonUrl: 'https://n8n.io/workflows/crm-leads.json',
        active: true,
        triggerType: 'Webhook',
        integrations: ['Salesforce', 'Zapier', 'Slack'],
        author: 'n8n Team'
      }
    ];

    return fallbackWorkflows.slice(0, limit);
  }

  /**
   * Get fallback categories
   */
  private getFallbackCategories(): string[] {
    return [
      'marketing',
      'sales',
      'crm',
      'hr',
      'finance',
      'it',
      'devops',
      'data',
      'analytics',
      'automation',
      'workflow',
      'general'
    ];
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { hasCache: boolean; expiry: string | null; workflowCount: number } {
    const cachedWorkflows = this.getCachedWorkflows();
    const expiry = localStorage.getItem(this.cacheExpiryKey);
    
    return {
      hasCache: cachedWorkflows.length > 0,
      expiry,
      workflowCount: cachedWorkflows.length
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    localStorage.removeItem(this.cacheKey);
    localStorage.removeItem(this.cacheExpiryKey);
    localStorage.removeItem(this.availableCategoriesCacheKey);
    localStorage.removeItem(this.availableCategoriesExpiryKey);
  }

  /**
   * Validate categories
   */
  private async validateCategories(categories: string[]): Promise<string[]> {
    try {
      const availableCategories = await this.getAvailableCategories();
      return categories.filter(category => availableCategories.includes(category));
    } catch (error) {
      console.warn('Error validating categories:', error);
      return [];
    }
  }
}

// Export singleton instance
export const n8nApiClient = new N8nApi();
