// Deno Deploy / Supabase Edge Function: index-workflows
// - Normalizes workflow features
// - Generates embeddings (if VITE_OPENAI_API_KEY is set)
// - Upserts into workflow_features and workflow_embeddings with safe batching

// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type WorkflowIndex = {
  id: number | string;
  filename?: string;
  name?: string;
  description?: string;
  active?: boolean;
  triggerType?: string;
  complexity?: string;
  nodeCount?: number;
  integrations?: string[];
  tags?: string[];
  authorName?: string;
  authorUsername?: string;
  authorVerified?: boolean;
};

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key);
}

function normalizeIntegration(raw: string): string {
  const s = (raw || "").toLowerCase();
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
  for (const [k, v] of Object.entries(map)) {
    if (s.includes(k)) return v;
  }
  return s.trim();
}

function normalizeTrigger(raw?: string): string[] {
  const r = (raw || "").toLowerCase();
  if (r.includes("webhook")) return ["webhook"];
  if (r.includes("schedule") || r.includes("cron")) return ["scheduled"];
  if (r.includes("manual")) return ["manual"];
  if (r) return [r];
  return [];
}

function complexityBand(raw?: string): "low" | "medium" | "high" | null {
  const r = (raw || "").toLowerCase();
  if (r.includes("low")) return "low";
  if (r.includes("medium")) return "medium";
  if (r.includes("high")) return "high";
  return null;
}

function deriveIntegrations(w: WorkflowIndex): string[] {
  const out = new Set<string>();
  (w.integrations || []).forEach(i => out.add(normalizeIntegration(i)));
  const text = `${w.filename || ""} ${w.name || ""} ${w.description || ""}`.toLowerCase();
  ["webhook","http","gmail","google drive","google sheets","postgres","mysql","mongo","slack","github","graphql","openai"].forEach(key => {
    if (text.includes(key)) out.add(normalizeIntegration(key));
  });
  return Array.from(out);
}

function qualityPrior(w: WorkflowIndex): number {
  let q = 0;
  if (w.authorVerified) q += 0.2;
  // light heuristic: official sources tend to include "n8n" naming; boost a bit via tags/description
  const t = `${w.description || ""} ${(w.tags || []).join(" ")}`.toLowerCase();
  if (t.includes("official") || t.includes("template")) q += 0.1;
  return Math.min(1, Math.max(0, q));
}

async function embedAll(texts: string[], apiKey?: string): Promise<number[][]> {
  if (!apiKey) return [];
  const body = {
    input: texts,
    model: "text-embedding-3-large"
  };
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Embedding error ${res.status}`);
  const j = await res.json();
  return (j.data || []).map((d: any) => d.embedding as number[]);
}

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
    if (req.method !== "POST") return new Response("Method Not Allowed", { 
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    const { sources = ["github","n8n.io","ai-enhanced"], batchSize = 800 } = await req.json().catch(() => ({}));
    const supabase = getSupabase();

    // Load per-source cached workflows (support shards via LIKE)
    const all: WorkflowIndex[] = [];
    for (const s of sources) {
      const { data, error } = await (supabase as any)
        .from("workflow_cache")
        .select("source, workflows")
        .like("source", `${s}%`)
        .eq("version", "v1.5.0");
      if (error) continue;
      const rows: any[] = Array.isArray(data) ? data : (data ? [data] : []);
      rows.forEach(r => {
        const arr: WorkflowIndex[] = (r?.workflows || []) as any[];
        arr.forEach(w => all.push(w));
      });
    }

    if (all.length === 0) {
      return new Response(JSON.stringify({ updated: 0, message: "No workflows found" }), { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      });
    }
    
    totalWorkflows = all.length;

    // Build feature rows
    const features = all.map((w) => {
      const src = sources.find(s => (w.filename || "").toLowerCase().startsWith("n8n-") ? s === "n8n.io" : s) || "github";
      const integrations = deriveIntegrations(w);
      const triggers = normalizeTrigger(w.triggerType);
      const complexity = complexityBand(w.complexity || undefined);
      return {
        source: src,
        workflow_id: String(w.id ?? w.filename ?? w.name ?? Math.random()),
        integrations_norm: integrations,
        triggers_norm: triggers,
        complexity_band: complexity,
        author_verified: !!w.authorVerified,
        rating: null,
        quality_prior: qualityPrior(w),
        updated_at: new Date().toISOString()
      };
    });

    // Upsert features in chunks to avoid timeouts
    const chunk = async <T,>(arr: T[], size: number, fn: (part: T[], idx: number) => Promise<void>) => {
      for (let i = 0; i < arr.length; i += size) {
        await fn(arr.slice(i, i + size), i / size);
      }
    };

    await chunk(features, 1500, async (part) => {
      const { error } = await (supabase as any)
        .from("workflow_features")
        .upsert(part, { onConflict: "source,workflow_id" });
      if (error) throw error;
    });

    // Generate embeddings if API key available
    const OPENAI_API_KEY = Deno.env.get("VITE_OPENAI_API_KEY");
    let embedded = 0;
    if (OPENAI_API_KEY) {
      // Prepare texts
      const texts = all.map(w => `${w.name || ""}\n${w.description || ""}\n${(w.tags || []).join(",")}`.slice(0, 4000));
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
        const { error } = await (supabase as any)
          .from("workflow_embeddings")
          .upsert(rows, { onConflict: "source,workflow_id" });
        if (error) throw error;
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[index-workflows] duration=${duration}ms workflows=${totalWorkflows} features=${features.length} embeddings=${embeddedCount}`);
    
    return new Response(JSON.stringify({ updated: features.length, embedded: embeddedCount }), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[index-workflows] error after ${duration}ms:`, (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), { 
      status: 500, 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });
  }
}

Deno.serve(handler);


