/**
 * Cache Manager Service
 * Provides TTL-based caching for generated content with intelligent invalidation
 */

import { CacheEntry, GenerationMetadata } from '../types';

export interface CacheConfig {
  defaultTTL: number; // milliseconds
  maxSize: number; // maximum number of entries
  cleanupInterval: number; // milliseconds
  enablePersistence: boolean; // localStorage persistence
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  lastCleanup: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
    lastCleanup: Date.now()
  };
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 1000,
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      enablePersistence: true,
      ...config
    };

    // Load from localStorage if enabled
    if (this.config.enablePersistence) {
      this.loadFromStorage();
    }

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Get cached value by key
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.data as T;
  }

  /**
   * Set cached value with TTL
   */
  set<T = any>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      key
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;

    // Enforce max size
    if (this.cache.size > this.config.maxSize) {
      this.evictOldest();
    }

    // Persist to localStorage if enabled
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * Delete cached value
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.stats.size = this.cache.size;
    
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
    
    return deleted;
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    
    if (this.config.enablePersistence) {
      localStorage.removeItem('prom8eus_cache');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
  }

  /**
   * Generate cache key for generated content
   */
  generateKey(type: 'workflow' | 'agent' | 'prompt', subtaskId: string, metadata: GenerationMetadata): string {
    const { model, language, timestamp, cacheKey } = metadata;
    // Use cacheKey if available (includes variation info), otherwise fallback to basic key
    if (cacheKey) {
      return `${type}_${cacheKey}`;
    }
    return `${type}_${subtaskId}_${model}_${language}_${Math.floor(timestamp / (60 * 1000))}`; // Round to minute
  }

  /**
   * Cache generated workflow
   */
  cacheWorkflow(subtaskId: string, metadata: GenerationMetadata, workflow: any, ttl?: number): void {
    const key = this.generateKey('workflow', subtaskId, metadata);
    this.set(key, workflow, ttl);
  }

  /**
   * Cache generated agent
   */
  cacheAgent(subtaskId: string, metadata: GenerationMetadata, agent: any, ttl?: number): void {
    const key = this.generateKey('agent', subtaskId, metadata);
    this.set(key, agent, ttl);
  }

  /**
   * Cache generated prompt
   */
  cachePrompt(subtaskId: string, metadata: GenerationMetadata, prompt: any, ttl?: number): void {
    const key = this.generateKey('prompt', subtaskId, metadata);
    this.set(key, prompt, ttl);
  }

  /**
   * Get cached workflow
   */
  getCachedWorkflow(subtaskId: string, metadata: GenerationMetadata): any | null {
    const key = this.generateKey('workflow', subtaskId, metadata);
    return this.get(key);
  }

  /**
   * Get cached agent
   */
  getCachedAgent(subtaskId: string, metadata: GenerationMetadata): any | null {
    const key = this.generateKey('agent', subtaskId, metadata);
    return this.get(key);
  }

  /**
   * Get cached prompt
   */
  getCachedPrompt(subtaskId: string, metadata: GenerationMetadata): any | null {
    const key = this.generateKey('prompt', subtaskId, metadata);
    return this.get(key);
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Update hit rate statistic
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = entries.slice(0, Math.floor(this.config.maxSize * 0.1)); // Remove 10%
    toDelete.forEach(([key]) => this.cache.delete(key));
    
    this.stats.size = this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.stats.size = this.cache.size;
    this.stats.lastCleanup = now;

    if (cleaned > 0) {
      console.log(`🧹 [CacheManager] Cleaned up ${cleaned} expired entries`);
      
      if (this.config.enablePersistence) {
        this.saveToStorage();
      }
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        stats: this.stats,
        config: this.config
      };
      localStorage.setItem('prom8eus_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('⚠️ [CacheManager] Failed to save to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('prom8eus_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        
        // Restore cache entries
        this.cache = new Map(cacheData.entries || []);
        
        // Restore stats
        this.stats = cacheData.stats || this.stats;
        
        // Clean up expired entries on load
        this.cleanup();
        
        console.log(`📦 [CacheManager] Loaded ${this.cache.size} entries from localStorage`);
      }
    } catch (error) {
      console.warn('⚠️ [CacheManager] Failed to load from localStorage:', error);
    }
  }

  /**
   * Destroy cache manager and cleanup resources
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager({
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 1000,
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  enablePersistence: true
});

/**
 * Utility functions for common cache operations
 */
export const cacheUtils = {
  /**
   * Cache with automatic key generation
   */
  cacheGeneratedContent<T>(
    type: 'workflow' | 'agent' | 'prompt',
    subtaskId: string,
    metadata: GenerationMetadata,
    content: T,
    ttl?: number
  ): void {
    cacheManager[`cache${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof CacheManager](
      subtaskId,
      metadata,
      content,
      ttl
    );
  },

  /**
   * Get cached content with automatic key generation
   */
  getCachedContent<T>(
    type: 'workflow' | 'agent' | 'prompt',
    subtaskId: string,
    metadata: GenerationMetadata
  ): T | null {
    return cacheManager[`getCached${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof CacheManager](
      subtaskId,
      metadata
    ) as T | null;
  },

  /**
   * Check if content is cached
   */
  isCached(
    type: 'workflow' | 'agent' | 'prompt',
    subtaskId: string,
    metadata: GenerationMetadata
  ): boolean {
    const key = cacheManager.generateKey(type, subtaskId, metadata);
    return cacheManager.has(key);
  },

  /**
   * Clear cache for specific subtask
   */
  clearSubtaskCache(subtaskId: string): void {
    const keys = Array.from(cacheManager['cache'].keys()).filter(key => 
      key.includes(subtaskId)
    );
    keys.forEach(key => cacheManager.delete(key));
  },

  /**
   * Get cache performance metrics
   */
  getPerformanceMetrics(): {
    hitRate: number;
    totalRequests: number;
    cacheSize: number;
    memoryUsage: string;
  } {
    const stats = cacheManager.getStats();
    const memoryUsage = JSON.stringify(Array.from(cacheManager['cache'].entries())).length;
    
    return {
      hitRate: stats.hitRate,
      totalRequests: stats.hits + stats.misses,
      cacheSize: stats.size,
      memoryUsage: `${Math.round(memoryUsage / 1024)}KB`
    };
  }
};

export default cacheManager;
