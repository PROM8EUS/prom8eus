/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use the new unified schema files instead:
 * - For WorkflowIndex: use @/lib/schemas/workflowIndex
 * - For N8nWorkflow: use @/lib/schemas/n8nWorkflow
 * - For WorkflowIndexer: use @/lib/workflowIndexerUnified
 * - For N8nApi: use @/lib/n8nApiUnified
 */

/**
 * Workflow Cache Manager
 * 
 * Handles caching, performance optimization, and data persistence
 */

import { supabase } from '@/integrations/supabase/client';
import { WorkflowIndex, AgentIndex, SolutionIndex } from './schemas/workflowIndex';

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
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
  entryCount: number;
  totalEntries: number;
  totalSize: number;
  lastUpdated: Date | null;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  compressed?: boolean;
  size: number;
}

export class WorkflowCacheManager {
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
    evictions: 0,
    entryCount: 0,
    totalEntries: 0,
    totalSize: 0,
    lastUpdated: null
  };
  private cacheCleanupInterval: NodeJS.Timeout | null = null;
  private cacheVersion = '1.0.0';
  private textEncoder: TextEncoder | null =
    typeof globalThis !== 'undefined' && typeof (globalThis as any).TextEncoder !== 'undefined'
      ? new (globalThis as any).TextEncoder()
      : null;

  constructor() {
    this.startCacheCleanup();
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const startTime = performance.now();
    const entry = this.smartCache.get(key);
    
    if (!entry) {
      this.cacheStats.misses++;
      this.updateStats();
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.smartCache.delete(key);
      this.cacheStats.misses++;
      this.updateStats();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.cacheStats.hits++;
    this.cacheStats.averageAccessTime = (this.cacheStats.averageAccessTime + (performance.now() - startTime)) / 2;
    this.updateStats();

    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entrySize = this.calculateSize(data);
    const entryTTL = ttl || this.getTTLForKey(key);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: entryTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      size: entrySize
    };

    // Compress if enabled and data is large enough
    if (this.cacheConfig.compressionEnabled && entrySize > 1024) {
      entry.compressed = true;
      // Compression logic would go here
    }

    this.smartCache.set(key, entry);
    this.cacheStats.totalEntries++;
    this.cacheStats.totalSize += entrySize;
    this.updateStats();

    // Evict if cache is too large
    if (this.smartCache.size > this.cacheConfig.maxSize) {
      this.evictLeastUsed();
    }
  }

  /**
   * Load workflows from server-side cache
   */
  async loadFromServerCache(source?: string): Promise<void> {
    try {
      const sourceKey = this.normalizeSourceKey(source) || 'all';
      console.log(`Loading workflows from server cache for source: ${sourceKey}`);
      
      const { data, error } = await supabase
        .from('workflow_cache')
        .select('*')
        .eq('source', sourceKey)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading from server cache:', error);
        return;
      }

      if (data && data.length > 0) {
        const cacheEntry = data[0];
        if (cacheEntry.workflows) {
          this.set(`workflows_${sourceKey}`, cacheEntry.workflows, 10 * 60 * 1000);
          console.log(`Loaded ${cacheEntry.workflows.length} workflows from server cache for source: ${sourceKey}`);
        }
      }
    } catch (error) {
      console.warn('Failed to load server cache:', error);
    }
  }

  /**
   * Save workflows to server-side cache
   */
  async saveToServerCache(workflows: SolutionIndex[], source?: string): Promise<void> {
    try {
      const sourceKey = this.normalizeSourceKey(source) || 'all';
      console.log(`Saving ${workflows.length} workflows to cache for source: ${sourceKey}`);
      
      const { error } = await supabase
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
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return { ...this.cacheStats };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.smartCache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0,
      averageAccessTime: 0,
      compressionRatio: 0,
      evictions: 0,
      entryCount: 0,
      totalEntries: 0,
      totalSize: 0,
      lastUpdated: null
    };
  }

  /**
   * Start cache cleanup process
   */
  private startCacheCleanup(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }

    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Cleanup every minute
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.smartCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.smartCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
      this.updateStats();
    }
  }

  /**
   * Evict least used entries
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.smartCache.entries());
    entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
    
    const toEvict = Math.floor(this.cacheConfig.maxSize * 0.1); // Evict 10%
    for (let i = 0; i < toEvict && i < entries.length; i++) {
      this.smartCache.delete(entries[i][0]);
      this.cacheStats.evictions++;
    }
  }

  /**
   * Calculate size of data
   */
  private calculateSize(data: any): number {
    if (this.textEncoder) {
      return this.textEncoder.encode(JSON.stringify(data)).length;
    }
    return JSON.stringify(data).length;
  }

  /**
   * Get TTL for specific key
   */
  private getTTLForKey(key: string): number {
    if (this.cacheConfig.dynamicTTL) {
      for (const [source, ttl] of Object.entries(this.cacheConfig.sourceSpecificTTL)) {
        if (key.includes(source)) {
          return ttl;
        }
      }
    }
    return this.cacheConfig.defaultTTL;
  }

  /**
   * Normalize source key
   */
  private normalizeSourceKey(source?: string): string {
    if (!source) return 'all';
    return source.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.cacheStats.size = this.smartCache.size;
    this.cacheStats.entryCount = this.smartCache.size;
    this.cacheStats.hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;
    this.cacheStats.lastUpdated = new Date();
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
    this.clear();
  }
}
