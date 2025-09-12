import { N8nWorkflow } from '@/lib/n8nApi';

export interface RerankedWorkflow {
  workflow: N8nWorkflow;
  aiScore: number; // 0-100
  reason: string;
}

export interface RerankOptions {
  subtasks?: string[];
  diversify?: boolean;
  topK?: number;
}

function normalize(text: string) {
  return text.toLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text).split(/[^a-z0-9]+/).filter(Boolean);
}

function jaccard(a: Set<string>, b: Set<string>) {
  const inter = new Set([...a].filter(x => b.has(x))).size;
  const uni = new Set([...a, ...b]).size || 1;
  return inter / uni;
}

function normalizeIntegrationName(name: string): string {
  const n = (name || '').toLowerCase();
  const map: Record<string, string> = {
    'http': 'http request',
    'http-request': 'http request',
    'request': 'http request',
    'api': 'http request',
    'mail': 'gmail',
    'email': 'gmail',
    'google mail': 'gmail',
    'sheets': 'google sheets',
    'spreadsheet': 'google sheets',
    'drive': 'google drive',
    'gpt': 'openai',
    'chatgpt': 'openai',
  };
  return map[n] || n;
}

// Lightweight local heuristic with diversification (no API key required)
function localHeuristicScore(task: string, w: N8nWorkflow, tools: string[], subtasks: string[] = []): number {
  const t = normalize(task + ' ' + (subtasks || []).join(' '));
  const text = normalize(`${w.name} ${w.description} ${(w.integrations || []).join(' ')}`);
  let score = 0;
  // keyword overlap
  const taskTokens = new Set(tokenize(t).filter(s => s.length > 3));
  const wfTokens = new Set(tokenize(text));
  score += Math.round(jaccard(taskTokens, wfTokens) * 35);
  // tools overlap (higher weight, normalized)
  const workflowIntegrations = (w.integrations || []).map(i => normalizeIntegrationName(i));
  tools.map(x => normalizeIntegrationName(x)).forEach(tp => {
    if (workflowIntegrations.some(integration => integration.includes(tp))) score += 24;
  });
  // trigger and difficulty hints (stronger)
  if ((w.triggerType || '').toLowerCase().includes('webhook')) score += 8;
  if ((w.triggerType || '').toLowerCase().includes('scheduled')) score += 4;
  const diff = (w as any).difficulty || (w as any).complexity || 'Medium';
  if (String(diff) === 'Easy' || String(diff) === 'Low') score += 3;
  if (String(diff) === 'Hard' || String(diff) === 'High') score -= 1;
  // coverage richness
  score += Math.min(12, (w.integrations?.length || 0) * 1.3);
  return Math.max(0, Math.min(100, score));
}

function mmrDiversify(candidates: RerankedWorkflow[], lambda = 0.7, k = 50): RerankedWorkflow[] {
  const selected: RerankedWorkflow[] = [];
  const remaining = [...candidates];
  while (selected.length < Math.min(k, candidates.length) && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const rel = cand.aiScore / 100;
      let maxSim = 0;
      for (const s of selected) {
        const a = new Set((cand.workflow.integrations || []).map(x => normalizeIntegrationName(x)));
        const b = new Set((s.workflow.integrations || []).map(x => normalizeIntegrationName(x)));
        const sim = jaccard(a, b);
        if (sim > maxSim) maxSim = sim;
      }
      const mmr = lambda * rel - (1 - lambda) * maxSim;
      if (mmr > bestScore) { bestScore = mmr; bestIdx = i; }
    }
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }
  return selected;
}

export async function rerankWorkflows(
  taskText: string,
  workflows: N8nWorkflow[],
  selectedTools: string[] = [],
  options: RerankOptions = {}
): Promise<RerankedWorkflow[]> {
  const { subtasks = [], diversify = true, topK = 60 } = options;
  const apiKey = (globalThis as any).OPENAI_API_KEY || import.meta?.env?.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key');

  // If no key, use enhanced heuristic with diversification
  if (!apiKey) {
    const scored = workflows.map(w => ({
      workflow: w,
      aiScore: localHeuristicScore(taskText, w, selectedTools, subtasks),
      reason: 'Score based on keyword+subtask and integration overlap (heuristic)'
    })).sort((a, b) => b.aiScore - a.aiScore);
    return diversify ? mmrDiversify(scored, 0.75, topK) : scored.slice(0, topK);
  }

  // Keep payload small
  const items = workflows.slice(0, 200).map(w => ({
    id: w.id,
    name: w.name,
    description: w.description,
    integrations: w.integrations || [],
    triggerType: w.triggerType || 'Manual',
    nodes: w.nodes || 0,
    difficulty: w.difficulty || 'Medium'
  }));

  const prompt = `You rank real n8n workflows for a user's task with subtasks.
Task: ${taskText}
Subtasks: ${subtasks.join(' | ') || 'none'}
Selected tools: ${selectedTools.join(', ') || 'none'}
Return JSON array under key "data": [{id, score(0-100), reason}]
Rubric (strict):
- +35: Covers at least one core subtask; +15 if covers multiple
- +25: Uses required/selected tools or close equivalents (e.g., gmail/email)
- +15: Trigger fits (webhook/scheduled/manual) and difficulty realistic
- +15: Name+description semantically match subtask verbs/nouns
- −25: Generic/marketing-only descriptions without implementable steps
- Keep reasons short (<=120 chars). Diversify by different integrations.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful ranking assistant.' },
          { role: 'user', content: `${prompt}\nWorkflows: ${JSON.stringify(items).slice(0, 11000)}` }
        ],
        temperature: 0,
        top_p: 1,
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    let parsed: Array<{ id: string; score: number; reason: string }>; 
    try { parsed = JSON.parse(content)?.data || JSON.parse(content); } catch { parsed = []; }

    const map = new Map(workflows.map(w => [w.id, w] as const));
    let scored: RerankedWorkflow[] = parsed
      .filter((r: any) => r && map.has(r.id))
      .map((r: any) => ({ workflow: map.get(r.id)!, aiScore: Math.max(0, Math.min(100, Number(r.score) || 0)), reason: String(r.reason || '').slice(0, 180) }));

    // Fill missing with heuristic so we have full coverage
    const covered = new Set(scored.map(x => x.workflow.id));
    workflows.forEach(w => { if (!covered.has(w.id)) scored.push({ workflow: w, aiScore: localHeuristicScore(taskText, w, selectedTools, subtasks), reason: 'Heuristic backfill' }); });

    scored.sort((a, b) => b.aiScore - a.aiScore);
    return diversify ? mmrDiversify(scored, 0.75, topK) : scored.slice(0, topK);
  } catch (e) {
    // Fallback to heuristic with diversification
    const scored = workflows.map(w => ({
      workflow: w,
      aiScore: localHeuristicScore(taskText, w, selectedTools, subtasks),
      reason: 'Heuristic fallback'
    })).sort((a, b) => b.aiScore - a.aiScore);
    return diversify ? mmrDiversify(scored, 0.75, topK) : scored.slice(0, topK);
  }
}


