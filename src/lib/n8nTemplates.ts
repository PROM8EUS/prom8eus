// n8n Templates Loader - Loads templates from n8n repository
export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  platform: 'n8n';
  source: string;
  repository?: string;
  documentation?: string;
  webhookUrl?: string;
  version: string;
  cachedAt: string;
}

export interface N8nTemplate extends WorkflowTemplate {
  platform: 'n8n';
  source: 'n8n-io/n8n';
  workflowId: string;
  nodes: any[];
  connections: any[];
  settings: any;
}

export type CachedTemplate = N8nTemplate;

// n8n Repository Configuration
const N8N_CONFIG = {
  baseUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master',
  workflowsPath: '/workflows',
  apiUrl: 'https://api.github.com/repos/n8n-io/n8n/contents/workflows'
};

// Template Registry - Maps our template IDs to n8n workflow files
const TEMPLATE_REGISTRY = {
  'n8n-crm-to-sheets': 'crm-to-sheets-sync.json',
  'n8n-invoice-processing': 'invoice-processing-ocr.json',
  'n8n-social-media-scheduler': 'social-media-scheduler.json',
  'n8n-customer-support': 'customer-support-automation.json'
};

// Fallback mock workflows in case API fails
const MOCK_WORKFLOWS: N8nTemplate[] = [
  {
    id: 'n8n-crm-to-sheets',
    platform: 'n8n',
    title: 'CRM to Google Sheets Sync',
    description: 'Automatically sync customer data from CRM to Google Sheets for reporting',
    category: 'CRM',
    tags: ['crm', 'sheets', 'sync', 'automation'],
    workflowId: 'crm-to-sheets-sync',
    nodes: [
      { id: 'trigger', type: 'webhook', name: 'CRM Webhook' },
      { id: 'process', type: 'function', name: 'Process Data' },
      { id: 'sheets', type: 'googleSheets', name: 'Update Sheets' }
    ],
    connections: [
      { from: 'trigger', to: 'process' },
      { from: 'process', to: 'sheets' }
    ],
    settings: { timeout: 30 },
    source: 'n8n-io/n8n',
    repository: 'https://github.com/n8n-io/n8n',
    documentation: 'https://docs.n8n.io/workflows/crm-to-sheets-sync',
    cachedAt: new Date().toISOString(),
    version: '1.0.0'
  },
  {
    id: 'n8n-invoice-processing',
    platform: 'n8n',
    title: 'Invoice Processing with OCR',
    description: 'Automatically process invoices using OCR and extract data to accounting system',
    category: 'Finance',
    tags: ['finance', 'ocr', 'invoice', 'automation'],
    workflowId: 'invoice-processing-ocr',
    nodes: [
      { id: 'trigger', type: 'webhook', name: 'Invoice Upload' },
      { id: 'ocr', type: 'function', name: 'OCR Processing' },
      { id: 'accounting', type: 'http', name: 'Update Accounting' }
    ],
    connections: [
      { from: 'trigger', to: 'ocr' },
      { from: 'ocr', to: 'accounting' }
    ],
    settings: { timeout: 60 },
    source: 'n8n-io/n8n',
    repository: 'https://github.com/n8n-io/n8n',
    documentation: 'https://docs.n8n.io/workflows/invoice-processing-ocr',
    cachedAt: new Date().toISOString(),
    version: '1.0.0'
  },
  {
    id: 'n8n-social-media-scheduler',
    platform: 'n8n',
    title: 'Social Media Content Scheduler',
    description: 'Schedule and post content across multiple social media platforms',
    category: 'Marketing',
    tags: ['marketing', 'social-media', 'scheduling', 'automation'],
    workflowId: 'social-media-scheduler',
    nodes: [
      { id: 'trigger', type: 'schedule', name: 'Daily Schedule' },
      { id: 'content', type: 'function', name: 'Generate Content' },
      { id: 'twitter', type: 'twitter', name: 'Post to Twitter' },
      { id: 'linkedin', type: 'linkedin', name: 'Post to LinkedIn' }
    ],
    connections: [
      { from: 'trigger', to: 'content' },
      { from: 'content', to: 'twitter' },
      { from: 'content', to: 'linkedin' }
    ],
    settings: { timeout: 45 },
    source: 'n8n-io/n8n',
    repository: 'https://github.com/n8n-io/n8n',
    documentation: 'https://docs.n8n.io/workflows/social-media-scheduler',
    cachedAt: new Date().toISOString(),
    version: '1.0.0'
  },
  {
    id: 'n8n-customer-support',
    platform: 'n8n',
    title: 'Customer Support Automation',
    description: 'Automate customer support ticket routing and responses',
    category: 'Support',
    tags: ['support', 'automation', 'tickets', 'routing'],
    workflowId: 'customer-support-automation',
    nodes: [
      { id: 'trigger', type: 'webhook', name: 'Support Ticket' },
      { id: 'classify', type: 'function', name: 'Classify Ticket' },
      { id: 'route', type: 'function', name: 'Route to Agent' },
      { id: 'notify', type: 'email', name: 'Notify Customer' }
    ],
    connections: [
      { from: 'trigger', to: 'classify' },
      { from: 'classify', to: 'route' },
      { from: 'route', to: 'notify' }
    ],
    settings: { timeout: 30 },
    source: 'n8n-io/n8n',
    repository: 'https://github.com/n8n-io/n8n',
    documentation: 'https://docs.n8n.io/workflows/customer-support-automation',
    cachedAt: new Date().toISOString(),
    version: '1.0.0'
  }
];



// Cache for loaded templates
let templateCache: Map<string, CachedTemplate> = new Map();
let isLoaded = false;

/**
 * Load all n8n templates from repository at startup
 */
export async function loadAllTemplates(): Promise<Map<string, CachedTemplate>> {
  if (isLoaded) {
    return templateCache;
  }

  console.log('Loading n8n templates from repository...');
  
  try {
    // Load all templates in parallel
    const loadPromises = Object.entries(TEMPLATE_REGISTRY).map(async ([templateId, workflowFile]) => {
      try {
        const template = await loadN8nTemplate(templateId, workflowFile);
        templateCache.set(templateId, template);
        console.log(`✓ Loaded n8n template: ${template.title}`);
        return template;
      } catch (error) {
        console.warn(`⚠ Failed to load template ${templateId}:`, error);
        return null;
      }
    });

    await Promise.all(loadPromises);
    
    // If no templates were loaded from API, use mock workflows
    if (templateCache.size === 0) {
      console.log('⚠ No templates loaded from API, using mock workflows');
      MOCK_WORKFLOWS.forEach(workflow => {
        templateCache.set(workflow.id, workflow);
      });
      console.log(`✅ Loaded ${templateCache.size} mock n8n templates`);
    }
    
    isLoaded = true;
    console.log(`✅ Loaded ${templateCache.size} n8n templates successfully`);
    return templateCache;
    
  } catch (error) {
    console.error('❌ Failed to load n8n templates, using mock workflows:', error);
    
    // Use mock workflows as fallback
    MOCK_WORKFLOWS.forEach(workflow => {
      templateCache.set(workflow.id, workflow);
    });
    
    isLoaded = true;
    console.log(`✅ Loaded ${templateCache.size} mock n8n templates as fallback`);
    return templateCache;
  }
}

/**
 * Load a single n8n template from repository
 */
async function loadN8nTemplate(templateId: string, workflowFile: string): Promise<N8nTemplate> {
  const workflowUrl = `${N8N_CONFIG.baseUrl}${N8N_CONFIG.workflowsPath}/${workflowFile}`;
  
  const response = await fetch(workflowUrl);
  if (!response.ok) {
    throw new Error(`Failed to load n8n workflow ${workflowFile}: ${response.status}`);
  }

  const n8nWorkflow = await response.json();
  
  return {
    id: templateId,
    platform: 'n8n',
    title: n8nWorkflow.name || templateId,
    description: `Official n8n workflow: ${n8nWorkflow.name || templateId}`,
    category: getCategoryFromTags(n8nWorkflow.tags),
    tags: n8nWorkflow.tags || [],
    workflowId: workflowFile.replace('.json', ''),
    nodes: n8nWorkflow.nodes || [],
    connections: n8nWorkflow.connections || [],
    settings: n8nWorkflow.settings || {},
    webhookUrl: n8nWorkflow.webhookUrl,
    source: 'n8n-io/n8n',
    repository: 'https://github.com/n8n-io/n8n',
    documentation: `https://docs.n8n.io/workflows/${workflowFile.replace('.json', '')}`,
    cachedAt: new Date().toISOString(),
    version: '1.0.0'
  };
}



/**
 * Get template from cache
 */
export function getTemplate(templateId: string): CachedTemplate | null {
  return templateCache.get(templateId) || null;
}

/**
 * Get all cached templates
 */
export function getAllCachedTemplates(): CachedTemplate[] {
  return Array.from(templateCache.values());
}

/**
 * Get templates by platform
 */
export function getTemplatesByPlatform(platform: 'n8n'): CachedTemplate[] {
  return Array.from(templateCache.values()).filter(template => template.platform === platform);
}

/**
 * Check if templates are loaded
 */
export function areTemplatesLoaded(): boolean {
  return isLoaded;
}

/**
 * Clear cache and reload templates
 */
export async function refreshTemplates(): Promise<Map<string, CachedTemplate>> {
  templateCache.clear();
  isLoaded = false;
  return await loadAllTemplates();
}

/**
 * Helper: Extract category from tags
 */
function getCategoryFromTags(tags: string[]): string {
  if (!tags || tags.length === 0) return 'General';
  
  const categoryMap: { [key: string]: string } = {
    'crm': 'CRM',
    'finance': 'Finance', 
    'marketing': 'Marketing',
    'support': 'Support',
    'automation': 'Automation',
    'integration': 'Integration'
  };

  for (const tag of tags) {
    if (categoryMap[tag.toLowerCase()]) {
      return categoryMap[tag.toLowerCase()];
    }
  }
  
  return 'General';
}

/**
 * Get template statistics
 */
export function getTemplateStats() {
  return {
    total: templateCache.size,
    categories: Array.from(templateCache.values()).reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }),
    lastUpdated: isLoaded ? new Date().toISOString() : null
  };
}
