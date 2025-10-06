/**
 * Feature Flags Management
 * 
 * Client-side feature flag management for gradual rollout
 */

import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  name: string;
  description?: string;
  enabled: boolean;
  rollout_percentage: number;
  target_users: string[];
  target_roles: string[];
  environment: string;
  metadata: Record<string, any>;
}

export interface FeatureFlagConfig {
  userId?: string;
  userRole?: string;
  environment?: string;
  cacheTimeout?: number; // in milliseconds
}

class FeatureFlagManager {
  private cache = new Map<string, { value: boolean; timestamp: number }>();
  private config: FeatureFlagConfig;
  private cacheTimeout: number;

  constructor(config: FeatureFlagConfig = {}) {
    this.config = {
      environment: 'production',
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      ...config
    };
    this.cacheTimeout = this.config.cacheTimeout || 5 * 60 * 1000;
  }

  /**
   * Check if a feature is enabled
   */
  async isEnabled(flagName: string): Promise<boolean> {
    const cacheKey = `${flagName}_${this.config.userId}_${this.config.environment}`;
    const cached = this.cache.get(cacheKey);

    // Return cached value if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }

    try {
      const { data, error } = await supabase.rpc('is_feature_enabled', {
        flag_name: flagName,
        user_id: this.config.userId || null,
        user_role: this.config.userRole || null,
        environment_name: this.config.environment || 'production'
      });

      if (error) {
        console.warn(`Feature flag check failed for ${flagName}:`, error);
        return false; // Default to disabled on error
      }

      const isEnabled = Boolean(data);
      
      // Cache the result
      this.cache.set(cacheKey, {
        value: isEnabled,
        timestamp: Date.now()
      });

      return isEnabled;
    } catch (error) {
      console.error(`Feature flag check error for ${flagName}:`, error);
      return false; // Default to disabled on error
    }
  }

  /**
   * Get all enabled features for the current user
   */
  async getEnabledFeatures(): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await supabase.rpc('get_enabled_features', {
        user_id: this.config.userId || null,
        user_role: this.config.userRole || null,
        environment_name: this.config.environment || 'production'
      });

      if (error) {
        console.warn('Failed to get enabled features:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting enabled features:', error);
      return [];
    }
  }

  /**
   * Get feature flag status
   */
  async getFeatureStatus(flagName: string): Promise<FeatureFlag | null> {
    try {
      const { data, error } = await supabase.rpc('get_feature_status', {
        flag_name: flagName,
        environment_name: this.config.environment || 'production'
      });

      if (error) {
        console.warn(`Failed to get feature status for ${flagName}:`, error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error(`Error getting feature status for ${flagName}:`, error);
      return null;
    }
  }

  /**
   * Clear cache for a specific flag or all flags
   */
  clearCache(flagName?: string): void {
    if (flagName) {
      const keys = Array.from(this.cache.keys()).filter(key => key.startsWith(flagName));
      keys.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FeatureFlagConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Clear cache when config changes
    this.clearCache();
  }
}

// Unified Workflow Schema Feature Flags
export const UNIFIED_WORKFLOW_FLAGS = {
  SCHEMA: 'unified_workflow_schema',
  READ: 'unified_workflow_read',
  WRITE: 'unified_workflow_write',
  SEARCH: 'unified_workflow_search',
  AI_GENERATION: 'unified_workflow_ai_generation',
  MIGRATION: 'unified_workflow_migration',
  FRONTEND: 'unified_workflow_frontend',
  ANALYTICS: 'unified_workflow_analytics'
} as const;

// Global feature flag manager instance
let globalFeatureFlagManager: FeatureFlagManager | null = null;

/**
 * Initialize the global feature flag manager
 */
export function initializeFeatureFlags(config: FeatureFlagConfig = {}): FeatureFlagManager {
  globalFeatureFlagManager = new FeatureFlagManager(config);
  return globalFeatureFlagManager;
}

/**
 * Get the global feature flag manager
 */
export function getFeatureFlagManager(): FeatureFlagManager {
  if (!globalFeatureFlagManager) {
    globalFeatureFlagManager = new FeatureFlagManager();
  }
  return globalFeatureFlagManager;
}

/**
 * Check if unified workflow schema is enabled
 */
export async function isUnifiedWorkflowEnabled(): Promise<boolean> {
  const manager = getFeatureFlagManager();
  return await manager.isEnabled(UNIFIED_WORKFLOW_FLAGS.SCHEMA);
}

/**
 * Check if unified workflow read is enabled
 */
export async function isUnifiedWorkflowReadEnabled(): Promise<boolean> {
  const manager = getFeatureFlagManager();
  return await manager.isEnabled(UNIFIED_WORKFLOW_FLAGS.READ);
}

/**
 * Check if unified workflow write is enabled
 */
export async function isUnifiedWorkflowWriteEnabled(): Promise<boolean> {
  const manager = getFeatureFlagManager();
  return await manager.isEnabled(UNIFIED_WORKFLOW_FLAGS.WRITE);
}

/**
 * Check if unified workflow search is enabled
 */
export async function isUnifiedWorkflowSearchEnabled(): Promise<boolean> {
  const manager = getFeatureFlagManager();
  return await manager.isEnabled(UNIFIED_WORKFLOW_FLAGS.SEARCH);
}

/**
 * Check if unified workflow AI generation is enabled
 */
export async function isUnifiedWorkflowAIGenerationEnabled(): Promise<boolean> {
  const manager = getFeatureFlagManager();
  return await manager.isEnabled(UNIFIED_WORKFLOW_FLAGS.AI_GENERATION);
}

/**
 * Check if unified workflow frontend is enabled
 */
export async function isUnifiedWorkflowFrontendEnabled(): Promise<boolean> {
  const manager = getFeatureFlagManager();
  return await manager.isEnabled(UNIFIED_WORKFLOW_FLAGS.FRONTEND);
}

/**
 * React hook for feature flags
 */
export function useFeatureFlag(flagName: string): {
  enabled: boolean;
  loading: boolean;
  error: string | null;
} {
  const [enabled, setEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const checkFlag = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const manager = getFeatureFlagManager();
        const isEnabled = await manager.isEnabled(flagName);
        
        if (mounted) {
          setEnabled(isEnabled);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setEnabled(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkFlag();

    return () => {
      mounted = false;
    };
  }, [flagName]);

  return { enabled, loading, error };
}

/**
 * React hook for unified workflow flags
 */
export function useUnifiedWorkflowFlags() {
  const schema = useFeatureFlag(UNIFIED_WORKFLOW_FLAGS.SCHEMA);
  const read = useFeatureFlag(UNIFIED_WORKFLOW_FLAGS.READ);
  const write = useFeatureFlag(UNIFIED_WORKFLOW_FLAGS.WRITE);
  const search = useFeatureFlag(UNIFIED_WORKFLOW_FLAGS.SEARCH);
  const aiGeneration = useFeatureFlag(UNIFIED_WORKFLOW_FLAGS.AI_GENERATION);
  const frontend = useFeatureFlag(UNIFIED_WORKFLOW_FLAGS.FRONTEND);

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
