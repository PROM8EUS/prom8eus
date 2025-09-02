import { Solution, SolutionType, SolutionCategory, SolutionFilter } from '../../types/solutions';

export interface SolutionScore {
  solutionId: string;
  overallScore: number; // 0-100
  relevanceScore: number; // 0-100
  qualityScore: number; // 0-100
  businessValueScore: number; // 0-100
  implementationScore: number; // 0-100
  scoreBreakdown: ScoreBreakdown;
  ranking: number;
  confidence: number; // 0-100
}

export interface ScoreBreakdown {
  automationPotential: number;
  categoryMatch: number;
  difficultyAlignment: number;
  setupTimeEfficiency: number;
  userSatisfaction: number;
  implementationPriority: number;
  tagsRelevance: number;
  businessDomainAlignment: number;
  performanceMetrics: number;
  costEffectiveness: number;
  timeToValue: number;
  scalability: number;
}

export interface ScoringCriteria {
  weights: {
    relevance: number;
    quality: number;
    businessValue: number;
    implementation: number;
  };
  thresholds: {
    minimumScore: number;
    highScoreThreshold: number;
    excellentScoreThreshold: number;
  };
  boostFactors: {
    highROI: number;
    quickSetup: number;
    highPriority: number;
    provenTrackRecord: number;
  };
}

export interface RankingOptions {
  sortBy: 'overallScore' | 'relevanceScore' | 'qualityScore' | 'businessValueScore' | 'implementationScore';
  sortDirection: 'asc' | 'desc';
  groupBy?: 'category' | 'type' | 'difficulty' | 'priority';
  limit?: number;
  includeScoreBreakdown?: boolean;
}

export class SolutionScoring {
  private defaultCriteria: ScoringCriteria = {
    weights: {
      relevance: 0.35,
      quality: 0.25,
      businessValue: 0.25,
      implementation: 0.15
    },
    thresholds: {
      minimumScore: 30,
      highScoreThreshold: 70,
      excellentScoreThreshold: 85
    },
    boostFactors: {
      highROI: 1.2,
      quickSetup: 1.15,
      highPriority: 1.1,
      provenTrackRecord: 1.25
    }
  };

  constructor(private customCriteria?: Partial<ScoringCriteria>) {
    if (customCriteria) {
      this.defaultCriteria = { ...this.defaultCriteria, ...customCriteria };
    }
  }

  /**
   * Score and rank solutions based on multiple criteria
   */
  scoreAndRankSolutions(
    solutions: Solution[],
    context: {
      businessDomain?: string;
      automationPotential?: number;
      difficulty?: string;
      setupTime?: string;
      priority?: string;
    },
    options: RankingOptions = { sortBy: 'overallScore', sortDirection: 'desc' }
  ): SolutionScore[] {
    const scoredSolutions = solutions.map(solution => 
      this.calculateSolutionScore(solution, context)
    );

    // Apply boost factors
    const boostedSolutions = scoredSolutions.map(score => 
      this.applyBoostFactors(score)
    );

    // Filter by minimum score
    const filteredSolutions = boostedSolutions.filter(score => 
      score.overallScore >= this.defaultCriteria.thresholds.minimumScore
    );

    // Sort by specified criteria
    const sortedSolutions = this.sortSolutions(filteredSolutions, options);

    // Add ranking
    const rankedSolutions = sortedSolutions.map((score, index) => ({
      ...score,
      ranking: index + 1
    }));

    // Apply grouping if specified
    if (options.groupBy) {
      return this.groupSolutions(rankedSolutions, options.groupBy);
    }

    // Apply limit if specified
    if (options.limit) {
      return rankedSolutions.slice(0, options.limit);
    }

    return rankedSolutions;
  }

  /**
   * Calculate comprehensive score for a solution
   */
  private calculateSolutionScore(
    solution: Solution,
    context: {
      businessDomain?: string;
      automationPotential?: number;
      difficulty?: string;
      setupTime?: string;
      priority?: string;
    }
  ): SolutionScore {
    const relevanceScore = this.calculateRelevanceScore(solution, context);
    const qualityScore = this.calculateQualityScore(solution);
    const businessValueScore = this.calculateBusinessValueScore(solution);
    const implementationScore = this.calculateImplementationScore(solution);

    const weights = this.defaultCriteria.weights;
    const overallScore = Math.round(
      relevanceScore * weights.relevance +
      qualityScore * weights.quality +
      businessValueScore * weights.businessValue +
      implementationScore * weights.implementation
    );

    const scoreBreakdown = this.calculateScoreBreakdown(solution, context);
    const confidence = this.calculateConfidence(solution, scoreBreakdown);

    return {
      solutionId: solution.id,
      overallScore,
      relevanceScore,
      qualityScore,
      businessValueScore,
      implementationScore,
      scoreBreakdown,
      ranking: 0, // Will be set later
      confidence
    };
  }

  /**
   * Calculate relevance score based on context
   */
  private calculateRelevanceScore(
    solution: Solution,
    context: {
      businessDomain?: string;
      automationPotential?: number;
      difficulty?: string;
      setupTime?: string;
      priority?: string;
    }
  ): number {
    let score = 0;
    let factors = 0;

    // Business domain alignment
    if (context.businessDomain) {
      const domainScore = this.calculateBusinessDomainAlignment(
        context.businessDomain,
        solution.category,
        solution.subcategories
      );
      score += domainScore;
      factors++;
    }

    // Automation potential alignment
    if (context.automationPotential) {
      const potentialScore = this.calculateAutomationPotentialAlignment(
        context.automationPotential,
        solution.automationPotential
      );
      score += potentialScore;
      factors++;
    }

    // Difficulty alignment
    if (context.difficulty) {
      const difficultyScore = this.calculateDifficultyAlignment(
        context.difficulty,
        solution.difficulty
      );
      score += difficultyScore;
      factors++;
    }

    // Setup time alignment
    if (context.setupTime) {
      const setupScore = this.calculateSetupTimeAlignment(
        context.setupTime,
        solution.setupTime
      );
      score += setupScore;
      factors++;
    }

    // Priority alignment
    if (context.priority) {
      const priorityScore = this.calculatePriorityAlignment(
        context.priority,
        solution.implementationPriority
      );
      score += priorityScore;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 75; // Default score if no context
  }

  /**
   * Calculate quality score based on solution metrics and characteristics
   */
  private calculateQualityScore(solution: Solution): number {
    let score = 0;
    let factors = 0;

    // User rating (1-5 stars converted to 0-100)
    if (solution.metrics.userRating > 0) {
      score += solution.metrics.userRating * 20;
      factors++;
    }

    // Success rate
    if (solution.metrics.successRate > 0) {
      score += solution.metrics.successRate;
      factors++;
    }

    // Performance score
    if (solution.metrics.performanceScore > 0) {
      score += solution.metrics.performanceScore;
      factors++;
    }

    // Review count (more reviews = higher confidence)
    const reviewScore = Math.min(solution.metrics.reviewCount * 2, 100);
    score += reviewScore;
    factors++;

    // Status consideration
    const statusScore = this.calculateStatusScore(solution.status);
    score += statusScore;
    factors++;

    return factors > 0 ? Math.round(score / factors) : 70;
  }

  /**
   * Calculate business value score
   */
  private calculateBusinessValueScore(solution: Solution): number {
    let score = 0;
    let factors = 0;

    // Automation potential
    score += solution.automationPotential;
    factors++;

    // ROI estimation
    const roiScore = this.parseROIScore(solution.estimatedROI);
    if (roiScore > 0) {
      score += Math.min(roiScore / 5, 100); // Normalize ROI to 0-100
      factors++;
    }

    // Time to value
    const timeScore = this.parseTimeToValueScore(solution.timeToValue);
    if (timeScore > 0) {
      score += timeScore;
      factors++;
    }

    // Implementation priority
    const priorityScore = this.calculatePriorityScore(solution.implementationPriority);
    score += priorityScore;
    factors++;

    return factors > 0 ? Math.round(score / factors) : 70;
  }

  /**
   * Calculate implementation score
   */
  private calculateImplementationScore(solution: Solution): number {
    let score = 0;
    let factors = 0;

    // Setup time
    const setupScore = this.calculateSetupTimeScore(solution.setupTime);
    score += setupScore;
    factors++;

    // Difficulty level
    const difficultyScore = this.calculateDifficultyScore(solution.difficulty);
    score += difficultyScore;
    factors++;

    // Deployment type
    const deploymentScore = this.calculateDeploymentScore(solution.deployment);
    score += deploymentScore;
    factors++;

    // Documentation availability
    if (solution.documentationUrl) {
      score += 80; // Bonus for having documentation
      factors++;
    }

    // Demo availability
    if (solution.demoUrl) {
      score += 60; // Bonus for having demo
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 70;
  }

  /**
   * Calculate detailed score breakdown
   */
  private calculateScoreBreakdown(
    solution: Solution,
    context: any
  ): ScoreBreakdown {
    return {
      automationPotential: solution.automationPotential,
      categoryMatch: this.calculateCategoryMatchScore(solution, context),
      difficultyAlignment: this.calculateDifficultyAlignmentScore(solution, context),
      setupTimeEfficiency: this.calculateSetupTimeEfficiencyScore(solution),
      userSatisfaction: solution.metrics.userRating * 20,
      implementationPriority: this.calculatePriorityScore(solution.implementationPriority),
      tagsRelevance: this.calculateTagsRelevanceScore(solution, context),
      businessDomainAlignment: this.calculateBusinessDomainAlignmentScore(solution, context),
      performanceMetrics: solution.metrics.performanceScore,
      costEffectiveness: this.calculateCostEffectivenessScore(solution),
      timeToValue: this.parseTimeToValueScore(solution.timeToValue),
      scalability: this.calculateScalabilityScore(solution)
    };
  }

  /**
   * Apply boost factors to scores
   */
  private applyBoostFactors(score: SolutionScore): SolutionScore {
    let boostMultiplier = 1.0;
    const boostFactors = this.defaultCriteria.boostFactors;

    // High ROI boost
    if (score.businessValueScore >= 80) {
      boostMultiplier *= boostFactors.highROI;
    }

    // Quick setup boost
    if (score.implementationScore >= 80) {
      boostMultiplier *= boostFactors.quickSetup;
    }

    // High priority boost
    if (score.businessValueScore >= 75) {
      boostMultiplier *= boostFactors.highPriority;
    }

    // Proven track record boost
    if (score.qualityScore >= 85) {
      boostMultiplier *= boostFactors.provenTrackRecord;
    }

    // Apply boost to overall score
    const boostedOverallScore = Math.min(
      Math.round(score.overallScore * boostMultiplier),
      100
    );

    return {
      ...score,
      overallScore: boostedOverallScore
    };
  }

  /**
   * Calculate confidence level in the score
   */
  private calculateConfidence(solution: Solution, breakdown: ScoreBreakdown): number {
    let confidence = 50; // Base confidence

    // Higher confidence for solutions with more data
    if (solution.metrics.reviewCount >= 10) confidence += 20;
    if (solution.metrics.usageCount >= 100) confidence += 15;
    if (solution.documentationUrl) confidence += 10;
    if (solution.demoUrl) confidence += 5;

    // Lower confidence for new or beta solutions
    if (solution.status === 'Beta') confidence -= 15;
    if (solution.status === 'Deprecated') confidence -= 30;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Sort solutions by specified criteria
   */
  private sortSolutions(solutions: SolutionScore[], options: RankingOptions): SolutionScore[] {
    const { sortBy, sortDirection } = options;

    return solutions.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'overallScore':
          comparison = a.overallScore - b.overallScore;
          break;
        case 'relevanceScore':
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        case 'qualityScore':
          comparison = a.qualityScore - b.qualityScore;
          break;
        case 'businessValueScore':
          comparison = a.businessValueScore - b.businessValueScore;
          break;
        case 'implementationScore':
          comparison = a.implementationScore - b.implementationScore;
          break;
        default:
          comparison = a.overallScore - b.overallScore;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Group solutions by specified criteria
   */
  private groupSolutions(solutions: SolutionScore[], groupBy: string): SolutionScore[] {
    // For now, return sorted solutions. Grouping logic can be implemented later
    return solutions;
  }

  // Helper methods for various score calculations
  private calculateBusinessDomainAlignment(domain: string, category: string, subcategories: string[]): number {
    if (category.toLowerCase().includes(domain.toLowerCase())) return 100;
    if (subcategories.some(sub => sub.toLowerCase().includes(domain.toLowerCase()))) return 80;
    return 40;
  }

  private calculateAutomationPotentialAlignment(required: number, available: number): number {
    const difference = Math.abs(required - available);
    if (difference <= 10) return 100;
    if (difference <= 25) return 80;
    if (difference <= 40) return 60;
    return 40;
  }

  private calculateDifficultyAlignment(required: string, available: string): number {
    if (required === available) return 100;
    if (required === 'Beginner' && available === 'Intermediate') return 80;
    if (required === 'Intermediate' && available === 'Advanced') return 80;
    return 60;
  }

  private calculateSetupTimeAlignment(required: string, available: string): number {
    if (required === available) return 100;
    if (required === 'Quick' && available === 'Medium') return 80;
    if (required === 'Medium' && available === 'Long') return 80;
    return 60;
  }

  private calculatePriorityAlignment(required: string, available: string): number {
    if (required === available) return 100;
    if (required === 'High' && available === 'Medium') return 80;
    return 60;
  }

  private calculateStatusScore(status: string): number {
    switch (status) {
      case 'Active': return 100;
      case 'Beta': return 70;
      case 'Inactive': return 50;
      case 'Deprecated': return 20;
      default: return 60;
    }
  }

  private calculateSetupTimeScore(setupTime: string): number {
    switch (setupTime) {
      case 'Quick': return 100;
      case 'Medium': return 70;
      case 'Long': return 40;
      default: return 50;
    }
  }

  private calculateDifficultyScore(difficulty: string): number {
    switch (difficulty) {
      case 'Beginner': return 100;
      case 'Intermediate': return 80;
      case 'Advanced': return 60;
      default: return 70;
    }
  }

  private calculateDeploymentScore(deployment: string): number {
    switch (deployment) {
      case 'Cloud': return 100;
      case 'Hybrid': return 80;
      case 'Local': return 60;
      default: return 70;
    }
  }

  private calculatePriorityScore(priority: string): number {
    switch (priority) {
      case 'High': return 100;
      case 'Medium': return 70;
      case 'Low': return 40;
      default: return 50;
    }
  }

  private parseROIScore(roiString: string): number {
    const match = roiString.match(/(\d+)-(\d+)%/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return (min + max) / 2;
    }
    return 0;
  }

  private parseTimeToValueScore(timeString: string): number {
    if (timeString.includes('1-2 weeks')) return 100;
    if (timeString.includes('2-4 weeks')) return 80;
    if (timeString.includes('4-8 weeks')) return 60;
    if (timeString.includes('8+ weeks')) return 40;
    return 70;
  }

  private calculateCategoryMatchScore(solution: Solution, context: any): number {
    // Implementation would depend on context
    return 75;
  }

  private calculateDifficultyAlignmentScore(solution: Solution, context: any): number {
    // Implementation would depend on context
    return 75;
  }

  private calculateSetupTimeEfficiencyScore(solution: Solution): number {
    return this.calculateSetupTimeScore(solution.setupTime);
  }

  private calculateTagsRelevanceScore(solution: Solution, context: any): number {
    // Implementation would depend on context
    return 75;
  }

  private calculateBusinessDomainAlignmentScore(solution: Solution, context: any): number {
    // Implementation would depend on context
    return 75;
  }

  private calculateCostEffectivenessScore(solution: Solution): number {
    if (solution.pricing === 'Free') return 100;
    if (solution.pricing === 'Freemium') return 80;
    if (solution.pricing === 'Paid') return 60;
    if (solution.pricing === 'Enterprise') return 40;
    return 70;
  }

  private calculateScalabilityScore(solution: Solution): number {
    // Simple heuristic based on deployment type and complexity
    if (solution.deployment === 'Cloud') return 90;
    if (solution.deployment === 'Hybrid') return 75;
    if (solution.deployment === 'Local') return 60;
    return 70;
  }
}

// Factory function to create solution scorer
export const createSolutionScoring = (criteria?: Partial<ScoringCriteria>): SolutionScoring => {
  return new SolutionScoring(criteria);
};

// Default scorer instance
export const defaultSolutionScoring = createSolutionScoring();
