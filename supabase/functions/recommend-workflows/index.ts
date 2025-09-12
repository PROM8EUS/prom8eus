// Deno Deploy / Supabase Edge Function: recommend-workflows
// - Build a lightweight ProblemProfile (LLM optional)
// - Retrieve workflows from cached sources (union)
// - Heuristic scoring + diversification
// - Return top 6 with compact reasons

// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Subtask = { id?: string; name: string; keywords?: string[] };

type Input = {
  taskText?: string;
  subtasks?: Subtask[];
  selectedApplications?: string[];
  flags?: { enableLLM?: boolean; topK?: number; llmTimeoutMs?: number };
};

type Workflow = {
  id?: number | string;
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
  authorAvatar?: string;
  authorVerified?: boolean;
};

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key);
}

const normalize = (s: string) => (s || "").toLowerCase().trim();
function normalizeIntegration(raw: string): string {
  const s = normalize(raw);
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
    "graphql": "graphql",
  };
  for (const [k, v] of Object.entries(map)) if (s.includes(k)) return v;
  return s;
}
function normalizedIntegrations(w: Workflow): string[] {
  const out = new Set<string>();
  (w.integrations || []).forEach(i => out.add(normalizeIntegration(i)));
  const text = `${w.filename || ""} ${w.name || ""} ${w.description || ""}`.toLowerCase();
  ["webhook","http","gmail","google drive","google sheets","postgres","mysql","mongo","slack","github","graphql","openai"].forEach(key => { if (text.includes(key)) out.add(normalizeIntegration(key)); });
  return Array.from(out);
}
function normalizedTrigger(w: Workflow): string | null {
  const r = normalize(w.triggerType || "");
  if (!r) return null;
  if (r.includes("webhook")) return "webhook";
  if (r.includes("schedule") || r.includes("cron")) return "scheduled";
  if (r.includes("manual")) return "manual";
  return r;
}
function complexityBand(w: Workflow): "low" | "medium" | "high" {
  const r = normalize(w.complexity || "");
  if (r.includes("high")) return "high";
  if (r.includes("low")) return "low";
  return "medium";
}

function tokenize(t = ""): string[] { return t.toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2); }

async function buildProfile(input: Input) {
  const tokens = new Set<string>();
  tokenize(input.taskText || "").forEach(t => tokens.add(t));
  (input.subtasks || []).forEach(s => { tokenize(s.name).forEach(t => tokens.add(t)); (s.keywords || []).forEach(k => tokens.add(k.toLowerCase())); });
  const selected = (input.selectedApplications || []).map(normalize);
  const mustHave = Array.from(new Set<string>(selected));
  const nice = Array.from(tokens).filter(t => ["slack","gmail","github","postgresql","mysql","mongodb","graphql","webhook","http"].includes(t));
  const triggers: string[] = tokens.has("webhook") ? ["webhook"] : [];
  return { mustHaveIntegrations: mustHave, niceToHaveIntegrations: nice, triggersRequired: triggers, keywords: Array.from(tokens), complexityBand: "medium" };
}

function lexicalScore(w: Workflow, keywords: string[]): number {
  const text = `${w.name || ""} ${w.description || ""} ${(w.tags || []).join(" ")}`.toLowerCase();
  let hits = 0; keywords.forEach(k => { if (text.includes(k)) hits++; });
  return hits / Math.max(1, keywords.length);
}

function scoreWorkflow(w: Workflow, profile: any): { score: number; reason: string } {
  const ints = normalizedIntegrations(w);
  const tr = normalizedTrigger(w);
  const band = complexityBand(w);
  const must = new Set(profile.mustHaveIntegrations.map(normalize));
  const nice = new Set(profile.niceToHaveIntegrations.map(normalize));
  let overlap = 0, niceOverlap = 0;
  ints.forEach(x => { if (must.has(x)) overlap += 2; else if (nice.has(x)) niceOverlap += 1; });
  const trig = profile.triggersRequired.length ? (profile.triggersRequired.includes(tr || "") ? 1 : 0) : 0.5;
  const lex = lexicalScore(w, profile.keywords);
  const cfit = (profile.complexityBand === band) ? 1 : 0.6;
  const prior = w.authorVerified ? 0.2 : 0;
  const score = overlap * 0.5 + niceOverlap * 0.2 + trig * 0.2 + lex * 0.6 + cfit * 0.2 + prior * 0.1;
  const reason = [
    overlap > 0 ? `tools: ${ints.filter(x=>must.has(x)).slice(0,3).join(', ')}` : null,
    trig >= 1 ? `trigger: ${tr}` : null,
    lex > 0 ? `keywords match` : null,
  ].filter(Boolean).join(" · ");
  return { score, reason };
}

function mmrSelect(items: any[], k: number): any[] {
  const selected: any[] = [];
  const seenInts = new Set<string>();
  while (items.length && selected.length < k) {
    items.sort((a, b) => (b.score - a.score));
    const pick = items.shift()!;
    selected.push(pick);
    (pick.workflow.integrations || []).forEach((i: string) => seenInts.add(normalizeIntegration(i)));
    // diversity: downweight items sharing many integrations
    items = items.map(x => {
      const ints = normalizedIntegrations(x.workflow);
      const overlap = ints.filter(i => seenInts.has(i)).length;
      return { ...x, score: x.score - overlap * 0.05 };
    });
  }
  return selected;
}

async function handler(req: Request): Promise<Response> {
  const startTime = Date.now();
  let candidateCount = 0;
  let cacheHit = false;
  
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
    const input = await req.json() as Input;
    const supabase = getSupabase();

    // Build profile (LLM could be added later); use deterministic builder for MVP
    const profile = await buildProfile(input);

    // Load union of workflows from cache
    const sources = ["github","n8n.io","ai-enhanced"];
    const union: Workflow[] = [];
    for (const s of sources) {
      const { data } = await (supabase as any)
        .from("workflow_cache")
        .select("source, workflows")
        .like("source", `${s}%`)
        .eq("version", "v1.5.0");
      const rows: any[] = Array.isArray(data) ? data : (data ? [data] : []);
      rows.forEach(r => { (r?.workflows || []).forEach((w: any) => union.push(w)); });
    }

    if (union.length === 0) {
      const duration = Date.now() - startTime;
      console.log(`[recommend-workflows] duration=${duration}ms candidates=0 cache=false results=0 (no workflows found)`);
      return new Response(JSON.stringify({ solutions: [], usedCache: false, latencyMs: duration }), { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      });
    }

    // Filter by must-have/nice-to-have
    const must = new Set(profile.mustHaveIntegrations.map(normalize));
    const nice = new Set(profile.niceToHaveIntegrations.map(normalize));
    let pool = union.filter(w => {
      const ints = normalizedIntegrations(w);
      const hasMust = Array.from(must).length === 0 ? true : ints.some(x => must.has(x));
      const hasNice = ints.some(x => nice.has(x));
      return hasMust || hasNice;
    });
    // If too small, use full union
    if (pool.length < 50) pool = union;

    // Score candidates
    const scored = pool.map(w => ({ workflow: w, ...scoreWorkflow(w, profile) }));
    scored.sort((a, b) => b.score - a.score);
    const capped = scored.slice(0, Math.min(600, scored.length));
    candidateCount = capped.length;

    // Diversify and pick final 6
    const final = mmrSelect(capped, input.flags?.topK ?? 6);
    const solutions = final.map(item => ({
      id: String(item.workflow.id ?? item.workflow.filename ?? item.workflow.name ?? Math.random()),
      name: item.workflow.name || "n8n Workflow",
      description: item.workflow.description || "",
      integrations: item.workflow.integrations || [],
      authorName: (item.workflow as any).authorName || (item.workflow as any).authorUsername || "Community",
      authorAvatarUrl: (item.workflow as any).authorAvatar,
      authorVerified: !!(item.workflow as any).authorVerified,
      reason: item.reason
    }));

    const duration = Date.now() - startTime;
    console.log(`[recommend-workflows] duration=${duration}ms candidates=${candidateCount} cache=${cacheHit} results=${solutions.length}`);
    
    return new Response(JSON.stringify({ solutions, usedCache: true, latencyMs: duration }), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[recommend-workflows] error after ${duration}ms:`, (e as Error).message);
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


