/**
 * Source Deduplication System
 * 
 * This module provides intelligent deduplication of workflows and AI agents
 * across different sources to prevent duplicate content and improve data quality.
 */

import { UnifiedMetadata, WorkflowMetadata, AIAgentMetadata, ToolMetadata } from './metadataSchema';

export interface DuplicateCandidate {
  id: string;
  metadata: UnifiedMetadata;
  similarityScore: number;
  matchType: 'exact' | 'near_exact' | 'similar' | 'potential';
  matchedFields: string[];
  confidence: number; // 0-100
}

export interface DuplicateGroup {
  id: string;
  primary: UnifiedMetadata;
  duplicates: DuplicateCandidate[];
  mergeStrategy: 'keep_primary' | 'merge_content' | 'manual_review';
  qualityScore: number;
  totalItems: number;
}

export interface DeduplicationResult {
  groups: DuplicateGroup[];
  totalDuplicates: number;
  totalGroups: number;
  processingTime: number;
  statistics: {
    exactMatches: number;
    nearExactMatches: number;
    similarMatches: number;
    potentialMatches: number;
  };
}

export interface SimilarityConfig {
  exactMatchThreshold: number; // 0-100
  nearExactMatchThreshold: number; // 0-100
  similarMatchThreshold: number; // 0-100
  potentialMatchThreshold: number; // 0-100
  fieldWeights: Record<string, number>;
  enableFuzzyMatching: boolean;
  enableSemanticMatching: boolean;
}

export interface MergeStrategy {
  name: string;
  description: string;
  priority: number;
  conditions: (metadata: UnifiedMetadata) => boolean;
  mergeFunction: (primary: UnifiedMetadata, duplicate: UnifiedMetadata) => UnifiedMetadata;
}

/**
 * Source Deduplication Engine
 */
export class DeduplicationEngine {
  private similarityConfig: SimilarityConfig = {
    exactMatchThreshold: 95,
    nearExactMatchThreshold: 85,
    similarMatchThreshold: 70,
    potentialMatchThreshold: 50,
    fieldWeights: {
      name: 0.3,
      description: 0.2,
      tags: 0.15,
      category: 0.1,
      integrations: 0.1,
      source: 0.05,
      version: 0.05,
      metadata: 0.05
    },
    enableFuzzyMatching: true,
    enableSemanticMatching: true
  };

  private mergeStrategies: MergeStrategy[] = [];

  constructor() {
    this.initializeMergeStrategies();
  }

  /**
   * Initialize default merge strategies
   */
  private initializeMergeStrategies(): void {
    this.mergeStrategies = [
      {
        name: 'keep_highest_quality',
        description: 'Keep the item with the highest quality score',
        priority: 1,
        conditions: (metadata) => true,
        mergeFunction: (primary, duplicate) => 
          primary.qualityScore >= duplicate.qualityScore ? primary : duplicate
      },
      {
        name: 'keep_most_recent',
        description: 'Keep the most recently updated item',
        priority: 2,
        conditions: (metadata) => true,
        mergeFunction: (primary, duplicate) => 
          new Date(primary.updatedAt) >= new Date(duplicate.updatedAt) ? primary : duplicate
      },
      {
        name: 'keep_verified',
        description: 'Keep verified items over unverified ones',
        priority: 3,
        conditions: (metadata) => true,
        mergeFunction: (primary, duplicate) => 
          primary.isVerified && !duplicate.isVerified ? primary : duplicate
      },
      {
        name: 'merge_workflow_content',
        description: 'Merge workflow-specific content intelligently',
        priority: 4,
        conditions: (metadata) => metadata.type === 'workflow',
        mergeFunction: (primary, duplicate) => this.mergeWorkflowContent(primary as WorkflowMetadata, duplicate as WorkflowMetadata)
      },
      {
        name: 'merge_ai_agent_content',
        description: 'Merge AI agent-specific content intelligently',
        priority: 4,
        conditions: (metadata) => metadata.type === 'ai_agent',
        mergeFunction: (primary, duplicate) => this.mergeAIAgentContent(primary as AIAgentMetadata, duplicate as AIAgentMetadata)
      },
      {
        name: 'merge_tool_content',
        description: 'Merge tool-specific content intelligently',
        priority: 4,
        conditions: (metadata) => metadata.type === 'tool',
        mergeFunction: (primary, duplicate) => this.mergeToolContent(primary as ToolMetadata, duplicate as ToolMetadata)
      }
    ];
  }

  /**
   * Find duplicates in a collection of metadata
   */
  findDuplicates(metadataItems: UnifiedMetadata[]): DeduplicationResult {
    const startTime = Date.now();
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();
    const statistics = {
      exactMatches: 0,
      nearExactMatches: 0,
      similarMatches: 0,
      potentialMatches: 0
    };

    for (let i = 0; i < metadataItems.length; i++) {
      const primary = metadataItems[i];
      
      if (processed.has(primary.id)) {
        continue;
      }

      const duplicates: DuplicateCandidate[] = [];
      
      for (let j = i + 1; j < metadataItems.length; j++) {
        const candidate = metadataItems[j];
        
        if (processed.has(candidate.id)) {
          continue;
        }

        const similarity = this.calculateSimilarity(primary, candidate);
        
        if (similarity.score >= this.similarityConfig.potentialMatchThreshold) {
          const matchType = this.getMatchType(similarity.score);
          const confidence = this.calculateConfidence(primary, candidate, similarity);
          
          duplicates.push({
            id: candidate.id,
            metadata: candidate,
            similarityScore: similarity.score,
            matchType,
            matchedFields: similarity.matchedFields,
            confidence
          });

          processed.add(candidate.id);
          
          // Update statistics
          switch (matchType) {
            case 'exact':
              statistics.exactMatches++;
              break;
            case 'near_exact':
              statistics.nearExactMatches++;
              break;
            case 'similar':
              statistics.similarMatches++;
              break;
            case 'potential':
              statistics.potentialMatches++;
              break;
          }
        }
      }

      if (duplicates.length > 0) {
        const group = this.createDuplicateGroup(primary, duplicates);
        groups.push(group);
        processed.add(primary.id);
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      groups,
      totalDuplicates: groups.reduce((sum, group) => sum + group.duplicates.length, 0),
      totalGroups: groups.length,
      processingTime,
      statistics
    };
  }

  /**
   * Calculate similarity between two metadata items
   */
  private calculateSimilarity(item1: UnifiedMetadata, item2: UnifiedMetadata): {
    score: number;
    matchedFields: string[];
  } {
    const matchedFields: string[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Name similarity
    const nameScore = this.calculateStringSimilarity(item1.name, item2.name);
    if (nameScore > 0.8) matchedFields.push('name');
    totalScore += nameScore * this.similarityConfig.fieldWeights.name;
    totalWeight += this.similarityConfig.fieldWeights.name;

    // Description similarity
    const descriptionScore = this.calculateStringSimilarity(item1.description, item2.description);
    if (descriptionScore > 0.7) matchedFields.push('description');
    totalScore += descriptionScore * this.similarityConfig.fieldWeights.description;
    totalWeight += this.similarityConfig.fieldWeights.description;

    // Tags similarity
    const tagsScore = this.calculateArraySimilarity(item1.tags, item2.tags);
    if (tagsScore > 0.6) matchedFields.push('tags');
    totalScore += tagsScore * this.similarityConfig.fieldWeights.tags;
    totalWeight += this.similarityConfig.fieldWeights.tags;

    // Category similarity
    const categoryScore = item1.category === item2.category ? 1 : 0;
    if (categoryScore > 0) matchedFields.push('category');
    totalScore += categoryScore * this.similarityConfig.fieldWeights.category;
    totalWeight += this.similarityConfig.fieldWeights.category;

    // Type-specific similarity
    if (item1.type === item2.type) {
      const typeSpecificScore = this.calculateTypeSpecificSimilarity(item1, item2);
      totalScore += typeSpecificScore * this.similarityConfig.fieldWeights.metadata;
      totalWeight += this.similarityConfig.fieldWeights.metadata;
    }

    // Source similarity (lower weight for different sources)
    const sourceScore = item1.source === item2.source ? 0.2 : 0;
    totalScore += sourceScore * this.similarityConfig.fieldWeights.source;
    totalWeight += this.similarityConfig.fieldWeights.source;

    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

    return {
      score: Math.round(finalScore),
      matchedFields
    };
  }

  /**
   * Calculate string similarity using multiple algorithms
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    // Exact substring match
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Levenshtein distance
    const levenshteinScore = 1 - (this.levenshteinDistance(s1, s2) / Math.max(s1.length, s2.length));
    
    // Jaccard similarity for word sets
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    const jaccardScore = intersection.size / union.size;
    
    // Combine scores
    return Math.max(levenshteinScore, jaccardScore);
  }

  /**
   * Calculate array similarity
   */
  private calculateArraySimilarity(arr1: string[], arr2: string[]): number {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
    
    const set1 = new Set(arr1.map(item => item.toLowerCase()));
    const set2 = new Set(arr2.map(item => item.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate type-specific similarity
   */
  private calculateTypeSpecificSimilarity(item1: UnifiedMetadata, item2: UnifiedMetadata): number {
    switch (item1.type) {
      case 'workflow':
        return this.calculateWorkflowSimilarity(item1 as WorkflowMetadata, item2 as WorkflowMetadata);
      case 'ai_agent':
        return this.calculateAIAgentSimilarity(item1 as AIAgentMetadata, item2 as AIAgentMetadata);
      case 'tool':
        return this.calculateToolSimilarity(item1 as ToolMetadata, item2 as ToolMetadata);
      default:
        return 0;
    }
  }

  /**
   * Calculate workflow-specific similarity
   */
  private calculateWorkflowSimilarity(workflow1: WorkflowMetadata, workflow2: WorkflowMetadata): number {
    let score = 0;
    let factors = 0;

    // Node count similarity
    if (Math.abs(workflow1.nodeCount - workflow2.nodeCount) <= 2) {
      score += 0.2;
    }
    factors += 0.2;

    // Integrations similarity
    const integrationsScore = this.calculateArraySimilarity(workflow1.integrations, workflow2.integrations);
    score += integrationsScore * 0.3;
    factors += 0.3;

    // Complexity similarity
    if (workflow1.complexity === workflow2.complexity) {
      score += 0.2;
    }
    factors += 0.2;

    // Execution mode similarity
    if (workflow1.executionMode === workflow2.executionMode) {
      score += 0.1;
    }
    factors += 0.1;

    // Triggers similarity
    const triggersScore = this.calculateArraySimilarity(workflow1.triggers, workflow2.triggers);
    score += triggersScore * 0.2;
    factors += 0.2;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate AI agent-specific similarity
   */
  private calculateAIAgentSimilarity(agent1: AIAgentMetadata, agent2: AIAgentMetadata): number {
    let score = 0;
    let factors = 0;

    // Model similarity
    if (agent1.model === agent2.model) {
      score += 0.3;
    }
    factors += 0.3;

    // Provider similarity
    if (agent1.provider === agent2.provider) {
      score += 0.2;
    }
    factors += 0.2;

    // Capabilities similarity
    const capabilitiesScore = this.calculateArraySimilarity(agent1.capabilities, agent2.capabilities);
    score += capabilitiesScore * 0.3;
    factors += 0.3;

    // Use cases similarity
    const useCasesScore = this.calculateArraySimilarity(agent1.useCases, agent2.useCases);
    score += useCasesScore * 0.2;
    factors += 0.2;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate tool-specific similarity
   */
  private calculateToolSimilarity(tool1: ToolMetadata, tool2: ToolMetadata): number {
    let score = 0;
    let factors = 0;

    // Tool type similarity
    if (tool1.toolType === tool2.toolType) {
      score += 0.2;
    }
    factors += 0.2;

    // Platform similarity
    if (tool1.platform === tool2.platform) {
      score += 0.2;
    }
    factors += 0.2;

    // Features similarity
    const featuresScore = this.calculateArraySimilarity(tool1.features, tool2.features);
    score += featuresScore * 0.3;
    factors += 0.3;

    // Capabilities similarity
    const capabilitiesScore = this.calculateArraySimilarity(tool1.capabilities, tool2.capabilities);
    score += capabilitiesScore * 0.3;
    factors += 0.3;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get match type based on similarity score
   */
  private getMatchType(score: number): DuplicateCandidate['matchType'] {
    if (score >= this.similarityConfig.exactMatchThreshold) return 'exact';
    if (score >= this.similarityConfig.nearExactMatchThreshold) return 'near_exact';
    if (score >= this.similarityConfig.similarMatchThreshold) return 'similar';
    return 'potential';
  }

  /**
   * Calculate confidence score for a duplicate match
   */
  private calculateConfidence(primary: UnifiedMetadata, duplicate: UnifiedMetadata, similarity: any): number {
    let confidence = similarity.score;
    
    // Boost confidence for exact field matches
    if (primary.name === duplicate.name) confidence += 10;
    if (primary.category === duplicate.category) confidence += 5;
    if (primary.source === duplicate.source) confidence -= 5; // Different sources are more likely to be duplicates
    
    // Boost confidence for quality indicators
    if (primary.isVerified && duplicate.isVerified) confidence += 5;
    if (primary.qualityScore > 80 && duplicate.qualityScore > 80) confidence += 5;
    
    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Create a duplicate group
   */
  private createDuplicateGroup(primary: UnifiedMetadata, duplicates: DuplicateCandidate[]): DuplicateGroup {
    const mergeStrategy = this.selectMergeStrategy(primary);
    const qualityScore = this.calculateGroupQualityScore(primary, duplicates);
    
    return {
      id: `group_${primary.id}_${Date.now()}`,
      primary,
      duplicates,
      mergeStrategy,
      qualityScore,
      totalItems: duplicates.length + 1
    };
  }

  /**
   * Select appropriate merge strategy
   */
  private selectMergeStrategy(metadata: UnifiedMetadata): DuplicateGroup['mergeStrategy'] {
    // Find the best matching strategy
    const applicableStrategies = this.mergeStrategies
      .filter(strategy => strategy.conditions(metadata))
      .sort((a, b) => a.priority - b.priority);
    
    if (applicableStrategies.length > 0) {
      return 'merge_content';
    }
    
    return 'keep_primary';
  }

  /**
   * Calculate quality score for a duplicate group
   */
  private calculateGroupQualityScore(primary: UnifiedMetadata, duplicates: DuplicateCandidate[]): number {
    const allItems = [primary, ...duplicates.map(d => d.metadata)];
    const totalQuality = allItems.reduce((sum, item) => sum + item.qualityScore, 0);
    return Math.round(totalQuality / allItems.length);
  }

  /**
   * Merge workflow content intelligently
   */
  private mergeWorkflowContent(primary: WorkflowMetadata, duplicate: WorkflowMetadata): WorkflowMetadata {
    return {
      ...primary,
      // Merge integrations
      integrations: [...new Set([...primary.integrations, ...duplicate.integrations])],
      // Merge triggers
      triggers: [...new Set([...primary.triggers, ...duplicate.triggers])],
      // Merge actions
      actions: [...new Set([...primary.actions, ...duplicate.actions])],
      // Merge tags
      tags: [...new Set([...primary.tags, ...duplicate.tags])],
      // Use the longer description
      description: primary.description.length > duplicate.description.length ? primary.description : duplicate.description,
      // Use the higher quality score
      qualityScore: Math.max(primary.qualityScore, duplicate.qualityScore),
      // Use the most recent update time
      updatedAt: new Date(primary.updatedAt) > new Date(duplicate.updatedAt) ? primary.updatedAt : duplicate.updatedAt
    };
  }

  /**
   * Merge AI agent content intelligently
   */
  private mergeAIAgentContent(primary: AIAgentMetadata, duplicate: AIAgentMetadata): AIAgentMetadata {
    return {
      ...primary,
      // Merge capabilities
      capabilities: [...new Set([...primary.capabilities, ...duplicate.capabilities])],
      // Merge use cases
      useCases: [...new Set([...primary.useCases, ...duplicate.useCases])],
      // Merge industries
      industries: [...new Set([...primary.industries, ...duplicate.industries])],
      // Merge tags
      tags: [...new Set([...primary.tags, ...duplicate.tags])],
      // Use the longer description
      description: primary.description.length > duplicate.description.length ? primary.description : duplicate.description,
      // Use the higher quality score
      qualityScore: Math.max(primary.qualityScore, duplicate.qualityScore),
      // Use the most recent update time
      updatedAt: new Date(primary.updatedAt) > new Date(duplicate.updatedAt) ? primary.updatedAt : duplicate.updatedAt
    };
  }

  /**
   * Merge tool content intelligently
   */
  private mergeToolContent(primary: ToolMetadata, duplicate: ToolMetadata): ToolMetadata {
    return {
      ...primary,
      // Merge features
      features: [...new Set([...primary.features, ...duplicate.features])],
      // Merge capabilities
      capabilities: [...new Set([...primary.capabilities, ...duplicate.capabilities])],
      // Merge integrations
      integrations: [...new Set([...primary.integrations, ...duplicate.integrations])],
      // Merge tags
      tags: [...new Set([...primary.tags, ...duplicate.tags])],
      // Use the longer description
      description: primary.description.length > duplicate.description.length ? primary.description : duplicate.description,
      // Use the higher quality score
      qualityScore: Math.max(primary.qualityScore, duplicate.qualityScore),
      // Use the most recent update time
      updatedAt: new Date(primary.updatedAt) > new Date(duplicate.updatedAt) ? primary.updatedAt : duplicate.updatedAt
    };
  }

  /**
   * Update similarity configuration
   */
  updateSimilarityConfig(config: Partial<SimilarityConfig>): void {
    this.similarityConfig = { ...this.similarityConfig, ...config };
  }

  /**
   * Add custom merge strategy
   */
  addMergeStrategy(strategy: MergeStrategy): void {
    this.mergeStrategies.push(strategy);
    this.mergeStrategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get current similarity configuration
   */
  getSimilarityConfig(): SimilarityConfig {
    return { ...this.similarityConfig };
  }

  /**
   * Get available merge strategies
   */
  getMergeStrategies(): MergeStrategy[] {
    return [...this.mergeStrategies];
  }
}

// Export singleton instance
export const deduplicationEngine = new DeduplicationEngine();
