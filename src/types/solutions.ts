import { AIAgent } from '../lib/solutions/aiAgentsCatalog';
import { N8nWorkflow } from '../lib/n8nApi';

export type SolutionType = 'workflow' | 'agent';

export type SolutionCategory = 
  | 'HR & Recruitment'
  | 'Finance & Accounting'
  | 'Marketing & Sales'
  | 'Customer Support'
  | 'Data Analysis'
  | 'Content Creation'
  | 'Project Management'
  | 'Development & DevOps'
  | 'Research & Analysis'
  | 'Communication'
  | 'General Business';

export type SolutionDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type SolutionSetupTime = 'Quick' | 'Medium' | 'Long';
export type SolutionDeployment = 'Local' | 'Cloud' | 'Hybrid';
export type SolutionStatus = 'Active' | 'Inactive' | 'Deprecated' | 'Beta';

export interface BaseSolution {
  id: string;
  name: string;
  description: string;
  type: SolutionType;
  category: SolutionCategory;
  subcategories: string[];
  difficulty: SolutionDifficulty;
  setupTime: SolutionSetupTime;
  deployment: SolutionDeployment;
  status: SolutionStatus;
  tags: string[];
  automationPotential: number; // 0-100 percentage
  estimatedROI: string;
  timeToValue: string;
  implementationPriority: 'High' | 'Medium' | 'Low';
  createdAt: Date;
  updatedAt: Date;
  version: string;
  author: string;
  documentationUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  pricing?: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
  requirements: SolutionRequirement[];
  useCases: SolutionUseCase[];
  integrations: SolutionIntegration[];
  metrics: SolutionMetrics;
}

export interface WorkflowSolution extends BaseSolution {
  type: 'workflow';
  workflow: N8nWorkflow;
  workflowMetadata: {
    nodeCount: number;
    triggerType: string;
    executionTime: string;
    complexity: 'Simple' | 'Moderate' | 'Complex';
    dependencies: string[];
    estimatedExecutionTime: string;
  };
}

export interface AgentSolution extends BaseSolution {
  type: 'agent';
  agent: AIAgent;
  agentMetadata: {
    model: string;
    apiProvider: string;
    rateLimits: string;
    responseTime: string;
    accuracy: number; // 0-100 percentage
    trainingData: string;
    lastTraining: Date;
  };
}

export type Solution = WorkflowSolution | AgentSolution;

export interface SolutionRequirement {
  category: string;
  items: string[];
  importance: 'Required' | 'Recommended' | 'Optional';
  alternatives?: string[];
  estimatedCost?: string;
}

export interface SolutionUseCase {
  scenario: string;
  description: string;
  automationPotential: number;
  implementationEffort: 'Low' | 'Medium' | 'High';
  expectedOutcome: string;
  prerequisites: string[];
  estimatedTimeSavings: string;
  businessImpact: 'Low' | 'Medium' | 'High';
}

export interface SolutionIntegration {
  platform: string;
  type: 'API' | 'Webhook' | 'Database' | 'File' | 'Custom';
  description: string;
  setupComplexity: 'Low' | 'Medium' | 'High';
  documentationUrl?: string;
  apiKeyRequired: boolean;
  rateLimits?: string;
}

export interface SolutionMetrics {
  usageCount: number;
  successRate: number;
  averageExecutionTime: number;
  errorRate: number;
  userRating: number; // 1-5 stars
  reviewCount: number;
  lastUsed: Date;
  performanceScore: number; // 0-100
}

export interface SolutionFilter {
  type?: SolutionType;
  category?: SolutionCategory;
  difficulty?: SolutionDifficulty;
  setupTime?: SolutionSetupTime;
  deployment?: SolutionDeployment;
  status?: SolutionStatus;
  minAutomationPotential?: number;
  maxAutomationPotential?: number;
  implementationPriority?: 'High' | 'Medium' | 'Low';
  tags?: string[];
  searchQuery?: string;
  priceRange?: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
  minRating?: number;
  maxSetupTime?: number; // in minutes
}

export interface SolutionSort {
  field: 'name' | 'automationPotential' | 'estimatedROI' | 'timeToValue' | 'userRating' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface SolutionSearchResult {
  solutions: Solution[];
  totalCount: number;
  filteredCount: number;
  facets: {
    categories: Record<string, number>;
    difficulties: Record<string, number>;
    setupTimes: Record<string, number>;
    deployments: Record<string, number>;
    priorities: Record<string, number>;
    tags: Record<string, number>;
  };
}

export interface SolutionComparison {
  solutions: Solution[];
  comparisonFields: string[];
  differences: Record<string, any>;
  recommendations: string[];
}

export interface SolutionRecommendation {
  solution: Solution;
  matchScore: number; // 0-100
  reasoning: string[];
  alternatives: Solution[];
  implementationSteps: string[];
  estimatedCost: string;
  expectedROI: string;
}

export interface SolutionDeploymentStatus {
  solutionId: string;
  status: 'Not Deployed' | 'Deploying' | 'Deployed' | 'Failed' | 'Updating';
  deploymentDate?: Date;
  lastHealthCheck?: Date;
  healthStatus: 'Healthy' | 'Warning' | 'Error' | 'Unknown';
  performanceMetrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  configuration: Record<string, any>;
  logs: string[];
}

export interface SolutionTemplate {
  id: string;
  name: string;
  description: string;
  category: SolutionCategory;
  template: Partial<Solution>;
  variables: SolutionTemplateVariable[];
  instructions: string[];
  estimatedSetupTime: string;
  prerequisites: string[];
}

export interface SolutionTemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'file';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: string;
}

export interface SolutionBundle {
  id: string;
  name: string;
  description: string;
  solutions: Solution[];
  category: SolutionCategory;
  totalAutomationPotential: number;
  combinedROI: string;
  implementationOrder: string[];
  dependencies: Record<string, string[]>;
  estimatedTotalSetupTime: string;
  bundleDiscount?: number;
  prerequisites: string[];
  useCase: string;
}

export interface SolutionAnalytics {
  solutionId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  metrics: {
    executions: number;
    successRate: number;
    averageExecutionTime: number;
    errorRate: number;
    userSatisfaction: number;
    costSavings: number;
    timeSavings: number;
  };
  trends: {
    executions: 'increasing' | 'decreasing' | 'stable';
    performance: 'improving' | 'declining' | 'stable';
    usage: 'growing' | 'declining' | 'stable';
  };
  insights: string[];
  recommendations: string[];
}
