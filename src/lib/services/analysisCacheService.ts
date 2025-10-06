/**
 * Analysis Cache Service - Improved client-side caching
 * Persists analysis results and provides intelligent cache management
 */

import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';

// Cache configuration
const CACHE_VERSION = 'v2';
const CACHE_NAMESPACE = 'analysis_cache';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const MAX_CACHE_SIZE = 50; // Maximum number of cached entries

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  createdAt: string;
  expiresAt: string;
  version: string;
  metadata: {
    source: string;
    size: number;
    hits: number;
    lastAccessed: string;
  };
}

// Cache statistics
interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

/**
 * Analysis Cache Service
 * Provides intelligent caching for analysis results with persistence
 */
export class AnalysisCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    oldestEntry: null,
    newestEntry: null
  };

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Generate a stable cache key from input data
   */
  private async generateKey(input: string, type: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${type}:${input.trim().toLowerCase()}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get cached data by key
   */
  async get<T>(key: string, type: string): Promise<T | null> {
    const fullKey = await this.generateKey(key, type);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      console.log(`❌ [AnalysisCache] Miss for ${type}: ${key.slice(0, 50)}...`);
      return null;
    }

    // Check expiration
    if (new Date(entry.expiresAt) < new Date()) {
      console.log(`⏰ [AnalysisCache] Expired for ${type}: ${key.slice(0, 50)}...`);
      this.cache.delete(fullKey);
      this.saveToStorage();
      return null;
    }

    // Update access statistics
    entry.metadata.hits++;
    entry.metadata.lastAccessed = new Date().toISOString();
    this.cache.set(fullKey, entry);

    console.log(`✅ [AnalysisCache] Hit for ${type}: ${key.slice(0, 50)}... (${entry.metadata.hits} hits)`);
    return entry.data;
  }

  /**
   * Set cached data with TTL
   */
  async set<T>(key: string, type: string, data: T, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
    const fullKey = await this.generateKey(key, type);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    const entry: CacheEntry<T> = {
      data,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      version: CACHE_VERSION,
      metadata: {
        source: type,
        size: JSON.stringify(data).length,
        hits: 0,
        lastAccessed: now.toISOString()
      }
    };

    this.cache.set(fullKey, entry);
    this.cleanupIfNeeded();
    this.saveToStorage();

    console.log(`💾 [AnalysisCache] Saved ${type}: ${key.slice(0, 50)}... (expires in ${Math.round(ttlMs / 1000 / 60 / 60)}h)`);
  }

  /**
   * Cache subtasks for a task
   */
  async cacheSubtasks(taskText: string, subtasks: DynamicSubtask[], ttlMs?: number): Promise<void> {
    await this.set(taskText, 'subtasks', subtasks, ttlMs);
  }

  /**
   * Get cached subtasks for a task
   */
  async getCachedSubtasks(taskText: string): Promise<DynamicSubtask[] | null> {
    return await this.get<DynamicSubtask[]>(taskText, 'subtasks');
  }

  /**
   * Cache workflows for a task/subtask
   */
  async cacheWorkflows(taskId: string, subtaskId: string | null, workflows: UnifiedWorkflow[], ttlMs?: number): Promise<void> {
    const key = subtaskId ? `${taskId}:${subtaskId}` : taskId;
    await this.set(key, 'workflows', workflows, ttlMs);
  }

  /**
   * Get cached workflows for a task/subtask
   */
  async getCachedWorkflows(taskId: string, subtaskId: string | null): Promise<UnifiedWorkflow[] | null> {
    const key = subtaskId ? `${taskId}:${subtaskId}` : taskId;
    return await this.get<UnifiedWorkflow[]>(key, 'workflows');
  }

  /**
   * Cache analysis results
   */
  async cacheAnalysisResults(taskText: string, results: any, ttlMs?: number): Promise<void> {
    await this.set(taskText, 'analysis', results, ttlMs);
  }

  /**
   * Get cached analysis results
   */
  async getCachedAnalysisResults(taskText: string): Promise<any | null> {
    return await this.get(taskText, 'analysis');
  }

  /**
   * Cache insights for a task
   */
  async cacheInsights(taskId: string, insights: any[], ttlMs?: number): Promise<void> {
    await this.set(taskId, 'insights', insights, ttlMs);
  }

  /**
   * Get cached insights for a task
   */
  async getCachedInsights(taskId: string): Promise<any[] | null> {
    return await this.get<any[]>(taskId, 'insights');
  }

  /**
   * Clear cache by type or all
   */
  async clear(type?: string): Promise<void> {
    if (type) {
      // Clear specific type
      const keysToDelete: string[] = [];
      for (const [key, entry] of this.cache.entries()) {
        if (entry.metadata.source === type) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🗑️ [AnalysisCache] Cleared ${keysToDelete.length} entries of type: ${type}`);
    } else {
      // Clear all
      this.cache.clear();
      console.log(`🗑️ [AnalysisCache] Cleared all entries`);
    }
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.metadata.hits, 0);
    const totalAccesses = entries.length + totalHits;
    
    return {
      totalEntries: this.cache.size,
      totalSize: entries.reduce((sum, entry) => sum + entry.metadata.size, 0),
      hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => new Date(e.createdAt).getTime())).toString() : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => new Date(e.createdAt).getTime())).toString() : null
    };
  }

  /**
   * Cleanup expired entries and enforce size limits
   */
  private cleanupIfNeeded(): void {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (new Date(entry.expiresAt) < now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    // Enforce size limit by removing least recently accessed entries
    if (this.cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => 
        new Date(a[1].metadata.lastAccessed).getTime() - 
        new Date(b[1].metadata.lastAccessed).getTime()
      );
      
      const toRemove = entries.slice(0, this.cache.size - MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.cache.delete(key));
      
      console.log(`🧹 [AnalysisCache] Cleaned up ${expiredKeys.length + toRemove.length} entries`);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(`${CACHE_NAMESPACE}_${CACHE_VERSION}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data.entries || []);
        this.stats = data.stats || this.stats;
        console.log(`📥 [AnalysisCache] Loaded ${this.cache.size} entries from storage`);
      }
    } catch (error) {
      console.warn('⚠️ [AnalysisCache] Failed to load from storage:', error);
      this.cache = new Map();
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        stats: this.getStats(),
        version: CACHE_VERSION,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem(`${CACHE_NAMESPACE}_${CACHE_VERSION}`, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ [AnalysisCache] Failed to save to storage:', error);
    }
  }

  /**
   * Export cache for debugging
   */
  exportCache(): any {
    return {
      entries: Array.from(this.cache.entries()),
      stats: this.getStats(),
      version: CACHE_VERSION,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import cache from exported data
   */
  importCache(data: any): void {
    try {
      if (data.version === CACHE_VERSION) {
        this.cache = new Map(data.entries || []);
        this.stats = data.stats || this.stats;
        this.saveToStorage();
        console.log(`📥 [AnalysisCache] Imported ${this.cache.size} entries`);
      } else {
        console.warn('⚠️ [AnalysisCache] Version mismatch during import');
      }
    } catch (error) {
      console.error('❌ [AnalysisCache] Failed to import cache:', error);
    }
  }
}

// Export singleton instance
export const analysisCacheService = new AnalysisCacheService();
