/**
 * Solution-related interfaces for the expanded task detail view
 */

import { SolutionStatus, GenerationMetadata } from '../types';

// Workflow Solution Interface
export interface WorkflowSolutionInterface {
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

// Agent Solution Interface
export interface AgentSolutionInterface {
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

// LLM Solution Interface
export interface LLMSolutionInterface {
  id: string;
  prompt: string;
  service: 'ChatGPT' | 'Claude' | 'Gemini' | 'Custom';
  style: 'formal' | 'creative' | 'technical';
  preview: string;
  status: SolutionStatus;
  isAIGenerated: boolean;
  generationMetadata?: GenerationMetadata;
}

// Solution Collection Interface
export interface SolutionCollection {
  workflows: WorkflowSolutionInterface[];
  agents: AgentSolutionInterface[];
  llms: LLMSolutionInterface[];
}

// Solution Filter Interface
export interface SolutionFilter {
  status?: SolutionStatus[];
  complexity?: ('Low' | 'Medium' | 'High')[];
  isAIGenerated?: boolean;
  service?: string[];
  technology?: string[];
}
