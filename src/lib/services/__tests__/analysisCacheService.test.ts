/**
 * Tests for AnalysisCacheService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalysisCacheService } from '../analysisCacheService';
import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';

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

describe('AnalysisCacheService', () => {
  let cacheService: AnalysisCacheService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    localStorageMock.getItem.mockReturnValue(null);
    cacheService = new AnalysisCacheService();
    vi.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should set and get cached data', async () => {
      const testData = { test: 'data' };
      const key = 'test-key';
      const type = 'test-type';

      await cacheService.set(key, type, testData);
      const result = await cacheService.get(key, type);

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent', 'test-type');
      expect(result).toBeNull();
    });

    it('should handle different data types', async () => {
      const stringData = 'test string';
      const numberData = 42;
      const arrayData = [1, 2, 3];
      const objectData = { key: 'value' };

      await cacheService.set('string-key', 'string', stringData);
      await cacheService.set('number-key', 'number', numberData);
      await cacheService.set('array-key', 'array', arrayData);
      await cacheService.set('object-key', 'object', objectData);

      expect(await cacheService.get('string-key', 'string')).toEqual(stringData);
      expect(await cacheService.get('number-key', 'number')).toEqual(numberData);
      expect(await cacheService.get('array-key', 'array')).toEqual(arrayData);
      expect(await cacheService.get('object-key', 'object')).toEqual(objectData);
    });
  });

  describe('Subtask Caching', () => {
    it('should cache and retrieve subtasks', async () => {
      const mockSubtasks: DynamicSubtask[] = [
        {
          id: 'subtask-1',
          title: 'Test Subtask',
          description: 'Test Description',
          systems: ['System A'],
          aiTools: ['Tool A'],
          selectedTools: [],
          manualHoursShare: 0.5,
          automationPotential: 0.7,
          risks: ['Risk A'],
          assumptions: ['Assumption A'],
          kpis: ['KPI A'],
          qualityGates: ['Gate A']
        }
      ];

      const taskText = 'Test task description';

      await cacheService.cacheSubtasks(taskText, mockSubtasks);
      const result = await cacheService.getCachedSubtasks(taskText);

      expect(result).toEqual(mockSubtasks);
    });
  });

  describe('Workflow Caching', () => {
    it('should cache and retrieve workflows', async () => {
      const mockWorkflows: UnifiedWorkflow[] = [
        {
          id: 'workflow-1',
          title: 'Test Workflow',
          description: 'Test Description',
          automationPotential: 75,
          complexity: 'medium',
          estimatedTime: '2 hours',
          systems: ['System A'],
          benefits: ['Benefit A'],
          steps: [
            {
              id: 'step-1',
              title: 'Step 1',
              description: 'Step Description',
              estimatedTime: 30,
              prerequisites: [],
              tools_required: ['Tool A']
            }
          ],
          metadata: {
            created: new Date(),
            version: '1.0',
            source: 'test'
          }
        }
      ];

      const taskId = 'task-1';
      const subtaskId = 'subtask-1';

      await cacheService.cacheWorkflows(taskId, subtaskId, mockWorkflows);
      const result = await cacheService.getCachedWorkflows(taskId, subtaskId);

      expect(result).toEqual(mockWorkflows);
    });

    it('should handle workflows without subtask ID', async () => {
      const mockWorkflows: UnifiedWorkflow[] = [
        {
          id: 'workflow-1',
          title: 'Test Workflow',
          description: 'Test Description',
          automationPotential: 75,
          complexity: 'medium',
          estimatedTime: '2 hours',
          systems: ['System A'],
          benefits: ['Benefit A'],
          steps: [],
          metadata: {
            created: new Date(),
            version: '1.0',
            source: 'test'
          }
        }
      ];

      const taskId = 'task-1';

      await cacheService.cacheWorkflows(taskId, null, mockWorkflows);
      const result = await cacheService.getCachedWorkflows(taskId, null);

      expect(result).toEqual(mockWorkflows);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      await cacheService.set('key1', 'type1', 'data1');
      await cacheService.set('key2', 'type2', 'data2');

      const stats = cacheService.getStats();

      expect(stats.totalEntries).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.hitRate).toBe(0); // No hits yet
    });

    it('should clear cache by type', async () => {
      await cacheService.set('key1', 'type1', 'data1');
      await cacheService.set('key2', 'type2', 'data2');

      await cacheService.clear('type1');

      expect(await cacheService.get('key1', 'type1')).toBeNull();
      expect(await cacheService.get('key2', 'type2')).toEqual('data2');
    });

    it('should clear all cache', async () => {
      await cacheService.set('key1', 'type1', 'data1');
      await cacheService.set('key2', 'type2', 'data2');

      await cacheService.clear();

      expect(await cacheService.get('key1', 'type1')).toBeNull();
      expect(await cacheService.get('key2', 'type2')).toBeNull();
    });
  });

  describe('Export/Import', () => {
    it('should export and import cache data', async () => {
      await cacheService.set('key1', 'type1', 'data1');
      await cacheService.set('key2', 'type2', 'data2');

      const exported = cacheService.exportCache();
      expect(exported.entries.length).toBe(2);
      expect(exported.version).toBe('v2');

      // Create new instance and import
      const newCacheService = new AnalysisCacheService();
      newCacheService.importCache(exported);

      expect(await newCacheService.get('key1', 'type1')).toEqual('data1');
      expect(await newCacheService.get('key2', 'type2')).toEqual('data2');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      await cacheService.set('key', 'type', 'data');
      expect(true).toBe(true); // Test passes if no error thrown
    });

    it('should handle localStorage read errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage read error');
      });

      // Should not throw
      const result = await cacheService.get('key', 'type');
      expect(result).toBeNull();
    });
  });
});
