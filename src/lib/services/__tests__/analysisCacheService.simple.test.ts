/**
 * Simplified tests for AnalysisCacheService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalysisCacheService } from '../analysisCacheService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.subtle
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
});

describe('AnalysisCacheService - Simple Tests', () => {
  let cacheService: AnalysisCacheService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    localStorageMock.getItem.mockReturnValue(null);
    cacheService = new AnalysisCacheService();
    vi.clearAllMocks();
  });

  it('should create cache service instance', () => {
    expect(cacheService).toBeDefined();
    expect(cacheService.getStats).toBeDefined();
    expect(cacheService.clear).toBeDefined();
  });

  it('should provide initial cache statistics', () => {
    const stats = cacheService.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalEntries).toBe(0);
    expect(stats.totalSize).toBe(0);
    expect(stats.hitRate).toBe(0);
  });

  it('should handle cache operations without errors', async () => {
    const testData = { test: 'data' };
    
    // These should not throw errors
    await expect(cacheService.set('test-key', 'test-type', testData)).resolves.not.toThrow();
    await expect(cacheService.get('test-key', 'test-type')).resolves.not.toThrow();
    await expect(cacheService.clear()).resolves.not.toThrow();
  });

  it('should handle localStorage errors gracefully', async () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    // Should not throw
    await expect(cacheService.set('key', 'type', 'data')).resolves.not.toThrow();
  });

  it('should handle localStorage read errors gracefully', async () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('Storage read error');
    });

    // Should not throw
    await expect(cacheService.get('key', 'type')).resolves.not.toThrow();
  });

  it('should provide export/import functionality', async () => {
    const exported = cacheService.exportCache();
    expect(exported).toBeDefined();
    expect(exported.version).toBe('v2');
    expect(exported.entries).toBeDefined();
    expect(exported.stats).toBeDefined();

    // Import should not throw
    expect(() => cacheService.importCache(exported)).not.toThrow();
  });
});
