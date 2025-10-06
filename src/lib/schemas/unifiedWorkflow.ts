/**
 * Unified Workflow Schema
 * Ein einheitliches Schema für alle Workflow-Typen in der Anwendung
 */

// Basis-Typen
export type Complexity = 'Low' | 'Medium' | 'High' | 'Easy' | 'Hard';
export type TriggerType = 'Manual' | 'Webhook' | 'Scheduled' | 'Complex';
export type SolutionStatus = 'generated' | 'verified' | 'fallback' | 'loading';
export type SourceType = 'github' | 'n8n.io' | 'ai-generated' | 'manual' | 'api';

// Generation Metadata
export interface GenerationMetadata {
  timestamp: number;
  model: string;
  language: 'de' | 'en';
  cacheKey: string;
  version?: string;
}

// Author Information
export interface AuthorInfo {
  name?: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
  email?: string;
}

// Domain Classification
export interface DomainClassification {
  domains: string[];
  confidences: number[];
  origin: 'llm' | 'admin' | 'mixed';
}

// n8n Workflow Structure
export interface N8nWorkflowData {
  name: string;
  nodes: any[];
  connections: any;
  active: boolean;
  settings: any;
  versionId: string;
  tags?: string[];
  staticData?: any;
}

// Scoring Information
export interface WorkflowScore {
  overall: number; // 0-100
  category: number;
  service: number;
  trigger: number;
  complexity: number;
  integration: number;
  confidence: number;
  reasoning: string[];
}

// Match Information
export interface WorkflowMatch {
  score: number; // 0-100
  reasons: string[];
  relevantIntegrations: string[];
  estimatedTimeSavings?: number;
}

/**
 * UNIFIED WORKFLOW SCHEMA
 * Das einheitliche Schema für alle Workflow-Typen
 */
export interface UnifiedWorkflow {
  // === CORE IDENTIFICATION ===
  id: string;
  title: string;
  description: string;
  summary?: string; // Kurze Zusammenfassung
  
  // === SOURCE & METADATA ===
  source: SourceType;
  sourceUrl?: string;
  category: string;
  tags: string[];
  license?: string;
  
  // === WORKFLOW SPECIFICATIONS ===
  complexity: Complexity;
  triggerType: TriggerType;
  integrations: string[];
  nodeCount?: number;
  connectionCount?: number;
  
  // === TECHNICAL DETAILS ===
  n8nWorkflow?: N8nWorkflowData; // Vollständiges n8n Workflow (nur bei AI-generierten)
  jsonUrl?: string; // URL zum n8n JSON
  workflowData?: any; // Raw workflow data
  
  // === AUTHOR & CREATION ===
  author?: AuthorInfo;
  createdAt: string;
  updatedAt?: string;
  version?: string;
  
  // === STATUS & VALIDATION ===
  status: SolutionStatus;
  isAIGenerated: boolean;
  generationMetadata?: GenerationMetadata;
  validationStatus?: 'valid' | 'invalid' | 'pending';
  
  // === BUSINESS METRICS ===
  setupCost?: number;
  estimatedTime?: string; // z.B. "2 h", "30 min"
  estimatedCost?: string; // z.B. "€100"
  timeSavings?: number; // Stunden pro Monat
  
  // === POPULARITY & RATINGS ===
  downloads?: number;
  rating?: number;
  popularity?: number;
  verified?: boolean;
  
  // === DOMAIN CLASSIFICATION ===
  domainClassification?: DomainClassification;
  
  // === SCORING & MATCHING ===
  score?: WorkflowScore;
  match?: WorkflowMatch;
  
  // === UI & DISPLAY ===
  downloadUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  active?: boolean;
  
  // === CACHING & OPTIMIZATION ===
  fileHash?: string;
  analyzedAt?: string;
  lastAccessed?: string;
  cacheKey?: string;
}

/**
 * Workflow Creation Context
 * Für die Erstellung neuer Workflows
 */
export interface WorkflowCreationContext {
  subtaskId: string;
  language: 'de' | 'en';
  timeout: number;
  variation?: number;
  context?: 'overarching' | 'subtask-specific';
  preferredComplexity?: Complexity;
  requiredIntegrations?: string[];
  maxSetupCost?: number;
}

/**
 * Workflow Search Parameters
 * Für die Suche und Filterung von Workflows
 */
export interface WorkflowSearchParams {
  query?: string;
  category?: string;
  complexity?: Complexity;
  triggerType?: TriggerType;
  integrations?: string[];
  source?: SourceType;
  isAIGenerated?: boolean;
  status?: SolutionStatus;
  minRating?: number;
  maxSetupCost?: number;
  domains?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'rating' | 'downloads' | 'createdAt' | 'complexity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Workflow Statistics
 * Für Dashboard und Analytics
 */
export interface WorkflowStats {
  total: number;
  active: number;
  inactive: number;
  aiGenerated: number;
  verified: number;
  byComplexity: Record<Complexity, number>;
  byTriggerType: Record<TriggerType, number>;
  bySource: Record<SourceType, number>;
  totalDownloads: number;
  averageRating: number;
  topCategories: Array<{ category: string; count: number }>;
  topIntegrations: Array<{ integration: string; count: number }>;
}

/**
 * Workflow Batch Operations
 * Für Bulk-Operationen
 */
export interface WorkflowBatchOperation {
  operation: 'create' | 'update' | 'delete' | 'validate' | 'score';
  workflowIds: string[];
  parameters?: any;
}

/**
 * Workflow Export/Import
 * Für Datenmigration
 */
export interface WorkflowExport {
  version: string;
  exportedAt: string;
  workflows: UnifiedWorkflow[];
  metadata: {
    totalCount: number;
    source: string;
    filters?: WorkflowSearchParams;
  };
}

/**
 * Legacy Schema Mappings
 * Hilfsfunktionen für Migration von alten Schemas
 */
export class WorkflowSchemaMapper {
  /**
   * Konvertiert WorkflowIndex zu UnifiedWorkflow
   */
  static fromWorkflowIndex(workflow: any): UnifiedWorkflow {
    return {
      id: workflow.id,
      title: workflow.title,
      description: workflow.summary || workflow.description || '',
      source: this.mapSourceType(workflow.source),
      sourceUrl: workflow.link,
      category: workflow.category,
      tags: workflow.tags || [],
      complexity: this.mapComplexity(workflow.complexity),
      triggerType: this.mapTriggerType(workflow.triggerType),
      integrations: workflow.integrations || [],
      nodeCount: workflow.nodeCount,
      author: workflow.authorName ? {
        name: workflow.authorName,
        username: workflow.authorUsername,
        avatar: workflow.authorAvatar,
        verified: workflow.authorVerified
      } : undefined,
      createdAt: workflow.analyzedAt || new Date().toISOString(),
      status: 'verified',
      isAIGenerated: false,
      active: workflow.active,
      domainClassification: workflow.domains ? {
        domains: workflow.domains,
        confidences: workflow.domain_confidences || [],
        origin: workflow.domain_origin || 'admin'
      } : undefined,
      fileHash: workflow.fileHash,
      analyzedAt: workflow.analyzedAt
    };
  }

  /**
   * Konvertiert GeneratedBlueprint zu UnifiedWorkflow
   */
  static fromGeneratedBlueprint(blueprint: any): UnifiedWorkflow {
    return {
      id: blueprint.id,
      title: blueprint.name,
      description: blueprint.description || '',
      source: 'ai-generated',
      category: blueprint.category || 'AI Generated',
      tags: [],
      complexity: this.mapComplexity(blueprint.complexity),
      triggerType: 'Manual', // Default für AI-generierte
      integrations: blueprint.integrations || [],
      n8nWorkflow: blueprint.n8nWorkflow,
      jsonUrl: blueprint.jsonUrl,
      workflowData: blueprint.workflowData,
      createdAt: blueprint.generatedAt || new Date().toISOString(),
      status: blueprint.status || 'generated',
      isAIGenerated: true,
      generationMetadata: blueprint.generationMetadata,
      validationStatus: blueprint.validationStatus,
      setupCost: blueprint.setupCost,
      timeSavings: blueprint.timeSavings,
      downloadUrl: blueprint.downloadUrl,
      active: true
    };
  }

  /**
   * Konvertiert N8nWorkflow zu UnifiedWorkflow
   */
  static fromN8nWorkflow(workflow: any): UnifiedWorkflow {
    return {
      id: workflow.id,
      title: workflow.name,
      description: workflow.description,
      source: 'n8n.io',
      sourceUrl: workflow.url,
      category: workflow.category,
      tags: [],
      complexity: this.mapComplexity(workflow.difficulty),
      triggerType: this.mapTriggerType(workflow.triggerType),
      integrations: workflow.integrations || [],
      nodeCount: workflow.nodes,
      connectionCount: workflow.connections,
      jsonUrl: workflow.jsonUrl,
      author: workflow.author ? { name: workflow.author } : undefined,
      createdAt: workflow.createdAt,
      status: 'verified',
      isAIGenerated: false,
      downloads: workflow.downloads,
      rating: workflow.rating,
      active: workflow.active
    };
  }

  // Helper methods
  private static mapSourceType(source: string): SourceType {
    const sourceMap: Record<string, SourceType> = {
      'github': 'github',
      'n8n.io': 'n8n.io',
      'ai-generated': 'ai-generated',
      'manual': 'manual',
      'api': 'api'
    };
    return sourceMap[source] || 'manual';
  }

  private static mapComplexity(complexity: any): Complexity {
    if (typeof complexity === 'string') {
      const complexityMap: Record<string, Complexity> = {
        'Low': 'Low',
        'Medium': 'Medium',
        'High': 'High',
        'Easy': 'Easy',
        'Hard': 'Hard',
        'simple': 'Low',
        'medium': 'Medium',
        'complex': 'High',
        'enterprise': 'High'
      };
      return complexityMap[complexity] || 'Medium';
    }
    return 'Medium';
  }

  private static mapTriggerType(triggerType: any): TriggerType {
    if (typeof triggerType === 'string') {
      const triggerMap: Record<string, TriggerType> = {
        'Manual': 'Manual',
        'Webhook': 'Webhook',
        'Scheduled': 'Scheduled',
        'Complex': 'Complex'
      };
      return triggerMap[triggerType] || 'Manual';
    }
    return 'Manual';
  }
}

