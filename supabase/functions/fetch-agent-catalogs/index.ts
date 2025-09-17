// deno-lint-ignore-file no-explicit-any
declare const Deno: any;

export type HfSpace = {
  id: string; // e.g. "org/space"
  likes?: number;
  downloads?: number;
  updatedAt?: string;
  lastModified?: string;
  tags?: string[];
  title?: string;
  cardData?: { description?: string };
};

export type AgentMinimal = {
  id: string;
  source: string;
  title: string;
  summary: string;
  link: string;
  provider: string;
  tags: string[];
  likes?: number;
  downloads?: number;
  lastModified?: string;
};

// Quality filter (PRD): likes >= 5 OR updated within last 12 months OR downloads > 0
export function isHighQualitySpace(space: HfSpace, now: number = Date.now()): boolean {
  const likes = Number(space.likes || 0);
  const dl = Number(space.downloads || 0);
  const lm = space.updatedAt || space.lastModified;
  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
  const recent = lm ? now - new Date(lm).getTime() <= twelveMonthsMs : false;
  const likesOk = likes >= 5;
  const downloadsOk = dl > 0;
  return likesOk || recent || downloadsOk;
}

// Ranking (2.2 preference): prefer higher likes/downloads and recency
export function qualityScore(space: HfSpace, now: number = Date.now()): number {
  const likes = Number(space.likes || 0);
  const dl = Number(space.downloads || 0);
  const lm = space.updatedAt || space.lastModified;
  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
  const recentBoost = lm && now - new Date(lm).getTime() <= twelveMonthsMs ? 50 : 0;
  // weights: likes x2, downloads x1, recency +50
  return (likes * 2) + dl + recentBoost;
}

Deno.serve(async (req: Request) => {
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const source = String(body?.source || 'hf-spaces');
    const normalized = normalizeSource(source);
    const tags: string[] = Array.isArray(body?.tags) && body.tags.length > 0
      ? body.tags.map((t: string) => String(t).toLowerCase())
      : ['agents', 'autonomous', 'crew'];
    const page = Number(body?.page) > 0 ? Number(body.page) : 1;
    const perPage = Number(body?.perPage) > 0 ? Math.min(Number(body.perPage), 100) : 40;

    if (normalized !== 'hf-spaces') {
      return new Response(JSON.stringify({ success: false, error: `Unknown source ${source}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch HF Spaces; use broad search and filter client-side to ensure compatibility
    // API doc: https://huggingface.co/docs/api/spaces#get-api-spaces
    // We fetch multiple pages defensively; but to keep MVP simple we request a generous limit and slice locally.
    const limit = 200; // fetch a fairly large set then paginate locally
    const url = `https://huggingface.co/api/spaces?full=true&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'prom8eus-agent-ingest/1.0',
      },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: `HF API error ${res.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    const spaces: HfSpace[] = await res.json();

    // Filter by tags (must contain at least one of the requested tags)
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));
    let filtered = (spaces || []).filter((s) => {
      const stags = (s.tags || []).map((t) => String(t).toLowerCase());
      return stags.some((t) => tagSet.has(t));
    });

    // Apply quality filters (PRD) and sort by preference (2.2)
    const nowTs = Date.now();
    filtered = filtered.filter((s) => isHighQualitySpace(s, nowTs));
    filtered.sort((a, b) => qualityScore(b, nowTs) - qualityScore(a, nowTs));

    // Map to minimal agent objects
    const agents: AgentMinimal[] = filtered.map((s) => {
      const link = `https://huggingface.co/spaces/${s.id}`;
      const summary = s.cardData?.description || '';
      const titleFrag = s.title || s.id.split('/').pop() || s.id;
      return {
        id: s.id,
        source: 'hf-spaces',
        title: titleFrag,
        summary,
        link,
        provider: 'HuggingFace Spaces',
        tags: s.tags || [],
        likes: s.likes,
        downloads: s.downloads,
        lastModified: s.updatedAt || s.lastModified,
      };
    });

    // Local pagination
    const start = (page - 1) * perPage;
    const paged = agents.slice(start, start + perPage);

    return new Response(
      JSON.stringify({ success: true, total: agents.length, page, perPage, agents: paged }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

function normalizeSource(s: string): string {
  const v = s.toLowerCase();
  if (v.includes('hf') || v.includes('huggingface')) return 'hf-spaces';
  return v.replace(/\s+/g, '-');
}


