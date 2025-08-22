// Workflow APIs Integration
// n8n Repository: https://github.com/n8n-io/n8n/tree/master/workflows
// Zapier Templates: https://zapier.com/apps (no public API)
// Make Templates: https://www.make.com/en/help/apps (no public API)

export interface WorkflowAPI {
  id: string;
  name: string;
  description: string;
  provider: 'n8n' | 'zapier' | 'make' | 'airflow' | 'custom';
  category: string;
  tags: string[];
  author?: {
    name: string;
    github?: string;
    avatar?: string;
    verified?: boolean;
    bio?: string;
  };
  pricing?: {
    type: 'free' | 'one-time' | 'subscription';
    cost?: number;
    unit?: string;
  };
  source: string;
  lastUpdated: string;
  downloads?: number;
  rating?: number;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: number; // in hours
  nodes?: any[];
  systems?: string[];
}

export interface N8nWorkflow {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  author: string;
  created_at: string;
  updated_at: string;
  downloads: number;
  stars: number;
  nodes: any[];
}

// Helper function to derive category from workflow name and description
const deriveCategory = (name: string, description: string): string => {
  const text = `${name} ${description}`.toLowerCase();
  
  if (text.includes('ai') || text.includes('agent') || text.includes('chatbot') || text.includes('gpt') || text.includes('openai') || text.includes('gemini')) {
    return 'AI & Automation';
  }
  if (text.includes('video') || text.includes('youtube') || text.includes('tiktok') || text.includes('instagram') || text.includes('social') || text.includes('media')) {
    return 'Content Creation';
  }
  if (text.includes('seo') || text.includes('keyword') || text.includes('ranking') || text.includes('marketing')) {
    return 'Marketing & SEO';
  }
  if (text.includes('crm') || text.includes('sales') || text.includes('customer') || text.includes('lead')) {
    return 'Sales & CRM';
  }
  if (text.includes('email') || text.includes('mail') || text.includes('notification')) {
    return 'Communication';
  }
  if (text.includes('data') || text.includes('analytics') || text.includes('report') || text.includes('sheet')) {
    return 'Data & Analytics';
  }
  if (text.includes('document') || text.includes('pdf') || text.includes('ocr') || text.includes('invoice')) {
    return 'Document Processing';
  }
  if (text.includes('tutorial') || text.includes('learn') || text.includes('guide') || text.includes('education')) {
    return 'Education & Training';
  }
  
  return 'Automation';
};

// n8n Workflows API - Using the real n8n API endpoint
export const fetchN8nWorkflows = async (): Promise<WorkflowAPI[]> => {
  try {
    // Use the real n8n API endpoint for templates
    const response = await fetch('https://api.n8n.io/templates/search?limit=10');
    
    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('n8n API response:', data);
    if (data.workflows && data.workflows.length > 0) {
      console.log('Sample workflow data:', data.workflows[0]);
    }
    
    if (data && data.workflows && Array.isArray(data.workflows)) {
      const workflows: WorkflowAPI[] = data.workflows.map((workflow: any) => ({
        id: `n8n-${workflow.id}`,
        name: workflow.name || 'Untitled Workflow',
        description: workflow.description || `n8n Workflow: ${workflow.name}`,
        provider: 'n8n',
        category: deriveCategory(workflow.name || '', workflow.description || ''),
        tags: workflow.tags || [deriveCategory(workflow.name || '', workflow.description || '').toLowerCase().replace(/[^a-z0-9]/g, '-'), 'n8n', 'automation'],
        author: {
          name: workflow.user?.name || workflow.user?.username || 'n8n Community',
          github: workflow.user?.github || 'n8n-io',
          avatar: workflow.user?.avatar || 'https://avatars.githubusercontent.com/u/45487711?v=4',
          verified: workflow.user?.verified || false,
          bio: workflow.user?.bio || ''
        },
        pricing: { type: 'free' },
        source: `https://n8n.io/workflows/${workflow.id}`,
        lastUpdated: workflow.createdAt || new Date().toISOString(),
        downloads: workflow.totalViews || 0, // Use real totalViews from API
        rating: 4.5 + Math.random() * 0.5, // n8n doesn't provide ratings in API
        complexity: workflow.nodes?.length > 10 ? 'complex' : workflow.nodes?.length > 5 ? 'medium' : 'simple',
        estimatedTime: Math.floor(workflow.nodes?.length / 2) + 2,
        nodes: workflow.nodes || [],
        systems: workflow.nodes?.map((node: any) => {
          // Extract meaningful system names from node names
          const nodeName = node.name || '';
          if (nodeName.includes('gmail') || nodeName.includes('mail')) return 'Gmail';
          if (nodeName.includes('slack')) return 'Slack';
          if (nodeName.includes('sheets') || nodeName.includes('google')) return 'Google Sheets';
          if (nodeName.includes('openai') || nodeName.includes('gpt')) return 'OpenAI';
          if (nodeName.includes('gemini')) return 'Google Gemini';
          if (nodeName.includes('youtube')) return 'YouTube';
          if (nodeName.includes('instagram')) return 'Instagram';
          if (nodeName.includes('tiktok')) return 'TikTok';
          if (nodeName.includes('crm') || nodeName.includes('salesforce')) return 'CRM';
          if (nodeName.includes('hubspot')) return 'HubSpot';
          if (nodeName.includes('zapier')) return 'Zapier';
          if (nodeName.includes('make')) return 'Make';
          if (nodeName.includes('http') || nodeName.includes('api')) return 'API';
          if (nodeName.includes('langchain') || nodeName.includes('agent')) return 'AI Agent';
          return nodeName.split('.').pop() || 'n8n';
        }).filter((system, index, arr) => arr.indexOf(system) === index) || ['n8n', 'api', 'automation']
      }));
      
      console.log(`✅ Loaded ${workflows.length} n8n templates successfully`);
      return workflows;
    }
    
    console.log('No workflows found in API response structure');
    return [];
  } catch (error) {
    console.error('Error fetching n8n workflows:', error);
    // Fallback to mock data if API fails
    return [
      {
        id: 'n8n-email-automation',
        name: 'Email Marketing Automation',
        description: 'Automate email campaigns with customer segmentation and personalized content',
        provider: 'n8n',
        category: 'Marketing',
        tags: ['email', 'marketing', 'automation'],
        author: {
          name: 'n8n Community',
          github: 'n8n-io',
          avatar: 'https://avatars.githubusercontent.com/u/45487711?v=4'
        },
        pricing: { type: 'free' },
        source: 'https://n8n.io/workflows/email-automation',
        lastUpdated: '2024-01-15T10:30:00Z',
        downloads: 1250,
        rating: 4.8,
        complexity: 'medium',
        estimatedTime: 5,
        nodes: [
          { name: 'Gmail', type: 'trigger' },
          { name: 'Mailchimp', type: 'action' },
          { name: 'Google Sheets', type: 'action' }
        ],
        systems: ['gmail', 'mailchimp', 'google-sheets']
      },
      {
        id: 'n8n-crm-sync',
        name: 'CRM Data Synchronization',
        description: 'Keep customer data synchronized across multiple CRM systems',
        provider: 'n8n',
        category: 'Sales',
        tags: ['crm', 'sync', 'data'],
        author: {
          name: 'n8n Community',
          github: 'n8n-io',
          avatar: 'https://avatars.githubusercontent.com/u/45487711?v=4'
        },
        pricing: { type: 'free' },
        source: 'https://n8n.io/workflows/crm-sync',
        lastUpdated: '2024-01-10T14:20:00Z',
        downloads: 890,
        rating: 4.6,
        complexity: 'complex',
        estimatedTime: 8,
        nodes: [
          { name: 'Salesforce', type: 'trigger' },
          { name: 'HubSpot', type: 'action' },
          { name: 'Pipedrive', type: 'action' },
          { name: 'Data Transform', type: 'transform' },
          { name: 'Webhook', type: 'action' }
        ],
        systems: ['salesforce', 'hubspot', 'pipedrive']
      }
    ];
  }
};

// Zapier Templates (Mock - no public API)
export const fetchZapierTemplates = async (): Promise<WorkflowAPI[]> => {
  return [
    {
      id: 'zapier-crm-to-email',
      name: 'CRM to Email Automation',
      description: 'Automatically send emails when new leads are added to CRM',
      provider: 'zapier',
      category: 'CRM',
      tags: ['crm', 'email', 'automation', 'zapier'],
      author: {
        name: 'Zapier Team',
        avatar: 'https://avatars.githubusercontent.com/u/123456?v=4'
      },
      pricing: { type: 'subscription', cost: 20, unit: 'monthly' },
      source: 'https://zapier.com/apps',
      lastUpdated: new Date().toISOString(),
      downloads: 5000,
      rating: 4.7,
      complexity: 'medium',
      estimatedTime: 4,
      systems: ['crm', 'email', 'zapier']
    },
    {
      id: 'zapier-invoice-processing',
      name: 'Invoice Processing Workflow',
      description: 'Process invoices automatically from email to accounting software',
      provider: 'zapier',
      category: 'Finance',
      tags: ['invoice', 'finance', 'automation', 'zapier'],
      author: {
        name: 'Zapier Team',
        avatar: 'https://avatars.githubusercontent.com/u/123456?v=4'
      },
      pricing: { type: 'subscription', cost: 25, unit: 'monthly' },
      source: 'https://zapier.com/apps',
      lastUpdated: new Date().toISOString(),
      downloads: 3200,
      rating: 4.6,
      complexity: 'complex',
      estimatedTime: 6,
      systems: ['email', 'accounting', 'zapier']
    }
  ];
};

// Make Templates (Mock - no public API)
export const fetchMakeTemplates = async (): Promise<WorkflowAPI[]> => {
  return [
    {
      id: 'make-data-sync',
      name: 'Multi-Platform Data Sync',
      description: 'Synchronize data across multiple platforms and databases',
      provider: 'make',
      category: 'Data Integration',
      tags: ['data-sync', 'integration', 'automation', 'make'],
      author: {
        name: 'Make Team',
        avatar: 'https://avatars.githubusercontent.com/u/789012?v=4'
      },
      pricing: { type: 'subscription', cost: 30, unit: 'monthly' },
      source: 'https://www.make.com/en/help/apps',
      lastUpdated: new Date().toISOString(),
      downloads: 2800,
      rating: 4.8,
      complexity: 'complex',
      estimatedTime: 8,
      systems: ['database', 'api', 'make']
    },
    {
      id: 'make-reporting-automation',
      name: 'Automated Reporting System',
      description: 'Generate and distribute reports automatically from various data sources',
      provider: 'make',
      category: 'Reporting',
      tags: ['reporting', 'automation', 'data', 'make'],
      author: {
        name: 'Make Team',
        avatar: 'https://avatars.githubusercontent.com/u/789012?v=4'
      },
      pricing: { type: 'subscription', cost: 35, unit: 'monthly' },
      source: 'https://www.make.com/en/help/apps',
      lastUpdated: new Date().toISOString(),
      downloads: 2100,
      rating: 4.5,
      complexity: 'medium',
      estimatedTime: 5,
      systems: ['reporting', 'data', 'make']
    }
  ];
};

// Airflow Templates (Mock - no public API)
export const fetchAirflowTemplates = async (): Promise<WorkflowAPI[]> => {
  return [
    {
      id: 'airflow-etl-pipeline',
      name: 'ETL Data Pipeline',
      description: 'Extract, Transform, Load pipeline for big data processing',
      provider: 'airflow',
      category: 'Data Engineering',
      tags: ['etl', 'data-pipeline', 'big-data', 'airflow'],
      author: {
        name: 'Apache Airflow',
        avatar: 'https://avatars.githubusercontent.com/u/456789?v=4'
      },
      pricing: { type: 'free' },
      source: 'https://airflow.apache.org/docs/',
      lastUpdated: new Date().toISOString(),
      downloads: 1500,
      rating: 4.4,
      complexity: 'complex',
      estimatedTime: 12,
      systems: ['database', 'big-data', 'airflow']
    }
  ];
};

// Main function to fetch all available workflows
export const fetchAllWorkflows = async (): Promise<WorkflowAPI[]> => {
  try {
    const [n8nWorkflows, zapierTemplates, makeTemplates, airflowTemplates] = await Promise.allSettled([
      fetchN8nWorkflows(),
      fetchZapierTemplates(),
      fetchMakeTemplates(),
      fetchAirflowTemplates()
    ]);

    const allWorkflows: WorkflowAPI[] = [];

    if (n8nWorkflows.status === 'fulfilled') {
      allWorkflows.push(...n8nWorkflows.value);
    }

    if (zapierTemplates.status === 'fulfilled') {
      allWorkflows.push(...zapierTemplates.value);
    }

    if (makeTemplates.status === 'fulfilled') {
      allWorkflows.push(...makeTemplates.value);
    }

    if (airflowTemplates.status === 'fulfilled') {
      allWorkflows.push(...airflowTemplates.value);
    }

    // Sort by downloads/rating
    return allWorkflows.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  } catch (error) {
    console.error('Error fetching all workflows:', error);
    return [];
  }
};

// Filter workflows by category
export const filterWorkflowsByCategory = (workflows: WorkflowAPI[], category: string): WorkflowAPI[] => {
  return workflows.filter(workflow => 
    workflow.category.toLowerCase().includes(category.toLowerCase()) ||
    workflow.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
  );
};

// Filter workflows by systems
export const filterWorkflowsBySystems = (workflows: WorkflowAPI[], systems: string[]): WorkflowAPI[] => {
  return workflows.filter(workflow => 
    workflow.systems?.some(system => 
      systems.some(searchSystem => 
        system.toLowerCase().includes(searchSystem.toLowerCase())
      )
    )
  );
};

// Search workflows by name or description
export const searchWorkflows = (workflows: WorkflowAPI[], query: string): WorkflowAPI[] => {
  const lowerQuery = query.toLowerCase();
  return workflows.filter(workflow => 
    workflow.name.toLowerCase().includes(lowerQuery) ||
    workflow.description.toLowerCase().includes(lowerQuery) ||
    workflow.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// Get workflow statistics
export const getWorkflowStats = (workflows: WorkflowAPI[]) => {
  const stats = {
    total: workflows.length,
    byProvider: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    byComplexity: {} as Record<string, number>,
    topRated: workflows.filter(w => w.rating && w.rating > 4.5).length,
    mostDownloaded: workflows.filter(w => w.downloads && w.downloads > 1000).length
  };

  workflows.forEach(workflow => {
    stats.byProvider[workflow.provider] = (stats.byProvider[workflow.provider] || 0) + 1;
    stats.byCategory[workflow.category] = (stats.byCategory[workflow.category] || 0) + 1;
    stats.byComplexity[workflow.complexity] = (stats.byComplexity[workflow.complexity] || 0) + 1;
  });

  return stats;
};
