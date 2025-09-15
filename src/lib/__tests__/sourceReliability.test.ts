/**
 * Reliability and Stress Tests for Source Management
 * 
 * This test suite covers reliability testing, stress testing, and failure
 * recovery scenarios for the source management system.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WorkflowIndexer } from '../workflowIndexer';
import { performanceMetrics } from '../performanceMetrics';
import { fallbackSystem } from '../fallbackSystem';
import { sourceConfigManager } from '../sourceConfigManager';
import { dataValidationEngine } from '../dataValidationSystem';
import { usageAnalytics } from '../usageAnalytics';
import { securityCompliance } from '../securityCompliance';

describe('Source Reliability and Stress Tests', () => {
  let workflowIndexer: WorkflowIndexer;

  beforeEach(() => {
    workflowIndexer = new WorkflowIndexer();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('System Reliability', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const startTime = Date.now();
      
      try {
        await workflowIndexer.getSourceHealthStatus('test-source');
      } catch (error) {
        // Should handle network errors gracefully
        expect(error).toBeDefined();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should fail fast
    });

    it('should recover from temporary failures', async () => {
      let callCount = 0;
      
      // Mock temporary failure that recovers after 3 attempts
      jest.spyOn(global, 'fetch').mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy' })
        } as Response);
      });

      const startTime = Date.now();
      
      // Should eventually succeed
      let healthStatus;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        try {
          healthStatus = await workflowIndexer.getSourceHealthStatus('test-source');
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(healthStatus).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should recover within 10 seconds
      expect(callCount).toBe(4); // Should have made 4 calls (3 failures + 1 success)
    });

    it('should handle database connection failures', async () => {
      // Mock database failure
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const startTime = Date.now();
      
      try {
        // Simulate database operation that fails
        await sourceConfigManager.addSource({
          id: 'db-fail-source',
          name: 'DB Fail Source',
          type: 'api',
          endpoint: 'https://dbfail.example.com',
          credentials: [],
          rateLimits: [],
          isActive: true
        });
      } catch (error) {
        // Should handle database errors gracefully
        expect(error).toBeDefined();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000); // Should fail fast
    });

    it('should handle memory leaks gracefully', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate memory-intensive operations
      for (let i = 0; i < 1000; i++) {
        const largeData = {
          id: `memory-test-${i}`,
          data: 'x'.repeat(10000),
          metadata: Array.from({ length: 1000 }, (_, j) => `item-${j}`)
        };
        
        workflowIndexer.setToSmartCache(`memory-key-${i}`, largeData, 60000);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should handle concurrent access safely', async () => {
      const concurrentOperations = 100;
      const sharedResource = { counter: 0 };

      const startTime = Date.now();

      // Simulate concurrent access to shared resource
      const promises = Array.from({ length: concurrentOperations }, (_, i) => 
        Promise.resolve(() => {
          // Simulate some work
          const currentValue = sharedResource.counter;
          sharedResource.counter = currentValue + 1;
          
          // Record performance metric
          performanceMetrics.recordMetric({
            sourceId: `concurrent-source-${i}`,
            operation: 'concurrent_operation',
            startTime: Date.now() - 100,
            endTime: Date.now(),
            success: true,
            dataSize: 1024
          });
        })
      );

      await Promise.all(promises.map(p => p()));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(sharedResource.counter).toBe(concurrentOperations);
    });
  });

  describe('Stress Testing', () => {
    it('should handle extreme data volumes', () => {
      const extremeData = Array.from({ length: 100000 }, (_, i) => ({
        id: `extreme-item-${i}`,
        name: `Extreme Item ${i}`,
        description: `Description for extreme item ${i}`,
        category: 'stress_test',
        tags: ['stress', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: Math.floor(Math.random() * 1000),
        quality: Math.random(),
        complexity: 'medium',
        status: 'active'
      }));

      const startTime = Date.now();

      // Process extreme data volume
      const qualityScores = extremeData.map(item => 
        workflowIndexer.calculateSourceQuality(item)
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(30000); // Should handle 100k items in under 30 seconds
      expect(qualityScores).toHaveLength(100000);
      expect(qualityScores.every(score => score >= 0 && score <= 1)).toBe(true);
    });

    it('should handle rapid state changes', async () => {
      const rapidChanges = 1000;
      const startTime = Date.now();

      // Simulate rapid state changes
      const changePromises = Array.from({ length: rapidChanges }, (_, i) => 
        Promise.resolve(() => {
          // Add source
          sourceConfigManager.addSource({
            id: `rapid-source-${i}`,
            name: `Rapid Source ${i}`,
            type: 'api',
            endpoint: `https://rapid${i}.example.com`,
            credentials: [],
            rateLimits: [],
            isActive: true
          });

          // Record metric
          performanceMetrics.recordMetric({
            sourceId: `rapid-source-${i}`,
            operation: 'rapid_change',
            startTime: Date.now() - 100,
            endTime: Date.now(),
            success: true,
            dataSize: 1024
          });

          // Track usage
          usageAnalytics.trackEvent({
            userId: `user-${i}`,
            sourceId: `rapid-source-${i}`,
            action: 'rapid_change',
            resourceId: `resource-${i}`,
            timestamp: new Date(),
            metadata: { change: i }
          });
        })
      );

      await Promise.all(changePromises.map(p => p()));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000); // Should handle 1000 changes in under 10 seconds
    });

    it('should handle high-frequency operations', () => {
      const highFrequencyOps = 50000;
      const startTime = Date.now();

      // Simulate high-frequency operations
      for (let i = 0; i < highFrequencyOps; i++) {
        const key = `hf-key-${i}`;
        const data = { id: i, data: `data-${i}` };
        
        // Cache operation
        workflowIndexer.setToSmartCache(key, data, 60000);
        
        // Retrieve operation
        workflowIndexer.getFromSmartCache(key);
        
        // Record metric
        performanceMetrics.recordMetric({
          sourceId: `hf-source-${i % 100}`,
          operation: 'high_frequency',
          startTime: Date.now() - 10,
          endTime: Date.now(),
          success: true,
          dataSize: 1024
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(20000); // Should handle 50k operations in under 20 seconds
    });

    it('should handle resource exhaustion', async () => {
      const resourceExhaustion = 10000;
      const startTime = Date.now();

      // Simulate resource exhaustion
      const exhaustionPromises = Array.from({ length: resourceExhaustion }, (_, i) => 
        Promise.resolve(() => {
          // Create large data structures
          const largeData = {
            id: `exhaustion-${i}`,
            data: 'x'.repeat(10000),
            metadata: Array.from({ length: 1000 }, (_, j) => `item-${j}`),
            nested: {
              level1: {
                level2: {
                  level3: Array.from({ length: 100 }, (_, k) => `nested-${k}`)
                }
              }
            }
          };

          // Cache large data
          workflowIndexer.setToSmartCache(`exhaustion-key-${i}`, largeData, 60000);

          // Record metric
          performanceMetrics.recordMetric({
            sourceId: `exhaustion-source-${i}`,
            operation: 'resource_exhaustion',
            startTime: Date.now() - 1000,
            endTime: Date.now(),
            success: true,
            dataSize: JSON.stringify(largeData).length
          });
        })
      );

      await Promise.all(exhaustionPromises.map(p => p()));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(60000); // Should handle resource exhaustion in under 60 seconds
    });
  });

  describe('Failure Recovery', () => {
    it('should recover from cache corruption', () => {
      // Simulate cache corruption
      const corruptedData = { corrupted: true, data: null };
      workflowIndexer.setToSmartCache('corrupted-key', corruptedData, 60000);

      const startTime = Date.now();

      // Try to retrieve corrupted data
      const retrievedData = workflowIndexer.getFromSmartCache('corrupted-key');
      
      // System should handle corruption gracefully
      if (retrievedData && retrievedData.corrupted) {
        // Clear corrupted cache entry
        workflowIndexer.clearCacheForSource('corrupted-key');
        
        // Set fresh data
        const freshData = { id: 'fresh-data', data: 'clean data' };
        workflowIndexer.setToSmartCache('corrupted-key', freshData, 60000);
        
        // Verify recovery
        const recoveredData = workflowIndexer.getFromSmartCache('corrupted-key');
        expect(recoveredData).toEqual(freshData);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should recover quickly
    });

    it('should recover from authentication failures', async () => {
      const startTime = Date.now();

      // Simulate authentication failure
      const authResult = await securityCompliance.authenticate({
        username: 'invalid-user',
        password: 'invalid-password'
      });

      expect(authResult.success).toBe(false);

      // Try to recover with valid credentials
      const recoveryResult = await securityCompliance.authenticate({
        username: 'admin',
        password: 'admin123'
      });

      expect(recoveryResult.success).toBe(true);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should recover quickly
    });

    it('should recover from rate limiting', () => {
      const identifier = 'rate-limit-test';
      
      // Exceed rate limit
      for (let i = 0; i < 15; i++) {
        securityCompliance.isRateLimited(identifier);
      }

      // Should be rate limited
      expect(securityCompliance.isRateLimited(identifier)).toBe(true);

      const startTime = Date.now();

      // Wait for rate limit reset
      setTimeout(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should recover after rate limit window
        expect(securityCompliance.isRateLimited(identifier)).toBe(false);
        expect(duration).toBeGreaterThan(60000); // Should wait for rate limit window
      }, 61000);
    });

    it('should recover from data validation failures', () => {
      const invalidData = {
        id: null, // Invalid ID
        name: '', // Empty name
        description: undefined, // Missing description
        category: 'invalid-category', // Invalid category
        tags: 'not-an-array', // Invalid tags format
        integrations: null, // Invalid integrations
        lastModified: 'not-a-date', // Invalid date
        analyzedAt: new Date(),
        views: -1, // Invalid views
        quality: 1.5, // Invalid quality (should be 0-1)
        complexity: 'invalid-complexity', // Invalid complexity
        status: 'invalid-status' // Invalid status
      };

      const startTime = Date.now();

      // Try to validate invalid data
      const validationResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        invalidData
      );

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);

      // Fix the data
      const fixedData = {
        id: 'fixed-workflow',
        name: 'Fixed Workflow',
        description: 'Fixed description',
        category: 'automation',
        tags: ['fixed', 'workflow'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      // Validate fixed data
      const fixedValidationResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        fixedData
      );

      expect(fixedValidationResult.isValid).toBe(true);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should recover quickly
    });
  });

  describe('System Stability', () => {
    it('should maintain stability under continuous load', async () => {
      const continuousLoadDuration = 10000; // 10 seconds
      const startTime = Date.now();
      let operationCount = 0;

      // Simulate continuous load
      const loadInterval = setInterval(() => {
        if (Date.now() - startTime >= continuousLoadDuration) {
          clearInterval(loadInterval);
          return;
        }

        // Perform various operations
        performanceMetrics.recordMetric({
          sourceId: `continuous-source-${operationCount % 10}`,
          operation: 'continuous_load',
          startTime: Date.now() - 100,
          endTime: Date.now(),
          success: true,
          dataSize: 1024
        });

        usageAnalytics.trackEvent({
          userId: `user-${operationCount % 100}`,
          sourceId: `continuous-source-${operationCount % 10}`,
          action: 'continuous_load',
          resourceId: `resource-${operationCount}`,
          timestamp: new Date(),
          metadata: { operation: operationCount }
        });

        operationCount++;
      }, 10); // Every 10ms

      // Wait for load to complete
      await new Promise(resolve => setTimeout(resolve, continuousLoadDuration + 100));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeGreaterThanOrEqual(continuousLoadDuration);
      expect(operationCount).toBeGreaterThan(0);

      // Verify system is still stable
      const allStats = performanceMetrics.getAllSourcesStats();
      expect(allStats.totalRequests).toBeGreaterThan(0);
    });

    it('should handle memory pressure gracefully', () => {
      const memoryPressure = 1000;
      const startTime = Date.now();

      // Simulate memory pressure
      for (let i = 0; i < memoryPressure; i++) {
        const memoryIntensiveData = {
          id: `memory-pressure-${i}`,
          data: 'x'.repeat(50000), // 50KB per item
          metadata: {
            largeArray: Array.from({ length: 5000 }, (_, j) => `item-${j}`),
            timestamp: Date.now()
          }
        };

        workflowIndexer.setToSmartCache(`memory-pressure-key-${i}`, memoryIntensiveData, 60000);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(30000); // Should handle memory pressure in under 30 seconds

      // Verify system is still functional
      const cacheStats = workflowIndexer.getCacheStats();
      expect(cacheStats.entryCount).toBeGreaterThan(0);
    });

    it('should handle concurrent failures gracefully', async () => {
      const concurrentFailures = 100;
      const startTime = Date.now();

      // Simulate concurrent failures
      const failurePromises = Array.from({ length: concurrentFailures }, (_, i) => 
        Promise.resolve(() => {
          try {
            // Simulate various failure scenarios
            if (i % 3 === 0) {
              throw new Error('Network failure');
            } else if (i % 3 === 1) {
              throw new Error('Authentication failure');
            } else {
              throw new Error('Data validation failure');
            }
          } catch (error) {
            // Record failure metrics
            performanceMetrics.recordMetric({
              sourceId: `failure-source-${i}`,
              operation: 'concurrent_failure',
              startTime: Date.now() - 100,
              endTime: Date.now(),
              success: false,
              dataSize: 0
            });
          }
        })
      );

      await Promise.all(failurePromises.map(p => p()));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should handle concurrent failures in under 5 seconds

      // Verify failure metrics were recorded
      const allStats = performanceMetrics.getAllSourcesStats();
      expect(allStats.failedRequests).toBe(concurrentFailures);
    });
  });
});
