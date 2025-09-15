/**
 * Shared types for the application
 */

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
