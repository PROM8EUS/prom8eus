// Client wrapper to call the recommend-workflows Edge Function

export interface RecommendInput {
  taskText?: string;
  subtasks?: Array<{ id?: string; name: string; keywords?: string[] }>;
  selectedApplications?: string[];
  flags?: { enableLLM?: boolean; topK?: number; llmTimeoutMs?: number };
}

export interface RecommendSolution {
  id: string;
  name: string;
  description?: string;
  integrations?: string[];
  authorName?: string;
  authorAvatarUrl?: string;
  authorVerified?: boolean;
  reason?: string;
}

export async function recommendWorkflows(input: RecommendInput): Promise<RecommendSolution[]> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Supabase env not configured');
  
  const resp = await fetch(`${url}/functions/v1/recommend-workflows`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${anon}` 
    },
    body: JSON.stringify(input)
  });
  
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`recommend-workflows error ${resp.status}: ${errorText}`);
  }
  
  const json = await resp.json();
  return (json?.solutions || []) as RecommendSolution[];
}


