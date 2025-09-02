import { Solution, SolutionType, SolutionCategory, SolutionBundle } from '../../types/solutions';
import { SubtaskMatch } from './solutionMatcher';

export interface SolutionCombination {
  id: string;
  name: string;
  description: string;
  solutions: Solution[];
  category: SolutionCategory;
  businessDomain: string;
  totalAutomationPotential: number;
  combinedROI: string;
  implementationOrder: string[];
  dependencies: Record<string, string[]>;
  estimatedTotalSetupTime: string;
  totalEstimatedCost: string;
  prerequisites: string[];
  useCase: string;
  benefits: string[];
  challenges: string[];
  riskMitigation: string[];
  successMetrics: string[];
  alternativeCombinations: string[];
}

export interface CombinationRecommendation {
  combination: SolutionCombination;
  matchScore: number; // 0-100
  reasoning: string[];
  priority: 'High' | 'Medium' | 'Low';
  expectedOutcome: string;
  implementationTimeline: string;
  resourceRequirements: string[];
  costBenefitAnalysis: {
    totalCost: string;
    expectedSavings: string;
    paybackPeriod: string;
    roi: string;
  };
}

export interface CombinationMatrix {
  workflowWorkflow: boolean;
  workflowAgent: boolean;
  agentAgent: boolean;
  crossDomain: boolean;
  sequential: boolean;
  parallel: boolean;
}

export interface CombinationRule {
  id: string;
  name: string;
  description: string;
  conditions: CombinationCondition[];
  recommendations: string[];
  restrictions: string[];
  priority: number;
}

export interface CombinationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
  value2?: any; // For range operations
}

export class SolutionCombinations {
  private combinations: SolutionCombination[] = [];
  private rules: CombinationRule[] = [];

  constructor() {
    this.initializeCombinationRules();
    this.initializePredefinedCombinations();
  }

  /**
   * Generate combination recommendations based on subtask matches
   */
  generateCombinationRecommendations(
    subtaskMatches: SubtaskMatch[],
    availableSolutions: Solution[]
  ): CombinationRecommendation[] {
    const recommendations: CombinationRecommendation[] = [];

    // Generate combinations for high-priority subtasks
    const highPriorityMatches = subtaskMatches.filter(m => m.implementationPriority === 'High');
    
    for (const match of highPriorityMatches) {
      const combinations = this.findOptimalCombinations(match, availableSolutions);
      recommendations.push(...combinations);
    }

    // Generate cross-domain combinations
    const crossDomainCombinations = this.generateCrossDomainCombinations(subtaskMatches, availableSolutions);
    recommendations.push(...crossDomainCombinations);

    // Sort by priority and match score
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return b.matchScore - a.matchScore;
    });
  }

  /**
   * Find optimal combinations for a specific subtask match
   */
  private findOptimalCombinations(
    subtaskMatch: SubtaskMatch,
    availableSolutions: Solution[]
  ): CombinationRecommendation[] {
    const recommendations: CombinationRecommendation[] = [];
    const matchedSolutions = subtaskMatch.matchedSolutions.map(r => r.solution);

    // Single solution recommendation
    if (matchedSolutions.length > 0) {
      const topSolution = matchedSolutions[0];
      const singleCombination: SolutionCombination = {
        id: `single-${topSolution.id}`,
        name: `${topSolution.name} - Standalone`,
        description: `Single solution implementation for ${subtaskMatch.subtaskName}`,
        solutions: [topSolution],
        category: topSolution.category,
        businessDomain: subtaskMatch.businessDomain,
        totalAutomationPotential: topSolution.automationPotential,
        combinedROI: topSolution.estimatedROI,
        implementationOrder: [topSolution.id],
        dependencies: {},
        estimatedTotalSetupTime: this.estimateSetupTime([topSolution]),
        totalEstimatedCost: this.estimateTotalCost([topSolution]),
        prerequisites: topSolution.requirements.map(r => r.items).flat(),
        useCase: `Automate ${subtaskMatch.subtaskName} using ${topSolution.name}`,
        benefits: [`Automate ${subtaskMatch.automationPotential}% of ${subtaskMatch.subtaskName}`],
        challenges: ['Single point of failure', 'Limited scope'],
        riskMitigation: ['Implement monitoring', 'Plan fallback processes'],
        successMetrics: ['Automation rate', 'Error reduction', 'Time savings'],
        alternativeCombinations: []
      };

      recommendations.push({
        combination: singleCombination,
        matchScore: subtaskMatch.totalMatchScore,
        reasoning: [`High match score (${subtaskMatch.totalMatchScore}%) for ${subtaskMatch.subtaskName}`],
        priority: subtaskMatch.implementationPriority,
        expectedOutcome: `Automate ${subtaskMatch.automationPotential}% of ${subtaskMatch.subtaskName}`,
        implementationTimeline: singleCombination.estimatedTotalSetupTime,
        resourceRequirements: ['Solution specialist', 'Business analyst'],
        costBenefitAnalysis: {
          totalCost: singleCombination.totalEstimatedCost,
          expectedSavings: this.calculateExpectedSavings(singleCombination),
          paybackPeriod: this.calculatePaybackPeriod(singleCombination),
          roi: singleCombination.combinedROI
        }
      });
    }

    // Multi-solution combinations
    if (matchedSolutions.length > 1) {
      const multiCombination = this.createMultiSolutionCombination(
        subtaskMatch,
        matchedSolutions.slice(0, 3) // Top 3 solutions
      );

      recommendations.push({
        combination: multiCombination,
        matchScore: Math.min(95, subtaskMatch.totalMatchScore + 10), // Boost for combination
        reasoning: [
          `Combination approach for ${subtaskMatch.subtaskName}`,
          'Multiple solutions provide redundancy and coverage',
          'Sequential implementation reduces risk'
        ],
        priority: subtaskMatch.implementationPriority,
        expectedOutcome: `Comprehensive automation of ${subtaskMatch.subtaskName}`,
        implementationTimeline: multiCombination.estimatedTotalSetupTime,
        resourceRequirements: ['Solution architect', 'Business analyst', 'Integration specialist'],
        costBenefitAnalysis: {
          totalCost: multiCombination.totalEstimatedCost,
          expectedSavings: this.calculateExpectedSavings(multiCombination),
          paybackPeriod: this.calculatePaybackPeriod(multiCombination),
          roi: multiCombination.combinedROI
        }
      });
    }

    return recommendations;
  }

  /**
   * Generate cross-domain combinations
   */
  private generateCrossDomainCombinations(
    subtaskMatches: SubtaskMatch[],
    availableSolutions: Solution[]
  ): CombinationRecommendation[] {
    const recommendations: CombinationRecommendation[] = [];

    // Group subtasks by business domain
    const domainGroups = this.groupSubtasksByDomain(subtaskMatches);

    // Find opportunities for cross-domain automation
    for (const [domain, matches] of Object.entries(domainGroups)) {
      if (matches.length > 1) {
        const crossDomainCombination = this.createCrossDomainCombination(domain, matches, availableSolutions);
        
        if (crossDomainCombination) {
          recommendations.push({
            combination: crossDomainCombination,
            matchScore: 85, // High score for cross-domain benefits
            reasoning: [
              `Cross-domain automation for ${domain}`,
              'Integrated workflow across multiple business processes',
              'Eliminates handoffs and improves efficiency'
            ],
            priority: 'High',
            expectedOutcome: `Seamless automation across ${domain} processes`,
            implementationTimeline: crossDomainCombination.estimatedTotalSetupTime,
            resourceRequirements: ['Solution architect', 'Business analyst', 'Process specialist'],
            costBenefitAnalysis: {
              totalCost: crossDomainCombination.totalEstimatedCost,
              expectedSavings: this.calculateExpectedSavings(crossDomainCombination),
              paybackPeriod: this.calculatePaybackPeriod(crossDomainCombination),
              roi: crossDomainCombination.combinedROI
            }
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Create multi-solution combination
   */
  private createMultiSolutionCombination(
    subtaskMatch: SubtaskMatch,
    solutions: Solution[]
  ): SolutionCombination {
    const totalAutomationPotential = Math.min(
      95, // Cap at 95% to account for diminishing returns
      solutions.reduce((sum, s) => sum + s.automationPotential, 0) / solutions.length + 10
    );

    const combination: SolutionCombination = {
      id: `multi-${subtaskMatch.subtaskId}`,
      name: `${subtaskMatch.subtaskName} - Multi-Solution`,
      description: `Comprehensive automation using multiple solutions for ${subtaskMatch.subtaskName}`,
      solutions,
      category: subtaskMatch.businessDomain as SolutionCategory,
      businessDomain: subtaskMatch.businessDomain,
      totalAutomationPotential,
      combinedROI: this.calculateCombinedROI(solutions),
      implementationOrder: this.determineImplementationOrder(solutions),
      dependencies: this.analyzeDependencies(solutions),
      estimatedTotalSetupTime: this.estimateSetupTime(solutions),
      totalEstimatedCost: this.estimateTotalCost(solutions),
      prerequisites: this.consolidatePrerequisites(solutions),
      useCase: `Comprehensive automation of ${subtaskMatch.subtaskName}`,
      benefits: [
        `Higher automation potential (${totalAutomationPotential}%)`,
        'Redundancy and fault tolerance',
        'Comprehensive coverage of edge cases'
      ],
      challenges: [
        'Increased complexity',
        'Higher implementation cost',
        'More integration points'
      ],
      riskMitigation: [
        'Phased implementation',
        'Thorough testing at each phase',
        'Clear rollback plans'
      ],
      successMetrics: [
        'Overall automation rate',
        'Process efficiency improvement',
        'Error reduction',
        'User satisfaction'
      ],
      alternativeCombinations: []
    };

    return combination;
  }

  /**
   * Create cross-domain combination
   */
  private createCrossDomainCombination(
    domain: string,
    matches: SubtaskMatch[],
    availableSolutions: Solution[]
  ): SolutionCombination | null {
    if (matches.length < 2) return null;

    const allSolutions = matches.flatMap(m => m.matchedSolutions.map(r => r.solution)).slice(0, 5);
    const totalAutomationPotential = Math.min(
      90,
      allSolutions.reduce((sum, s) => sum + s.automationPotential, 0) / allSolutions.length + 15
    );

    const combination: SolutionCombination = {
      id: `cross-domain-${domain.toLowerCase()}`,
      name: `${domain} - Cross-Domain Automation`,
      description: `Integrated automation across multiple ${domain} processes`,
      solutions: allSolutions,
      category: 'General Business' as SolutionCategory,
      businessDomain: domain,
      totalAutomationPotential,
      combinedROI: this.calculateCombinedROI(allSolutions),
      implementationOrder: this.determineImplementationOrder(allSolutions),
      dependencies: this.analyzeDependencies(allSolutions),
      estimatedTotalSetupTime: this.estimateSetupTime(allSolutions),
      totalEstimatedCost: this.estimateTotalCost(allSolutions),
      prerequisites: this.consolidatePrerequisites(allSolutions),
      useCase: `End-to-end automation across ${domain} processes`,
      benefits: [
        'Eliminates process handoffs',
        'Improves data consistency',
        'Reduces manual intervention',
        'Better process visibility'
      ],
      challenges: [
        'Complex integration requirements',
        'Cross-functional coordination needed',
        'Higher initial investment'
      ],
      riskMitigation: [
        'Start with core processes',
        'Involve all stakeholders early',
        'Implement monitoring and alerts'
      ],
      successMetrics: [
        'End-to-end process time',
        'Handoff reduction',
        'Data accuracy improvement',
        'Overall efficiency gain'
      ],
      alternativeCombinations: []
    };

    return combination;
  }

  /**
   * Group subtasks by business domain
   */
  private groupSubtasksByDomain(subtaskMatches: SubtaskMatch[]): Record<string, SubtaskMatch[]> {
    const groups: Record<string, SubtaskMatch[]> = {};

    subtaskMatches.forEach(match => {
      if (!groups[match.businessDomain]) {
        groups[match.businessDomain] = [];
      }
      groups[match.businessDomain].push(match);
    });

    return groups;
  }

  /**
   * Determine implementation order for solutions
   */
  private determineImplementationOrder(solutions: Solution[]): string[] {
    // Sort by implementation priority and setup time
    const sortedSolutions = [...solutions].sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const priorityDiff = priorityOrder[b.implementationPriority] - priorityOrder[a.implementationPriority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      const setupTimeOrder = { 'Quick': 3, 'Medium': 2, 'Long': 1 };
      return setupTimeOrder[b.setupTime] - setupTimeOrder[a.setupTime];
    });

    return sortedSolutions.map(s => s.id);
  }

  /**
   * Analyze dependencies between solutions
   */
  private analyzeDependencies(solutions: Solution[]): Record<string, string[]> {
    const dependencies: Record<string, string[]> = {};

    solutions.forEach(solution => {
      dependencies[solution.id] = [];
      
      // Check for technical dependencies
      if (solution.type === 'workflow') {
        // Workflows might depend on other workflows
        const workflowDeps = this.findWorkflowDependencies(solution);
        dependencies[solution.id].push(...workflowDeps);
      }
      
      // Check for business process dependencies
      const businessDeps = this.findBusinessDependencies(solution);
      dependencies[solution.id].push(...businessDeps);
    });

    return dependencies;
  }

  /**
   * Find workflow dependencies
   */
  private findWorkflowDependencies(solution: Solution): string[] {
    if (solution.type !== 'workflow') return [];
    
    // This would analyze the actual workflow structure
    // For now, return empty array
    return [];
  }

  /**
   * Find business dependencies
   */
  private findBusinessDependencies(solution: Solution): string[] {
    // This would analyze business process dependencies
    // For now, return empty array
    return [];
  }

  /**
   * Estimate total setup time
   */
  private estimateSetupTime(solutions: Solution[]): string {
    const totalMinutes = solutions.reduce((total, solution) => {
      const setupMinutes = this.convertSetupTimeToMinutes(solution.setupTime);
      return total + setupMinutes;
    }, 0);

    if (totalMinutes <= 60) return `${totalMinutes} minutes`;
    if (totalMinutes <= 480) return `${Math.round(totalMinutes / 60)} hours`;
    return `${Math.round(totalMinutes / 480)} days`;
  }

  /**
   * Convert setup time to minutes
   */
  private convertSetupTimeToMinutes(setupTime: string): number {
    switch (setupTime) {
      case 'Quick': return 30;
      case 'Medium': return 120;
      case 'Long': return 480;
      default: return 120;
    }
  }

  /**
   * Estimate total cost
   */
  private estimateTotalCost(solutions: Solution[]): string {
    const totalCost = solutions.reduce((total, solution) => {
      const cost = this.parseCost(solution.pricing);
      return total + cost;
    }, 0);

    if (totalCost === 0) return 'Free';
    if (totalCost <= 200) return `$${totalCost}/month`;
    if (totalCost <= 1000) return `$${Math.round(totalCost / 100) * 100}/month`;
    return `$${Math.round(totalCost / 1000)}k/month`;
  }

  /**
   * Parse cost from pricing string
   */
  private parseCost(pricing?: string): number {
    if (!pricing) return 0;
    if (pricing === 'Free') return 0;
    if (pricing === 'Freemium') return 100;
    if (pricing === 'Paid') return 500;
    if (pricing === 'Enterprise') return 2000;
    return 0;
  }

  /**
   * Consolidate prerequisites from multiple solutions
   */
  private consolidatePrerequisites(solutions: Solution[]): string[] {
    const allPrerequisites = solutions.flatMap(s => 
      s.requirements.map(r => r.items).flat()
    );
    
    return [...new Set(allPrerequisites)];
  }

  /**
   * Calculate combined ROI
   */
  private calculateCombinedROI(solutions: Solution[]): string {
    const rois = solutions.map(s => this.parseROI(s.estimatedROI));
    const averageROI = rois.reduce((sum, roi) => sum + roi, 0) / rois.length;
    
    // Boost for combination benefits
    const boostedROI = Math.round(averageROI * 1.2);
    return `${boostedROI}%`;
  }

  /**
   * Parse ROI from string
   */
  private parseROI(roiString: string): number {
    const match = roiString.match(/(\d+)-(\d+)%/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return (min + max) / 2;
    }
    return 0;
  }

  /**
   * Calculate expected savings
   */
  private calculateExpectedSavings(combination: SolutionCombination): string {
    // This would calculate based on business metrics
    // For now, return a placeholder
    return '$5,000-15,000/month';
  }

  /**
   * Calculate payback period
   */
  private calculatePaybackPeriod(combination: SolutionCombination): string {
    // This would calculate based on cost and savings
    // For now, return a placeholder
    return '3-6 months';
  }

  /**
   * Initialize combination rules
   */
  private initializeCombinationRules(): void {
    this.rules = [
      {
        id: 'rule-1',
        name: 'Sequential Implementation',
        description: 'Implement solutions in sequence to reduce risk',
        conditions: [
          { field: 'solutions.length', operator: 'greater_than', value: 1 }
        ],
        recommendations: ['Start with highest priority solution', 'Test thoroughly before moving to next'],
        restrictions: ['Do not implement all solutions simultaneously'],
        priority: 1
      },
      {
        id: 'rule-2',
        name: 'Cross-Domain Integration',
        description: 'Look for opportunities to integrate across business domains',
        conditions: [
          { field: 'businessDomains', operator: 'greater_than', value: 1 }
        ],
        recommendations: ['Identify handoff points', 'Create unified data flows'],
        restrictions: ['Avoid over-engineering simple processes'],
        priority: 2
      }
    ];
  }

  /**
   * Initialize predefined combinations
   */
  private initializePredefinedCombinations(): void {
    // This would load predefined combinations from a database or configuration
    // For now, leave empty
  }

  /**
   * Get combination by ID
   */
  getCombinationById(id: string): SolutionCombination | undefined {
    return this.combinations.find(c => c.id === id);
  }

  /**
   * Get all combinations
   */
  getAllCombinations(): SolutionCombination[] {
    return [...this.combinations];
  }

  /**
   * Get combinations by category
   */
  getCombinationsByCategory(category: SolutionCategory): SolutionCombination[] {
    return this.combinations.filter(c => c.category === category);
  }

  /**
   * Get combinations by business domain
   */
  getCombinationsByBusinessDomain(domain: string): SolutionCombination[] {
    return this.combinations.filter(c => c.businessDomain === domain);
  }
}

// Factory function to create solution combinations
export const createSolutionCombinations = (): SolutionCombinations => {
  return new SolutionCombinations();
};

// Default instance
export const defaultSolutionCombinations = createSolutionCombinations();
