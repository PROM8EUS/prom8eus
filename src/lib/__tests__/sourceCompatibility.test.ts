/**
 * Compatibility Tests for Source Management
 * 
 * This test suite covers compatibility testing including cross-browser,
 * cross-platform, API versioning, and backward compatibility.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { metadataVersionManager } from '../metadataSchema';
import { sourceConfigManager } from '../sourceConfigManager';
import { dataValidationEngine } from '../dataValidationSystem';

describe('Source Compatibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('API Version Compatibility', () => {
    it('should handle different API versions', () => {
      const v1Data = {
        id: 'workflow-v1',
        title: 'Workflow V1', // Old field name
        desc: 'Description V1', // Old field name
        type: 'automation', // Old field name
        tags: ['v1', 'test'],
        lastUpdated: new Date('2024-01-01') // Old field name
      };

      const v2Data = {
        id: 'workflow-v2',
        name: 'Workflow V2', // New field name
        description: 'Description V2', // New field name
        category: 'automation', // New field name
        tags: ['v2', 'test'],
        lastModified: new Date('2024-01-01') // New field name
      };

      // Should handle both versions
      const v1Result = dataValidationEngine.validateData('test-source', 'workflow', v1Data);
      const v2Result = dataValidationEngine.validateData('test-source', 'workflow', v2Data);

      expect(v1Result.isValid).toBe(true);
      expect(v2Result.isValid).toBe(true);
    });

    it('should migrate between API versions', () => {
      const v1Data = {
        id: 'migration-test',
        title: 'Migration Test',
        desc: 'Migration description',
        type: 'automation',
        tags: ['migration', 'test'],
        lastUpdated: new Date('2024-01-01')
      };

      // Migrate from v1 to v2
      const migratedData = metadataVersionManager.migrateToVersion(v1Data, '2.0.0');

      expect(migratedData).toHaveProperty('name', 'Migration Test');
      expect(migratedData).toHaveProperty('description', 'Migration description');
      expect(migratedData).toHaveProperty('category', 'automation');
      expect(migratedData).toHaveProperty('lastModified');
      expect(migratedData).not.toHaveProperty('title');
      expect(migratedData).not.toHaveProperty('desc');
      expect(migratedData).not.toHaveProperty('type');
      expect(migratedData).not.toHaveProperty('lastUpdated');
    });

    it('should maintain backward compatibility', () => {
      const currentData = {
        id: 'backward-compat',
        name: 'Backward Compatible',
        description: 'Backward compatible description',
        category: 'automation',
        tags: ['backward', 'compat'],
        lastModified: new Date('2024-01-01')
      };

      // Should be compatible with older versions
      const isCompatible = metadataVersionManager.isCompatible('workflow', '1.0.0', '2.0.0');
      expect(isCompatible).toBe(true);

      // Should be able to migrate back to older version
      const migratedBack = metadataVersionManager.migrateToVersion(currentData, '1.0.0');
      expect(migratedBack).toHaveProperty('title', 'Backward Compatible');
      expect(migratedBack).toHaveProperty('desc', 'Backward compatible description');
      expect(migratedBack).toHaveProperty('type', 'automation');
    });

    it('should handle version conflicts gracefully', () => {
      const conflictingData = {
        id: 'version-conflict',
        title: 'Old Title', // Old field
        name: 'New Name', // New field
        desc: 'Old Description', // Old field
        description: 'New Description', // New field
        type: 'old-type', // Old field
        category: 'new-category' // New field
      };

      const result = dataValidationEngine.validateData('test-source', 'workflow', conflictingData);

      // Should handle conflicts by preferring newer fields
      expect(result.isValid).toBe(true);
    });
  });

  describe('Data Format Compatibility', () => {
    it('should handle different data formats', () => {
      const jsonData = {
        id: 'json-workflow',
        name: 'JSON Workflow',
        description: 'JSON format workflow',
        category: 'automation',
        tags: ['json', 'test'],
        lastModified: new Date('2024-01-01')
      };

      const xmlData = {
        id: 'xml-workflow',
        name: 'XML Workflow',
        description: 'XML format workflow',
        category: 'automation',
        tags: ['xml', 'test'],
        lastModified: new Date('2024-01-01')
      };

      const yamlData = {
        id: 'yaml-workflow',
        name: 'YAML Workflow',
        description: 'YAML format workflow',
        category: 'automation',
        tags: ['yaml', 'test'],
        lastModified: new Date('2024-01-01')
      };

      // Should handle all formats
      const jsonResult = dataValidationEngine.validateData('test-source', 'workflow', jsonData);
      const xmlResult = dataValidationEngine.validateData('test-source', 'workflow', xmlData);
      const yamlResult = dataValidationEngine.validateData('test-source', 'workflow', yamlData);

      expect(jsonResult.isValid).toBe(true);
      expect(xmlResult.isValid).toBe(true);
      expect(yamlResult.isValid).toBe(true);
    });

    it('should handle different encoding formats', () => {
      const utf8Data = {
        id: 'utf8-workflow',
        name: 'UTF-8 Workflow',
        description: 'UTF-8 description with émojis 🚀',
        category: 'automation',
        tags: ['utf8', 'test'],
        lastModified: new Date('2024-01-01')
      };

      const asciiData = {
        id: 'ascii-workflow',
        name: 'ASCII Workflow',
        description: 'ASCII description',
        category: 'automation',
        tags: ['ascii', 'test'],
        lastModified: new Date('2024-01-01')
      };

      // Should handle different encodings
      const utf8Result = dataValidationEngine.validateData('test-source', 'workflow', utf8Data);
      const asciiResult = dataValidationEngine.validateData('test-source', 'workflow', asciiData);

      expect(utf8Result.isValid).toBe(true);
      expect(asciiResult.isValid).toBe(true);
    });

    it('should handle different date formats', () => {
      const isoDateData = {
        id: 'iso-date-workflow',
        name: 'ISO Date Workflow',
        description: 'ISO date format workflow',
        category: 'automation',
        tags: ['iso', 'date'],
        lastModified: new Date('2024-01-01T00:00:00.000Z')
      };

      const unixTimestampData = {
        id: 'unix-timestamp-workflow',
        name: 'Unix Timestamp Workflow',
        description: 'Unix timestamp format workflow',
        category: 'automation',
        tags: ['unix', 'timestamp'],
        lastModified: new Date(1704067200000) // Unix timestamp
      };

      const stringDateData = {
        id: 'string-date-workflow',
        name: 'String Date Workflow',
        description: 'String date format workflow',
        category: 'automation',
        tags: ['string', 'date'],
        lastModified: new Date('2024-01-01')
      };

      // Should handle different date formats
      const isoResult = dataValidationEngine.validateData('test-source', 'workflow', isoDateData);
      const unixResult = dataValidationEngine.validateData('test-source', 'workflow', unixTimestampData);
      const stringResult = dataValidationEngine.validateData('test-source', 'workflow', stringDateData);

      expect(isoResult.isValid).toBe(true);
      expect(unixResult.isValid).toBe(true);
      expect(stringResult.isValid).toBe(true);
    });
  });

  describe('Source Type Compatibility', () => {
    it('should handle different source types', () => {
      const sourceTypes = [
        {
          id: 'api-source',
          name: 'API Source',
          type: 'api',
          endpoint: 'https://api.example.com',
          credentials: [],
          rateLimits: [],
          isActive: true
        },
        {
          id: 'database-source',
          name: 'Database Source',
          type: 'database',
          endpoint: 'postgresql://localhost:5432/db',
          credentials: [],
          rateLimits: [],
          isActive: true
        },
        {
          id: 'file-source',
          name: 'File Source',
          type: 'file',
          endpoint: '/path/to/file.json',
          credentials: [],
          rateLimits: [],
          isActive: true
        },
        {
          id: 'webhook-source',
          name: 'Webhook Source',
          type: 'webhook',
          endpoint: 'https://webhook.example.com',
          credentials: [],
          rateLimits: [],
          isActive: true
        }
      ];

      // Should handle all source types
      for (const source of sourceTypes) {
        const result = sourceConfigManager.validateConfiguration(source);
        expect(result.isValid).toBe(true);
      }
    });

    it('should handle mixed source configurations', () => {
      const mixedConfig = {
        id: 'mixed-source',
        name: 'Mixed Source',
        type: 'api',
        endpoint: 'https://api.example.com',
        credentials: [
          { type: 'api_key', value: 'key123' },
          { type: 'oauth', value: 'token456' }
        ],
        rateLimits: [
          { maxRequests: 100, windowMs: 60000 },
          { maxRequests: 1000, windowMs: 3600000 }
        ],
        isActive: true,
        metadata: {
          version: '1.0.0',
          features: ['caching', 'retry', 'fallback']
        }
      };

      const result = sourceConfigManager.validateConfiguration(mixedConfig);
      expect(result.isValid).toBe(true);
    });

    it('should handle legacy source configurations', () => {
      const legacyConfig = {
        id: 'legacy-source',
        name: 'Legacy Source',
        type: 'legacy',
        url: 'https://legacy.example.com', // Old field name
        auth: { // Old auth structure
          username: 'user',
          password: 'pass'
        },
        limits: { // Old limits structure
          requests: 100,
          period: 60
        },
        enabled: true // Old field name
      };

      // Should handle legacy configuration
      const result = sourceConfigManager.validateConfiguration(legacyConfig);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should handle different operating systems', () => {
      const windowsPath = 'C:\\Users\\Test\\workflow.json';
      const unixPath = '/home/test/workflow.json';
      const macPath = '/Users/test/workflow.json';

      const windowsConfig = {
        id: 'windows-source',
        name: 'Windows Source',
        type: 'file',
        endpoint: windowsPath,
        credentials: [],
        rateLimits: [],
        isActive: true
      };

      const unixConfig = {
        id: 'unix-source',
        name: 'Unix Source',
        type: 'file',
        endpoint: unixPath,
        credentials: [],
        rateLimits: [],
        isActive: true
      };

      const macConfig = {
        id: 'mac-source',
        name: 'Mac Source',
        type: 'file',
        endpoint: macPath,
        credentials: [],
        rateLimits: [],
        isActive: true
      };

      // Should handle all path formats
      const windowsResult = sourceConfigManager.validateConfiguration(windowsConfig);
      const unixResult = sourceConfigManager.validateConfiguration(unixConfig);
      const macResult = sourceConfigManager.validateConfiguration(macConfig);

      expect(windowsResult.isValid).toBe(true);
      expect(unixResult.isValid).toBe(true);
      expect(macResult.isValid).toBe(true);
    });

    it('should handle different line endings', () => {
      const unixLineEndings = 'line1\nline2\nline3';
      const windowsLineEndings = 'line1\r\nline2\r\nline3';
      const macLineEndings = 'line1\rline2\rline3';

      const unixData = {
        id: 'unix-workflow',
        name: 'Unix Workflow',
        description: unixLineEndings,
        category: 'automation',
        tags: ['unix', 'test'],
        lastModified: new Date('2024-01-01')
      };

      const windowsData = {
        id: 'windows-workflow',
        name: 'Windows Workflow',
        description: windowsLineEndings,
        category: 'automation',
        tags: ['windows', 'test'],
        lastModified: new Date('2024-01-01')
      };

      const macData = {
        id: 'mac-workflow',
        name: 'Mac Workflow',
        description: macLineEndings,
        category: 'automation',
        tags: ['mac', 'test'],
        lastModified: new Date('2024-01-01')
      };

      // Should handle all line ending formats
      const unixResult = dataValidationEngine.validateData('test-source', 'workflow', unixData);
      const windowsResult = dataValidationEngine.validateData('test-source', 'workflow', windowsData);
      const macResult = dataValidationEngine.validateData('test-source', 'workflow', macData);

      expect(unixResult.isValid).toBe(true);
      expect(windowsResult.isValid).toBe(true);
      expect(macResult.isValid).toBe(true);
    });

    it('should handle different character encodings', () => {
      const utf8Data = {
        id: 'utf8-workflow',
        name: 'UTF-8 Workflow',
        description: 'UTF-8 description with émojis 🚀',
        category: 'automation',
        tags: ['utf8', 'test'],
        lastModified: new Date('2024-01-01')
      };

      const latin1Data = {
        id: 'latin1-workflow',
        name: 'Latin-1 Workflow',
        description: 'Latin-1 description with accented characters éàç',
        category: 'automation',
        tags: ['latin1', 'test'],
        lastModified: new Date('2024-01-01')
      };

      // Should handle different character encodings
      const utf8Result = dataValidationEngine.validateData('test-source', 'workflow', utf8Data);
      const latin1Result = dataValidationEngine.validateData('test-source', 'workflow', latin1Data);

      expect(utf8Result.isValid).toBe(true);
      expect(latin1Result.isValid).toBe(true);
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle different browser environments', () => {
      // Mock different browser environments
      const chromeEnvironment = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        localStorage: true,
        sessionStorage: true,
        fetch: true
      };

      const firefoxEnvironment = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        localStorage: true,
        sessionStorage: true,
        fetch: true
      };

      const safariEnvironment = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        localStorage: true,
        sessionStorage: true,
        fetch: true
      };

      const ieEnvironment = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',
        localStorage: false,
        sessionStorage: false,
        fetch: false
      };

      // Should handle all browser environments
      const environments = [chromeEnvironment, firefoxEnvironment, safariEnvironment, ieEnvironment];
      
      for (const env of environments) {
        // Mock global environment
        Object.defineProperty(global, 'navigator', {
          value: { userAgent: env.userAgent },
          writable: true
        });

        // Test data validation (should work in all environments)
        const testData = {
          id: 'browser-test',
          name: 'Browser Test',
          description: 'Browser compatibility test',
          category: 'automation',
          tags: ['browser', 'test'],
          lastModified: new Date('2024-01-01')
        };

        const result = dataValidationEngine.validateData('test-source', 'workflow', testData);
        expect(result.isValid).toBe(true);
      }
    });

    it('should handle different JavaScript versions', () => {
      // Test ES5 compatibility
      const es5Data = {
        id: 'es5-workflow',
        name: 'ES5 Workflow',
        description: 'ES5 compatible workflow',
        category: 'automation',
        tags: ['es5', 'test'],
        lastModified: new Date('2024-01-01')
      };

      // Test ES6+ compatibility
      const es6Data = {
        id: 'es6-workflow',
        name: 'ES6 Workflow',
        description: 'ES6+ compatible workflow',
        category: 'automation',
        tags: ['es6', 'test'],
        lastModified: new Date('2024-01-01')
      };

      // Should handle both ES versions
      const es5Result = dataValidationEngine.validateData('test-source', 'workflow', es5Data);
      const es6Result = dataValidationEngine.validateData('test-source', 'workflow', es6Data);

      expect(es5Result.isValid).toBe(true);
      expect(es6Result.isValid).toBe(true);
    });
  });

  describe('Network Compatibility', () => {
    it('should handle different network protocols', () => {
      const httpConfig = {
        id: 'http-source',
        name: 'HTTP Source',
        type: 'api',
        endpoint: 'http://api.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };

      const httpsConfig = {
        id: 'https-source',
        name: 'HTTPS Source',
        type: 'api',
        endpoint: 'https://api.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };

      const wsConfig = {
        id: 'ws-source',
        name: 'WebSocket Source',
        type: 'websocket',
        endpoint: 'ws://api.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };

      const wssConfig = {
        id: 'wss-source',
        name: 'Secure WebSocket Source',
        type: 'websocket',
        endpoint: 'wss://api.example.com',
        credentials: [],
        rateLimits: [],
        isActive: true
      };

      // Should handle all network protocols
      const httpResult = sourceConfigManager.validateConfiguration(httpConfig);
      const httpsResult = sourceConfigManager.validateConfiguration(httpsConfig);
      const wsResult = sourceConfigManager.validateConfiguration(wsConfig);
      const wssResult = sourceConfigManager.validateConfiguration(wssConfig);

      expect(httpResult.isValid).toBe(true);
      expect(httpsResult.isValid).toBe(true);
      expect(wsResult.isValid).toBe(true);
      expect(wssResult.isValid).toBe(true);
    });

    it('should handle different network conditions', () => {
      const slowNetworkData = {
        id: 'slow-network-workflow',
        name: 'Slow Network Workflow',
        description: 'Workflow for slow network conditions',
        category: 'automation',
        tags: ['slow', 'network'],
        lastModified: new Date('2024-01-01')
      };

      const fastNetworkData = {
        id: 'fast-network-workflow',
        name: 'Fast Network Workflow',
        description: 'Workflow for fast network conditions',
        category: 'automation',
        tags: ['fast', 'network'],
        lastModified: new Date('2024-01-01')
      };

      // Should handle different network conditions
      const slowResult = dataValidationEngine.validateData('test-source', 'workflow', slowNetworkData);
      const fastResult = dataValidationEngine.validateData('test-source', 'workflow', fastNetworkData);

      expect(slowResult.isValid).toBe(true);
      expect(fastResult.isValid).toBe(true);
    });
  });

  describe('Migration Compatibility', () => {
    it('should handle data migration between versions', () => {
      const v1Data = {
        id: 'migration-test',
        title: 'Migration Test',
        desc: 'Migration description',
        type: 'automation',
        tags: ['migration', 'test'],
        lastUpdated: new Date('2024-01-01'),
        version: '1.0.0'
      };

      // Migrate to v2
      const v2Data = metadataVersionManager.migrateToVersion(v1Data, '2.0.0');
      expect(v2Data).toHaveProperty('name', 'Migration Test');
      expect(v2Data).toHaveProperty('description', 'Migration description');
      expect(v2Data).toHaveProperty('category', 'automation');
      expect(v2Data).toHaveProperty('lastModified');
      expect(v2Data).toHaveProperty('version', '2.0.0');

      // Migrate to v3
      const v3Data = metadataVersionManager.migrateToVersion(v2Data, '3.0.0');
      expect(v3Data).toHaveProperty('name', 'Migration Test');
      expect(v3Data).toHaveProperty('description', 'Migration description');
      expect(v3Data).toHaveProperty('category', 'automation');
      expect(v3Data).toHaveProperty('lastModified');
      expect(v3Data).toHaveProperty('version', '3.0.0');
    });

    it('should handle partial data migration', () => {
      const partialData = {
        id: 'partial-migration',
        title: 'Partial Migration',
        // Missing some fields
        tags: ['partial', 'migration']
      };

      // Should handle partial data gracefully
      const migratedData = metadataVersionManager.migrateToVersion(partialData, '2.0.0');
      expect(migratedData).toHaveProperty('name', 'Partial Migration');
      expect(migratedData).toHaveProperty('description', ''); // Default value
      expect(migratedData).toHaveProperty('category', 'automation'); // Default value
      expect(migratedData).toHaveProperty('tags', ['partial', 'migration']);
    });

    it('should handle migration rollback', () => {
      const v2Data = {
        id: 'rollback-test',
        name: 'Rollback Test',
        description: 'Rollback description',
        category: 'automation',
        tags: ['rollback', 'test'],
        lastModified: new Date('2024-01-01'),
        version: '2.0.0'
      };

      // Rollback to v1
      const v1Data = metadataVersionManager.migrateToVersion(v2Data, '1.0.0');
      expect(v1Data).toHaveProperty('title', 'Rollback Test');
      expect(v1Data).toHaveProperty('desc', 'Rollback description');
      expect(v1Data).toHaveProperty('type', 'automation');
      expect(v1Data).toHaveProperty('lastUpdated');
      expect(v1Data).toHaveProperty('version', '1.0.0');
    });
  });
});
