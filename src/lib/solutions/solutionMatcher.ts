import { Solution, SolutionType, SolutionCategory, SolutionFilter, SolutionRecommendation } from '../../types/solutions';
import { AIAgent } from './aiAgentsCatalog';
import { N8nWorkflow } from '../n8nApi';
import { mapSubtaskToAgents } from './agentCategorization';
import { getAgentRecommendationsForSubtask } from './agentSubtaskMapping';
import { WorkflowIndex, AgentIndex } from '../workflowIndexer';
import { WorkflowScoring, WorkflowScoringContext } from './workflowScoring';
import { AgentScoring, AgentScoringContext } from './agentScoring';

export interface SubtaskMatch {
  subtaskId: string;
  subtaskName: string;
  businessDomain: string;
  automationPotential: number;
  matchedSolutions: SolutionRecommendation[];
  totalMatchScore: number;
  implementationPriority: 'High' | 'Medium' | 'Low';
  estimatedROI: string;
  timeToValue: string;
}

export interface MatchingCriteria {
  automationPotentialWeight: number; // 0-1
  categoryRelevanceWeight: number; // 0-1
  difficultyMatchWeight: number; // 0-1
  setupTimeWeight: number; // 0-1
  userRatingWeight: number; // 0-1
  implementationPriorityWeight: number; // 0-1
  tagsRelevanceWeight: number; // 0-1
  businessDomainWeight: number; // 0-1
}

export interface MatchingResult {
  subtaskMatches: SubtaskMatch[];
  totalSolutions: number;
  matchedSolutions: number;
  averageMatchScore: number;
  recommendations: string[];
  implementationRoadmap: ImplementationRoadmap;
}

export interface ImplementationRoadmap {
  phases: ImplementationPhase[];
  totalEstimatedTime: string;
  totalEstimatedCost: string;
  expectedROI: string;
  criticalPath: string[];
  dependencies: Record<string, string[]>;
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  description: string;
  duration: string;
  solutions: string[];
  deliverables: string[];
  dependencies: string[];
  estimatedCost: string;
  teamMembers: string[];
}

export class SolutionMatcher {
  private defaultCriteria: MatchingCriteria = {
    automationPotentialWeight: 0.25,
    categoryRelevanceWeight: 0.20,
    difficultyMatchWeight: 0.15,
    setupTimeWeight: 0.10,
    userRatingWeight: 0.15,
    implementationPriorityWeight: 0.10,
    tagsRelevanceWeight: 0.05,
    businessDomainWeight: 0.10
  };

  private workflowScoring: WorkflowScoring;
  private agentScoring: AgentScoring;

  constructor(private customCriteria?: Partial<MatchingCriteria>) {
    if (customCriteria) {
      this.defaultCriteria = { ...this.defaultCriteria, ...customCriteria };
    }
    this.workflowScoring = new WorkflowScoring();
    this.agentScoring = new AgentScoring();
  }

  /**
   * Match solutions to subtasks based on business requirements and automation potential
   */
  matchSolutionsToSubtasks(
    subtasks: Array<{
      id: string;
      name: string;
      businessDomain: string;
      automationPotential: number;
      keywords: string[];
      category: string;
    }>,
    solutions: Solution[]
  ): MatchingResult {
    const subtaskMatches: SubtaskMatch[] = [];
    let totalMatchScore = 0;
    let matchedSolutionsCount = 0;

    for (const subtask of subtasks) {
      const matchedSolutions = this.findMatchingSolutions(subtask, solutions);
      const subtaskTotalScore = matchedSolutions.reduce((sum, rec) => sum + rec.matchScore, 0);
      const averageMatchScore = matchedSolutions.length > 0 ? subtaskTotalScore / matchedSolutions.length : 0;

      const subtaskMatch: SubtaskMatch = {
        subtaskId: subtask.id,
        subtaskName: subtask.name,
        businessDomain: subtask.businessDomain,
        automationPotential: subtask.automationPotential,
        matchedSolutions,
        totalMatchScore: averageMatchScore,
        implementationPriority: this.determineImplementationPriority(averageMatchScore, subtask.automationPotential),
        estimatedROI: this.calculateEstimatedROI(matchedSolutions),
        timeToValue: this.calculateTimeToValue(matchedSolutions)
      };

      subtaskMatches.push(subtaskMatch);
      totalMatchScore += averageMatchScore;
      matchedSolutionsCount += matchedSolutions.length;
    }

    const averageMatchScore = subtaskMatches.length > 0 ? totalMatchScore / subtaskMatches.length : 0;
    const implementationRoadmap = this.createImplementationRoadmap(subtaskMatches);

    return {
      subtaskMatches,
      totalSolutions: solutions.length,
      matchedSolutions: matchedSolutionsCount,
      averageMatchScore,
      recommendations: this.generateRecommendations(subtaskMatches),
      implementationRoadmap
    };
  }

  /**
   * Find matching solutions for a specific subtask
   */
  private findMatchingSolutions(
    subtask: {
      id: string;
      name: string;
      businessDomain: string;
      automationPotential: number;
      keywords: string[];
      category: string;
    },
    solutions: Solution[]
  ): SolutionRecommendation[] {
    const recommendations: SolutionRecommendation[] = [];

    for (const solution of solutions) {
      const matchScore = this.calculateMatchScore(subtask, solution);
      
      if (matchScore > 30) { // Minimum threshold for relevance
        const recommendation: SolutionRecommendation = {
          solution,
          matchScore,
          reasoning: this.generateReasoning(subtask, solution, matchScore),
          alternatives: this.findAlternatives(solution, solutions, subtask),
          implementationSteps: this.generateImplementationSteps(solution),
          estimatedCost: this.estimateImplementationCost(solution),
          expectedROI: solution.estimatedROI
        };

        recommendations.push(recommendation);
      }
    }

    // Sort by match score descending
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate match score between subtask and solution
   */
  private calculateMatchScore(
    subtask: {
      id: string;
      name: string;
      businessDomain: string;
      automationPotential: number;
      keywords: string[];
      category: string;
    },
    solution: Solution
  ): number {
    let totalScore = 0;
    const criteria = this.defaultCriteria;

    // Automation potential match (0-100)
    const automationScore = this.calculateAutomationPotentialScore(subtask.automationPotential, solution.automationPotential);
    totalScore += automationScore * criteria.automationPotentialWeight;

    // Category relevance (0-100)
    const categoryScore = this.calculateCategoryRelevanceScore(subtask.category, solution.category);
    totalScore += categoryScore * criteria.categoryRelevanceWeight;

    // Difficulty match (0-100)
    const difficultyScore = this.calculateDifficultyMatchScore(subtask, solution);
    totalScore += difficultyScore * criteria.difficultyMatchWeight;

    // Setup time consideration (0-100)
    const setupTimeScore = this.calculateSetupTimeScore(solution.setupTime);
    totalScore += setupTimeScore * criteria.setupTimeWeight;

    // User rating (0-100)
    const ratingScore = solution.metrics.userRating * 20; // Convert 1-5 to 0-100
    totalScore += ratingScore * criteria.userRatingWeight;

    // Implementation priority (0-100)
    const priorityScore = this.calculatePriorityScore(solution.implementationPriority);
    totalScore += priorityScore * criteria.implementationPriorityWeight;

    // Tags relevance (0-100)
    const tagsScore = this.calculateTagsRelevanceScore(subtask.keywords, solution.tags);
    totalScore += tagsScore * criteria.tagsRelevanceWeight;

    // Business domain match (0-100)
    const domainScore = this.calculateBusinessDomainScore(subtask.businessDomain, solution.category);
    totalScore += domainScore * criteria.businessDomainWeight;

    return Math.round(totalScore);
  }

  private calculateAutomationPotentialScore(subtaskPotential: number, solutionPotential: number): number {
    const difference = Math.abs(subtaskPotential - solutionPotential);
    if (difference <= 10) return 100; // Excellent match
    if (difference <= 25) return 80;  // Good match
    if (difference <= 40) return 60;  // Fair match
    if (difference <= 60) return 40;  // Poor match
    return 20; // Very poor match
  }

  private calculateCategoryRelevanceScore(subtaskCategory: string, solutionCategory: string): number {
    if (subtaskCategory.toLowerCase() === solutionCategory.toLowerCase()) return 100;
    
    // Check for partial matches
    const subtaskWords = subtaskCategory.toLowerCase().split(' ');
    const solutionWords = solutionCategory.toLowerCase().split(' ');
    
    const commonWords = subtaskWords.filter(word => solutionWords.includes(word));
    if (commonWords.length > 0) return 70;
    
    return 30;
  }

  private calculateDifficultyMatchScore(
    subtask: { businessDomain: string; automationPotential: number },
    solution: Solution
  ): number {
    // Simple heuristic: higher automation potential tasks might need more advanced solutions
    if (subtask.automationPotential >= 80 && solution.difficulty === 'Advanced') return 100;
    if (subtask.automationPotential >= 60 && solution.difficulty === 'Intermediate') return 100;
    if (subtask.automationPotential < 60 && solution.difficulty === 'Beginner') return 100;
    
    return 60; // Default score for moderate matches
  }

  private calculateSetupTimeScore(setupTime: string): number {
    switch (setupTime) {
      case 'Quick': return 100;
      case 'Medium': return 70;
      case 'Long': return 40;
      default: return 50;
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

  private calculateTagsRelevanceScore(subtaskKeywords: string[], solutionTags: string[]): number {
    if (subtaskKeywords.length === 0 || solutionTags.length === 0) return 50;
    
    const matchingTags = subtaskKeywords.filter(keyword =>
      solutionTags.some(tag => 
        tag.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(tag.toLowerCase())
      )
    );
    
    return (matchingTags.length / subtaskKeywords.length) * 100;
  }

  private calculateBusinessDomainScore(subtaskDomain: string, solutionCategory: string): number {
    const domainMapping: Record<string, string[]> = {
      'HR': ['HR & Recruitment'],
      'Finance': ['Finance & Accounting'],
      'Marketing': ['Marketing & Sales'],
      'Sales': ['Marketing & Sales'],
      'Support': ['Customer Support'],
      'Analytics': ['Data Analysis', 'Research & Analysis'],
      'Operations': ['Project Management', 'Communication', 'General Business'],
      'Development': ['Development & DevOps'],
      'Content': ['Content Creation']
    };

    const mappedCategories = domainMapping[subtaskDomain] || [];
    if (mappedCategories.includes(solutionCategory)) return 100;
    
    return 30; // Default score for non-matching domains
  }

  private generateReasoning(
    subtask: { name: string; businessDomain: string; automationPotential: number },
    solution: Solution,
    matchScore: number
  ): string[] {
    const reasoning: string[] = [];

    if (matchScore >= 80) {
      reasoning.push(`Excellent match for ${subtask.name} with ${matchScore}% relevance`);
    } else if (matchScore >= 60) {
      reasoning.push(`Good match for ${subtask.name} with ${matchScore}% relevance`);
    } else {
      reasoning.push(`Moderate match for ${subtask.name} with ${matchScore}% relevance`);
    }

    if (solution.automationPotential >= subtask.automationPotential * 0.8) {
      reasoning.push(`High automation potential (${solution.automationPotential}%) matches task requirements`);
    }

    if (solution.category.toLowerCase().includes(subtask.businessDomain.toLowerCase())) {
      reasoning.push(`Business domain alignment: ${solution.category} matches ${subtask.businessDomain}`);
    }

    if (solution.implementationPriority === 'High') {
      reasoning.push('High implementation priority indicates proven effectiveness');
    }

    return reasoning;
  }

  private findAlternatives(solution: Solution, allSolutions: Solution[], subtask: any): Solution[] {
    return allSolutions
      .filter(s => s.id !== solution.id && s.type === solution.type)
      .filter(s => s.category === solution.category || s.subcategories.some(sub => sub === subtask.category))
      .slice(0, 3); // Return top 3 alternatives
  }

  private generateImplementationSteps(solution: Solution): string[] {
    const baseSteps = [
      'Review solution requirements and prerequisites',
      'Set up necessary integrations and API keys',
      'Configure solution parameters and settings',
      'Test with sample data or scenarios',
      'Deploy to production environment',
      'Monitor performance and gather feedback'
    ];

    if (solution.type === 'workflow') {
      baseSteps.splice(2, 0, 'Import workflow configuration to n8n');
    } else if (solution.type === 'agent') {
      baseSteps.splice(2, 0, 'Configure AI agent parameters and training data');
    }

    return baseSteps;
  }

  private estimateImplementationCost(solution: Solution): string {
    if (solution.pricing === 'Free') return 'No additional cost';
    if (solution.pricing === 'Freemium') return '$50-200/month';
    if (solution.pricing === 'Paid') return '$200-1000/month';
    if (solution.pricing === 'Enterprise') return '$1000+/month';
    return 'Cost varies based on usage';
  }

  private determineImplementationPriority(matchScore: number, automationPotential: number): 'High' | 'Medium' | 'Low' {
    if (matchScore >= 80 && automationPotential >= 70) return 'High';
    if (matchScore >= 60 && automationPotential >= 50) return 'Medium';
    return 'Low';
  }

  private calculateEstimatedROI(recommendations: SolutionRecommendation[]): string {
    if (recommendations.length === 0) return 'N/A';
    
    const rois = recommendations.map(r => {
      const roiStr = r.solution.estimatedROI;
      const match = roiStr.match(/(\d+)-(\d+)%/);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        return (min + max) / 2;
      }
      return 0;
    });

    const averageROI = rois.reduce((sum, roi) => sum + roi, 0) / rois.length;
    return `${Math.round(averageROI)}%`;
  }

  private calculateTimeToValue(recommendations: SolutionRecommendation[]): string {
    if (recommendations.length === 0) return 'N/A';
    
    const times = recommendations.map(r => r.solution.timeToValue);
    const mostCommon = times.sort((a, b) => 
      times.filter(v => v === a).length - times.filter(v => v === b).length
    ).pop();
    
    return mostCommon || '2-4 weeks';
  }

  private generateRecommendations(subtaskMatches: SubtaskMatch[]): string[] {
    const recommendations: string[] = [];
    
    const highPriorityMatches = subtaskMatches.filter(m => m.implementationPriority === 'High');
    if (highPriorityMatches.length > 0) {
      recommendations.push(`Focus on ${highPriorityMatches.length} high-priority solutions for immediate ROI`);
    }

    const highROIMatches = subtaskMatches.filter(m => {
      const roi = parseInt(m.estimatedROI.replace('%', ''));
      return roi >= 300;
    });
    if (highROIMatches.length > 0) {
      recommendations.push(`${highROIMatches.length} solutions offer 300%+ ROI - prioritize these`);
    }

    const quickWins = subtaskMatches.filter(m => 
      m.matchedSolutions.some(s => s.solution.setupTime === 'Quick')
    );
    if (quickWins.length > 0) {
      recommendations.push(`${quickWins.length} quick-win solutions available for rapid implementation`);
    }

    return recommendations;
  }

  private createImplementationRoadmap(subtaskMatches: SubtaskMatch[]): ImplementationRoadmap {
    const highPriorityMatches = subtaskMatches.filter(m => m.implementationPriority === 'High');
    const mediumPriorityMatches = subtaskMatches.filter(m => m.implementationPriority === 'Medium');
    const lowPriorityMatches = subtaskMatches.filter(m => m.implementationPriority === 'Low');

    const phases: ImplementationPhase[] = [
      {
        phase: 1,
        name: 'Quick Wins & High ROI',
        description: 'Implement high-priority solutions with quick setup times',
        duration: '2-4 weeks',
        solutions: highPriorityMatches.map(m => m.subtaskName),
        deliverables: ['Working automations', 'Initial ROI measurement', 'User training'],
        dependencies: [],
        estimatedCost: '$500-2000',
        teamMembers: ['Automation Specialist', 'Business Analyst']
      },
      {
        phase: 2,
        name: 'Medium Priority Solutions',
        description: 'Implement medium-priority solutions with moderate complexity',
        duration: '4-8 weeks',
        solutions: mediumPriorityMatches.map(m => m.subtaskName),
        deliverables: ['Enhanced automations', 'Process documentation', 'Performance metrics'],
        dependencies: ['Phase 1 completion'],
        estimatedCost: '$2000-5000',
        teamMembers: ['Automation Specialist', 'Business Analyst', 'IT Support']
      },
      {
        phase: 3,
        name: 'Advanced Solutions & Optimization',
        description: 'Implement complex solutions and optimize existing automations',
        duration: '6-12 weeks',
        solutions: lowPriorityMatches.map(m => m.subtaskName),
        deliverables: ['Advanced automations', 'Optimization reports', 'ROI analysis'],
        dependencies: ['Phase 2 completion'],
        estimatedCost: '$3000-8000',
        teamMembers: ['Automation Specialist', 'Business Analyst', 'IT Support', 'Data Analyst']
      }
    ];

    const totalEstimatedTime = '12-24 weeks';
    const totalEstimatedCost = '$5500-15000';
    const expectedROI = '200-400%';

    const criticalPath = [
      'Phase 1: Quick Wins & High ROI',
      'Phase 2: Medium Priority Solutions',
      'Phase 3: Advanced Solutions & Optimization'
    ];

    const dependencies: Record<string, string[]> = {
      'Phase 2': ['Phase 1'],
      'Phase 3': ['Phase 2']
    };

    return {
      phases,
      totalEstimatedTime,
      totalEstimatedCost,
      expectedROI,
      criticalPath,
      dependencies
    };
  }

  /**
   * Score workflows using the new numeric scoring system
   */
  scoreWorkflows(
    workflows: WorkflowIndex[],
    context: WorkflowScoringContext = {}
  ): Array<{ workflow: WorkflowIndex; score: number; reasoning: string[] }> {
    return workflows.map(workflow => {
      const workflowScore = this.workflowScoring.calculateWorkflowScore(workflow, context);
      return {
        workflow,
        score: workflowScore.overallScore,
        reasoning: workflowScore.reasoning
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Score agents using the tier-based scoring system
   */
  scoreAgents(
    agents: AgentIndex[],
    context: AgentScoringContext = {}
  ): Array<{ agent: AgentIndex; tier: string; score: number; reasoning: string[]; disclaimer: string }> {
    return agents.map(agent => {
      const agentScore = this.agentScoring.calculateAgentScore(agent, context);
      return {
        agent,
        tier: agentScore.tier,
        score: agentScore.overallScore,
        reasoning: agentScore.reasoning,
        disclaimer: agentScore.disclaimer
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Get solution recommendations for a specific subtask
   */
  getRecommendationsForSubtask(subtaskId: string, solutions: Solution[]): SolutionRecommendation[] {
    // This would be implemented based on the specific subtask requirements
    // For now, return a generic recommendation
    return solutions
      .filter(s => s.status === 'Active')
      .map(s => ({
        solution: s,
        matchScore: 75, // Default score
        reasoning: ['General recommendation based on solution availability'],
        alternatives: [],
        implementationSteps: this.generateImplementationSteps(s),
        estimatedCost: this.estimateImplementationCost(s),
        expectedROI: s.estimatedROI
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }
}

// Factory function to create solution matcher
export const createSolutionMatcher = (criteria?: Partial<MatchingCriteria>): SolutionMatcher => {
  return new SolutionMatcher(criteria);
};

// Default matcher instance
export const defaultSolutionMatcher = createSolutionMatcher();
