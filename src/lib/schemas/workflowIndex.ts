/**
 * Workflow Index Schema
 * 
 * Core interfaces and types for workflow indexing
 */

import { AuthorInfo, DomainClassification } from './common';

export interface WorkflowIndex {
  // Mandatory core fields (PRD requirement)
  id: string; // Changed from number to string for consistency
  source: string; // Added: source identifier (github, n8n.io, etc.)
  title: string; // Added: renamed from 'name' for consistency
  summary: string; // Added: renamed from 'description' for consistency  
  link: string; // Added: URL to the workflow source
  
  // Workflow-specific mandatory fields
  category: string;
  integrations: string[];
  complexity: 'Low' | 'Medium' | 'High';
  
  // Optional fields with fallbacks
  filename?: string;
  active?: boolean;
  triggerType?: 'Complex' | 'Webhook' | 'Manual' | 'Scheduled';
  nodeCount?: number;
  tags?: string[];
  fileHash?: string;
  analyzedAt?: string;
  license?: string; // Added: license information with fallback 'Unknown'
  
  // Author metadata (optional, populated for n8n.io)
  author?: AuthorInfo;

  // Domain classification (LLM-based)
  domainClassification?: DomainClassification;
}

export interface AgentIndex {
  // Mandatory core fields (PRD requirement)
  id: string;
  source: string; // source identifier (crewai, hf-spaces, etc.)
  title: string;
  summary: string;
  link: string;
  
  // Agent-specific mandatory fields
  model: string; // model/provider (e.g., "GPT-4", "Claude", "OpenAI")
  provider: string; // API provider (e.g., "OpenAI", "Anthropic", "HuggingFace")
  capabilities: string[]; // standardized capability tags
  
  // Optional fields with fallbacks
  category?: string;
  tags?: string[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  setupTime?: 'Quick' | 'Medium' | 'Long';
  deployment?: 'Local' | 'Cloud' | 'Hybrid';
  license?: string; // license information with fallback 'Unknown'
  pricing?: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
  requirements?: string[];
  useCases?: string[];
  automationPotential?: number; // 0-100 percentage
  
  // Author metadata (optional)
  author?: AuthorInfo;
  
  // Source-specific metadata
  likes?: number;
  downloads?: number;
  lastModified?: string;
  githubUrl?: string;
  demoUrl?: string;
  documentationUrl?: string;

  // Domain classification (LLM-based)
  domainClassification?: DomainClassification;
}

// Unified solution type for both workflows and agents
export type SolutionIndex = WorkflowIndex | AgentIndex;

// Type guards to distinguish between workflow and agent solutions
export function isWorkflowIndex(solution: SolutionIndex): solution is WorkflowIndex {
  return 'category' in solution && 'integrations' in solution && 'complexity' in solution;
}

export function isAgentIndex(solution: SolutionIndex): solution is AgentIndex {
  return 'model' in solution && 'provider' in solution && 'capabilities' in solution;
}
