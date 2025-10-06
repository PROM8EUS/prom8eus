/**
 * Catalog Schema Definitions
 * 
 * Interfaces and types for catalog-related functionality
 */

// Catalog task
export type CatalogTask = {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  complexity: 'Low' | 'Medium' | 'High';
  estimatedTime: string;
  estimatedCost: string;
  automationPotential: number;
  tags: string[];
  requirements: string[];
  deliverables: string[];
  successCriteria: string[];
  risks: string[];
  mitigationStrategies: string[];
};

// Catalog
export type Catalog = {
  id: string;
  name: string;
  description: string;
  version: string;
  tasks: CatalogTask[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    author: string;
    source: string;
    language: 'de' | 'en';
    totalTasks: number;
    categories: string[];
    tags: string[];
  };
};

// Job catalog entry
export interface JobCatalogEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  location?: string;
  remote?: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  skills: string[];
  tools: string[];
  technologies: string[];
  automationPotential: number;
  timeSavings: number;
  costSavings: number;
  roi: number;
  tags: string[];
  source: string;
  sourceUrl: string;
  postedAt: string;
  expiresAt?: string;
  isActive: boolean;
  isVerified: boolean;
  rating?: number;
  views: number;
  applications: number;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    language: 'de' | 'en';
    processingTime: number;
    confidence: number;
  };
}

// Agent catalog entry
export interface AgentCatalogEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  model: string;
  provider: string;
  capabilities: string[];
  useCases: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  setupTime: 'Quick' | 'Medium' | 'Long';
  deployment: 'Local' | 'Cloud' | 'Hybrid';
  pricing: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
  requirements: string[];
  integrations: string[];
  automationPotential: number;
  timeSavings: number;
  costSavings: number;
  roi: number;
  tags: string[];
  source: string;
  sourceUrl: string;
  documentationUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  author?: {
    name: string;
    username: string;
    avatar?: string;
    verified: boolean;
  };
  verified: boolean;
  rating?: number;
  downloads: number;
  views: number;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    version: string;
    language: 'de' | 'en';
    processingTime: number;
    confidence: number;
  };
}

// Workflow catalog entry
export interface WorkflowCatalogEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  complexity: 'Low' | 'Medium' | 'High';
  estimatedTime: string;
  estimatedCost: string;
  nodes: number;
  connections: number;
  triggerType: 'Manual' | 'Scheduled' | 'Webhook' | 'Event';
  integrations: string[];
  automationPotential: number;
  timeSavings: number;
  costSavings: number;
  roi: number;
  tags: string[];
  source: string;
  sourceUrl: string;
  jsonUrl: string;
  author?: {
    name: string;
    username: string;
    avatar?: string;
    verified: boolean;
  };
  verified: boolean;
  rating?: number;
  downloads: number;
  views: number;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    version: string;
    language: 'de' | 'en';
    processingTime: number;
    confidence: number;
  };
}

// Tool catalog entry
export interface ToolCatalogEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  type: 'api' | 'library' | 'service' | 'platform' | 'framework';
  provider: string;
  capabilities: string[];
  useCases: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  setupTime: 'Quick' | 'Medium' | 'Long';
  deployment: 'Local' | 'Cloud' | 'Hybrid';
  pricing: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
  requirements: string[];
  integrations: string[];
  automationPotential: number;
  timeSavings: number;
  costSavings: number;
  roi: number;
  tags: string[];
  source: string;
  sourceUrl: string;
  documentationUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  author?: {
    name: string;
    username: string;
    avatar?: string;
    verified: boolean;
  };
  verified: boolean;
  rating?: number;
  downloads: number;
  views: number;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    version: string;
    language: 'de' | 'en';
    processingTime: number;
    confidence: number;
  };
}

// Catalog search parameters
export interface CatalogSearchParams {
  query?: string;
  category?: string;
  subcategory?: string;
  type?: 'job' | 'agent' | 'workflow' | 'tool';
  complexity?: 'Low' | 'Medium' | 'High';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  pricing?: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
  tags?: string[];
  source?: string;
  verified?: boolean;
  minRating?: number;
  minAutomationPotential?: number;
  minTimeSavings?: number;
  minCostSavings?: number;
  minROI?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'relevance' | 'rating' | 'downloads' | 'views' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Catalog statistics
export interface CatalogStats {
  totalEntries: number;
  byType: {
    jobs: number;
    agents: number;
    workflows: number;
    tools: number;
  };
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  byComplexity: Record<string, number>;
  byDifficulty: Record<string, number>;
  byPricing: Record<string, number>;
  averageRating: number;
  averageAutomationPotential: number;
  averageTimeSavings: number;
  averageCostSavings: number;
  averageROI: number;
  totalDownloads: number;
  totalViews: number;
  verifiedEntries: number;
  lastUpdated: string;
}
