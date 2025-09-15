/**
 * Integration Tests for Source Operations
 * 
 * This test suite covers end-to-end integration testing of source operations
 * including workflow fetching, AI agent retrieval, data processing, and
 * cross-system interactions.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WorkflowIndexer } from '../workflowIndexer';
import { metadataValidator } from '../metadataSchema';
import { deduplicationSystem } from '../deduplicationSystem';
import { performanceMetrics } from '../performanceMetrics';
import { fallbackSystem } from '../fallbackSystem';
import { sourceConfigManager } from '../sourceConfigManager';
import { dataValidationEngine } from '../dataValidationSystem';
import { usageAnalytics } from '../usageAnalytics';
import { securityCompliance } from '../securityCompliance';

// Mock external dependencies
jest.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

describe('Source Operations Integration Tests', () => {
  let workflowIndexer: WorkflowIndexer;

  beforeEach(() => {
    workflowIndexer = new WorkflowIndexer();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('End-to-End Workflow Processing', () => {
    it('should process workflow from source to display', async () => {
      // 1. Configure source
      const sourceConfig = {
        id: 'github-workflows',
        name: 'GitHub Workflows',
        type: 'github',
        endpoint: 'https://api.github.com',
        credentials: [{ type: 'token', value: 'test-token' }],
        rateLimits: [{ maxRequests: 100, windowMs: 60000 }],
        isActive: true
      };
      
      sourceConfigManager.addSource(sourceConfig);
      
      // 2. Authenticate user
      const authResult = await securityCompliance.authenticate({
        username: 'admin',
        password: 'admin123'
      });
      expect(authResult.success).toBe(true);
      
      // 3. Authorize access to source
      const authzResult = await securityCompliance.authorize(
        authResult.user!.id,
        'read',
        'workflows',
        'github-workflows'
      );
      expect(authzResult.allowed).toBe(true);
      
      // 4. Mock workflow data from source
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'CI/CD Pipeline',
          description: 'Automated CI/CD pipeline for deployment',
          category: 'devops',
          tags: ['ci', 'cd', 'deployment'],
          integrations: ['github', 'docker'],
          lastModified: new Date('2024-01-01'),
          analyzedAt: new Date('2024-01-02'),
          views: 150,
          quality: 0.9,
          complexity: 'high',
          status: 'active'
        },
        {
          id: 'workflow-2',
          name: 'Data Processing',
          description: 'Automated data processing workflow',
          category: 'data',
          tags: ['data', 'processing', 'etl'],
          integrations: ['python', 'pandas'],
          lastModified: new Date('2024-01-01'),
          analyzedAt: new Date('2024-01-02'),
          views: 75,
          quality: 0.8,
          complexity: 'medium',
          status: 'active'
        }
      ];
      
      // 5. Validate metadata
      const validationResults = mockWorkflows.map(workflow => 
        metadataValidator.validate(workflow, 'workflow')
      );
      expect(validationResults.every(result => result.isValid)).toBe(true);
      
      // 6. Check for duplicates
      const duplicates = deduplicationSystem.detectDuplicates(mockWorkflows, 'workflow');
      expect(duplicates).toHaveLength(0); // No duplicates in test data
      
      // 7. Calculate quality scores
      const qualityScores = mockWorkflows.map(workflow => 
        workflowIndexer.calculateSourceQuality(workflow)
      );
      expect(qualityScores.every(score => score > 0 && score <= 1)).toBe(true);
      
      // 8. Rank workflows
      const rankedWorkflows = workflowIndexer.getRankedSources(mockWorkflows, 'ci cd pipeline');
      expect(rankedWorkflows).toHaveLength(2);
      expect(rankedWorkflows[0].score).toBeGreaterThanOrEqual(rankedWorkflows[1].score);
      
      // 9. Record performance metrics
      performanceMetrics.recordMetric({
        sourceId: 'github-workflows',
        operation: 'fetch_workflows',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: JSON.stringify(mockWorkflows).length
      });
      
      // 10. Track usage analytics
      usageAnalytics.trackEvent({
        userId: authResult.user!.id,
        sourceId: 'github-workflows',
        action: 'view_workflows',
        resourceId: 'workflow-list',
        timestamp: new Date(),
        metadata: { count: mockWorkflows.length }
      });
      
      // 11. Validate data quality
      const dataQualityResults = mockWorkflows.map(workflow => 
        dataValidationEngine.validateData('github-workflows', 'workflow', workflow)
      );
      expect(dataQualityResults.every(result => result.isValid)).toBe(true);
      
      // 12. Check source health
      const healthStatus = await workflowIndexer.getSourceHealthStatus('github-workflows');
      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('lastChecked');
    });

    it('should handle source failure with fallback', async () => {
      // 1. Configure primary and fallback sources
      const primarySource = {
        id: 'primary-source',
        name: 'Primary Source',
        type: 'api',
        endpoint: 'https://primary.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };
      
      const fallbackSource = {
        id: 'fallback-source',
        name: 'Fallback Source',
        type: 'api',
        endpoint: 'https://fallback.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };
      
      sourceConfigManager.addSource(primarySource);
      sourceConfigManager.addSource(fallbackSource);
      
      // 2. Register sources in fallback system
      fallbackSystem.registerSource({
        id: 'primary-source',
        name: 'Primary Source',
        type: 'api',
        endpoint: 'https://primary.example.com',
        priority: 1,
        isActive: true
      });
      
      fallbackSystem.registerSource({
        id: 'fallback-source',
        name: 'Fallback Source',
        type: 'api',
        endpoint: 'https://fallback.example.com',
        priority: 2,
        isActive: true
      });
      
      // 3. Mock primary source failure
      const primaryOperation = jest.fn().mockRejectedValue(new Error('Primary source unavailable'));
      const fallbackOperation = jest.fn().mockResolvedValue([
        {
          id: 'fallback-workflow-1',
          name: 'Fallback Workflow',
          description: 'Workflow from fallback source',
          category: 'automation',
          tags: ['fallback'],
          integrations: ['api'],
          lastModified: new Date(),
          analyzedAt: new Date(),
          views: 10,
          quality: 0.7,
          complexity: 'low',
          status: 'active'
        }
      ]);
      
      // 4. Execute operation with fallback
      try {
        await fallbackSystem.executeOperation('primary-source', primaryOperation);
      } catch (error) {
        // Primary failed, try fallback
        const fallbackResult = await fallbackSystem.executeOperation('fallback-source', fallbackOperation);
        expect(fallbackResult).toHaveLength(1);
        expect(fallbackResult[0].name).toBe('Fallback Workflow');
      }
      
      // 5. Record failure metrics
      performanceMetrics.recordMetric({
        sourceId: 'primary-source',
        operation: 'fetch_workflows',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: false,
        dataSize: 0
      });
      
      // 6. Record success metrics for fallback
      performanceMetrics.recordMetric({
        sourceId: 'fallback-source',
        operation: 'fetch_workflows',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: 1024
      });
      
      // 7. Check health status
      const primaryHealth = await workflowIndexer.getSourceHealthStatus('primary-source');
      const fallbackHealth = await workflowIndexer.getSourceHealthStatus('fallback-source');
      
      expect(primaryHealth.status).toBe('error');
      expect(fallbackHealth.status).toBe('healthy');
    });

    it('should process AI agent data end-to-end', async () => {
      // 1. Configure AI agent source
      const aiSourceConfig = {
        id: 'openai-agents',
        name: 'OpenAI Agents',
        type: 'openai',
        endpoint: 'https://api.openai.com',
        credentials: [{ type: 'api_key', value: 'test-key' }],
        rateLimits: [{ maxRequests: 50, windowMs: 60000 }],
        isActive: true
      };
      
      sourceConfigManager.addSource(aiSourceConfig);
      
      // 2. Authenticate user
      const authResult = await securityCompliance.authenticate({
        username: 'admin',
        password: 'admin123'
      });
      expect(authResult.success).toBe(true);
      
      // 3. Mock AI agent data
      const mockAIAgents = [
        {
          id: 'agent-1',
          name: 'Code Review Assistant',
          description: 'AI agent for automated code review',
          category: 'ai_assistant',
          tags: ['code', 'review', 'ai'],
          integrations: ['openai', 'github'],
          lastModified: new Date('2024-01-01'),
          analyzedAt: new Date('2024-01-02'),
          views: 200,
          quality: 0.95,
          complexity: 'high',
          status: 'active'
        },
        {
          id: 'agent-2',
          name: 'Documentation Generator',
          description: 'AI agent for generating documentation',
          category: 'ai_assistant',
          tags: ['documentation', 'ai', 'generation'],
          integrations: ['openai', 'markdown'],
          lastModified: new Date('2024-01-01'),
          analyzedAt: new Date('2024-01-02'),
          views: 120,
          quality: 0.85,
          complexity: 'medium',
          status: 'active'
        }
      ];
      
      // 4. Validate AI agent metadata
      const validationResults = mockAIAgents.map(agent => 
        metadataValidator.validate(agent, 'ai_agent')
      );
      expect(validationResults.every(result => result.isValid)).toBe(true);
      
      // 5. Check for duplicates
      const duplicates = deduplicationSystem.detectDuplicates(mockAIAgents, 'ai_agent');
      expect(duplicates).toHaveLength(0);
      
      // 6. Calculate quality and relevance scores
      const qualityScores = mockAIAgents.map(agent => 
        workflowIndexer.calculateSourceQuality(agent)
      );
      const relevanceScores = mockAIAgents.map(agent => 
        workflowIndexer.calculateRelevance(agent, 'code review assistant')
      );
      
      expect(qualityScores.every(score => score > 0 && score <= 1)).toBe(true);
      expect(relevanceScores.every(score => score > 0 && score <= 1)).toBe(true);
      
      // 7. Rank AI agents
      const rankedAgents = workflowIndexer.getRankedSources(mockAIAgents, 'code review assistant');
      expect(rankedAgents).toHaveLength(2);
      expect(rankedAgents[0].score).toBeGreaterThanOrEqual(rankedAgents[1].score);
      
      // 8. Record performance metrics
      performanceMetrics.recordMetric({
        sourceId: 'openai-agents',
        operation: 'fetch_ai_agents',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: JSON.stringify(mockAIAgents).length
      });
      
      // 9. Track usage analytics
      usageAnalytics.trackEvent({
        userId: authResult.user!.id,
        sourceId: 'openai-agents',
        action: 'view_ai_agents',
        resourceId: 'agent-list',
        timestamp: new Date(),
        metadata: { count: mockAIAgents.length }
      });
      
      // 10. Validate data quality
      const dataQualityResults = mockAIAgents.map(agent => 
        dataValidationEngine.validateData('openai-agents', 'ai_agent', agent)
      );
      expect(dataQualityResults.every(result => result.isValid)).toBe(true);
    });

    it('should handle data deduplication across sources', async () => {
      // 1. Configure multiple sources
      const source1 = {
        id: 'source-1',
        name: 'Source 1',
        type: 'api',
        endpoint: 'https://source1.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };
      
      const source2 = {
        id: 'source-2',
        name: 'Source 2',
        type: 'api',
        endpoint: 'https://source2.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };
      
      sourceConfigManager.addSource(source1);
      sourceConfigManager.addSource(source2);
      
      // 2. Mock duplicate workflows from different sources
      const workflow1 = {
        id: 'workflow-1',
        name: 'Data Processing Workflow',
        description: 'Automated data processing workflow',
        category: 'data',
        tags: ['data', 'processing'],
        integrations: ['python', 'pandas'],
        lastModified: new Date('2024-01-01'),
        analyzedAt: new Date('2024-01-02'),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active',
        source: 'source-1'
      };
      
      const workflow2 = {
        id: 'workflow-2',
        name: 'Data Processing Workflow',
        description: 'Automated data processing workflow',
        category: 'data',
        tags: ['data', 'processing'],
        integrations: ['python', 'pandas'],
        lastModified: new Date('2024-01-01'),
        analyzedAt: new Date('2024-01-02'),
        views: 150,
        quality: 0.9,
        complexity: 'medium',
        status: 'active',
        source: 'source-2'
      };
      
      // 3. Detect duplicates
      const duplicates = deduplicationSystem.detectDuplicates([workflow1, workflow2], 'workflow');
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].items).toHaveLength(2);
      
      // 4. Merge duplicates (keep highest quality)
      const merged = deduplicationSystem.mergeDuplicates(duplicates[0], 'keep_highest_quality');
      expect(merged.quality).toBe(0.9); // Higher quality from source-2
      expect(merged.views).toBe(150); // Higher views from source-2
      
      // 5. Record deduplication metrics
      performanceMetrics.recordMetric({
        sourceId: 'source-1',
        operation: 'deduplicate_workflows',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: 1024
      });
      
      performanceMetrics.recordMetric({
        sourceId: 'source-2',
        operation: 'deduplicate_workflows',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: 1024
      });
    });

    it('should handle security and compliance throughout workflow', async () => {
      // 1. Configure source with security requirements
      const secureSourceConfig = {
        id: 'secure-source',
        name: 'Secure Source',
        type: 'api',
        endpoint: 'https://secure.example.com',
        credentials: [{ type: 'oauth', value: 'encrypted-token' }],
        rateLimits: [{ maxRequests: 10, windowMs: 60000 }],
        isActive: true
      };
      
      sourceConfigManager.addSource(secureSourceConfig);
      
      // 2. Authenticate user with MFA
      const authResult = await securityCompliance.authenticate({
        username: 'admin',
        password: 'admin123'
      });
      expect(authResult.success).toBe(true);
      
      // 3. Authorize access with specific permissions
      const authzResult = await securityCompliance.authorize(
        authResult.user!.id,
        'read',
        'workflows',
        'secure-source'
      );
      expect(authzResult.allowed).toBe(true);
      
      // 4. Encrypt sensitive data
      const sensitiveData = 'confidential workflow data';
      const encryptedData = await securityCompliance.encryptData(sensitiveData);
      expect(encryptedData).not.toBe(sensitiveData);
      
      // 5. Decrypt data for processing
      const decryptedData = await securityCompliance.decryptData(encryptedData);
      expect(decryptedData).toBe(sensitiveData);
      
      // 6. Check rate limiting
      const isRateLimited = securityCompliance.isRateLimited('secure-source');
      expect(isRateLimited).toBe(false);
      
      // 7. Log security events
      securityCompliance.logSecurityEvent({
        eventType: 'data_access',
        userId: authResult.user!.id,
        sourceId: 'secure-source',
        success: true,
        severity: 'low',
        details: { operation: 'read_workflows' }
      });
      
      // 8. Generate compliance report
      const complianceReport = await securityCompliance.generateComplianceReport('GDPR');
      expect(complianceReport).toHaveProperty('standard', 'GDPR');
      expect(complianceReport).toHaveProperty('score');
      expect(complianceReport).toHaveProperty('findings');
      
      // 9. Check audit logs
      const auditLogs = securityCompliance.getAuditLogs({
        userId: authResult.user!.id,
        sourceId: 'secure-source',
        limit: 10
      });
      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should handle performance optimization and caching', async () => {
      // 1. Configure source
      const sourceConfig = {
        id: 'performance-source',
        name: 'Performance Source',
        type: 'api',
        endpoint: 'https://performance.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };
      
      sourceConfigManager.addSource(sourceConfig);
      
      // 2. First request - should miss cache
      const startTime1 = Date.now();
      const data1 = { id: 'workflow-1', name: 'Test Workflow' };
      workflowIndexer.setToSmartCache('test-key', data1, 60000);
      const cached1 = workflowIndexer.getFromSmartCache('test-key');
      const endTime1 = Date.now();
      
      expect(cached1).toEqual(data1);
      
      // 3. Second request - should hit cache
      const startTime2 = Date.now();
      const cached2 = workflowIndexer.getFromSmartCache('test-key');
      const endTime2 = Date.now();
      
      expect(cached2).toEqual(data1);
      expect(endTime2 - startTime2).toBeLessThan(endTime1 - startTime1);
      
      // 4. Record performance metrics
      performanceMetrics.recordMetric({
        sourceId: 'performance-source',
        operation: 'cache_hit',
        startTime: startTime2,
        endTime: endTime2,
        success: true,
        dataSize: JSON.stringify(data1).length
      });
      
      // 5. Check cache statistics
      const cacheStats = workflowIndexer.getCacheStats();
      expect(cacheStats.hitRate).toBeGreaterThan(0);
      expect(cacheStats.entryCount).toBeGreaterThan(0);
      
      // 6. Test cache expiration
      const shortTTLData = { id: 'temp-data', name: 'Temporary Data' };
      workflowIndexer.setToSmartCache('temp-key', shortTTLData, 100); // 100ms TTL
      
      setTimeout(() => {
        const expiredData = workflowIndexer.getFromSmartCache('temp-key');
        expect(expiredData).toBeNull();
      }, 150);
    });
  });

  describe('Cross-System Integration', () => {
    it('should integrate all systems for complete source management', async () => {
      // 1. Setup complete source management system
      const sourceConfig = {
        id: 'integrated-source',
        name: 'Integrated Source',
        type: 'api',
        endpoint: 'https://integrated.example.com',
        credentials: [{ type: 'api_key', value: 'test-key' }],
        rateLimits: [{ maxRequests: 100, windowMs: 60000 }],
        isActive: true
      };
      
      sourceConfigManager.addSource(sourceConfig);
      
      // 2. Authenticate and authorize
      const authResult = await securityCompliance.authenticate({
        username: 'admin',
        password: 'admin123'
      });
      expect(authResult.success).toBe(true);
      
      const authzResult = await securityCompliance.authorize(
        authResult.user!.id,
        'read',
        'workflows',
        'integrated-source'
      );
      expect(authzResult.allowed).toBe(true);
      
      // 3. Register in fallback system
      fallbackSystem.registerSource({
        id: 'integrated-source',
        name: 'Integrated Source',
        type: 'api',
        endpoint: 'https://integrated.example.com',
        priority: 1,
        isActive: true
      });
      
      // 4. Mock data processing
      const mockData = [
        {
          id: 'workflow-1',
          name: 'Integrated Workflow',
          description: 'Workflow processed through all systems',
          category: 'automation',
          tags: ['integration', 'test'],
          integrations: ['api'],
          lastModified: new Date(),
          analyzedAt: new Date(),
          views: 100,
          quality: 0.8,
          complexity: 'medium',
          status: 'active'
        }
      ];
      
      // 5. Process through all systems
      const validationResults = mockData.map(item => 
        metadataValidator.validate(item, 'workflow')
      );
      expect(validationResults.every(result => result.isValid)).toBe(true);
      
      const qualityScores = mockData.map(item => 
        workflowIndexer.calculateSourceQuality(item)
      );
      expect(qualityScores.every(score => score > 0 && score <= 1)).toBe(true);
      
      const rankedItems = workflowIndexer.getRankedSources(mockData, 'integration test');
      expect(rankedItems).toHaveLength(1);
      
      // 6. Record metrics and analytics
      performanceMetrics.recordMetric({
        sourceId: 'integrated-source',
        operation: 'process_workflows',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        dataSize: JSON.stringify(mockData).length
      });
      
      usageAnalytics.trackEvent({
        userId: authResult.user!.id,
        sourceId: 'integrated-source',
        action: 'process_workflows',
        resourceId: 'workflow-list',
        timestamp: new Date(),
        metadata: { count: mockData.length }
      });
      
      // 7. Validate data quality
      const dataQualityResults = mockData.map(item => 
        dataValidationEngine.validateData('integrated-source', 'workflow', item)
      );
      expect(dataQualityResults.every(result => result.isValid)).toBe(true);
      
      // 8. Check health and generate reports
      const healthStatus = await workflowIndexer.getSourceHealthStatus('integrated-source');
      expect(healthStatus).toHaveProperty('status');
      
      const complianceReport = await securityCompliance.generateComplianceReport('SOC2');
      expect(complianceReport).toHaveProperty('score');
      
      // 9. Verify all systems are working together
      const allStats = performanceMetrics.getAllSourcesStats();
      const analyticsDashboard = usageAnalytics.getAnalyticsDashboard();
      const securityAlerts = securityCompliance.getSecurityAlerts();
      
      expect(allStats).toHaveProperty('totalSources');
      expect(analyticsDashboard).toHaveProperty('sources');
      expect(Array.isArray(securityAlerts)).toBe(true);
    });
  });
});
