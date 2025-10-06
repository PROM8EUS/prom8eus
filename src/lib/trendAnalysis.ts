/**
 * Trend Analysis Utility
 * Analyzes automation trends from workflows, solutions, and market data
 */

import { WorkflowIndex } from './schemas/workflowIndex';
import { N8nWorkflow } from './n8nApi';
import { DynamicSubtask } from './types';

export interface TrendInsight {
  id: string;
  technology: string;
  trend: 'growing' | 'stable' | 'declining';
  percentage?: number;
  description: string;
  confidence: number; // 0-100
  category: string;
  relatedIntegrations: string[];
}

export interface TrendAnalysisOptions {
  timeWindow?: number; // days to look back (default 90)
  minWorkflows?: number; // minimum workflows to establish trend (default 3)
  includeCategory?: string;
}

/**
 * Analyze trends from workflows and subtasks
 */
export function analyzeTrends(
  workflows: (WorkflowIndex | N8nWorkflow)[],
  subtasks: DynamicSubtask[],
  options: TrendAnalysisOptions = {}
): TrendInsight[] {
  const {
    timeWindow = 90,
    minWorkflows = 3,
    includeCategory
  } = options;

  const insights: TrendInsight[] = [];

  // 1. Analyze technology/integration trends
  const techTrends = analyzeTechnologyTrends(workflows, timeWindow, minWorkflows);
  insights.push(...techTrends);

  // 2. Analyze category trends
  const categoryTrends = analyzeCategoryTrends(workflows, includeCategory);
  insights.push(...categoryTrends);

  // 3. Analyze subtask-specific trends
  const subtaskTrends = analyzeSubtaskTrends(subtasks, workflows);
  insights.push(...subtaskTrends);

  // Sort by confidence and relevance
  insights.sort((a, b) => b.confidence - a.confidence);

  // Return top insights (max 5)
  return insights.slice(0, 5);
}

/**
 * Analyze technology/integration adoption trends
 */
function analyzeTechnologyTrends(
  workflows: (WorkflowIndex | N8nWorkflow)[],
  timeWindow: number,
  minWorkflows: number
): TrendInsight[] {
  const insights: TrendInsight[] = [];
  
  // Validate input
  if (!Array.isArray(workflows) || workflows.length === 0) {
    console.warn('[TrendAnalysis] No workflows provided for technology trends');
    return insights;
  }
  
  // Count integration frequencies
  const integrationCounts = new Map<string, number>();
  const recentIntegrationCounts = new Map<string, number>();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindow);

  for (const workflow of workflows) {
    const integrations = workflow.integrations || [];
    const createdAt = 'createdAt' in workflow ? new Date(workflow.createdAt) : null;
    const isRecent = createdAt && createdAt > cutoffDate;

    for (const integration of integrations) {
      const normalizedIntegration = normalizeIntegrationName(integration);
      
      // Count all occurrences
      integrationCounts.set(
        normalizedIntegration,
        (integrationCounts.get(normalizedIntegration) || 0) + 1
      );

      // Count recent occurrences
      if (isRecent) {
        recentIntegrationCounts.set(
          normalizedIntegration,
          (recentIntegrationCounts.get(normalizedIntegration) || 0) + 1
        );
      }
    }
  }

  // Analyze trends
  for (const [integration, totalCount] of integrationCounts.entries()) {
    if (totalCount < minWorkflows) continue;

    const recentCount = recentIntegrationCounts.get(integration) || 0;
    const recentRatio = recentCount / totalCount;
    
    // Determine trend
    let trend: 'growing' | 'stable' | 'declining';
    let percentage: number | undefined;
    let description: string;

    if (recentRatio > 0.6) {
      trend = 'growing';
      percentage = Math.round((recentRatio - 0.5) * 100);
      description = `${integration} stark wachsend`;
    } else if (recentRatio < 0.3) {
      trend = 'declining';
      percentage = Math.round((0.5 - recentRatio) * 100);
      description = `${integration} rückläufig`;
    } else {
      trend = 'stable';
      description = `${integration} stabil`;
    }

    insights.push({
      id: `tech-${integration.toLowerCase().replace(/\s+/g, '-')}`,
      technology: integration,
      trend,
      percentage,
      description,
      confidence: Math.min(100, Math.round((totalCount / minWorkflows) * 30)),
      category: 'technology',
      relatedIntegrations: [integration]
    });
  }

  return insights;
}

/**
 * Analyze category-specific trends
 */
function analyzeCategoryTrends(
  workflows: (WorkflowIndex | N8nWorkflow)[],
  includeCategory?: string
): TrendInsight[] {
  const insights: TrendInsight[] = [];
  
  // Validate input
  if (!Array.isArray(workflows) || workflows.length === 0) {
    return insights;
  }
  
  // Count workflows per category
  const categoryCounts = new Map<string, number>();
  
  for (const workflow of workflows) {
    const category = workflow.category || 'Other';
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }

  const totalWorkflows = workflows.length;

  for (const [category, count] of categoryCounts.entries()) {
    if (includeCategory && category !== includeCategory) continue;
    
    const percentage = Math.round((count / totalWorkflows) * 100);
    
    // Only include significant categories
    if (percentage < 5) continue;

    const trend: 'growing' | 'stable' | 'declining' = 
      percentage > 15 ? 'growing' : 
      percentage < 8 ? 'declining' : 
      'stable';

    insights.push({
      id: `category-${category.toLowerCase().replace(/\s+/g, '-')}`,
      technology: category,
      trend,
      percentage,
      description: `${category} Workflows ${trend === 'growing' ? 'stark vertreten' : trend === 'declining' ? 'wenig vertreten' : 'moderat vertreten'}`,
      confidence: 70,
      category: 'workflow-category',
      relatedIntegrations: []
    });
  }

  return insights;
}

/**
 * Analyze subtask-specific trends
 */
function analyzeSubtaskTrends(
  subtasks: DynamicSubtask[],
  workflows: (WorkflowIndex | N8nWorkflow)[]
): TrendInsight[] {
  const insights: TrendInsight[] = [];

  // Validate input
  if (!Array.isArray(workflows) || workflows.length === 0 || !Array.isArray(subtasks) || subtasks.length === 0) {
    return insights;
  }

  // Extract common patterns from subtasks
  const subtaskKeywords = extractKeywordsFromSubtasks(subtasks);
  
  // Match workflows to these patterns
  for (const [keyword, frequency] of subtaskKeywords.entries()) {
    if (frequency < 2) continue; // Need at least 2 occurrences

    // Count matching workflows
    const matchingWorkflows = workflows.filter(workflow => {
      const workflowText = `${getWorkflowName(workflow)} ${getWorkflowDescription(workflow)}`.toLowerCase();
      return workflowText.includes(keyword.toLowerCase());
    });

    if (matchingWorkflows.length >= 2) {
      const percentage = Math.round((matchingWorkflows.length / workflows.length) * 100);
      
      insights.push({
        id: `subtask-${keyword.toLowerCase().replace(/\s+/g, '-')}`,
        technology: keyword,
        trend: 'growing',
        percentage: Math.min(percentage * 2, 50), // Boost for relevance
        description: `${keyword} zunehmend automatisiert`,
        confidence: Math.min(100, frequency * 20 + matchingWorkflows.length * 10),
        category: 'subtask-pattern',
        relatedIntegrations: extractUniqueIntegrations(matchingWorkflows).slice(0, 3)
      });
    }
  }

  return insights;
}

/**
 * Extract keywords from subtasks
 */
function extractKeywordsFromSubtasks(subtasks: DynamicSubtask[]): Map<string, number> {
  const keywords = new Map<string, number>();

  for (const subtask of subtasks) {
    const text = `${subtask.title} ${subtask.description}`;
    const words = text.toLowerCase()
      .replace(/[^\w\säöüß-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !isCommonWord(word));

    // Also extract multi-word phrases
    const phrases = extractPhrases(text);

    [...words, ...phrases].forEach(keyword => {
      keywords.set(keyword, (keywords.get(keyword) || 0) + 1);
    });
  }

  return keywords;
}

/**
 * Extract meaningful phrases (2-3 words)
 */
function extractPhrases(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\säöüß-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const phrases: string[] = [];

  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (isRelevantPhrase(phrase)) {
      phrases.push(phrase);
    }
  }

  return phrases;
}

/**
 * Check if phrase is relevant
 */
function isRelevantPhrase(phrase: string): boolean {
  const relevantPatterns = [
    /rechnun/i, /buchhal/i, /datev/i, /ocr/i, /email/i, /daten/i,
    /mahn/i, /zahlun/i, /steuer/i, /report/i, /analyse/i
  ];
  
  return relevantPatterns.some(pattern => pattern.test(phrase));
}

/**
 * Check if word is too common
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'werden', 'werden', 'wurde', 'können', 'sollte', 'muss', 'kann',
    'durch', 'über', 'unter', 'nach', 'before', 'after', 'during',
    'system', 'process', 'data', 'information', 'automatisch'
  ]);
  return commonWords.has(word);
}

/**
 * Normalize integration names
 */
function normalizeIntegrationName(name: string): string {
  // Remove common prefixes/suffixes
  let normalized = name
    .replace(/^n8n-nodes-base\./i, '')
    .replace(/Node$/i, '')
    .replace(/Trigger$/i, '')
    .trim();

  // Capitalize first letter
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return normalized;
}

/**
 * Extract unique integrations from workflows
 */
function extractUniqueIntegrations(workflows: (WorkflowIndex | N8nWorkflow)[]): string[] {
  const integrations = new Set<string>();
  
  for (const workflow of workflows) {
    const workflowIntegrations = workflow.integrations || [];
    workflowIntegrations.forEach(integration => {
      integrations.add(normalizeIntegrationName(integration));
    });
  }

  return Array.from(integrations);
}

/**
 * Get workflow name helper
 */
function getWorkflowName(workflow: WorkflowIndex | N8nWorkflow): string {
  if ('title' in workflow) return workflow.title || '';
  if ('name' in workflow) return workflow.name || '';
  return '';
}

/**
 * Get workflow description helper
 */
function getWorkflowDescription(workflow: WorkflowIndex | N8nWorkflow): string {
  if ('summary' in workflow) return workflow.summary || '';
  if ('description' in workflow) return workflow.description || '';
  return '';
}

/**
 * Get trend emoji/icon
 */
export function getTrendIcon(trend: 'growing' | 'stable' | 'declining'): string {
  switch (trend) {
    case 'growing':
      return '▲';
    case 'declining':
      return '▼';
    case 'stable':
      return '○';
  }
}

/**
 * Get trend color
 */
export function getTrendColor(trend: 'growing' | 'stable' | 'declining'): string {
  switch (trend) {
    case 'growing':
      return 'text-green-600';
    case 'declining':
      return 'text-red-600';
    case 'stable':
      return 'text-gray-600';
  }
}

export default {
  analyzeTrends,
  getTrendIcon,
  getTrendColor
};

