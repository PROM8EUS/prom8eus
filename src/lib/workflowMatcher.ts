/**
 * Workflow Matcher Utility
 * Matches workflows/blueprints to subtasks based on various criteria
 */

import { DynamicSubtask, SolutionStatus, GenerationMetadata } from './types';
import { WorkflowIndex } from './workflowIndexer';
import { N8nWorkflow } from './n8nApi';
import { WorkflowSolutionInterface } from './interfaces';

export interface WorkflowMatch {
  workflow: WorkflowIndex | N8nWorkflow;
  matchScore: number;
  matchReasons: string[];
  relevantIntegrations: string[];
  estimatedTimeSavings?: number;
  // Enhanced properties for expanded task detail view
  status: SolutionStatus;
  isAIGenerated: boolean;
  generationMetadata?: GenerationMetadata;
  setupCost?: number;
  downloadUrl?: string;
  validationStatus?: 'valid' | 'invalid';
}

export interface MatchingOptions {
  maxResults?: number;
  minScore?: number;
  preferredComplexity?: 'Low' | 'Medium' | 'High';
  requireIntegrationMatch?: boolean;
  // Enhanced options for expanded task detail view
  includeAIGenerated?: boolean;
  preferredStatus?: SolutionStatus[];
  language?: 'de' | 'en';
  autoGenerateFallback?: boolean;
}

/**
 * Match workflows to a specific subtask
 */
export function matchWorkflowsToSubtask(
  subtask: DynamicSubtask,
  workflows: (WorkflowIndex | N8nWorkflow)[],
  options: MatchingOptions = {}
): WorkflowMatch[] {
  const {
    maxResults = 5,
    minScore = 30,
    preferredComplexity,
    requireIntegrationMatch = false,
    includeAIGenerated = true,
    preferredStatus = ['verified', 'generated', 'fallback'],
    language = 'en',
    autoGenerateFallback = true
  } = options;

  const matches: WorkflowMatch[] = [];

  for (const workflow of workflows) {
    const match = calculateWorkflowMatch(subtask, workflow);
    
    // Apply filters
    if (match.matchScore < minScore) continue;
    if (requireIntegrationMatch && match.relevantIntegrations.length === 0) continue;

    matches.push(match);
  }

  // Sort by match score (descending)
  matches.sort((a, b) => b.matchScore - a.matchScore);

  // Apply preferred complexity boost
  if (preferredComplexity) {
    matches.forEach(match => {
      const workflowComplexity = normalizeComplexity(getWorkflowComplexity(match.workflow));
      if (workflowComplexity === preferredComplexity) {
        match.matchScore += 10;
      }
    });
    // Re-sort after complexity boost
    matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  return matches.slice(0, maxResults);
}

/**
 * Calculate match score between a subtask and a workflow
 */
function calculateWorkflowMatch(
  subtask: DynamicSubtask,
  workflow: WorkflowIndex | N8nWorkflow
): WorkflowMatch {
  let score = 0;
  const matchReasons: string[] = [];
  const relevantIntegrations: string[] = [];

  // Extract workflow properties
  const workflowName = getWorkflowName(workflow);
  const workflowDescription = getWorkflowDescription(workflow);
  const workflowCategory = getWorkflowCategory(workflow);
  const workflowIntegrations = getWorkflowIntegrations(workflow);
  const workflowComplexity = getWorkflowComplexity(workflow);

  // 1. Title/Name similarity (max 30 points)
  const titleScore = calculateTextSimilarity(subtask.title, workflowName);
  const titlePoints = titleScore * 30;
  if (titleScore > 0.05) { // VERY LOW threshold
    score += titlePoints;
    matchReasons.push(`Title: ${Math.round(titleScore * 100)}% (+${Math.round(titlePoints)})`);
  }

  // 2. Description similarity (max 25 points)
  if (subtask.description) {
    const descScore = calculateTextSimilarity(subtask.description, workflowDescription);
    const descPoints = descScore * 25;
    if (descScore > 0.05) { // VERY LOW threshold
      score += descPoints;
      matchReasons.push(`Desc: ${Math.round(descScore * 100)}% (+${Math.round(descPoints)})`);
    }
  }

  // 3. Keyword boost - give points for any keyword match (NEW)
  const keywordScore = calculateKeywordMatch(subtask.title, workflowName, workflowDescription, workflowCategory);
  if (keywordScore > 0) {
    score += keywordScore;
    matchReasons.push(`Keywords: +${keywordScore}`);
  }

  // 4. Systems/Integrations overlap (max 25 points)
  const integrationScore = calculateIntegrationOverlap(
    subtask.systems,
    workflowIntegrations,
    relevantIntegrations
  );
  if (integrationScore > 0) {
    score += integrationScore;
    matchReasons.push(`Integration match: ${relevantIntegrations.join(', ')}`);
  }

  // 5. Complexity match (max 10 points)
  const complexityScore = calculateComplexityMatch(
    subtask.complexity,
    normalizeComplexity(workflowComplexity)
  );
  if (complexityScore > 0) {
    score += complexityScore;
    matchReasons.push(`Complexity: ${workflowComplexity}`);
  }

  // 6. Automation potential alignment (max 10 points)
  const automationScore = subtask.automationPotential * 10;
  score += automationScore;

  // Always log top 3 for debugging (even if score is 0)
  // This will be filtered by TopSubtasksSection later

  // Estimate time savings (hours per month)
  const estimatedTimeSavings = estimateTimeSavings(subtask, workflow);

  // Determine status and generation metadata
  const status = determineWorkflowStatus(workflow);
  const isAIGenerated = determineIfAIGenerated(workflow);
  const generationMetadata = isAIGenerated ? createGenerationMetadata(workflow) : undefined;
  const setupCost = calculateSetupCost(workflow);
  const downloadUrl = generateDownloadUrl(workflow);
  const validationStatus = validateWorkflow(workflow);

  return {
    workflow,
    matchScore: Math.min(100, Math.round(score)),
    matchReasons,
    relevantIntegrations,
    estimatedTimeSavings,
    status,
    isAIGenerated,
    generationMetadata,
    setupCost,
    downloadUrl,
    validationStatus
  };
}

/**
 * Calculate keyword match score (looser matching)
 */
function calculateKeywordMatch(
  subtaskTitle: string,
  workflowName: string,
  workflowDescription: string,
  workflowCategory: string
): number {
  const title = subtaskTitle.toLowerCase();
  const allWorkflowText = `${workflowName} ${workflowDescription} ${workflowCategory}`.toLowerCase();
  
  let score = 0;
  
  // Important domain keywords with high scores
  const domainKeywords = {
    // Finance/Accounting
    'rechnung': 15, 'invoice': 15, 'buchhal': 15, 'accounting': 15, 'datev': 20, 'steuer': 15, 'tax': 15,
    'zahlung': 12, 'payment': 12, 'bilanz': 15, 'balance': 15, 'abschluss': 12,
    // Data/Analysis
    'daten': 10, 'data': 10, 'analyse': 12, 'analysis': 12, 'report': 12, 'bericht': 12,
    'aggregat': 10, 'aggregate': 10, 'visuali': 10, 'chart': 10, 'dashboard': 12,
    // Development
    'code': 10, 'develop': 10, 'deploy': 12, 'build': 10, 'test': 10, 'api': 12,
    'database': 12, 'datenbank': 12, 'frontend': 10, 'backend': 10,
    // Communication
    'email': 12, 'mail': 12, 'kalender': 10, 'calendar': 10, 'meeting': 10, 'termin': 10,
    // Automation
    'automat': 15, 'workflow': 12, 'process': 10, 'prozess': 10
  };

  for (const [keyword, points] of Object.entries(domainKeywords)) {
    if (title.includes(keyword) && allWorkflowText.includes(keyword)) {
      score += points;
    }
  }

  return Math.min(30, score); // Cap at 30 points
}

/**
 * Calculate text similarity using keyword overlap
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const words1 = tokenize(text1);
  const words2 = tokenize(text2);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Calculate Jaccard similarity
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Tokenize text into meaningful words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\säöüß]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !isStopWord(word));
}

/**
 * Check if word is a stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'der', 'die', 'das', 'und', 'oder', 'für', 'von', 'mit', 'zu', 'im', 'am',
    'the', 'and', 'or', 'for', 'of', 'with', 'to', 'in', 'on', 'at', 'is', 'are',
    'eine', 'ein', 'einer', 'einem', 'einen', 'a', 'an', 'this', 'that', 'these'
  ]);
  return stopWords.has(word);
}

/**
 * Calculate integration/system overlap
 */
function calculateIntegrationOverlap(
  subtaskSystems: string[],
  workflowIntegrations: string[],
  relevantIntegrations: string[]
): number {
  if (subtaskSystems.length === 0 || workflowIntegrations.length === 0) {
    return 0;
  }

  let score = 0;
  const subtaskSystemsLower = subtaskSystems.map(s => s.toLowerCase());
  const workflowIntegrationsLower = workflowIntegrations.map(i => i.toLowerCase());

  // Exact matches (15 points each, max 25)
  for (const system of subtaskSystemsLower) {
    for (const integration of workflowIntegrationsLower) {
      if (system === integration || 
          system.includes(integration) || 
          integration.includes(system)) {
        score += 15;
        relevantIntegrations.push(integration);
      }
    }
  }

  return Math.min(25, score);
}

/**
 * Calculate complexity match score
 */
function calculateComplexityMatch(
  subtaskComplexity: 'low' | 'medium' | 'high',
  workflowComplexity: 'Low' | 'Medium' | 'High'
): number {
  const subtaskLevel = subtaskComplexity.toLowerCase();
  const workflowLevel = workflowComplexity.toLowerCase();

  // Exact match
  if (subtaskLevel === workflowLevel) return 10;
  
  // Adjacent complexity levels
  const levels = ['low', 'medium', 'high'];
  const subtaskIndex = levels.indexOf(subtaskLevel);
  const workflowIndex = levels.indexOf(workflowLevel);
  
  if (Math.abs(subtaskIndex - workflowIndex) === 1) return 5;
  
  return 0;
}

/**
 * Normalize complexity to standard format
 */
function normalizeComplexity(complexity: string): 'Low' | 'Medium' | 'High' {
  const normalized = complexity.toLowerCase();
  if (normalized === 'low' || normalized === 'easy' || normalized === 'simple') return 'Low';
  if (normalized === 'medium' || normalized === 'moderate') return 'Medium';
  if (normalized === 'high' || normalized === 'hard' || normalized === 'complex') return 'High';
  return 'Medium'; // default
}

/**
 * Estimate time savings based on workflow and subtask
 */
function estimateTimeSavings(
  subtask: DynamicSubtask,
  workflow: WorkflowIndex | N8nWorkflow
): number {
  // Base estimate on subtask's estimated time and automation potential
  const baseTime = subtask.estimatedTime || 8;
  const automationFactor = subtask.automationPotential;
  
  // Adjust based on workflow complexity
  const complexity = getWorkflowComplexity(workflow);
  const complexityFactor = 
    normalizeComplexity(complexity) === 'Low' ? 1.2 :
    normalizeComplexity(complexity) === 'Medium' ? 1.0 :
    0.8;

  return baseTime * automationFactor * complexityFactor;
}

/**
 * Helper: Get workflow name
 */
function getWorkflowName(workflow: WorkflowIndex | N8nWorkflow): string {
  if ('title' in workflow) return workflow.title || '';
  if ('name' in workflow) return workflow.name || '';
  return '';
}

/**
 * Helper: Get workflow description
 */
function getWorkflowDescription(workflow: WorkflowIndex | N8nWorkflow): string {
  if ('summary' in workflow) return workflow.summary || '';
  if ('description' in workflow) return workflow.description || '';
  return '';
}

/**
 * Helper: Get workflow category
 */
function getWorkflowCategory(workflow: WorkflowIndex | N8nWorkflow): string {
  return workflow.category || '';
}

/**
 * Helper: Get workflow integrations
 */
function getWorkflowIntegrations(workflow: WorkflowIndex | N8nWorkflow): string[] {
  return workflow.integrations || [];
}

/**
 * Helper: Get workflow complexity
 */
function getWorkflowComplexity(workflow: WorkflowIndex | N8nWorkflow): string {
  if ('complexity' in workflow) return workflow.complexity || 'Medium';
  if ('difficulty' in workflow) return workflow.difficulty || 'Medium';
  return 'Medium';
}

/**
 * Batch match workflows to multiple subtasks
 */
export function matchWorkflowsToSubtasks(
  subtasks: DynamicSubtask[],
  workflows: (WorkflowIndex | N8nWorkflow)[],
  options: MatchingOptions = {}
): Map<string, WorkflowMatch[]> {
  const matchMap = new Map<string, WorkflowMatch[]>();

  for (const subtask of subtasks) {
    const matches = matchWorkflowsToSubtask(subtask, workflows, options);
    matchMap.set(subtask.id, matches);
  }

  return matchMap;
}

/**
 * Find the best overall workflow across all subtasks
 */
export function findBestOverallWorkflow(
  subtasks: DynamicSubtask[],
  workflows: (WorkflowIndex | N8nWorkflow)[],
  options: MatchingOptions = {}
): WorkflowMatch | null {
  const allMatches: WorkflowMatch[] = [];

  for (const subtask of subtasks) {
    const matches = matchWorkflowsToSubtask(subtask, workflows, {
      ...options,
      maxResults: 1
    });
    if (matches.length > 0) {
      allMatches.push(matches[0]);
    }
  }

  if (allMatches.length === 0) return null;

  // Return the match with highest score
  allMatches.sort((a, b) => b.matchScore - a.matchScore);
  return allMatches[0];
}

/**
 * Determine workflow status based on source and properties
 */
function determineWorkflowStatus(workflow: WorkflowIndex | N8nWorkflow): SolutionStatus {
  // Check if it's from a verified source
  if ('source' in workflow && workflow.source === 'library') {
    return 'verified';
  }
  
  // Check if it's AI-generated
  if ('isAIGenerated' in workflow && workflow.isAIGenerated) {
    return 'generated';
  }
  
  // Default to fallback for unknown sources
  return 'fallback';
}

/**
 * Determine if workflow is AI-generated
 */
function determineIfAIGenerated(workflow: WorkflowIndex | N8nWorkflow): boolean {
  if ('isAIGenerated' in workflow) {
    return workflow.isAIGenerated;
  }
  
  // Check for AI generation indicators
  if ('source' in workflow && workflow.source === 'ai') {
    return true;
  }
  
  return false;
}

/**
 * Create generation metadata for AI-generated workflows
 */
function createGenerationMetadata(workflow: WorkflowIndex | N8nWorkflow): GenerationMetadata {
  return {
    timestamp: Date.now(),
    model: 'gpt-4o-mini', // Default model
    language: 'en',
    cacheKey: `workflow_${workflow.id || 'unknown'}_${Date.now()}`
  };
}

/**
 * Calculate setup cost based on workflow complexity
 */
function calculateSetupCost(workflow: WorkflowIndex | N8nWorkflow): number {
  const complexity = normalizeComplexity(getWorkflowComplexity(workflow));
  
  switch (complexity) {
    case 'Low': return 200;
    case 'Medium': return 500;
    case 'High': return 1000;
    default: return 500;
  }
}

/**
 * Generate download URL for workflow
 */
function generateDownloadUrl(workflow: WorkflowIndex | N8nWorkflow): string | undefined {
  if ('downloadUrl' in workflow && workflow.downloadUrl) {
    return workflow.downloadUrl;
  }
  
  if ('jsonUrl' in workflow && workflow.jsonUrl) {
    return workflow.jsonUrl;
  }
  
  // Generate URL for n8n workflows
  if ('id' in workflow && workflow.id) {
    return `/api/workflows/${workflow.id}/download`;
  }
  
  return undefined;
}

/**
 * Validate workflow structure
 */
function validateWorkflow(workflow: WorkflowIndex | N8nWorkflow): 'valid' | 'invalid' {
  // Basic validation checks
  if (!workflow) return 'invalid';
  
  // Check for required properties
  const hasName = getWorkflowName(workflow).length > 0;
  const hasDescription = getWorkflowDescription(workflow).length > 0;
  
  if (!hasName || !hasDescription) return 'invalid';
  
  // Check for valid integrations array
  const integrations = getWorkflowIntegrations(workflow);
  if (!Array.isArray(integrations)) return 'invalid';
  
  return 'valid';
}

/**
 * Enhanced matching with fallback generation support
 */
export async function matchWorkflowsWithFallback(
  subtask: DynamicSubtask,
  workflows: (WorkflowIndex | N8nWorkflow)[],
  options: MatchingOptions = {}
): Promise<WorkflowMatch[]> {
  // First, try normal matching
  const matches = matchWorkflowsToSubtask(subtask, workflows, options);
  
  // If no good matches found and fallback is enabled, generate one
  if (matches.length === 0 && options.autoGenerateFallback !== false) {
    // Don't generate fallback here - let the WorkflowTab handle it with proper context
    console.log('🔍 [matchWorkflowsWithFallback] No matches found, letting WorkflowTab handle fallback generation');
    return [];
  }
  
  return matches;
}

/**
 * Generate fallback workflow when no matches found
 */
async function generateFallbackWorkflow(
  subtask: DynamicSubtask,
  options: MatchingOptions = {}
): Promise<WorkflowMatch | null> {
  // This would integrate with the blueprintGenerator service
  // For now, return a basic fallback structure
  const fallbackWorkflow: N8nWorkflow = {
    id: `fallback_${subtask.id}_${Date.now()}`,
    name: `Generated workflow for: ${subtask.title}`,
    description: `AI-generated workflow for automating: ${subtask.description || subtask.title}`,
    category: 'Generated',
    complexity: 'Medium',
    integrations: subtask.systems || [],
    isAIGenerated: true,
    source: 'ai'
  };
  
  return {
    workflow: fallbackWorkflow,
    matchScore: 50, // Medium score for fallback
    matchReasons: ['AI-generated fallback workflow'],
    relevantIntegrations: subtask.systems || [],
    estimatedTimeSavings: subtask.estimatedTime || 8,
    status: 'generated',
    isAIGenerated: true,
    generationMetadata: createGenerationMetadata(fallbackWorkflow),
    setupCost: calculateSetupCost(fallbackWorkflow),
    downloadUrl: generateDownloadUrl(fallbackWorkflow),
    validationStatus: 'valid'
  };
}

export default {
  matchWorkflowsToSubtask,
  matchWorkflowsToSubtasks,
  findBestOverallWorkflow,
  matchWorkflowsWithFallback
};

