declare const Deno: any;
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  } as Record<string, string>;

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
    let body: any = {};
    try { body = await req.json(); } catch (_) {}
    const source = typeof body.source === 'string' ? body.source : 'github';
    const normalized = normalizeSource(source);

    if (normalized === 'n8n.io') {
      const page = Number(body.page) > 0 ? Number(body.page) : 1;
      const perPage = Number(body.perPage) > 0 ? Math.min(Number(body.perPage), 200) : 100;
      const result = await loadN8nOfficialTemplatesPaged(page, perPage);
      return new Response(JSON.stringify({ success: true, workflows: result.workflows, page, perPage, count: result.workflows.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // GitHub sources
    if (normalized === 'ai-enhanced') {
      const workflows = await loadGithubWorkflows('https://api.github.com/repos/wassupjay/n8n-free-templates');
      return new Response(JSON.stringify({ success: true, workflows, total: workflows.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Awesome n8n templates curated repo
    if (normalized === 'awesome-n8n-templates') {
      const workflows = await loadGithubWorkflows('https://api.github.com/repos/enescingoz/awesome-n8n-templates');
      return new Response(JSON.stringify({ success: true, workflows, total: workflows.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const workflows = await loadGithubWorkflows('https://api.github.com/repos/Zie619/n8n-workflows');
    return new Response(JSON.stringify({ success: true, workflows, total: workflows.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

function normalizeSource(source: string): string {
  const s = (source || '').toLowerCase();
  if (s.includes('n8n.io') || s.includes('official')) return 'n8n.io';
  if (s.includes('github') || s.includes('community') || s.includes('n8n community')) return 'github';
  if (s.includes('ai-enhanced') || s.includes('free templates')) return 'ai-enhanced';
  return s.replace(/\s+/g, '-');
}

async function loadGithubWorkflows(repoUrl: string) {
  const githubToken = Deno?.env?.get('VITE_GITHUB_TOKEN');
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'prom8eus-workflow-indexer',
  };
  if (githubToken) headers['Authorization'] = `token ${githubToken}`;

  const workflows: any[] = [];
  let workflowId = 1;

  // Try common directories that repos might use
  const candidateDirs = ['workflows', 'templates', 'examples'];

  let categories: any[] = [];
  for (const dir of candidateDirs) {
    const categoriesResponse = await fetch(`${repoUrl}/contents/${dir}`, { headers });
    if (categoriesResponse.ok) {
      categories = await categoriesResponse.json();
      // Mark the directory on items so we can fetch deeper
      categories = categories.map((c: any) => ({ ...c, __root: dir }));
      break;
    }
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    // As a last resort, scan the repo root for .json workflow files
    const rootResponse = await fetch(`${repoUrl}/contents`, { headers });
    if (!rootResponse.ok) return workflows;
    const files = await rootResponse.json();
    for (const file of files) {
      if (!file.name || !file.name.endsWith('.json')) continue;
      workflows.push(mapGithubFileToWorkflow(file.name, file.sha, 'misc', workflowId++));
    }
    return workflows;
  }

  for (const category of categories) {
    if (category.type !== 'dir') continue;
    const baseDir = category.__root ? `${category.__root}/` : '';
    const categoryResponse = await fetch(`${repoUrl}/contents/${baseDir}${category.name}`, { headers });
    if (!categoryResponse.ok) continue;
    const files = await categoryResponse.json();

    for (const file of files) {
      if (!file.name || !file.name.endsWith('.json')) continue;
      workflows.push(mapGithubFileToWorkflow(file.name, file.sha, category.name, workflowId++));
    }
  }

  return workflows;
}

function mapGithubFileToWorkflow(fileName: string, sha: string, categoryName: string, id: number) {
  return {
    id,
    filename: fileName,
    name: generateWorkflowName(fileName),
    active: Math.random() > 0.1,
    triggerType: determineTriggerType(fileName),
    complexity: determineComplexity(fileName),
    nodeCount: Math.floor(Math.random() * 20) + 3,
    integrations: extractIntegrations(fileName),
    description: generateDescription(fileName),
    category: mapCategory(categoryName),
    tags: generateTags(fileName),
    fileHash: (sha || '').substring(0, 8),
    analyzedAt: new Date().toISOString(),
  };
}

async function loadN8nOfficialTemplates() {
  try {
    const base = 'https://api.n8n.io/api/templates/workflows';
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; Prom8eusBot/1.0; +https://prom8eus.local)',
      'Referer': 'https://n8n.io/workflows/'
    } as Record<string, string>;

    // 1) Bulk attempt
    let res = await fetch(`${base}?page=1&perPage=6000`, { headers });
    let items: any[] = [];
    if (res.ok) {
      const data = await res.json();
      items = Array.isArray(data.workflows) ? data.workflows : [];
    }

    // 2) Fallback to pagination if bulk failed or yielded 0
    if (!items || items.length === 0) {
      const all: any[] = [];
      let page = 1;
      const perPage = 500;
      for (; page <= 15; page++) {
        const url = `${base}?page=${page}&perPage=${perPage}`;
        const r = await fetch(url, { headers });
        if (!r.ok) break;
        const j = await r.json();
        const batch = Array.isArray(j.workflows) ? j.workflows : [];
        if (batch.length === 0) break;
        all.push(...batch);
        if (batch.length < perPage) break;
      }
      items = all;
    }

    // 3) Final fallback: empty -> mock
    if (!items || items.length === 0) {
      return { workflows: generateMockN8nTemplates() };
    }

    const workflows = (items || []).map((w: any, idx: number) => {
      const id = Number(w.id) || (idx + 1);
      const name = (w.name || `n8n-workflow-${id}`).toString();
      const description = (w.description || `Official n8n workflow: ${name}`).toString();
      const nodes = Array.isArray(w.nodes) ? w.nodes : [];
      const nodeCount = nodes.length || 0;
      const integrationsSet = new Set<string>();
      for (const n of nodes) {
        const raw = (n?.name || n?.id || '').toString();
        if (raw) integrationsSet.add(humanizeIntegration(raw));
      }
      const integrations = Array.from(integrationsSet).slice(0, 12);
      const complexity = nodeCount > 12 ? 'High' : nodeCount > 6 ? 'Medium' : 'Low';
      const triggerType = determineTriggerType(name + ' ' + description);
      const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `n8n-${id}-${safeName}.json`;

      return {
        id,
        filename,
        name,
        active: true,
        triggerType,
        complexity,
        nodeCount,
        integrations,
        description,
        category: determineCategory(name, description),
        tags: generateTagsFromName(name),
        fileHash: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        analyzedAt: new Date().toISOString()
      };
    });

    return { workflows };
  } catch (e) {
    console.error('n8n.io: error', e);
    return { workflows: generateMockN8nTemplates() };
  }
}

async function loadN8nOfficialTemplatesPaged(page: number, perPage: number) {
  const base = 'https://api.n8n.io/api/templates/workflows';
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (compatible; Prom8eusBot/1.0; +https://prom8eus.local)',
    'Referer': 'https://n8n.io/workflows/'
  } as Record<string, string>;
  const url = `${base}?page=${page}&perPage=${perPage}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return { workflows: [] as any[] };
  const data = await res.json();
  const items = Array.isArray(data.workflows) ? data.workflows : [];

  const workflows = items.map((w: any, idx: number) => {
    const id = Number(w.id) || (idx + 1);
    const name = (w.name || `n8n-workflow-${id}`).toString();
    const description = (w.description || `Official n8n workflow: ${name}`).toString();
    const nodes = Array.isArray(w.nodes) ? w.nodes : [];
    const nodeCount = nodes.length || 0;
    const integrationsSet = new Set<string>();
    for (const n of nodes) {
      const raw = (n?.name || n?.id || '').toString();
      if (raw) integrationsSet.add(humanizeIntegration(raw));
    }
    const integrations = Array.from(integrationsSet).slice(0, 12);
    const complexity = nodeCount > 12 ? 'High' : nodeCount > 6 ? 'Medium' : 'Low';
    const triggerType = determineTriggerType(name + ' ' + description);
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `n8n-${id}-${safeName}.json`;

    return {
      id,
      filename,
      name,
      active: true,
      triggerType,
      complexity,
      nodeCount,
      integrations,
      description,
      category: determineCategory(name, description),
      tags: generateTagsFromName(name),
      fileHash: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      analyzedAt: new Date().toISOString()
    };
  });

  return { workflows };
}

function humanizeIntegration(raw: string): string {
  try {
    const seg = (raw || '').split('.').pop() || raw || '';
    const spaced = seg.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    return spaced
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  } catch {
    return raw;
  }
}

function generateWorkflowName(filename: string): string {
  return filename.replace('.json', '').replace(/_/g, ' ').replace(/\d+/g, '').trim();
}

function determineTriggerType(filename: string): 'Complex' | 'Webhook' | 'Manual' | 'Scheduled' {
  const lower = filename.toLowerCase();
  if (lower.includes('webhook')) return 'Webhook';
  if (lower.includes('scheduled') || lower.includes('cron')) return 'Scheduled';
  if (lower.includes('manual')) return 'Manual';
  return 'Complex';
}

function determineComplexity(filename: string): 'Low' | 'Medium' | 'High' {
  const lower = filename.toLowerCase();
  if (lower.includes('complex') || lower.includes('advanced')) return 'High';
  if (lower.includes('simple') || lower.includes('basic')) return 'Low';
  return 'Medium';
}

function extractIntegrations(filename: string): string[] {
  const integrations: string[] = [];
  const lower = filename.toLowerCase();
  const integrationMap: Record<string, string> = {
    'telegram': 'Telegram', 'discord': 'Discord', 'slack': 'Slack', 'openai': 'OpenAI',
    'mysql': 'MySQL', 'postgresql': 'PostgreSQL', 'mailchimp': 'Mailchimp', 'google': 'Google',
    'dropbox': 'Dropbox', 'trello': 'Trello', 'asana': 'Asana', 'jira': 'Jira',
    'twitter': 'Twitter', 'linkedin': 'LinkedIn', 'facebook': 'Facebook', 'shopify': 'Shopify',
    'analytics': 'Google Analytics', 'calendar': 'Google Calendar', 'todoist': 'Todoist',
    'webhook': 'Webhook', 'http': 'HTTP Request', 'schedule': 'Schedule Trigger', 'manual': 'Manual Trigger'
  };
  for (const [key, value] of Object.entries(integrationMap)) if (lower.includes(key)) integrations.push(value);
  return integrations.length > 0 ? integrations : ['HTTP Request'];
}

function generateDescription(filename: string): string {
  const name = generateWorkflowName(filename);
  return `Automated ${name.toLowerCase()} workflow for business process automation`;
}

function mapCategory(categoryName: string): string {
  const categoryMap: Record<string, string> = {
    'telegram': 'messaging', 'discord': 'messaging', 'slack': 'messaging', 'openai': 'ai_ml',
    'mysql': 'database', 'postgresql': 'database', 'mailchimp': 'email', 'gmail': 'email',
    'google': 'cloud_storage', 'dropbox': 'cloud_storage', 'trello': 'project_management', 'asana': 'project_management', 'jira': 'project_management',
    'twitter': 'social_media', 'linkedin': 'social_media', 'facebook': 'social_media', 'shopify': 'ecommerce',
    'analytics': 'analytics', 'calendar': 'calendar_tasks', 'todoist': 'calendar_tasks'
  };
  const lower = (categoryName || '').toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) if (lower.includes(key)) return value;
  return 'messaging';
}

function generateTags(filename: string): string[] {
  const tags: string[] = [];
  const lower = filename.toLowerCase();
  const tagMap = ['webhook','scheduled','manual','automation','data','sync','ai','email','social'];
  for (const tag of tagMap) if (lower.includes(tag)) tags.push(tag);
  return tags.length > 0 ? tags : ['automation'];
}

function parseN8nWorkflows(html: string) {
  const workflows: any[] = [];
  let id = 1;
  try {
    const matches = html.match(/<div[^>]*class="[^"]*workflow[^"]*"[^>]*>.*?<\/div>/gis);
    if (matches) {
      for (const m of matches.slice(0, 100)) {
        const titleMatch = m.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
        const name = (titleMatch ? titleMatch[1].trim() : `n8n-workflow-${id}`);
        const descMatch = m.match(/<p[^>]*>([^<]+)<\/p>/i);
        const description = (descMatch ? descMatch[1].trim() : `Official n8n workflow: ${name}`);
        const filename = `n8n-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
        const integrations = determineIntegrations(name, description);
        const complexity: 'Low'|'Medium'|'High' = integrations.length > 5 ? 'High' : integrations.length > 2 ? 'Medium' : 'Low';
        const triggerType = determineTriggerType(name + ' ' + description);
        workflows.push({
          id: id++, filename, name, active: true, triggerType, complexity,
          nodeCount: Math.floor(Math.random() * 10) + 2,
          integrations,
          description,
          category: determineCategory(name, description),
          tags: generateTagsFromName(name),
          fileHash: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
          analyzedAt: new Date().toISOString()
        });
      }
    }
  } catch (_) {}
  if (workflows.length === 0) return generateMockN8nTemplates();
  return workflows;
}

function determineCategory(name: string, description: string): string {
  const text = (name + ' ' + description).toLowerCase();
  if (text.includes('slack') || text.includes('discord') || text.includes('teams')) return 'communication';
  if (text.includes('google') || text.includes('sheets') || text.includes('database')) return 'database';
  if (text.includes('ai') || text.includes('openai') || text.includes('llm')) return 'ai_ml';
  if (text.includes('email') || text.includes('gmail') || text.includes('outlook')) return 'email';
  if (text.includes('social') || text.includes('twitter') || text.includes('facebook')) return 'social_media';
  if (text.includes('ecommerce') || text.includes('shopify') || text.includes('stripe')) return 'ecommerce';
  if (text.includes('analytics') || text.includes('google analytics')) return 'analytics';
  if (text.includes('calendar') || text.includes('todoist') || text.includes('asana')) return 'calendar_tasks';
  return 'messaging';
}

function determineIntegrations(name: string, description: string): string[] {
  const text = (name + ' ' + description).toLowerCase();
  const integrations: string[] = [];
  if (text.includes('slack')) integrations.push('Slack');
  if (text.includes('google') || text.includes('sheets')) integrations.push('Google Sheets');
  if (text.includes('gmail') || text.includes('email')) integrations.push('Gmail');
  if (text.includes('openai') || text.includes('ai')) integrations.push('OpenAI');
  if (text.includes('notion')) integrations.push('Notion');
  if (text.includes('twitter')) integrations.push('Twitter');
  if (text.includes('linkedin')) integrations.push('LinkedIn');
  if (text.includes('facebook')) integrations.push('Facebook');
  if (text.includes('webhook') || text.includes('http')) integrations.push('HTTP Request');
  if (text.includes('schedule') || text.includes('cron')) integrations.push('Schedule Trigger');
  return integrations.length > 0 ? integrations : ['HTTP Request'];
}

function generateTagsFromName(name: string): string[] {
  const tags: string[] = [];
  const lower = name.toLowerCase();
  const tagMap = ['webhook','scheduled','manual','automation','data','sync','ai','email','social'];
  for (const tag of tagMap) if (lower.includes(tag)) tags.push(tag);
  return tags.length > 0 ? tags : ['automation'];
}

function generateMockN8nTemplates() {
  return [
    {
      id: 1,
      filename: 'n8n-slack-notification.json',
      name: 'Slack Notification Workflow',
      active: true,
      triggerType: 'Webhook',
      complexity: 'Low',
      nodeCount: 3,
      integrations: ['Slack', 'HTTP Request'],
      description: 'Send notifications to Slack channels automatically',
      category: 'communication',
      tags: ['slack', 'notification', 'webhook'],
      fileHash: 'n8n-slack-1',
      analyzedAt: new Date().toISOString()
    },
    {
      id: 2,
      filename: 'n8n-google-sheets-sync.json',
      name: 'Google Sheets Data Sync',
      active: true,
      triggerType: 'Scheduled',
      complexity: 'Medium',
      nodeCount: 5,
      integrations: ['Google Sheets', 'Google Drive'],
      description: 'Automatically sync data between Google Sheets',
      category: 'database',
      tags: ['google', 'sheets', 'sync', 'scheduled'],
      fileHash: 'n8n-sheets-2',
      analyzedAt: new Date().toISOString()
    }
  ];
}
