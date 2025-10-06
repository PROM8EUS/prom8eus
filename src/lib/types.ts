/**
 * Shared types for the application
 */

// Solution Status Types
export type SolutionStatus = 'generated' | 'verified' | 'fallback';

// Generation Metadata
export interface GenerationMetadata {
  timestamp: number;
  model: string;
  language: 'de' | 'en';
  cacheKey: string;
}

// Workflow Solution Types - DEPRECATED: Use UnifiedWorkflow instead
export interface WorkflowSolution {
  id: string;
  name: string;
  description: string;
  steps: string[];
  status: SolutionStatus;
  integrations: string[];
  complexity: 'Low' | 'Medium' | 'High';
  setupCost: number;
  isAIGenerated: boolean;
  generationMetadata?: GenerationMetadata;
  downloadUrl?: string;
  validationStatus?: 'valid' | 'invalid';
}

// Re-export UnifiedWorkflow for convenience
export { UnifiedWorkflow, WorkflowCreationContext, WorkflowSearchParams } from './schemas/unifiedWorkflow';

// Agent Solution Types
export interface AgentSolution {
  id: string;
  name: string;
  description: string;
  functions: string[];
  tools: string[];
  technology: string;
  status: SolutionStatus;
  complexity: 'Low' | 'Medium' | 'High';
  setupCost: number;
  isAIGenerated: boolean;
  generationMetadata?: GenerationMetadata;
}

// LLM Solution Types
export interface LLMSolution {
  id: string;
  prompt: string;
  service: 'ChatGPT' | 'Claude' | 'Gemini' | 'Custom';
  style: 'formal' | 'creative' | 'technical';
  preview: string;
  status: SolutionStatus;
  isAIGenerated: boolean;
  generationMetadata?: GenerationMetadata;
}

// Status Badge Types
export type BadgeStatus = 'ai-generated' | 'verified' | 'fallback' | 'loading';

export interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

// Generation Context Types
export interface GenerationContext {
  subtaskId: string;
  language: 'de' | 'en';
  timeout: number;
}

// Cache Entry Types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// Error Context Types
export interface ErrorContext {
  code: string;
  message: string;
  retryable: boolean;
  suggestions: string[];
}

export interface DynamicSubtask {
  id: string;
  title: string;
  description: string;
  automationPotential: number;
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'low' | 'medium' | 'high';
  systems: string[];
  dependencies: string[];
  risks: string[];
  opportunities: string[];
  aiTools?: string[];
  // New properties for expanded task detail view
  selectedSubtaskId?: string | null;
  activeTab?: 'workflows' | 'agents' | 'llms';
  generationStatus?: 'idle' | 'generating' | 'completed' | 'error';
  setupCost?: number;
  roiMonths?: number;
  isExpanded?: boolean;
}

export interface FastAnalysisResult {
  text: string;
  automationPotential: number;
  confidence: number;
  pattern: string;
  category: string;
  complexity?: 'low' | 'medium' | 'high';
  trend?: 'increasing' | 'stable' | 'decreasing';
  systems?: string[];
  label?: 'Automatisierbar' | 'Teilweise Automatisierbar' | 'Mensch';
  reasoning: string;
  analysisTime?: number;
  subtasks?: DynamicSubtask[];
  businessCase?: {
    manualHours: number;
    automatedHours: number;
    automationPotential: number;
    savedHours: number;
    setupCostHours: number;
    setupCostMoney: number;
    roi: number;
    paybackPeriodYears: number;
    hourlyRateEmployee: number;
    hourlyRateFreelancer: number;
    employmentType: 'employee' | 'freelancer';
    reasoning: string;
  };
  solutions?: {
    workflows: Array<{
      id: string;
      name: string;
      description: string;
      automationPotential: number;
      setupTime: string;
      cost: string;
      systems: string[];
      benefits: string[];
    }>;
    agents: Array<{
      id: string;
      name: string;
      technology: string;
      implementation: string;
      difficulty: string;
      setupTime: string;
      benefits: string[];
    }>;
  };
}
