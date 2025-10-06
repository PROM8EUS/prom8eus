/**
 * Shared types for the analysis pipeline
 */

export interface FastAnalysisResult {
  text: string;
  automationPotential: number;
  confidence: number;
  category: string;
  pattern: string;
  reasoning?: string;
  subtasks?: Array<{
    id: string;
    title: string;
    description: string;
    automationPotential: number;
    estimatedTime: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'low' | 'medium' | 'high';
    systems: string[];
    risks: string[];
    opportunities: string[];
    dependencies: string[];
  }>;
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
  } | null;
  complexity?: 'low' | 'medium' | 'high';
  trend?: 'increasing' | 'stable' | 'decreasing';
  systems?: string[];
  label?: string;
  analysisTime?: number;
}

export interface AnalysisPipelineConfig {
  useAI: boolean;
  fallbackEnabled: boolean;
  timeoutMs: number;
  maxRetries: number;
  lang: 'de' | 'en';
}

export interface AnalysisError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}
