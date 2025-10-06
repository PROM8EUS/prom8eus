/**
 * Simple Cache Service
 * 
 * Minimal, efficient caching for workflow data
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  totalRequests: number;
  totalHits: number;
}

export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = {
    totalRequests: 0,
    totalHits: 0,
  };

  constructor(
    private maxSize: number = 100,
    private defaultTTL: number = 5 * 60 * 1000 // 5 minutes
  ) {}

  /**
   * Get data from cache
   */
  get(key: string): T | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired (including zero TTL)
    if (entry.ttl === 0 || Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    this.stats.totalHits++;
    return entry.data;
  }

  /**
   * Set data in cache
   */
  set(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl !== undefined ? ttl : this.defaultTTL,
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { totalRequests: 0, totalHits: 0 };
  }

  /**
   * Clear entries matching pattern
   */
  clearPattern(pattern: string): void {
    try {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      // Invalid regex pattern - ignore silently
      console.warn(`Invalid regex pattern: ${pattern}`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      size: this.cache.size,
      hitRate: this.stats.totalRequests > 0 
        ? this.stats.totalHits / this.stats.totalRequests 
        : 0,
      totalRequests: this.stats.totalRequests,
      totalHits: this.stats.totalHits,
    };
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Global cache instances
 */
export const workflowCache = new SimpleCache(50, 10 * 60 * 1000); // 10 minutes
export const searchCache = new SimpleCache(100, 5 * 60 * 1000); // 5 minutes
export const statsCache = new SimpleCache(20, 2 * 60 * 1000); // 2 minutes
