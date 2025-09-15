/**
 * Source Configuration Management System
 * 
 * This module provides comprehensive management of source configurations,
 * including dynamic addition/removal, validation, credential management,
 * and configuration versioning.
 */

import { fallbackEngine, SourceConfig } from './fallbackSystem';
import { performanceMetrics } from './performanceMetrics';

export interface SourceType {
  id: string;
  name: string;
  description: string;
  category: 'workflow' | 'ai_agent' | 'tool' | 'api' | 'database' | 'file';
  requiredFields: string[];
  optionalFields: string[];
  validationRules: ValidationRule[];
  defaultConfig: Partial<SourceConfig>;
  supportedOperations: string[];
  icon?: string;
  documentation?: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'optional';
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'url' | 'email';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  customValidator?: (value: any) => boolean | string;
  errorMessage?: string;
}

export interface SourceConfiguration {
  id: string;
  name: string;
  type: string;
  config: SourceConfig;
  metadata: {
    created: Date;
    updated: Date;
    version: string;
    createdBy: string;
    updatedBy: string;
    tags: string[];
    description?: string;
  };
  status: 'active' | 'inactive' | 'testing' | 'error';
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    lastValidated: Date;
  };
  credentials?: {
    encrypted: boolean;
    keyId?: string;
    lastRotated?: Date;
    expiresAt?: Date;
  };
}

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  sourceType: string;
  template: Partial<SourceConfig>;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  category: string;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ConfigurationBackup {
  id: string;
  timestamp: Date;
  configurations: SourceConfiguration[];
  metadata: {
    version: string;
    description?: string;
    createdBy: string;
  };
}

export interface ConfigurationAuditLog {
  id: string;
  timestamp: Date;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'test' | 'validate';
  configurationId: string;
  userId: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
}

export interface ConfigurationTestResult {
  success: boolean;
  responseTime: number;
  errorMessage?: string;
  data?: any;
  timestamp: Date;
  testType: 'connectivity' | 'authentication' | 'data_access' | 'full_operation';
}

/**
 * Source Configuration Manager
 */
export class SourceConfigManager {
  private configurations: Map<string, SourceConfiguration> = new Map();
  private sourceTypes: Map<string, SourceType> = new Map();
  private templates: Map<string, ConfigurationTemplate> = new Map();
  private auditLog: ConfigurationAuditLog[] = [];
  private backups: ConfigurationBackup[] = [];
  private validationCache: Map<string, { result: any; timestamp: Date }> = new Map();

  constructor() {
    this.initializeDefaultSourceTypes();
    this.initializeDefaultTemplates();
  }

  /**
   * Add a new source configuration
   */
  async addSource(config: Omit<SourceConfiguration, 'id' | 'metadata' | 'validation'>): Promise<string> {
    const id = this.generateConfigurationId();
    const now = new Date();
    
    // Validate configuration
    const validation = await this.validateConfiguration(config.config, config.type);
    
    const sourceConfiguration: SourceConfiguration = {
      id,
      ...config,
      metadata: {
        created: now,
        updated: now,
        version: '1.0.0',
        createdBy: 'system', // Would be current user in real implementation
        updatedBy: 'system',
        tags: [],
        description: config.name
      },
      validation
    };

    // Store configuration
    this.configurations.set(id, sourceConfiguration);
    
    // Register with fallback engine if valid
    if (validation.isValid) {
      await this.registerWithFallbackEngine(sourceConfiguration);
    }

    // Log audit event
    this.logAuditEvent('create', id, 'system', undefined, { config: sourceConfiguration });

    return id;
  }

  /**
   * Update an existing source configuration
   */
  async updateSource(id: string, updates: Partial<SourceConfiguration>): Promise<boolean> {
    const existing = this.configurations.get(id);
    if (!existing) {
      throw new Error(`Configuration ${id} not found`);
    }

    const now = new Date();
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    // Track changes
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'metadata' && updates[key as keyof SourceConfiguration] !== existing[key as keyof SourceConfiguration]) {
        changes.push({
          field: key,
          oldValue: existing[key as keyof SourceConfiguration],
          newValue: updates[key as keyof SourceConfiguration]
        });
      }
    });

    // Validate updated configuration
    const validation = await this.validateConfiguration(updates.config || existing.config, existing.type);

    // Update configuration
    const updated: SourceConfiguration = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        updated: now,
        updatedBy: 'system',
        version: this.incrementVersion(existing.metadata.version)
      },
      validation
    };

    this.configurations.set(id, updated);

    // Update fallback engine registration
    if (validation.isValid) {
      await this.registerWithFallbackEngine(updated);
    }

    // Log audit event
    this.logAuditEvent('update', id, 'system', changes, { updated });

    return true;
  }

  /**
   * Remove a source configuration
   */
  async removeSource(id: string): Promise<boolean> {
    const config = this.configurations.get(id);
    if (!config) {
      return false;
    }

    // Remove from fallback engine
    await this.unregisterFromFallbackEngine(id);

    // Remove configuration
    this.configurations.delete(id);

    // Log audit event
    this.logAuditEvent('delete', id, 'system', undefined, { removed: config });

    return true;
  }

  /**
   * Get source configuration by ID
   */
  getSource(id: string): SourceConfiguration | null {
    return this.configurations.get(id) || null;
  }

  /**
   * Get all source configurations
   */
  getAllSources(): SourceConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Get sources by type
   */
  getSourcesByType(type: string): SourceConfiguration[] {
    return Array.from(this.configurations.values()).filter(config => config.type === type);
  }

  /**
   * Get active sources
   */
  getActiveSources(): SourceConfiguration[] {
    return Array.from(this.configurations.values()).filter(config => config.status === 'active');
  }

  /**
   * Test source configuration
   */
  async testSource(id: string, testType: ConfigurationTestResult['testType'] = 'connectivity'): Promise<ConfigurationTestResult> {
    const config = this.configurations.get(id);
    if (!config) {
      throw new Error(`Configuration ${id} not found`);
    }

    const startTime = Date.now();
    
    try {
      let result: any;
      
      switch (testType) {
        case 'connectivity':
          result = await this.testConnectivity(config.config);
          break;
        case 'authentication':
          result = await this.testAuthentication(config.config);
          break;
        case 'data_access':
          result = await this.testDataAccess(config.config);
          break;
        case 'full_operation':
          result = await this.testFullOperation(config.config);
          break;
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }

      const responseTime = Date.now() - startTime;

      // Log audit event
      this.logAuditEvent('test', id, 'system', undefined, { testType, success: true, responseTime });

      return {
        success: true,
        responseTime,
        data: result,
        timestamp: new Date(),
        testType
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log audit event
      this.logAuditEvent('test', id, 'system', undefined, { testType, success: false, error: (error as Error).message });

      return {
        success: false,
        responseTime,
        errorMessage: (error as Error).message,
        timestamp: new Date(),
        testType
      };
    }
  }

  /**
   * Validate source configuration
   */
  async validateConfiguration(config: SourceConfig, type: string): Promise<SourceConfiguration['validation']> {
    const sourceType = this.sourceTypes.get(type);
    if (!sourceType) {
      return {
        isValid: false,
        errors: [`Unknown source type: ${type}`],
        warnings: [],
        lastValidated: new Date()
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    for (const field of sourceType.requiredFields) {
      if (!config[field as keyof SourceConfig]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Validate field types and constraints
    for (const rule of sourceType.validationRules) {
      const value = config[rule.field as keyof SourceConfig];
      
      if (rule.type === 'required' && (value === undefined || value === null || value === '')) {
        errors.push(`Required field '${rule.field}' is empty`);
        continue;
      }

      if (value !== undefined && value !== null) {
        const validationResult = this.validateField(value, rule);
        if (validationResult !== true) {
          if (rule.type === 'required') {
            errors.push(validationResult as string);
          } else {
            warnings.push(validationResult as string);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      lastValidated: new Date()
    };
  }

  /**
   * Activate source configuration
   */
  async activateSource(id: string): Promise<boolean> {
    const config = this.configurations.get(id);
    if (!config) {
      return false;
    }

    // Validate before activation
    const validation = await this.validateConfiguration(config.config, config.type);
    if (!validation.isValid) {
      throw new Error(`Cannot activate invalid configuration: ${validation.errors.join(', ')}`);
    }

    // Update status
    await this.updateSource(id, { status: 'active' });

    // Register with fallback engine
    await this.registerWithFallbackEngine(config);

    // Log audit event
    this.logAuditEvent('activate', id, 'system');

    return true;
  }

  /**
   * Deactivate source configuration
   */
  async deactivateSource(id: string): Promise<boolean> {
    const config = this.configurations.get(id);
    if (!config) {
      return false;
    }

    // Update status
    await this.updateSource(id, { status: 'inactive' });

    // Unregister from fallback engine
    await this.unregisterFromFallbackEngine(id);

    // Log audit event
    this.logAuditEvent('deactivate', id, 'system');

    return true;
  }

  /**
   * Create configuration from template
   */
  async createFromTemplate(templateId: string, variables: Record<string, any>): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Validate required variables
    const missingVariables = template.variables
      .filter(v => v.required && !variables[v.name])
      .map(v => v.name);

    if (missingVariables.length > 0) {
      throw new Error(`Missing required variables: ${missingVariables.join(', ')}`);
    }

    // Create configuration from template
    const config = this.applyTemplate(template, variables);
    
    return await this.addSource({
      name: config.name || 'Untitled Source',
      type: template.sourceType,
      config,
      status: 'testing'
    });
  }

  /**
   * Create configuration backup
   */
  createBackup(description?: string): string {
    const backupId = this.generateBackupId();
    const backup: ConfigurationBackup = {
      id: backupId,
      timestamp: new Date(),
      configurations: Array.from(this.configurations.values()),
      metadata: {
        version: '1.0.0',
        description,
        createdBy: 'system'
      }
    };

    this.backups.push(backup);

    // Keep only last 10 backups
    if (this.backups.length > 10) {
      this.backups = this.backups.slice(-10);
    }

    return backupId;
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<boolean> {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      return false;
    }

    // Clear existing configurations
    this.configurations.clear();

    // Restore configurations
    for (const config of backup.configurations) {
      this.configurations.set(config.id, config);
    }

    // Re-register with fallback engine
    for (const config of backup.configurations) {
      if (config.status === 'active') {
        await this.registerWithFallbackEngine(config);
      }
    }

    return true;
  }

  /**
   * Get audit log
   */
  getAuditLog(configurationId?: string, limit?: number): ConfigurationAuditLog[] {
    let log = this.auditLog;
    
    if (configurationId) {
      log = log.filter(entry => entry.configurationId === configurationId);
    }
    
    if (limit) {
      log = log.slice(-limit);
    }
    
    return log;
  }

  /**
   * Get configuration statistics
   */
  getStatistics(): {
    total: number;
    active: number;
    inactive: number;
    testing: number;
    error: number;
    byType: Record<string, number>;
    lastUpdated: Date;
  } {
    const configs = Array.from(this.configurations.values());
    
    const byType: Record<string, number> = {};
    configs.forEach(config => {
      byType[config.type] = (byType[config.type] || 0) + 1;
    });

    return {
      total: configs.length,
      active: configs.filter(c => c.status === 'active').length,
      inactive: configs.filter(c => c.status === 'inactive').length,
      testing: configs.filter(c => c.status === 'testing').length,
      error: configs.filter(c => c.status === 'error').length,
      byType,
      lastUpdated: new Date()
    };
  }

  /**
   * Initialize default source types
   */
  private initializeDefaultSourceTypes(): void {
    const defaultTypes: SourceType[] = [
      {
        id: 'github',
        name: 'GitHub',
        description: 'GitHub repository source',
        category: 'workflow',
        requiredFields: ['endpoint', 'credentials'],
        optionalFields: ['timeout', 'retryAttempts'],
        validationRules: [
          { field: 'endpoint', type: 'required', dataType: 'url' },
          { field: 'credentials', type: 'required', dataType: 'object' }
        ],
        defaultConfig: {
          timeout: 10000,
          retryAttempts: 3,
          retryDelay: 1000,
          circuitBreakerThreshold: 5,
          circuitBreakerTimeout: 60000,
          loadBalancingWeight: 50,
          isEnabled: true
        },
        supportedOperations: ['fetch', 'update', 'delete'],
        icon: 'github',
        documentation: 'https://docs.github.com/en/rest'
      },
      {
        id: 'n8n',
        name: 'n8n',
        description: 'n8n workflow automation platform',
        category: 'workflow',
        requiredFields: ['endpoint', 'credentials'],
        optionalFields: ['timeout', 'retryAttempts'],
        validationRules: [
          { field: 'endpoint', type: 'required', dataType: 'url' },
          { field: 'credentials', type: 'required', dataType: 'object' }
        ],
        defaultConfig: {
          timeout: 15000,
          retryAttempts: 3,
          retryDelay: 2000,
          circuitBreakerThreshold: 3,
          circuitBreakerTimeout: 120000,
          loadBalancingWeight: 70,
          isEnabled: true
        },
        supportedOperations: ['fetch', 'execute', 'update'],
        icon: 'n8n',
        documentation: 'https://docs.n8n.io/api/'
      },
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI API for AI agents',
        category: 'ai_agent',
        requiredFields: ['endpoint', 'credentials'],
        optionalFields: ['timeout', 'retryAttempts'],
        validationRules: [
          { field: 'endpoint', type: 'required', dataType: 'url' },
          { field: 'credentials', type: 'required', dataType: 'object' }
        ],
        defaultConfig: {
          timeout: 30000,
          retryAttempts: 2,
          retryDelay: 1000,
          circuitBreakerThreshold: 3,
          circuitBreakerTimeout: 60000,
          loadBalancingWeight: 80,
          isEnabled: true
        },
        supportedOperations: ['chat', 'completion', 'embedding'],
        icon: 'openai',
        documentation: 'https://platform.openai.com/docs/api-reference'
      }
    ];

    defaultTypes.forEach(type => {
      this.sourceTypes.set(type.id, type);
    });
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: ConfigurationTemplate[] = [
      {
        id: 'github-basic',
        name: 'GitHub Basic',
        description: 'Basic GitHub repository configuration',
        sourceType: 'github',
        template: {
          name: '{{name}}',
          type: 'primary',
          priority: 1,
          endpoint: 'https://api.github.com',
          timeout: 10000,
          retryAttempts: 3,
          retryDelay: 1000,
          circuitBreakerThreshold: 5,
          circuitBreakerTimeout: 60000,
          loadBalancingWeight: 50,
          isEnabled: true
        },
        variables: [
          { name: 'name', type: 'string', required: true, description: 'Source name' },
          { name: 'repository', type: 'string', required: true, description: 'Repository name' },
          { name: 'token', type: 'string', required: true, description: 'GitHub token' }
        ],
        category: 'workflow',
        tags: ['github', 'repository', 'basic'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date()
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Helper methods
   */
  private generateConfigurationId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }

  private validateField(value: any, rule: ValidationRule): boolean | string {
    // Type validation
    if (rule.dataType === 'string' && typeof value !== 'string') {
      return `Field '${rule.field}' must be a string`;
    }
    if (rule.dataType === 'number' && typeof value !== 'number') {
      return `Field '${rule.field}' must be a number`;
    }
    if (rule.dataType === 'boolean' && typeof value !== 'boolean') {
      return `Field '${rule.field}' must be a boolean`;
    }

    // Length validation
    if (rule.dataType === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `Field '${rule.field}' must be at least ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Field '${rule.field}' must be at most ${rule.maxLength} characters`;
      }
    }

    // Range validation
    if (rule.dataType === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `Field '${rule.field}' must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Field '${rule.field}' must be at most ${rule.max}`;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return `Field '${rule.field}' does not match required pattern`;
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return `Field '${rule.field}' must be one of: ${rule.enum.join(', ')}`;
    }

    // Custom validation
    if (rule.customValidator) {
      const result = rule.customValidator(value);
      if (result !== true) {
        return result as string;
      }
    }

    return true;
  }

  private async registerWithFallbackEngine(config: SourceConfiguration): Promise<void> {
    // This would integrate with the fallback engine
    // For now, we'll just log the registration
    console.log(`Registering source ${config.id} with fallback engine`);
  }

  private async unregisterFromFallbackEngine(id: string): Promise<void> {
    // This would integrate with the fallback engine
    // For now, we'll just log the unregistration
    console.log(`Unregistering source ${id} from fallback engine`);
  }

  private logAuditEvent(
    action: ConfigurationAuditLog['action'],
    configurationId: string,
    userId: string,
    changes?: ConfigurationAuditLog['changes'],
    metadata?: Record<string, any>
  ): void {
    const logEntry: ConfigurationAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action,
      configurationId,
      userId,
      changes,
      metadata
    };

    this.auditLog.push(logEntry);

    // Keep only last 1000 audit entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  private applyTemplate(template: ConfigurationTemplate, variables: Record<string, any>): SourceConfig {
    const config = { ...template.template };
    
    // Apply variable substitutions
    Object.keys(variables).forEach(key => {
      const value = variables[key];
      // Simple string replacement - in a real implementation, you'd use a proper templating engine
      Object.keys(config).forEach(configKey => {
        if (typeof config[configKey as keyof SourceConfig] === 'string') {
          const stringValue = config[configKey as keyof SourceConfig] as string;
          config[configKey as keyof SourceConfig] = stringValue.replace(
            new RegExp(`{{${key}}}`, 'g'),
            value
          ) as any;
        }
      });
    });

    return config as SourceConfig;
  }

  private async testConnectivity(config: SourceConfig): Promise<any> {
    // Simple connectivity test
    const response = await fetch(config.endpoint, {
      method: 'HEAD',
      timeout: config.timeout
    });
    return { status: response.status, ok: response.ok };
  }

  private async testAuthentication(config: SourceConfig): Promise<any> {
    // Authentication test would depend on the source type
    // This is a placeholder implementation
    return { authenticated: true };
  }

  private async testDataAccess(config: SourceConfig): Promise<any> {
    // Data access test would depend on the source type
    // This is a placeholder implementation
    return { accessible: true };
  }

  private async testFullOperation(config: SourceConfig): Promise<any> {
    // Full operation test would depend on the source type
    // This is a placeholder implementation
    return { operational: true };
  }
}

// Export singleton instance
export const sourceConfigManager = new SourceConfigManager();
