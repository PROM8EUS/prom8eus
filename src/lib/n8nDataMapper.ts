/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use the new unified schema files instead:
 * - For WorkflowIndex: use @/lib/schemas/workflowIndex
 * - For N8nWorkflow: use @/lib/schemas/n8nWorkflow
 * - For WorkflowIndexer: use @/lib/workflowIndexerUnified
 * - For N8nApi: use @/lib/n8nApiUnified
 */

/**
 * N8N Data Mapper
 * 
 * Handles data conversion and mapping between different formats
 */

import { N8nWorkflow } from './schemas/n8nWorkflow';
import { WorkflowIndex } from './schemas/workflowIndex';
import { UnifiedWorkflow } from './schemas/unifiedWorkflow';

export class N8nDataMapper {
  /**
   * Map N8nWorkflow to WorkflowIndex
   */
  static mapToWorkflowIndex(n8nWorkflow: N8nWorkflow): WorkflowIndex {
    return {
      id: n8nWorkflow.id,
      source: 'n8n.io',
      title: n8nWorkflow.name,
      summary: n8nWorkflow.description,
      link: n8nWorkflow.url,
      category: n8nWorkflow.category,
      integrations: n8nWorkflow.integrations,
      complexity: this.mapDifficultyToComplexity(n8nWorkflow.difficulty),
      filename: `${n8nWorkflow.name}.json`,
      active: n8nWorkflow.active,
      triggerType: this.mapTriggerType(n8nWorkflow.triggerType),
      nodeCount: n8nWorkflow.nodes,
      tags: this.generateTags(n8nWorkflow),
      fileHash: this.generateFileHash(n8nWorkflow),
      analyzedAt: new Date().toISOString(),
      license: 'Unknown',
      authorName: n8nWorkflow.author,
      authorUsername: n8nWorkflow.author,
      authorVerified: false,
      domains: this.extractDomains(n8nWorkflow),
      domain_confidences: this.generateDomainConfidences(n8nWorkflow),
      domain_origin: 'llm'
    };
  }

  /**
   * Map N8nWorkflow to UnifiedWorkflow
   */
  static mapToUnifiedWorkflow(n8nWorkflow: N8nWorkflow): UnifiedWorkflow {
    return {
      id: n8nWorkflow.id,
      title: n8nWorkflow.name,
      description: n8nWorkflow.description,
      summary: n8nWorkflow.description,
      source: 'n8n.io',
      sourceUrl: n8nWorkflow.url,
      category: n8nWorkflow.category,
      tags: this.generateTags(n8nWorkflow),
      license: 'Unknown',
      complexity: this.mapDifficultyToComplexity(n8nWorkflow.difficulty),
      triggerType: this.mapTriggerType(n8nWorkflow.triggerType),
      integrations: n8nWorkflow.integrations,
      nodeCount: n8nWorkflow.nodes,
      connectionCount: n8nWorkflow.connections,
      jsonUrl: n8nWorkflow.jsonUrl,
      author: n8nWorkflow.author ? {
        name: n8nWorkflow.author,
        username: n8nWorkflow.author,
        avatar: undefined,
        verified: false
      } : undefined,
      createdAt: n8nWorkflow.createdAt,
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      status: 'active',
      isAIGenerated: false,
      setupCost: this.parseCost(n8nWorkflow.estimatedCost),
      estimatedTime: n8nWorkflow.estimatedTime,
      estimatedCost: n8nWorkflow.estimatedCost,
      timeSavings: this.estimateTimeSavings(n8nWorkflow),
      downloads: n8nWorkflow.downloads,
      rating: n8nWorkflow.rating,
      popularity: this.calculatePopularity(n8nWorkflow),
      verified: false,
      domainClassification: this.generateDomainClassification(n8nWorkflow),
      score: this.generateWorkflowScore(n8nWorkflow),
      match: this.generateWorkflowMatch(n8nWorkflow),
      downloadUrl: n8nWorkflow.jsonUrl,
      previewUrl: n8nWorkflow.url,
      thumbnailUrl: undefined,
      active: n8nWorkflow.active,
      fileHash: this.generateFileHash(n8nWorkflow),
      analyzedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      cacheKey: `n8n_${n8nWorkflow.id}`
    };
  }

  /**
   * Map multiple N8nWorkflows to WorkflowIndexes
   */
  static mapToWorkflowIndexes(n8nWorkflows: N8nWorkflow[]): WorkflowIndex[] {
    return n8nWorkflows.map(workflow => this.mapToWorkflowIndex(workflow));
  }

  /**
   * Map multiple N8nWorkflows to UnifiedWorkflows
   */
  static mapToUnifiedWorkflows(n8nWorkflows: N8nWorkflow[]): UnifiedWorkflow[] {
    return n8nWorkflows.map(workflow => this.mapToUnifiedWorkflow(workflow));
  }

  /**
   * Map difficulty to complexity
   */
  private static mapDifficultyToComplexity(difficulty: 'Easy' | 'Medium' | 'Hard'): 'Low' | 'Medium' | 'High' {
    switch (difficulty) {
      case 'Easy': return 'Low';
      case 'Medium': return 'Medium';
      case 'Hard': return 'High';
      default: return 'Medium';
    }
  }

  /**
   * Map trigger type
   */
  private static mapTriggerType(triggerType: string): 'Complex' | 'Webhook' | 'Manual' | 'Scheduled' {
    const lower = triggerType.toLowerCase();
    if (lower.includes('webhook')) return 'Webhook';
    if (lower.includes('schedule') || lower.includes('cron')) return 'Scheduled';
    if (lower.includes('manual')) return 'Manual';
    return 'Complex';
  }

  /**
   * Generate tags from workflow data
   */
  private static generateTags(n8nWorkflow: N8nWorkflow): string[] {
    const tags: string[] = [];
    
    // Add category as tag
    tags.push(n8nWorkflow.category.toLowerCase());
    
    // Add difficulty as tag
    tags.push(n8nWorkflow.difficulty.toLowerCase());
    
    // Add trigger type as tag
    tags.push(n8nWorkflow.triggerType.toLowerCase());
    
    // Add integrations as tags
    tags.push(...n8nWorkflow.integrations.map(integration => integration.toLowerCase()));
    
    // Remove duplicates and return
    return [...new Set(tags)];
  }

  /**
   * Generate file hash
   */
  private static generateFileHash(n8nWorkflow: N8nWorkflow): string {
    const content = `${n8nWorkflow.id}-${n8nWorkflow.name}-${n8nWorkflow.category}`;
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Extract domains from workflow
   */
  private static extractDomains(n8nWorkflow: N8nWorkflow): string[] {
    const domains: string[] = [];
    
    // Map categories to domains
    const categoryDomainMap: Record<string, string[]> = {
      'marketing': ['Marketing', 'Sales'],
      'sales': ['Sales', 'CRM'],
      'crm': ['CRM', 'Sales'],
      'hr': ['HR', 'People'],
      'finance': ['Finance', 'Accounting'],
      'it': ['IT', 'DevOps'],
      'devops': ['DevOps', 'IT'],
      'data': ['Data', 'Analytics'],
      'analytics': ['Analytics', 'Data'],
      'automation': ['Automation', 'Workflow'],
      'workflow': ['Workflow', 'Automation']
    };
    
    const category = n8nWorkflow.category.toLowerCase();
    if (categoryDomainMap[category]) {
      domains.push(...categoryDomainMap[category]);
    } else {
      domains.push('General');
    }
    
    return [...new Set(domains)];
  }

  /**
   * Generate domain confidences
   */
  private static generateDomainConfidences(n8nWorkflow: N8nWorkflow): number[] {
    const domains = this.extractDomains(n8nWorkflow);
    return domains.map(() => 0.8); // Default confidence of 0.8
  }

  /**
   * Parse cost string to number
   */
  private static parseCost(costString: string): number {
    const match = costString.match(/€?(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Estimate time savings
   */
  private static estimateTimeSavings(n8nWorkflow: N8nWorkflow): number {
    // Estimate based on node count and complexity
    const baseHours = n8nWorkflow.nodes * 0.5;
    const complexityMultiplier = n8nWorkflow.difficulty === 'Easy' ? 0.5 : 
                                 n8nWorkflow.difficulty === 'Medium' ? 1 : 2;
    return Math.round(baseHours * complexityMultiplier);
  }

  /**
   * Calculate popularity score
   */
  private static calculatePopularity(n8nWorkflow: N8nWorkflow): number {
    // Simple popularity calculation based on downloads and rating
    const downloadScore = Math.min(n8nWorkflow.downloads / 100, 10);
    const ratingScore = n8nWorkflow.rating * 2;
    return Math.round((downloadScore + ratingScore) / 2);
  }

  /**
   * Generate domain classification
   */
  private static generateDomainClassification(n8nWorkflow: N8nWorkflow): any {
    return {
      primary: this.extractDomains(n8nWorkflow)[0] || 'General',
      secondary: this.extractDomains(n8nWorkflow).slice(1),
      confidence: 0.8
    };
  }

  /**
   * Generate workflow score
   */
  private static generateWorkflowScore(n8nWorkflow: N8nWorkflow): any {
    return {
      overall: n8nWorkflow.rating,
      complexity: this.mapDifficultyToComplexity(n8nWorkflow.difficulty) === 'Low' ? 0.8 : 
                 this.mapDifficultyToComplexity(n8nWorkflow.difficulty) === 'Medium' ? 0.6 : 0.4,
      popularity: this.calculatePopularity(n8nWorkflow) / 10,
      reliability: 0.7
    };
  }

  /**
   * Generate workflow match
   */
  private static generateWorkflowMatch(n8nWorkflow: N8nWorkflow): any {
    return {
      relevance: 0.8,
      compatibility: 0.9,
      effort: this.mapDifficultyToComplexity(n8nWorkflow.difficulty) === 'Low' ? 0.2 : 
              this.mapDifficultyToComplexity(n8nWorkflow.difficulty) === 'Medium' ? 0.5 : 0.8,
      cost: this.parseCost(n8nWorkflow.estimatedCost) / 100
    };
  }
}
