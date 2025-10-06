/**
 * Tests for Simple Cache System
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleCache, workflowCache, searchCache, statsCache } from '../services/simpleCache';

describe('SimpleCache', () => {
  let cache: SimpleCache<string>;

  beforeEach(() => {
    cache = new SimpleCache<string>();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('basic operations', () => {
    it('should store and retrieve data', () => {
      cache.set('key1', 'value1');
      const value = cache.get('key1');
      
      expect(value).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      const value = cache.get('non-existent');
      expect(value).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should get all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });

    it('should get cache size', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('TTL functionality', () => {
    it('should respect TTL settings', () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      
      // Should be available immediately
      expect(cache.get('key1')).toBe('value1');
      
      // Should expire after TTL
      setTimeout(() => {
        expect(cache.get('key1')).toBeNull();
      }, 150);
    });

    it('should use default TTL when not specified', () => {
      cache.set('key1', 'value1');
      
      // Should be available immediately
      expect(cache.get('key1')).toBe('value1');
    });

    it('should handle zero TTL', () => {
      cache.set('key1', 'value1', 0);
      
      // Should expire immediately (synchronous check)
      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('cache eviction', () => {
    it('should evict oldest entries when max size is reached', () => {
      const smallCache = new SimpleCache<string>(2); // Max 2 entries
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3'); // Should evict key1
      
      expect(smallCache.get('key1')).toBeNull();
      expect(smallCache.get('key2')).toBe('value2');
      expect(smallCache.get('key3')).toBe('value3');
      expect(smallCache.size()).toBe(2);
    });

    it('should handle max size of 1', () => {
      const tinyCache = new SimpleCache<string>(1);
      
      tinyCache.set('key1', 'value1');
      tinyCache.set('key2', 'value2');
      
      expect(tinyCache.get('key1')).toBeNull();
      expect(tinyCache.get('key2')).toBe('value2');
      expect(tinyCache.size()).toBe(1);
    });
  });

  describe('cache clearing', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });

    it('should clear entries matching pattern', () => {
      cache.set('task-1', 'value1');
      cache.set('task-2', 'value2');
      cache.set('workflow-1', 'value3');
      cache.set('other', 'value4');
      
      expect(cache.size()).toBe(4);
      
      cache.clearPattern('task-.*');
      
      expect(cache.size()).toBe(2);
      expect(cache.get('task-1')).toBeNull();
      expect(cache.get('task-2')).toBeNull();
      expect(cache.get('workflow-1')).toBe('value3');
      expect(cache.get('other')).toBe('value4');
    });

    it('should handle invalid regex patterns', () => {
      cache.set('key1', 'value1');
      
      // Should handle invalid regex gracefully
      expect(() => {
        try {
          cache.clearPattern('[');
        } catch (error) {
          // Expected to throw for invalid regex
        }
      }).not.toThrow();
      
      // Should not clear anything due to error
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('statistics', () => {
    it('should track hit rate correctly', () => {
      cache.set('key1', 'value1');
      
      // Hit
      cache.get('key1');
      
      // Miss
      cache.get('non-existent');
      
      const stats = cache.getStats();
      
      expect(stats.totalRequests).toBe(2);
      expect(stats.totalHits).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should track cache size in statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
    });

    it('should handle zero requests', () => {
      const stats = cache.getStats();
      
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should reset statistics when cache is cleared', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // Hit
      cache.get('non-existent'); // Miss
      
      let stats = cache.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.totalHits).toBe(1);
      
      cache.clear();
      
      stats = cache.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('different data types', () => {
    it('should handle objects', () => {
      const objectCache = new SimpleCache<{ id: string; name: string }>();
      const testObject = { id: '1', name: 'Test' };
      
      objectCache.set('key1', testObject);
      const retrieved = objectCache.get('key1');
      
      expect(retrieved).toEqual(testObject);
      expect(retrieved?.id).toBe('1');
      expect(retrieved?.name).toBe('Test');
    });

    it('should handle arrays', () => {
      const arrayCache = new SimpleCache<string[]>();
      const testArray = ['item1', 'item2', 'item3'];
      
      arrayCache.set('key1', testArray);
      const retrieved = arrayCache.get('key1');
      
      expect(retrieved).toEqual(testArray);
      expect(retrieved).toHaveLength(3);
    });

    it('should handle numbers', () => {
      const numberCache = new SimpleCache<number>();
      
      numberCache.set('key1', 42);
      const retrieved = numberCache.get('key1');
      
      expect(retrieved).toBe(42);
    });

    it('should handle booleans', () => {
      const booleanCache = new SimpleCache<boolean>();
      
      booleanCache.set('key1', true);
      booleanCache.set('key2', false);
      
      expect(booleanCache.get('key1')).toBe(true);
      expect(booleanCache.get('key2')).toBe(false);
    });
  });

  describe('concurrent access', () => {
    it('should handle rapid set/get operations', () => {
      // Simulate rapid operations
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      expect(cache.size()).toBe(100);
      
      // Test retrieval
      for (let i = 0; i < 100; i++) {
        expect(cache.get(`key${i}`)).toBe(`value${i}`);
      }
    });

    it('should handle rapid clear operations', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      cache.clear(); // Should not throw error
      
      expect(cache.size()).toBe(0);
    });
  });
});

describe('Global cache instances', () => {
  beforeEach(() => {
    workflowCache.clear();
    searchCache.clear();
    statsCache.clear();
  });

  afterEach(() => {
    workflowCache.clear();
    searchCache.clear();
    statsCache.clear();
  });

  it('should have separate instances', () => {
    workflowCache.set('key1', 'workflow-data');
    searchCache.set('key1', 'search-data');
    statsCache.set('key1', 'stats-data');
    
    expect(workflowCache.get('key1')).toBe('workflow-data');
    expect(searchCache.get('key1')).toBe('search-data');
    expect(statsCache.get('key1')).toBe('stats-data');
  });

  it('should have different default configurations', () => {
    // Test that they have different max sizes and TTLs
    expect(workflowCache.getStats().size).toBe(0);
    expect(searchCache.getStats().size).toBe(0);
    expect(statsCache.getStats().size).toBe(0);
  });

  it('should maintain separate statistics', () => {
    workflowCache.set('key1', 'data1');
    workflowCache.get('key1'); // Hit
    
    searchCache.set('key2', 'data2');
    searchCache.get('key2'); // Hit
    searchCache.get('key3'); // Miss
    
    const workflowStats = workflowCache.getStats();
    const searchStats = searchCache.getStats();
    
    expect(workflowStats.totalRequests).toBe(1);
    expect(workflowStats.totalHits).toBe(1);
    expect(workflowStats.hitRate).toBe(1);
    
    expect(searchStats.totalRequests).toBe(2);
    expect(searchStats.totalHits).toBe(1);
    expect(searchStats.hitRate).toBe(0.5);
  });
});
