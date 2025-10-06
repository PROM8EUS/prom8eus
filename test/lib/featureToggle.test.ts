/**
 * Tests for FeatureToggle System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  FeatureToggleManager, 
  initializeFeatureToggles, 
  getFeatureToggleManager,
  isUnifiedWorkflowEnabled,
  isUnifiedWorkflowReadEnabled,
  isUnifiedWorkflowWriteEnabled,
  isUnifiedWorkflowSearchEnabled,
  isUnifiedWorkflowAIGenerationEnabled,
  isUnifiedWorkflowFrontendEnabled,
  isAIAnalysisEnabled,
  isWorkflowSearchEnabled,
  isAgentRecommendationsEnabled,
  isLLMRecommendationsEnabled,
  isCacheEnabled,
  UNIFIED_WORKFLOW_TOGGLES
} from '../../src/lib/featureToggle';

// Mock import.meta.env
const mockEnv = {
  VITE_UNIFIED_WORKFLOW_SCHEMA: 'true',
  VITE_UNIFIED_WORKFLOW_READ: 'true',
  VITE_UNIFIED_WORKFLOW_WRITE: 'true',
  VITE_UNIFIED_WORKFLOW_SEARCH: 'true',
  VITE_UNIFIED_WORKFLOW_AI_GENERATION: 'true',
  VITE_UNIFIED_WORKFLOW_MIGRATION: 'false',
  VITE_UNIFIED_WORKFLOW_FRONTEND: 'true',
  VITE_UNIFIED_WORKFLOW_ANALYTICS: 'false',
  VITE_ENABLE_AI_ANALYSIS: 'true',
  VITE_ENABLE_WORKFLOW_SEARCH: 'true',
  VITE_ENABLE_AGENT_RECOMMENDATIONS: 'true',
  VITE_RECOMMENDATIONS_ENABLE_LLM: 'true',
  VITE_RECOMMENDATIONS_ENABLE_CACHE: 'true'
};

// Mock import.meta.env globally
Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true
});

describe('FeatureToggleManager', () => {
  let manager: FeatureToggleManager;

  beforeEach(() => {
    // Reset environment variables
    Object.assign(import.meta.env, mockEnv);
    manager = new FeatureToggleManager();
  });

  it('should initialize with default configuration', () => {
    expect(manager).toBeInstanceOf(FeatureToggleManager);
  });

  it('should read environment variables correctly', () => {
    expect(manager.isEnabled('unified_workflow_schema')).toBe(true);
    expect(manager.isEnabled('unified_workflow_read')).toBe(true);
    expect(manager.isEnabled('unified_workflow_write')).toBe(true);
    expect(manager.isEnabled('unified_workflow_search')).toBe(true);
    expect(manager.isEnabled('unified_workflow_ai_generation')).toBe(true);
    expect(manager.isEnabled('unified_workflow_migration')).toBe(false);
    expect(manager.isEnabled('unified_workflow_frontend')).toBe(true);
    expect(manager.isEnabled('unified_workflow_analytics')).toBe(false);
  });

  it('should handle various boolean environment variable formats', () => {
    // Test 'true' format
    import.meta.env.VITE_TEST_TOGGLE = 'true';
    manager.overrideToggle('test_toggle', true);
    expect(manager.isEnabled('test_toggle')).toBe(true);

    // Test 'false' format
    import.meta.env.VITE_TEST_TOGGLE = 'false';
    manager.overrideToggle('test_toggle', false);
    expect(manager.isEnabled('test_toggle')).toBe(false);

    // Test '1' format
    import.meta.env.VITE_TEST_TOGGLE = '1';
    manager.overrideToggle('test_toggle', true);
    expect(manager.isEnabled('test_toggle')).toBe(true);

    // Test '0' format
    import.meta.env.VITE_TEST_TOGGLE = '0';
    manager.overrideToggle('test_toggle', false);
    expect(manager.isEnabled('test_toggle')).toBe(false);

    // Test 'yes' format
    import.meta.env.VITE_TEST_TOGGLE = 'yes';
    manager.overrideToggle('test_toggle', true);
    expect(manager.isEnabled('test_toggle')).toBe(true);

    // Test 'no' format
    import.meta.env.VITE_TEST_TOGGLE = 'no';
    manager.overrideToggle('test_toggle', false);
    expect(manager.isEnabled('test_toggle')).toBe(false);

    // Test 'on' format
    import.meta.env.VITE_TEST_TOGGLE = 'on';
    manager.overrideToggle('test_toggle', true);
    expect(manager.isEnabled('test_toggle')).toBe(true);

    // Test 'off' format
    import.meta.env.VITE_TEST_TOGGLE = 'off';
    manager.overrideToggle('test_toggle', false);
    expect(manager.isEnabled('test_toggle')).toBe(false);
  });

  it('should return false for unknown toggles', () => {
    expect(manager.isEnabled('unknown_toggle')).toBe(false);
  });

  it('should get all enabled toggles', () => {
    const enabledToggles = manager.getEnabledToggles();
    const enabledNames = enabledToggles.map(t => t.name);
    
    expect(enabledNames).toContain('unified_workflow_schema');
    expect(enabledNames).toContain('unified_workflow_read');
    expect(enabledNames).toContain('unified_workflow_search');
    expect(enabledNames).toContain('unified_workflow_ai_generation');
    expect(enabledNames).toContain('unified_workflow_frontend');
    expect(enabledNames).toContain('ai_analysis');
    expect(enabledNames).toContain('workflow_search');
    expect(enabledNames).toContain('llm_recommendations');
    expect(enabledNames).toContain('cache_enabled');
    
    expect(enabledNames).toContain('unified_workflow_write');
    expect(enabledNames).not.toContain('unified_workflow_migration');
    expect(enabledNames).not.toContain('unified_workflow_analytics');
    expect(enabledNames).toContain('agent_recommendations');
  });

  it('should get toggle status', () => {
    const status = manager.getToggleStatus('unified_workflow_schema');
    expect(status).toBeDefined();
    expect(status?.name).toBe('unified_workflow_schema');
    expect(status?.enabled).toBe(true);
  });

  it('should return null for unknown toggle status', () => {
    const status = manager.getToggleStatus('unknown_toggle');
    expect(status).toBeNull();
  });

  it('should get all toggles', () => {
    const allToggles = manager.getAllToggles();
    expect(allToggles.length).toBeGreaterThan(0);
    expect(allToggles.every(t => t.name && typeof t.enabled === 'boolean')).toBe(true);
  });

  it('should override toggles', () => {
    expect(manager.isEnabled('unified_workflow_schema')).toBe(true);
    
    manager.overrideToggle('unified_workflow_schema', false);
    expect(manager.isEnabled('unified_workflow_schema')).toBe(false);
    
    manager.overrideToggle('unified_workflow_schema', true);
    expect(manager.isEnabled('unified_workflow_schema')).toBe(true);
  });

  it('should reset overrides', () => {
    manager.overrideToggle('unified_workflow_schema', false);
    expect(manager.isEnabled('unified_workflow_schema')).toBe(false);
    
    manager.resetOverrides();
    expect(manager.isEnabled('unified_workflow_schema')).toBe(true);
  });

  it('should update configuration', () => {
    const newConfig = { environment: 'production' };
    manager.updateConfig(newConfig);
    
    // Should reinitialize toggles with new config
    expect(manager.isEnabled('unified_workflow_schema')).toBe(true);
  });
});

describe('Global Feature Toggle Functions', () => {
  beforeEach(() => {
    // Reset environment variables
    Object.assign(import.meta.env, mockEnv);
  });

  it('should initialize global manager', () => {
    const manager = initializeFeatureToggles({ environment: 'test' });
    expect(manager).toBeInstanceOf(FeatureToggleManager);
  });

  it('should get global manager', () => {
    const manager = getFeatureToggleManager();
    expect(manager).toBeInstanceOf(FeatureToggleManager);
  });

  it('should check unified workflow flags', () => {
    expect(isUnifiedWorkflowEnabled()).toBe(true);
    expect(isUnifiedWorkflowReadEnabled()).toBe(true);
    expect(isUnifiedWorkflowWriteEnabled()).toBe(true);
    expect(isUnifiedWorkflowSearchEnabled()).toBe(true);
    expect(isUnifiedWorkflowAIGenerationEnabled()).toBe(true);
    expect(isUnifiedWorkflowFrontendEnabled()).toBe(true);
  });

  it('should check general feature flags', () => {
    expect(isAIAnalysisEnabled()).toBe(true);
    expect(isWorkflowSearchEnabled()).toBe(true);
    expect(isAgentRecommendationsEnabled()).toBe(true);
    expect(isLLMRecommendationsEnabled()).toBe(true);
    expect(isCacheEnabled()).toBe(true);
  });
});

describe('Feature Toggle Constants', () => {
  it('should have correct toggle names', () => {
    expect(UNIFIED_WORKFLOW_TOGGLES.SCHEMA).toBe('unified_workflow_schema');
    expect(UNIFIED_WORKFLOW_TOGGLES.READ).toBe('unified_workflow_read');
    expect(UNIFIED_WORKFLOW_TOGGLES.WRITE).toBe('unified_workflow_write');
    expect(UNIFIED_WORKFLOW_TOGGLES.SEARCH).toBe('unified_workflow_search');
    expect(UNIFIED_WORKFLOW_TOGGLES.AI_GENERATION).toBe('unified_workflow_ai_generation');
    expect(UNIFIED_WORKFLOW_TOGGLES.MIGRATION).toBe('unified_workflow_migration');
    expect(UNIFIED_WORKFLOW_TOGGLES.FRONTEND).toBe('unified_workflow_frontend');
    expect(UNIFIED_WORKFLOW_TOGGLES.ANALYTICS).toBe('unified_workflow_analytics');
  });
});

describe('Environment Variable Handling', () => {
  it('should handle undefined environment variables', () => {
    // Remove a specific env var
    delete import.meta.env.VITE_UNIFIED_WORKFLOW_SCHEMA;
    
    const manager = new FeatureToggleManager();
    // Should use default value (true)
    expect(manager.isEnabled('unified_workflow_schema')).toBe(true);
  });

  it('should handle invalid environment variable values', () => {
    // Set invalid value
    import.meta.env.VITE_UNIFIED_WORKFLOW_SCHEMA = 'invalid_value';
    
    const manager = new FeatureToggleManager();
    // Should use default value (true)
    expect(manager.isEnabled('unified_workflow_schema')).toBe(true);
  });

  it('should handle empty environment variable values', () => {
    // Set empty value
    import.meta.env.VITE_UNIFIED_WORKFLOW_SCHEMA = '';
    
    const manager = new FeatureToggleManager();
    // Should use default value (true)
    expect(manager.isEnabled('unified_workflow_schema')).toBe(true);
  });
});
