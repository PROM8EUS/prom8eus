/**
 * Validation Service
 * 
 * Dedicated service for data validation and normalization
 */

import { ValidationRule, ValidationContext } from '../schemas/common';
import { WorkflowIndex, AgentIndex } from '../schemas/workflowIndex';
import { N8nWorkflow } from '../schemas/n8nWorkflow';
import { UnifiedWorkflow } from '../schemas/unifiedWorkflow';
// DI imports temporarily disabled to fix build issues
// import { Injectable } from '../di/injectable';
// import { DI_TOKENS } from '../di/tokens';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedData?: any;
}

export class ValidationService {
  private validationRules: Map<string, ValidationRule[]> = new Map();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize validation rules
   */
  private initialize(): void {
    this.setupWorkflowValidationRules();
    this.setupAgentValidationRules();
    this.setupN8nWorkflowValidationRules();
    this.setupUnifiedWorkflowValidationRules();
  }

  /**
   * Validate workflow index
   */
  validateWorkflowIndex(input: any, context?: ValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check mandatory core fields
    if (!input?.id || !input?.source || !input?.title || !input?.summary || !input?.link) {
      errors.push('Missing mandatory core fields: id, source, title, summary, link');
    }

    // Check workflow-specific mandatory fields
    if (!input?.category || !input?.integrations || !input?.complexity) {
      errors.push('Missing mandatory workflow fields: category, integrations, complexity');
    }

    // Validate field types
    if (input.id && typeof input.id !== 'string') {
      errors.push('Field "id" must be a string');
    }

    if (input.source && typeof input.source !== 'string') {
      errors.push('Field "source" must be a string');
    }

    if (input.title && typeof input.title !== 'string') {
      errors.push('Field "title" must be a string');
    }

    if (input.summary && typeof input.summary !== 'string') {
      errors.push('Field "summary" must be a string');
    }

    if (input.link && typeof input.link !== 'string') {
      errors.push('Field "link" must be a string');
    }

    if (input.category && typeof input.category !== 'string') {
      errors.push('Field "category" must be a string');
    }

    if (input.integrations && !Array.isArray(input.integrations)) {
      errors.push('Field "integrations" must be an array');
    }

    if (input.complexity && !['Low', 'Medium', 'High'].includes(input.complexity)) {
      errors.push('Field "complexity" must be one of: Low, Medium, High');
    }

    // Validate optional fields
    if (input.triggerType && !['Complex', 'Webhook', 'Manual', 'Scheduled'].includes(input.triggerType)) {
      warnings.push('Field "triggerType" has unexpected value');
    }

    if (input.nodeCount && typeof input.nodeCount !== 'number') {
      warnings.push('Field "nodeCount" must be a number');
    }

    if (input.tags && !Array.isArray(input.tags)) {
      warnings.push('Field "tags" must be an array');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      normalizedData: isValid ? this.normalizeWorkflowIndex(input) : undefined
    };
  }

  /**
   * Validate agent index
   */
  validateAgentIndex(input: any, context?: ValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check mandatory core fields
    if (!input?.id || !input?.source || !input?.title || !input?.summary || !input?.link) {
      errors.push('Missing mandatory core fields: id, source, title, summary, link');
    }

    // Check agent-specific mandatory fields
    if (!input?.model || !input?.provider || !input?.capabilities) {
      errors.push('Missing mandatory agent fields: model, provider, capabilities');
    }

    // Validate field types
    if (input.model && typeof input.model !== 'string') {
      errors.push('Field "model" must be a string');
    }

    if (input.provider && typeof input.provider !== 'string') {
      errors.push('Field "provider" must be a string');
    }

    if (input.capabilities && !Array.isArray(input.capabilities)) {
      errors.push('Field "capabilities" must be an array');
    }

    // Validate optional fields
    if (input.difficulty && !['Beginner', 'Intermediate', 'Advanced'].includes(input.difficulty)) {
      warnings.push('Field "difficulty" has unexpected value');
    }

    if (input.setupTime && !['Quick', 'Medium', 'Long'].includes(input.setupTime)) {
      warnings.push('Field "setupTime" has unexpected value');
    }

    if (input.deployment && !['Local', 'Cloud', 'Hybrid'].includes(input.deployment)) {
      warnings.push('Field "deployment" has unexpected value');
    }

    if (input.pricing && !['Free', 'Freemium', 'Paid', 'Enterprise'].includes(input.pricing)) {
      warnings.push('Field "pricing" has unexpected value');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      normalizedData: isValid ? this.normalizeAgentIndex(input) : undefined
    };
  }

  /**
   * Validate N8N workflow
   */
  validateN8nWorkflow(input: any, context?: ValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check mandatory fields
    if (!input?.id || !input?.name || !input?.description || !input?.category) {
      errors.push('Missing mandatory fields: id, name, description, category');
    }

    // Validate field types
    if (input.difficulty && !['Easy', 'Medium', 'Hard'].includes(input.difficulty)) {
      errors.push('Field "difficulty" must be one of: Easy, Medium, Hard');
    }

    if (input.nodes && typeof input.nodes !== 'number') {
      errors.push('Field "nodes" must be a number');
    }

    if (input.connections && typeof input.connections !== 'number') {
      errors.push('Field "connections" must be a number');
    }

    if (input.downloads && typeof input.downloads !== 'number') {
      warnings.push('Field "downloads" must be a number');
    }

    if (input.rating && (typeof input.rating !== 'number' || input.rating < 0 || input.rating > 5)) {
      warnings.push('Field "rating" must be a number between 0 and 5');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      normalizedData: isValid ? this.normalizeN8nWorkflow(input) : undefined
    };
  }

  /**
   * Validate unified workflow
   */
  validateUnifiedWorkflow(input: any, context?: ValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check mandatory core fields
    if (!input?.id || !input?.title || !input?.description || !input?.source || !input?.category) {
      errors.push('Missing mandatory core fields: id, title, description, source, category');
    }

    // Validate field types
    if (input.complexity && !['Low', 'Medium', 'High'].includes(input.complexity)) {
      errors.push('Field "complexity" must be one of: Low, Medium, High');
    }

    if (input.triggerType && !['Complex', 'Webhook', 'Manual', 'Scheduled'].includes(input.triggerType)) {
      warnings.push('Field "triggerType" has unexpected value');
    }

    if (input.status && !['active', 'inactive', 'deprecated', 'draft'].includes(input.status)) {
      warnings.push('Field "status" has unexpected value');
    }

    if (input.isAIGenerated && typeof input.isAIGenerated !== 'boolean') {
      warnings.push('Field "isAIGenerated" must be a boolean');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      normalizedData: isValid ? this.normalizeUnifiedWorkflow(input) : undefined
    };
  }

  /**
   * Setup workflow validation rules
   */
  private setupWorkflowValidationRules(): void {
    const rules: ValidationRule[] = [
      {
        field: 'id',
        type: 'required',
        validator: 'string',
        message: 'ID is required and must be a string'
      },
      {
        field: 'source',
        type: 'required',
        validator: 'string',
        message: 'Source is required and must be a string'
      },
      {
        field: 'title',
        type: 'required',
        validator: 'string',
        message: 'Title is required and must be a string'
      },
      {
        field: 'summary',
        type: 'required',
        validator: 'string',
        message: 'Summary is required and must be a string'
      },
      {
        field: 'link',
        type: 'required',
        validator: 'url',
        message: 'Link is required and must be a valid URL'
      },
      {
        field: 'category',
        type: 'required',
        validator: 'string',
        message: 'Category is required and must be a string'
      },
      {
        field: 'integrations',
        type: 'required',
        validator: 'array',
        message: 'Integrations is required and must be an array'
      },
      {
        field: 'complexity',
        type: 'required',
        validator: 'enum',
        message: 'Complexity is required and must be one of: Low, Medium, High'
      }
    ];

    this.validationRules.set('workflow', rules);
  }

  /**
   * Setup agent validation rules
   */
  private setupAgentValidationRules(): void {
    const rules: ValidationRule[] = [
      {
        field: 'id',
        type: 'required',
        validator: 'string',
        message: 'ID is required and must be a string'
      },
      {
        field: 'source',
        type: 'required',
        validator: 'string',
        message: 'Source is required and must be a string'
      },
      {
        field: 'title',
        type: 'required',
        validator: 'string',
        message: 'Title is required and must be a string'
      },
      {
        field: 'summary',
        type: 'required',
        validator: 'string',
        message: 'Summary is required and must be a string'
      },
      {
        field: 'link',
        type: 'required',
        validator: 'url',
        message: 'Link is required and must be a valid URL'
      },
      {
        field: 'model',
        type: 'required',
        validator: 'string',
        message: 'Model is required and must be a string'
      },
      {
        field: 'provider',
        type: 'required',
        validator: 'string',
        message: 'Provider is required and must be a string'
      },
      {
        field: 'capabilities',
        type: 'required',
        validator: 'array',
        message: 'Capabilities is required and must be an array'
      }
    ];

    this.validationRules.set('agent', rules);
  }

  /**
   * Setup N8N workflow validation rules
   */
  private setupN8nWorkflowValidationRules(): void {
    const rules: ValidationRule[] = [
      {
        field: 'id',
        type: 'required',
        validator: 'string',
        message: 'ID is required and must be a string'
      },
      {
        field: 'name',
        type: 'required',
        validator: 'string',
        message: 'Name is required and must be a string'
      },
      {
        field: 'description',
        type: 'required',
        validator: 'string',
        message: 'Description is required and must be a string'
      },
      {
        field: 'category',
        type: 'required',
        validator: 'string',
        message: 'Category is required and must be a string'
      },
      {
        field: 'difficulty',
        type: 'required',
        validator: 'enum',
        message: 'Difficulty is required and must be one of: Easy, Medium, Hard'
      }
    ];

    this.validationRules.set('n8nWorkflow', rules);
  }

  /**
   * Setup unified workflow validation rules
   */
  private setupUnifiedWorkflowValidationRules(): void {
    const rules: ValidationRule[] = [
      {
        field: 'id',
        type: 'required',
        validator: 'string',
        message: 'ID is required and must be a string'
      },
      {
        field: 'title',
        type: 'required',
        validator: 'string',
        message: 'Title is required and must be a string'
      },
      {
        field: 'description',
        type: 'required',
        validator: 'string',
        message: 'Description is required and must be a string'
      },
      {
        field: 'source',
        type: 'required',
        validator: 'string',
        message: 'Source is required and must be a string'
      },
      {
        field: 'category',
        type: 'required',
        validator: 'string',
        message: 'Category is required and must be a string'
      }
    ];

    this.validationRules.set('unifiedWorkflow', rules);
  }

  /**
   * Normalize workflow index
   */
  private normalizeWorkflowIndex(input: any): WorkflowIndex {
    return {
      id: String(input.id),
      source: String(input.source),
      title: String(input.title),
      summary: String(input.summary),
      link: String(input.link),
      category: String(input.category),
      integrations: Array.isArray(input.integrations) ? input.integrations.map(String) : [],
      complexity: input.complexity as 'Low' | 'Medium' | 'High',
      filename: input.filename ? String(input.filename) : undefined,
      active: typeof input.active === 'boolean' ? input.active : true,
      triggerType: input.triggerType as 'Complex' | 'Webhook' | 'Manual' | 'Scheduled' | undefined,
      nodeCount: typeof input.nodeCount === 'number' ? input.nodeCount : undefined,
      tags: Array.isArray(input.tags) ? input.tags.map(String) : undefined,
      fileHash: input.fileHash ? String(input.fileHash) : undefined,
      analyzedAt: input.analyzedAt ? String(input.analyzedAt) : undefined,
      license: input.license ? String(input.license) : 'Unknown',
      author: input.author,
      domainClassification: input.domainClassification
    };
  }

  /**
   * Normalize agent index
   */
  private normalizeAgentIndex(input: any): AgentIndex {
    return {
      id: String(input.id),
      source: String(input.source),
      title: String(input.title),
      summary: String(input.summary),
      link: String(input.link),
      model: String(input.model),
      provider: String(input.provider),
      capabilities: Array.isArray(input.capabilities) ? input.capabilities.map(String) : [],
      category: input.category ? String(input.category) : undefined,
      tags: Array.isArray(input.tags) ? input.tags.map(String) : undefined,
      difficulty: input.difficulty as 'Beginner' | 'Intermediate' | 'Advanced' | undefined,
      setupTime: input.setupTime as 'Quick' | 'Medium' | 'Long' | undefined,
      deployment: input.deployment as 'Local' | 'Cloud' | 'Hybrid' | undefined,
      license: input.license ? String(input.license) : 'Unknown',
      pricing: input.pricing as 'Free' | 'Freemium' | 'Paid' | 'Enterprise' | undefined,
      requirements: Array.isArray(input.requirements) ? input.requirements.map(String) : undefined,
      useCases: Array.isArray(input.useCases) ? input.useCases.map(String) : undefined,
      automationPotential: typeof input.automationPotential === 'number' ? input.automationPotential : undefined,
      author: input.author,
      likes: typeof input.likes === 'number' ? input.likes : undefined,
      downloads: typeof input.downloads === 'number' ? input.downloads : undefined,
      lastModified: input.lastModified ? String(input.lastModified) : undefined,
      githubUrl: input.githubUrl ? String(input.githubUrl) : undefined,
      demoUrl: input.demoUrl ? String(input.demoUrl) : undefined,
      documentationUrl: input.documentationUrl ? String(input.documentationUrl) : undefined,
      domainClassification: input.domainClassification
    };
  }

  /**
   * Normalize N8N workflow
   */
  private normalizeN8nWorkflow(input: any): N8nWorkflow {
    return {
      id: String(input.id),
      name: String(input.name),
      description: String(input.description),
      category: String(input.category),
      difficulty: input.difficulty as 'Easy' | 'Medium' | 'Hard',
      estimatedTime: input.estimatedTime ? String(input.estimatedTime) : '30 min',
      estimatedCost: input.estimatedCost ? String(input.estimatedCost) : '€25',
      nodes: typeof input.nodes === 'number' ? input.nodes : 0,
      connections: typeof input.connections === 'number' ? input.connections : 0,
      downloads: typeof input.downloads === 'number' ? input.downloads : 0,
      rating: typeof input.rating === 'number' ? input.rating : 0,
      createdAt: input.createdAt ? String(input.createdAt) : new Date().toISOString(),
      url: input.url ? String(input.url) : '',
      jsonUrl: input.jsonUrl ? String(input.jsonUrl) : '',
      active: typeof input.active === 'boolean' ? input.active : true,
      triggerType: input.triggerType ? String(input.triggerType) : 'Manual',
      integrations: Array.isArray(input.integrations) ? input.integrations.map(String) : [],
      author: input.author ? String(input.author) : undefined
    };
  }

  /**
   * Normalize unified workflow
   */
  private normalizeUnifiedWorkflow(input: any): UnifiedWorkflow {
    return {
      id: String(input.id),
      title: String(input.title),
      description: String(input.description),
      summary: input.summary ? String(input.summary) : String(input.description),
      source: String(input.source),
      sourceUrl: input.sourceUrl ? String(input.sourceUrl) : undefined,
      category: String(input.category),
      tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
      license: input.license ? String(input.license) : 'Unknown',
      complexity: input.complexity as 'Low' | 'Medium' | 'High',
      triggerType: input.triggerType as 'Complex' | 'Webhook' | 'Manual' | 'Scheduled',
      integrations: Array.isArray(input.integrations) ? input.integrations.map(String) : [],
      nodeCount: typeof input.nodeCount === 'number' ? input.nodeCount : undefined,
      connectionCount: typeof input.connectionCount === 'number' ? input.connectionCount : undefined,
      n8nWorkflow: input.n8nWorkflow,
      jsonUrl: input.jsonUrl ? String(input.jsonUrl) : undefined,
      workflowData: input.workflowData,
      author: input.author,
      createdAt: input.createdAt ? String(input.createdAt) : new Date().toISOString(),
      updatedAt: input.updatedAt ? String(input.updatedAt) : new Date().toISOString(),
      version: input.version ? String(input.version) : '1.0.0',
      status: input.status as 'active' | 'inactive' | 'deprecated' | 'draft',
      isAIGenerated: typeof input.isAIGenerated === 'boolean' ? input.isAIGenerated : false,
      generationMetadata: input.generationMetadata,
      validationStatus: input.validationStatus as 'valid' | 'invalid' | 'pending' | undefined,
      setupCost: typeof input.setupCost === 'number' ? input.setupCost : undefined,
      estimatedTime: input.estimatedTime ? String(input.estimatedTime) : undefined,
      estimatedCost: input.estimatedCost ? String(input.estimatedCost) : undefined,
      timeSavings: typeof input.timeSavings === 'number' ? input.timeSavings : undefined,
      downloads: typeof input.downloads === 'number' ? input.downloads : undefined,
      rating: typeof input.rating === 'number' ? input.rating : undefined,
      popularity: typeof input.popularity === 'number' ? input.popularity : undefined,
      verified: typeof input.verified === 'boolean' ? input.verified : false,
      domainClassification: input.domainClassification,
      score: input.score,
      match: input.match,
      downloadUrl: input.downloadUrl ? String(input.downloadUrl) : undefined,
      previewUrl: input.previewUrl ? String(input.previewUrl) : undefined,
      thumbnailUrl: input.thumbnailUrl ? String(input.thumbnailUrl) : undefined,
      active: typeof input.active === 'boolean' ? input.active : true,
      fileHash: input.fileHash ? String(input.fileHash) : undefined,
      analyzedAt: input.analyzedAt ? String(input.analyzedAt) : undefined,
      lastAccessed: input.lastAccessed ? String(input.lastAccessed) : undefined,
      cacheKey: input.cacheKey ? String(input.cacheKey) : undefined
    };
  }

  /**
   * Get validation rules for a specific type
   */
  getValidationRules(type: string): ValidationRule[] {
    return this.validationRules.get(type) || [];
  }

  /**
   * Add custom validation rule
   */
  addValidationRule(type: string, rule: ValidationRule): void {
    if (!this.validationRules.has(type)) {
      this.validationRules.set(type, []);
    }
    this.validationRules.get(type)!.push(rule);
  }

  /**
   * Remove validation rule
   */
  removeValidationRule(type: string, field: string): void {
    const rules = this.validationRules.get(type);
    if (rules) {
      const index = rules.findIndex(rule => rule.field === field);
      if (index !== -1) {
        rules.splice(index, 1);
      }
    }
  }
}
