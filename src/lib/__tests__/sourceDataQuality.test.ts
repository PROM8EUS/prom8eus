/**
 * Data Quality Validation Tests for Source Management
 * 
 * This test suite covers data quality validation, completeness checks,
 * accuracy validation, format validation, and consistency checks.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { dataValidationEngine } from '../dataValidationSystem';
import { metadataValidator } from '../metadataSchema';
import { metadataQualityScorer } from '../metadataSchema';

describe('Source Data Quality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Data Completeness Validation', () => {
    it('should validate required fields are present', () => {
      const completeData = {
        id: 'complete-workflow',
        name: 'Complete Workflow',
        description: 'A complete workflow with all required fields',
        category: 'automation',
        tags: ['complete', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const incompleteData = {
        id: 'incomplete-workflow',
        name: 'Incomplete Workflow'
        // Missing required fields
      };

      const completeResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        completeData
      );

      const incompleteResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        incompleteData
      );

      expect(completeResult.isValid).toBe(true);
      expect(completeResult.errors).toHaveLength(0);
      expect(incompleteResult.isValid).toBe(false);
      expect(incompleteResult.errors.length).toBeGreaterThan(0);
    });

    it('should validate field completeness based on rules', () => {
      const rules = [
        { field: 'name', type: 'string', required: true },
        { field: 'description', type: 'string', required: true },
        { field: 'category', type: 'string', required: true },
        { field: 'tags', type: 'array', required: true },
        { field: 'integrations', type: 'array', required: true }
      ];

      const completeData = {
        name: 'Test Workflow',
        description: 'Test description',
        category: 'automation',
        tags: ['test'],
        integrations: ['api']
      };

      const incompleteData = {
        name: 'Test Workflow'
        // Missing other required fields
      };

      const completeResult = dataValidationEngine.checkCompleteness(completeData, rules);
      const incompleteResult = dataValidationEngine.checkCompleteness(incompleteData, rules);

      expect(completeResult.isComplete).toBe(true);
      expect(completeResult.missingFields).toHaveLength(0);
      expect(incompleteResult.isComplete).toBe(false);
      expect(incompleteResult.missingFields.length).toBeGreaterThan(0);
    });

    it('should validate nested object completeness', () => {
      const nestedData = {
        id: 'nested-workflow',
        name: 'Nested Workflow',
        metadata: {
          author: 'Test Author',
          version: '1.0.0',
          dependencies: ['dep1', 'dep2']
        },
        configuration: {
          timeout: 30000,
          retries: 3,
          enabled: true
        }
      };

      const incompleteNestedData = {
        id: 'incomplete-nested-workflow',
        name: 'Incomplete Nested Workflow',
        metadata: {
          author: 'Test Author'
          // Missing version and dependencies
        }
        // Missing configuration
      };

      const completeResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        nestedData
      );

      const incompleteResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        incompleteNestedData
      );

      expect(completeResult.isValid).toBe(true);
      expect(incompleteResult.isValid).toBe(false);
    });
  });

  describe('Data Accuracy Validation', () => {
    it('should validate data types correctly', () => {
      const validData = {
        id: 'valid-workflow',
        name: 'Valid Workflow',
        description: 'Valid description',
        category: 'automation',
        tags: ['valid', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const invalidData = {
        id: 123, // Should be string
        name: 'Invalid Workflow',
        description: 'Invalid description',
        category: 'automation',
        tags: 'not-an-array', // Should be array
        integrations: ['api'],
        lastModified: 'not-a-date', // Should be date
        analyzedAt: new Date(),
        views: 'not-a-number', // Should be number
        quality: 'not-a-number', // Should be number
        complexity: 'medium',
        status: 'active'
      };

      const validResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        validData
      );

      const invalidResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        invalidData
      );

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should validate data ranges and constraints', () => {
      const validData = {
        id: 'valid-workflow',
        name: 'Valid Workflow',
        description: 'Valid description',
        category: 'automation',
        tags: ['valid', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100, // Valid number
        quality: 0.8, // Valid quality (0-1)
        complexity: 'medium',
        status: 'active'
      };

      const invalidData = {
        id: 'invalid-workflow',
        name: 'Invalid Workflow',
        description: 'Invalid description',
        category: 'automation',
        tags: ['invalid', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: -1, // Invalid negative number
        quality: 1.5, // Invalid quality (> 1)
        complexity: 'medium',
        status: 'active'
      };

      const validResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        validData
      );

      const invalidResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        invalidData
      );

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate enum values', () => {
      const validData = {
        id: 'valid-workflow',
        name: 'Valid Workflow',
        description: 'Valid description',
        category: 'automation', // Valid category
        tags: ['valid', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium', // Valid complexity
        status: 'active' // Valid status
      };

      const invalidData = {
        id: 'invalid-workflow',
        name: 'Invalid Workflow',
        description: 'Invalid description',
        category: 'invalid-category', // Invalid category
        tags: ['invalid', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'invalid-complexity', // Invalid complexity
        status: 'invalid-status' // Invalid status
      };

      const validResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        validData
      );

      const invalidResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        invalidData
      );

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Data Format Validation', () => {
    it('should validate string formats', () => {
      const validData = {
        id: 'valid-workflow-id',
        name: 'Valid Workflow Name',
        description: 'Valid description with proper formatting',
        category: 'automation',
        tags: ['valid', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const invalidData = {
        id: '', // Empty string
        name: '   ', // Whitespace only
        description: 'Valid description',
        category: 'automation',
        tags: ['invalid', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const validResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        validData
      );

      const invalidResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        invalidData
      );

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate array formats', () => {
      const validData = {
        id: 'valid-workflow',
        name: 'Valid Workflow',
        description: 'Valid description',
        category: 'automation',
        tags: ['valid', 'test', 'array'],
        integrations: ['api', 'webhook'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const invalidData = {
        id: 'invalid-workflow',
        name: 'Invalid Workflow',
        description: 'Invalid description',
        category: 'automation',
        tags: [], // Empty array
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const validResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        validData
      );

      const invalidResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        invalidData
      );

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate date formats', () => {
      const validData = {
        id: 'valid-workflow',
        name: 'Valid Workflow',
        description: 'Valid description',
        category: 'automation',
        tags: ['valid', 'test'],
        integrations: ['api'],
        lastModified: new Date('2024-01-01'),
        analyzedAt: new Date('2024-01-02'),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const invalidData = {
        id: 'invalid-workflow',
        name: 'Invalid Workflow',
        description: 'Invalid description',
        category: 'automation',
        tags: ['invalid', 'test'],
        integrations: ['api'],
        lastModified: '2024-01-01', // String instead of Date
        analyzedAt: new Date('2024-01-02'),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const validResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        validData
      );

      const invalidResult = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        invalidData
      );

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Data Freshness Validation', () => {
    it('should validate data freshness', () => {
      const freshData = {
        id: 'fresh-workflow',
        name: 'Fresh Workflow',
        description: 'Fresh description',
        category: 'automation',
        tags: ['fresh', 'test'],
        integrations: ['api'],
        lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        analyzedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const staleData = {
        id: 'stale-workflow',
        name: 'Stale Workflow',
        description: 'Stale description',
        category: 'automation',
        tags: ['stale', 'test'],
        integrations: ['api'],
        lastModified: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        analyzedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const freshResult = dataValidationEngine.checkFreshness(
        'test-source',
        freshData,
        'lastModified'
      );

      const staleResult = dataValidationEngine.checkFreshness(
        'test-source',
        staleData,
        'lastModified'
      );

      expect(freshResult.isFresh).toBe(true);
      expect(staleResult.isFresh).toBe(false);
    });

    it('should validate analysis freshness', () => {
      const recentlyAnalyzed = {
        id: 'recently-analyzed-workflow',
        name: 'Recently Analyzed Workflow',
        description: 'Recently analyzed description',
        category: 'automation',
        tags: ['recent', 'test'],
        integrations: ['api'],
        lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        analyzedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const oldAnalysis = {
        id: 'old-analysis-workflow',
        name: 'Old Analysis Workflow',
        description: 'Old analysis description',
        category: 'automation',
        tags: ['old', 'test'],
        integrations: ['api'],
        lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        analyzedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const recentResult = dataValidationEngine.checkFreshness(
        'test-source',
        recentlyAnalyzed,
        'analyzedAt'
      );

      const oldResult = dataValidationEngine.checkFreshness(
        'test-source',
        oldAnalysis,
        'analyzedAt'
      );

      expect(recentResult.isFresh).toBe(true);
      expect(oldResult.isFresh).toBe(false);
    });
  });

  describe('Data Consistency Validation', () => {
    it('should validate data consistency across fields', () => {
      const consistentData = {
        id: 'consistent-workflow',
        name: 'Consistent Workflow',
        description: 'Consistent description',
        category: 'automation',
        tags: ['consistent', 'test'],
        integrations: ['api'],
        lastModified: new Date('2024-01-01'),
        analyzedAt: new Date('2024-01-02'),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const inconsistentData = {
        id: 'inconsistent-workflow',
        name: 'Inconsistent Workflow',
        description: 'Inconsistent description',
        category: 'automation',
        tags: ['inconsistent', 'test'],
        integrations: ['api'],
        lastModified: new Date('2024-01-01'),
        analyzedAt: new Date('2023-12-31'), // Analyzed before last modified
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const consistencyChecks = [
        {
          name: 'analysis_after_modification',
          check: (data: any) => data.analyzedAt >= data.lastModified
        }
      ];

      const consistentResult = dataValidationEngine.checkConsistency(
        'test-source',
        consistentData,
        consistencyChecks
      );

      const inconsistentResult = dataValidationEngine.checkConsistency(
        'test-source',
        inconsistentData,
        consistencyChecks
      );

      expect(consistentResult.isConsistent).toBe(true);
      expect(inconsistentResult.isConsistent).toBe(false);
    });

    it('should validate cross-field relationships', () => {
      const validData = {
        id: 'valid-workflow',
        name: 'Valid Workflow',
        description: 'Valid description',
        category: 'automation',
        tags: ['valid', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const invalidData = {
        id: 'invalid-workflow',
        name: 'Invalid Workflow',
        description: 'Invalid description',
        category: 'automation',
        tags: ['invalid', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'high', // High complexity but low quality
        status: 'active'
      };

      const consistencyChecks = [
        {
          name: 'complexity_quality_consistency',
          check: (data: any) => {
            if (data.complexity === 'high') {
              return data.quality >= 0.7;
            }
            return true;
          }
        }
      ];

      const validResult = dataValidationEngine.checkConsistency(
        'test-source',
        validData,
        consistencyChecks
      );

      const invalidResult = dataValidationEngine.checkConsistency(
        'test-source',
        invalidData,
        consistencyChecks
      );

      expect(validResult.isConsistent).toBe(true);
      expect(invalidResult.isConsistent).toBe(false);
    });
  });

  describe('Data Quality Scoring', () => {
    it('should calculate quality score based on completeness', () => {
      const completeData = {
        id: 'complete-workflow',
        name: 'Complete Workflow',
        description: 'Complete description',
        category: 'automation',
        tags: ['complete', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const incompleteData = {
        id: 'incomplete-workflow',
        name: 'Incomplete Workflow'
        // Missing many fields
      };

      const completeScore = dataValidationEngine.calculateQualityScore(
        'test-source',
        'workflow',
        completeData
      );

      const incompleteScore = dataValidationEngine.calculateQualityScore(
        'test-source',
        'workflow',
        incompleteData
      );

      expect(completeScore).toBeGreaterThan(incompleteScore);
      expect(completeScore).toBeGreaterThan(80);
      expect(incompleteScore).toBeLessThan(50);
    });

    it('should calculate quality score based on accuracy', () => {
      const accurateData = {
        id: 'accurate-workflow',
        name: 'Accurate Workflow',
        description: 'Accurate description',
        category: 'automation',
        tags: ['accurate', 'test'],
        integrations: ['api'],
        lastModified: new Date(),
        analyzedAt: new Date(),
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const inaccurateData = {
        id: 'inaccurate-workflow',
        name: 'Inaccurate Workflow',
        description: 'Inaccurate description',
        category: 'invalid-category',
        tags: 'not-an-array',
        integrations: ['api'],
        lastModified: 'not-a-date',
        analyzedAt: new Date(),
        views: -1,
        quality: 1.5,
        complexity: 'invalid-complexity',
        status: 'invalid-status'
      };

      const accurateScore = dataValidationEngine.calculateQualityScore(
        'test-source',
        'workflow',
        accurateData
      );

      const inaccurateScore = dataValidationEngine.calculateQualityScore(
        'test-source',
        'workflow',
        inaccurateData
      );

      expect(accurateScore).toBeGreaterThan(inaccurateScore);
      expect(accurateScore).toBeGreaterThan(80);
      expect(inaccurateScore).toBeLessThan(30);
    });

    it('should calculate quality score based on freshness', () => {
      const freshData = {
        id: 'fresh-workflow',
        name: 'Fresh Workflow',
        description: 'Fresh description',
        category: 'automation',
        tags: ['fresh', 'test'],
        integrations: ['api'],
        lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        analyzedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const staleData = {
        id: 'stale-workflow',
        name: 'Stale Workflow',
        description: 'Stale description',
        category: 'automation',
        tags: ['stale', 'test'],
        integrations: ['api'],
        lastModified: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        analyzedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        views: 100,
        quality: 0.8,
        complexity: 'medium',
        status: 'active'
      };

      const freshScore = dataValidationEngine.calculateQualityScore(
        'test-source',
        'workflow',
        freshData
      );

      const staleScore = dataValidationEngine.calculateQualityScore(
        'test-source',
        'workflow',
        staleData
      );

      expect(freshScore).toBeGreaterThan(staleScore);
      expect(freshScore).toBeGreaterThan(80);
      expect(staleScore).toBeLessThan(60);
    });
  });

  describe('Data Quality Reporting', () => {
    it('should generate comprehensive quality reports', () => {
      const testData = [
        {
          id: 'workflow-1',
          name: 'Workflow 1',
          description: 'Description 1',
          category: 'automation',
          tags: ['test'],
          integrations: ['api'],
          lastModified: new Date(),
          analyzedAt: new Date(),
          views: 100,
          quality: 0.8,
          complexity: 'medium',
          status: 'active'
        },
        {
          id: 'workflow-2',
          name: 'Workflow 2',
          description: 'Description 2',
          category: 'automation',
          tags: ['test'],
          integrations: ['api'],
          lastModified: new Date(),
          analyzedAt: new Date(),
          views: 200,
          quality: 0.9,
          complexity: 'high',
          status: 'active'
        }
      ];

      const validationResults = testData.map(data => 
        dataValidationEngine.validateData('test-source', 'workflow', data)
      );

      const report = dataValidationEngine.generateValidationReport(
        'test-source',
        'workflow',
        validationResults
      );

      expect(report).toHaveProperty('sourceId', 'test-source');
      expect(report).toHaveProperty('dataType', 'workflow');
      expect(report).toHaveProperty('totalItems', 2);
      expect(report).toHaveProperty('validItems', 2);
      expect(report).toHaveProperty('invalidItems', 0);
      expect(report).toHaveProperty('qualityScore');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('recommendations');
    });

    it('should track quality trends over time', () => {
      const qualityHistory = [
        { timestamp: new Date('2024-01-01'), score: 0.8 },
        { timestamp: new Date('2024-01-02'), score: 0.85 },
        { timestamp: new Date('2024-01-03'), score: 0.9 },
        { timestamp: new Date('2024-01-04'), score: 0.88 },
        { timestamp: new Date('2024-01-05'), score: 0.92 }
      ];

      const dashboard = dataValidationEngine.getQualityDashboard();

      expect(dashboard).toHaveProperty('overallQuality');
      expect(dashboard).toHaveProperty('trends');
      expect(dashboard).toHaveProperty('sources');
      expect(dashboard).toHaveProperty('issues');
      expect(dashboard).toHaveProperty('recommendations');
    });
  });
});
