/**
 * Tests for Configuration System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock import.meta.env before importing the config module
const mockEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
  VITE_GITHUB_TOKEN: 'ghp_test123',
  VITE_APP_ENV: 'test',
  VITE_APP_VERSION: '1.0.0',
  VITE_API_BASE_URL: 'http://localhost:3000',
  VITE_N8N_API_URL: 'https://api.github.com',
  VITE_ENABLE_AI_ANALYSIS: 'true',
  VITE_ENABLE_WORKFLOW_SEARCH: 'true',
  VITE_ENABLE_AGENT_RECOMMENDATIONS: 'false',
  VITE_RECOMMENDATIONS_ENABLE_LLM: 'true',
  VITE_RECOMMENDATIONS_TOP_K: '5',
  VITE_RECOMMENDATIONS_LLM_TIMEOUT_MS: '2000',
  VITE_RECOMMENDATIONS_ENABLE_CACHE: 'true',
  VITE_RECOMMENDATIONS_CACHE_TTL_MINUTES: '30'
};

// Mock import.meta.env globally
Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true
});

// Import after mocking
import { getConfig, validateConfig, getGitHubConfig, isAIEnabled, getRecommendationsConfig } from '../../src/lib/config';

describe('Configuration System', () => {
  beforeEach(() => {
    // Reset environment variables
    Object.assign(import.meta.env, mockEnv);
  });

  describe('getConfig', () => {
    it('should return configuration with environment variables', () => {
      const config = getConfig();
      
      expect(config.supabase.url).toBe('https://test.supabase.co');
      expect(config.supabase.anonKey).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
      expect(config.github.token).toBe('ghp_test123');
      expect(config.app.env).toBe('test');
      expect(config.app.version).toBe('1.0.0');
      expect(config.api.baseUrl).toBe('http://localhost:3000');
      expect(config.api.n8nUrl).toBe('https://api.github.com');
    });

    it('should handle boolean environment variables correctly', () => {
      const config = getConfig();
      
      expect(config.features.enableAiAnalysis).toBe(true);
      expect(config.features.enableWorkflowSearch).toBe(true);
      expect(config.features.enableAgentRecommendations).toBe(false);
      expect(config.recommendations.enableLLM).toBe(true);
      expect(config.recommendations.enableCache).toBe(true);
    });

    it('should handle numeric environment variables correctly', () => {
      const config = getConfig();
      
      expect(config.recommendations.topK).toBe(5);
      expect(config.recommendations.llmTimeoutMs).toBe(2000);
      expect(config.recommendations.cacheTTLMinutes).toBe(30);
    });

    it('should use default values when environment variables are missing', () => {
      // Remove some env vars
      delete import.meta.env.VITE_APP_ENV;
      delete import.meta.env.VITE_APP_VERSION;
      delete import.meta.env.VITE_API_BASE_URL;
      delete import.meta.env.VITE_N8N_API_URL;
      delete import.meta.env.VITE_RECOMMENDATIONS_TOP_K;
      delete import.meta.env.VITE_RECOMMENDATIONS_LLM_TIMEOUT_MS;
      delete import.meta.env.VITE_RECOMMENDATIONS_CACHE_TTL_MINUTES;
      
      const config = getConfig();
      
      expect(config.app.env).toBe('development');
      expect(config.app.version).toBe('1.0.0');
      expect(config.api.baseUrl).toBe('http://localhost:3000');
      expect(config.api.n8nUrl).toBe('https://api.github.com');
      expect(config.recommendations.topK).toBe(6);
      expect(config.recommendations.llmTimeoutMs).toBe(3000);
      expect(config.recommendations.cacheTTLMinutes).toBe(60);
    });

    it('should handle various boolean formats', () => {
      // Test 'true' format
      import.meta.env.VITE_ENABLE_AI_ANALYSIS = 'true';
      let config = getConfig();
      expect(config.features.enableAiAnalysis).toBe(true);

      // Test 'false' format
      import.meta.env.VITE_ENABLE_AI_ANALYSIS = 'false';
      config = getConfig();
      expect(config.features.enableAiAnalysis).toBe(false);

      // Test '1' format
      import.meta.env.VITE_ENABLE_AI_ANALYSIS = '1';
      config = getConfig();
      expect(config.features.enableAiAnalysis).toBe(true);

      // Test '0' format
      import.meta.env.VITE_ENABLE_AI_ANALYSIS = '0';
      config = getConfig();
      expect(config.features.enableAiAnalysis).toBe(false);

      // Test 'yes' format
      import.meta.env.VITE_ENABLE_AI_ANALYSIS = 'yes';
      config = getConfig();
      expect(config.features.enableAiAnalysis).toBe(true);

      // Test 'no' format
      import.meta.env.VITE_ENABLE_AI_ANALYSIS = 'no';
      config = getConfig();
      expect(config.features.enableAiAnalysis).toBe(false);

      // Test 'on' format
      import.meta.env.VITE_ENABLE_AI_ANALYSIS = 'on';
      config = getConfig();
      expect(config.features.enableAiAnalysis).toBe(true);

      // Test 'off' format
      import.meta.env.VITE_ENABLE_AI_ANALYSIS = 'off';
      config = getConfig();
      expect(config.features.enableAiAnalysis).toBe(false);

      // Test invalid format (should use default)
      import.meta.env.VITE_ENABLE_AI_ANALYSIS = 'invalid';
      config = getConfig();
      expect(config.features.enableAiAnalysis).toBe(true); // default value
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const config = getConfig();
      const validation = validateConfig(config);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing Supabase URL', () => {
      delete import.meta.env.VITE_SUPABASE_URL;
      const config = getConfig();
      const validation = validateConfig(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Supabase URL is required (VITE_SUPABASE_URL)');
    });

    it('should detect invalid Supabase URL format', () => {
      import.meta.env.VITE_SUPABASE_URL = 'https://invalid.com';
      const config = getConfig();
      const validation = validateConfig(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Supabase URL format appears invalid (should contain "supabase.co")');
    });

    it('should detect missing Supabase anon key', () => {
      delete import.meta.env.VITE_SUPABASE_ANON_KEY;
      const config = getConfig();
      const validation = validateConfig(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Supabase anon key is required (VITE_SUPABASE_ANON_KEY)');
    });

    it('should detect invalid Supabase anon key format', () => {
      import.meta.env.VITE_SUPABASE_ANON_KEY = 'invalid_key';
      const config = getConfig();
      const validation = validateConfig(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Supabase anon key format appears invalid (should be a JWT token)');
    });

    it('should detect invalid GitHub token format', () => {
      import.meta.env.VITE_GITHUB_TOKEN = 'invalid_token';
      const config = getConfig();
      const validation = validateConfig(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('GitHub token format appears invalid (should start with "ghp_" or "github_pat_")');
    });

    it('should accept valid GitHub token formats', () => {
      // Test ghp_ format
      import.meta.env.VITE_GITHUB_TOKEN = 'ghp_valid123';
      let config = getConfig();
      let validation = validateConfig(config);
      expect(validation.isValid).toBe(true);

      // Test github_pat_ format
      import.meta.env.VITE_GITHUB_TOKEN = 'github_pat_valid123';
      config = getConfig();
      validation = validateConfig(config);
      expect(validation.isValid).toBe(true);
    });

    it('should detect default admin password in production', () => {
      import.meta.env.VITE_APP_ENV = 'production';
      import.meta.env.VITE_ADMIN_PASSWORD = 'admin123';
      const config = getConfig();
      const validation = validateConfig(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Default admin password detected in production environment - please set a secure password');
    });

    it('should not flag default admin password in non-production', () => {
      import.meta.env.VITE_APP_ENV = 'development';
      import.meta.env.VITE_ADMIN_PASSWORD = 'admin123';
      const config = getConfig();
      const validation = validateConfig(config);
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('should get GitHub configuration', () => {
      const githubConfig = getGitHubConfig();
      
      expect(githubConfig.token).toBe('ghp_test123');
      expect(githubConfig.baseUrl).toBe('https://api.github.com');
    });

    it('should check if AI is enabled', () => {
      expect(isAIEnabled()).toBe(true);
      
      import.meta.env.VITE_ENABLE_AI_ANALYSIS = 'false';
      expect(isAIEnabled()).toBe(false);
    });

    it('should get recommendations configuration', () => {
      const recommendationsConfig = getRecommendationsConfig();
      
      expect(recommendationsConfig.enableLLM).toBe(true);
      expect(recommendationsConfig.topK).toBe(5);
      expect(recommendationsConfig.llmTimeoutMs).toBe(2000);
      expect(recommendationsConfig.enableCache).toBe(true);
      expect(recommendationsConfig.cacheTTLMinutes).toBe(30);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined environment variables gracefully', () => {
      // Remove all env vars
      Object.keys(import.meta.env).forEach(key => {
        if (key.startsWith('VITE_')) {
          delete import.meta.env[key];
        }
      });
      
      const config = getConfig();
      const validation = validateConfig(config);
      
      // Should have errors for required fields
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty string environment variables', () => {
      import.meta.env.VITE_SUPABASE_URL = '';
      import.meta.env.VITE_SUPABASE_ANON_KEY = '';
      
      const config = getConfig();
      const validation = validateConfig(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Supabase URL is required (VITE_SUPABASE_URL)');
      expect(validation.errors).toContain('Supabase anon key is required (VITE_SUPABASE_ANON_KEY)');
    });

    it('should handle numeric environment variables with invalid values', () => {
      import.meta.env.VITE_RECOMMENDATIONS_TOP_K = 'invalid';
      import.meta.env.VITE_RECOMMENDATIONS_LLM_TIMEOUT_MS = 'not_a_number';
      import.meta.env.VITE_RECOMMENDATIONS_CACHE_TTL_MINUTES = 'also_invalid';
      
      const config = getConfig();
      
      // Should use default values for invalid numbers
      expect(config.recommendations.topK).toBe(6);
      expect(config.recommendations.llmTimeoutMs).toBe(3000);
      expect(config.recommendations.cacheTTLMinutes).toBe(60);
    });
  });
});
