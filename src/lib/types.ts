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
  complexity: 'low' | 'medium' | 'high';
  trend: 'increasing' | 'stable' | 'decreasing';
  systems: string[];
  label: 'Automatisierbar' | 'Teilweise Automatisierbar' | 'Mensch';
  reasoning: string;
  analysisTime: number;
  subtasks?: DynamicSubtask[];
}
