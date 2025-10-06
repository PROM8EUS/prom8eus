/**
 * Shared Feature Toggle Utilities for Supabase Edge Functions
 * 
 * This module provides a consistent way to check feature toggles
 * across all Supabase Edge Functions using environment variables.
 */

/**
 * Check if a feature toggle is enabled
 * @param toggleName - The name of the feature toggle
 * @returns boolean indicating if the toggle is enabled
 */
export function checkFeatureToggle(toggleName: string): boolean {
  // Map toggle names to environment variables
  const envVarMap: Record<string, string> = {
    'unified_workflow_read': 'UNIFIED_WORKFLOW_READ',
    'unified_workflow_write': 'UNIFIED_WORKFLOW_WRITE',
    'unified_workflow_schema': 'UNIFIED_WORKFLOW_SCHEMA',
    'unified_workflow_search': 'UNIFIED_WORKFLOW_SEARCH',
    'unified_workflow_ai_generation': 'UNIFIED_WORKFLOW_AI_GENERATION',
    'unified_workflow_frontend': 'UNIFIED_WORKFLOW_FRONTEND',
    'unified_workflow_migration': 'UNIFIED_WORKFLOW_MIGRATION',
    'unified_workflow_analytics': 'UNIFIED_WORKFLOW_ANALYTICS'
  };

  const envVar = envVarMap[toggleName];
  if (!envVar) {
    console.warn(`Unknown feature toggle: ${toggleName}`);
    return false;
  }

  const value = Deno.env.get(envVar);
  
  if (value === undefined) {
    // Use default values for each toggle
    const defaults: Record<string, boolean> = {
      'unified_workflow_read': true,
      'unified_workflow_write': true,
      'unified_workflow_schema': true,
      'unified_workflow_search': true,
      'unified_workflow_ai_generation': true,
      'unified_workflow_frontend': true,
      'unified_workflow_migration': false,
      'unified_workflow_analytics': false
    };
    return defaults[toggleName] || false;
  }
  
  // Handle various truthy values
  if (value === 'true' || value === '1' || value === 'yes' || value === 'on') {
    return true;
  }
  
  if (value === 'false' || value === '0' || value === 'no' || value === 'off') {
    return false;
  }
  
  // Default to false for unrecognized values
  console.warn(`Invalid feature toggle value for ${toggleName}: ${value}`);
  return false;
}

/**
 * Check if unified workflow schema is enabled
 * @returns boolean indicating if unified workflow schema is enabled
 */
export function isUnifiedWorkflowEnabled(): boolean {
  return checkFeatureToggle('unified_workflow_schema');
}

/**
 * Check if unified workflow read is enabled
 * @returns boolean indicating if unified workflow read is enabled
 */
export function isUnifiedWorkflowReadEnabled(): boolean {
  return checkFeatureToggle('unified_workflow_read');
}

/**
 * Check if unified workflow write is enabled
 * @returns boolean indicating if unified workflow write is enabled
 */
export function isUnifiedWorkflowWriteEnabled(): boolean {
  return checkFeatureToggle('unified_workflow_write');
}

/**
 * Check if unified workflow search is enabled
 * @returns boolean indicating if unified workflow search is enabled
 */
export function isUnifiedWorkflowSearchEnabled(): boolean {
  return checkFeatureToggle('unified_workflow_search');
}

/**
 * Check if unified workflow AI generation is enabled
 * @returns boolean indicating if unified workflow AI generation is enabled
 */
export function isUnifiedWorkflowAIGenerationEnabled(): boolean {
  return checkFeatureToggle('unified_workflow_ai_generation');
}

/**
 * Check if unified workflow frontend is enabled
 * @returns boolean indicating if unified workflow frontend is enabled
 */
export function isUnifiedWorkflowFrontendEnabled(): boolean {
  return checkFeatureToggle('unified_workflow_frontend');
}

/**
 * Check if unified workflow migration is enabled
 * @returns boolean indicating if unified workflow migration is enabled
 */
export function isUnifiedWorkflowMigrationEnabled(): boolean {
  return checkFeatureToggle('unified_workflow_migration');
}

/**
 * Check if unified workflow analytics is enabled
 * @returns boolean indicating if unified workflow analytics is enabled
 */
export function isUnifiedWorkflowAnalyticsEnabled(): boolean {
  return checkFeatureToggle('unified_workflow_analytics');
}
