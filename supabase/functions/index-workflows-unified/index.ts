/**
 * Unified Workflow Indexing Edge Function
 * 
 * Updated to work with unified_workflows table
 * Integrates with feature flags for gradual rollout
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isUnifiedWorkflowReadEnabled } from '../_shared/feature-toggles.ts';

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

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase configuration");
  }
  
  return createClient(url, serviceKey);
}

/**
 * Generate embeddings for workflows
 */
async function embedAll(texts: string[], apiKey?: string): Promise<number[][]> {
  if (!apiKey) return [];
  
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.map((d: any) => d.embedding as number[]);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return [];
  }
}

/**
 * Normalize integrations for unified workflows
 */
function normalizeIntegrations(workflow: UnifiedWorkflow): string[] {
  return workflow.integrations || [];
}

/**
 * Normalize trigger type for unified workflows
 */
function normalizeTrigger(triggerType: string): string {
  const triggerMap: Record<string, string> = {
    'Manual': 'manual',
    'Webhook': 'webhook',
    'Scheduled': 'scheduled',
    'Complex': 'complex'
  };
  return triggerMap[triggerType] || 'manual';
}

/**
 * Normalize complexity for unified workflows
 */
function normalizeComplexity(complexity: string): string {
  const complexityMap: Record<string, string> = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Easy': 'easy',
    'Hard': 'hard'
  };
  return complexityMap[complexity] || 'medium';
}

/**
 * Calculate quality prior for unified workflows
 */
function calculateQualityPrior(workflow: UnifiedWorkflow): number {
  let score = 0.5; // Base score
  
  // Boost for verified workflows
  if (workflow.verified) score += 0.2;
  
  // Boost for AI-generated workflows
  if (workflow.isAIGenerated) score += 0.1;
  
  // Boost for high ratings
  if (workflow.rating && workflow.rating > 4) score += 0.1;
  
  // Boost for high popularity
  if (workflow.popularity && workflow.popularity > 100) score += 0.1;
  
  // Boost for downloads
  if (workflow.downloads && workflow.downloads > 50) score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * Main handler function
 */
async function handler(req: Request): Promise<Response> {
  const startTime = Date.now();
  let totalWorkflows = 0;
  let embeddedCount = 0;
  
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

    const { sources = ["github", "n8n.io", "ai-generated"], batchSize = 800 } = await req.json().catch(() => ({}));
    const supabase = getSupabase();

    // Check if unified workflow schema is enabled
    const useUnified = isUnifiedWorkflowReadEnabled();
    
    if (useUnified) {
      return await handleUnifiedWorkflows(supabase, sources, batchSize, startTime);
    } else {
      return await handleLegacyWorkflows(supabase, sources, batchSize, startTime);
    }

  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[index-workflows-unified] error after ${duration}ms:`, (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), { 
      status: 500, 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });
  }
}

/**
 * Handle unified workflows indexing
 */
async function handleUnifiedWorkflows(
  supabase: any, 
  sources: string[], 
  batchSize: number, 
  startTime: number
): Promise<Response> {
  let totalWorkflows = 0;
  let embeddedCount = 0;

  try {
    // Load workflows from unified_workflows table
    const { data: workflows, error } = await supabase
      .from('unified_workflows')
      .select('*')
      .in('source', sources)
      .eq('active', true);

    if (error) {
      throw new Error(`Failed to load unified workflows: ${error.message}`);
    }

    if (!workflows || workflows.length === 0) {
      return new Response(JSON.stringify({ 
        updated: 0, 
        message: "No unified workflows found",
        unified: true
      }), { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      });
    }

    totalWorkflows = workflows.length;

    // Build feature rows for unified workflows
    const features = workflows.map((workflow: UnifiedWorkflow) => {
      const integrations = normalizeIntegrations(workflow);
      const triggers = normalizeTrigger(workflow.triggerType);
      const complexity = normalizeComplexity(workflow.complexity);
      
      return {
        source: workflow.source,
        workflow_id: workflow.id,
        integrations_norm: integrations,
        triggers_norm: triggers,
        complexity_band: complexity,
        author_verified: workflow.author?.verified || false,
        rating: workflow.rating || null,
        quality_prior: calculateQualityPrior(workflow),
        is_ai_generated: workflow.isAIGenerated,
        category: workflow.category,
        updated_at: new Date().toISOString()
      };
    });

    // Upsert features in chunks
    const chunk = async <T,>(arr: T[], size: number, fn: (part: T[], idx: number) => Promise<void>) => {
      for (let i = 0; i < arr.length; i += size) {
        await fn(arr.slice(i, i + size), i / size);
      }
    };

    await chunk(features, 1500, async (part) => {
      const { error } = await supabase
        .from("workflow_features")
        .upsert(part, { onConflict: "source,workflow_id" });
      if (error) throw error;
    });

    // Generate embeddings if API key available
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (OPENAI_API_KEY) {
      const texts = workflows.map((w: UnifiedWorkflow) => 
        `${w.title || ""}\n${w.description || ""}\n${w.summary || ""}\n${(w.tags || []).join(",")}`.slice(0, 4000)
      );
      
      await chunk(texts, batchSize, async (part, idx) => {
        const embs = await embedAll(part, OPENAI_API_KEY);
        if (!embs || embs.length === 0) return;
        
        const rows = embs.map((e, i) => {
          const w = workflows[idx * batchSize + i];
          return {
            source: w.source,
            workflow_id: w.id,
            embedding: e,
            updated_at: new Date().toISOString()
          };
        });
        
        embeddedCount += rows.length;
        const { error } = await supabase
          .from("workflow_embeddings")
          .upsert(rows, { onConflict: "source,workflow_id" });
        if (error) throw error;
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[index-workflows-unified] duration=${duration}ms workflows=${totalWorkflows} features=${features.length} embeddings=${embeddedCount}`);
    
    return new Response(JSON.stringify({ 
      updated: features.length, 
      embedded: embeddedCount,
      unified: true,
      workflows: totalWorkflows
    }), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[index-workflows-unified] error after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Handle legacy workflows indexing (fallback)
 */
async function handleLegacyWorkflows(
  supabase: any, 
  sources: string[], 
  batchSize: number, 
  startTime: number
): Promise<Response> {
  let totalWorkflows = 0;
  let embeddedCount = 0;

  try {
    // Load per-source cached workflows (support shards via LIKE)
    const all: any[] = [];
    for (const s of sources) {
      const { data, error } = await supabase
        .from("workflow_cache")
        .select("source, workflows")
        .like("source", `${s}%`)
        .eq("version", "v1.5.0");
      if (error) continue;
      const rows: any[] = Array.isArray(data) ? data : (data ? [data] : []);
      rows.forEach(r => {
        const arr: any[] = (r?.workflows || []) as any[];
        arr.forEach(w => all.push(w));
      });
    }

    if (all.length === 0) {
      return new Response(JSON.stringify({ 
        updated: 0, 
        message: "No legacy workflows found",
        unified: false
      }), { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      });
    }
    
    totalWorkflows = all.length;

    // Build feature rows for legacy workflows
    const features = all.map((w: any) => {
      const src = sources.find(s => (w.filename || "").toLowerCase().startsWith("n8n-") ? s === "n8n.io" : s) || "github";
      const integrations = w.integrations || [];
      const triggers = normalizeTrigger(w.triggerType || 'Manual');
      const complexity = normalizeComplexity(w.complexity || 'Medium');
      
      return {
        source: src,
        workflow_id: String(w.id ?? w.filename ?? w.name ?? Math.random()),
        integrations_norm: integrations,
        triggers_norm: triggers,
        complexity_band: complexity,
        author_verified: !!w.authorVerified,
        rating: null,
        quality_prior: 0.5,
        is_ai_generated: false,
        category: w.category || 'General',
        updated_at: new Date().toISOString()
      };
    });

    // Upsert features in chunks
    const chunk = async <T,>(arr: T[], size: number, fn: (part: T[], idx: number) => Promise<void>) => {
      for (let i = 0; i < arr.length; i += size) {
        await fn(arr.slice(i, i + size), i / size);
      }
    };

    await chunk(features, 1500, async (part) => {
      const { error } = await supabase
        .from("workflow_features")
        .upsert(part, { onConflict: "source,workflow_id" });
      if (error) throw error;
    });

    // Generate embeddings if API key available
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (OPENAI_API_KEY) {
      const texts = all.map((w: any) => 
        `${w.name || ""}\n${w.description || ""}\n${(w.tags || []).join(",")}`.slice(0, 4000)
      );
      
      await chunk(texts, batchSize, async (part, idx) => {
        const embs = await embedAll(part, OPENAI_API_KEY);
        if (!embs || embs.length === 0) return;
        
        const rows = embs.map((e, i) => {
          const w = all[idx * batchSize + i];
          return {
            source: features[idx * batchSize + i]?.source || "github",
            workflow_id: String(w.id ?? w.filename ?? w.name ?? Math.random()),
            embedding: e,
            updated_at: new Date().toISOString()
          };
        });
        
        embeddedCount += rows.length;
        const { error } = await supabase
          .from("workflow_embeddings")
          .upsert(rows, { onConflict: "source,workflow_id" });
        if (error) throw error;
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[index-workflows-unified] duration=${duration}ms workflows=${totalWorkflows} features=${features.length} embeddings=${embeddedCount}`);
    
    return new Response(JSON.stringify({ 
      updated: features.length, 
      embedded: embeddedCount,
      unified: false,
      workflows: totalWorkflows
    }), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[index-workflows-unified] error after ${duration}ms:`, error);
    throw error;
  }
}

Deno.serve(handler);
