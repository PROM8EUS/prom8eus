/**
 * Performance Tests for Source Loading and Caching
 * 
 * This test suite covers performance testing for source operations including
 * loading, caching, data processing, and system performance under load.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WorkflowIndexer } from '../workflowIndexer';
import { performanceMetrics } from '../performanceMetrics';
import { fallbackSystem } from '../fallbackSystem';
import { sourceConfigManager } from '../sourceConfigManager';
import { dataValidationEngine } from '../dataValidationSystem';
import { usageAnalytics } from '../usageAnalytics';
import { securityCompliance } from '../securityCompliance';

describe('Source Performance Tests', () => {
  let workflowIndexer: WorkflowIndexer;

  beforeEach(() => {
    workflowIndexer = new WorkflowIndexer();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Source Loading Performance', () => {
    it('should load large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `workflow-${i}`,
        name: `Workflow ${i}`,
        description: `Description for workflow ${i}`,
        category: 'automation',
        tags: ['test', 'performance'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: Math.floor(Math.random() * 1000),
        quality: Math.random(),
        complexity: 'medium',
        status: 'active'
      }));

      const startTime = Date.now();
      
      // Process large dataset
      const qualityScores = largeDataset.map(item => 
        workflowIndexer.calculateSourceQuality(item)
      );
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(qualityScores).toHaveLength(10000);
      expect(processingTime).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(qualityScores.every(score => score >= 0 && score <= 1)).toBe(true);
    });

    it('should handle concurrent source loading', async () => {
      const sources = Array.from({ length: 100 }, (_, i) => ({
        id: `source-${i}`,
        name: `Source ${i}`,
        type: 'api',
        endpoint: `https://source${i}.example.com`,
        credentials: [],
        rateLimits: [],
        isActive: true
      }));

      const startTime = Date.now();

      // Add sources concurrently
      const addPromises = sources.map(source => 
        Promise.resolve(sourceConfigManager.addSource(source))
      );
      
      await Promise.all(addPromises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete in less than 1 second
      
      // Verify all sources were added
      const allSources = sourceConfigManager.getAllSources();
      expect(allSources).toHaveLength(100);
    });

    it('should handle rapid sequential operations', async () => {
      const operations = Array.from({ length: 1000 }, (_, i) => ({
        sourceId: `source-${i % 10}`,
        operation: 'test_operation',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: 1024
      }));

      const startTime = Date.now();

      // Record metrics sequentially
      operations.forEach(op => {
        performanceMetrics.recordMetric(op);
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // Should complete in less than 2 seconds
      
      // Verify metrics were recorded
      const allStats = performanceMetrics.getAllSourcesStats();
      expect(allStats.totalRequests).toBe(1000);
    });
  });

  describe('Caching Performance', () => {
    it('should cache and retrieve data efficiently', () => {
      const testData = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        data: `data-${i}`,
        timestamp: Date.now()
      }));

      const startTime = Date.now();

      // Cache all items
      testData.forEach((item, index) => {
        workflowIndexer.setToSmartCache(`key-${index}`, item, 60000);
      });

      const cacheTime = Date.now();
      const cacheDuration = cacheTime - startTime;

      // Retrieve all items
      const retrievedData = testData.map((_, index) => 
        workflowIndexer.getFromSmartCache(`key-${index}`)
      );

      const endTime = Date.now();
      const retrievalDuration = endTime - cacheTime;
      const totalDuration = endTime - startTime;

      expect(cacheDuration).toBeLessThan(1000); // Caching should be fast
      expect(retrievalDuration).toBeLessThan(500); // Retrieval should be very fast
      expect(totalDuration).toBeLessThan(1500); // Total should be under 1.5 seconds
      expect(retrievedData.every(item => item !== null)).toBe(true);
    });

    it('should handle cache eviction efficiently', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => 
        `large-data-item-${i}-${'x'.repeat(1000)}`
      );

      const startTime = Date.now();

      // Fill cache with large items
      largeData.forEach((data, index) => {
        workflowIndexer.setToSmartCache(`large-key-${index}`, data, 60000);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000); // Should handle large data efficiently
      
      // Check cache statistics
      const cacheStats = workflowIndexer.getCacheStats();
      expect(cacheStats.entryCount).toBeGreaterThan(0);
      expect(cacheStats.totalSize).toBeGreaterThan(0);
    });

    it('should handle cache compression efficiently', () => {
      const compressibleData = Array.from({ length: 100 }, (_, i) => ({
        id: `compressible-${i}`,
        data: 'x'.repeat(10000), // Highly compressible data
        metadata: { index: i, type: 'test' }
      }));

      const startTime = Date.now();

      // Cache compressible data
      compressibleData.forEach((data, index) => {
        workflowIndexer.setToSmartCache(`compressible-key-${index}`, data, 60000);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should compress efficiently
      
      // Verify data integrity
      const retrievedData = compressibleData.map((_, index) => 
        workflowIndexer.getFromSmartCache(`compressible-key-${index}`)
      );
      
      expect(retrievedData.every(item => item !== null)).toBe(true);
      expect(retrievedData[0].data).toBe('x'.repeat(10000));
    });
  });

  describe('Data Processing Performance', () => {
    it('should process metadata validation efficiently', () => {
      const testData = Array.from({ length: 5000 }, (_, i) => ({
        id: `workflow-${i}`,
        name: `Workflow ${i}`,
        description: `Description for workflow ${i}`,
        category: 'automation',
        tags: ['test', 'performance'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: Math.floor(Math.random() * 1000),
        quality: Math.random(),
        complexity: 'medium',
        status: 'active'
      }));

      const startTime = Date.now();

      // Validate all data
      const validationResults = testData.map(item => 
        dataValidationEngine.validateData('test-source', 'workflow', item)
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000); // Should validate 5000 items in under 3 seconds
      expect(validationResults).toHaveLength(5000);
      expect(validationResults.every(result => result.isValid)).toBe(true);
    });

    it('should handle deduplication efficiently', () => {
      const duplicateData = Array.from({ length: 2000 }, (_, i) => ({
        id: `workflow-${i}`,
        name: `Duplicate Workflow ${i % 100}`, // 100 unique names, 20 duplicates each
        description: `Description for workflow ${i}`,
        category: 'automation',
        tags: ['test', 'duplicate'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: Math.floor(Math.random() * 1000),
        quality: Math.random(),
        complexity: 'medium',
        status: 'active'
      }));

      const startTime = Date.now();

      // Detect duplicates
      const duplicates = deduplicationSystem.detectDuplicates(duplicateData, 'workflow');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should detect duplicates in under 5 seconds
      expect(duplicates.length).toBeGreaterThan(0); // Should find duplicates
      expect(duplicates.every(group => group.items.length > 1)).toBe(true);
    });

    it('should handle quality scoring efficiently', () => {
      const testData = Array.from({ length: 10000 }, (_, i) => ({
        id: `workflow-${i}`,
        name: `Workflow ${i}`,
        description: `Description for workflow ${i}`,
        category: 'automation',
        tags: ['test', 'quality'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: Math.floor(Math.random() * 1000),
        quality: Math.random(),
        complexity: 'medium',
        status: 'active'
      }));

      const startTime = Date.now();

      // Calculate quality scores
      const qualityScores = testData.map(item => 
        workflowIndexer.calculateSourceQuality(item)
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should score 10000 items in under 2 seconds
      expect(qualityScores).toHaveLength(10000);
      expect(qualityScores.every(score => score >= 0 && score <= 1)).toBe(true);
    });
  });

  describe('System Performance Under Load', () => {
    it('should handle high concurrent user load', async () => {
      const concurrentUsers = 100;
      const operationsPerUser = 10;

      const startTime = Date.now();

      // Simulate concurrent users
      const userPromises = Array.from({ length: concurrentUsers }, (_, userIndex) => 
        Promise.all(Array.from({ length: operationsPerUser }, (_, opIndex) => 
          Promise.resolve(performanceMetrics.recordMetric({
            sourceId: `source-${userIndex}`,
            operation: `operation-${opIndex}`,
            startTime: Date.now() - 1000,
            endTime: Date.now(),
            success: true,
            dataSize: 1024
          }))
        ))
      );

      await Promise.all(userPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should handle 1000 operations in under 5 seconds
      
      // Verify all operations were recorded
      const allStats = performanceMetrics.getAllSourcesStats();
      expect(allStats.totalRequests).toBe(concurrentUsers * operationsPerUser);
    });

    it('should handle rapid authentication requests', async () => {
      const authRequests = 500;

      const startTime = Date.now();

      // Simulate rapid authentication requests
      const authPromises = Array.from({ length: authRequests }, (_, i) => 
        securityCompliance.authenticate({
          username: 'admin',
          password: 'admin123'
        })
      );

      const results = await Promise.all(authPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000); // Should handle 500 auth requests in under 10 seconds
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should handle high-frequency cache operations', () => {
      const cacheOperations = 10000;

      const startTime = Date.now();

      // Simulate high-frequency cache operations
      for (let i = 0; i < cacheOperations; i++) {
        const key = `perf-key-${i}`;
        const data = { id: i, data: `data-${i}` };
        
        workflowIndexer.setToSmartCache(key, data, 60000);
        workflowIndexer.getFromSmartCache(key);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should handle 10000 operations in under 5 seconds
      
      // Verify cache statistics
      const cacheStats = workflowIndexer.getCacheStats();
      expect(cacheStats.entryCount).toBeGreaterThan(0);
    });

    it('should handle memory pressure efficiently', () => {
      const memoryIntensiveData = Array.from({ length: 1000 }, (_, i) => ({
        id: `memory-item-${i}`,
        data: 'x'.repeat(10000), // 10KB per item
        metadata: {
          largeArray: Array.from({ length: 1000 }, (_, j) => `item-${j}`),
          timestamp: Date.now()
        }
      }));

      const startTime = Date.now();

      // Process memory-intensive data
      memoryIntensiveData.forEach((item, index) => {
        workflowIndexer.setToSmartCache(`memory-key-${index}`, item, 60000);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000); // Should handle 10MB of data in under 10 seconds
      
      // Verify data integrity
      const retrievedData = workflowIndexer.getFromSmartCache('memory-key-0');
      expect(retrievedData).not.toBeNull();
      expect(retrievedData.data).toBe('x'.repeat(10000));
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics accurately', () => {
      const testOperations = Array.from({ length: 100 }, (_, i) => ({
        sourceId: `source-${i % 10}`,
        operation: 'test_operation',
        startTime: Date.now() - (1000 + i * 10), // Varying response times
        endTime: Date.now(),
        success: i % 10 !== 0, // 90% success rate
        dataSize: 1024 + i * 100
      }));

      // Record all operations
      testOperations.forEach(op => {
        performanceMetrics.recordMetric(op);
      });

      // Check aggregated statistics
      const allStats = performanceMetrics.getAllSourcesStats();
      expect(allStats.totalRequests).toBe(100);
      expect(allStats.successfulRequests).toBe(90);
      expect(allStats.failedRequests).toBe(10);
      expect(allStats.successRate).toBe(0.9);
      expect(allStats.averageResponseTime).toBeGreaterThan(0);
    });

    it('should generate performance reports efficiently', () => {
      // Record some test data
      Array.from({ length: 1000 }, (_, i) => ({
        sourceId: `source-${i % 5}`,
        operation: 'test_operation',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: 1024
      })).forEach(op => {
        performanceMetrics.recordMetric(op);
      });

      const startTime = Date.now();

      // Generate performance report
      const report = performanceMetrics.getPerformanceReport();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should generate report in under 1 second
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('sources');
      expect(report).toHaveProperty('operations');
      expect(report).toHaveProperty('trends');
    });

    it('should handle performance benchmarking', () => {
      const sources = ['source-1', 'source-2', 'source-3'];
      const operations = ['operation-1', 'operation-2'];

      const startTime = Date.now();

      // Run benchmarking
      const benchmarkResults = performanceMetrics.runBenchmarking(sources, operations);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete benchmarking in under 2 seconds
      expect(benchmarkResults).toHaveProperty('sources');
      expect(benchmarkResults).toHaveProperty('operations');
      expect(benchmarkResults).toHaveProperty('summary');
    });
  });

  describe('Stress Testing', () => {
    it('should handle extreme load conditions', async () => {
      const extremeLoad = 10000;
      const startTime = Date.now();

      // Simulate extreme load
      const loadPromises = Array.from({ length: extremeLoad }, (_, i) => 
        Promise.resolve(performanceMetrics.recordMetric({
          sourceId: `stress-source-${i % 100}`,
          operation: `stress-operation-${i % 10}`,
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          success: Math.random() > 0.1, // 90% success rate
          dataSize: Math.floor(Math.random() * 10000)
        }))
      );

      await Promise.all(loadPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(15000); // Should handle 10000 operations in under 15 seconds
      
      // Verify system stability
      const allStats = performanceMetrics.getAllSourcesStats();
      expect(allStats.totalRequests).toBe(extremeLoad);
    });

    it('should handle memory exhaustion gracefully', () => {
      const memoryExhaustionData = Array.from({ length: 10000 }, (_, i) => ({
        id: `exhaustion-item-${i}`,
        data: 'x'.repeat(100000), // 100KB per item
        metadata: {
          largeArray: Array.from({ length: 10000 }, (_, j) => `item-${j}`),
          timestamp: Date.now()
        }
      }));

      const startTime = Date.now();

      // Try to process memory-exhaustive data
      let processedCount = 0;
      try {
        memoryExhaustionData.forEach((item, index) => {
          workflowIndexer.setToSmartCache(`exhaustion-key-${index}`, item, 60000);
          processedCount++;
        });
      } catch (error) {
        // System should handle memory pressure gracefully
        expect(error).toBeDefined();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(30000); // Should handle gracefully in under 30 seconds
      expect(processedCount).toBeGreaterThan(0); // Should process some data
    });

    it('should handle rapid system state changes', async () => {
      const stateChanges = 1000;
      const startTime = Date.now();

      // Simulate rapid state changes
      const statePromises = Array.from({ length: stateChanges }, (_, i) => 
        Promise.resolve(sourceConfigManager.addSource({
          id: `state-source-${i}`,
          name: `State Source ${i}`,
          type: 'api',
          endpoint: `https://state${i}.example.com`,
          credentials: [],
          rateLimits: [],
          isActive: true
        }))
      );

      await Promise.all(statePromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should handle 1000 state changes in under 5 seconds
      
      // Verify system consistency
      const allSources = sourceConfigManager.getAllSources();
      expect(allSources.length).toBeGreaterThanOrEqual(stateChanges);
    });
  });
});
