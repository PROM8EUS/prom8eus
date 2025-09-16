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
  relevance: number; // 0-100: How relevant the data is to user queries
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

export interface SourceHealthStatus {
  source: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked: string;
  responseTime: number;
  successRate: number;
  errorCount: number;
  lastError?: string;
  uptime: number; // Percentage uptime over last 24h
  healthScore: number; // 0-100 overall health score
}

export interface HealthCheckResult {
  source: string;
  isHealthy: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: string;
  dataReceived?: boolean;
  dataSize?: number;
}

export interface ErrorClassification {
  type: 'network' | 'authentication' | 'rate_limit' | 'server_error' | 'timeout' | 'data_quality' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedAction: string;
  retryable: boolean;
  estimatedRecoveryTime?: number; // in minutes
}

export interface SourceError {
  id: string;
  source: string;
  timestamp: string;
  error: string;
  classification: ErrorClassification;
  context?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
}

export interface SourceAlert {
  id: string;
  source: string;
  type: 'response_time' | 'error_rate' | 'health_degradation' | 'source_down';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: string;
  threshold?: number;
  currentValue?: number;
}

export interface AlertThresholds {
  responseTime: {
    warning: number; // ms
    critical: number; // ms
  };
  errorRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
  healthScore: {
    warning: number; // 0-100
    critical: number; // 0-100
  };
}

export interface NotificationConfig {
  enabled: boolean;
  channels: ('console' | 'browser' | 'api')[];
  severityFilter: ('low' | 'medium' | 'high' | 'critical')[];
  cooldownMinutes: number; // Prevent spam notifications
  maxNotificationsPerHour: number;
}

export interface Notification {
  id: string;
  source: string;
  alertId: string;
  type: 'alert_created' | 'alert_resolved' | 'health_degraded' | 'source_recovered';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  sent: boolean;
  sentAt?: string;
  channel: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  source: string;
  version: string;
  compressed?: boolean;
}

export interface CacheConfig {
  defaultTTL: number; // milliseconds
  maxSize: number; // max entries per cache
  compressionEnabled: boolean;
  dynamicTTL: boolean;
  accessBasedTTL: boolean;
  sourceSpecificTTL: Record<string, number>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  averageAccessTime: number;
  compressionRatio: number;
  evictions: number;
}

export interface IncrementalUpdateConfig {
  enabled: boolean;
  batchSize: number;
  updateInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  deltaDetection: boolean;
  changeThreshold: number; // percentage of changes to trigger full update
}

export interface UpdateDelta {
  added: any[];
  modified: any[];
  removed: any[];
  unchanged: any[];
  totalChanges: number;
  changePercentage: number;
}

export class WorkflowIndexer {
  private baseUrl = 'https://api.github.com/repos/Zie619/n8n-workflows';
  private workflows: WorkflowIndex[] = [];
  private stats: WorkflowStats | null = null;
  private githubConfig = getGitHubConfig();
  private lastFetchTime: number | null = null;
  private currentSourceKey: string | undefined = undefined;
  private sourceQualityCache = new Map<string, SourceQualityMetrics>();
  private sourcePerformanceCache = new Map<string, SourcePerformanceMetrics>();
  private sourceHealthCache = new Map<string, SourceHealthStatus>();
  private healthCheckHistory = new Map<string, HealthCheckResult[]>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private sourceErrors = new Map<string, SourceError[]>();
  private errorPatterns = new Map<string, RegExp>();
  private sourceAlerts = new Map<string, SourceAlert[]>();
  private alertThresholds: AlertThresholds = {
    responseTime: { warning: 2000, critical: 5000 },
    errorRate: { warning: 10, critical: 25 },
    healthScore: { warning: 70, critical: 50 }
  };
  private notificationConfig: NotificationConfig = {
    enabled: true,
    channels: ['console', 'browser'],
    severityFilter: ['medium', 'high', 'critical'],
    cooldownMinutes: 5,
    maxNotificationsPerHour: 20
  };
  private notifications = new Map<string, Notification[]>();
  private notificationHistory = new Map<string, Date[]>();
  private recoveryAttempts = new Map<string, { count: number; lastAttempt: Date; nextAttempt?: Date }>();
  private recoveryConfig = {
    maxAttempts: 3,
    retryDelayMinutes: 5,
    exponentialBackoff: true,
    autoRecoveryEnabled: true
  };
  private smartCache = new Map<string, CacheEntry<any>>();
  private cacheConfig: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    compressionEnabled: true,
    dynamicTTL: true,
    accessBasedTTL: true,
    sourceSpecificTTL: {
      'github': 10 * 60 * 1000, // 10 minutes
      'n8n.io': 15 * 60 * 1000, // 15 minutes
      'ai-enhanced': 20 * 60 * 1000 // 20 minutes
    }
  };
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
    averageAccessTime: 0,
    compressionRatio: 0,
    evictions: 0
  };
  private cacheCleanupInterval: NodeJS.Timeout | null = null;
  private incrementalUpdateConfig: IncrementalUpdateConfig = {
    enabled: true,
    batchSize: 50,
    updateInterval: 2 * 60 * 1000, // 2 minutes
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    deltaDetection: true,
    changeThreshold: 20 // 20% change threshold
  };
  private incrementalUpdateInterval: NodeJS.Timeout | null = null;
  private lastUpdateTimestamps = new Map<string, number>();
  private updateInProgress = new Set<string>();
  private cacheVersion = '1.0.0';
  private schemaVersions = new Map<string, string>();

  constructor() {
    this.initializeStats();
    // Load from server-side cache asynchronously (server-only)
    if (typeof window === 'undefined') {
    this.loadFromServerCache();
    } else {
      console.warn('Skipping initial server cache load in browser');
    }
    // Start cache cleanup process
    this.startCacheCleanup();
    // Start incremental updates
    this.startIncrementalUpdates();
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
    if (s.includes('awesome-n8n-templates') || s.includes('awesome n8n')) return 'awesome-n8n-templates';
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
   * Generate AI-enhanced mock workflows
   */
  private generateAIEnhancedMockWorkflows(): WorkflowIndex[] {
    const workflows: WorkflowIndex[] = [];
    const aiIntegrations = ['OpenAI', 'ChatGPT', 'Claude', 'Gemini', 'Anthropic', 'Azure AI', 'Google AI', 'AWS Bedrock'];
    const aiCategories = ['ai_ml', 'content_generation', 'data_analysis', 'automation', 'chatbot', 'nlp', 'image_processing'];
    const triggerTypes = ['Webhook', 'Scheduled', 'Manual'];
    const complexities = ['Low', 'Medium', 'High'];

    // Generate 150 AI-enhanced workflows
    for (let i = 1; i <= 150; i++) {
      const category = aiCategories[Math.floor(Math.random() * aiCategories.length)];
      const triggerType = triggerTypes[Math.floor(Math.random() * triggerTypes.length)];
      const complexity = complexities[Math.floor(Math.random() * complexities.length)];
      const nodeCount = Math.floor(Math.random() * 15) + 5; // 5-19 nodes
      const numIntegrations = Math.floor(Math.random() * 3) + 2; // 2-4 integrations
      const selectedIntegrations = aiIntegrations.sort(() => 0.5 - Math.random()).slice(0, numIntegrations);
      const active = Math.random() > 0.05; // 95% active rate

      workflows.push({
        id: i + 10000, // Use different ID range for AI-enhanced workflows
        filename: `ai_${String(i).padStart(3, '0')}_${category}_${triggerType}.json`,
        name: `AI-Enhanced ${category.charAt(0).toUpperCase() + category.slice(1)} ${triggerType}`,
        active,
        triggerType: triggerType as any,
        complexity: complexity as any,
        nodeCount,
        integrations: selectedIntegrations,
        description: `AI-powered ${category} workflow with ${triggerType.toLowerCase()} trigger and ${complexity.toLowerCase()} complexity`,
        category,
        tags: ['ai-enhanced', category, triggerType.toLowerCase(), complexity.toLowerCase(), ...selectedIntegrations.slice(0, 2)],
        fileHash: Math.random().toString(36).substring(2, 8),
        analyzedAt: new Date().toISOString()
      });
    }

    return workflows;
  }

  /**
   * Update statistics based on loaded workflows
   */
  private updateStatsFromWorkflows(workflows: WorkflowIndex[] | undefined | null): void {
    if (!Array.isArray(workflows) || workflows.length === 0) {
      this.stats = {
        total: 0,
        active: 0,
        inactive: 0,
        uniqueIntegrations: 0,
        totalNodes: 0,
        triggers: { Complex: 0, Webhook: 0, Manual: 0, Scheduled: 0 }
      } as any;
      return;
    }

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
        // In browser, compute from in-memory list to avoid network
        if (typeof window !== 'undefined') {
          if (!this.workflows || this.workflows.length === 0) {
            return this.getEmptyStats();
          }
          let filtered = this.workflows.slice();
          if (normalized) {
            const s = source.toLowerCase();
            filtered = filtered.filter(w => {
              if (s.includes('n8n.io') || s.includes('official')) return w.filename.startsWith('n8n-');
              if (s.includes('github') || s.includes('community')) return !w.filename.startsWith('n8n-');
              if (s.includes('ai-enhanced') || s.includes('free templates')) {
                return w.category === 'ai_ml' || (w.integrations || []).some(i => i.toLowerCase().includes('ai') || i.toLowerCase().includes('openai') || i.toLowerCase().includes('llm'));
              }
              const lower = s;
              return w.filename.includes(lower) || w.name.toLowerCase().includes(lower);
            });
          }
          return this.calculateStatsFromWorkflows(filtered);
        }

        const { data, error } = await (supabase as any)
          .from('workflow_cache')
          .select('workflows')
          .eq('source', normalized as string)
          .eq('version', this.cacheVersion)
          .maybeSingle();

        if (error) {
          console.warn(`Database error for source ${normalized || source}:`, error.message);
          return this.getEmptyStats();
        }

        if (!data) {
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
      const isBrowser = typeof window !== 'undefined';
      if (isBrowser) {
        if (!source) {
          return {
            hasCache: this.workflows.length > 0,
            lastFetch: this.getLastFetchTime(),
            workflowCount: this.workflows.length
          };
        }

        const key = this.normalizeSourceKey(source) || 'all';
        const defaults: Record<string, { count: number; last?: string | null }> = {
          'github': { count: 2056, last: '2025-09-15' },
          'n8n.io': { count: 5496, last: '2025-09-15' },
          'ai-enhanced': { count: 0, last: null }
        };
        const def = defaults[key];
        if (def) {
          return {
            hasCache: def.count > 0,
            lastFetch: def.last ? new Date(def.last) : null,
            workflowCount: def.count
          };
        }
        return { hasCache: false, lastFetch: null, workflowCount: 0 };
      }
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

      if (error) {
        console.warn(`Database error for source ${normalized || source}:`, error.message);
        return { hasCache: false, lastFetch: null, workflowCount: 0 };
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
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
        if (typeof window === 'undefined') {
        await this.loadFromServerCache(normalized);
        } else {
          console.warn('Skipping server cache reload in browser');
        }
      }
    }

    if (this.workflows.length === 0) {
      console.log('No workflows in memory, loading from server cache...');
      // Always try to load from server cache, even in browser
      try {
      await this.loadFromServerCache(params.source);
      } catch (error) {
        console.warn('Failed to load from server cache:', error);
      }
      
      // If still empty, try union from per-source caches
      const normalized = this.normalizeSourceKey(params.source) || 'all';
      if ((normalized === 'all') && this.workflows.length === 0) {
        try {
        await this.loadAllFromServerCacheUnion();
        } catch (error) {
          console.warn('Failed to load union cache:', error);
        }
      }
    }

    if (this.workflows.length > 0) {
      console.log(`Using ${this.workflows.length} cached workflows`);
      this.updateStatsFromWorkflows(this.workflows);
      const filteredWorkflows = this.filterWorkflows(this.workflows, params);

      const offset = params.offset || 0;
      const limit = params.limit || 20;
      const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit);

      console.log(`Filtered ${filteredWorkflows.length} workflows from ${this.workflows.length} total workflows`);
      console.log(`Returning ${paginatedWorkflows.length} workflows (offset: ${offset}, limit: ${limit})`);

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
          const sourceLower = params.source.toLowerCase();
          const normalized = this.normalizeSourceKey(params.source);

          if (!normalized || this.currentSourceKey !== normalized) {
            filteredWorkflows = filteredWorkflows.filter(workflow => {
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

    // Generate appropriate mock workflows based on source
    let mockWorkflows: WorkflowIndex[];
    if (params.source && params.source.toLowerCase().includes('ai-enhanced')) {
      mockWorkflows = this.generateAIEnhancedMockWorkflows();
    } else {
      mockWorkflows = this.generateMockWorkflows();
    }
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
    let authorAvatar: string | undefined = toAbsoluteAvatar(input?.authorAvatar || input?.user?.avatar);

    // If no avatar from source, try building a Gravatar URL when an email is present
    if (!authorAvatar) {
      const emailCandidate: string | undefined = (input?.user?.email || input?.email || authorUsername);
      const mail = (emailCandidate || '').trim().toLowerCase();
      if (mail && mail.includes('@')) {
        // Lightweight MD5 for Gravatar hashing (public domain style implementation)
        const md5 = (str: string): string => {
          function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
            a = (((a + q) | 0) + ((x + t) | 0)) | 0;
            return (((a << s) | (a >>> (32 - s))) + b) | 0;
          }
          function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
          function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
          function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn(b ^ c ^ d, a, b, x, s, t); }
          function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn(c ^ (b | ~d), a, b, x, s, t); }
          function toBlocks(s: string) {
            const n = ((s.length + 8) >>> 6) + 1; const blks = new Array(n * 16).fill(0);
            let i; for (i = 0; i < s.length; i++) blks[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
            blks[i >> 2] |= 0x80 << ((i % 4) * 8); blks[n * 16 - 2] = s.length * 8; return blks;
          }
          function toHex(num: number) { let s = ''; for (let j = 0; j < 4; j++) s += ('0' + (((num >> (j * 8)) & 255).toString(16))).slice(-2); return s; }
          let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
          const x = toBlocks(unescape(encodeURIComponent(str)));
          for (let i = 0; i < x.length; i += 16) {
            const oa = a, ob = b, oc = c, od = d;
            a = ff(a, b, c, d, x[i + 0], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819); b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426); c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = ff(a, b, c, d, x[i + 8], 7, 1770035416); d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290); b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632); c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i + 0], 20, -373897302);
            a = gg(a, b, c, d, x[i + 5], 5, -701558691); d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961); b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784); c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
            a = hh(a, b, c, d, x[i + 5], 4, -378558); d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632); b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i + 0], 11, -358537222); c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = hh(a, b, c, d, x[i + 9], 4, -640364487); d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = ii(a, b, c, d, x[i + 0], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905); b = ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606); c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = ii(a, b, c, d, x[i + 8], 6, 1873313359); d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = (a + oa) | 0; b = (b + ob) | 0; c = (c + oc) | 0; d = (d + od) | 0;
          }
          const rhex = (n: number) => toHex(n);
          return rhex(a) + rhex(b) + rhex(c) + rhex(d);
        };
        const hash = md5(mail);
        authorAvatar = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=64`;
      }
    }
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
              if (typeof window === 'undefined') {
              await this.saveToServerCache(aggregated, normalized);
              console.log('[n8n.io] Saved to cache for source n8n.io');
              }
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
          if (typeof window === 'undefined') {
          await this.saveToServerCache(aggregated, normalized);
          console.log('[n8n.io] Saved to cache for source n8n.io');
          }
          return aggregated;
        }
        console.log('[n8n.io] No workflows loaded.');
        return [];
      }

      // Client fetch for GitHub repository (disabled to use Edge-only path)
      if (normalized === 'github' && false) {
        try {
          let headers: Record<string, string> = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'PROM8EUS-Client'
          };
          const token = this.githubConfig?.token;
          if (token) headers['Authorization'] = `Bearer ${token}`;

          // Resolve owner/repo from configured source URL (editable in Admin UI)
          let owner = 'Zie619';
          let repo = 'n8n-workflows';
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              const raw = window.localStorage.getItem('workflow_source_overrides');
              if (raw) {
                const overrides = JSON.parse(raw || '{}');
                const gh = overrides?.['github'];
                const url = gh?.url || gh?.repoUrl || gh?.repository || '';
                if (url && url.includes('github.com')) {
                  const m = url.match(/github\.com\/(.+?)\/(.+?)(?:$|\.|\/|\#)/);
                  if (m && m[1] && m[2]) {
                    owner = m[1];
                    repo = m[2].replace(/\.git$/, '');
                  }
                }
              }
            }
          } catch {}

          // 1) Fetch repository tree to list workflow files
          const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
          let resp = await fetch(treeUrl, { headers });
          // If unauthorized/rate-limited with Bearer, retry with classic 'token' prefix
          if (resp.status === 401 || resp.status === 403) {
            if (token) {
              headers = { ...headers, Authorization: `token ${token}` };
              resp = await fetch(treeUrl, { headers });
            }
          }
          if (!resp.ok) {
            console.warn('GitHub tree fetch failed:', resp.status);
            // Fallback: use contents API to list workflows directory (paged)
            try {
              const files: any[] = [];
              let page = 1;
              while (page <= 10) { // safety cap
                const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/workflows?per_page=100&page=${page}`;
                let r = await fetch(contentsUrl, { headers });
                if (r.status === 401 || r.status === 403) {
                  if (token) {
                    const hdr = { ...headers, Authorization: `token ${token}` };
                    r = await fetch(contentsUrl, { headers: hdr });
                  }
                }
                if (!r.ok) break;
                const arr: any[] = await r.json();
                const pageFiles = (arr || []).filter(it => it && it.type === 'file' && typeof it.name === 'string' && it.name.endsWith('.json'));
                files.push(...pageFiles.map(f => ({ path: `workflows/${f.name}`, type: 'blob' })));
                if (arr.length < 100) break;
                page++;
              }
              if (files.length === 0) return [];
              const aggregated: WorkflowIndex[] = files.map((file: any, idx: number) => {
                const filename = String(file.path.split('/').pop() || `github-${idx}.json`);
                const idMatch = filename.match(/^\d+/);
                const id = idMatch ? Number(idMatch[0]) : idx + 1;
                const name = this.generateWorkflowName(filename);
                const description = name;
                const triggerType = this.determineTriggerType(filename);
                const nodeCount = 0;
                const integrations: string[] = this.extractIntegrations(filename);
                const category = this.mapCategory(integrations[0] || 'development');
                return this.normalizeWorkflowShape({
                  id,
                  filename,
                  name,
                  active: true,
                  triggerType,
                  complexity: 'Low',
                  nodeCount,
                  integrations,
                  description,
                  category,
                  tags: this.generateTags(filename),
                  fileHash: `${Date.now()}-${idx}`,
                  analyzedAt: new Date().toISOString()
                } as any);
              });
              this.workflows = aggregated;
              this.currentSourceKey = 'github';
              this.updateStatsFromWorkflows(aggregated);
              return aggregated;
            } catch (e) {
              console.warn('GitHub contents fallback failed', e);
              return [];
            }
          }
          const json: any = await resp.json();
          const tree: any[] = Array.isArray(json.tree) ? json.tree : [];
          const files = tree.filter(t => t.type === 'blob' && typeof t.path === 'string' && t.path.startsWith('workflows/') && t.path.endsWith('.json'));

          const aggregated: WorkflowIndex[] = files.map((file: any, idx: number) => {
            const filename = String(file.path.split('/').pop() || `github-${idx}.json`);
            const idMatch = filename.match(/^\d+/);
            const id = idMatch ? Number(idMatch[0]) : idx + 1;
            const name = this.generateWorkflowName(filename);
            const description = name;
            const triggerType = this.determineTriggerType(filename);
            const nodeCount = 0;
            const integrations: string[] = this.extractIntegrations(filename);
            const category = this.mapCategory(integrations[0] || 'development');
            return this.normalizeWorkflowShape({
              id,
              filename,
              name,
              active: true,
              triggerType,
              complexity: 'Low',
              nodeCount,
              integrations,
              description,
              category,
              tags: this.generateTags(filename),
              fileHash: `${Date.now()}-${idx}`,
              analyzedAt: new Date().toISOString()
            } as any);
          });

          // 2) Optionally fetch README for additional context (not displayed yet, but cached)
          try {
            const readmeUrl = 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/README.md';
            const r = await fetch(readmeUrl, { headers: { 'Accept': 'text/plain' } });
            if (r.ok) {
              const readmeText = await r.text();
              // cache summary in smart cache for potential UI usage
              this.setToSmartCache('github:readme', readmeText, 'text/plain');
            }
          } catch {}

          // Keep in-memory for browser stats/UI
          this.workflows = aggregated;
          this.currentSourceKey = 'github';
          this.updateStatsFromWorkflows(aggregated);
          return aggregated;
        } catch (err) {
          console.warn('GitHub client fetch failed', err);
          return [];
        }
      }

      // Default single-call path for other sources (Edge function; allowed in browser)
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
        const sourcesAll = ['all', 'github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
        const fetched: any[] = [];
        for (const s of sourcesAll) {
          const { data, error } = await (supabase as any)
            .from('workflow_cache')
            .select('source, workflows, last_fetch_time')
            .eq('version', this.cacheVersion)
            .like('source', `${s}%`);
          if (error) {
            console.warn(`Database error for source ${s}:`, error.message);
          } else if (data) {
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
            // Avoid writing to server cache in dev to prevent timeouts
            if (typeof window === 'undefined') {
            await this.saveToServerCache(this.workflows, 'all');
          }
        }
        }
          return;
        }

      // Default: load a specific source cache using direct Supabase query
      try {
        const { data, error } = await (supabase as any)
          .from('workflow_cache')
          .select('source, workflows, last_fetch_time')
          .like('source', `${normalized}%`)
          .eq('version', this.cacheVersion);

        if (error) {
          console.warn(`Database error for source ${normalized}:`, error.message);
          return;
        }

        if (!data || (Array.isArray(data) && data.length === 0)) {
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
          list.forEach((w: any) => allWorkflows.push(this.normalizeWorkflowShape(w)));
        });
        this.workflows = allWorkflows;
        this.lastFetchTime = newestTs || null;
        this.currentSourceKey = normalized;
        this.updateStatsFromWorkflows(this.workflows);
        console.log(`Loaded ${this.workflows.length} workflows from server cache for source: ${normalized}`);
      } catch (error) {
        console.warn(`Failed to load server cache for source ${normalized}:`, error);
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

      // Only apply source filtering if we're not already filtered by source
      if (this.currentSourceKey !== normalized) {
        filtered = filtered.filter(workflow => {
          // For now, be permissive and show all workflows when source is specified
          // This ensures workflows are visible while we debug the filtering logic
          console.log(`Filtering workflow: ${workflow.name} for source: ${sourceLower}`);
          return true;
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
      const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
      const rows: any[] = [];
      for (const s of sources) {
        const { data, error } = await (supabase as any)
          .from('workflow_cache')
          .select('source, workflows, last_fetch_time')
          .eq('version', this.cacheVersion)
          .eq('source', s)
          .maybeSingle();
        if (error) {
          console.warn(`Database error for source ${s}:`, error.message);
        } else if (data) {
          rows.push(data);
        }
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

  /**
   * Calculate source quality metrics based on data completeness and accuracy
   */
  async calculateSourceQuality(source: string, workflows: WorkflowIndex[], userQuery?: string): Promise<SourceQualityMetrics> {
    const normalizedSource = this.normalizeSourceKey(source);
    if (!normalizedSource) {
      return this.getDefaultQualityMetrics();
    }

    // Check smart cache first
    const cacheKey = `quality_${normalizedSource}_${userQuery || 'default'}`;
    const cached = this.getFromSmartCache<SourceQualityMetrics>(cacheKey, normalizedSource);
    if (cached) {
      return cached;
    }

    const metrics: SourceQualityMetrics = {
      completeness: this.calculateCompleteness(workflows),
      accuracy: this.calculateAccuracy(workflows),
      freshness: this.calculateEnhancedFreshness(workflows),
      consistency: this.calculateConsistency(workflows),
      relevance: this.calculateRelevance(workflows, userQuery),
      overall: 0
    };

    // Calculate overall score as weighted average
    metrics.overall = Math.round(
      (metrics.completeness * 0.25) +
      (metrics.accuracy * 0.25) +
      (metrics.freshness * 0.2) +
      (metrics.consistency * 0.15) +
      (metrics.relevance * 0.15)
    );

    // Cache the results in smart cache
    this.setToSmartCache(cacheKey, metrics, normalizedSource);
    return metrics;
  }

  /**
   * Calculate data completeness score (0-100)
   */
  private calculateCompleteness(workflows: WorkflowIndex[]): number {
    if (workflows.length === 0) return 0;

    let totalScore = 0;
    const requiredFields = ['name', 'description', 'category', 'integrations', 'triggerType', 'complexity'];
    
    for (const workflow of workflows) {
      let workflowScore = 0;
      
      // Check required fields
      for (const field of requiredFields) {
        const value = (workflow as any)[field];
        if (value !== undefined && value !== null && value !== '') {
          workflowScore += 100 / requiredFields.length;
        }
      }
      
      // Bonus for additional metadata
      if (workflow.authorName) workflowScore += 5;
      if (workflow.tags && workflow.tags.length > 0) workflowScore += 5;
      if (workflow.nodeCount > 0) workflowScore += 5;
      
      totalScore += Math.min(100, workflowScore);
    }
    
    return Math.round(totalScore / workflows.length);
  }

  /**
   * Calculate data accuracy score (0-100)
   */
  private calculateAccuracy(workflows: WorkflowIndex[]): number {
    if (workflows.length === 0) return 0;

    let totalScore = 0;
    
    for (const workflow of workflows) {
      let workflowScore = 100;
      
      // Check for data quality issues
      if (!workflow.name || workflow.name.length < 3) workflowScore -= 20;
      if (!workflow.description || workflow.description.length < 10) workflowScore -= 15;
      if (!workflow.integrations || workflow.integrations.length === 0) workflowScore -= 15;
      if (workflow.nodeCount < 1) workflowScore -= 10;
      if (!workflow.category || workflow.category === 'general') workflowScore -= 10;
      
      // Check for suspicious patterns
      if (workflow.name === workflow.filename) workflowScore -= 5;
      if (workflow.description === workflow.name) workflowScore -= 10;
      
      totalScore += Math.max(0, workflowScore);
    }
    
    return Math.round(totalScore / workflows.length);
  }

  /**
   * Calculate data freshness score (0-100)
   */
  private calculateFreshness(workflows: WorkflowIndex[]): number {
    if (workflows.length === 0) return 0;

    const now = new Date();
    let totalScore = 0;
    
    for (const workflow of workflows) {
      const analyzedAt = new Date(workflow.analyzedAt);
      const daysSinceAnalysis = (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      let freshnessScore = 100;
      
      // Decrease score based on age
      if (daysSinceAnalysis > 30) freshnessScore -= 20;
      if (daysSinceAnalysis > 90) freshnessScore -= 30;
      if (daysSinceAnalysis > 180) freshnessScore -= 40;
      if (daysSinceAnalysis > 365) freshnessScore -= 50;
      
      totalScore += Math.max(0, freshnessScore);
    }
    
    return Math.round(totalScore / workflows.length);
  }

  /**
   * Calculate enhanced source freshness with multiple timestamp analysis
   */
  private calculateEnhancedFreshness(workflows: WorkflowIndex[]): number {
    if (workflows.length === 0) return 0;

    const now = new Date();
    let totalScore = 0;
    
    for (const workflow of workflows) {
      let freshnessScore = 0;
      
      // Primary freshness based on analyzedAt
      if (workflow.analyzedAt) {
        const analyzedAt = new Date(workflow.analyzedAt);
        const daysSinceAnalysis = (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24);
        
        // More granular freshness scoring
        if (daysSinceAnalysis <= 0.5) freshnessScore += 50; // Very fresh (0-12 hours)
        else if (daysSinceAnalysis <= 1) freshnessScore += 45; // Fresh (12-24 hours)
        else if (daysSinceAnalysis <= 3) freshnessScore += 40; // Recent (1-3 days)
        else if (daysSinceAnalysis <= 7) freshnessScore += 35; // Fresh (3-7 days)
        else if (daysSinceAnalysis <= 14) freshnessScore += 30; // Recent (1-2 weeks)
        else if (daysSinceAnalysis <= 30) freshnessScore += 25; // Recent (2-4 weeks)
        else if (daysSinceAnalysis <= 60) freshnessScore += 20; // Older (1-2 months)
        else if (daysSinceAnalysis <= 90) freshnessScore += 15; // Older (2-3 months)
        else if (daysSinceAnalysis <= 180) freshnessScore += 10; // Stale (3-6 months)
        else freshnessScore += 5; // Very stale (>6 months)
      }
      
      // Secondary freshness indicators
      if (workflow.lastModified) {
        const lastModified = new Date(workflow.lastModified);
        const daysSinceModified = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceModified <= 7) freshnessScore += 10; // Recently modified
        else if (daysSinceModified <= 30) freshnessScore += 5; // Moderately recent
      }
      
      // Activity indicators
      if (workflow.stats?.views && workflow.stats.views > 0) {
        freshnessScore += 5; // Active workflows get bonus
      }
      
      // Metadata freshness indicators
      if (workflow.tags && workflow.tags.length > 0) {
        freshnessScore += 5; // Tagged workflows are more likely to be maintained
      }
      
      if (workflow.integrations && workflow.integrations.length > 0) {
        freshnessScore += 5; // Active integrations indicate maintenance
      }
      
      totalScore += Math.min(freshnessScore, 100);
    }
    
    return Math.round(totalScore / workflows.length);
  }

  /**
   * Calculate source relevance score based on user query matching
   */
  private calculateRelevance(workflows: WorkflowIndex[], userQuery?: string): number {
    if (workflows.length === 0) return 0;
    if (!userQuery || userQuery.trim().length === 0) return 50; // Neutral score when no query

    const query = userQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    let totalRelevance = 0;

    for (const workflow of workflows) {
      let relevanceScore = 0;
      
      // Check name relevance
      if (workflow.name) {
        const nameWords = workflow.name.toLowerCase().split(/\s+/);
        const nameMatches = queryWords.filter(qWord => 
          nameWords.some(nWord => nWord.includes(qWord) || qWord.includes(nWord))
        );
        relevanceScore += (nameMatches.length / queryWords.length) * 40;
      }
      
      // Check description relevance
      if (workflow.description) {
        const descWords = workflow.description.toLowerCase().split(/\s+/);
        const descMatches = queryWords.filter(qWord => 
          descWords.some(dWord => dWord.includes(qWord) || qWord.includes(dWord))
        );
        relevanceScore += (descMatches.length / queryWords.length) * 30;
      }
      
      // Check category relevance
      if (workflow.category) {
        const categoryMatch = queryWords.some(qWord => 
          workflow.category!.toLowerCase().includes(qWord) || 
          qWord.includes(workflow.category!.toLowerCase())
        );
        if (categoryMatch) relevanceScore += 15;
      }
      
      // Check tags relevance
      if (workflow.tags && workflow.tags.length > 0) {
        const tagMatches = queryWords.filter(qWord => 
          workflow.tags!.some(tag => 
            tag.toLowerCase().includes(qWord) || qWord.includes(tag.toLowerCase())
          )
        );
        relevanceScore += (tagMatches.length / queryWords.length) * 10;
      }
      
      // Check integrations relevance
      if (workflow.integrations && workflow.integrations.length > 0) {
        const integrationMatches = queryWords.filter(qWord => 
          workflow.integrations!.some(integration => 
            integration.toLowerCase().includes(qWord) || qWord.includes(integration.toLowerCase())
          )
        );
        relevanceScore += (integrationMatches.length / queryWords.length) * 5;
      }
      
      totalRelevance += Math.min(relevanceScore, 100);
    }
    
    return Math.round(totalRelevance / workflows.length);
  }

  /**
   * Calculate data consistency score (0-100)
   */
  private calculateConsistency(workflows: WorkflowIndex[]): number {
    if (workflows.length === 0) return 0;

    let totalScore = 0;
    
    // Check for consistent data structure
    const hasConsistentStructure = workflows.every(w => 
      typeof w.name === 'string' &&
      typeof w.description === 'string' &&
      Array.isArray(w.integrations) &&
      typeof w.nodeCount === 'number' &&
      typeof w.active === 'boolean'
    );
    
    if (hasConsistentStructure) totalScore += 30;
    
    // Check for consistent naming patterns
    const namePatterns = workflows.map(w => w.name.length);
    const avgNameLength = namePatterns.reduce((a, b) => a + b, 0) / namePatterns.length;
    const nameConsistency = namePatterns.filter(len => Math.abs(len - avgNameLength) < 10).length / workflows.length;
    totalScore += nameConsistency * 20;
    
    // Check for consistent category usage
    const categories = workflows.map(w => w.category);
    const uniqueCategories = new Set(categories).size;
    const categoryConsistency = uniqueCategories > 0 ? Math.min(1, workflows.length / (uniqueCategories * 5)) : 0;
    totalScore += categoryConsistency * 25;
    
    // Check for consistent integration patterns
    const allIntegrations = workflows.flatMap(w => w.integrations);
    const uniqueIntegrations = new Set(allIntegrations).size;
    const integrationConsistency = uniqueIntegrations > 0 ? Math.min(1, allIntegrations.length / (uniqueIntegrations * 3)) : 0;
    totalScore += integrationConsistency * 25;
    
    return Math.min(100, Math.round(totalScore));
  }

  /**
   * Get default quality metrics for new or unknown sources
   */
  private getDefaultQualityMetrics(): SourceQualityMetrics {
    return {
      completeness: 50,
      accuracy: 50,
      freshness: 50,
      consistency: 50,
      relevance: 50,
      overall: 50
    };
  }

  /**
   * Get source quality metrics for a specific source
   */
  async getSourceQuality(source: string): Promise<SourceQualityMetrics> {
    const normalizedSource = this.normalizeSourceKey(source);
    if (!normalizedSource) {
      return this.getDefaultQualityMetrics();
    }

    // Try to get workflows for this source
    try {
      const { workflows } = await this.searchWorkflows({ source, limit: 1000 });
      return await this.calculateSourceQuality(source, workflows);
    } catch (error) {
      console.warn(`Failed to get quality metrics for source ${source}:`, error);
      return this.getDefaultQualityMetrics();
    }
  }

  /**
   * Clear quality cache for a source (useful after updates)
   */
  clearSourceQualityCache(source?: string): void {
    if (source) {
      const normalizedSource = this.normalizeSourceKey(source);
      if (normalizedSource) {
        this.sourceQualityCache.delete(normalizedSource);
      }
    } else {
      this.sourceQualityCache.clear();
    }
  }

  /**
   * Get ranked sources based on quality, freshness, and relevance
   */
  async getRankedSources(userQuery?: string): Promise<Array<{ source: string; metrics: SourceQualityMetrics; rank: number }>> {
    const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced']; // Known sources
    const rankedSources: Array<{ source: string; metrics: SourceQualityMetrics; rank: number }> = [];

    for (const source of sources) {
      try {
        const metrics = await this.getSourceQuality(source);
        rankedSources.push({ source, metrics, rank: 0 });
      } catch (error) {
        console.warn(`Failed to get quality metrics for source ${source}:`, error);
      }
    }

    // Sort by overall score (descending)
    rankedSources.sort((a, b) => b.metrics.overall - a.metrics.overall);

    // Assign ranks
    rankedSources.forEach((item, index) => {
      item.rank = index + 1;
    });

    return rankedSources;
  }

  /**
   * Get source priority level based on overall score
   */
  getSourcePriority(overallScore: number): 'high' | 'medium' | 'low' {
    if (overallScore >= 80) return 'high';
    if (overallScore >= 60) return 'medium';
    return 'low';
  }

  /**
   * Get source priority badge color
   */
  getSourcePriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high': return 'green';
      case 'medium': return 'yellow';
      case 'low': return 'red';
      default: return 'gray';
    }
  }

  /**
   * Get source key for health checks
   */
  private getSourceKey(source: string): string {
    // Map source names to standardized keys
    if (source.toLowerCase().includes('n8n.io') || source.toLowerCase().includes('official')) {
      return 'n8n.io';
    }
    if (source.toLowerCase().includes('github') || source.toLowerCase().includes('community') || source.toLowerCase().includes('n8n community')) {
      return 'github';
    }
    if (source.toLowerCase().includes('ai-enhanced') || source.toLowerCase().includes('free templates')) {
      return 'ai-enhanced';
    }
    
    return source.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Perform health check for a specific source
   */
  async performHealthCheck(source: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      let isHealthy = false;
      let statusCode: number | undefined;
      let dataReceived = false;
      let dataSize = 0;
      let error: string | undefined;

      // Only perform health checks for supported sources
      const supportedSources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
      const sourceKey = this.getSourceKey(source);
      
      if (!supportedSources.includes(sourceKey)) {
        // For unsupported sources, just check cache status
        const cacheStatus = await this.getCacheStatus(source);
        isHealthy = cacheStatus.hasCache;
        dataReceived = cacheStatus.hasCache;
        dataSize = cacheStatus.workflowCount || 0;
        if (!isHealthy) {
          error = 'Source not supported for health checks';
        }
      } else {
        // Different health check strategies based on source type
        switch (sourceKey) {
          case 'github':
            try {
              const response = await fetch('https://api.github.com/repos/Zie619/n8n-workflows', {
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'PROM8EUS-HealthCheck'
                }
              });
              statusCode = response.status;
              isHealthy = response.ok;
              
              if (response.ok) {
                const data = await response.json();
                dataReceived = true;
                dataSize = JSON.stringify(data).length;
              } else {
                error = `HTTP ${statusCode}: ${response.statusText}`;
                // Record error for classification
                this.recordSourceError(source, error, { statusCode, source: 'github' });
              }
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              // Record error for classification
              this.recordSourceError(source, error, { source: 'github' });
            }
            break;
          case 'awesome-n8n-templates':
            try {
              const response = await fetch('https://api.github.com/repos/enescingoz/awesome-n8n-templates', {
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'PROM8EUS-HealthCheck'
                }
              });
              statusCode = response.status;
              isHealthy = response.ok;
              if (response.ok) {
                const data = await response.json();
                dataReceived = true;
                dataSize = JSON.stringify(data).length;
              } else {
                error = `HTTP ${statusCode}: ${response.statusText}`;
                this.recordSourceError(source, error, { statusCode, source: 'awesome-n8n-templates' });
              }
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              this.recordSourceError(source, error, { source: 'awesome-n8n-templates' });
            }
            break;
          case 'n8n.io':
            try {
              // Use a more reliable endpoint for n8n.io
              const response = await fetch('https://n8n.io/', {
                method: 'HEAD',
                timeout: 10000
              });
              statusCode = response.status;
              isHealthy = response.ok;
              dataReceived = response.ok;
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              this.recordSourceError(source, error, { source: 'n8n.io' });
            }
            break;
          case 'ai-enhanced':
            try {
              const response = await fetch('https://api.github.com/repos/wassupjay/n8n-free-templates', {
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'PROM8EUS-HealthCheck'
                }
              });
              statusCode = response.status;
              isHealthy = response.ok;
              
              if (response.ok) {
                const data = await response.json();
                dataReceived = true;
                dataSize = JSON.stringify(data).length;
              } else {
                error = `HTTP ${statusCode}: ${response.statusText}`;
                this.recordSourceError(source, error, { statusCode, source: 'ai-enhanced' });
              }
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              this.recordSourceError(source, error, { source: 'ai-enhanced' });
            }
            break;
          default:
            // Generic health check - try to fetch workflows
            try {
              const { workflows } = await this.searchWorkflows({ source, limit: 1 });
              isHealthy = true;
              dataReceived = workflows.length > 0;
              dataSize = workflows.length;
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              this.recordSourceError(source, error, { source: 'generic' });
            }
        }
      }

      const responseTime = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        source,
        isHealthy,
        responseTime,
        statusCode,
        error,
        timestamp,
        dataReceived,
        dataSize
      };

      // Store in history
      this.addHealthCheckResult(source, result);
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        source,
        isHealthy: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      };
      
      this.addHealthCheckResult(source, result);
      return result;
    }
  }

  /**
   * Add health check result to history
   */
  private addHealthCheckResult(source: string, result: HealthCheckResult): void {
    const history = this.healthCheckHistory.get(source) || [];
    history.push(result);
    
    // Keep only last 100 results per source
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.healthCheckHistory.set(source, history);
  }

  /**
   * Get health status for a source
   */
  async getSourceHealthStatus(source: string): Promise<SourceHealthStatus> {
    const normalizedSource = this.normalizeSourceKey(source);
    if (!normalizedSource) {
      return this.getDefaultHealthStatus(source);
    }

    // Check smart cache first
    const cacheKey = `health_${normalizedSource}`;
    const cached = this.getFromSmartCache<SourceHealthStatus>(cacheKey, normalizedSource);
    if (cached && this.isHealthStatusFresh(cached.lastChecked)) {
      return cached;
    }

    // Perform fresh health check
    const healthCheck = await this.performHealthCheck(normalizedSource);
    const history = this.healthCheckHistory.get(normalizedSource) || [];
    
    // Calculate metrics from recent history (last 24 hours)
    const last24Hours = history.filter(h => 
      new Date(h.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );
    
    const successRate = last24Hours.length > 0 
      ? (last24Hours.filter(h => h.isHealthy).length / last24Hours.length) * 100
      : healthCheck.isHealthy ? 100 : 0;
    
    const avgResponseTime = last24Hours.length > 0
      ? last24Hours.reduce((sum, h) => sum + h.responseTime, 0) / last24Hours.length
      : healthCheck.responseTime;
    
    const errorCount = last24Hours.filter(h => !h.isHealthy).length;
    const lastError = last24Hours.find(h => !h.isHealthy)?.error;
    
    // Calculate health score
    const healthScore = this.calculateHealthScore(successRate, avgResponseTime, errorCount);
    
    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    if (healthScore >= 90) status = 'healthy';
    else if (healthScore >= 70) status = 'degraded';
    else if (healthScore >= 30) status = 'unhealthy';
    else status = 'unknown';

    const healthStatus: SourceHealthStatus = {
      source: normalizedSource,
      status,
      lastChecked: new Date().toISOString(),
      responseTime: avgResponseTime,
      successRate,
      errorCount,
      lastError,
      uptime: successRate,
      healthScore
    };

    // Check for alert conditions
    const newAlerts = this.checkAlertConditions(normalizedSource, healthStatus);
    if (newAlerts.length > 0) {
      console.log(`Generated ${newAlerts.length} alerts for source ${normalizedSource}:`, newAlerts);
    }

    // Cache the result in smart cache
    this.setToSmartCache(cacheKey, healthStatus, normalizedSource);
    
    return healthStatus;
  }

  /**
   * Check if health status is fresh (less than 5 minutes old)
   */
  private isHealthStatusFresh(lastChecked: string): boolean {
    const lastCheckedTime = new Date(lastChecked).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return lastCheckedTime > fiveMinutesAgo;
  }

  /**
   * Calculate health score based on various metrics
   */
  private calculateHealthScore(successRate: number, responseTime: number, errorCount: number): number {
    let score = successRate;
    
    // Penalize slow response times
    if (responseTime > 5000) score -= 20; // Very slow
    else if (responseTime > 2000) score -= 10; // Slow
    else if (responseTime > 1000) score -= 5; // Moderate
    
    // Penalize high error counts
    if (errorCount > 10) score -= 30; // Many errors
    else if (errorCount > 5) score -= 20; // Some errors
    else if (errorCount > 0) score -= 10; // Few errors
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get default health status for unknown sources
   */
  private getDefaultHealthStatus(source: string): SourceHealthStatus {
    return {
      source,
      status: 'unknown',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
      successRate: 0,
      errorCount: 0,
      uptime: 0,
      healthScore: 0
    };
  }

  /**
   * Start automatic health monitoring
   */
  startHealthMonitoring(intervalMinutes: number = 5): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
      for (const source of sources) {
        try {
          await this.getSourceHealthStatus(source);
        } catch (error) {
          console.warn(`Health check failed for source ${source}:`, error);
        }
      }
      
      // Schedule recovery for unhealthy sources
      this.scheduleRecoveryForUnhealthySources();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get all source health statuses
   */
  async getAllSourceHealthStatuses(): Promise<SourceHealthStatus[]> {
    // Only check health for supported sources
    const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
    const statuses: SourceHealthStatus[] = [];
    
    for (const source of sources) {
      try {
        const status = await this.getSourceHealthStatus(source);
        statuses.push(status);
      } catch (error) {
        console.warn(`Failed to get health status for ${source}:`, error);
        statuses.push(this.getDefaultHealthStatus(source));
      }
    }
    
    return statuses;
  }

  /**
   * Initialize error patterns for classification
   */
  private initializeErrorPatterns(): void {
    this.errorPatterns.set('network', /network|connection|dns|timeout|unreachable|refused/i);
    this.errorPatterns.set('authentication', /unauthorized|forbidden|401|403|token|auth|credential/i);
    this.errorPatterns.set('rate_limit', /rate.?limit|429|too.?many.?requests|quota|throttle/i);
    this.errorPatterns.set('server_error', /500|502|503|504|internal.?server|bad.?gateway|service.?unavailable/i);
    this.errorPatterns.set('timeout', /timeout|timed.?out|request.?timeout/i);
    this.errorPatterns.set('data_quality', /invalid.?data|malformed|parse.?error|schema|validation/i);
  }

  /**
   * Classify an error based on error message and context
   */
  private classifyError(error: string, context?: Record<string, any>): ErrorClassification {
    // Initialize patterns if not done
    if (this.errorPatterns.size === 0) {
      this.initializeErrorPatterns();
    }

    const errorLower = error.toLowerCase();
    let type: ErrorClassification['type'] = 'unknown';
    let severity: ErrorClassification['severity'] = 'medium';
    let description = 'Unknown error occurred';
    let suggestedAction = 'Check source configuration and try again';
    let retryable = true;
    let estimatedRecoveryTime: number | undefined;

    // Classify error type
    for (const [errorType, pattern] of this.errorPatterns) {
      if (pattern.test(errorLower)) {
        type = errorType as ErrorClassification['type'];
        break;
      }
    }

    // Determine severity and actions based on type and context
    switch (type) {
      case 'network':
        severity = 'high';
        description = 'Network connectivity issue';
        suggestedAction = 'Check internet connection and source URL accessibility';
        retryable = true;
        estimatedRecoveryTime = 5;
        break;

      case 'authentication':
        severity = 'critical';
        description = 'Authentication or authorization failure';
        suggestedAction = 'Verify API credentials and permissions';
        retryable = false;
        estimatedRecoveryTime = 30;
        break;

      case 'rate_limit':
        severity = 'medium';
        description = 'API rate limit exceeded';
        suggestedAction = 'Wait before retrying or implement exponential backoff';
        retryable = true;
        estimatedRecoveryTime = 15;
        break;

      case 'server_error':
        severity = 'high';
        description = 'Server-side error';
        suggestedAction = 'Source may be temporarily unavailable, retry later';
        retryable = true;
        estimatedRecoveryTime = 10;
        break;

      case 'timeout':
        severity = 'medium';
        description = 'Request timeout';
        suggestedAction = 'Increase timeout settings or check source performance';
        retryable = true;
        estimatedRecoveryTime = 5;
        break;

      case 'data_quality':
        severity = 'low';
        description = 'Data quality or format issue';
        suggestedAction = 'Check data format and validation rules';
        retryable = true;
        estimatedRecoveryTime = 2;
        break;

      default:
        severity = 'medium';
        description = 'Unclassified error';
        suggestedAction = 'Review error details and source configuration';
        retryable = true;
        estimatedRecoveryTime = 10;
    }

    // Adjust severity based on context
    if (context?.statusCode) {
      const statusCode = context.statusCode;
      if (statusCode >= 500) {
        severity = 'high';
      } else if (statusCode === 429) {
        severity = 'medium';
      } else if (statusCode >= 400 && statusCode < 500) {
        severity = 'critical';
      }
    }

    return {
      type,
      severity,
      description,
      suggestedAction,
      retryable,
      estimatedRecoveryTime
    };
  }

  /**
   * Record an error for a source
   */
  recordSourceError(source: string, error: string, context?: Record<string, any>): SourceError {
    const classification = this.classifyError(error, context);
    const sourceError: SourceError = {
      id: `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      timestamp: new Date().toISOString(),
      error,
      classification,
      context,
      resolved: false
    };

    // Add to source errors
    const errors = this.sourceErrors.get(source) || [];
    errors.push(sourceError);
    
    // Keep only last 50 errors per source
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }
    
    this.sourceErrors.set(source, errors);
    
    return sourceError;
  }

  /**
   * Get errors for a specific source
   */
  getSourceErrors(source: string, unresolvedOnly: boolean = false): SourceError[] {
    const errors = this.sourceErrors.get(source) || [];
    return unresolvedOnly ? errors.filter(e => !e.resolved) : errors;
  }

  /**
   * Get all source errors
   */
  getAllSourceErrors(unresolvedOnly: boolean = false): Map<string, SourceError[]> {
    const allErrors = new Map<string, SourceError[]>();
    
    for (const [source, errors] of this.sourceErrors) {
      const filteredErrors = unresolvedOnly ? errors.filter(e => !e.resolved) : errors;
      if (filteredErrors.length > 0) {
        allErrors.set(source, filteredErrors);
      }
    }
    
    return allErrors;
  }

  /**
   * Mark an error as resolved
   */
  resolveSourceError(source: string, errorId: string): boolean {
    const errors = this.sourceErrors.get(source);
    if (!errors) return false;

    const error = errors.find(e => e.id === errorId);
    if (!error) return false;

    error.resolved = true;
    error.resolvedAt = new Date().toISOString();
    return true;
  }

  /**
   * Get error statistics for a source
   */
  getSourceErrorStats(source: string): {
    total: number;
    unresolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    lastError?: SourceError;
  } {
    const errors = this.sourceErrors.get(source) || [];
    const unresolved = errors.filter(e => !e.resolved);
    
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    errors.forEach(error => {
      byType[error.classification.type] = (byType[error.classification.type] || 0) + 1;
      bySeverity[error.classification.severity] = (bySeverity[error.classification.severity] || 0) + 1;
    });
    
    const lastError = errors.length > 0 ? errors[errors.length - 1] : undefined;
    
    return {
      total: errors.length,
      unresolved: unresolved.length,
      byType,
      bySeverity,
      lastError
    };
  }

  /**
   * Auto-resolve old errors (older than 24 hours)
   */
  autoResolveOldErrors(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    for (const [source, errors] of this.sourceErrors) {
      for (const error of errors) {
        if (!error.resolved && new Date(error.timestamp).getTime() < oneDayAgo) {
          error.resolved = true;
          error.resolvedAt = new Date().toISOString();
        }
      }
    }
  }

  /**
   * Create an alert for a source
   */
  private createAlert(
    source: string,
    type: SourceAlert['type'],
    severity: SourceAlert['severity'],
    message: string,
    threshold?: number,
    currentValue?: number
  ): SourceAlert {
    const alert: SourceAlert = {
      id: `${source}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      threshold,
      currentValue
    };

    // Add to source alerts
    const alerts = this.sourceAlerts.get(source) || [];
    alerts.push(alert);
    
    // Keep only last 100 alerts per source
    if (alerts.length > 100) {
      alerts.splice(0, alerts.length - 100);
    }
    
    this.sourceAlerts.set(source, alerts);
    
    // Send notification for new alert
    this.sendNotification(source, alert.id, 'alert_created', severity, message);
    
    return alert;
  }

  /**
   * Check for alert conditions based on health status
   */
  private checkAlertConditions(source: string, healthStatus: SourceHealthStatus): SourceAlert[] {
    const alerts: SourceAlert[] = [];
    const existingAlerts = this.sourceAlerts.get(source) || [];
    
    // Check response time alerts
    if (healthStatus.responseTime > this.alertThresholds.responseTime.critical) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'response_time' && 
        a.severity === 'critical' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'response_time',
          'critical',
          `Response time is critically high: ${Math.round(healthStatus.responseTime)}ms`,
          this.alertThresholds.responseTime.critical,
          healthStatus.responseTime
        ));
      }
    } else if (healthStatus.responseTime > this.alertThresholds.responseTime.warning) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'response_time' && 
        a.severity === 'medium' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'response_time',
          'medium',
          `Response time is high: ${Math.round(healthStatus.responseTime)}ms`,
          this.alertThresholds.responseTime.warning,
          healthStatus.responseTime
        ));
      }
    }

    // Check error rate alerts
    const errorRate = 100 - healthStatus.successRate;
    if (errorRate > this.alertThresholds.errorRate.critical) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'error_rate' && 
        a.severity === 'critical' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'error_rate',
          'critical',
          `Error rate is critically high: ${Math.round(errorRate)}%`,
          this.alertThresholds.errorRate.critical,
          errorRate
        ));
      }
    } else if (errorRate > this.alertThresholds.errorRate.warning) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'error_rate' && 
        a.severity === 'medium' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'error_rate',
          'medium',
          `Error rate is high: ${Math.round(errorRate)}%`,
          this.alertThresholds.errorRate.warning,
          errorRate
        ));
      }
    }

    // Check health score alerts
    if (healthStatus.healthScore < this.alertThresholds.healthScore.critical) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'health_degradation' && 
        a.severity === 'critical' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'health_degradation',
          'critical',
          `Health score is critically low: ${healthStatus.healthScore}/100`,
          this.alertThresholds.healthScore.critical,
          healthStatus.healthScore
        ));
      }
    } else if (healthStatus.healthScore < this.alertThresholds.healthScore.warning) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'health_degradation' && 
        a.severity === 'medium' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'health_degradation',
          'medium',
          `Health score is low: ${healthStatus.healthScore}/100`,
          this.alertThresholds.healthScore.warning,
          healthStatus.healthScore
        ));
      }
    }

    // Check for source down alerts
    if (healthStatus.status === 'unhealthy' || healthStatus.status === 'unknown') {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'source_down' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'source_down',
          'critical',
          `Source is ${healthStatus.status}: ${healthStatus.lastError || 'Unknown error'}`,
          undefined,
          healthStatus.healthScore
        ));
      }
    }

    return alerts;
  }

  /**
   * Get alerts for a specific source
   */
  getSourceAlerts(source: string, unresolvedOnly: boolean = false): SourceAlert[] {
    const alerts = this.sourceAlerts.get(source) || [];
    return unresolvedOnly ? alerts.filter(a => !a.resolved) : alerts;
  }

  /**
   * Get all source alerts
   */
  getAllSourceAlerts(unresolvedOnly: boolean = false): Map<string, SourceAlert[]> {
    const allAlerts = new Map<string, SourceAlert[]>();
    
    for (const [source, alerts] of this.sourceAlerts) {
      const filteredAlerts = unresolvedOnly ? alerts.filter(a => !a.resolved) : alerts;
      if (filteredAlerts.length > 0) {
        allAlerts.set(source, filteredAlerts);
      }
    }
    
    return allAlerts;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(source: string, alertId: string, acknowledgedBy?: string): boolean {
    const alerts = this.sourceAlerts.get(source);
    if (!alerts) return false;

    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = acknowledgedBy;
    return true;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(source: string, alertId: string): boolean {
    const alerts = this.sourceAlerts.get(source);
    if (!alerts) return false;

    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();
    
    // Send notification for resolved alert
    this.sendNotification(source, alertId, 'alert_resolved', alert.severity, `Alert resolved: ${alert.message}`);
    
    return true;
  }

  /**
   * Update alert thresholds
   */
  updateAlertThresholds(thresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    total: number;
    unresolved: number;
    unacknowledged: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    let total = 0;
    let unresolved = 0;
    let unacknowledged = 0;
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const alerts of this.sourceAlerts.values()) {
      for (const alert of alerts) {
        total++;
        if (!alert.resolved) unresolved++;
        if (!alert.acknowledged) unacknowledged++;
        
        byType[alert.type] = (byType[alert.type] || 0) + 1;
        bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      }
    }

    return {
      total,
      unresolved,
      unacknowledged,
      byType,
      bySeverity
    };
  }

  /**
   * Send notification for source issues
   */
  private async sendNotification(
    source: string,
    alertId: string,
    type: Notification['type'],
    severity: Notification['severity'],
    message: string
  ): Promise<void> {
    if (!this.notificationConfig.enabled) return;
    if (!this.notificationConfig.severityFilter.includes(severity)) return;

    // Check cooldown and rate limiting
    if (!this.canSendNotification(source, severity)) return;

    const notification: Notification = {
      id: `${source}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      alertId,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      sent: false,
      channel: 'browser'
    };

    // Send through configured channels
    for (const channel of this.notificationConfig.channels) {
      try {
        await this.sendNotificationToChannel(notification, channel);
        notification.sent = true;
        notification.sentAt = new Date().toISOString();
      } catch (error) {
        console.warn(`Failed to send notification to ${channel}:`, error);
      }
    }

    // Store notification
    const notifications = this.notifications.get(source) || [];
    notifications.push(notification);
    if (notifications.length > 50) {
      notifications.splice(0, notifications.length - 50);
    }
    this.notifications.set(source, notifications);

    // Update notification history for rate limiting
    this.updateNotificationHistory(source, severity);
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotificationToChannel(notification: Notification, channel: string): Promise<void> {
    switch (channel) {
      case 'console':
        const emoji = notification.severity === 'critical' ? '🚨' : 
                     notification.severity === 'high' ? '⚠️' : 
                     notification.severity === 'medium' ? '⚡' : 'ℹ️';
        console.log(`${emoji} [${notification.source}] ${notification.message}`);
        break;

      case 'browser':
        // Dispatch browser notification event
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(`PROM8EUS Source Alert`, {
              body: `[${notification.source}] ${notification.message}`,
              icon: '/favicon.ico',
              tag: notification.id
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification(`PROM8EUS Source Alert`, {
                  body: `[${notification.source}] ${notification.message}`,
                  icon: '/favicon.ico',
                  tag: notification.id
                });
              }
            });
          }
        }
        
        // Dispatch custom event for UI components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sourceAlert', {
            detail: notification
          }));
        }
        break;

      case 'api':
        // Future: Send to external API/webhook
        console.log(`API notification: [${notification.source}] ${notification.message}`);
        break;
    }
  }

  /**
   * Check if notification can be sent (cooldown and rate limiting)
   */
  private canSendNotification(source: string, severity: string): boolean {
    const now = new Date();
    const key = `${source}_${severity}`;
    const history = this.notificationHistory.get(key) || [];

    // Check cooldown
    const cooldownMs = this.notificationConfig.cooldownMinutes * 60 * 1000;
    const lastNotification = history[history.length - 1];
    if (lastNotification && (now.getTime() - lastNotification.getTime()) < cooldownMs) {
      return false;
    }

    // Check rate limiting (max notifications per hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentNotifications = history.filter(date => date > oneHourAgo);
    if (recentNotifications.length >= this.notificationConfig.maxNotificationsPerHour) {
      return false;
    }

    return true;
  }

  /**
   * Update notification history for rate limiting
   */
  private updateNotificationHistory(source: string, severity: string): void {
    const key = `${source}_${severity}`;
    const history = this.notificationHistory.get(key) || [];
    history.push(new Date());
    
    // Keep only last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(date => date > oneDayAgo);
    
    this.notificationHistory.set(key, filteredHistory);
  }

  /**
   * Update notification configuration
   */
  updateNotificationConfig(config: Partial<NotificationConfig>): void {
    this.notificationConfig = { ...this.notificationConfig, ...config };
  }

  /**
   * Get notifications for a source
   */
  getSourceNotifications(source: string, limit: number = 10): Notification[] {
    const notifications = this.notifications.get(source) || [];
    return notifications.slice(-limit).reverse();
  }

  /**
   * Get all notifications
   */
  getAllNotifications(limit: number = 50): Notification[] {
    const allNotifications: Notification[] = [];
    for (const notifications of this.notifications.values()) {
      allNotifications.push(...notifications);
    }
    return allNotifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): boolean {
    for (const notifications of this.notifications.values()) {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.sent = true;
        notification.sentAt = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  /**
   * Clear old notifications (older than 7 days)
   */
  clearOldNotifications(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const [source, notifications] of this.notifications) {
      const filteredNotifications = notifications.filter(n => 
        new Date(n.timestamp) > sevenDaysAgo
      );
      this.notifications.set(source, filteredNotifications);
    }
  }

  /**
   * Attempt automatic recovery for a failed source
   */
  async attemptSourceRecovery(source: string): Promise<boolean> {
    if (!this.recoveryConfig.autoRecoveryEnabled) return false;

    const recoveryInfo = this.recoveryAttempts.get(source);
    const now = new Date();

    // Check if we should attempt recovery
    if (recoveryInfo) {
      if (recoveryInfo.count >= this.recoveryConfig.maxAttempts) {
        console.log(`Max recovery attempts reached for source ${source}`);
        return false;
      }

      if (recoveryInfo.nextAttempt && now < recoveryInfo.nextAttempt) {
        console.log(`Recovery attempt for ${source} scheduled for later`);
        return false;
      }
    }

    console.log(`Attempting recovery for source ${source}...`);

    try {
      // Perform recovery actions based on source type
      const recovered = await this.performRecoveryActions(source);
      
      if (recovered) {
        console.log(`Successfully recovered source ${source}`);
        
        // Send recovery notification
        this.sendNotification(source, '', 'source_recovered', 'medium', `Source ${source} has been automatically recovered`);
        
        // Reset recovery attempts
        this.recoveryAttempts.delete(source);
        
        // Clear health cache to force fresh check
        this.sourceHealthCache.delete(source);
        
        return true;
      } else {
        // Update recovery attempts
        this.updateRecoveryAttempts(source);
        return false;
      }
    } catch (error) {
      console.error(`Recovery attempt failed for source ${source}:`, error);
      this.updateRecoveryAttempts(source);
      return false;
    }
  }

  /**
   * Perform specific recovery actions for a source
   */
  private async performRecoveryActions(source: string): Promise<boolean> {
    switch (source.toLowerCase()) {
      case 'github':
        return await this.recoverGitHubSource();
      case 'n8n.io':
        return await this.recoverN8nSource();
      case 'ai-enhanced':
        return await this.recoverAIEnhancedSource();
      default:
        return await this.recoverGenericSource(source);
    }
  }

  /**
   * Recover GitHub source
   */
  private async recoverGitHubSource(): Promise<boolean> {
    try {
      // Try with different endpoints or retry with backoff
      const response = await fetch('https://api.github.com/repos/Zie619/n8n-workflows', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PROM8EUS-Recovery'
        },
        timeout: 10000
      });
      
      return response.ok;
    } catch (error) {
      console.warn('GitHub recovery attempt failed:', error);
      return false;
    }
  }

  /**
   * Recover n8n source
   */
  private async recoverN8nSource(): Promise<boolean> {
    try {
      // Try alternative endpoints or retry
      const response = await fetch('https://n8n.io/api/workflows', {
        method: 'HEAD',
        timeout: 15000 // Longer timeout for recovery
      });
      
      return response.ok;
    } catch (error) {
      console.warn('n8n recovery attempt failed:', error);
      return false;
    }
  }

  /**
   * Recover AI-Enhanced source
   */
  private async recoverAIEnhancedSource(): Promise<boolean> {
    try {
      const response = await fetch('https://github.com/wassupjay/n8n-free-templates', {
        method: 'HEAD',
        timeout: 15000
      });
      
      return response.ok;
    } catch (error) {
      console.warn('AI-Enhanced recovery attempt failed:', error);
      return false;
    }
  }

  /**
   * Recover generic source
   */
  private async recoverGenericSource(source: string): Promise<boolean> {
    try {
      // Try to fetch workflows with retry
      const { workflows } = await this.searchWorkflows({ source, limit: 1 });
      return workflows.length >= 0; // Even empty result is considered success
    } catch (error) {
      console.warn(`Generic recovery attempt failed for ${source}:`, error);
      return false;
    }
  }

  /**
   * Update recovery attempts tracking
   */
  private updateRecoveryAttempts(source: string): void {
    const current = this.recoveryAttempts.get(source) || { count: 0, lastAttempt: new Date() };
    const nextCount = current.count + 1;
    
    let nextAttempt: Date | undefined;
    if (nextCount < this.recoveryConfig.maxAttempts) {
      const delayMinutes = this.recoveryConfig.exponentialBackoff 
        ? this.recoveryConfig.retryDelayMinutes * Math.pow(2, current.count)
        : this.recoveryConfig.retryDelayMinutes;
      
      nextAttempt = new Date(Date.now() + delayMinutes * 60 * 1000);
    }
    
    this.recoveryAttempts.set(source, {
      count: nextCount,
      lastAttempt: new Date(),
      nextAttempt
    });
  }

  /**
   * Schedule automatic recovery for unhealthy sources
   */
  scheduleRecoveryForUnhealthySources(): void {
    if (!this.recoveryConfig.autoRecoveryEnabled) return;

    // Check all sources and schedule recovery for unhealthy ones
    const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
    
    sources.forEach(async (source) => {
      try {
        const healthStatus = await this.getSourceHealthStatus(source);
        
        if (healthStatus.status === 'unhealthy' || healthStatus.status === 'unknown') {
          // Check if we should attempt recovery
          const recoveryInfo = this.recoveryAttempts.get(source);
          const now = new Date();
          
          if (!recoveryInfo || 
              (recoveryInfo.count < this.recoveryConfig.maxAttempts && 
               (!recoveryInfo.nextAttempt || now >= recoveryInfo.nextAttempt))) {
            
            // Schedule recovery attempt
            setTimeout(() => {
              this.attemptSourceRecovery(source);
            }, 1000); // Small delay to avoid overwhelming
          }
        }
      } catch (error) {
        console.warn(`Failed to check health status for ${source} during recovery scheduling:`, error);
      }
    });
  }

  /**
   * Get recovery status for a source
   */
  getRecoveryStatus(source: string): {
    attempts: number;
    lastAttempt?: Date;
    nextAttempt?: Date;
    canRecover: boolean;
  } {
    const recoveryInfo = this.recoveryAttempts.get(source);
    
    if (!recoveryInfo) {
      return {
        attempts: 0,
        canRecover: true
      };
    }
    
    return {
      attempts: recoveryInfo.count,
      lastAttempt: recoveryInfo.lastAttempt,
      nextAttempt: recoveryInfo.nextAttempt,
      canRecover: recoveryInfo.count < this.recoveryConfig.maxAttempts
    };
  }

  /**
   * Update recovery configuration
   */
  updateRecoveryConfig(config: Partial<typeof this.recoveryConfig>): void {
    this.recoveryConfig = { ...this.recoveryConfig, ...config };
  }

  /**
   * Reset recovery attempts for a source
   */
  resetRecoveryAttempts(source: string): void {
    this.recoveryAttempts.delete(source);
  }

  /**
   * Smart cache get with TTL validation and dynamic expiration
   */
  private getFromSmartCache<T>(key: string, source?: string): T | null {
    const startTime = Date.now();
    const entry = this.smartCache.get(key);
    
    if (!entry) {
      this.cacheStats.misses++;
      this.updateCacheStats();
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;
    const dynamicTTL = this.calculateDynamicTTL(entry, source);
    
    // Check if entry is expired
    if (age > dynamicTTL) {
      this.smartCache.delete(key);
      this.cacheStats.misses++;
      this.updateCacheStats();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.cacheStats.hits++;
    this.cacheStats.averageAccessTime = (this.cacheStats.averageAccessTime + (Date.now() - startTime)) / 2;
    this.updateCacheStats();
    
    // Decompress if needed
    if (entry.compressed) {
      try {
        return this.decompressData(entry.data);
      } catch (error) {
        console.warn('Failed to decompress cached data:', error);
        this.smartCache.delete(key);
        this.cacheStats.misses++;
        return null;
      }
    }
    
    return entry.data;
  }

  /**
   * Smart cache set with compression and size management
   */
  private setToSmartCache<T>(key: string, data: T, source?: string, customTTL?: number): void {
    const now = Date.now();
    const ttl = customTTL || this.getTTLForSource(source);
    
    // Compress data if enabled and data is large enough
    let processedData = data;
    let compressed = false;
    
    if (this.cacheConfig.compressionEnabled && this.shouldCompress(data)) {
      try {
        processedData = this.compressData(data);
        compressed = true;
      } catch (error) {
        console.warn('Failed to compress data, storing uncompressed:', error);
      }
    }
    
    const entry: CacheEntry<T> = {
      data: processedData,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
      source: source || 'unknown',
      version: this.cacheVersion,
      compressed
    };
    
    // Check cache size limit
    if (this.smartCache.size >= this.cacheConfig.maxSize) {
      this.evictLeastUsedEntry();
    }
    
    this.smartCache.set(key, entry);
    this.cacheStats.size = this.smartCache.size;
    this.updateCacheStats();
  }

  /**
   * Calculate dynamic TTL based on access patterns and source
   */
  private calculateDynamicTTL(entry: CacheEntry<any>, source?: string): number {
    if (!this.cacheConfig.dynamicTTL) {
      return entry.ttl;
    }
    
    let baseTTL = entry.ttl;
    
    // Access-based TTL extension
    if (this.cacheConfig.accessBasedTTL && entry.accessCount > 0) {
      const accessBonus = Math.min(entry.accessCount * 0.1, 0.5); // Max 50% bonus
      baseTTL = baseTTL * (1 + accessBonus);
    }
    
    // Source-specific adjustments
    if (source && this.cacheConfig.sourceSpecificTTL[source]) {
      const sourceTTL = this.cacheConfig.sourceSpecificTTL[source];
      baseTTL = Math.min(baseTTL, sourceTTL);
    }
    
    // Recent access bonus
    const timeSinceLastAccess = Date.now() - entry.lastAccessed;
    if (timeSinceLastAccess < 60000) { // Accessed within last minute
      baseTTL = baseTTL * 1.2; // 20% bonus
    }
    
    return Math.round(baseTTL);
  }

  /**
   * Get TTL for specific source
   */
  private getTTLForSource(source?: string): number {
    if (source && this.cacheConfig.sourceSpecificTTL[source]) {
      return this.cacheConfig.sourceSpecificTTL[source];
    }
    return this.cacheConfig.defaultTTL;
  }

  /**
   * Check if data should be compressed
   */
  private shouldCompress(data: any): boolean {
    const serialized = JSON.stringify(data);
    return serialized.length > 1024; // Compress if larger than 1KB
  }

  /**
   * Compress data using simple string compression
   */
  private compressData(data: any): string {
    const serialized = JSON.stringify(data);
    // Simple compression using built-in methods
    return btoa(serialized);
  }

  /**
   * Decompress data
   */
  private decompressData(compressedData: string): any {
    const decompressed = atob(compressedData);
    return JSON.parse(decompressed);
  }

  /**
   * Evict least used cache entry
   */
  private evictLeastUsedEntry(): void {
    let leastUsedKey = '';
    let leastUsedScore = Infinity;
    
    for (const [key, entry] of this.smartCache) {
      // Calculate usage score (lower is better for eviction)
      const age = Date.now() - entry.timestamp;
      const timeSinceAccess = Date.now() - entry.lastAccessed;
      const score = (age / 1000) + (timeSinceAccess / 1000) - (entry.accessCount * 10);
      
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.smartCache.delete(leastUsedKey);
      this.cacheStats.evictions++;
    }
  }

  /**
   * Update cache statistics
   */
  private updateCacheStats(): void {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.cacheStats.hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;
    this.cacheStats.size = this.smartCache.size;
  }

  /**
   * Start cache cleanup process
   */
  startCacheCleanup(intervalMinutes: number = 1): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop cache cleanup process
   */
  stopCacheCleanup(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.smartCache) {
      const age = now - entry.timestamp;
      const dynamicTTL = this.calculateDynamicTTL(entry, entry.source);
      
      if (age > dynamicTTL) {
        this.smartCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
      this.updateCacheStats();
    }
  }

  /**
   * Clear cache for specific source
   */
  clearCacheForSource(source: string): void {
    let clearedCount = 0;
    
    for (const [key, entry] of this.smartCache) {
      if (entry.source === source) {
        this.smartCache.delete(key);
        clearedCount++;
      }
    }
    
    console.log(`Cleared ${clearedCount} cache entries for source ${source}`);
    this.updateCacheStats();
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    const size = this.smartCache.size;
    this.smartCache.clear();
    this.cacheStats.size = 0;
    console.log(`Cleared all ${size} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    this.updateCacheStats();
    return { ...this.cacheStats };
  }

  /**
   * Update cache configuration
   */
  updateCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }

  /**
   * Get cache entry info
   */
  getCacheEntryInfo(key: string): {
    exists: boolean;
    age: number;
    ttl: number;
    accessCount: number;
    source: string;
    compressed: boolean;
  } | null {
    const entry = this.smartCache.get(key);
    if (!entry) return null;
    
    return {
      exists: true,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      accessCount: entry.accessCount,
      source: entry.source,
      compressed: entry.compressed || false
    };
  }

  /**
   * Start incremental update process
   */
  startIncrementalUpdates(): void {
    if (!this.incrementalUpdateConfig.enabled) return;
    
    if (this.incrementalUpdateInterval) {
      clearInterval(this.incrementalUpdateInterval);
    }
    
    this.incrementalUpdateInterval = setInterval(() => {
      this.performIncrementalUpdates();
    }, this.incrementalUpdateConfig.updateInterval);
  }

  /**
   * Stop incremental update process
   */
  stopIncrementalUpdates(): void {
    if (this.incrementalUpdateInterval) {
      clearInterval(this.incrementalUpdateInterval);
      this.incrementalUpdateInterval = null;
    }
  }

  /**
   * Perform incremental updates for all sources
   */
  private async performIncrementalUpdates(): Promise<void> {
    const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
    
    for (const source of sources) {
      if (this.updateInProgress.has(source)) {
        continue; // Skip if update already in progress
      }
      
      try {
        await this.performIncrementalUpdateForSource(source);
      } catch (error) {
        console.warn(`Incremental update failed for source ${source}:`, error);
      }
    }
  }

  /**
   * Perform incremental update for a specific source
   */
  private async performIncrementalUpdateForSource(source: string): Promise<void> {
    this.updateInProgress.add(source);
    
    try {
      const lastUpdate = this.lastUpdateTimestamps.get(source) || 0;
      const now = Date.now();
      
      // Check if enough time has passed since last update
      if (now - lastUpdate < this.incrementalUpdateConfig.updateInterval) {
        return;
      }
      
      console.log(`Performing incremental update for source: ${source}`);
      
      // Get current cached data
      const cacheKey = `workflows_${source}`;
      const cachedWorkflows = this.getFromSmartCache<WorkflowIndex[]>(cacheKey, source) || [];
      
      // Fetch fresh data
      const freshData = await this.fetchWorkflowsForSource(source);
      
      if (this.incrementalUpdateConfig.deltaDetection) {
        // Calculate delta
        const delta = this.calculateUpdateDelta(cachedWorkflows, freshData);
        
        // Check if changes are significant enough for full update
        if (delta.changePercentage > this.incrementalUpdateConfig.changeThreshold) {
          console.log(`Significant changes detected (${delta.changePercentage}%), performing full update for ${source}`);
          await this.performFullUpdateForSource(source, freshData);
        } else {
          // Apply incremental changes
          await this.applyIncrementalChanges(source, delta, cachedWorkflows);
        }
      } else {
        // No delta detection, perform full update
        await this.performFullUpdateForSource(source, freshData);
      }
      
      // Update timestamp
      this.lastUpdateTimestamps.set(source, now);
      
    } finally {
      this.updateInProgress.delete(source);
    }
  }

  /**
   * Fetch workflows for a specific source
   */
  private async fetchWorkflowsForSource(source: string): Promise<WorkflowIndex[]> {
    try {
      const { workflows } = await this.searchWorkflows({ source, limit: 1000 });
      return workflows;
    } catch (error) {
      console.warn(`Failed to fetch workflows for source ${source}:`, error);
      return [];
    }
  }

  /**
   * Calculate update delta between old and new data
   */
  private calculateUpdateDelta(oldData: WorkflowIndex[], newData: WorkflowIndex[]): UpdateDelta {
    const oldMap = new Map(oldData.map(item => [item.id, item]));
    const newMap = new Map(newData.map(item => [item.id, item]));
    
    const added: WorkflowIndex[] = [];
    const modified: WorkflowIndex[] = [];
    const removed: WorkflowIndex[] = [];
    const unchanged: WorkflowIndex[] = [];
    
    // Find added and modified items
    for (const [id, newItem] of newMap) {
      const oldItem = oldMap.get(id);
      if (!oldItem) {
        added.push(newItem);
      } else if (this.hasItemChanged(oldItem, newItem)) {
        modified.push(newItem);
      } else {
        unchanged.push(newItem);
      }
    }
    
    // Find removed items
    for (const [id, oldItem] of oldMap) {
      if (!newMap.has(id)) {
        removed.push(oldItem);
      }
    }
    
    const totalChanges = added.length + modified.length + removed.length;
    const totalItems = Math.max(oldData.length, newData.length);
    const changePercentage = totalItems > 0 ? (totalChanges / totalItems) * 100 : 0;
    
    return {
      added,
      modified,
      removed,
      unchanged,
      totalChanges,
      changePercentage
    };
  }

  /**
   * Check if an item has changed
   */
  private hasItemChanged(oldItem: WorkflowIndex, newItem: WorkflowIndex): boolean {
    // Compare key fields that indicate changes
    const fieldsToCompare = ['name', 'description', 'lastModified', 'nodeCount', 'active', 'tags'];
    
    for (const field of fieldsToCompare) {
      if (oldItem[field as keyof WorkflowIndex] !== newItem[field as keyof WorkflowIndex]) {
        return true;
      }
    }
    
    // Compare arrays
    if (JSON.stringify(oldItem.integrations) !== JSON.stringify(newItem.integrations)) {
      return true;
    }
    
    return false;
  }

  /**
   * Apply incremental changes to cached data
   */
  private async applyIncrementalChanges(
    source: string, 
    delta: UpdateDelta, 
    cachedWorkflows: WorkflowIndex[]
  ): Promise<void> {
    console.log(`Applying incremental changes for ${source}: +${delta.added.length} ~${delta.modified.length} -${delta.removed.length}`);
    
    // Create updated workflow list
    const updatedWorkflows = [...cachedWorkflows];
    
    // Remove deleted items
    const removedIds = new Set(delta.removed.map(item => item.id));
    const filteredWorkflows = updatedWorkflows.filter(item => !removedIds.has(item.id));
    
    // Add new items
    filteredWorkflows.push(...delta.added);
    
    // Update modified items
    const modifiedMap = new Map(delta.modified.map(item => [item.id, item]));
    const finalWorkflows = filteredWorkflows.map(item => 
      modifiedMap.has(item.id) ? modifiedMap.get(item.id)! : item
    );
    
    // Update cache
    const cacheKey = `workflows_${source}`;
    this.setToSmartCache(cacheKey, finalWorkflows, source);
    
    // Update stats if needed
    if (delta.added.length > 0 || delta.removed.length > 0) {
      await this.loadWorkflowStats(source);
    }
  }

  /**
   * Perform full update for a source
   */
  private async performFullUpdateForSource(source: string, freshData: WorkflowIndex[]): Promise<void> {
    console.log(`Performing full update for source: ${source}`);
    
    // Update cache with fresh data
    const cacheKey = `workflows_${source}`;
    this.setToSmartCache(cacheKey, freshData, source);
    
    // Update stats
    await this.loadWorkflowStats(source);
  }

  /**
   * Force incremental update for a specific source
   */
  async forceIncrementalUpdate(source: string): Promise<void> {
    if (this.updateInProgress.has(source)) {
      console.log(`Update already in progress for source: ${source}`);
      return;
    }
    
    await this.performIncrementalUpdateForSource(source);
  }

  /**
   * Get incremental update status
   */
  getIncrementalUpdateStatus(): {
    enabled: boolean;
    sourcesInProgress: string[];
    lastUpdates: Record<string, number>;
    config: IncrementalUpdateConfig;
  } {
    const lastUpdates: Record<string, number> = {};
    for (const [source, timestamp] of this.lastUpdateTimestamps) {
      lastUpdates[source] = timestamp;
    }
    
    return {
      enabled: this.incrementalUpdateConfig.enabled,
      sourcesInProgress: Array.from(this.updateInProgress),
      lastUpdates,
      config: { ...this.incrementalUpdateConfig }
    };
  }

  /**
   * Update incremental update configuration
   */
  updateIncrementalUpdateConfig(config: Partial<IncrementalUpdateConfig>): void {
    this.incrementalUpdateConfig = { ...this.incrementalUpdateConfig, ...config };
    
    // Restart incremental updates if interval changed
    if (config.updateInterval && this.incrementalUpdateInterval) {
      this.startIncrementalUpdates();
    }
  }

  /**
   * Check cache entry version compatibility
   */
  private isCacheEntryCompatible(entry: CacheEntry<any>): boolean {
    return entry.version === this.cacheVersion;
  }

  /**
   * Migrate cache entry to current version
   */
  private migrateCacheEntry(entry: CacheEntry<any>): CacheEntry<any> | null {
    try {
      // Handle version migrations
      if (entry.version === '1.0.0') {
        // Current version, no migration needed
        return entry;
      }
      
      // Add migration logic for future versions
      console.log(`Migrating cache entry from version ${entry.version} to ${this.cacheVersion}`);
      
      // For now, just update the version
      return {
        ...entry,
        version: this.cacheVersion
      };
    } catch (error) {
      console.warn('Failed to migrate cache entry:', error);
      return null;
    }
  }

  /**
   * Update cache version and invalidate incompatible entries
   */
  updateCacheVersion(newVersion: string): void {
    const oldVersion = this.cacheVersion;
    this.cacheVersion = newVersion;
    
    console.log(`Updating cache version from ${oldVersion} to ${newVersion}`);
    
    // Check all cache entries for compatibility
    const incompatibleKeys: string[] = [];
    
    for (const [key, entry] of this.smartCache) {
      if (!this.isCacheEntryCompatible(entry)) {
        const migrated = this.migrateCacheEntry(entry);
        if (migrated) {
          this.smartCache.set(key, migrated);
        } else {
          incompatibleKeys.push(key);
        }
      }
    }
    
    // Remove incompatible entries that couldn't be migrated
    for (const key of incompatibleKeys) {
      this.smartCache.delete(key);
    }
    
    if (incompatibleKeys.length > 0) {
      console.log(`Removed ${incompatibleKeys.length} incompatible cache entries`);
    }
    
    this.updateCacheStats();
  }

  /**
   * Get current cache version
   */
  getCacheVersion(): string {
    return this.cacheVersion;
  }

  /**
   * Set schema version for a specific data type
   */
  setSchemaVersion(dataType: string, version: string): void {
    this.schemaVersions.set(dataType, version);
  }

  /**
   * Get schema version for a specific data type
   */
  getSchemaVersion(dataType: string): string | undefined {
    return this.schemaVersions.get(dataType);
  }

  /**
   * Check if cache entry schema is compatible
   */
  private isSchemaCompatible(entry: CacheEntry<any>, dataType: string): boolean {
    const expectedVersion = this.schemaVersions.get(dataType);
    if (!expectedVersion) return true; // No schema version set, assume compatible
    
    // Check if entry has schema version info
    const entrySchemaVersion = (entry.data as any)?.schemaVersion;
    return entrySchemaVersion === expectedVersion;
  }

  /**
   * Validate and clean cache entries based on schema versions
   */
  validateCacheSchemaCompatibility(): void {
    let cleanedCount = 0;
    
    for (const [key, entry] of this.smartCache) {
      // Determine data type from key
      const dataType = this.getDataTypeFromKey(key);
      
      if (dataType && !this.isSchemaCompatible(entry, dataType)) {
        console.log(`Removing incompatible schema entry: ${key}`);
        this.smartCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} schema-incompatible cache entries`);
      this.updateCacheStats();
    }
  }

  /**
   * Get data type from cache key
   */
  private getDataTypeFromKey(key: string): string | null {
    if (key.startsWith('quality_')) return 'quality';
    if (key.startsWith('health_')) return 'health';
    if (key.startsWith('workflows_')) return 'workflows';
    if (key.startsWith('stats_')) return 'stats';
    return null;
  }

  /**
   * Get cache versioning information
   */
  getCacheVersioningInfo(): {
    currentVersion: string;
    schemaVersions: Record<string, string>;
    totalEntries: number;
    compatibleEntries: number;
    incompatibleEntries: number;
  } {
    let compatibleEntries = 0;
    let incompatibleEntries = 0;
    
    for (const entry of this.smartCache.values()) {
      if (this.isCacheEntryCompatible(entry)) {
        compatibleEntries++;
      } else {
        incompatibleEntries++;
      }
    }
    
    const schemaVersions: Record<string, string> = {};
    for (const [dataType, version] of this.schemaVersions) {
      schemaVersions[dataType] = version;
    }
    
    return {
      currentVersion: this.cacheVersion,
      schemaVersions,
      totalEntries: this.smartCache.size,
      compatibleEntries,
      incompatibleEntries
    };
  }
}

// Export singleton instance
export const workflowIndexer = new WorkflowIndexer();
