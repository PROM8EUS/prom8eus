/**
 * Feature Toggle Management
 * 
 * Lightweight feature toggle system using environment variables and local configuration
 * Replaces the complex Supabase RPC-based feature flag system
 */

export interface FeatureToggleConfig {
  environment?: string;
  userId?: string;
  userRole?: string;
}

export interface FeatureToggle {
  name: string;
  description?: string;
  enabled: boolean;
  environment?: string;
  metadata?: Record<string, any>;
}

export class FeatureToggleManager {
  private config: FeatureToggleConfig;
  private localToggles: Map<string, FeatureToggle> = new Map();

  constructor(config: FeatureToggleConfig = {}) {
    this.config = {
      environment: 'development',
      ...config
    };
    
    // Initialize local toggles from environment variables
    this.initializeLocalToggles();
  }

  /**
   * Initialize feature toggles from environment variables
   */
  private initializeLocalToggles(): void {
    // Unified Workflow Schema toggles
    this.setLocalToggle('unified_workflow_schema', {
      name: 'unified_workflow_schema',
      description: 'Enable unified workflow schema',
      enabled: this.getEnvToggle('VITE_UNIFIED_WORKFLOW_SCHEMA', true),
      environment: this.config.environment
    });

    this.setLocalToggle('unified_workflow_read', {
      name: 'unified_workflow_read',
      description: 'Enable unified workflow read operations',
      enabled: this.getEnvToggle('VITE_UNIFIED_WORKFLOW_READ', true),
      environment: this.config.environment
    });

    this.setLocalToggle('unified_workflow_write', {
      name: 'unified_workflow_write',
      description: 'Enable unified workflow write operations',
      enabled: this.getEnvToggle('VITE_UNIFIED_WORKFLOW_WRITE', true),
      environment: this.config.environment
    });

    this.setLocalToggle('unified_workflow_search', {
      name: 'unified_workflow_search',
      description: 'Enable unified workflow search',
      enabled: this.getEnvToggle('VITE_UNIFIED_WORKFLOW_SEARCH', true),
      environment: this.config.environment
    });

    this.setLocalToggle('unified_workflow_ai_generation', {
      name: 'unified_workflow_ai_generation',
      description: 'Enable unified workflow AI generation',
      enabled: this.getEnvToggle('VITE_UNIFIED_WORKFLOW_AI_GENERATION', true),
      environment: this.config.environment
    });

    this.setLocalToggle('unified_workflow_migration', {
      name: 'unified_workflow_migration',
      description: 'Enable unified workflow migration',
      enabled: this.getEnvToggle('VITE_UNIFIED_WORKFLOW_MIGRATION', false),
      environment: this.config.environment
    });

    this.setLocalToggle('unified_workflow_frontend', {
      name: 'unified_workflow_frontend',
      description: 'Enable unified workflow frontend features',
      enabled: this.getEnvToggle('VITE_UNIFIED_WORKFLOW_FRONTEND', true),
      environment: this.config.environment
    });

    this.setLocalToggle('unified_workflow_analytics', {
      name: 'unified_workflow_analytics',
      description: 'Enable unified workflow analytics',
      enabled: this.getEnvToggle('VITE_UNIFIED_WORKFLOW_ANALYTICS', false),
      environment: this.config.environment
    });

    this.setLocalToggle('unified_workflow_generator', {
      name: 'unified_workflow_generator',
      description: 'Enable unified workflow generator (experimental)',
      enabled: this.getEnvToggle('VITE_UNIFIED_WORKFLOW_GENERATOR', false),
      environment: this.config.environment
    });

    this.setLocalToggle('experimental_features', {
      name: 'experimental_features',
      description: 'Enable experimental features and functions',
      enabled: this.getEnvToggle('VITE_EXPERIMENTAL_FEATURES', false),
      environment: this.config.environment
    });

    // General feature toggles
    this.setLocalToggle('ai_analysis', {
      name: 'ai_analysis',
      description: 'Enable AI analysis features',
      enabled: this.getEnvToggle('VITE_ENABLE_AI_ANALYSIS', true),
      environment: this.config.environment
    });

    this.setLocalToggle('workflow_search', {
      name: 'workflow_search',
      description: 'Enable workflow search features',
      enabled: this.getEnvToggle('VITE_ENABLE_WORKFLOW_SEARCH', true),
      environment: this.config.environment
    });

    this.setLocalToggle('agent_recommendations', {
      name: 'agent_recommendations',
      description: 'Enable agent recommendations',
      enabled: this.getEnvToggle('VITE_ENABLE_AGENT_RECOMMENDATIONS', true),
      environment: this.config.environment
    });

    this.setLocalToggle('llm_recommendations', {
      name: 'llm_recommendations',
      description: 'Enable LLM recommendations',
      enabled: this.getEnvToggle('VITE_RECOMMENDATIONS_ENABLE_LLM', true),
      environment: this.config.environment
    });

    this.setLocalToggle('cache_enabled', {
      name: 'cache_enabled',
      description: 'Enable caching features',
      enabled: this.getEnvToggle('VITE_RECOMMENDATIONS_ENABLE_CACHE', true),
      environment: this.config.environment
    });
  }

  /**
   * Get environment variable toggle value
   */
  private getEnvToggle(envVar: string, defaultValue: boolean): boolean {
    const value = import.meta.env[envVar];
    
    if (value === undefined) {
      return defaultValue;
    }
    
    // Handle various truthy values
    if (value === 'true' || value === '1' || value === 'yes' || value === 'on') {
      return true;
    }
    
    if (value === 'false' || value === '0' || value === 'no' || value === 'off') {
      return false;
    }
    
    // Default to the provided default value for unrecognized values
    return defaultValue;
  }

  /**
   * Set a local toggle
   */
  private setLocalToggle(name: string, toggle: FeatureToggle): void {
    this.localToggles.set(name, toggle);
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(toggleName: string): boolean {
    const toggle = this.localToggles.get(toggleName);
    
    if (!toggle) {
      console.warn(`Feature toggle '${toggleName}' not found. Defaulting to disabled.`);
      return false;
    }
    
    return toggle.enabled;
  }

  /**
   * Get all enabled toggles
   */
  getEnabledToggles(): FeatureToggle[] {
    return Array.from(this.localToggles.values()).filter(toggle => toggle.enabled);
  }

  /**
   * Get toggle status
   */
  getToggleStatus(toggleName: string): FeatureToggle | null {
    return this.localToggles.get(toggleName) || null;
  }

  /**
   * Get all toggles
   */
  getAllToggles(): FeatureToggle[] {
    return Array.from(this.localToggles.values());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FeatureToggleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Reinitialize toggles with new config
    this.initializeLocalToggles();
  }

  /**
   * Override a toggle (useful for testing)
   */
  overrideToggle(toggleName: string, enabled: boolean): void {
    const toggle = this.localToggles.get(toggleName);
    if (toggle) {
      toggle.enabled = enabled;
    } else {
      this.setLocalToggle(toggleName, {
        name: toggleName,
        description: `Override for ${toggleName}`,
        enabled,
        environment: this.config.environment
      });
    }
  }

  /**
   * Reset all overrides
   */
  resetOverrides(): void {
    this.initializeLocalToggles();
  }
}

// Unified Workflow Schema Feature Toggle Names
export const UNIFIED_WORKFLOW_TOGGLES = {
  SCHEMA: 'unified_workflow_schema',
  READ: 'unified_workflow_read',
  WRITE: 'unified_workflow_write',
  SEARCH: 'unified_workflow_search',
  AI_GENERATION: 'unified_workflow_ai_generation',
  MIGRATION: 'unified_workflow_migration',
  FRONTEND: 'unified_workflow_frontend',
  ANALYTICS: 'unified_workflow_analytics'
} as const;

// Global feature toggle manager instance
let globalFeatureToggleManager: FeatureToggleManager | null = null;

/**
 * Initialize the global feature toggle manager
 */
export function initializeFeatureToggles(config: FeatureToggleConfig = {}): FeatureToggleManager {
  globalFeatureToggleManager = new FeatureToggleManager(config);
  return globalFeatureToggleManager;
}

/**
 * Get the global feature toggle manager
 */
export function getFeatureToggleManager(): FeatureToggleManager {
  if (!globalFeatureToggleManager) {
    globalFeatureToggleManager = new FeatureToggleManager();
  }
  return globalFeatureToggleManager;
}

/**
 * Check if unified workflow schema is enabled
 */
export function isUnifiedWorkflowEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled(UNIFIED_WORKFLOW_TOGGLES.SCHEMA);
}

/**
 * Check if unified workflow read is enabled
 */
export function isUnifiedWorkflowReadEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled(UNIFIED_WORKFLOW_TOGGLES.READ);
}

/**
 * Check if unified workflow write is enabled
 */
export function isUnifiedWorkflowWriteEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled(UNIFIED_WORKFLOW_TOGGLES.WRITE);
}

/**
 * Check if unified workflow search is enabled
 */
export function isUnifiedWorkflowSearchEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled(UNIFIED_WORKFLOW_TOGGLES.SEARCH);
}

/**
 * Check if unified workflow AI generation is enabled
 */
export function isUnifiedWorkflowAIGenerationEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled(UNIFIED_WORKFLOW_TOGGLES.AI_GENERATION);
}

/**
 * Check if unified workflow frontend is enabled
 */
export function isUnifiedWorkflowFrontendEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled(UNIFIED_WORKFLOW_TOGGLES.FRONTEND);
}

/**
 * Check if unified workflow generator is enabled
 */
export function isUnifiedWorkflowGeneratorEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled('unified_workflow_generator');
}

/**
 * Check if experimental features are enabled
 */
export function isExperimentalFeaturesEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled('experimental_features');
}

/**
 * Check if AI analysis is enabled
 */
export function isAIAnalysisEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled('ai_analysis');
}

/**
 * Check if workflow search is enabled
 */
export function isWorkflowSearchEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled('workflow_search');
}

/**
 * Check if agent recommendations are enabled
 */
export function isAgentRecommendationsEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled('agent_recommendations');
}

/**
 * Check if LLM recommendations are enabled
 */
export function isLLMRecommendationsEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled('llm_recommendations');
}

/**
 * Check if caching is enabled
 */
export function isCacheEnabled(): boolean {
  const manager = getFeatureToggleManager();
  return manager.isEnabled('cache_enabled');
}

/**
 * React hook for feature toggles
 */
export function useFeatureToggle(toggleName: string): {
  enabled: boolean;
  loading: boolean;
  error: string | null;
} {
  const [enabled, setEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      
      const manager = getFeatureToggleManager();
      const isEnabled = manager.isEnabled(toggleName);
      
      setEnabled(isEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [toggleName]);

  return { enabled, loading, error };
}

/**
 * React hook for unified workflow toggles
 */
export function useUnifiedWorkflowToggles() {
  const schema = useFeatureToggle(UNIFIED_WORKFLOW_TOGGLES.SCHEMA);
  const read = useFeatureToggle(UNIFIED_WORKFLOW_TOGGLES.READ);
  const write = useFeatureToggle(UNIFIED_WORKFLOW_TOGGLES.WRITE);
  const search = useFeatureToggle(UNIFIED_WORKFLOW_TOGGLES.SEARCH);
  const aiGeneration = useFeatureToggle(UNIFIED_WORKFLOW_TOGGLES.AI_GENERATION);
  const frontend = useFeatureToggle(UNIFIED_WORKFLOW_TOGGLES.FRONTEND);

  return {
    schema,
    read,
    write,
    search,
    aiGeneration,
    frontend,
    loading: schema.loading || read.loading || write.loading || search.loading || aiGeneration.loading || frontend.loading,
    error: schema.error || read.error || write.error || search.error || aiGeneration.error || frontend.error
  };
}

// Import React for hooks
import React from 'react';
