/**
 * N8N Workflow Indexer
 * 
 * Based on the n8n-workflows repository documentation:
 * - 2,053 workflows with meaningful, searchable names
 * - 365 unique integrations across popular platforms
 * - 29,445 total nodes with professional categorization
 * - 12 service categories for filtering
 */

import { getGitHubConfig } from './config';
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowIndex {
  id: number;
  filename: string;
  name: string;
  active: boolean;
  triggerType: 'Complex' | 'Webhook' | 'Manual' | 'Scheduled';
  complexity: 'Low' | 'Medium' | 'High';
  nodeCount: number;
  integrations: string[];
  description: string;
  category: string;
  tags: string[];
  fileHash: string;
  analyzedAt: string;
  // Author metadata (optional, populated for n8n.io)
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  authorVerified?: boolean;
}

export interface WorkflowStats {
  total: number;
  active: number;
  inactive: number;
  triggers: {
    Complex: number;
    Webhook: number;
    Manual: number;
    Scheduled: number;
  };
  totalNodes: number;
  uniqueIntegrations: number;
}

export interface WorkflowSearchParams {
  q?: string;
  trigger?: string;
  complexity?: string;
  category?: string;
  active?: boolean;
  source?: string;
  integrations?: string[];
  limit?: number;
  offset?: number;
}

export interface SourceQualityMetrics {
  completeness: number; // 0-100: How complete the data is
  accuracy: number; // 0-100: How accurate the data is
  freshness: number; // 0-100: How fresh the data is
  consistency: number; // 0-100: How consistent the data structure is
  overall: number; // 0-100: Overall quality score
}

export interface SourcePerformanceMetrics {
  responseTime: number; // Average response time in ms
  successRate: number; // 0-100: Success rate percentage
  errorRate: number; // 0-100: Error rate percentage
  uptime: number; // 0-100: Uptime percentage
  lastChecked: Date;
  totalRequests: number;
  failedRequests: number;
}

export class WorkflowIndexer {
  private baseUrl = 'https://api.github.com/repos/Zie619/n8n-workflows';
  private workflows: WorkflowIndex[] = [];
  private stats: WorkflowStats | null = null;
  private githubConfig = getGitHubConfig();
  private cacheVersion = 'v1.5.0';
  private lastFetchTime: number | null = null;
  private currentSourceKey: string | undefined = undefined;
  private sourceQualityCache = new Map<string, SourceQualityMetrics>();
  private sourcePerformanceCache = new Map<string, SourcePerformanceMetrics>();

  constructor() {
    this.initializeStats();
    // Load from server-side cache asynchronously
    this.loadFromServerCache();
  }

  /**
   * Normalize various display/source names into stable cache keys
   */
  private normalizeSourceKey(source?: string): string | undefined {
    if (!source) return undefined;
    const s = source.toLowerCase();
    if (s.includes('n8n.io') || s.includes('official')) return 'n8n.io';
    if (s.includes('github') || s.includes('community') || s.includes('n8n community')) return 'github';
    if (s.includes('ai-enhanced') || s.includes('free templates')) return 'ai-enhanced';
    return s.replace(/\s+/g, '-');
  }

  /**
   * Initialize workflow statistics based on repository documentation
   */
  private initializeStats(): void {
    this.stats = {
      total: 0,
      active: 0,
      inactive: 0,
      triggers: {
        Complex: 0,
        Webhook: 0,
        Manual: 0,
        Scheduled: 0
      },
      totalNodes: 0,
      uniqueIntegrations: 0
    };
  }

  /**
   * Generate mock workflows with realistic numbers
   */
  private generateMockWorkflows(): WorkflowIndex[] {
    const workflows: WorkflowIndex[] = [];
    const categories = ['messaging', 'ai_ml', 'database', 'email', 'cloud_storage', 'project_management', 'social_media', 'ecommerce', 'analytics', 'calendar_tasks'];
    const triggerTypes = ['Webhook', 'Scheduled', 'Manual', 'Complex'];
    const complexities = ['Low', 'Medium', 'High'];
    const integrations = ['Telegram', 'Discord', 'Slack', 'OpenAI', 'MySQL', 'PostgreSQL', 'Mailchimp', 'Google Drive', 'Dropbox', 'Trello', 'Asana', 'Jira', 'Twitter', 'LinkedIn', 'Facebook', 'Shopify', 'Google Analytics', 'Google Calendar', 'Todoist'];

    // Generate 2053 workflows to match the expected total
    for (let i = 1; i <= 2053; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const triggerType = triggerTypes[Math.floor(Math.random() * triggerTypes.length)];
      const complexity = complexities[Math.floor(Math.random() * complexities.length)];
      const nodeCount = Math.floor(Math.random() * 20) + 3; // 3-22 nodes
      const numIntegrations = Math.floor(Math.random() * 5) + 1; // 1-5 integrations
      const selectedIntegrations = integrations.sort(() => 0.5 - Math.random()).slice(0, numIntegrations);
      const active = Math.random() > 0.1; // 90% active rate

      workflows.push({
        id: i,
        filename: `${String(i).padStart(4, '0')}_${category}_${triggerType}_${complexity}.json`,
        name: `${category.charAt(0).toUpperCase() + category.slice(1)} ${triggerType} ${complexity}`,
        active,
        triggerType: triggerType as any,
        complexity: complexity as any,
        nodeCount,
        integrations: selectedIntegrations,
        description: `Automated ${category} workflow with ${triggerType.toLowerCase()} trigger and ${complexity.toLowerCase()} complexity`,
        category,
        tags: [category, triggerType.toLowerCase(), complexity.toLowerCase(), ...selectedIntegrations.slice(0, 2)],
        fileHash: Math.random().toString(36).substring(2, 8),
        analyzedAt: new Date().toISOString()
      });
    }

    return workflows;
  }

  /**
   * Update statistics based on loaded workflows
   */
  private updateStatsFromWorkflows(workflows: WorkflowIndex[]): void {
    const uniqueIntegrations = new Set<string>();
    let totalNodes = 0;
    let active = 0;
    let inactive = 0;
    const triggers = {
      Complex: 0,
      Webhook: 0,
      Manual: 0,
      Scheduled: 0
    };

    workflows.forEach(workflow => {
      // Count active/inactive
      if (workflow.active) {
        active++;
      } else {
        inactive++;
      }

      // Count triggers
      if (workflow.triggerType in triggers) {
        triggers[workflow.triggerType as keyof typeof triggers]++;
      }

      // Count nodes
      totalNodes += workflow.nodeCount;

      // Collect unique integrations
      workflow.integrations.forEach(integration => {
        uniqueIntegrations.add(integration);
      });
    });

    this.stats = {
      total: workflows.length,
      active,
      inactive,
      triggers,
      totalNodes,
      uniqueIntegrations: uniqueIntegrations.size
    };
  }

  /**
   * Get workflow statistics for specific source
   */
  async getStats(source?: string): Promise<WorkflowStats> {
    if (source) {
      try {
        const normalized = this.normalizeSourceKey(source);
        const { data, error } = await (supabase as any)
          .from('workflow_cache')
          .select('workflows')
          .eq('source', normalized as string)
          .eq('version', this.cacheVersion)
          .maybeSingle();

        if (error || !data) {
          console.log(`No cache found for source: ${normalized || source}`);
          return this.getEmptyStats();
        }

        const workflows = (data as any).workflows || [];
        return this.calculateStatsFromWorkflows(workflows);
      } catch (error) {
        console.error('Error getting stats for source:', error);
        return this.getEmptyStats();
      }
    }

    if (!this.stats) {
      this.initializeStats();
    }
    return this.stats!;
  }

  /**
   * Get empty stats
   */
  private getEmptyStats(): WorkflowStats {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      triggers: { Complex: 0, Webhook: 0, Manual: 0, Scheduled: 0 },
      totalNodes: 0,
      uniqueIntegrations: 0
    } as WorkflowStats;
  }

  /**
   * Calculate stats from workflows array
   */
  private calculateStatsFromWorkflows(workflows: WorkflowIndex[]): WorkflowStats {
    const total = workflows.length;
    const active = workflows.filter(w => w.active).length;
    const inactive = total - active;
    const totalNodes = workflows.reduce((sum, w) => sum + (w.nodeCount || 0), 0);
    const uniqueIntegrations = new Set<string>();
    const triggers = { Complex: 0, Webhook: 0, Manual: 0, Scheduled: 0 } as any;
    workflows.forEach(workflow => {
      (workflow.integrations || []).forEach((integration: string) => {
        uniqueIntegrations.add(integration);
      });
      if (workflow.triggerType && triggers[workflow.triggerType] !== undefined) triggers[workflow.triggerType]++;
    });
    return { total, active, inactive, triggers, totalNodes, uniqueIntegrations: uniqueIntegrations.size } as WorkflowStats;
  }

  /**
   * Get last fetch time
   */
  getLastFetchTime(): Date | null {
    return this.lastFetchTime ? new Date(this.lastFetchTime) : null;
  }

  /**
   * Manually trigger workflow fetch from GitHub
   */
  async forceRefreshWorkflows(source?: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      console.log(`Manually triggering workflow refresh for source: ${source || 'all'}...`);
      this.workflows = [];
      this.lastFetchTime = null;

      const normalized = this.normalizeSourceKey(source);
      if (!normalized || normalized === 'all') {
        // Refresh all sources and save aggregated 'all'
        const [gh, n8n, ai] = await Promise.all([
          this.loadRealWorkflows({ source: 'github' }),
          this.loadRealWorkflows({ source: 'n8n.io' }),
          this.loadRealWorkflows({ source: 'ai-enhanced' })
        ]);
        const merged: WorkflowIndex[] = [];
        const seen = new Set<string>();
        [gh, n8n, ai].forEach(arr => {
          (arr || []).forEach(w => {
            const key = String(w.id || w.filename || w.name);
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(w);
          });
        });
        if (merged.length > 0) {
          this.updateStatsFromWorkflows(merged);
          await this.saveToServerCache(merged, 'all');
          console.log(`Successfully refreshed ${merged.length} workflows for source: all`);
          return { success: true, count: merged.length };
        }
        return { success: false, count: 0, error: 'No workflows loaded' };
      }

      // Single-source refresh
      const workflows = await this.loadRealWorkflows({ source });
      if (workflows.length > 0) {
        this.updateStatsFromWorkflows(workflows);
        await this.saveToServerCache(workflows, source);
        console.log(`Successfully refreshed ${workflows.length} workflows for source: ${source || 'all'}`);
        return { success: true, count: workflows.length };
      } else {
        return { success: false, count: 0, error: 'No workflows loaded' };
      }
    } catch (error) {
      console.error('Error during manual refresh:', error);
      return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get cache status for specific source
   */
  async getCacheStatus(source?: string): Promise<{ hasCache: boolean; lastFetch: Date | null; workflowCount: number }> {
    try {
      if (!source) {
        return {
          hasCache: this.workflows.length > 0,
          lastFetch: this.getLastFetchTime(),
          workflowCount: this.workflows.length
        };
      }

      const normalized = this.normalizeSourceKey(source);
      // Support sharded caches like "n8n.io#1"
      const { data, error } = await (supabase as any)
        .from('workflow_cache')
        .select('source, workflows, last_fetch_time, updated_at')
        .like('source', `${normalized}%`)
        .eq('version', this.cacheVersion);

      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        console.log(`No cache found for source: ${normalized || source}`);
        return { hasCache: false, lastFetch: null, workflowCount: 0 };
      }

      const rows: any[] = Array.isArray(data) ? data : [data];
      const totalCount = rows.reduce((sum, r) => sum + ((r?.workflows || []).length || 0), 0);
      const lastFetchTs = rows.reduce((ts: number | null, r: any) => {
        const t = r?.last_fetch_time ? new Date(r.last_fetch_time).getTime() : null;
        if (!t) return ts; return ts ? Math.max(ts, t) : t;
      }, null);
      const lastFetch = lastFetchTs ? new Date(lastFetchTs) : null;

      console.log(`Cache status for ${normalized || source}: ${totalCount} workflows, last fetch: ${lastFetch}`);

      return { hasCache: totalCount > 0, lastFetch, workflowCount: totalCount };
    } catch (error) {
      console.error('Error getting cache status:', error);
      return { hasCache: false, lastFetch: null, workflowCount: 0 };
    }
  }

  /**
   * Search workflows with filters
   */
  async searchWorkflows(params: WorkflowSearchParams = {}): Promise<{
    workflows: WorkflowIndex[];
    total: number;
    hasMore: boolean;
  }> {
    const requestedSource = this.normalizeSourceKey(params.source) || this.currentSourceKey || 'all';

    if (params.source) {
      const normalized = this.normalizeSourceKey(params.source) || 'all';
      if (this.currentSourceKey !== normalized) {
        await this.loadFromServerCache(normalized);
      }
    }

    if (this.workflows.length === 0) {
      console.log('No workflows in memory, loading from server cache...');
      await this.loadFromServerCache(params.source);
      // If 'all' still empty, try union from per-source caches
      const normalized = this.normalizeSourceKey(params.source) || 'all';
      if ((normalized === 'all') && this.workflows.length === 0) {
        await this.loadAllFromServerCacheUnion();
      }
    }

    if (this.workflows.length > 0) {
      console.log(`Using ${this.workflows.length} cached workflows`);
      this.updateStatsFromWorkflows(this.workflows);
      const filteredWorkflows = this.filterWorkflows(this.workflows, params);

      const offset = params.offset || 0;
      const limit = params.limit || 20;
      const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit);

      return { workflows: paginatedWorkflows, total: filteredWorkflows.length, hasMore: offset + limit < filteredWorkflows.length };
    }

    try {
      console.log('Attempting to load real workflows from GitHub API...');
      const realWorkflows = await this.loadRealWorkflows(params);
      if (realWorkflows.length > 0) {
        console.log(`Successfully loaded ${realWorkflows.length} real workflows from GitHub API`);
        this.updateStatsFromWorkflows(realWorkflows);

        let filteredWorkflows = realWorkflows;

    if (params.q) {
      const query = params.q.toLowerCase();
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        workflow.name.toLowerCase().includes(query) ||
        workflow.description.toLowerCase().includes(query) ||
            workflow.integrations.some(integration => integration.toLowerCase().includes(query))
      );
    }

        if (params.trigger && params.trigger !== 'all') {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
            workflow.triggerType.toLowerCase() === params.trigger!.toLowerCase()
      );
    }

        if (params.complexity && params.complexity !== 'all') {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
            workflow.complexity.toLowerCase() === params.complexity.toLowerCase()
      );
    }

        if (params.category && params.category !== 'all') {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
            workflow.category.toLowerCase() === params.category.toLowerCase()
      );
    }

    if (params.active !== undefined) {
          filteredWorkflows = filteredWorkflows.filter(workflow => workflow.active === params.active);
        }

        if (params.source) {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
            workflow.filename.includes(params.source!.toLowerCase()) ||
            workflow.name.toLowerCase().includes(params.source!.toLowerCase())
          );
        }

        const offset = params.offset || 0;
        const limit = params.limit || 20;
        const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit);

        return { workflows: paginatedWorkflows, total: filteredWorkflows.length, hasMore: offset + limit < filteredWorkflows.length };
      } else {
        console.log('No real workflows loaded, falling back to mock data');
      }
    } catch (error) {
      console.error('Failed to load real workflows from GitHub API:', error);
      console.log('Falling back to mock workflow data');
    }

    const mockWorkflows: WorkflowIndex[] = this.generateMockWorkflows();
    let filteredWorkflows = mockWorkflows;
    if (params.q) {
      const query = params.q.toLowerCase();
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        workflow.name.toLowerCase().includes(query) ||
        workflow.description.toLowerCase().includes(query) ||
        workflow.integrations.some(integration => integration.toLowerCase().includes(query)) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    if (params.trigger) {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.triggerType === params.trigger);
    }
    if (params.complexity) {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.complexity === params.complexity);
    }
    if (params.category) {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.category === params.category);
    }
    if (params.active !== undefined) {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.active === params.active);
    }
    if (params.source) {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        workflow.filename.includes(params.source!.toLowerCase()) ||
        workflow.name.toLowerCase().includes(params.source!.toLowerCase())
      );
    }

    const offset = params.offset || 0;
    const limit = params.limit || 20;
    const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit);
    this.updateStatsFromWorkflows(filteredWorkflows);
    return { workflows: paginatedWorkflows, total: filteredWorkflows.length, hasMore: offset + limit < filteredWorkflows.length };
  }

  /**
   * Get workflow by filename
   */
  async getWorkflow(filename: string): Promise<WorkflowIndex | null> {
    const searchResult = await this.searchWorkflows({ limit: 1 });
    return searchResult.workflows.find(w => w.filename === filename) || null;
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    return [
      'messaging',
      'ai_ml',
      'database',
      'email',
      'cloud_storage',
      'project_management',
      'social_media',
      'ecommerce',
      'analytics',
      'calendar_tasks',
      'forms',
      'development'
    ];
  }

  /**
   * Get category display names
   */
  getCategoryDisplayNames(): Record<string, string> {
    return {
      'messaging': 'Communication & Messaging',
      'ai_ml': 'AI & Machine Learning',
      'database': 'Database & Data Processing',
      'email': 'Email & Communication',
      'cloud_storage': 'Cloud Storage & File Management',
      'project_management': 'Project Management',
      'social_media': 'Social Media Management',
      'ecommerce': 'E-commerce & Retail',
      'analytics': 'Analytics & Reporting',
      'calendar_tasks': 'Calendar & Task Management',
      'forms': 'Forms & Data Collection',
      'development': 'Development & APIs'
    };
  }

  /**
   * Get popular integrations
   */
  getPopularIntegrations(): string[] {
    return [
      'Telegram', 'Discord', 'Slack', 'WhatsApp',
      'Google Drive', 'Google Sheets', 'Dropbox',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Airtable',
      'OpenAI', 'Anthropic', 'Hugging Face',
      'HTTP Request', 'Webhook', 'GraphQL'
    ];
  }

  /**
   * Normalize any incoming workflow-like object into our WorkflowIndex shape
   */
  private normalizeWorkflowShape(input: any): WorkflowIndex {
    const id = Number(input?.id) || Math.floor(Math.random() * 10_000_000);
    const filenameRaw: string = (input?.filename || input?.name || `workflow-${id}`).toString();
    const filename = filenameRaw.endsWith('.json') ? filenameRaw : `${filenameRaw}.json`;
    const name: string = (input?.name || this.generateWorkflowName(filename)).toString();
    const active: boolean = typeof input?.active === 'boolean' ? input.active : true;
    // Author fields
    const authorName: string | undefined = input?.authorName || input?.author || input?.user?.name || input?.user?.username;
    const authorUsername: string | undefined = input?.authorUsername || input?.user?.username;
    const toAbsoluteAvatar = (url?: string): string | undefined => {
      if (!url) return undefined;
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      if (url.startsWith('//')) return `https:${url}`;
      if (url.startsWith('/')) return `https://api.n8n.io${url}`;
      return url;
    };
    const authorAvatar: string | undefined = toAbsoluteAvatar(input?.authorAvatar || input?.user?.avatar);
    const authorVerified: boolean | undefined = typeof input?.authorVerified === 'boolean' ? input?.authorVerified : (input?.user?.verified === true);

    // Trigger type
    let triggerType: 'Complex' | 'Webhook' | 'Manual' | 'Scheduled';
    const triggerCandidate = (input?.triggerType || '').toString();
    if (['Complex', 'Webhook', 'Manual', 'Scheduled'].includes(triggerCandidate)) {
      triggerType = triggerCandidate as any;
    } else {
      triggerType = this.determineTriggerType(`${filename} ${name}`);
    }

    // Complexity
    let complexity: 'Low' | 'Medium' | 'High';
    const complexityCandidate = (input?.complexity || '').toString();
    if (['Low', 'Medium', 'High'].includes(complexityCandidate)) {
      complexity = complexityCandidate as any;
        } else {
      complexity = this.determineComplexity(filename);
    }

    // Node count
    const nodeCount: number = Number(input?.nodeCount) || 0;

    // Integrations
    let integrations: string[] = Array.isArray(input?.integrations) ? input.integrations.map((x: any) => String(x)) : [];
    if (integrations.length === 0) {
      integrations = this.extractIntegrations(filename);
    }

    // Description
    const description: string = (input?.description || this.generateDescription(filename)).toString();

    // Category - try input, otherwise infer from integrations or fallback
    let category: string = (input?.category || '').toString();
    if (!category) {
      const firstIntegration = integrations[0] || '';
      category = this.mapCategory(firstIntegration || 'development');
    }

    // Tags
    let tags: string[] = Array.isArray(input?.tags) ? input.tags.map((x: any) => String(x)) : [];
    if (tags.length === 0) {
      tags = this.generateTags(filename);
    }

    const fileHash: string = (input?.fileHash || Math.random().toString(36).slice(2, 10)).toString();
    const analyzedAt: string = (input?.analyzedAt || new Date().toISOString()).toString();

    return {
      id,
      filename,
      name,
      active,
      triggerType,
      complexity,
      nodeCount,
      integrations,
      description,
      category,
      tags,
      fileHash,
      analyzedAt,
      authorName,
      authorUsername,
      authorAvatar,
      authorVerified,
    };
  }

  /**
   * Load real workflows from GitHub API via Supabase Edge Function
   */
  private async loadRealWorkflows(params: WorkflowSearchParams): Promise<WorkflowIndex[]> {
    try {
      console.log('Loading real workflows from GitHub API via Supabase Edge Function...');
      const normalized = this.normalizeSourceKey(params.source);

      if (normalized === 'n8n.io') {
        // Client-side fetch for n8n.io: try bulk once, then fallback to light pagination
        const startTs = Date.now();
        console.log('[n8n.io] Starting client fetch (bulk, then fallback)');

        // 1) Bulk attempt
        try {
          const bulkUrl = `https://api.n8n.io/api/templates/workflows?page=1&perPage=6000`;
          console.log('[n8n.io] Bulk fetch ...');
          const rb = await fetch(bulkUrl, { headers: { 'Accept': 'application/json' } });
          if (rb.ok) {
            const jb = await rb.json();
            const items = Array.isArray(jb.workflows) ? jb.workflows : [];
            console.log(`[n8n.io] Bulk items: ${items.length}`);
            if (items.length > 0) {
              const aggregated = items.map((w: any, idx: number) => {
                const id = Number(w.id) || (idx + 1);
                const name = (w.name || `n8n-workflow-${id}`).toString();
                const description = (w.description || `Official n8n workflow: ${name}`).toString();
                const nodes = Array.isArray(w.nodes) ? w.nodes : [];
                const nodeCount = nodes.length || 0;
                const integrationsSet = new Set<string>();
                nodes.forEach((n: any) => {
                  const raw = (n?.name || n?.id || '').toString();
                  if (raw) integrationsSet.add(raw.toString());
                });
                const integrations = Array.from(integrationsSet).slice(0, 12);
                const complexity = nodeCount > 12 ? 'High' : nodeCount > 6 ? 'Medium' : 'Low';
                const triggerType = this.determineTriggerType(name + ' ' + description);
                const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const filename = `n8n-${id}-${safeName}.json`;
                return this.normalizeWorkflowShape({
                  id,
                  filename,
                  name,
                  active: true,
                  triggerType,
                  complexity,
                  nodeCount,
                  integrations,
                  description,
                  category: this.mapCategory('communication'),
                  tags: this.generateTags(filename),
                  fileHash: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  analyzedAt: new Date().toISOString(),
                  // author from API
                  authorName: w?.user?.name || w?.user?.username,
                  authorUsername: w?.user?.username,
                  authorAvatar: w?.user?.avatar,
                  authorVerified: w?.user?.verified === true,
                });
              });
              const ms = Date.now() - startTs;
              console.log(`[n8n.io] Bulk completed. Total: ${aggregated.length}. Saving to cache... (${ms} ms)`);
              await this.saveToServerCache(aggregated, normalized);
              console.log('[n8n.io] Saved to cache for source n8n.io');
              return aggregated;
            }
          } else {
            console.warn(`[n8n.io] Bulk fetch failed with status ${rb.status}`);
          }
        } catch (e) {
          console.warn('[n8n.io] Bulk fetch error', e);
        }

        // 2) Fallback light pagination (defensive)
        const perPage = 200;
        const maxPages = 30; // safety cap
        const aggregated: WorkflowIndex[] = [];
        console.log(`[n8n.io] Fallback pagination: perPage=${perPage}, maxPages=${maxPages}`);
        try {
          for (let page = 1; page <= maxPages; page++) {
            console.log(`[n8n.io] Fetching page ${page} ...`);
            const apiUrl = `https://api.n8n.io/api/templates/workflows?page=${page}&perPage=${perPage}`;
            const r = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });
            if (!r.ok) {
              console.warn(`[n8n.io] Page ${page} failed with status ${r.status}`);
              break;
            }
            const j = await r.json();
            const items = Array.isArray(j.workflows) ? j.workflows : [];
            console.log(`[n8n.io] Page ${page} items: ${items.length}`);
            if (items.length === 0) break;

            const chunk: WorkflowIndex[] = items.map((w: any, idx: number) => {
              const id = Number(w.id) || ((page - 1) * perPage + idx + 1);
              const name = (w.name || `n8n-workflow-${id}`).toString();
              const description = (w.description || `Official n8n workflow: ${name}`).toString();
              const nodes = Array.isArray(w.nodes) ? w.nodes : [];
              const nodeCount = nodes.length || 0;
              const integrationsSet = new Set<string>();
              nodes.forEach((n: any) => {
                const raw = (n?.name || n?.id || '').toString();
                if (raw) integrationsSet.add(raw.toString());
              });
              const integrations = Array.from(integrationsSet).slice(0, 12);
              const complexity = nodeCount > 12 ? 'High' : nodeCount > 6 ? 'Medium' : 'Low';
              const triggerType = this.determineTriggerType(name + ' ' + description);
              const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
              const filename = `n8n-${id}-${safeName}.json`;
              return this.normalizeWorkflowShape({
                id,
                filename,
                name,
                active: true,
                triggerType,
                complexity,
                nodeCount,
                integrations,
                description,
                category: this.mapCategory('communication'),
                tags: this.generateTags(filename),
                fileHash: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                analyzedAt: new Date().toISOString(),
                authorName: w?.user?.name || w?.user?.username,
                authorUsername: w?.user?.username,
                authorAvatar: w?.user?.avatar,
                authorVerified: w?.user?.verified === true,
              });
            });

            aggregated.push(...chunk);
            console.log(`[n8n.io] Aggregated: ${aggregated.length}`);
            if (items.length < perPage || aggregated.length >= 7000) {
              console.log(`[n8n.io] Stopping at page ${page}.`);
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (e) {
          console.warn('Client-side n8n.io pagination failed', e);
        }

        if (aggregated.length > 0) {
          const ms = Date.now() - startTs;
          console.log(`[n8n.io] Completed fallback. Total: ${aggregated.length}. Saving to cache... (${ms} ms)`);
          await this.saveToServerCache(aggregated, normalized);
          console.log('[n8n.io] Saved to cache for source n8n.io');
          return aggregated;
        }
        console.log('[n8n.io] No workflows loaded.');
        return [];
      }

      // Default single-call path for other sources
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase configuration missing');
        return [];
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-github-workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ source: normalized })
      });
      
      if (!response.ok) {
        throw new Error(`Edge Function error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`Successfully loaded ${result.workflows.length} workflows from GitHub API via Edge Function`);
        
        // Save to cache for future use
        const normalizedWorkflows = (Array.isArray(result.workflows) ? result.workflows : []).map((w: any) => this.normalizeWorkflowShape(w));
        await this.saveToServerCache(normalizedWorkflows, normalized);
        return normalizedWorkflows;
      } else {
        throw new Error(result.error || 'Unknown error from Edge Function');
      }
    } catch (error) {
      console.error('Failed to load workflows from GitHub API via Edge Function:', error);
      console.log('Falling back to mock workflow data');
      return [];
    }
  }

  /**
   * Generate workflow name from filename
   */
  private generateWorkflowName(filename: string): string {
    return filename
      .replace('.json', '')
      .replace(/_/g, ' ')
      .replace(/\d+/g, '')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Determine trigger type from filename
   */
  private determineTriggerType(filename: string): 'Complex' | 'Webhook' | 'Manual' | 'Scheduled' {
    const lower = filename.toLowerCase();
    if (lower.includes('webhook')) return 'Webhook';
    if (lower.includes('scheduled') || lower.includes('cron')) return 'Scheduled';
    if (lower.includes('manual')) return 'Manual';
    return 'Complex';
  }

  /**
   * Determine complexity from filename
   */
  private determineComplexity(filename: string): 'Low' | 'Medium' | 'High' {
    const lower = filename.toLowerCase();
    if (lower.includes('simple') || lower.includes('basic')) return 'Low';
    if (lower.includes('complex') || lower.includes('advanced')) return 'High';
    return 'Medium';
  }

  /**
   * Extract integrations from filename
   */
  private extractIntegrations(filename: string): string[] {
    const integrations: string[] = [];
    const lower = filename.toLowerCase();
    
    const integrationMap: Record<string, string> = {
      'telegram': 'Telegram',
      'discord': 'Discord',
      'slack': 'Slack',
      'openai': 'OpenAI',
      'google': 'Google',
      'sheets': 'Google Sheets',
      'drive': 'Google Drive',
      'gmail': 'Gmail',
      'github': 'GitHub',
      'webhook': 'Webhook',
      'http': 'HTTP Request',
      'schedule': 'Schedule Trigger',
      'manual': 'Manual Trigger'
    };

    for (const [key, value] of Object.entries(integrationMap)) {
      if (lower.includes(key)) {
        integrations.push(value);
      }
    }

    return integrations.length > 0 ? integrations : ['HTTP Request'];
  }

  /**
   * Generate description from filename
   */
  private generateDescription(filename: string): string {
    const name = this.generateWorkflowName(filename);
    const integrations = this.extractIntegrations(filename);
    return `${name} workflow using ${integrations.join(', ')} for automation and data processing`;
  }

  /**
   * Map category name to standard category
   */
  private mapCategory(categoryName: string): string {
    const categoryMap: Record<string, string> = {
      'messaging': 'messaging',
      'communication': 'messaging',
      'ai': 'ai_ml',
      'automation': 'development',
      'data': 'database',
      'storage': 'cloud_storage',
      'social': 'social_media',
      'marketing': 'social_media',
      'crm': 'social_media',
      'analytics': 'analytics',
      'forms': 'forms',
      'calendar': 'calendar_tasks',
      'project': 'project_management'
    };

    const lower = categoryName.toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lower.includes(key)) {
        return value;
      }
    }

    return 'development';
  }

  /**
   * Generate tags from filename
   */
  private generateTags(filename: string): string[] {
    const tags: string[] = [];
    const lower = filename.toLowerCase();
    
    const tagMap = [
      'automation', 'webhook', 'scheduled', 'manual', 'ai', 'data', 'notification',
      'integration', 'api', 'workflow', 'process', 'trigger', 'export', 'import'
    ];

    for (const tag of tagMap) {
      if (lower.includes(tag)) {
        tags.push(tag);
      }
    }

    return tags.length > 0 ? tags : ['automation'];
  }

  /**
   * Get workflow download URL
   */
  getWorkflowDownloadUrl(filename: string): string {
    return `${this.baseUrl}/contents/workflows/${filename}`;
  }

  /**
   * Get workflow diagram URL (Mermaid)
   */
  getWorkflowDiagramUrl(filename: string): string {
    // In a real implementation, this would generate a Mermaid diagram
    return `${this.baseUrl}/contents/workflows/${filename}`;
  }

  /**
   * Load workflows from server-side cache (Supabase)
   */
  private async loadFromServerCache(source?: string): Promise<void> {
    try {
      const normalized = this.normalizeSourceKey(source);

      // Build union for 'all' from per-source caches
      if (!normalized || normalized === 'all') {
        // Fetch rows, including shards via LIKE
        const sourcesAll = ['all', 'github', 'n8n.io', 'ai-enhanced'];
        const fetched: any[] = [];
        for (const s of sourcesAll) {
          const { data, error } = await (supabase as any)
            .from('workflow_cache')
            .select('source, workflows, last_fetch_time')
            .eq('version', this.cacheVersion)
            .like('source', `${s}%`);
          if (!error && data) {
            if (Array.isArray(data)) fetched.push(...data); else fetched.push(data);
          }
        }

        if (fetched.length === 0) {
          console.log(`No cached workflows found for union: ${(normalized || 'all')}, will fetch fresh data`);
          return;
        }

        const allRow = fetched.find((r: any) => r.source === 'all');
        const perSourceRows = fetched.filter((r: any) => r.source !== 'all');
 
        const merged: WorkflowIndex[] = [];
        const seen = new Set<string>();
        let newestTs: number | null = null;
        perSourceRows.forEach(r => {
          const list: any[] = r?.workflows || [];
          const ts = r?.last_fetch_time ? new Date(r.last_fetch_time).getTime() : null;
          if (ts && (!newestTs || ts > newestTs)) newestTs = ts;
          list.forEach(w => {
            const key = String(w?.id || w?.filename || w?.name || Math.random());
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(this.normalizeWorkflowShape(w));
          });
        });
 
        // Decide which set to use
        let use: WorkflowIndex[] = merged;
        if (merged.length === 0 && allRow) {
          use = (allRow.workflows || []).map((w: any) => this.normalizeWorkflowShape(w));
          newestTs = allRow?.last_fetch_time ? new Date(allRow.last_fetch_time).getTime() : null;
        }
 
        if (use.length > 0) {
          this.workflows = use;
          this.lastFetchTime = newestTs || (allRow?.last_fetch_time ? new Date(allRow.last_fetch_time).getTime() : null);
          this.currentSourceKey = 'all';
          this.updateStatsFromWorkflows(this.workflows);
          console.log(`Loaded ${this.workflows.length} workflows from server cache for source: all (union)`);
 
          // If union larger than stored 'all', update 'all'
          const allCount = Array.isArray(allRow?.workflows) ? allRow.workflows.length : 0;
          if (merged.length > allCount) {
            await this.saveToServerCache(this.workflows, 'all');
          }
        }
        return;
      }

      // Default: load a specific source cache using Edge Function (handles large data)
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('get-workflow-cache', {
          body: {
            source: normalized,
            version: this.cacheVersion,
            pageSize: 10000 // Large page size to get all workflows
          }
        });

        if (edgeError || !edgeData || !edgeData.data) {
          console.log(`No cached workflows found for source: ${normalized}, will fetch fresh data`);
          return;
        }

        const allWorkflows: any[] = edgeData.data || [];
        let newestTs: number | null = null;
        
        // Find the newest timestamp from the sources metadata
        if (edgeData.sources && Array.isArray(edgeData.sources)) {
          edgeData.sources.forEach((source: any) => {
            const ts = source.last_fetch_time ? new Date(source.last_fetch_time).getTime() : null;
            if (ts && (!newestTs || ts > newestTs)) newestTs = ts;
          });
        }

        this.workflows = allWorkflows;
        this.lastFetchTime = newestTs || null;
        this.currentSourceKey = normalized;
        this.updateStatsFromWorkflows(this.workflows);
        console.log(`Loaded ${this.workflows.length} workflows from server cache for source: ${normalized}`);
      } catch (edgeError) {
        console.warn('Failed to load server cache via Edge Function, falling back to direct API:', edgeError);
        
        // Fallback to direct API call (may fail with large data)
        const { data, error } = await (supabase as any)
          .from('workflow_cache')
          .select('source, workflows, last_fetch_time')
          .like('source', `${normalized}%`)
          .eq('version', this.cacheVersion);

        if (error || !data) {
          console.log(`No cached workflows found for source: ${normalized}, will fetch fresh data`);
          return;
        }

        const rows: any[] = Array.isArray(data) ? data : [data];
        const allWorkflows: any[] = [];
        let newestTs: number | null = null;
        rows.forEach((r: any) => {
          const list = r?.workflows || [];
          const ts = r?.last_fetch_time ? new Date(r.last_fetch_time).getTime() : null;
          if (ts && (!newestTs || ts > newestTs)) newestTs = ts;
          list.forEach((w: any) => allWorkflows.push(w));
        });
        this.workflows = allWorkflows;
        this.lastFetchTime = newestTs || null;
        this.currentSourceKey = normalized;
        this.updateStatsFromWorkflows(this.workflows);
        console.log(`Loaded ${this.workflows.length} workflows from server cache for source: ${normalized}`);
      }
    } catch (error) {
      console.warn('Failed to load server cache:', error);
    }
  }

  /**
   * Save workflows to server-side cache (Supabase)
   */
  private async saveToServerCache(workflows: WorkflowIndex[], source?: string): Promise<void> {
    try {
      const sourceKey = this.normalizeSourceKey(source) || 'all';
      console.log(`Saving ${workflows.length} workflows to cache for source: ${sourceKey}`);
      const { error } = await (supabase as any)
        .from('workflow_cache')
        .upsert({
          version: this.cacheVersion,
          workflows: workflows,
          last_fetch_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source: sourceKey
        }, { onConflict: 'version,source' });

      if (error) {
        console.error('Error saving to server cache:', error);
      } else {
        console.log(`Successfully saved ${workflows.length} workflows to server cache for source: ${sourceKey}`);
      }
    } catch (error) {
      console.error('Error saving to server cache:', error);
    }
  }

  /**
   * Filter workflows based on search parameters
   */
  private filterWorkflows(workflows: WorkflowIndex[], params: WorkflowSearchParams): WorkflowIndex[] {
    let filtered = [...workflows];

    const normalize = (s: string) => s.toLowerCase().trim();
    const integrationSynonyms: Record<string, string[]> = {
      'http request': ['http', 'http-request', 'request', 'api', 'fetch'],
      'webhook': ['webhook', 'hook', 'callback'],
      'gmail': ['gmail', 'google mail', 'email', 'mail'],
      'google sheets': ['google sheets', 'sheets', 'spreadsheet'],
      'google drive': ['google drive', 'drive'],
      'openai': ['openai', 'gpt', 'chatgpt', 'ai'],
      'slack': ['slack'],
    };
    const expandIntegrations = (names: string[]): string[] => {
      const out = new Set<string>();
      names.map(normalize).forEach(n => {
        out.add(n);
        Object.entries(integrationSynonyms).forEach(([canon, syns]) => {
          if (n === canon || syns.includes(n)) {
            out.add(canon);
            syns.forEach(s => out.add(s));
          }
        });
      });
      return Array.from(out);
    };

    if (params.q) {
      const query = normalize(params.q);
      filtered = filtered.filter(workflow =>
        workflow.name.toLowerCase().includes(query) ||
        workflow.description.toLowerCase().includes(query) ||
        workflow.integrations.some(integration => 
          integration.toLowerCase().includes(query)
        ) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (params.integrations && params.integrations.length > 0) {
      const wanted = expandIntegrations(params.integrations);
      filtered = filtered.filter(w => {
        const have = expandIntegrations(w.integrations || []);
        // require at least one overlap
        return wanted.some(x => have.includes(x));
      });
    }

    if (params.trigger && params.trigger !== 'all') {
      filtered = filtered.filter(workflow =>
        workflow.triggerType.toLowerCase() === String(params.trigger).toLowerCase()
      );
    }

    if (params.complexity) {
      filtered = filtered.filter(workflow =>
        workflow.complexity.toLowerCase() === params.complexity.toLowerCase()
      );
    }

    if (params.category) {
      filtered = filtered.filter(workflow =>
        workflow.category.toLowerCase() === params.category.toLowerCase()
      );
    }

    if (params.active !== undefined) {
      filtered = filtered.filter(workflow =>
        workflow.active === params.active
      );
    }

    if (params.source) {
      const sourceLower = params.source.toLowerCase();
      const normalized = this.normalizeSourceKey(params.source);

      if (!normalized || this.currentSourceKey !== normalized) {
        filtered = filtered.filter(workflow => {
          if (sourceLower.includes('n8n.io') || sourceLower.includes('official')) {
            return workflow.filename.startsWith('n8n-');
          }
          if (sourceLower.includes('github') || sourceLower.includes('community')) {
            return !workflow.filename.startsWith('n8n-');
          }
          if (sourceLower.includes('ai-enhanced') || sourceLower.includes('free templates')) {
            return workflow.category === 'ai_ml' || 
                   workflow.integrations.some(integration => 
                     integration.toLowerCase().includes('openai') ||
                     integration.toLowerCase().includes('ai') ||
                     integration.toLowerCase().includes('llm')
                   );
          }
          return workflow.filename.includes(sourceLower) ||
                 workflow.name.toLowerCase().includes(sourceLower);
        });
      }
    }

    return filtered;
  }

  /**
   * Load union of cached sources and set as current 'all'
   */
  private async loadAllFromServerCacheUnion(): Promise<void> {
    try {
      const sources = ['github', 'n8n.io', 'ai-enhanced'];
      const rows: any[] = [];
      for (const s of sources) {
        const { data, error } = await (supabase as any)
          .from('workflow_cache')
          .select('source, workflows, last_fetch_time')
          .eq('version', this.cacheVersion)
          .eq('source', s)
          .maybeSingle();
        if (!error && data) rows.push(data);
      }
      if (rows.length === 0) {
        console.log('No per-source caches available for union');
        return;
      }
      const merged: WorkflowIndex[] = [];
      const seen = new Set<string>();
      for (const row of rows) {
        const list: any[] = (row as any).workflows || [];
        for (const w of list) {
          const key = String(w?.id || w?.filename || w?.name || Math.random());
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(this.normalizeWorkflowShape(w));
        }
      }
      if (merged.length > 0) {
        this.workflows = merged;
        this.currentSourceKey = 'all';
        this.updateStatsFromWorkflows(this.workflows);
        console.log(`Union loaded ${merged.length} workflows from per-source caches into 'all'`);
      }
    } catch (e) {
      console.warn('Failed to union per-source caches for all', e);
    }
  }
}

// Export singleton instance
export const workflowIndexer = new WorkflowIndexer();
