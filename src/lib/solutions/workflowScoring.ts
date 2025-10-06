import { WorkflowIndex, AgentIndex } from './schemas/workflowIndex';

export interface WorkflowScore {
  workflowId: string;
  overallScore: number; // 0-100
  categoryScore: number; // 0-100
  serviceScore: number; // 0-100
  triggerScore: number; // 0-100
  complexityScore: number; // 0-100
  integrationScore: number; // 0-100
  scoreBreakdown: WorkflowScoreBreakdown;
  reasoning: string[];
  confidence: number; // 0-100
}

export interface WorkflowScoreBreakdown {
  categoryMatch: number;
  serviceRelevance: number;
  triggerAlignment: number;
  complexityFit: number;
  integrationCoverage: number;
  dataQuality: number;
  popularity: number;
  recency: number;
}

export interface WorkflowScoringContext {
  userQuery?: string;
  businessDomain?: string;
  requiredIntegrations?: string[];
  preferredTriggerTypes?: string[];
  complexityPreference?: 'Low' | 'Medium' | 'High';
  automationPotential?: number;
}

export interface WorkflowScoringCriteria {
  weights: {
    category: number;
    service: number;
    trigger: number;
    complexity: number;
    integration: number;
    dataQuality: number;
    popularity: number;
    recency: number;
  };
  thresholds: {
    minimumScore: number;
    highScoreThreshold: number;
    excellentScoreThreshold: number;
  };
  boostFactors: {
    exactCategoryMatch: number;
    exactServiceMatch: number;
    exactTriggerMatch: number;
    highQualityData: number;
    recentUpdate: number;
    popularWorkflow: number;
  };
}

export class WorkflowScoring {
  private defaultCriteria: WorkflowScoringCriteria = {
    weights: {
      category: 0.25,
      service: 0.20,
      trigger: 0.15,
      complexity: 0.10,
      integration: 0.15,
      dataQuality: 0.10,
      popularity: 0.03,
      recency: 0.02
    },
    thresholds: {
      minimumScore: 30,
      highScoreThreshold: 70,
      excellentScoreThreshold: 85
    },
    boostFactors: {
      exactCategoryMatch: 1.2,
      exactServiceMatch: 1.15,
      exactTriggerMatch: 1.1,
      highQualityData: 1.1,
      recentUpdate: 1.05,
      popularWorkflow: 1.08
    }
  };

  constructor(private customCriteria?: Partial<WorkflowScoringCriteria>) {
    if (customCriteria) {
      this.defaultCriteria = { ...this.defaultCriteria, ...customCriteria };
    }
  }

  /**
   * Calculate comprehensive score for a workflow
   */
  calculateWorkflowScore(
    workflow: WorkflowIndex,
    context: WorkflowScoringContext = {}
  ): WorkflowScore {
    const breakdown = this.calculateScoreBreakdown(workflow, context);
    
    // Calculate individual component scores
    const categoryScore = this.calculateCategoryScore(workflow, context);
    const serviceScore = this.calculateServiceScore(workflow, context);
    const triggerScore = this.calculateTriggerScore(workflow, context);
    const complexityScore = this.calculateComplexityScore(workflow, context);
    const integrationScore = this.calculateIntegrationScore(workflow, context);

    // Calculate weighted overall score
    const weights = this.defaultCriteria.weights;
    const overallScore = Math.round(
      categoryScore * weights.category +
      serviceScore * weights.service +
      triggerScore * weights.trigger +
      complexityScore * weights.complexity +
      integrationScore * weights.integration +
      breakdown.dataQuality * weights.dataQuality +
      breakdown.popularity * weights.popularity +
      breakdown.recency * weights.recency
    );

    // Apply boost factors
    const boostedScore = this.applyBoostFactors(workflow, overallScore, breakdown);

    // Generate reasoning
    const reasoning = this.generateReasoning(workflow, context, {
      categoryScore,
      serviceScore,
      triggerScore,
      complexityScore,
      integrationScore,
      overallScore: boostedScore
    });

    // Calculate confidence
    const confidence = this.calculateConfidence(workflow, breakdown);

    return {
      workflowId: workflow.id,
      overallScore: boostedScore,
      categoryScore,
      serviceScore,
      triggerScore,
      complexityScore,
      integrationScore,
      scoreBreakdown: breakdown,
      reasoning,
      confidence
    };
  }

  /**
   * Calculate detailed score breakdown
   */
  private calculateScoreBreakdown(
    workflow: WorkflowIndex,
    context: WorkflowScoringContext
  ): WorkflowScoreBreakdown {
    return {
      categoryMatch: this.calculateCategoryMatchScore(workflow, context),
      serviceRelevance: this.calculateServiceRelevanceScore(workflow, context),
      triggerAlignment: this.calculateTriggerAlignmentScore(workflow, context),
      complexityFit: this.calculateComplexityFitScore(workflow, context),
      integrationCoverage: this.calculateIntegrationCoverageScore(workflow, context),
      dataQuality: this.calculateDataQualityScore(workflow),
      popularity: this.calculatePopularityScore(workflow),
      recency: this.calculateRecencyScore(workflow)
    };
  }

  /**
   * Calculate category matching score
   */
  private calculateCategoryScore(
    workflow: WorkflowIndex,
    context: WorkflowScoringContext
  ): number {
    if (!context.businessDomain && !context.userQuery) {
      return 75; // Default score when no context
    }

    const category = workflow.category?.toLowerCase() || '';
    let score = 0;

    // Business domain matching
    if (context.businessDomain) {
      const domain = context.businessDomain.toLowerCase();
      if (category.includes(domain) || domain.includes(category)) {
        score += 50;
      } else {
        // Check for related categories
        const relatedCategories = this.getRelatedCategories(domain);
        if (relatedCategories.some(rel => category.includes(rel))) {
          score += 30;
        }
      }
    }

    // User query matching
    if (context.userQuery) {
      const query = context.userQuery.toLowerCase();
      const queryWords = query.split(/\s+/).filter(word => word.length > 2);
      
      if (category) {
        const categoryWords = category.split(/\s+/);
        const matches = queryWords.filter(qWord => 
          categoryWords.some(cWord => 
            cWord.includes(qWord) || qWord.includes(cWord)
          )
        );
        score += (matches.length / queryWords.length) * 50;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate service relevance score
   */
  private calculateServiceScore(
    workflow: WorkflowIndex,
    context: WorkflowScoringContext
  ): number {
    if (!context.requiredIntegrations && !context.userQuery) {
      return 75; // Default score when no context
    }

    const integrations = workflow.integrations || [];
    let score = 0;

    // Required integrations matching
    if (context.requiredIntegrations && context.requiredIntegrations.length > 0) {
      const required = context.requiredIntegrations.map(i => i.toLowerCase());
      const matching = integrations.filter(integration => 
        required.some(req => 
          integration.toLowerCase().includes(req) || 
          req.includes(integration.toLowerCase())
        )
      );
      score += (matching.length / required.length) * 60;
    }

    // User query service matching
    if (context.userQuery) {
      const query = context.userQuery.toLowerCase();
      const queryWords = query.split(/\s+/).filter(word => word.length > 2);
      
      const serviceMatches = integrations.filter(integration => 
        queryWords.some(qWord => 
          integration.toLowerCase().includes(qWord) || 
          qWord.includes(integration.toLowerCase())
        )
      );
      
      if (integrations.length > 0) {
        score += (serviceMatches.length / integrations.length) * 40;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate trigger alignment score
   */
  private calculateTriggerScore(
    workflow: WorkflowIndex,
    context: WorkflowScoringContext
  ): number {
    if (!context.preferredTriggerTypes && !context.userQuery) {
      return 75; // Default score when no context
    }

    const triggerType = workflow.triggerType?.toLowerCase() || '';
    let score = 0;

    // Preferred trigger type matching
    if (context.preferredTriggerTypes && context.preferredTriggerTypes.length > 0) {
      const preferred = context.preferredTriggerTypes.map(t => t.toLowerCase());
      if (preferred.includes(triggerType)) {
        score += 70;
      } else {
        // Check for related trigger types
        const relatedTriggers = this.getRelatedTriggerTypes(triggerType);
        if (relatedTriggers.some(rel => preferred.includes(rel))) {
          score += 40;
        }
      }
    }

    // User query trigger matching
    if (context.userQuery) {
      const query = context.userQuery.toLowerCase();
      const triggerKeywords = ['webhook', 'schedule', 'manual', 'api', 'trigger', 'event'];
      
      const queryMatches = triggerKeywords.filter(keyword => 
        query.includes(keyword) && triggerType.includes(keyword)
      );
      
      if (queryMatches.length > 0) {
        score += 30;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate complexity fit score
   */
  private calculateComplexityScore(
    workflow: WorkflowIndex,
    context: WorkflowScoringContext
  ): number {
    const complexity = workflow.complexity?.toLowerCase() || 'medium';
    let score = 75; // Default score

    if (context.complexityPreference) {
      const preference = context.complexityPreference.toLowerCase();
      
      if (complexity === preference) {
        score = 100; // Perfect match
      } else if (
        (preference === 'low' && complexity === 'medium') ||
        (preference === 'medium' && (complexity === 'low' || complexity === 'high')) ||
        (preference === 'high' && complexity === 'medium')
      ) {
        score = 80; // Good match
      } else {
        score = 60; // Poor match
      }
    }

    // Adjust based on automation potential
    if (context.automationPotential) {
      if (context.automationPotential >= 80 && complexity === 'high') {
        score = Math.min(score + 10, 100);
      } else if (context.automationPotential <= 40 && complexity === 'low') {
        score = Math.min(score + 10, 100);
      }
    }

    return score;
  }

  /**
   * Calculate integration coverage score
   */
  private calculateIntegrationScore(
    workflow: WorkflowIndex,
    context: WorkflowScoringContext
  ): number {
    const integrations = workflow.integrations || [];
    
    if (integrations.length === 0) {
      return 50; // Neutral score for no integrations
    }

    let score = 60; // Base score for having integrations

    // Bonus for multiple integrations
    if (integrations.length >= 3) score += 20;
    if (integrations.length >= 5) score += 10;

    // Bonus for common/popular integrations
    const popularIntegrations = [
      'slack', 'email', 'google', 'microsoft', 'salesforce', 
      'hubspot', 'zapier', 'webhook', 'api', 'database'
    ];
    
    const popularCount = integrations.filter(integration => 
      popularIntegrations.some(popular => 
        integration.toLowerCase().includes(popular)
      )
    ).length;
    
    if (popularCount > 0) {
      score += (popularCount / integrations.length) * 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Apply boost factors to the overall score
   */
  private applyBoostFactors(
    workflow: WorkflowIndex,
    baseScore: number,
    breakdown: WorkflowScoreBreakdown
  ): number {
    let boostMultiplier = 1.0;
    const boostFactors = this.defaultCriteria.boostFactors;

    // Exact category match boost
    if (breakdown.categoryMatch >= 90) {
      boostMultiplier *= boostFactors.exactCategoryMatch;
    }

    // Exact service match boost
    if (breakdown.serviceRelevance >= 90) {
      boostMultiplier *= boostFactors.exactServiceMatch;
    }

    // Exact trigger match boost
    if (breakdown.triggerAlignment >= 90) {
      boostMultiplier *= boostFactors.exactTriggerMatch;
    }

    // High quality data boost
    if (breakdown.dataQuality >= 85) {
      boostMultiplier *= boostFactors.highQualityData;
    }

    // Recent update boost
    if (breakdown.recency >= 80) {
      boostMultiplier *= boostFactors.recentUpdate;
    }

    // Popular workflow boost
    if (breakdown.popularity >= 80) {
      boostMultiplier *= boostFactors.popularWorkflow;
    }

    return Math.min(Math.round(baseScore * boostMultiplier), 100);
  }

  /**
   * Generate reasoning for the score
   */
  private generateReasoning(
    workflow: WorkflowIndex,
    context: WorkflowScoringContext,
    scores: {
      categoryScore: number;
      serviceScore: number;
      triggerScore: number;
      complexityScore: number;
      integrationScore: number;
      overallScore: number;
    }
  ): string[] {
    const reasoning: string[] = [];

    // Overall score reasoning
    if (scores.overallScore >= 85) {
      reasoning.push(`Excellent match (${scores.overallScore}/100) - highly recommended`);
    } else if (scores.overallScore >= 70) {
      reasoning.push(`Good match (${scores.overallScore}/100) - well-suited for your needs`);
    } else if (scores.overallScore >= 50) {
      reasoning.push(`Moderate match (${scores.overallScore}/100) - may require customization`);
    } else {
      reasoning.push(`Low match (${scores.overallScore}/100) - consider alternatives`);
    }

    // Category reasoning
    if (scores.categoryScore >= 80) {
      reasoning.push(`Strong category alignment: ${workflow.category}`);
    } else if (scores.categoryScore >= 60) {
      reasoning.push(`Good category match: ${workflow.category}`);
    }

    // Service reasoning
    if (scores.serviceScore >= 80 && workflow.integrations && workflow.integrations.length > 0) {
      reasoning.push(`Excellent integration coverage: ${workflow.integrations.slice(0, 3).join(', ')}${workflow.integrations.length > 3 ? '...' : ''}`);
    } else if (scores.serviceScore >= 60 && workflow.integrations && workflow.integrations.length > 0) {
      reasoning.push(`Good integration support: ${workflow.integrations.slice(0, 2).join(', ')}`);
    }

    // Trigger reasoning
    if (scores.triggerScore >= 80 && workflow.triggerType) {
      reasoning.push(`Perfect trigger type: ${workflow.triggerType}`);
    } else if (scores.triggerScore >= 60 && workflow.triggerType) {
      reasoning.push(`Suitable trigger type: ${workflow.triggerType}`);
    }

    // Complexity reasoning
    if (scores.complexityScore >= 80 && workflow.complexity) {
      reasoning.push(`Ideal complexity level: ${workflow.complexity}`);
    }

    return reasoning;
  }

  /**
   * Calculate confidence in the score
   */
  private calculateConfidence(
    workflow: WorkflowIndex,
    breakdown: WorkflowScoreBreakdown
  ): number {
    let confidence = 50; // Base confidence

    // Higher confidence for complete data
    if (workflow.title && workflow.summary) confidence += 20;
    if (workflow.category) confidence += 10;
    if (workflow.integrations && workflow.integrations.length > 0) confidence += 10;
    if (workflow.triggerType) confidence += 5;
    if (workflow.complexity) confidence += 5;

    // Higher confidence for high-quality data
    if (breakdown.dataQuality >= 80) confidence += 10;
    if (breakdown.popularity >= 70) confidence += 5;

    return Math.max(0, Math.min(100, confidence));
  }

  // Helper methods for score calculations
  private calculateCategoryMatchScore(workflow: WorkflowIndex, context: WorkflowScoringContext): number {
    return this.calculateCategoryScore(workflow, context);
  }

  private calculateServiceRelevanceScore(workflow: WorkflowIndex, context: WorkflowScoringContext): number {
    return this.calculateServiceScore(workflow, context);
  }

  private calculateTriggerAlignmentScore(workflow: WorkflowIndex, context: WorkflowScoringContext): number {
    return this.calculateTriggerScore(workflow, context);
  }

  private calculateComplexityFitScore(workflow: WorkflowIndex, context: WorkflowScoringContext): number {
    return this.calculateComplexityScore(workflow, context);
  }

  private calculateIntegrationCoverageScore(workflow: WorkflowIndex, context: WorkflowScoringContext): number {
    return this.calculateIntegrationScore(workflow, context);
  }

  private calculateDataQualityScore(workflow: WorkflowIndex): number {
    let score = 0;
    let factors = 0;

    if (workflow.title && workflow.title.length > 10) {
      score += 20;
      factors++;
    }
    if (workflow.summary && workflow.summary.length > 20) {
      score += 20;
      factors++;
    }
    if (workflow.category) {
      score += 15;
      factors++;
    }
    if (workflow.integrations && workflow.integrations.length > 0) {
      score += 15;
      factors++;
    }
    if (workflow.triggerType) {
      score += 10;
      factors++;
    }
    if (workflow.complexity) {
      score += 10;
      factors++;
    }
    if (workflow.link && workflow.link !== '#') {
      score += 10;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors * 5) : 50;
  }

  private calculatePopularityScore(workflow: WorkflowIndex): number {
    // This would typically be based on usage metrics, stars, downloads, etc.
    // For now, use a simple heuristic based on data completeness
    let score = 50; // Base score

    if (workflow.integrations && workflow.integrations.length >= 3) score += 20;
    if (workflow.summary && workflow.summary.length > 100) score += 15;
    if (workflow.category && workflow.category !== 'Other') score += 15;

    return Math.min(score, 100);
  }

  private calculateRecencyScore(workflow: WorkflowIndex): number {
    // This would typically be based on last updated date
    // For now, use a simple heuristic
    return 75; // Default score
  }

  private getRelatedCategories(domain: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'hr': ['human resources', 'recruitment', 'people'],
      'finance': ['accounting', 'billing', 'payments'],
      'marketing': ['advertising', 'promotion', 'campaign'],
      'sales': ['crm', 'leads', 'customers'],
      'support': ['customer service', 'help desk', 'tickets'],
      'analytics': ['data', 'reporting', 'metrics'],
      'operations': ['process', 'workflow', 'automation'],
      'development': ['devops', 'deployment', 'code']
    };

    return categoryMap[domain] || [];
  }

  private getRelatedTriggerTypes(triggerType: string): string[] {
    const triggerMap: Record<string, string[]> = {
      'webhook': ['api', 'http', 'post'],
      'schedule': ['cron', 'timer', 'periodic'],
      'manual': ['button', 'click', 'user'],
      'api': ['webhook', 'http', 'rest']
    };

    return triggerMap[triggerType] || [];
  }
}

// Factory function to create workflow scorer
export const createWorkflowScoring = (criteria?: Partial<WorkflowScoringCriteria>): WorkflowScoring => {
  return new WorkflowScoring(criteria);
};

// Default scorer instance
export const defaultWorkflowScoring = createWorkflowScoring();
