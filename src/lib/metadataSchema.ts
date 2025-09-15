/**
 * Unified Source Metadata Schema
 * 
 * This module defines standardized metadata structures for all source types
 * (workflows, AI agents, tools) to ensure consistency across the platform.
 */

export interface BaseMetadata {
  // Core identification
  id: string;
  name: string;
  description: string;
  version: string;
  
  // Source information
  source: string;
  sourceType: 'github' | 'n8n' | 'zapier' | 'make' | 'manual' | 'api';
  sourceUrl: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastModified: string;
  
  // Status and availability
  status: 'active' | 'inactive' | 'deprecated' | 'draft';
  isPublic: boolean;
  isVerified: boolean;
  
  // Categorization
  category: string;
  subcategory?: string;
  tags: string[];
  
  // Quality metrics
  qualityScore: number; // 0-100
  completeness: number; // 0-100
  accuracy: number; // 0-100
  freshness: number; // 0-100
  
  // Usage statistics
  viewCount: number;
  downloadCount: number;
  usageCount: number;
  rating?: number; // 0-5
  
  // Schema versioning
  schemaVersion: string;
  metadataVersion: string;
}

export interface WorkflowMetadata extends BaseMetadata {
  type: 'workflow';
  
  // Workflow-specific properties
  nodeCount: number;
  executionTime?: number; // in milliseconds
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  
  // Technical details
  integrations: string[];
  triggers: string[];
  actions: string[];
  conditions: string[];
  
  // Dependencies
  dependencies: string[];
  requirements: string[];
  
  // Configuration
  configurable: boolean;
  hasVariables: boolean;
  hasSecrets: boolean;
  
  // Execution info
  executionMode: 'manual' | 'scheduled' | 'triggered' | 'webhook';
  schedule?: string; // cron expression
  timeout?: number; // in seconds
  
  // Performance metrics
  successRate: number; // 0-100
  averageExecutionTime: number; // in milliseconds
  errorRate: number; // 0-100
  
  // Documentation
  documentation?: string;
  examples?: string[];
  tutorials?: string[];
  
  // Compliance and security
  securityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  complianceTags: string[];
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface AIAgentMetadata extends BaseMetadata {
  type: 'ai_agent';
  
  // AI-specific properties
  model: string;
  provider: string;
  capabilities: string[];
  limitations: string[];
  
  // Technical specifications
  inputTypes: string[];
  outputTypes: string[];
  maxTokens?: number;
  temperature?: number;
  
  // Performance metrics
  responseTime: number; // in milliseconds
  accuracy: number; // 0-100
  reliability: number; // 0-100
  
  // Usage patterns
  useCases: string[];
  industries: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  
  // Integration
  apiEndpoints: string[];
  authenticationRequired: boolean;
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  
  // Cost information
  costPerRequest?: number;
  costPerToken?: number;
  freeTierAvailable: boolean;
  
  // Documentation
  apiDocumentation?: string;
  examples?: string[];
  bestPractices?: string[];
}

export interface ToolMetadata extends BaseMetadata {
  type: 'tool';
  
  // Tool-specific properties
  toolType: 'utility' | 'integration' | 'automation' | 'analysis' | 'conversion';
  platform: string;
  version: string;
  
  // Technical details
  supportedFormats: string[];
  supportedProtocols: string[];
  systemRequirements: string[];
  
  // Functionality
  features: string[];
  capabilities: string[];
  limitations: string[];
  
  // Integration
  integrations: string[];
  apis: string[];
  webhooks: string[];
  
  // Performance
  performance: {
    speed: number; // 0-100
    reliability: number; // 0-100
    scalability: number; // 0-100
  };
  
  // Cost and licensing
  pricing: {
    model: 'free' | 'freemium' | 'subscription' | 'pay-per-use' | 'enterprise';
    freeTierAvailable: boolean;
    costPerUse?: number;
    monthlyCost?: number;
  };
  
  // Documentation
  userGuide?: string;
  apiReference?: string;
  tutorials?: string[];
  faq?: string[];
}

export type UnifiedMetadata = WorkflowMetadata | AIAgentMetadata | ToolMetadata;

// Metadata validation schemas
export interface MetadataValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  customValidator?: (value: any) => boolean;
}

export interface MetadataSchema {
  version: string;
  type: 'workflow' | 'ai_agent' | 'tool';
  rules: MetadataValidationRule[];
  requiredFields: string[];
  optionalFields: string[];
}

// Schema definitions for each type
export const WORKFLOW_SCHEMA: MetadataSchema = {
  version: '1.0.0',
  type: 'workflow',
  requiredFields: [
    'id', 'name', 'description', 'version', 'source', 'sourceType',
    'createdAt', 'updatedAt', 'status', 'category', 'tags',
    'nodeCount', 'complexity', 'integrations', 'executionMode'
  ],
  optionalFields: [
    'subcategory', 'qualityScore', 'completeness', 'accuracy', 'freshness',
    'viewCount', 'downloadCount', 'usageCount', 'rating',
    'executionTime', 'triggers', 'actions', 'conditions',
    'dependencies', 'requirements', 'configurable', 'hasVariables',
    'hasSecrets', 'schedule', 'timeout', 'successRate',
    'averageExecutionTime', 'errorRate', 'documentation', 'examples',
    'tutorials', 'securityLevel', 'complianceTags', 'dataClassification'
  ],
  rules: [
    { field: 'id', type: 'string', required: true, minLength: 1 },
    { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 255 },
    { field: 'description', type: 'string', required: true, minLength: 10, maxLength: 2000 },
    { field: 'version', type: 'string', required: true, pattern: /^\d+\.\d+\.\d+$/ },
    { field: 'nodeCount', type: 'number', required: true, min: 1 },
    { field: 'qualityScore', type: 'number', required: false, min: 0, max: 100 },
    { field: 'complexity', type: 'string', required: true, enum: ['simple', 'medium', 'complex', 'enterprise'] },
    { field: 'status', type: 'string', required: true, enum: ['active', 'inactive', 'deprecated', 'draft'] },
    { field: 'tags', type: 'array', required: true, minLength: 1 },
    { field: 'integrations', type: 'array', required: true, minLength: 1 }
  ]
};

export const AI_AGENT_SCHEMA: MetadataSchema = {
  version: '1.0.0',
  type: 'ai_agent',
  requiredFields: [
    'id', 'name', 'description', 'version', 'source', 'sourceType',
    'createdAt', 'updatedAt', 'status', 'category', 'tags',
    'model', 'provider', 'capabilities', 'inputTypes', 'outputTypes'
  ],
  optionalFields: [
    'subcategory', 'qualityScore', 'completeness', 'accuracy', 'freshness',
    'viewCount', 'downloadCount', 'usageCount', 'rating',
    'limitations', 'maxTokens', 'temperature', 'responseTime',
    'reliability', 'useCases', 'industries', 'skillLevel',
    'apiEndpoints', 'authenticationRequired', 'rateLimits',
    'costPerRequest', 'costPerToken', 'freeTierAvailable',
    'apiDocumentation', 'examples', 'bestPractices'
  ],
  rules: [
    { field: 'id', type: 'string', required: true, minLength: 1 },
    { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 255 },
    { field: 'description', type: 'string', required: true, minLength: 10, maxLength: 2000 },
    { field: 'model', type: 'string', required: true, minLength: 1 },
    { field: 'provider', type: 'string', required: true, minLength: 1 },
    { field: 'capabilities', type: 'array', required: true, minLength: 1 },
    { field: 'inputTypes', type: 'array', required: true, minLength: 1 },
    { field: 'outputTypes', type: 'array', required: true, minLength: 1 },
    { field: 'accuracy', type: 'number', required: false, min: 0, max: 100 },
    { field: 'responseTime', type: 'number', required: false, min: 0 }
  ]
};

export const TOOL_SCHEMA: MetadataSchema = {
  version: '1.0.0',
  type: 'tool',
  requiredFields: [
    'id', 'name', 'description', 'version', 'source', 'sourceType',
    'createdAt', 'updatedAt', 'status', 'category', 'tags',
    'toolType', 'platform', 'features', 'capabilities'
  ],
  optionalFields: [
    'subcategory', 'qualityScore', 'completeness', 'accuracy', 'freshness',
    'viewCount', 'downloadCount', 'usageCount', 'rating',
    'supportedFormats', 'supportedProtocols', 'systemRequirements',
    'limitations', 'integrations', 'apis', 'webhooks',
    'performance', 'pricing', 'userGuide', 'apiReference',
    'tutorials', 'faq'
  ],
  rules: [
    { field: 'id', type: 'string', required: true, minLength: 1 },
    { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 255 },
    { field: 'description', type: 'string', required: true, minLength: 10, maxLength: 2000 },
    { field: 'toolType', type: 'string', required: true, enum: ['utility', 'integration', 'automation', 'analysis', 'conversion'] },
    { field: 'platform', type: 'string', required: true, minLength: 1 },
    { field: 'features', type: 'array', required: true, minLength: 1 },
    { field: 'capabilities', type: 'array', required: true, minLength: 1 }
  ]
};

// Schema registry
export const METADATA_SCHEMAS: Record<string, MetadataSchema> = {
  workflow: WORKFLOW_SCHEMA,
  ai_agent: AI_AGENT_SCHEMA,
  tool: TOOL_SCHEMA
};

// Metadata transformation utilities
export interface MetadataTransformer {
  fromLegacyFormat(data: any): UnifiedMetadata;
  toLegacyFormat(metadata: UnifiedMetadata): any;
  validate(metadata: UnifiedMetadata): ValidationResult;
  normalize(metadata: UnifiedMetadata): UnifiedMetadata;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Metadata quality scoring
export interface MetadataQualityScore {
  overall: number; // 0-100
  completeness: number; // 0-100
  accuracy: number; // 0-100
  consistency: number; // 0-100
  freshness: number; // 0-100
  details: {
    missingFields: string[];
    invalidFields: string[];
    outdatedFields: string[];
    inconsistentFields: string[];
  };
}

// Metadata comparison and diffing
export interface MetadataDiff {
  added: Record<string, any>;
  removed: Record<string, any>;
  modified: Record<string, { old: any; new: any }>;
  unchanged: Record<string, any>;
}

// Metadata search and filtering
export interface MetadataSearchCriteria {
  query?: string;
  type?: 'workflow' | 'ai_agent' | 'tool';
  category?: string;
  tags?: string[];
  source?: string;
  status?: string;
  qualityScore?: { min: number; max: number };
  dateRange?: { from: string; to: string };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface MetadataSearchResult {
  items: UnifiedMetadata[];
  total: number;
  page: number;
  pageSize: number;
  facets: Record<string, Record<string, number>>;
}

/**
 * Metadata Validation Engine
 */
export class MetadataValidator {
  private schemas: Record<string, MetadataSchema>;

  constructor() {
    this.schemas = METADATA_SCHEMAS;
  }

  /**
   * Validate metadata against schema
   */
  validate(metadata: any, type: string): ValidationResult {
    const schema = this.schemas[type];
    if (!schema) {
      return {
        isValid: false,
        errors: [{
          field: 'type',
          message: `Unknown metadata type: ${type}`,
          code: 'UNKNOWN_TYPE',
          severity: 'error'
        }],
        warnings: []
      };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    for (const field of schema.requiredFields) {
      if (!(field in metadata) || metadata[field] === null || metadata[field] === undefined) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          code: 'MISSING_REQUIRED_FIELD',
          severity: 'error'
        });
      }
    }

    // Validate field rules
    for (const rule of schema.rules) {
      const value = metadata[rule.field];
      
      if (value !== null && value !== undefined) {
        const fieldErrors = this.validateField(value, rule, metadata);
        errors.push(...fieldErrors);
      } else if (rule.required) {
        errors.push({
          field: rule.field,
          message: `Required field '${rule.field}' is missing`,
          code: 'MISSING_REQUIRED_FIELD',
          severity: 'error'
        });
      }
    }

    // Check for unknown fields
    const knownFields = [...schema.requiredFields, ...schema.optionalFields];
    for (const field in metadata) {
      if (!knownFields.includes(field)) {
        warnings.push({
          field,
          message: `Unknown field '${field}' - this may be ignored`,
          suggestion: 'Check if this field should be added to the schema'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate individual field
   */
  private validateField(value: any, rule: MetadataValidationRule, metadata: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type validation
    if (!this.isCorrectType(value, rule.type)) {
      errors.push({
        field: rule.field,
        message: `Field '${rule.field}' must be of type ${rule.type}`,
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return errors; // Skip further validation if type is wrong
    }

    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' must be at least ${rule.minLength} characters long`,
          code: 'MIN_LENGTH_VIOLATION',
          severity: 'error'
        });
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' must be no more than ${rule.maxLength} characters long`,
          code: 'MAX_LENGTH_VIOLATION',
          severity: 'error'
        });
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' does not match required pattern`,
          code: 'PATTERN_VIOLATION',
          severity: 'error'
        });
      }
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' must be one of: ${rule.enum.join(', ')}`,
          code: 'ENUM_VIOLATION',
          severity: 'error'
        });
      }
    }

    // Number validations
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' must be at least ${rule.min}`,
          code: 'MIN_VALUE_VIOLATION',
          severity: 'error'
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' must be no more than ${rule.max}`,
          code: 'MAX_VALUE_VIOLATION',
          severity: 'error'
        });
      }
    }

    // Array validations
    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' must have at least ${rule.minLength} items`,
          code: 'MIN_LENGTH_VIOLATION',
          severity: 'error'
        });
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' must have no more than ${rule.maxLength} items`,
          code: 'MAX_LENGTH_VIOLATION',
          severity: 'error'
        });
      }
    }

    // Custom validation
    if (rule.customValidator && !rule.customValidator(value)) {
      errors.push({
        field: rule.field,
        message: `Field '${rule.field}' failed custom validation`,
        code: 'CUSTOM_VALIDATION_FAILED',
        severity: 'error'
      });
    }

    return errors;
  }

  /**
   * Check if value is of correct type
   */
  private isCorrectType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Validate multiple metadata items
   */
  validateBatch(metadataItems: any[], type: string): ValidationResult[] {
    return metadataItems.map(item => this.validate(item, type));
  }

  /**
   * Get schema for a specific type
   */
  getSchema(type: string): MetadataSchema | undefined {
    return this.schemas[type];
  }

  /**
   * Add or update schema
   */
  addSchema(type: string, schema: MetadataSchema): void {
    this.schemas[type] = schema;
  }

  /**
   * Get all available schema types
   */
  getAvailableTypes(): string[] {
    return Object.keys(this.schemas);
  }
}

/**
 * Metadata Quality Scorer
 */
export class MetadataQualityScorer {
  /**
   * Calculate quality score for metadata
   */
  calculateQualityScore(metadata: UnifiedMetadata): MetadataQualityScore {
    const completeness = this.calculateCompleteness(metadata);
    const accuracy = this.calculateAccuracy(metadata);
    const consistency = this.calculateConsistency(metadata);
    const freshness = this.calculateFreshness(metadata);

    const overall = Math.round(
      (completeness * 0.3) +
      (accuracy * 0.3) +
      (consistency * 0.2) +
      (freshness * 0.2)
    );

    return {
      overall,
      completeness,
      accuracy,
      consistency,
      freshness,
      details: {
        missingFields: this.findMissingFields(metadata),
        invalidFields: this.findInvalidFields(metadata),
        outdatedFields: this.findOutdatedFields(metadata),
        inconsistentFields: this.findInconsistentFields(metadata)
      }
    };
  }

  /**
   * Calculate completeness score (0-100)
   */
  private calculateCompleteness(metadata: UnifiedMetadata): number {
    const schema = METADATA_SCHEMAS[metadata.type];
    if (!schema) return 0;

    const allFields = [...schema.requiredFields, ...schema.optionalFields];
    const filledFields = allFields.filter(field => {
      const value = (metadata as any)[field];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((filledFields.length / allFields.length) * 100);
  }

  /**
   * Calculate accuracy score (0-100)
   */
  private calculateAccuracy(metadata: UnifiedMetadata): number {
    // This would typically involve checking against known good data
    // For now, we'll use a simple heuristic based on data quality indicators
    let score = 100;

    // Check for obvious data quality issues
    if (metadata.description && metadata.description.length < 10) score -= 20;
    if (metadata.tags && metadata.tags.length === 0) score -= 15;
    if (metadata.category && metadata.category === 'uncategorized') score -= 10;
    if (metadata.name && metadata.name.length < 3) score -= 25;

    return Math.max(0, score);
  }

  /**
   * Calculate consistency score (0-100)
   */
  private calculateConsistency(metadata: UnifiedMetadata): number {
    let score = 100;

    // Check for consistency issues
    if (metadata.updatedAt && metadata.createdAt) {
      const updated = new Date(metadata.updatedAt);
      const created = new Date(metadata.createdAt);
      if (updated < created) score -= 30;
    }

    // Check for reasonable values
    if (metadata.qualityScore && (metadata.qualityScore < 0 || metadata.qualityScore > 100)) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate freshness score (0-100)
   */
  private calculateFreshness(metadata: UnifiedMetadata): number {
    if (!metadata.updatedAt) return 0;

    const updated = new Date(metadata.updatedAt);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);

    // Score decreases over time
    if (daysSinceUpdate < 7) return 100;
    if (daysSinceUpdate < 30) return 80;
    if (daysSinceUpdate < 90) return 60;
    if (daysSinceUpdate < 365) return 40;
    return 20;
  }

  /**
   * Find missing fields
   */
  private findMissingFields(metadata: UnifiedMetadata): string[] {
    const schema = METADATA_SCHEMAS[metadata.type];
    if (!schema) return [];

    return schema.requiredFields.filter(field => {
      const value = (metadata as any)[field];
      return value === null || value === undefined || value === '';
    });
  }

  /**
   * Find invalid fields
   */
  private findInvalidFields(metadata: UnifiedMetadata): string[] {
    // This would involve running validation and collecting invalid fields
    // For now, return empty array
    return [];
  }

  /**
   * Find outdated fields
   */
  private findOutdatedFields(metadata: UnifiedMetadata): string[] {
    const outdated: string[] = [];
    
    if (metadata.updatedAt) {
      const updated = new Date(metadata.updatedAt);
      const now = new Date();
      const daysSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 365) {
        outdated.push('updatedAt');
      }
    }

    return outdated;
  }

  /**
   * Find inconsistent fields
   */
  private findInconsistentFields(metadata: UnifiedMetadata): string[] {
    const inconsistent: string[] = [];

    // Check for logical inconsistencies
    if (metadata.updatedAt && metadata.createdAt) {
      const updated = new Date(metadata.updatedAt);
      const created = new Date(metadata.createdAt);
      if (updated < created) {
        inconsistent.push('updatedAt');
      }
    }

    return inconsistent;
  }
}

/**
 * Metadata Migration System
 */
export class MetadataMigrator {
  private migrationHistory = new Map<string, string[]>();

  constructor() {
    this.initializeMigrationHistory();
  }

  /**
   * Initialize migration history for existing sources
   */
  private initializeMigrationHistory(): void {
    // Track migration history for each source
    this.migrationHistory.set('github', ['1.0.0']);
    this.migrationHistory.set('n8n', ['1.0.0']);
    this.migrationHistory.set('zapier', ['1.0.0']);
    this.migrationHistory.set('make', ['1.0.0']);
    this.migrationHistory.set('manual', ['1.0.0']);
  }

  /**
   * Migrate metadata from legacy format to unified schema
   */
  migrateToUnifiedSchema(legacyData: any, source: string, type: string): UnifiedMetadata {
    const baseMetadata = this.extractBaseMetadata(legacyData, source);
    
    switch (type) {
      case 'workflow':
        return this.migrateWorkflowMetadata(legacyData, baseMetadata);
      case 'ai_agent':
        return this.migrateAIAgentMetadata(legacyData, baseMetadata);
      case 'tool':
        return this.migrateToolMetadata(legacyData, baseMetadata);
      default:
        throw new Error(`Unknown metadata type: ${type}`);
    }
  }

  /**
   * Extract base metadata from legacy data
   */
  private extractBaseMetadata(legacyData: any, source: string): BaseMetadata {
    const now = new Date().toISOString();
    
    return {
      id: legacyData.id || legacyData.name || this.generateId(),
      name: legacyData.name || legacyData.title || 'Untitled',
      description: legacyData.description || legacyData.summary || '',
      version: legacyData.version || '1.0.0',
      source,
      sourceType: this.mapSourceType(source),
      sourceUrl: legacyData.url || legacyData.sourceUrl || '',
      createdAt: legacyData.createdAt || legacyData.created || now,
      updatedAt: legacyData.updatedAt || legacyData.updated || now,
      lastModified: legacyData.lastModified || legacyData.modified || now,
      status: this.mapStatus(legacyData.status || legacyData.active),
      isPublic: legacyData.isPublic !== false,
      isVerified: legacyData.isVerified || legacyData.verified || false,
      category: legacyData.category || legacyData.type || 'uncategorized',
      subcategory: legacyData.subcategory,
      tags: this.normalizeTags(legacyData.tags || legacyData.labels || []),
      qualityScore: legacyData.qualityScore || 0,
      completeness: legacyData.completeness || 0,
      accuracy: legacyData.accuracy || 0,
      freshness: legacyData.freshness || 0,
      viewCount: legacyData.viewCount || legacyData.views || 0,
      downloadCount: legacyData.downloadCount || legacyData.downloads || 0,
      usageCount: legacyData.usageCount || legacyData.usage || 0,
      rating: legacyData.rating || legacyData.score,
      schemaVersion: '1.0.0',
      metadataVersion: '1.0.0'
    };
  }

  /**
   * Migrate workflow-specific metadata
   */
  private migrateWorkflowMetadata(legacyData: any, base: BaseMetadata): WorkflowMetadata {
    return {
      ...base,
      type: 'workflow',
      nodeCount: legacyData.nodeCount || legacyData.nodes || 0,
      executionTime: legacyData.executionTime || legacyData.duration,
      complexity: this.mapComplexity(legacyData.complexity || legacyData.level),
      integrations: this.normalizeArray(legacyData.integrations || legacyData.services || []),
      triggers: this.normalizeArray(legacyData.triggers || legacyData.startNodes || []),
      actions: this.normalizeArray(legacyData.actions || legacyData.endNodes || []),
      conditions: this.normalizeArray(legacyData.conditions || legacyData.ifNodes || []),
      dependencies: this.normalizeArray(legacyData.dependencies || []),
      requirements: this.normalizeArray(legacyData.requirements || []),
      configurable: legacyData.configurable !== false,
      hasVariables: legacyData.hasVariables || legacyData.variables || false,
      hasSecrets: legacyData.hasSecrets || legacyData.secrets || false,
      executionMode: this.mapExecutionMode(legacyData.executionMode || legacyData.mode),
      schedule: legacyData.schedule || legacyData.cron,
      timeout: legacyData.timeout || legacyData.maxExecutionTime,
      successRate: legacyData.successRate || legacyData.success || 0,
      averageExecutionTime: legacyData.averageExecutionTime || legacyData.avgDuration || 0,
      errorRate: legacyData.errorRate || legacyData.errors || 0,
      documentation: legacyData.documentation || legacyData.docs,
      examples: this.normalizeArray(legacyData.examples || []),
      tutorials: this.normalizeArray(legacyData.tutorials || []),
      securityLevel: this.mapSecurityLevel(legacyData.securityLevel || legacyData.security),
      complianceTags: this.normalizeArray(legacyData.complianceTags || legacyData.compliance || []),
      dataClassification: this.mapDataClassification(legacyData.dataClassification || legacyData.classification)
    };
  }

  /**
   * Migrate AI agent-specific metadata
   */
  private migrateAIAgentMetadata(legacyData: any, base: BaseMetadata): AIAgentMetadata {
    return {
      ...base,
      type: 'ai_agent',
      model: legacyData.model || legacyData.aiModel || 'unknown',
      provider: legacyData.provider || legacyData.aiProvider || 'unknown',
      capabilities: this.normalizeArray(legacyData.capabilities || legacyData.features || []),
      limitations: this.normalizeArray(legacyData.limitations || legacyData.constraints || []),
      inputTypes: this.normalizeArray(legacyData.inputTypes || legacyData.inputs || []),
      outputTypes: this.normalizeArray(legacyData.outputTypes || legacyData.outputs || []),
      maxTokens: legacyData.maxTokens || legacyData.tokenLimit,
      temperature: legacyData.temperature || legacyData.creativity,
      responseTime: legacyData.responseTime || legacyData.latency || 0,
      accuracy: legacyData.accuracy || legacyData.precision || 0,
      reliability: legacyData.reliability || legacyData.uptime || 0,
      useCases: this.normalizeArray(legacyData.useCases || legacyData.applications || []),
      industries: this.normalizeArray(legacyData.industries || legacyData.sectors || []),
      skillLevel: this.mapSkillLevel(legacyData.skillLevel || legacyData.difficulty),
      apiEndpoints: this.normalizeArray(legacyData.apiEndpoints || legacyData.endpoints || []),
      authenticationRequired: legacyData.authenticationRequired || legacyData.authRequired || false,
      rateLimits: legacyData.rateLimits || legacyData.limits,
      costPerRequest: legacyData.costPerRequest || legacyData.cost,
      costPerToken: legacyData.costPerToken || legacyData.tokenCost,
      freeTierAvailable: legacyData.freeTierAvailable || legacyData.freeTier || false,
      apiDocumentation: legacyData.apiDocumentation || legacyData.apiDocs,
      examples: this.normalizeArray(legacyData.examples || []),
      bestPractices: this.normalizeArray(legacyData.bestPractices || legacyData.practices || [])
    };
  }

  /**
   * Migrate tool-specific metadata
   */
  private migrateToolMetadata(legacyData: any, base: BaseMetadata): ToolMetadata {
    return {
      ...base,
      type: 'tool',
      toolType: this.mapToolType(legacyData.toolType || legacyData.type),
      platform: legacyData.platform || legacyData.system || 'unknown',
      version: legacyData.version || legacyData.toolVersion || '1.0.0',
      supportedFormats: this.normalizeArray(legacyData.supportedFormats || legacyData.formats || []),
      supportedProtocols: this.normalizeArray(legacyData.supportedProtocols || legacyData.protocols || []),
      systemRequirements: this.normalizeArray(legacyData.systemRequirements || legacyData.requirements || []),
      features: this.normalizeArray(legacyData.features || legacyData.capabilities || []),
      capabilities: this.normalizeArray(legacyData.capabilities || legacyData.functions || []),
      limitations: this.normalizeArray(legacyData.limitations || legacyData.constraints || []),
      integrations: this.normalizeArray(legacyData.integrations || legacyData.connections || []),
      apis: this.normalizeArray(legacyData.apis || legacyData.apiConnections || []),
      webhooks: this.normalizeArray(legacyData.webhooks || legacyData.hooks || []),
      performance: {
        speed: legacyData.performance?.speed || legacyData.speed || 0,
        reliability: legacyData.performance?.reliability || legacyData.reliability || 0,
        scalability: legacyData.performance?.scalability || legacyData.scalability || 0
      },
      pricing: {
        model: this.mapPricingModel(legacyData.pricing?.model || legacyData.pricingModel),
        freeTierAvailable: legacyData.pricing?.freeTierAvailable || legacyData.freeTier || false,
        costPerUse: legacyData.pricing?.costPerUse || legacyData.costPerUse,
        monthlyCost: legacyData.pricing?.monthlyCost || legacyData.monthlyCost
      },
      userGuide: legacyData.userGuide || legacyData.guide,
      apiReference: legacyData.apiReference || legacyData.apiDocs,
      tutorials: this.normalizeArray(legacyData.tutorials || []),
      faq: this.normalizeArray(legacyData.faq || legacyData.frequentlyAskedQuestions || [])
    };
  }

  /**
   * Helper methods for mapping legacy values
   */
  private mapSourceType(source: string): BaseMetadata['sourceType'] {
    const mapping: Record<string, BaseMetadata['sourceType']> = {
      'github': 'github',
      'n8n': 'n8n',
      'zapier': 'zapier',
      'make': 'make',
      'manual': 'manual',
      'api': 'api'
    };
    return mapping[source.toLowerCase()] || 'api';
  }

  private mapStatus(status: any): BaseMetadata['status'] {
    if (typeof status === 'boolean') {
      return status ? 'active' : 'inactive';
    }
    const mapping: Record<string, BaseMetadata['status']> = {
      'active': 'active',
      'inactive': 'inactive',
      'deprecated': 'deprecated',
      'draft': 'draft',
      'published': 'active',
      'unpublished': 'inactive'
    };
    return mapping[status?.toString().toLowerCase()] || 'active';
  }

  private mapComplexity(complexity: any): WorkflowMetadata['complexity'] {
    const mapping: Record<string, WorkflowMetadata['complexity']> = {
      'simple': 'simple',
      'easy': 'simple',
      'basic': 'simple',
      'medium': 'medium',
      'intermediate': 'medium',
      'complex': 'complex',
      'advanced': 'complex',
      'enterprise': 'enterprise',
      'professional': 'enterprise'
    };
    return mapping[complexity?.toString().toLowerCase()] || 'medium';
  }

  private mapExecutionMode(mode: any): WorkflowMetadata['executionMode'] {
    const mapping: Record<string, WorkflowMetadata['executionMode']> = {
      'manual': 'manual',
      'scheduled': 'scheduled',
      'triggered': 'triggered',
      'webhook': 'webhook',
      'cron': 'scheduled',
      'event': 'triggered'
    };
    return mapping[mode?.toString().toLowerCase()] || 'manual';
  }

  private mapSecurityLevel(level: any): WorkflowMetadata['securityLevel'] {
    const mapping: Record<string, WorkflowMetadata['securityLevel']> = {
      'public': 'public',
      'internal': 'internal',
      'confidential': 'confidential',
      'restricted': 'restricted',
      'private': 'internal',
      'secret': 'confidential'
    };
    return mapping[level?.toString().toLowerCase()] || 'public';
  }

  private mapDataClassification(classification: any): WorkflowMetadata['dataClassification'] {
    const mapping: Record<string, WorkflowMetadata['dataClassification']> = {
      'public': 'public',
      'internal': 'internal',
      'confidential': 'confidential',
      'restricted': 'restricted',
      'private': 'internal',
      'sensitive': 'confidential'
    };
    return mapping[classification?.toString().toLowerCase()] || 'public';
  }

  private mapSkillLevel(level: any): AIAgentMetadata['skillLevel'] {
    const mapping: Record<string, AIAgentMetadata['skillLevel']> = {
      'beginner': 'beginner',
      'basic': 'beginner',
      'intermediate': 'intermediate',
      'advanced': 'advanced',
      'expert': 'expert',
      'professional': 'expert'
    };
    return mapping[level?.toString().toLowerCase()] || 'intermediate';
  }

  private mapToolType(type: any): ToolMetadata['toolType'] {
    const mapping: Record<string, ToolMetadata['toolType']> = {
      'utility': 'utility',
      'integration': 'integration',
      'automation': 'automation',
      'analysis': 'analysis',
      'conversion': 'conversion',
      'tool': 'utility',
      'connector': 'integration',
      'workflow': 'automation',
      'analyzer': 'analysis',
      'converter': 'conversion'
    };
    return mapping[type?.toString().toLowerCase()] || 'utility';
  }

  private mapPricingModel(model: any): ToolMetadata['pricing']['model'] {
    const mapping: Record<string, ToolMetadata['pricing']['model']> = {
      'free': 'free',
      'freemium': 'freemium',
      'subscription': 'subscription',
      'pay-per-use': 'pay-per-use',
      'enterprise': 'enterprise',
      'paid': 'subscription',
      'usage': 'pay-per-use'
    };
    return mapping[model?.toString().toLowerCase()] || 'free';
  }

  /**
   * Utility methods
   */
  private normalizeTags(tags: any): string[] {
    if (!tags) return [];
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    if (Array.isArray(tags)) {
      return tags.map(tag => tag.toString().trim()).filter(tag => tag.length > 0);
    }
    return [];
  }

  private normalizeArray(array: any): string[] {
    if (!array) return [];
    if (typeof array === 'string') {
      return [array];
    }
    if (Array.isArray(array)) {
      return array.map(item => item.toString());
    }
    return [];
  }

  private generateId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get migration history for a source
   */
  getMigrationHistory(source: string): string[] {
    return this.migrationHistory.get(source) || [];
  }

  /**
   * Record migration for a source
   */
  recordMigration(source: string, version: string): void {
    const history = this.migrationHistory.get(source) || [];
    if (!history.includes(version)) {
      history.push(version);
      this.migrationHistory.set(source, history);
    }
  }

  /**
   * Check if source needs migration
   */
  needsMigration(source: string, currentVersion: string): boolean {
    const history = this.migrationHistory.get(source) || [];
    return !history.includes(currentVersion);
  }
}

/**
 * Metadata Versioning and Backward Compatibility System
 */
export class MetadataVersionManager {
  private versionHistory = new Map<string, string[]>();
  private compatibilityMatrix = new Map<string, Record<string, boolean>>();

  constructor() {
    this.initializeVersionHistory();
    this.initializeCompatibilityMatrix();
  }

  /**
   * Initialize version history for all metadata types
   */
  private initializeVersionHistory(): void {
    this.versionHistory.set('workflow', ['1.0.0', '1.1.0', '1.2.0']);
    this.versionHistory.set('ai_agent', ['1.0.0', '1.1.0']);
    this.versionHistory.set('tool', ['1.0.0', '1.1.0', '1.2.0', '1.3.0']);
  }

  /**
   * Initialize compatibility matrix between versions
   */
  private initializeCompatibilityMatrix(): void {
    // Workflow compatibility
    this.compatibilityMatrix.set('workflow', {
      '1.0.0->1.1.0': true,
      '1.1.0->1.2.0': true,
      '1.0.0->1.2.0': true
    });

    // AI Agent compatibility
    this.compatibilityMatrix.set('ai_agent', {
      '1.0.0->1.1.0': true
    });

    // Tool compatibility
    this.compatibilityMatrix.set('tool', {
      '1.0.0->1.1.0': true,
      '1.1.0->1.2.0': true,
      '1.2.0->1.3.0': true,
      '1.0.0->1.2.0': true,
      '1.0.0->1.3.0': true,
      '1.1.0->1.3.0': true
    });
  }

  /**
   * Check if two versions are compatible
   */
  isCompatible(type: string, fromVersion: string, toVersion: string): boolean {
    if (fromVersion === toVersion) return true;
    
    const matrix = this.compatibilityMatrix.get(type);
    if (!matrix) return false;
    
    const key = `${fromVersion}->${toVersion}`;
    return matrix[key] || false;
  }

  /**
   * Get all compatible versions for a given version
   */
  getCompatibleVersions(type: string, version: string): string[] {
    const matrix = this.compatibilityMatrix.get(type);
    if (!matrix) return [version];
    
    const compatible: string[] = [version];
    
    for (const [key, isCompatible] of Object.entries(matrix)) {
      if (isCompatible) {
        const [from, to] = key.split('->');
        if (from === version) {
          compatible.push(to);
        }
      }
    }
    
    return compatible;
  }

  /**
   * Get the latest version for a type
   */
  getLatestVersion(type: string): string {
    const versions = this.versionHistory.get(type);
    if (!versions || versions.length === 0) return '1.0.0';
    
    return versions[versions.length - 1];
  }

  /**
   * Get all versions for a type
   */
  getAllVersions(type: string): string[] {
    return this.versionHistory.get(type) || ['1.0.0'];
  }

  /**
   * Add a new version
   */
  addVersion(type: string, version: string): void {
    const versions = this.versionHistory.get(type) || [];
    if (!versions.includes(version)) {
      versions.push(version);
      this.versionHistory.set(type, versions);
    }
  }

  /**
   * Set compatibility between two versions
   */
  setCompatibility(type: string, fromVersion: string, toVersion: string, compatible: boolean): void {
    const matrix = this.compatibilityMatrix.get(type) || {};
    matrix[`${fromVersion}->${toVersion}`] = compatible;
    this.compatibilityMatrix.set(type, matrix);
  }

  /**
   * Migrate metadata to a specific version
   */
  migrateToVersion(metadata: UnifiedMetadata, targetVersion: string): UnifiedMetadata {
    const currentVersion = metadata.schemaVersion;
    
    if (currentVersion === targetVersion) {
      return metadata;
    }
    
    if (!this.isCompatible(metadata.type, currentVersion, targetVersion)) {
      throw new Error(`Cannot migrate ${metadata.type} from ${currentVersion} to ${targetVersion} - versions are not compatible`);
    }
    
    // Apply version-specific migrations
    return this.applyVersionMigration(metadata, currentVersion, targetVersion);
  }

  /**
   * Apply version-specific migration logic
   */
  private applyVersionMigration(metadata: UnifiedMetadata, fromVersion: string, toVersion: string): UnifiedMetadata {
    let migrated = { ...metadata };
    
    // Apply migrations step by step
    const versions = this.getAllVersions(metadata.type);
    const fromIndex = versions.indexOf(fromVersion);
    const toIndex = versions.indexOf(toVersion);
    
    if (fromIndex === -1 || toIndex === -1) {
      throw new Error(`Unknown version: ${fromVersion} or ${toVersion}`);
    }
    
    // Migrate step by step
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      const nextVersion = versions[i];
      migrated = this.applySingleVersionMigration(migrated, versions[i - 1], nextVersion);
    }
    
    return {
      ...migrated,
      schemaVersion: toVersion,
      metadataVersion: toVersion
    };
  }

  /**
   * Apply migration for a single version step
   */
  private applySingleVersionMigration(metadata: UnifiedMetadata, fromVersion: string, toVersion: string): UnifiedMetadata {
    const migrationKey = `${metadata.type}_${fromVersion}_${toVersion}`;
    
    switch (migrationKey) {
      case 'workflow_1.0.0_1.1.0':
        return this.migrateWorkflow_1_0_0_to_1_1_0(metadata as WorkflowMetadata);
      case 'workflow_1.1.0_1.2.0':
        return this.migrateWorkflow_1_1_0_to_1_2_0(metadata as WorkflowMetadata);
      case 'ai_agent_1.0.0_1.1.0':
        return this.migrateAIAgent_1_0_0_to_1_1_0(metadata as AIAgentMetadata);
      case 'tool_1.0.0_1.1.0':
        return this.migrateTool_1_0_0_to_1_1_0(metadata as ToolMetadata);
      case 'tool_1.1.0_1.2.0':
        return this.migrateTool_1_1_0_to_1_2_0(metadata as ToolMetadata);
      case 'tool_1.2.0_1.3.0':
        return this.migrateTool_1_2_0_to_1_3_0(metadata as ToolMetadata);
      default:
        // No specific migration needed, just update version
        return {
          ...metadata,
          schemaVersion: toVersion,
          metadataVersion: toVersion
        };
    }
  }

  /**
   * Workflow migration from 1.0.0 to 1.1.0
   */
  private migrateWorkflow_1_0_0_to_1_1_0(metadata: WorkflowMetadata): WorkflowMetadata {
    return {
      ...metadata,
      // Add new fields introduced in 1.1.0
      securityLevel: metadata.securityLevel || 'public',
      complianceTags: metadata.complianceTags || [],
      dataClassification: metadata.dataClassification || 'public',
      schemaVersion: '1.1.0',
      metadataVersion: '1.1.0'
    };
  }

  /**
   * Workflow migration from 1.1.0 to 1.2.0
   */
  private migrateWorkflow_1_1_0_to_1_2_0(metadata: WorkflowMetadata): WorkflowMetadata {
    return {
      ...metadata,
      // Add new fields introduced in 1.2.0
      documentation: metadata.documentation || '',
      examples: metadata.examples || [],
      tutorials: metadata.tutorials || [],
      schemaVersion: '1.2.0',
      metadataVersion: '1.2.0'
    };
  }

  /**
   * AI Agent migration from 1.0.0 to 1.1.0
   */
  private migrateAIAgent_1_0_0_to_1_1_0(metadata: AIAgentMetadata): AIAgentMetadata {
    return {
      ...metadata,
      // Add new fields introduced in 1.1.0
      rateLimits: metadata.rateLimits || undefined,
      costPerRequest: metadata.costPerRequest || undefined,
      costPerToken: metadata.costPerToken || undefined,
      freeTierAvailable: metadata.freeTierAvailable || false,
      schemaVersion: '1.1.0',
      metadataVersion: '1.1.0'
    };
  }

  /**
   * Tool migration from 1.0.0 to 1.1.0
   */
  private migrateTool_1_0_0_to_1_1_0(metadata: ToolMetadata): ToolMetadata {
    return {
      ...metadata,
      // Add new fields introduced in 1.1.0
      performance: metadata.performance || {
        speed: 0,
        reliability: 0,
        scalability: 0
      },
      pricing: metadata.pricing || {
        model: 'free',
        freeTierAvailable: true,
        costPerUse: undefined,
        monthlyCost: undefined
      },
      schemaVersion: '1.1.0',
      metadataVersion: '1.1.0'
    };
  }

  /**
   * Tool migration from 1.1.0 to 1.2.0
   */
  private migrateTool_1_1_0_to_1_2_0(metadata: ToolMetadata): ToolMetadata {
    return {
      ...metadata,
      // Add new fields introduced in 1.2.0
      userGuide: metadata.userGuide || '',
      apiReference: metadata.apiReference || '',
      tutorials: metadata.tutorials || [],
      faq: metadata.faq || [],
      schemaVersion: '1.2.0',
      metadataVersion: '1.2.0'
    };
  }

  /**
   * Tool migration from 1.2.0 to 1.3.0
   */
  private migrateTool_1_2_0_to_1_3_0(metadata: ToolMetadata): ToolMetadata {
    return {
      ...metadata,
      // Add new fields introduced in 1.3.0
      supportedFormats: metadata.supportedFormats || [],
      supportedProtocols: metadata.supportedProtocols || [],
      systemRequirements: metadata.systemRequirements || [],
      schemaVersion: '1.3.0',
      metadataVersion: '1.3.0'
    };
  }

  /**
   * Get version information for a metadata type
   */
  getVersionInfo(type: string): {
    currentVersion: string;
    allVersions: string[];
    latestVersion: string;
    compatibilityMatrix: Record<string, boolean>;
  } {
    return {
      currentVersion: '1.0.0', // Default current version
      allVersions: this.getAllVersions(type),
      latestVersion: this.getLatestVersion(type),
      compatibilityMatrix: this.compatibilityMatrix.get(type) || {}
    };
  }
}

/**
 * Metadata Search and Filtering Engine
 */
export class MetadataSearchEngine {
  private index = new Map<string, UnifiedMetadata[]>();

  /**
   * Index metadata for search
   */
  indexMetadata(metadata: UnifiedMetadata): void {
    const type = metadata.type;
    if (!this.index.has(type)) {
      this.index.set(type, []);
    }
    
    const items = this.index.get(type)!;
    const existingIndex = items.findIndex(item => item.id === metadata.id);
    
    if (existingIndex >= 0) {
      items[existingIndex] = metadata;
    } else {
      items.push(metadata);
    }
  }

  /**
   * Remove metadata from index
   */
  removeFromIndex(id: string, type: string): void {
    const items = this.index.get(type);
    if (items) {
      const index = items.findIndex(item => item.id === id);
      if (index >= 0) {
        items.splice(index, 1);
      }
    }
  }

  /**
   * Search metadata based on criteria
   */
  search(criteria: MetadataSearchCriteria): MetadataSearchResult {
    const items = this.getAllMetadata();
    let filtered = items;

    // Apply filters
    if (criteria.type) {
      filtered = filtered.filter(item => item.type === criteria.type);
    }

    if (criteria.category) {
      filtered = filtered.filter(item => item.category === criteria.category);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      filtered = filtered.filter(item => 
        criteria.tags!.some(tag => item.tags.includes(tag))
      );
    }

    if (criteria.source) {
      filtered = filtered.filter(item => item.source === criteria.source);
    }

    if (criteria.status) {
      filtered = filtered.filter(item => item.status === criteria.status);
    }

    if (criteria.qualityScore) {
      filtered = filtered.filter(item => 
        item.qualityScore >= criteria.qualityScore!.min && 
        item.qualityScore <= criteria.qualityScore!.max
      );
    }

    if (criteria.dateRange) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.updatedAt);
        const fromDate = new Date(criteria.dateRange!.from);
        const toDate = new Date(criteria.dateRange!.to);
        return itemDate >= fromDate && itemDate <= toDate;
      });
    }

    // Apply text search
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort results
    if (criteria.sortBy) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[criteria.sortBy!];
        const bValue = (b as any)[criteria.sortBy!];
        
        if (aValue < bValue) return criteria.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return criteria.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Apply pagination
    const total = filtered.length;
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 50;
    const paginated = filtered.slice(offset, offset + limit);

    // Generate facets
    const facets = this.generateFacets(filtered);

    return {
      items: paginated,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      facets
    };
  }

  /**
   * Get all metadata
   */
  private getAllMetadata(): UnifiedMetadata[] {
    const all: UnifiedMetadata[] = [];
    for (const items of this.index.values()) {
      all.push(...items);
    }
    return all;
  }

  /**
   * Generate search facets
   */
  private generateFacets(items: UnifiedMetadata[]): Record<string, Record<string, number>> {
    const facets: Record<string, Record<string, number>> = {
      type: {},
      category: {},
      source: {},
      status: {},
      tags: {}
    };

    for (const item of items) {
      // Type facet
      facets.type[item.type] = (facets.type[item.type] || 0) + 1;
      
      // Category facet
      facets.category[item.category] = (facets.category[item.category] || 0) + 1;
      
      // Source facet
      facets.source[item.source] = (facets.source[item.source] || 0) + 1;
      
      // Status facet
      facets.status[item.status] = (facets.status[item.status] || 0) + 1;
      
      // Tags facet
      for (const tag of item.tags) {
        facets.tags[tag] = (facets.tags[tag] || 0) + 1;
      }
    }

    return facets;
  }

  /**
   * Get suggestions for search
   */
  getSuggestions(query: string, limit: number = 10): string[] {
    const allItems = this.getAllMetadata();
    const suggestions = new Set<string>();

    for (const item of allItems) {
      // Add name suggestions
      if (item.name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(item.name);
      }

      // Add tag suggestions
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag);
        }
      }

      // Add category suggestions
      if (item.category.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(item.category);
      }
    }

    return Array.from(suggestions).slice(0, limit);
  }
}

// Export singleton instances
export const metadataValidator = new MetadataValidator();
export const metadataQualityScorer = new MetadataQualityScorer();
export const metadataMigrator = new MetadataMigrator();
export const metadataVersionManager = new MetadataVersionManager();
export const metadataSearchEngine = new MetadataSearchEngine();
