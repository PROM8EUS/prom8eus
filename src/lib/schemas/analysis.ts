/**
 * Analysis Schema Definitions
 * 
 * Interfaces and types for analysis-related functionality
 */

import { AuthorInfo, GenerationMetadata } from './common';

// Task analysis
export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  complexity: 'Low' | 'Medium' | 'High';
  estimatedTime: string;
  estimatedCost: string;
  automationPotential: number; // 0-100 percentage
  manualHoursPerPeriod: number;
  hourlyRate: number;
  costBeforeAutomation: number;
  residualHours: number;
  costAfterAutomation: number;
  timeSavings: number;
  costSavings: number;
  roi: number;
  tags: string[];
  dependencies?: string[];
  prerequisites?: string[];
  deliverables?: string[];
  successCriteria?: string[];
  risks?: string[];
  mitigationStrategies?: string[];
}

// Subtask analysis
export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  description: string;
  automationPotential: number;
  estimatedTime: string;
  complexity: 'Low' | 'Medium' | 'High';
  category: string;
  tags: string[];
  dependencies?: string[];
  order: number;
  isOptional: boolean;
  deliverables?: string[];
  successCriteria?: string[];
}

// Analysis result
export interface AnalysisResult {
  id: string;
  originalText: string;
  jobTitle?: string;
  tasks: Task[];
  subtasks: Subtask[];
  totalTasks: number;
  totalSubtasks: number;
  averageAutomationPotential: number;
  totalTimeSavings: number;
  totalCostSavings: number;
  overallROI: number;
  analysisMetadata: {
    timestamp: number;
    model: string;
    language: 'de' | 'en';
    processingTime: number;
    confidence: number;
    version: string;
  };
  createdAt: string;
  updatedAt: string;
  status: 'completed' | 'processing' | 'failed';
  error?: string;
}

// Agent recommendation
export interface AgentRecommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  model: string;
  provider: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  setupTime: 'Quick' | 'Medium' | 'Long';
  deployment: 'Local' | 'Cloud' | 'Hybrid';
  pricing: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
  requirements: string[];
  useCases: string[];
  automationPotential: number;
  relevanceScore: number;
  compatibilityScore: number;
  effortScore: number;
  costScore: number;
  overallScore: number;
  author?: AuthorInfo;
  source: string;
  sourceUrl: string;
  documentationUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  tags: string[];
  verified: boolean;
  rating?: number;
  downloads?: number;
  lastModified?: string;
  createdAt: string;
  updatedAt: string;
}

// Solution recommendation
export interface SolutionRecommendation {
  id: string;
  type: 'workflow' | 'agent' | 'tool' | 'integration';
  title: string;
  description: string;
  category: string;
  source: string;
  sourceUrl: string;
  relevanceScore: number;
  compatibilityScore: number;
  effortScore: number;
  costScore: number;
  overallScore: number;
  automationPotential: number;
  estimatedTime: string;
  estimatedCost: string;
  timeSavings: number;
  costSavings: number;
  roi: number;
  tags: string[];
  integrations: string[];
  requirements: string[];
  prerequisites: string[];
  deliverables: string[];
  successCriteria: string[];
  risks: string[];
  mitigationStrategies: string[];
  author?: AuthorInfo;
  verified: boolean;
  rating?: number;
  downloads?: number;
  lastModified?: string;
  createdAt: string;
  updatedAt: string;
}

// Pilot feedback
export interface PilotFeedback {
  id: string;
  analysisId: string;
  userId: string;
  sessionId: string;
  feedbackType: 'rating' | 'comment' | 'suggestion' | 'issue';
  rating?: number; // 1-5
  comment?: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  isAnonymous: boolean;
  metadata: {
    userAgent: string;
    timestamp: number;
    version: string;
    source: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Pilot feedback session
export interface PilotFeedbackSession {
  id: string;
  analysisId: string;
  userId: string;
  sessionData: {
    startTime: number;
    endTime: number;
    duration: number;
    pagesViewed: string[];
    actionsPerformed: string[];
    feedbackGiven: string[];
  };
  overallRating: number;
  overallComment?: string;
  wouldRecommend: boolean;
  improvementSuggestions?: string[];
  createdAt: string;
  updatedAt: string;
}

// Implementation request
export interface ImplementationRequest {
  id: string;
  analysisId: string;
  userId: string;
  requestType: 'workflow' | 'agent' | 'integration' | 'custom';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimatedEffort: string;
  estimatedCost: string;
  requirements: string[];
  constraints: string[];
  deliverables: string[];
  successCriteria: string[];
  timeline: {
    startDate: string;
    endDate: string;
    milestones: Array<{
      title: string;
      date: string;
      status: 'pending' | 'completed' | 'overdue';
    }>;
  };
  assignedTo?: string;
  progress: number; // 0-100
  notes: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Implementation request stats
export interface ImplementationRequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  averageCompletionTime: number;
  averageCost: number;
  successRate: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
}

// Shared analysis data
export interface SharedAnalysisData {
  originalText: string;
  jobTitle?: string;
  createdAt?: string;
  views?: number;
  analysisId: string;
  shareId: string;
  isPublic: boolean;
  allowComments: boolean;
  tags: string[];
  category: string;
  author?: AuthorInfo;
  metadata: {
    version: string;
    source: string;
    language: 'de' | 'en';
    processingTime: number;
  };
}

// Store analysis request
export interface StoreAnalysisRequest {
  shareId: string;
  analysisData: SharedAnalysisData;
  expiresAt?: string;
  maxViews?: number;
  password?: string;
  allowDownload: boolean;
  allowComments: boolean;
  notifyOnView: boolean;
  notifyOnComment: boolean;
}
