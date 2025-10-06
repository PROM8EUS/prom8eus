/**
 * Unified Workflow Recommendation Edge Function
 * 
 * Updated to work with unified_workflows table
 * Integrates with feature flags for gradual rollout
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Subtask {
  id?: string;
  name: string;
  keywords?: string[];
}

interface Input {
  taskText?: string;
  subtasks?: Subtask[];
  selectedApplications?: string[];
  flags?: { enableLLM?: boolean; topK?: number; llmTimeoutMs?: number };
}

interface UnifiedWorkflow {
  id: string;
  title: string;
  description: string;
  summary?: string;
  source: 'github' | 'n8n.io' | 'ai-generated' | 'manual' | 'api';
  sourceUrl?: string;
  category: string;
  tags: string[];
  license?: string;
  complexity: 'Low' | 'Medium' | 'High' | 'Easy' | 'Hard';
  triggerType: 'Manual' | 'Webhook' | 'Scheduled' | 'Complex';
  integrations: string[];
  nodeCount?: number;
  connectionCount?: number;
  author?: {
    name?: string;
    username?: string;
    avatar?: string;
    verified?: boolean;
  };
  createdAt: string;
  updatedAt?: string;
  version?: string;
  status: 'generated' | 'verified' | 'fallback' | 'loading';
  isAIGenerated: boolean;
  generationMetadata?: {
    timestamp: number;
    model?: string;
    language?: string;
    cacheKey?: string;
  };
  validationStatus?: 'valid' | 'invalid' | 'pending';
  setupCost?: number;
  estimatedTime?: string;
  estimatedCost?: string;
  timeSavings?: number;
  downloads?: number;
  rating?: number;
  popularity?: number;
  verified?: boolean;
  domainClassification?: {
    domains: string[];
    confidences: number[];
    origin: 'llm' | 'admin' | 'mixed';
  };
  score?: {
    overall: number;
    complexity: number;
    integration: number;
    popularity: number;
    quality: number;
  };
  match?: {
    score: number;
    reason: string;
    confidence: number;
  };
  downloadUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  active?: boolean;
  fileHash?: string;
  analyzedAt?: string;
  lastAccessed?: string;
  cacheKey?: string;
}

interface WorkflowRecommendation {
  workflow: UnifiedWorkflow;
  score: number;
  reason: string;
  confidence: number;
}

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key);
}

/**
 * Check if unified workflow schema is enabled
 */
async function checkUnifiedWorkflowFlag(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('name', 'unified_workflow_read')
      .eq('environment', 'production')
      .single();

    if (error || !data) return false;
    return data.enabled;
  } catch (error) {
    console.warn('Failed to check unified workflow feature flag:', error);
    return false;
  }
}

/**
 * Normalize integration names
 */
function normalizeIntegration(raw: string): string {
  const s = (raw || "").toLowerCase().trim();
  const map: Record<string, string> = {
    "http": "http request",
    "http request": "http request",
    "webhook": "webhook",
    "gmail": "gmail",
    "google drive": "google drive",
    "drive": "google drive",
    "sheets": "google sheets",
    "google sheets": "google sheets",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "mysql": "mysql",
    "mongo": "mongodb",
    "mongodb": "mongodb",
    "openai": "openai",
    "slack": "slack",
    "github": "github",
    "graph ql": "graphql",
    "graphql": "graphql",
  };
  return map[s] || s;
}

/**
 * Calculate heuristic score for unified workflow
 */
function calculateHeuristicScore(
  workflow: UnifiedWorkflow,
  taskText: string,
  subtasks: Subtask[],
  selectedApplications: string[]
): { score: number; reason: string; confidence: number } {
  let score = 0;
  const reasons: string[] = [];
  let confidence = 0.5;

  const taskLower = taskText.toLowerCase();
  const workflowText = `${workflow.title} ${workflow.description} ${workflow.summary || ''}`.toLowerCase();
  const workflowTags = (workflow.tags || []).map(t => t.toLowerCase());

  // Keyword matching
  const keywords = [
    ...subtasks.flatMap(s => s.keywords || []),
    ...selectedApplications,
    ...taskText.split(' ').filter(w => w.length > 3)
  ].map(k => k.toLowerCase());

  let keywordMatches = 0;
  for (const keyword of keywords) {
    if (workflowText.includes(keyword) || workflowTags.includes(keyword)) {
      keywordMatches++;
    }
  }

  if (keywordMatches > 0) {
    score += Math.min(keywordMatches * 0.2, 1.0);
    reasons.push(`${keywordMatches} keyword matches`);
    confidence += 0.2;
  }

  // Integration matching
  const workflowIntegrations = (workflow.integrations || []).map(normalizeIntegration);
  const selectedIntegrations = (selectedApplications || []).map(normalizeIntegration);
  
  let integrationMatches = 0;
  for (const integration of selectedIntegrations) {
    if (workflowIntegrations.some(wi => wi.includes(integration) || integration.includes(wi))) {
      integrationMatches++;
    }
  }

  if (integrationMatches > 0) {
    score += Math.min(integrationMatches * 0.3, 1.0);
    reasons.push(`${integrationMatches} integration matches`);
    confidence += 0.3;
  }

  // AI-generated workflow boost
  if (workflow.isAIGenerated) {
    score += 0.2;
    reasons.push('AI-generated workflow');
    confidence += 0.1;
  }

  // Verified workflow boost
  if (workflow.verified) {
    score += 0.15;
    reasons.push('Verified workflow');
    confidence += 0.1;
  }

  // Rating boost
  if (workflow.rating && workflow.rating > 4) {
    score += 0.1;
    reasons.push('High rating');
    confidence += 0.1;
  }

  // Popularity boost
  if (workflow.popularity && workflow.popularity > 100) {
    score += 0.1;
    reasons.push('Popular workflow');
    confidence += 0.1;
  }

  // Downloads boost
  if (workflow.downloads && workflow.downloads > 50) {
    score += 0.1;
    reasons.push('High downloads');
    confidence += 0.1;
  }

  // Complexity matching
  const taskComplexity = taskText.includes('complex') || taskText.includes('advanced') ? 'high' : 'medium';
  const workflowComplexity = workflow.complexity.toLowerCase();
  
  if (taskComplexity === workflowComplexity) {
    score += 0.1;
    reasons.push('Complexity match');
    confidence += 0.1;
  }

  // Category matching
  const taskCategory = taskText.includes('marketing') ? 'marketing' : 
                      taskText.includes('sales') ? 'sales' :
                      taskText.includes('data') ? 'analytics' : 'general';
  
  if (workflow.category.toLowerCase().includes(taskCategory)) {
    score += 0.15;
    reasons.push('Category match');
    confidence += 0.15;
  }

  return {
    score: Math.min(score, 1.0),
    reason: reasons.join(', ') || 'General match',
    confidence: Math.min(confidence, 1.0)
  };
}

/**
 * MMR diversification for unified workflows
 */
function mmrSelect(items: WorkflowRecommendation[], k: number): WorkflowRecommendation[] {
  if (items.length <= k) return items;
  
  const selected: WorkflowRecommendation[] = [];
  const remaining = [...items];
  
  // Start with highest scoring item
  selected.push(remaining.shift()!);
  
  while (selected.length < k && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -1;
    
    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      let minSimilarity = 1;
      
      // Calculate minimum similarity to already selected items
      for (const selectedItem of selected) {
        const similarity = calculateSimilarity(item.workflow, selectedItem.workflow);
        minSimilarity = Math.min(minSimilarity, similarity);
      }
      
      // MMR score: relevance - lambda * max_similarity
      const mmrScore = item.score - 0.7 * (1 - minSimilarity);
      
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }
    
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }
  
  return selected;
}

/**
 * Calculate similarity between two workflows
 */
function calculateSimilarity(workflow1: UnifiedWorkflow, workflow2: UnifiedWorkflow): number {
  let similarity = 0;
  
  // Category similarity
  if (workflow1.category === workflow2.category) similarity += 0.3;
  
  // Integration similarity
  const integrations1 = new Set(workflow1.integrations || []);
  const integrations2 = new Set(workflow2.integrations || []);
  const intersection = new Set([...integrations1].filter(x => integrations2.has(x)));
  const union = new Set([...integrations1, ...integrations2]);
  const jaccard = union.size > 0 ? intersection.size / union.size : 0;
  similarity += jaccard * 0.4;
  
  // Complexity similarity
  if (workflow1.complexity === workflow2.complexity) similarity += 0.2;
  
  // Source similarity
  if (workflow1.source === workflow2.source) similarity += 0.1;
  
  return similarity;
}

/**
 * Main handler function
 */
async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { 
        status: 405,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const input: Input = await req.json();
    const { taskText = "", subtasks = [], selectedApplications = [], flags = {} } = input;
    const { topK = 6 } = flags;

    // Check if unified workflow schema is enabled
    const useUnified = await checkUnifiedWorkflowFlag();
    
    if (useUnified) {
      return await handleUnifiedRecommendations(taskText, subtasks, selectedApplications, topK);
    } else {
      return await handleLegacyRecommendations(taskText, subtasks, selectedApplications, topK);
    }

  } catch (error) {
    console.error('[recommend-workflows-unified] error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500, 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });
  }
}

/**
 * Handle unified workflow recommendations
 */
async function handleUnifiedRecommendations(
  taskText: string,
  subtasks: Subtask[],
  selectedApplications: string[],
  topK: number
): Promise<Response> {
  try {
    const supabase = getSupabase();

    // Load workflows from unified_workflows table
    const { data: workflows, error } = await supabase
      .from('unified_workflows')
      .select('*')
      .eq('active', true)
      .eq('status', 'verified')
      .limit(1000);

    if (error) {
      throw new Error(`Failed to load unified workflows: ${error.message}`);
    }

    if (!workflows || workflows.length === 0) {
      return new Response(JSON.stringify({ 
        workflows: [],
        message: "No unified workflows found",
        unified: true
      }), { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      });
    }

    // Calculate scores for all workflows
    const scoredWorkflows: WorkflowRecommendation[] = workflows.map((workflow: UnifiedWorkflow) => {
      const { score, reason, confidence } = calculateHeuristicScore(
        workflow,
        taskText,
        subtasks,
        selectedApplications
      );

      return {
        workflow,
        score,
        reason,
        confidence
      };
    });

    // Sort by score and apply MMR diversification
    const sortedWorkflows = scoredWorkflows
      .sort((a, b) => b.score - a.score)
      .filter(w => w.score > 0.1); // Filter out very low scores

    const diversifiedWorkflows = mmrSelect(sortedWorkflows, topK);

    // Format response
    const recommendations = diversifiedWorkflows.map(rec => ({
      id: rec.workflow.id,
      title: rec.workflow.title,
      description: rec.workflow.description,
      summary: rec.workflow.summary,
      source: rec.workflow.source,
      sourceUrl: rec.workflow.sourceUrl,
      category: rec.workflow.category,
      tags: rec.workflow.tags,
      complexity: rec.workflow.complexity,
      triggerType: rec.workflow.triggerType,
      integrations: rec.workflow.integrations,
      nodeCount: rec.workflow.nodeCount,
      connectionCount: rec.workflow.connectionCount,
      author: rec.workflow.author,
      createdAt: rec.workflow.createdAt,
      status: rec.workflow.status,
      isAIGenerated: rec.workflow.isAIGenerated,
      setupCost: rec.workflow.setupCost,
      estimatedTime: rec.workflow.estimatedTime,
      estimatedCost: rec.workflow.estimatedCost,
      timeSavings: rec.workflow.timeSavings,
      downloads: rec.workflow.downloads,
      rating: rec.workflow.rating,
      popularity: rec.workflow.popularity,
      verified: rec.workflow.verified,
      downloadUrl: rec.workflow.downloadUrl,
      previewUrl: rec.workflow.previewUrl,
      score: rec.score,
      reason: rec.reason,
      confidence: rec.confidence
    }));

    return new Response(JSON.stringify({ 
      workflows: recommendations,
      unified: true,
      total: workflows.length,
      filtered: sortedWorkflows.length,
      returned: recommendations.length
    }), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });

  } catch (error) {
    console.error('[recommend-workflows-unified] error:', error);
    throw error;
  }
}

/**
 * Handle legacy workflow recommendations (fallback)
 */
async function handleLegacyRecommendations(
  taskText: string,
  subtasks: Subtask[],
  selectedApplications: string[],
  topK: number
): Promise<Response> {
  try {
    const supabase = getSupabase();

    // Load workflows from legacy workflow_cache table
    const { data: cacheData, error } = await supabase
      .from('workflow_cache')
      .select('source, workflows')
      .in('source', ['github', 'n8n.io', 'ai-enhanced'])
      .eq('version', 'v1.5.0');

    if (error) {
      throw new Error(`Failed to load legacy workflows: ${error.message}`);
    }

    if (!cacheData || cacheData.length === 0) {
      return new Response(JSON.stringify({ 
        workflows: [],
        message: "No legacy workflows found",
        unified: false
      }), { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      });
    }

    // Flatten workflows from cache
    const allWorkflows: any[] = [];
    cacheData.forEach((row: any) => {
      const workflows = row.workflows || [];
      workflows.forEach((workflow: any) => {
        allWorkflows.push({
          ...workflow,
          source: row.source
        });
      });
    });

    // Simple scoring for legacy workflows
    const scoredWorkflows = allWorkflows.map((workflow: any) => {
      let score = 0;
      const reasons: string[] = [];
      
      const workflowText = `${workflow.name || ''} ${workflow.description || ''}`.toLowerCase();
      const taskLower = taskText.toLowerCase();
      
      // Simple keyword matching
      const keywords = taskText.split(' ').filter(w => w.length > 3);
      let matches = 0;
      for (const keyword of keywords) {
        if (workflowText.includes(keyword.toLowerCase())) {
          matches++;
        }
      }
      
      if (matches > 0) {
        score += Math.min(matches * 0.2, 1.0);
        reasons.push(`${matches} keyword matches`);
      }
      
      // Integration matching
      const workflowIntegrations = (workflow.integrations || []).map(normalizeIntegration);
      const selectedIntegrations = (selectedApplications || []).map(normalizeIntegration);
      
      let integrationMatches = 0;
      for (const integration of selectedIntegrations) {
        if (workflowIntegrations.some(wi => wi.includes(integration) || integration.includes(wi))) {
          integrationMatches++;
        }
      }
      
      if (integrationMatches > 0) {
        score += Math.min(integrationMatches * 0.3, 1.0);
        reasons.push(`${integrationMatches} integration matches`);
      }
      
      return {
        workflow,
        score,
        reason: reasons.join(', ') || 'General match',
        confidence: 0.5
      };
    });

    // Sort and return top K
    const topWorkflows = scoredWorkflows
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(w => w.score > 0.1);

    const recommendations = topWorkflows.map(rec => ({
      id: rec.workflow.id,
      name: rec.workflow.name,
      description: rec.workflow.description,
      source: rec.workflow.source,
      category: rec.workflow.category,
      complexity: rec.workflow.complexity,
      triggerType: rec.workflow.triggerType,
      integrations: rec.workflow.integrations,
      nodeCount: rec.workflow.nodeCount,
      author: rec.workflow.authorName,
      score: rec.score,
      reason: rec.reason,
      confidence: rec.confidence
    }));

    return new Response(JSON.stringify({ 
      workflows: recommendations,
      unified: false,
      total: allWorkflows.length,
      returned: recommendations.length
    }), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });

  } catch (error) {
    console.error('[recommend-workflows-unified] legacy error:', error);
    throw error;
  }
}

Deno.serve(handler);
