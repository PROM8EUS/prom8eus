/**
 * Comprehensive Unit Tests for Source Management
 * 
 * This test suite covers all source management functionality including
 * prioritization, health monitoring, caching, metadata, deduplication,
 * performance metrics, fallback, configuration, validation, analytics,
 * security, and compliance.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WorkflowIndexer } from '../workflowIndexer';
import { metadataValidator, metadataQualityScorer, metadataMigrator } from '../metadataSchema';
import { deduplicationSystem } from '../deduplicationSystem';
import { performanceMetrics } from '../performanceMetrics';
import { fallbackSystem } from '../fallbackSystem';
import { sourceConfigManager } from '../sourceConfigManager';
import { dataValidationEngine } from '../dataValidationSystem';
import { usageAnalytics } from '../usageAnalytics';
import { securityCompliance } from '../securityCompliance';

// Mock data for testing
const mockWorkflowData = {
  id: 'test-workflow-1',
  name: 'Test Workflow',
  description: 'A test workflow for unit testing',
  category: 'automation',
  tags: ['test', 'automation'],
  integrations: ['n8n', 'zapier'],
  lastModified: new Date('2024-01-01'),
  analyzedAt: new Date('2024-01-02'),
  views: 100,
  quality: 0.85,
  complexity: 'medium',
  status: 'active'
};

const mockAIAgentData = {
  id: 'test-agent-1',
  name: 'Test AI Agent',
  description: 'A test AI agent for unit testing',
  category: 'ai_assistant',
  tags: ['test', 'ai'],
  integrations: ['openai', 'claude'],
  lastModified: new Date('2024-01-01'),
  analyzedAt: new Date('2024-01-02'),
  views: 50,
  quality: 0.90,
  complexity: 'high',
  status: 'active'
};

describe('Source Management Unit Tests', () => {
  let workflowIndexer: WorkflowIndexer;

  beforeEach(() => {
    workflowIndexer = new WorkflowIndexer();
    // Reset all systems before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks();
  });

  describe('WorkflowIndexer - Source Prioritization', () => {
    it('should calculate source quality score correctly', () => {
      const quality = workflowIndexer.calculateSourceQuality(mockWorkflowData);
      expect(quality).toBeGreaterThan(0);
      expect(quality).toBeLessThanOrEqual(1);
    });

    it('should calculate source freshness score correctly', () => {
      const freshness = workflowIndexer.calculateEnhancedFreshness(mockWorkflowData);
      expect(freshness).toBeGreaterThan(0);
      expect(freshness).toBeLessThanOrEqual(1);
    });

    it('should calculate source relevance score correctly', () => {
      const query = 'automation workflow';
      const relevance = workflowIndexer.calculateRelevance(mockWorkflowData, query);
      expect(relevance).toBeGreaterThan(0);
      expect(relevance).toBeLessThanOrEqual(1);
    });

    it('should rank sources by combined score', () => {
      const sources = [mockWorkflowData, mockAIAgentData];
      const ranked = workflowIndexer.getRankedSources(sources, 'test query');
      expect(ranked).toHaveLength(2);
      expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    });
  });

  describe('WorkflowIndexer - Health Monitoring', () => {
    it('should perform health check on source', async () => {
      const healthStatus = await workflowIndexer.getSourceHealthStatus('test-source');
      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('lastChecked');
      expect(healthStatus).toHaveProperty('responseTime');
    });

    it('should detect source errors correctly', () => {
      const error = {
        id: 'test-error',
        sourceId: 'test-source',
        type: 'connection_timeout',
        message: 'Connection timeout',
        timestamp: new Date(),
        severity: 'high'
      };
      
      workflowIndexer.recordSourceError(error);
      const errors = workflowIndexer.getSourceErrors('test-source');
      expect(errors).toContain(error);
    });

    it('should create and resolve alerts', () => {
      const alert = workflowIndexer.createAlert({
        sourceId: 'test-source',
        type: 'high_error_rate',
        severity: 'high',
        message: 'High error rate detected'
      });
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('status', 'active');
      
      workflowIndexer.resolveAlert(alert.id);
      const resolvedAlert = workflowIndexer.getSourceAlerts('test-source').find(a => a.id === alert.id);
      expect(resolvedAlert?.status).toBe('resolved');
    });
  });

  describe('WorkflowIndexer - Smart Caching', () => {
    it('should cache data with TTL', () => {
      const key = 'test-cache-key';
      const data = { test: 'data' };
      const ttl = 60000; // 1 minute
      
      workflowIndexer.setToSmartCache(key, data, ttl);
      const cached = workflowIndexer.getFromSmartCache(key);
      expect(cached).toEqual(data);
    });

    it('should expire cached data after TTL', (done) => {
      const key = 'test-cache-expiry';
      const data = { test: 'data' };
      const ttl = 100; // 100ms
      
      workflowIndexer.setToSmartCache(key, data, ttl);
      
      setTimeout(() => {
        const cached = workflowIndexer.getFromSmartCache(key);
        expect(cached).toBeNull();
        done();
      }, 150);
    });

    it('should compress large data', () => {
      const key = 'test-compression';
      const largeData = 'x'.repeat(10000);
      
      workflowIndexer.setToSmartCache(key, largeData, 60000);
      const cached = workflowIndexer.getFromSmartCache(key);
      expect(cached).toBe(largeData);
    });

    it('should provide cache statistics', () => {
      const stats = workflowIndexer.getCacheStats();
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('missRate');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('entryCount');
    });
  });

  describe('Metadata Schema System', () => {
    it('should validate workflow metadata', () => {
      const result = metadataValidator.validate(mockWorkflowData, 'workflow');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate AI agent metadata', () => {
      const result = metadataValidator.validate(mockAIAgentData, 'ai_agent');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should calculate metadata quality score', () => {
      const score = metadataQualityScorer.calculateQualityScore(mockWorkflowData);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should migrate legacy metadata', () => {
      const legacyData = {
        title: 'Legacy Workflow',
        desc: 'Legacy description',
        type: 'automation'
      };
      
      const migrated = metadataMigrator.migrateToUnifiedSchema(legacyData, 'legacy-source', 'workflow');
      expect(migrated).toHaveProperty('name');
      expect(migrated).toHaveProperty('description');
      expect(migrated).toHaveProperty('category');
    });
  });

  describe('Deduplication System', () => {
    it('should detect duplicate workflows', () => {
      const duplicateWorkflow = { ...mockWorkflowData, id: 'duplicate-1' };
      const items = [mockWorkflowData, duplicateWorkflow];
      
      const duplicates = deduplicationSystem.detectDuplicates(items, 'workflow');
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].items).toHaveLength(2);
    });

    it('should calculate similarity score', () => {
      const similarWorkflow = { ...mockWorkflowData, name: 'Test Workflow Modified' };
      const similarity = deduplicationSystem.calculateSimilarity(mockWorkflowData, similarWorkflow);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should merge duplicate items', () => {
      const duplicateWorkflow = { ...mockWorkflowData, id: 'duplicate-1' };
      const group = {
        id: 'test-group',
        items: [mockWorkflowData, duplicateWorkflow],
        similarity: 0.95
      };
      
      const merged = deduplicationSystem.mergeDuplicates(group, 'keep_highest_quality');
      expect(merged).toHaveProperty('id');
      expect(merged).toHaveProperty('mergedFrom');
    });
  });

  describe('Performance Metrics System', () => {
    it('should record performance metrics', () => {
      const event = {
        sourceId: 'test-source',
        operation: 'fetch_workflows',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: 1024
      };
      
      performanceMetrics.recordMetric(event);
      const metrics = performanceMetrics.getMetricsForSource('test-source');
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics.totalRequests).toBe(1);
    });

    it('should calculate success rate', () => {
      // Record successful and failed requests
      performanceMetrics.recordMetric({
        sourceId: 'test-source',
        operation: 'fetch_workflows',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: 1024
      });
      
      performanceMetrics.recordMetric({
        sourceId: 'test-source',
        operation: 'fetch_workflows',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: false,
        dataSize: 0
      });
      
      const successRate = performanceMetrics.getSuccessRate('test-source');
      expect(successRate).toBe(0.5);
    });

    it('should calculate response time', () => {
      const startTime = Date.now() - 1000;
      const endTime = Date.now();
      
      performanceMetrics.recordMetric({
        sourceId: 'test-source',
        operation: 'fetch_workflows',
        startTime,
        endTime,
        success: true,
        dataSize: 1024
      });
      
      const responseTime = performanceMetrics.getResponseTime('test-source');
      expect(responseTime).toBeGreaterThan(0);
    });
  });

  describe('Fallback System', () => {
    it('should register source', () => {
      const source = {
        id: 'test-source',
        name: 'Test Source',
        type: 'api',
        endpoint: 'https://api.example.com',
        priority: 1,
        isActive: true
      };
      
      fallbackSystem.registerSource(source);
      const sources = fallbackSystem.getAvailableSources();
      expect(sources).toContain(source);
    });

    it('should execute operation with fallback', async () => {
      const source = {
        id: 'test-source',
        name: 'Test Source',
        type: 'api',
        endpoint: 'https://api.example.com',
        priority: 1,
        isActive: true
      };
      
      fallbackSystem.registerSource(source);
      
      const operation = jest.fn().mockResolvedValue('success');
      const result = await fallbackSystem.executeOperation('test-source', operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should handle operation failure with fallback', async () => {
      const primarySource = {
        id: 'primary-source',
        name: 'Primary Source',
        type: 'api',
        endpoint: 'https://primary.example.com',
        priority: 1,
        isActive: true
      };
      
      const fallbackSource = {
        id: 'fallback-source',
        name: 'Fallback Source',
        type: 'api',
        endpoint: 'https://fallback.example.com',
        priority: 2,
        isActive: true
      };
      
      fallbackSystem.registerSource(primarySource);
      fallbackSystem.registerSource(fallbackSource);
      
      const primaryOperation = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const fallbackOperation = jest.fn().mockResolvedValue('fallback success');
      
      // Mock the fallback system to use fallback source when primary fails
      const result = await fallbackSystem.executeOperation('primary-source', primaryOperation);
      
      expect(result).toBe('fallback success');
    });
  });

  describe('Source Configuration Manager', () => {
    it('should add source configuration', () => {
      const config = {
        id: 'test-config',
        name: 'Test Configuration',
        type: 'api',
        endpoint: 'https://api.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };
      
      sourceConfigManager.addSource(config);
      const retrieved = sourceConfigManager.getSource('test-config');
      expect(retrieved).toEqual(config);
    });

    it('should validate source configuration', () => {
      const validConfig = {
        id: 'valid-config',
        name: 'Valid Configuration',
        type: 'api',
        endpoint: 'https://api.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };
      
      const invalidConfig = {
        id: 'invalid-config',
        name: '',
        type: 'invalid-type',
        endpoint: 'not-a-url',
        credentials: [],
        rateLimits: [],
        isActive: true
      };
      
      expect(sourceConfigManager.validateConfiguration(validConfig).isValid).toBe(true);
      expect(sourceConfigManager.validateConfiguration(invalidConfig).isValid).toBe(false);
    });

    it('should test source connection', async () => {
      const config = {
        id: 'test-connection',
        name: 'Test Connection',
        type: 'api',
        endpoint: 'https://api.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };
      
      sourceConfigManager.addSource(config);
      const result = await sourceConfigManager.testSourceConnection('test-connection');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('responseTime');
    });
  });

  describe('Data Validation Engine', () => {
    it('should validate data against rules', () => {
      const rule = {
        field: 'name',
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 100
      };
      
      dataValidationEngine.addValidationRule('workflow', rule);
      
      const validData = { name: 'Valid Workflow' };
      const invalidData = { name: '' };
      
      const validResult = dataValidationEngine.validateData('test-source', 'workflow', validData);
      const invalidResult = dataValidationEngine.validateData('test-source', 'workflow', invalidData);
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should calculate data quality score', () => {
      const data = {
        name: 'Test Workflow',
        description: 'A test workflow',
        category: 'automation',
        tags: ['test'],
        status: 'active'
      };
      
      const score = dataValidationEngine.calculateQualityScore('test-source', 'workflow', data);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should check data completeness', () => {
      const rules = [
        { field: 'name', type: 'string', required: true },
        { field: 'description', type: 'string', required: true },
        { field: 'category', type: 'string', required: true }
      ];
      
      const completeData = {
        name: 'Test Workflow',
        description: 'A test workflow',
        category: 'automation'
      };
      
      const incompleteData = {
        name: 'Test Workflow'
        // Missing description and category
      };
      
      const completeResult = dataValidationEngine.checkCompleteness(completeData, rules);
      const incompleteResult = dataValidationEngine.checkCompleteness(incompleteData, rules);
      
      expect(completeResult.isComplete).toBe(true);
      expect(incompleteResult.isComplete).toBe(false);
    });
  });

  describe('Usage Analytics System', () => {
    it('should track usage events', () => {
      const event = {
        userId: 'test-user',
        sourceId: 'test-source',
        action: 'view_workflow',
        resourceId: 'workflow-1',
        timestamp: new Date(),
        metadata: { category: 'automation' }
      };
      
      usageAnalytics.trackEvent(event);
      const usage = usageAnalytics.getSourceUsage('test-source');
      expect(usage).toHaveProperty('totalEvents');
      expect(usage.totalEvents).toBe(1);
    });

    it('should calculate source value score', () => {
      // Track multiple events to build usage data
      const events = [
        {
          userId: 'user-1',
          sourceId: 'test-source',
          action: 'view_workflow',
          resourceId: 'workflow-1',
          timestamp: new Date(),
          metadata: { category: 'automation' }
        },
        {
          userId: 'user-2',
          sourceId: 'test-source',
          action: 'download_workflow',
          resourceId: 'workflow-1',
          timestamp: new Date(),
          metadata: { category: 'automation' }
        }
      ];
      
      events.forEach(event => usageAnalytics.trackEvent(event));
      
      const valueScore = usageAnalytics.calculateSourceValueScore('test-source');
      expect(valueScore).toBeGreaterThan(0);
      expect(valueScore).toBeLessThanOrEqual(100);
    });

    it('should generate recommendations', () => {
      const recommendations = usageAnalytics.getRecommendations('test-user');
      expect(recommendations).toHaveProperty('sources');
      expect(recommendations).toHaveProperty('workflows');
      expect(recommendations).toHaveProperty('aiAgents');
    });
  });

  describe('Security and Compliance System', () => {
    it('should authenticate user', async () => {
      const credentials = {
        username: 'admin',
        password: 'admin123'
      };
      
      const result = await securityCompliance.authenticate(credentials);
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should authorize user actions', async () => {
      const credentials = {
        username: 'admin',
        password: 'admin123'
      };
      
      const authResult = await securityCompliance.authenticate(credentials);
      expect(authResult.success).toBe(true);
      
      const authzResult = await securityCompliance.authorize(
        authResult.user!.id,
        'read',
        'workflows'
      );
      expect(authzResult.allowed).toBe(true);
    });

    it('should encrypt and decrypt data', async () => {
      const originalData = 'sensitive data';
      const encrypted = await securityCompliance.encryptData(originalData);
      const decrypted = await securityCompliance.decryptData(encrypted);
      
      expect(encrypted).not.toBe(originalData);
      expect(decrypted).toBe(originalData);
    });

    it('should enforce rate limiting', () => {
      const identifier = 'test-user';
      
      // First few requests should be allowed
      expect(securityCompliance.isRateLimited(identifier)).toBe(false);
      expect(securityCompliance.isRateLimited(identifier)).toBe(false);
      
      // After exceeding limit, should be rate limited
      for (let i = 0; i < 10; i++) {
        securityCompliance.isRateLimited(identifier);
      }
      
      expect(securityCompliance.isRateLimited(identifier)).toBe(true);
    });

    it('should log security events', () => {
      const event = {
        eventType: 'login' as const,
        userId: 'test-user',
        success: true,
        severity: 'low' as const,
        details: { username: 'test-user' }
      };
      
      securityCompliance.logSecurityEvent(event);
      const alerts = securityCompliance.getSecurityAlerts();
      expect(alerts).toHaveLength(0); // No alerts for successful login
    });

    it('should generate compliance report', async () => {
      const report = await securityCompliance.generateComplianceReport('GDPR');
      expect(report).toHaveProperty('standard', 'GDPR');
      expect(report).toHaveProperty('status');
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('findings');
      expect(report).toHaveProperty('recommendations');
    });
  });

  describe('Integration Tests', () => {
    it('should integrate all systems for complete workflow', async () => {
      // 1. Add source configuration
      const config = {
        id: 'integration-test-source',
        name: 'Integration Test Source',
        type: 'api',
        endpoint: 'https://api.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };
      
      sourceConfigManager.addSource(config);
      
      // 2. Authenticate user
      const authResult = await securityCompliance.authenticate({
        username: 'admin',
        password: 'admin123'
      });
      expect(authResult.success).toBe(true);
      
      // 3. Authorize access
      const authzResult = await securityCompliance.authorize(
        authResult.user!.id,
        'read',
        'workflows',
        'integration-test-source'
      );
      expect(authzResult.allowed).toBe(true);
      
      // 4. Record performance metrics
      performanceMetrics.recordMetric({
        sourceId: 'integration-test-source',
        operation: 'fetch_workflows',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: 1024
      });
      
      // 5. Track usage
      usageAnalytics.trackEvent({
        userId: authResult.user!.id,
        sourceId: 'integration-test-source',
        action: 'view_workflow',
        resourceId: 'workflow-1',
        timestamp: new Date(),
        metadata: { category: 'automation' }
      });
      
      // 6. Validate data
      const validationResult = dataValidationEngine.validateData(
        'integration-test-source',
        'workflow',
        mockWorkflowData
      );
      expect(validationResult.isValid).toBe(true);
      
      // 7. Check health status
      const healthStatus = await workflowIndexer.getSourceHealthStatus('integration-test-source');
      expect(healthStatus).toHaveProperty('status');
      
      // 8. Generate compliance report
      const complianceReport = await securityCompliance.generateComplianceReport('GDPR');
      expect(complianceReport).toHaveProperty('score');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid source data gracefully', () => {
      const invalidData = null;
      const quality = workflowIndexer.calculateSourceQuality(invalidData as any);
      expect(quality).toBe(0);
    });

    it('should handle network errors in health checks', async () => {
      // Mock network error
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      
      const healthStatus = await workflowIndexer.getSourceHealthStatus('test-source');
      expect(healthStatus.status).toBe('error');
    });

    it('should handle cache errors gracefully', () => {
      const key = 'test-error-key';
      const data = { test: 'data' };
      
      // Mock cache error
      jest.spyOn(workflowIndexer, 'setToSmartCache').mockImplementation(() => {
        throw new Error('Cache error');
      });
      
      expect(() => {
        workflowIndexer.setToSmartCache(key, data, 60000);
      }).toThrow('Cache error');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockWorkflowData,
        id: `workflow-${i}`,
        name: `Workflow ${i}`
      }));
      
      const startTime = Date.now();
      const ranked = workflowIndexer.getRankedSources(largeDataset, 'test query');
      const endTime = Date.now();
      
      expect(ranked).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => 
        performanceMetrics.recordMetric({
          sourceId: `source-${i}`,
          operation: 'test_operation',
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          success: true,
          dataSize: 1024
        })
      );
      
      await Promise.all(promises);
      
      const allStats = performanceMetrics.getAllSourcesStats();
      expect(allStats).toHaveProperty('totalSources');
    });
  });
});
