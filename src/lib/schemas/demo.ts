/**
 * Demo Implementation für UnifiedWorkflow Schema
 * Zeigt die Verwendung des neuen einheitlichen Schemas
 */

import { UnifiedWorkflow, WorkflowCreationContext, WorkflowSearchParams } from './unifiedWorkflow';
import { WorkflowMigration, ComponentMigration } from './migration';
import { generateUnifiedWorkflow, generateMultipleUnifiedWorkflows } from '../workflowGenerator';

/**
 * Demo: Migration von Legacy Workflows
 */
export function demoMigration() {
  console.log('🔄 [Demo] Starting Workflow Schema Migration Demo...');
  
  // Beispiel Legacy Workflow (WorkflowIndex)
  const legacyWorkflowIndex = {
    id: 'legacy-1',
    source: 'github',
    title: 'HR Onboarding Automation',
    summary: 'Automatisiert den Onboarding-Prozess für neue Mitarbeiter',
    link: 'https://github.com/example/hr-onboarding',
    category: 'HR',
    integrations: ['Slack', 'Google Sheets', 'Email'],
    complexity: 'Medium',
    triggerType: 'Webhook',
    nodeCount: 8,
    tags: ['hr', 'onboarding', 'automation'],
    authorName: 'John Doe',
    authorUsername: 'johndoe',
    authorVerified: true,
    analyzedAt: '2024-01-15T10:30:00Z',
    domains: ['hr', 'automation'],
    domain_confidences: [0.9, 0.8],
    domain_origin: 'llm'
  };
  
  // Migration zu UnifiedWorkflow
  const unifiedWorkflow = WorkflowMigration.migrateToUnified(legacyWorkflowIndex);
  
  console.log('✅ [Demo] Migrated WorkflowIndex to UnifiedWorkflow:', {
    id: unifiedWorkflow.id,
    title: unifiedWorkflow.title,
    source: unifiedWorkflow.source,
    complexity: unifiedWorkflow.complexity,
    integrations: unifiedWorkflow.integrations.length,
    isAIGenerated: unifiedWorkflow.isAIGenerated
  });
  
  return unifiedWorkflow;
}

/**
 * Demo: Batch Migration
 */
export function demoBatchMigration() {
  console.log('🔄 [Demo] Starting Batch Migration Demo...');
  
  const legacyWorkflows = [
    {
      id: 'legacy-1',
      source: 'github',
      title: 'HR Onboarding',
      summary: 'Onboarding automation',
      category: 'HR',
      integrations: ['Slack'],
      complexity: 'Medium'
    },
    {
      id: 'legacy-2',
      name: 'Marketing Campaign',
      description: 'Marketing automation',
      difficulty: 'Hard',
      url: 'https://n8n.io/workflow/123',
      jsonUrl: 'https://n8n.io/workflow/123.json'
    },
    {
      id: 'legacy-3',
      name: 'AI Generated Workflow',
      isAIGenerated: true,
      generationMetadata: {
        timestamp: Date.now(),
        model: 'gpt-4o-mini',
        language: 'de',
        cacheKey: 'ai_workflow_123'
      },
      n8nWorkflow: {
        name: 'AI Workflow',
        nodes: [],
        connections: {},
        active: true,
        settings: {},
        versionId: 'v1'
      }
    }
  ];
  
  const migrationReport = WorkflowMigration.generateMigrationReport(legacyWorkflows);
  
  console.log('📊 [Demo] Migration Report:', migrationReport);
  
  const unifiedWorkflows = WorkflowMigration.migrateBatch(legacyWorkflows);
  
  console.log('✅ [Demo] Batch Migration completed:', {
    total: unifiedWorkflows.length,
    types: unifiedWorkflows.map(w => w.source)
  });
  
  return unifiedWorkflows;
}

/**
 * Demo: Workflow Search mit UnifiedWorkflow
 */
export function demoWorkflowSearch() {
  console.log('🔍 [Demo] Starting Workflow Search Demo...');
  
  const searchParams: WorkflowSearchParams = {
    query: 'HR automation',
    category: 'HR',
    complexity: 'Medium',
    integrations: ['Slack', 'Google Sheets'],
    isAIGenerated: false,
    limit: 10,
    sortBy: 'relevance',
    sortOrder: 'desc'
  };
  
  console.log('🔍 [Demo] Search Parameters:', searchParams);
  
  // Simuliere Suchergebnisse
  const searchResults: UnifiedWorkflow[] = [
    {
      id: 'search-1',
      title: 'HR Onboarding Automation',
      description: 'Automatisiert den Onboarding-Prozess',
      source: 'github',
      category: 'HR',
      tags: ['hr', 'onboarding'],
      complexity: 'Medium',
      triggerType: 'Webhook',
      integrations: ['Slack', 'Google Sheets', 'Email'],
      createdAt: '2024-01-15T10:30:00Z',
      status: 'verified',
      isAIGenerated: false,
      active: true
    }
  ];
  
  console.log('✅ [Demo] Search Results:', {
    count: searchResults.length,
    results: searchResults.map(w => ({
      id: w.id,
      title: w.title,
      complexity: w.complexity,
      integrations: w.integrations.length
    }))
  });
  
  return searchResults;
}

/**
 * Demo: Workflow Creation Context
 */
export function demoWorkflowCreation() {
  console.log('🎯 [Demo] Starting Workflow Creation Demo...');
  
  const creationContext: WorkflowCreationContext = {
    subtaskId: 'task-123',
    language: 'de',
    timeout: 5000,
    variation: 0,
    context: 'subtask-specific',
    preferredComplexity: 'Medium',
    requiredIntegrations: ['Slack', 'Google Sheets'],
    maxSetupCost: 100
  };
  
  console.log('🎯 [Demo] Creation Context:', creationContext);
  
  // Simuliere Workflow-Generierung
  const mockSubtask = {
    id: 'task-123',
    title: 'Mitarbeiter Onboarding',
    description: 'Automatisierung des Onboarding-Prozesses',
    automationPotential: 0.8,
    estimatedTime: 4,
    priority: 'high' as const,
    complexity: 'medium' as const,
    systems: ['HR-System', 'Slack'],
    dependencies: [],
    risks: [],
    opportunities: ['Effizienzsteigerung'],
    aiTools: ['Workflow-Generator']
  };
  
  console.log('🎯 [Demo] Mock Subtask:', mockSubtask);
  
  return { creationContext, mockSubtask };
}

/**
 * Demo: Workflow Statistics
 */
export function demoWorkflowStats() {
  console.log('📊 [Demo] Starting Workflow Statistics Demo...');
  
  const stats = {
    total: 150,
    active: 120,
    inactive: 30,
    aiGenerated: 45,
    verified: 105,
    byComplexity: {
      Low: 50,
      Medium: 70,
      High: 30
    },
    byTriggerType: {
      Manual: 40,
      Webhook: 60,
      Scheduled: 30,
      Complex: 20
    },
    bySource: {
      'github': 60,
      'n8n.io': 45,
      'ai-generated': 30,
      'manual': 15
    },
    totalDownloads: 2500,
    averageRating: 4.2,
    topCategories: [
      { category: 'HR', count: 35 },
      { category: 'Marketing', count: 30 },
      { category: 'Sales', count: 25 }
    ],
    topIntegrations: [
      { integration: 'Slack', count: 80 },
      { integration: 'Google Sheets', count: 65 },
      { integration: 'Email', count: 50 }
    ]
  };
  
  console.log('📊 [Demo] Workflow Statistics:', stats);
  
  return stats;
}

/**
 * Demo: Vollständige Workflow-Pipeline
 */
export async function demoCompletePipeline() {
  console.log('🚀 [Demo] Starting Complete Workflow Pipeline Demo...');
  
  try {
    // 1. Migration Demo
    const migratedWorkflow = demoMigration();
    
    // 2. Batch Migration Demo
    const batchWorkflows = demoBatchMigration();
    
    // 3. Search Demo
    const searchResults = demoWorkflowSearch();
    
    // 4. Creation Context Demo
    const { creationContext, mockSubtask } = demoWorkflowCreation();
    
    // 5. Statistics Demo
    const stats = demoWorkflowStats();
    
    console.log('🎉 [Demo] Complete Pipeline Demo finished successfully!');
    
    return {
      migratedWorkflow,
      batchWorkflows,
      searchResults,
      creationContext,
      mockSubtask,
      stats
    };
    
  } catch (error) {
    console.error('❌ [Demo] Pipeline Demo failed:', error);
    throw error;
  }
}

/**
 * Demo: Type Safety Validation
 */
export function demoTypeSafety() {
  console.log('🔒 [Demo] Starting Type Safety Validation Demo...');
  
  const validWorkflow: UnifiedWorkflow = {
    id: 'type-safe-1',
    title: 'Type Safe Workflow',
    description: 'Demonstrates type safety',
    source: 'manual',
    category: 'Demo',
    tags: ['demo', 'type-safe'],
    complexity: 'Medium',
    triggerType: 'Manual',
    integrations: ['Demo API'],
    createdAt: new Date().toISOString(),
    status: 'verified',
    isAIGenerated: false,
    active: true
  };
  
  // Type Safety Test
  const isValid = WorkflowMigration.validateUnifiedWorkflow(validWorkflow);
  
  console.log('🔒 [Demo] Type Safety Validation:', {
    isValid,
    workflowId: validWorkflow.id,
    hasRequiredFields: !!(
      validWorkflow.id &&
      validWorkflow.title &&
      validWorkflow.description &&
      validWorkflow.source &&
      validWorkflow.category &&
      validWorkflow.complexity &&
      validWorkflow.triggerType &&
      validWorkflow.integrations &&
      validWorkflow.createdAt &&
      validWorkflow.status &&
      validWorkflow.isAIGenerated !== undefined
    )
  });
  
  return { validWorkflow, isValid };
}

// Export alle Demo-Funktionen
export const WorkflowSchemaDemo = {
  demoMigration,
  demoBatchMigration,
  demoWorkflowSearch,
  demoWorkflowCreation,
  demoWorkflowStats,
  demoCompletePipeline,
  demoTypeSafety
};

