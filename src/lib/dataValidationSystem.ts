/**
 * Source Data Validation System
 * 
 * This module provides comprehensive data validation, quality scoring,
 * and consistency checks for all source data to ensure high data quality.
 */

import { UnifiedMetadata, WorkflowMetadata, AIAgentMetadata, ToolMetadata } from './metadataSchema';
import { performanceMetrics } from './performanceMetrics';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  field: string;
  type: 'required' | 'format' | 'range' | 'enum' | 'custom' | 'consistency' | 'freshness';
  severity: 'error' | 'warning' | 'info';
  sourceTypes: string[];
  validator: (value: any, context?: ValidationContext) => ValidationResult;
  weight: number; // 1-10, higher = more important
}

export interface ValidationContext {
  sourceId: string;
  sourceType: string;
  metadata: UnifiedMetadata;
  timestamp: Date;
  previousData?: any;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  message?: string;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface DataQualityScore {
  overall: number; // 0-100
  completeness: number; // 0-100
  accuracy: number; // 0-100
  consistency: number; // 0-100
  freshness: number; // 0-100
  validity: number; // 0-100
  breakdown: {
    field: string;
    score: number;
    issues: string[];
    suggestions: string[];
  }[];
  timestamp: Date;
  sourceId: string;
}

export interface ValidationReport {
  sourceId: string;
  timestamp: Date;
  totalItems: number;
  validItems: number;
  invalidItems: number;
  qualityScore: DataQualityScore;
  issues: ValidationIssue[];
  recommendations: string[];
  trends: {
    qualityTrend: 'improving' | 'stable' | 'degrading';
    issueTrend: 'increasing' | 'stable' | 'decreasing';
  };
}

export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  field: string;
  message: string;
  suggestion?: string;
  count: number;
  affectedItems: string[];
  timestamp: Date;
}

export interface ConsistencyCheck {
  id: string;
  name: string;
  description: string;
  checkFunction: (data: UnifiedMetadata[], context: ValidationContext) => ConsistencyResult;
  weight: number;
}

export interface ConsistencyResult {
  isConsistent: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  metadata?: Record<string, any>;
}

export interface FreshnessCheck {
  id: string;
  name: string;
  description: string;
  maxAge: number; // milliseconds
  checkFunction: (data: UnifiedMetadata, context: ValidationContext) => FreshnessResult;
  weight: number;
}

export interface FreshnessResult {
  isFresh: boolean;
  age: number; // milliseconds
  score: number; // 0-100
  message?: string;
  suggestions?: string[];
}

/**
 * Data Validation Engine
 */
export class DataValidationEngine {
  private validationRules: Map<string, ValidationRule> = new Map();
  private consistencyChecks: Map<string, ConsistencyCheck> = new Map();
  private freshnessChecks: Map<string, FreshnessCheck> = new Map();
  private validationHistory: Map<string, ValidationReport[]> = new Map();
  private qualityThresholds = {
    excellent: 90,
    good: 75,
    fair: 60,
    poor: 40
  };

  constructor() {
    this.initializeDefaultRules();
    this.initializeConsistencyChecks();
    this.initializeFreshnessChecks();
  }

  /**
   * Validate a single metadata item
   */
  async validateItem(item: UnifiedMetadata, sourceId: string): Promise<DataQualityScore> {
    const context: ValidationContext = {
      sourceId,
      sourceType: item.type,
      metadata: item,
      timestamp: new Date()
    };

    const applicableRules = this.getApplicableRules(item.type);
    const breakdown: DataQualityScore['breakdown'] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Validate each field
    for (const rule of applicableRules) {
      const value = this.getFieldValue(item, rule.field);
      const result = rule.validator(value, context);
      
      breakdown.push({
        field: rule.field,
        score: result.score,
        issues: result.message ? [result.message] : [],
        suggestions: result.suggestions || []
      });

      totalScore += result.score * rule.weight;
      totalWeight += rule.weight;
    }

    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Calculate component scores
    const completeness = this.calculateCompleteness(item, applicableRules);
    const accuracy = this.calculateAccuracy(item, applicableRules, context);
    const consistency = await this.calculateConsistency([item], context);
    const freshness = this.calculateFreshness(item, context);
    const validity = this.calculateValidity(item, applicableRules, context);

    return {
      overall: Math.round(overallScore),
      completeness: Math.round(completeness),
      accuracy: Math.round(accuracy),
      consistency: Math.round(consistency),
      freshness: Math.round(freshness),
      validity: Math.round(validity),
      breakdown,
      timestamp: new Date(),
      sourceId
    };
  }

  /**
   * Validate multiple items from a source
   */
  async validateSource(items: UnifiedMetadata[], sourceId: string): Promise<ValidationReport> {
    const startTime = Date.now();
    const qualityScores: DataQualityScore[] = [];
    const issues: ValidationIssue[] = [];
    const issueCounts = new Map<string, number>();
    const issueItems = new Map<string, Set<string>>();

    // Validate each item
    for (const item of items) {
      const qualityScore = await this.validateItem(item, sourceId);
      qualityScores.push(qualityScore);

      // Collect issues
      for (const breakdown of qualityScore.breakdown) {
        for (const issue of breakdown.issues) {
          const issueKey = `${breakdown.field}:${issue}`;
          issueCounts.set(issueKey, (issueCounts.get(issueKey) || 0) + 1);
          
          if (!issueItems.has(issueKey)) {
            issueItems.set(issueKey, new Set());
          }
          issueItems.get(issueKey)!.add(item.id);
        }
      }
    }

    // Create validation issues
    for (const [issueKey, count] of issueCounts) {
      const [field, message] = issueKey.split(':');
      const affectedItems = Array.from(issueItems.get(issueKey) || []);
      
      issues.push({
        id: this.generateIssueId(),
        type: 'error', // Would be determined by rule severity
        severity: this.determineSeverity(count, items.length),
        field,
        message,
        count,
        affectedItems,
        timestamp: new Date()
      });
    }

    // Calculate overall quality score
    const overallQuality = this.calculateOverallQuality(qualityScores);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, qualityScores);
    
    // Calculate trends
    const trends = this.calculateTrends(sourceId, overallQuality);

    const report: ValidationReport = {
      sourceId,
      timestamp: new Date(),
      totalItems: items.length,
      validItems: qualityScores.filter(s => s.overall >= this.qualityThresholds.good).length,
      invalidItems: qualityScores.filter(s => s.overall < this.qualityThresholds.good).length,
      qualityScore: overallQuality,
      issues,
      recommendations,
      trends
    };

    // Store validation history
    this.storeValidationHistory(sourceId, report);

    // Record performance metrics
    const responseTime = Date.now() - startTime;
    performanceMetrics.recordSuccess(
      sourceId,
      'data_validation',
      responseTime,
      items.length,
      false,
      { 
        totalItems: items.length,
        validItems: report.validItems,
        qualityScore: overallQuality.overall
      }
    );

    return report;
  }

  /**
   * Get validation history for a source
   */
  getValidationHistory(sourceId: string, limit?: number): ValidationReport[] {
    const history = this.validationHistory.get(sourceId) || [];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get data quality trends
   */
  getQualityTrends(sourceId: string, days: number = 7): {
    dates: string[];
    qualityScores: number[];
    issueCounts: number[];
    trends: {
      quality: 'improving' | 'stable' | 'degrading';
      issues: 'increasing' | 'stable' | 'decreasing';
    };
  } {
    const history = this.getValidationHistory(sourceId);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentHistory = history.filter(h => h.timestamp >= cutoffDate);

    const dates = recentHistory.map(h => h.timestamp.toISOString().split('T')[0]);
    const qualityScores = recentHistory.map(h => h.qualityScore.overall);
    const issueCounts = recentHistory.map(h => h.issues.length);

    return {
      dates,
      qualityScores,
      issueCounts,
      trends: this.calculateTrends(sourceId, recentHistory[recentHistory.length - 1]?.qualityScore)
    };
  }

  /**
   * Add custom validation rule
   */
  addValidationRule(rule: ValidationRule): void {
    this.validationRules.set(rule.id, rule);
  }

  /**
   * Remove validation rule
   */
  removeValidationRule(ruleId: string): void {
    this.validationRules.delete(ruleId);
  }

  /**
   * Update quality thresholds
   */
  updateQualityThresholds(thresholds: Partial<typeof this.qualityThresholds>): void {
    this.qualityThresholds = { ...this.qualityThresholds, ...thresholds };
  }

  /**
   * Get current quality thresholds
   */
  getQualityThresholds(): typeof this.qualityThresholds {
    return { ...this.qualityThresholds };
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: ValidationRule[] = [
      // Common rules
      {
        id: 'required_id',
        name: 'Required ID',
        description: 'ID field is required and must be non-empty',
        field: 'id',
        type: 'required',
        severity: 'error',
        sourceTypes: ['workflow', 'ai_agent', 'tool'],
        weight: 10,
        validator: (value) => ({
          isValid: !!value && typeof value === 'string' && value.trim().length > 0,
          score: !!value && typeof value === 'string' && value.trim().length > 0 ? 100 : 0,
          message: !value ? 'ID is required' : undefined
        })
      },
      {
        id: 'required_name',
        name: 'Required Name',
        description: 'Name field is required and must be non-empty',
        field: 'name',
        type: 'required',
        severity: 'error',
        sourceTypes: ['workflow', 'ai_agent', 'tool'],
        weight: 9,
        validator: (value) => ({
          isValid: !!value && typeof value === 'string' && value.trim().length > 0,
          score: !!value && typeof value === 'string' && value.trim().length > 0 ? 100 : 0,
          message: !value ? 'Name is required' : undefined
        })
      },
      {
        id: 'required_description',
        name: 'Required Description',
        description: 'Description field is required and should be meaningful',
        field: 'description',
        type: 'required',
        severity: 'error',
        sourceTypes: ['workflow', 'ai_agent', 'tool'],
        weight: 8,
        validator: (value) => {
          if (!value || typeof value !== 'string') {
            return { isValid: false, score: 0, message: 'Description is required' };
          }
          const trimmed = value.trim();
          if (trimmed.length < 10) {
            return { 
              isValid: false, 
              score: 50, 
              message: 'Description is too short',
              suggestions: ['Provide a more detailed description']
            };
          }
          return { isValid: true, score: 100 };
        }
      },
      {
        id: 'valid_category',
        name: 'Valid Category',
        description: 'Category must be from predefined list',
        field: 'category',
        type: 'enum',
        severity: 'warning',
        sourceTypes: ['workflow', 'ai_agent', 'tool'],
        weight: 6,
        validator: (value) => {
          const validCategories = ['automation', 'ai', 'integration', 'productivity', 'development', 'marketing', 'sales', 'support'];
          const isValid = validCategories.includes(value);
          return {
            isValid,
            score: isValid ? 100 : 50,
            message: !isValid ? `Invalid category: ${value}` : undefined,
            suggestions: !isValid ? [`Use one of: ${validCategories.join(', ')}`] : undefined
          };
        }
      },
      {
        id: 'valid_tags',
        name: 'Valid Tags',
        description: 'Tags should be meaningful and not empty',
        field: 'tags',
        type: 'custom',
        severity: 'warning',
        sourceTypes: ['workflow', 'ai_agent', 'tool'],
        weight: 4,
        validator: (value) => {
          if (!Array.isArray(value)) {
            return { isValid: false, score: 0, message: 'Tags must be an array' };
          }
          if (value.length === 0) {
            return { 
              isValid: false, 
              score: 30, 
              message: 'No tags provided',
              suggestions: ['Add relevant tags to improve discoverability']
            };
          }
          const emptyTags = value.filter(tag => !tag || typeof tag !== 'string' || tag.trim().length === 0);
          if (emptyTags.length > 0) {
            return { 
              isValid: false, 
              score: 70, 
              message: 'Some tags are empty',
              suggestions: ['Remove empty tags']
            };
          }
          return { isValid: true, score: 100 };
        }
      },
      {
        id: 'workflow_specific',
        name: 'Workflow Specific Validation',
        description: 'Workflow-specific field validation',
        field: 'nodeCount',
        type: 'range',
        severity: 'warning',
        sourceTypes: ['workflow'],
        weight: 5,
        validator: (value, context) => {
          if (context?.metadata.type !== 'workflow') return { isValid: true, score: 100 };
          const workflow = context.metadata as WorkflowMetadata;
          if (typeof workflow.nodeCount !== 'number' || workflow.nodeCount < 1) {
            return { 
              isValid: false, 
              score: 0, 
              message: 'Node count must be a positive number' 
            };
          }
          if (workflow.nodeCount > 100) {
            return { 
              isValid: false, 
              score: 70, 
              message: 'Workflow has many nodes',
              suggestions: ['Consider breaking into smaller workflows']
            };
          }
          return { isValid: true, score: 100 };
        }
      },
      {
        id: 'ai_agent_specific',
        name: 'AI Agent Specific Validation',
        description: 'AI agent-specific field validation',
        field: 'model',
        type: 'required',
        severity: 'error',
        sourceTypes: ['ai_agent'],
        weight: 8,
        validator: (value, context) => {
          if (context?.metadata.type !== 'ai_agent') return { isValid: true, score: 100 };
          const agent = context.metadata as AIAgentMetadata;
          if (!agent.model || typeof agent.model !== 'string') {
            return { 
              isValid: false, 
              score: 0, 
              message: 'AI model is required' 
            };
          }
          return { isValid: true, score: 100 };
        }
      },
      {
        id: 'tool_specific',
        name: 'Tool Specific Validation',
        description: 'Tool-specific field validation',
        field: 'toolType',
        type: 'required',
        severity: 'error',
        sourceTypes: ['tool'],
        weight: 8,
        validator: (value, context) => {
          if (context?.metadata.type !== 'tool') return { isValid: true, score: 100 };
          const tool = context.metadata as ToolMetadata;
          if (!tool.toolType || typeof tool.toolType !== 'string') {
            return { 
              isValid: false, 
              score: 0, 
              message: 'Tool type is required' 
            };
          }
          return { isValid: true, score: 100 };
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.validationRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize consistency checks
   */
  private initializeConsistencyChecks(): void {
    const defaultChecks: ConsistencyCheck[] = [
      {
        id: 'naming_consistency',
        name: 'Naming Consistency',
        description: 'Check for consistent naming patterns',
        weight: 5,
        checkFunction: (data, context) => {
          const names = data.map(item => item.name.toLowerCase());
          const uniqueNames = new Set(names);
          const duplicates = names.length - uniqueNames.size;
          
          return {
            isConsistent: duplicates === 0,
            score: Math.max(0, 100 - (duplicates * 10)),
            issues: duplicates > 0 ? [`${duplicates} duplicate names found`] : [],
            suggestions: duplicates > 0 ? ['Use unique names for better identification'] : []
          };
        }
      },
      {
        id: 'tag_consistency',
        name: 'Tag Consistency',
        description: 'Check for consistent tag usage',
        weight: 3,
        checkFunction: (data, context) => {
          const allTags = data.flatMap(item => item.tags);
          const tagCounts = new Map<string, number>();
          allTags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
          
          const lowUsageTags = Array.from(tagCounts.entries())
            .filter(([_, count]) => count === 1)
            .map(([tag, _]) => tag);
          
          return {
            isConsistent: lowUsageTags.length < allTags.length * 0.5,
            score: Math.max(0, 100 - (lowUsageTags.length * 5)),
            issues: lowUsageTags.length > 0 ? [`${lowUsageTags.length} tags used only once`] : [],
            suggestions: lowUsageTags.length > 0 ? ['Consider standardizing tag usage'] : []
          };
        }
      }
    ];

    defaultChecks.forEach(check => {
      this.consistencyChecks.set(check.id, check);
    });
  }

  /**
   * Initialize freshness checks
   */
  private initializeFreshnessChecks(): void {
    const defaultChecks: FreshnessCheck[] = [
      {
        id: 'data_freshness',
        name: 'Data Freshness',
        description: 'Check if data is recent enough',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        weight: 6,
        checkFunction: (data, context) => {
          const now = new Date();
          const updatedAt = new Date(data.updatedAt);
          const age = now.getTime() - updatedAt.getTime();
          const isFresh = age <= this.freshnessChecks.get('data_freshness')!.maxAge;
          const score = Math.max(0, 100 - (age / (7 * 24 * 60 * 60 * 1000)) * 100);
          
          return {
            isFresh,
            age,
            score: Math.round(score),
            message: !isFresh ? `Data is ${Math.round(age / (24 * 60 * 60 * 1000))} days old` : undefined,
            suggestions: !isFresh ? ['Consider updating the data'] : undefined
          };
        }
      }
    ];

    defaultChecks.forEach(check => {
      this.freshnessChecks.set(check.id, check);
    });
  }

  /**
   * Helper methods
   */
  private getApplicableRules(sourceType: string): ValidationRule[] {
    return Array.from(this.validationRules.values())
      .filter(rule => rule.sourceTypes.includes(sourceType))
      .sort((a, b) => b.weight - a.weight);
  }

  private getFieldValue(item: UnifiedMetadata, field: string): any {
    return (item as any)[field];
  }

  private calculateCompleteness(item: UnifiedMetadata, rules: ValidationRule[]): number {
    const requiredRules = rules.filter(rule => rule.type === 'required');
    const completedFields = requiredRules.filter(rule => {
      const value = this.getFieldValue(item, rule.field);
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    return requiredRules.length > 0 ? (completedFields / requiredRules.length) * 100 : 100;
  }

  private calculateAccuracy(item: UnifiedMetadata, rules: ValidationRule[], context: ValidationContext): number {
    const accuracyRules = rules.filter(rule => rule.type === 'format' || rule.type === 'enum' || rule.type === 'range');
    let totalScore = 0;
    
    for (const rule of accuracyRules) {
      const value = this.getFieldValue(item, rule.field);
      const result = rule.validator(value, context);
      totalScore += result.score;
    }
    
    return accuracyRules.length > 0 ? totalScore / accuracyRules.length : 100;
  }

  private async calculateConsistency(items: UnifiedMetadata[], context: ValidationContext): Promise<number> {
    if (items.length < 2) return 100;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const check of this.consistencyChecks.values()) {
      const result = check.checkFunction(items, context);
      totalScore += result.score * check.weight;
      totalWeight += check.weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 100;
  }

  private calculateFreshness(item: UnifiedMetadata, context: ValidationContext): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const check of this.freshnessChecks.values()) {
      const result = check.checkFunction(item, context);
      totalScore += result.score * check.weight;
      totalWeight += check.weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 100;
  }

  private calculateValidity(item: UnifiedMetadata, rules: ValidationRule[], context: ValidationContext): number {
    const customRules = rules.filter(rule => rule.type === 'custom');
    let totalScore = 0;
    
    for (const rule of customRules) {
      const value = this.getFieldValue(item, rule.field);
      const result = rule.validator(value, context);
      totalScore += result.score;
    }
    
    return customRules.length > 0 ? totalScore / customRules.length : 100;
  }

  private calculateOverallQuality(scores: DataQualityScore[]): DataQualityScore {
    if (scores.length === 0) {
      return {
        overall: 0,
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        freshness: 0,
        validity: 0,
        breakdown: [],
        timestamp: new Date(),
        sourceId: 'unknown'
      };
    }

    const avgOverall = scores.reduce((sum, s) => sum + s.overall, 0) / scores.length;
    const avgCompleteness = scores.reduce((sum, s) => sum + s.completeness, 0) / scores.length;
    const avgAccuracy = scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length;
    const avgConsistency = scores.reduce((sum, s) => sum + s.consistency, 0) / scores.length;
    const avgFreshness = scores.reduce((sum, s) => sum + s.freshness, 0) / scores.length;
    const avgValidity = scores.reduce((sum, s) => sum + s.validity, 0) / scores.length;

    return {
      overall: Math.round(avgOverall),
      completeness: Math.round(avgCompleteness),
      accuracy: Math.round(avgAccuracy),
      consistency: Math.round(avgConsistency),
      freshness: Math.round(avgFreshness),
      validity: Math.round(avgValidity),
      breakdown: [], // Would aggregate breakdowns
      timestamp: new Date(),
      sourceId: scores[0].sourceId
    };
  }

  private generateRecommendations(issues: ValidationIssue[], scores: DataQualityScore[]): string[] {
    const recommendations: string[] = [];
    
    // Quality-based recommendations
    const avgQuality = scores.reduce((sum, s) => sum + s.overall, 0) / scores.length;
    if (avgQuality < this.qualityThresholds.poor) {
      recommendations.push('Data quality is very low. Consider reviewing and updating all data sources.');
    } else if (avgQuality < this.qualityThresholds.fair) {
      recommendations.push('Data quality needs improvement. Focus on the most critical issues first.');
    }

    // Issue-based recommendations
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical issues immediately.`);
    }

    const highIssues = issues.filter(i => i.severity === 'high');
    if (highIssues.length > 0) {
      recommendations.push(`Review ${highIssues.length} high-priority issues.`);
    }

    return recommendations;
  }

  private calculateTrends(sourceId: string, currentQuality?: DataQualityScore): ValidationReport['trends'] {
    const history = this.getValidationHistory(sourceId, 5);
    if (history.length < 2) {
      return { qualityTrend: 'stable', issueTrend: 'stable' };
    }

    const recentScores = history.slice(-3).map(h => h.qualityScore.overall);
    const recentIssues = history.slice(-3).map(h => h.issues.length);

    const qualityTrend = this.calculateTrend(recentScores);
    const issueTrend = this.calculateTrend(recentIssues.map(count => -count)); // Invert for issue count

    return { qualityTrend, issueTrend };
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const diff = last - first;
    
    if (Math.abs(diff) < 5) return 'stable';
    return diff > 0 ? 'improving' : 'degrading';
  }

  private determineSeverity(count: number, total: number): ValidationIssue['severity'] {
    const percentage = (count / total) * 100;
    if (percentage >= 50) return 'critical';
    if (percentage >= 25) return 'high';
    if (percentage >= 10) return 'medium';
    return 'low';
  }

  private generateIssueId(): string {
    return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeValidationHistory(sourceId: string, report: ValidationReport): void {
    if (!this.validationHistory.has(sourceId)) {
      this.validationHistory.set(sourceId, []);
    }
    
    const history = this.validationHistory.get(sourceId)!;
    history.push(report);
    
    // Keep only last 50 reports
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }
}

// Export singleton instance
export const dataValidationEngine = new DataValidationEngine();
