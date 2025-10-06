/**
 * N8N Workflow Schema
 * 
 * Core interfaces and types for n8n workflow data
 */

export interface N8nWorkflow {
  id: string;
  name: string; // Changed from title to name
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard'; // Changed to match the implementation
  estimatedTime: string; // Changed from number to string (e.g., "2 h", "30 min")
  estimatedCost: string; // Changed from number to string (e.g., "€100")
  nodes: number;
  connections: number;
  downloads: number;
  rating: number;
  createdAt: string;
  url: string;
  jsonUrl: string;
  active: boolean;
  triggerType: string;
  integrations: string[]; // Added integrations array
  author?: string; // Optional author field
}

export interface N8nApiResponse {
  workflows: N8nWorkflow[];
  total: number;
  page: number;
  limit: number;
}

export interface N8nWorkflowFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export interface N8nCategory {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export interface N8nWorkflowMetadata {
  name: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: string;
  estimatedCost: string;
  nodes: number;
  connections: number;
  downloads: number;
  rating: number;
  createdAt: string;
  url: string;
  jsonUrl: string;
  active: boolean;
  triggerType: string;
  integrations: string[];
  author?: string;
}
