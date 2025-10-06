/**
 * Workflow Schema Migration
 * Hilfsfunktionen für die Migration von alten Schemas zu UnifiedWorkflow
 */

import { UnifiedWorkflow, WorkflowSchemaMapper } from './unifiedWorkflow';

/**
 * Migration Plan
 * 1. WorkflowIndex -> UnifiedWorkflow
 * 2. GeneratedBlueprint -> UnifiedWorkflow  
 * 3. N8nWorkflow -> UnifiedWorkflow
 * 4. BlueprintData -> UnifiedWorkflow
 * 5. WorkflowSolution -> UnifiedWorkflow
 */

export class WorkflowMigration {
  /**
   * Migriert alle Workflow-Typen zu UnifiedWorkflow
   */
  static migrateToUnified(workflow: any): UnifiedWorkflow {
    // Prüfe den Typ basierend auf verfügbaren Eigenschaften
    if (workflow.isAIGenerated && workflow.generationMetadata) {
      return WorkflowSchemaMapper.fromGeneratedBlueprint(workflow);
    }
    
    if (workflow.source && workflow.title && workflow.summary) {
      return WorkflowSchemaMapper.fromWorkflowIndex(workflow);
    }
    
    if (workflow.name && workflow.difficulty && workflow.url) {
      return WorkflowSchemaMapper.fromN8nWorkflow(workflow);
    }
    
    // Fallback für unbekannte Typen
    return this.createFallbackUnifiedWorkflow(workflow);
  }

  /**
   * Erstellt ein Fallback UnifiedWorkflow für unbekannte Typen
   */
  private static createFallbackUnifiedWorkflow(workflow: any): UnifiedWorkflow {
    return {
      id: workflow.id || `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: workflow.name || workflow.title || 'Unbekannter Workflow',
      description: workflow.description || workflow.summary || '',
      source: 'manual',
      category: workflow.category || 'Unbekannt',
      tags: workflow.tags || [],
      complexity: 'Medium',
      triggerType: 'Manual',
      integrations: workflow.integrations || [],
      createdAt: new Date().toISOString(),
      status: 'fallback',
      isAIGenerated: false,
      active: true
    };
  }

  /**
   * Batch-Migration für Arrays von Workflows
   */
  static migrateBatch(workflows: any[]): UnifiedWorkflow[] {
    return workflows.map(workflow => this.migrateToUnified(workflow));
  }

  /**
   * Validiert ob ein Workflow dem UnifiedWorkflow Schema entspricht
   */
  static validateUnifiedWorkflow(workflow: any): workflow is UnifiedWorkflow {
    return (
      typeof workflow.id === 'string' &&
      typeof workflow.title === 'string' &&
      typeof workflow.description === 'string' &&
      typeof workflow.source === 'string' &&
      typeof workflow.category === 'string' &&
      Array.isArray(workflow.tags) &&
      typeof workflow.complexity === 'string' &&
      typeof workflow.triggerType === 'string' &&
      Array.isArray(workflow.integrations) &&
      typeof workflow.createdAt === 'string' &&
      typeof workflow.status === 'string' &&
      typeof workflow.isAIGenerated === 'boolean'
    );
  }

  /**
   * Erstellt eine Migration-Report
   */
  static generateMigrationReport(workflows: any[]): {
    total: number;
    migrated: number;
    failed: number;
    errors: string[];
  } {
    const report = {
      total: workflows.length,
      migrated: 0,
      failed: 0,
      errors: [] as string[]
    };

    workflows.forEach((workflow, index) => {
      try {
        const unified = this.migrateToUnified(workflow);
        if (this.validateUnifiedWorkflow(unified)) {
          report.migrated++;
        } else {
          report.failed++;
          report.errors.push(`Workflow ${index}: Validation failed`);
        }
      } catch (error) {
        report.failed++;
        report.errors.push(`Workflow ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return report;
  }
}

/**
 * Migration Utilities für spezifische Komponenten
 */
export class ComponentMigration {
  /**
   * Migriert WorkflowIndex[] zu UnifiedWorkflow[]
   */
  static migrateWorkflowIndexArray(workflows: any[]): UnifiedWorkflow[] {
    return workflows.map(workflow => WorkflowSchemaMapper.fromWorkflowIndex(workflow));
  }

  /**
   * Migriert GeneratedBlueprint[] zu UnifiedWorkflow[]
   */
  static migrateGeneratedBlueprintArray(blueprints: any[]): UnifiedWorkflow[] {
    return blueprints.map(blueprint => WorkflowSchemaMapper.fromGeneratedBlueprint(blueprint));
  }

  /**
   * Migriert N8nWorkflow[] zu UnifiedWorkflow[]
   */
  static migrateN8nWorkflowArray(workflows: any[]): UnifiedWorkflow[] {
    return workflows.map(workflow => WorkflowSchemaMapper.fromN8nWorkflow(workflow));
  }
}

/**
 * Type Guards für Legacy Schemas
 */
export class WorkflowTypeGuards {
  static isWorkflowIndex(workflow: any): boolean {
    return (
      workflow.source &&
      workflow.title &&
      workflow.summary &&
      workflow.category &&
      workflow.integrations &&
      workflow.complexity
    );
  }

  static isGeneratedBlueprint(workflow: any): boolean {
    return (
      workflow.isAIGenerated === true &&
      workflow.generationMetadata &&
      workflow.n8nWorkflow
    );
  }

  static isN8nWorkflow(workflow: any): boolean {
    return (
      workflow.name &&
      workflow.difficulty &&
      workflow.url &&
      workflow.jsonUrl
    );
  }

  static isBlueprintData(workflow: any): boolean {
    return (
      workflow.id &&
      workflow.name &&
      (workflow.timeSavings !== undefined || workflow.complexity)
    );
  }
}

