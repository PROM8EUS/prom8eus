// n8n API Client for fetching workflows from n8n.io
export interface N8nWorkflow {
  id: string;
  name: string; // Changed from title to name
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard'; // Changed to match the implementation
  estimatedTime: string; // Changed from number to string (e.g., "2 h", "30 min")
  estimatedCost: string; // Changed from number to string (e.g., "€100")
  nodes: number;
  connections: number;
  downloads: number;
  rating: number;
  createdAt: string;
  url: string;
  jsonUrl: string;
  active: boolean;
  triggerType: string;
  integrations: string[]; // Added integrations array
  author?: string; // Optional author field
}

export interface N8nApiResponse {
  workflows: N8nWorkflow[];
  total: number;
  page: number;
  limit: number;
}

export class N8nApi {
  private baseUrl = 'https://api.github.com';
  private githubToken: string | null = null;
  private cacheKey = 'n8n_workflows_cache';
  private cacheExpiryKey = 'n8n_workflows_cache_expiry';
  private cacheExpiryHours = 24; // Cache für 24 Stunden

  constructor() {
    // Try to get GitHub token from localStorage or hardcoded
    this.githubToken = localStorage.getItem('github_token') || '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';
  }

  // Method to set GitHub token
  setGitHubToken(token: string) {
    this.githubToken = token;
    localStorage.setItem('github_token', token);
  }

  // Get headers for GitHub API requests
  private getHeaders() {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'PROM8EUS/1.0'
    };
    
    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }
    
    return headers;
  }

  // Check if cache is valid
  private isCacheValid(): boolean {
    try {
      const expiry = localStorage.getItem(this.cacheExpiryKey);
      if (!expiry) return false;
      
      const expiryTime = new Date(expiry).getTime();
      const now = new Date().getTime();
      
      return now < expiryTime;
    } catch (error) {
      console.warn('Error checking cache validity:', error);
      return false;
    }
  }

  // Get workflows from cache
  private getCachedWorkflows(): N8nWorkflow[] {
    try {
      if (!this.isCacheValid()) {
        return [];
      }
      
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return [];
      
      return JSON.parse(cached);
    } catch (error) {
      console.warn('Error reading cached workflows:', error);
      return [];
    }
  }

  // Save workflows to cache
  private saveWorkflowsToCache(workflows: N8nWorkflow[]): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(workflows));
      
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + this.cacheExpiryHours);
      localStorage.setItem(this.cacheExpiryKey, expiry.toISOString());
      
      console.log(`Cached ${workflows.length} workflows until ${expiry.toISOString()}`);
    } catch (error) {
      console.warn('Error saving workflows to cache:', error);
    }
  }

    // Clear cache
  private clearCache(): void {
    try {
      localStorage.removeItem(this.cacheKey);
      localStorage.removeItem(this.cacheExpiryKey);
      console.log('Workflow cache cleared');
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  // Map AI tool IDs to n8n workflow categories
  private mapToolIdsToCategories(toolIds: string[]): string[] {
    const toolMapping: Record<string, string[]> = {
      // Office & Productivity
      'excel-ai': ['excel', 'microsoft', 'office'],
      'google-sheets-ai': ['google-sheets', 'google', 'sheets'],
      'google-docs-ai': ['google-docs', 'google', 'docs'],
      'power-bi-ai': ['power-bi', 'microsoft', 'bi'],
      'microsoft-copilot': ['microsoft', 'office', 'copilot'],
      'airtable-ai': ['airtable'],
      'notion-ai': ['notion'],
      
      // HR & Business Tools
      'bamboohr': ['hr', 'human-resources', 'recruitment'],
      'workday': ['hr', 'human-resources', 'erp'],
      'hr': ['hr', 'human-resources'],
      'personnel': ['hr', 'human-resources'],
      'email': ['email', 'communication'],
      
      // AI & Development
      'chatgpt': ['openai', 'chatgpt', 'ai'],
      'claude': ['anthropic', 'claude', 'ai'],
      'github-copilot': ['github', 'copilot', 'development'],
      'code-whisperer': ['aws', 'amazon', 'development'],
      'tabnine': ['tabnine', 'development'],
      'gemini': ['google', 'gemini', 'ai'],
      
      // Creative & Marketing
      'canva-ai': ['canva', 'design'],
      'jasper': ['jasper', 'marketing'],
      'copy-ai': ['copy-ai', 'marketing'],
      'writesonic': ['writesonic', 'marketing'],
      'perplexity': ['perplexity', 'research'],
      'grammarly': ['grammarly', 'writing'],
      'grok': ['grok', 'ai'],
      
      // Other
      'obsidian-ai': ['obsidian'],
      'zoom': ['zoom'],
      'dropbox': ['dropbox']
    };

    const mappedCategories: string[] = [];
    
    toolIds.forEach(toolId => {
      if (toolMapping[toolId]) {
        mappedCategories.push(...toolMapping[toolId]);
      } else {
        // If no mapping found, try to use the tool ID directly
        mappedCategories.push(toolId);
      }
    });

    // Remove duplicates
    return [...new Set(mappedCategories)];
  }

  // Get available categories from cache or GitHub API
  private async getAvailableCategoriesWithCache(): Promise<string[]> {
    try {
      // Check cache first
      const cached = localStorage.getItem(this.availableCategoriesCacheKey);
      const expiry = localStorage.getItem(this.availableCategoriesExpiryKey);
      
      if (cached && expiry) {
        const expiryTime = new Date(expiry).getTime();
        const now = new Date().getTime();
        
        if (now < expiryTime) {
          console.log('Using cached available categories');
          return JSON.parse(cached);
        }
      }
      
      // Cache expired or missing, fetch from GitHub
      console.log('Fetching available categories from GitHub API...');
      const categories = await this.getAvailableCategories();
      
      // Cache the results
      try {
        localStorage.setItem(this.availableCategoriesCacheKey, JSON.stringify(categories));
        
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + this.availableCategoriesCacheExpiryHours);
        localStorage.setItem(this.availableCategoriesExpiryKey, expiry.toISOString());
        
        console.log(`Cached available categories until ${expiry.toISOString()}`);
      } catch (e) {
        console.warn('Failed to cache available categories:', e);
      }
      
      return categories;
    } catch (error) {
      console.error('Error getting available categories with cache:', error);
      return [];
    }
  }

  // Public method to force refresh cache
  async refreshCache(): Promise<void> {
    console.log('Forcing cache refresh...');
    this.clearCache();
    await this.fetchWorkflows();
  }

  // Public method to clear cache immediately
  clearCacheNow(): void {
    console.log('Clearing cache immediately...');
    this.clearCache();
  }

  // Force complete refresh of all workflows
  async forceCompleteRefresh(): Promise<void> {
    console.log('=== FORCING COMPLETE WORKFLOW REFRESH ===');
    console.log('This will load all 2,053+ workflows from Zie619/n8n-workflows repository');
    
    // Clear cache immediately
    this.clearCacheNow();
    
    // Fetch all workflows without limits
    const allWorkflows = await this.fetchWorkflows({ limit: undefined });
    
    console.log(`=== REFRESH COMPLETE ===`);
    console.log(`Total workflows loaded: ${allWorkflows.length}`);
    console.log(`Expected: ~2,053 workflows from repository`);
    
    // Save to cache
    this.saveWorkflowsToCache(allWorkflows);
  }

  // Get cache status
  getCacheStatus(): { hasCache: boolean; expiry: string | null; workflowCount: number } {
    try {
      const hasCache = this.isCacheValid();
      const expiry = localStorage.getItem(this.cacheExpiryKey);
      const cached = localStorage.getItem(this.cacheKey);
      const workflowCount = cached ? JSON.parse(cached).length : 0;
      
      return {
        hasCache,
        expiry,
        workflowCount
      };
    } catch (error) {
      return {
        hasCache: false,
        expiry: null,
        workflowCount: 0
      };
    }
  }

  async fetchWorkflows(options: { limit?: number } = {}): Promise<N8nWorkflow[]> {
    // First, try to get workflows from cache
    const cachedWorkflows = this.getCachedWorkflows();
    if (cachedWorkflows.length > 0) {
      console.log(`Using ${cachedWorkflows.length} cached workflows`);
      return options.limit ? cachedWorkflows.slice(0, options.limit) : cachedWorkflows;
    }

    try {
      console.log('Cache empty or expired, fetching workflows from Zie619/n8n-workflows repository...');
      
      // Get all workflow categories from the repository
      const categoriesResponse = await fetch(
        'https://api.github.com/repos/Zie619/n8n-workflows/contents/workflows',
        {
          headers: this.getHeaders()
        }
      );
      
      if (!categoriesResponse.ok) {
        if (categoriesResponse.status === 403) {
          console.warn('GitHub API rate limit exceeded, using fallback workflows');
          const fallbackWorkflows = this.getFallbackWorkflows(options.limit || 20);
          this.saveWorkflowsToCache(fallbackWorkflows);
          return fallbackWorkflows;
        }
        throw new Error(`Failed to fetch categories: ${categoriesResponse.status}`);
      }
      
      const categories = await categoriesResponse.json();
    const workflows: N8nWorkflow[] = [];
    
      // Process each category to find workflow files (load all categories for complete coverage)
      const categoriesToProcess = categories; // Load all 186 categories
      console.log(`Processing ${categoriesToProcess.length} categories for complete workflow coverage...`);
      
      let processedCategories = 0;
      for (const category of categoriesToProcess) {
        if (category.type === 'dir') {
          try {
            processedCategories++;
            console.log(`Processing category ${processedCategories}/${categoriesToProcess.length}: ${category.name}`);
            const categoryWorkflows = await this.fetchWorkflowsFromCategory(category.name, options.limit || 50); // Load more workflows per category
            workflows.push(...categoryWorkflows);
            console.log(`Added ${categoryWorkflows.length} workflows from ${category.name} (Total: ${workflows.length})`);
          } catch (error) {
            console.warn(`Failed to fetch workflows from category ${category.name}:`, error);
          }
        }
      }
      
      console.log(`Successfully fetched ${workflows.length} workflows from Zie619/n8n-workflows`);
      
      // Save to cache for future use
      this.saveWorkflowsToCache(workflows);
      
      return options.limit ? workflows.slice(0, options.limit) : workflows;
      
    } catch (error) {
      console.error('Error fetching workflows from Zie619/n8n-workflows:', error);
      console.log('Using fallback workflows due to error');
      const fallbackWorkflows = this.getFallbackWorkflows(options.limit || 20);
      this.saveWorkflowsToCache(fallbackWorkflows);
      return fallbackWorkflows;
    }
  }

  private async fetchWorkflowsFromCategory(categoryName: string, limit: number): Promise<N8nWorkflow[]> {
    try {
      const categoryResponse = await fetch(
        `https://api.github.com/repos/Zie619/n8n-workflows/contents/workflows/${categoryName}`,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!categoryResponse.ok) {
        throw new Error(`Failed to fetch category ${categoryName}: ${categoryResponse.status}`);
      }
      
      const files = await categoryResponse.json();
      const jsonFiles = files.filter((file: any) => 
        file.type === 'file' && file.name.endsWith('.json')
      ); // Load all JSON files, no limit
      
      const workflows: N8nWorkflow[] = [];
      
      for (const file of jsonFiles) {
        try {
          const workflow = await this.createWorkflowFromFile(file, categoryName);
          if (workflow) {
          workflows.push(workflow);
        }
      } catch (error) {
          console.warn(`Failed to process workflow file ${file.name}:`, error);
      }
    }

    return workflows;
      
    } catch (error) {
      console.error(`Error fetching workflows from category ${categoryName}:`, error);
      return [];
    }
  }

  private async createWorkflowFromFile(file: any, categoryName: string): Promise<N8nWorkflow | null> {
    try {
      const workflowResponse = await fetch(file.download_url);
      
      if (!workflowResponse.ok) {
        throw new Error(`Failed to fetch workflow: ${workflowResponse.status}`);
      }
      
      const workflowData = await workflowResponse.json();
      
      // Parse filename to extract information
      const filename = file.name.replace('.json', '');
      const parts = filename.split('_');
      
      // Extract workflow information
      const id = parts[0] || 'unknown';
      const services = parts.slice(1, -2).join(' '); // Services are in the middle
      const purpose = parts[parts.length - 2] || 'Automation';
      const trigger = parts[parts.length - 1] || 'Manual';
      
      // Create a meaningful name
      const name = `${services} ${purpose} ${trigger}`.replace(/\s+/g, ' ').trim();
      
      // Count nodes and connections
      const nodes = workflowData.nodes || [];
      const connections = workflowData.connections || {};
      const connectionCount = Object.keys(connections).length;
      
      // Determine difficulty based on complexity
      const difficulty = this.getDifficultyFromNodes(nodes.length, connectionCount);
      
      // Estimate time and cost
      const estimatedTime = this.getEstimatedTime(nodes.length, difficulty);
      const estimatedCost = this.getEstimatedCost(estimatedTime);
      
      // Generate rating and downloads
      const rating = this.getRandomRating();
      const downloads = this.getRandomDownloads();
      
      // Create workflow object
      const workflow: N8nWorkflow = {
        id: `${categoryName}_${id}`,
        name: name,
        description: this.generateDescription(services, purpose, trigger, categoryName, workflowData),
        category: this.mapCategory(categoryName),
        difficulty: difficulty,
        estimatedTime: estimatedTime,
        estimatedCost: estimatedCost,
      nodes: nodes.length,
        connections: connectionCount,
        downloads: downloads,
        rating: rating,
      createdAt: new Date().toISOString(),
        url: `https://github.com/Zie619/n8n-workflows/blob/main/workflows/${categoryName}/${file.name}`,
        jsonUrl: file.download_url,
        active: workflowData.active !== false,
        triggerType: this.getTriggerType(trigger),
        integrations: this.extractIntegrations(nodes),
        author: workflowData.author || 'Community'
      };
      
      return workflow;
      
    } catch (error) {
      console.error(`Error creating workflow from file ${file.name}:`, error);
      return null;
    }
  }

  private getDifficultyFromNodes(nodeCount: number, connectionCount: number): 'Easy' | 'Medium' | 'Hard' {
    const complexity = nodeCount + connectionCount;
    if (complexity <= 5) return 'Easy';
    if (complexity <= 15) return 'Medium';
    return 'Hard';
  }

  private getEstimatedTime(nodeCount: number, difficulty: string): string {
    const baseTime = nodeCount * 2; // 2 minutes per node
    const multiplier = difficulty === 'Easy' ? 0.5 : difficulty === 'Medium' ? 1 : 1.5;
    const totalMinutes = Math.round(baseTime * multiplier);
    
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.round(totalMinutes / 60);
    return `${hours} h`;
  }

  private getEstimatedCost(timeStr: string): string {
    // Extract minutes from time string (e.g., "30 min" -> 30, "2 h" -> 120)
    let minutes = 0;
    if (timeStr.includes('min')) {
      minutes = parseInt(timeStr.replace(' min', ''));
    } else if (timeStr.includes('h')) {
      minutes = parseInt(timeStr.replace(' h', '')) * 60;
    }
    
    const hourlyRate = 50; // Estimated hourly rate
    const cost = Math.round((minutes / 60) * hourlyRate);
    return `€${cost}`;
  }

  private getRandomRating(): number {
    return Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 to 5.0
  }

  private getRandomDownloads(): number {
    return Math.floor(Math.random() * 1000) + 10; // 10 to 1009
  }

  private generateDescription(services: string, purpose: string, trigger: string, categoryName: string, workflowData: any): string {
    // Try to extract description from workflow data first
    if (workflowData.description) {
      return workflowData.description;
    }
    
    if (workflowData.notes) {
      return workflowData.notes;
    }
    
    // Try to extract from node parameters
    const nodeDescriptions = this.extractNodeDescriptions(workflowData.nodes);
    if (nodeDescriptions.length > 0) {
      return nodeDescriptions.join('. ');
    }
    
    // Fallback to generated description
    const descriptions: { [key: string]: string[] } = {
      'Communication': [
        `Automatisiert ${services} Kommunikation mit ${purpose.toLowerCase()} Funktionalität`,
        `Workflow zur ${purpose.toLowerCase()} Verwaltung über ${services}`,
        `Integration von ${services} für ${purpose.toLowerCase()} Prozesse`
      ],
      'Sales': [
        `Automatisiertes ${services} Sales Management mit ${purpose.toLowerCase()}`,
        `Workflow für ${purpose.toLowerCase()} in ${services} Verkaufsprozessen`,
        `${services} Integration zur ${purpose.toLowerCase()} Optimierung`
      ],
      'Finance': [
        `Finanzautomatisierung mit ${services} für ${purpose.toLowerCase()}`,
        `${services} Workflow zur ${purpose.toLowerCase()} Verwaltung`,
        `Automatisierte ${purpose.toLowerCase()} Prozesse in ${services}`
      ],
      'E-commerce': [
        `E-Commerce Automatisierung mit ${services} für ${purpose.toLowerCase()}`,
        `${services} Workflow für ${purpose.toLowerCase()} im Online-Handel`,
        `Automatisierte ${purpose.toLowerCase()} für ${services} Shop-Systeme`
      ],
      'Data': [
        `Datenautomatisierung mit ${services} für ${purpose.toLowerCase()}`,
        `${services} Workflow zur ${purpose.toLowerCase()} Datenverarbeitung`,
        `Automatisierte ${purpose.toLowerCase()} mit ${services} Datenintegration`
      ],
      'Marketing': [
        `Marketing-Automatisierung mit ${services} für ${purpose.toLowerCase()}`,
        `${services} Workflow für ${purpose.toLowerCase()} Marketing-Kampagnen`,
        `Automatisierte ${purpose.toLowerCase()} in ${services} Marketing-Tools`
      ],
      'HR': [
        `HR-Automatisierung mit ${services} für ${purpose.toLowerCase()}`,
        `${services} Workflow zur ${purpose.toLowerCase()} Personalverwaltung`,
        `Automatisierte ${purpose.toLowerCase()} Prozesse in ${services} HR-Systemen`
      ]
    };

    const category = this.mapCategory(categoryName);
    const categoryDescriptions = descriptions[category] || descriptions['Data'];
    const randomIndex = Math.floor(Math.random() * categoryDescriptions.length);
    
    return categoryDescriptions[randomIndex];
  }

  private extractNodeDescriptions(nodes: any[]): string[] {
    const descriptions: string[] = [];
    
    if (!nodes || !Array.isArray(nodes)) return descriptions;
    
    for (const node of nodes) {
      if (node.parameters) {
        // Extract meaningful information from node parameters
        const nodeDesc = this.extractNodeParameterDescription(node);
        if (nodeDesc) {
          descriptions.push(nodeDesc);
        }
      }
    }
    
    return descriptions.slice(0, 2); // Limit to 2 descriptions to avoid too long text
  }

  private extractNodeParameterDescription(node: any): string | null {
    const nodeType = node.type || '';
    const parameters = node.parameters || {};
    
    // Extract operation type
    const operation = parameters.operation || '';
    
    // Extract resource/table information
    const resource = parameters.resource || '';
    const table = parameters.table?.cachedResultName || parameters.table?.value || '';
    
    // Extract base/app information
    const base = parameters.base?.cachedResultName || parameters.base?.value || '';
    
    if (nodeType.includes('airtable')) {
      if (operation === 'create') {
        return `Erstellt neue Einträge in ${table || 'Airtable Tabelle'}`;
      } else if (operation === 'read') {
        return `Liest Daten aus ${table || 'Airtable Tabelle'}`;
      } else if (operation === 'update') {
        return `Aktualisiert Einträge in ${table || 'Airtable Tabelle'}`;
      }
    } else if (nodeType.includes('slack')) {
      if (operation === 'post') {
        return `Sendet Nachrichten an Slack`;
      }
    } else if (nodeType.includes('googleSheets')) {
      if (operation === 'append') {
        return `Fügt Daten zu Google Sheets hinzu`;
      } else if (operation === 'read') {
        return `Liest Daten aus Google Sheets`;
      }
    } else if (nodeType.includes('webhook')) {
      return `Empfängt Webhook-Daten`;
    } else if (nodeType.includes('schedule')) {
      return `Zeitgesteuerte Ausführung`;
    }
    
    return null;
  }

  private getTriggerType(trigger: string): string {
    const triggerMap: { [key: string]: string } = {
      'Webhook': 'Webhook',
      'Scheduled': 'Scheduled',
      'Manual': 'Manual',
      'Triggered': 'Webhook'
    };
    return triggerMap[trigger] || 'Manual';
  }

  private mapCategory(categoryName: string): string {
    const categoryMap: { [key: string]: string } = {
      'Slack': 'Communication',
      'Discord': 'Communication',
      'Telegram': 'Communication',
      'Whatsapp': 'Communication',
      'Email': 'Communication',
      'Salesforce': 'Sales',
      'Hubspot': 'Sales',
      'Pipedrive': 'Sales',
      'Stripe': 'Finance',
      'Paypal': 'Finance',
      'Quickbooks': 'Finance',
      'Xero': 'Finance',
      'Shopify': 'E-commerce',
      'WooCommerce': 'E-commerce',
      'Airtable': 'Data',
      'GoogleSheets': 'Data',
      'Postgres': 'Data',
      'MySQL': 'Data',
      'MongoDB': 'Data',
      'GitHub': 'Development',
      'GitLab': 'Development',
      'Jira': 'Development',
      'Trello': 'Development',
      'Asana': 'Development',
      'Zendesk': 'Customer Support',
      'Intercom': 'Customer Support',
      'BambooHR': 'HR',
      'Workday': 'HR',
      'Mailchimp': 'Marketing',
      'SendGrid': 'Marketing',
      'Twitter': 'Marketing',
      'LinkedIn': 'Marketing',
      'Instagram': 'Marketing',
      'Facebook': 'Marketing',
      'GoogleAnalytics': 'Analytics',
      'Mixpanel': 'Analytics',
      'Notion': 'Productivity',
      'Evernote': 'Productivity',
      'Todoist': 'Productivity',
      'Calendly': 'Calendar',
      'GoogleCalendar': 'Calendar',
      'Typeform': 'Forms',
      'GoogleForms': 'Forms',
      'Webhook': 'Development',
      'HttpRequest': 'Development',
      'Cron': 'Development',
      'Schedule': 'Development'
    };
    
    return categoryMap[categoryName] || 'General';
  }

  private extractIntegrations(nodes: any[]): string[] {
    const integrations = new Set<string>();
    
    nodes.forEach(node => {
      if (node.type && node.type !== 'n8n-nodes-base.start' && node.type !== 'n8n-nodes-base.end') {
        const integration = node.type.replace('n8n-nodes-base.', '').split('.')[0];
        if (integration) {
          integrations.add(integration);
        }
      }
    });
    
    return Array.from(integrations);
  }

  private getFallbackWorkflows(limit: number): N8nWorkflow[] {
    console.log('Creating fallback workflows based on real n8n integrations');
    
    const fallbackWorkflows: N8nWorkflow[] = [
      // Finance & Accounting Workflows
      {
        id: 'slack_stripe_automation',
        name: 'Slack Stripe Payment Automation',
        description: 'Automatische Benachrichtigungen in Slack bei neuen Stripe-Zahlungen mit detaillierten Informationen und Team-Alerts.',
        category: 'Finance',
        difficulty: 'Medium',
        estimatedTime: '2 h',
        estimatedCost: '€100',
        nodes: 8,
        connections: 6,
        downloads: 1247,
        rating: 4.2,
        createdAt: '2024-01-15T10:30:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Slack',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Slack/0008_Slack_Stripe_Create_Triggered.json',
        active: true,
        triggerType: 'Webhook',
        integrations: ['Slack', 'Stripe', 'HTTP Request']
      },
      {
        id: 'invoice_processing_automation',
        name: 'Automated Invoice Processing',
        description: 'Automatische Rechnungsverarbeitung mit OCR, Datenvalidierung und Integration in Buchhaltungssysteme wie QuickBooks und Xero.',
        category: 'Finance',
        difficulty: 'Hard',
        estimatedTime: '5 h',
        estimatedCost: '€250',
        nodes: 15,
        connections: 11,
        downloads: 1678,
        rating: 4.4,
        createdAt: '2024-03-10T11:20:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Finance',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Finance/invoice_processing.json',
        active: true,
        triggerType: 'Webhook',
        integrations: ['QuickBooks', 'Xero', 'Google Drive', 'OCR', 'Email']
      },
      {
        id: 'expense_report_automation',
        name: 'Expense Report Automation',
        description: 'Automatische Erstellung und Genehmigung von Spesenberichten mit Integration in Buchhaltungssysteme.',
        category: 'Finance',
        difficulty: 'Medium',
        estimatedTime: '3 h',
        estimatedCost: '€150',
        nodes: 10,
        connections: 7,
        downloads: 892,
        rating: 4.1,
        createdAt: '2024-02-05T14:15:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Finance',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Finance/expense_report.json',
        active: true,
        triggerType: 'Manual',
        integrations: ['QuickBooks', 'Google Sheets', 'Email', 'Slack']
      },
      // Marketing Workflows
      {
        id: 'email_marketing_campaign',
        name: 'Email Marketing Campaign Automation',
        description: 'Automatisierte E-Mail-Kampagnen mit A/B-Testing, Segmentierung und Performance-Tracking für optimale Conversion-Raten.',
        category: 'Marketing',
        difficulty: 'Hard',
        estimatedTime: '4 h',
        estimatedCost: '€200',
        nodes: 12,
        connections: 9,
        downloads: 2156,
        rating: 4.5,
        createdAt: '2024-02-20T14:15:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Email',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Email/email_campaign_automation.json',
        active: true,
        triggerType: 'Scheduled',
        integrations: ['Mailchimp', 'Google Sheets', 'Analytics', 'Airtable']
      },
      {
        id: 'social_media_automation',
        name: 'Social Media Content Automation',
        description: 'Automatisierte Social Media Posts mit Content-Scheduling, Hashtag-Optimierung und Performance-Tracking.',
        category: 'Marketing',
        difficulty: 'Easy',
        estimatedTime: '1.5 h',
        estimatedCost: '€75',
        nodes: 6,
        connections: 4,
        downloads: 1876,
        rating: 4.3,
        createdAt: '2024-02-10T12:30:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Social',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Social/social_automation.json',
        active: true,
        triggerType: 'Scheduled',
        integrations: ['Twitter', 'LinkedIn', 'Facebook', 'Instagram', 'Buffer']
      },
      {
        id: 'lead_nurturing_automation',
        name: 'Lead Nurturing Automation',
        description: 'Automatische Lead-Pflege mit personalisierten E-Mails, Scoring und CRM-Integration für optimale Conversion.',
        category: 'Marketing',
        difficulty: 'Medium',
        estimatedTime: '3.5 h',
        estimatedCost: '€175',
        nodes: 11,
        connections: 8,
        downloads: 1432,
        rating: 4.2,
        createdAt: '2024-01-25T09:45:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Marketing',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Marketing/lead_nurturing.json',
        active: true,
        triggerType: 'Webhook',
        integrations: ['Mailchimp', 'Salesforce', 'HubSpot', 'Google Analytics']
      },
      {
        id: 'crm_lead_management',
        name: 'CRM Lead Management System',
        description: 'Automatische Lead-Verwaltung mit Scoring, Follow-up-Erinnerungen und Integration in verschiedene CRM-Systeme.',
        category: 'Sales',
        difficulty: 'Medium',
        estimatedTime: '3 h',
        estimatedCost: '€150',
        nodes: 10,
        connections: 7,
        downloads: 1893,
        rating: 4.3,
        createdAt: '2024-01-30T09:45:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Salesforce',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Salesforce/crm_lead_automation.json',
        active: true,
        triggerType: 'Webhook',
        integrations: ['Salesforce', 'HubSpot', 'Google Sheets', 'Email']
      },
      {
        id: 'invoice_processing',
        name: 'Automated Invoice Processing',
        description: 'Automatische Rechnungsverarbeitung mit OCR, Datenvalidierung und Integration in Buchhaltungssysteme.',
        category: 'Finance',
        difficulty: 'Hard',
        estimatedTime: '5 h',
        estimatedCost: '€250',
        nodes: 15,
        connections: 11,
        downloads: 1678,
        rating: 4.4,
        createdAt: '2024-03-10T11:20:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Finance',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Finance/invoice_processing.json',
        active: true,
        triggerType: 'Webhook',
        integrations: ['QuickBooks', 'Xero', 'Google Drive', 'OCR', 'Email']
      },
      {
        id: 'customer_support_ticket',
        name: 'Customer Support Ticket Automation',
        description: 'Automatische Ticket-Verwaltung mit Priorisierung, Routing und Status-Updates für effizienten Kundenservice.',
        category: 'Customer Support',
        difficulty: 'Medium',
        estimatedTime: '2.5 h',
        estimatedCost: '€125',
        nodes: 9,
        connections: 6,
        downloads: 1432,
        rating: 4.1,
        createdAt: '2024-02-15T16:30:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Zendesk',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Zendesk/support_ticket_automation.json',
        active: true,
        triggerType: 'Webhook',
        integrations: ['Zendesk', 'Slack', 'Email', 'Jira']
      },
      {
        id: 'hr_onboarding',
        name: 'HR Employee Onboarding',
        description: 'Automatisierter Onboarding-Prozess mit Dokumentenerstellung, Systemzugängen und Willkommens-E-Mails.',
        category: 'HR',
        difficulty: 'Medium',
        estimatedTime: '3 h',
        estimatedCost: '€150',
        nodes: 11,
        connections: 8,
        downloads: 987,
        rating: 4.0,
        createdAt: '2024-01-25T13:45:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/HR',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/HR/employee_onboarding.json',
        active: true,
        triggerType: 'Manual',
        integrations: ['BambooHR', 'Google Workspace', 'Slack', 'DocuSign']
      },
      {
        id: 'data_sync_automation',
        name: 'Cross-Platform Data Synchronization',
        description: 'Automatische Datensynchronisation zwischen verschiedenen Plattformen mit Konfliktlösung und Validierung.',
        category: 'Data',
        difficulty: 'Hard',
        estimatedTime: '4 h',
        estimatedCost: '€200',
        nodes: 13,
        connections: 10,
        downloads: 1123,
        rating: 4.2,
        createdAt: '2024-02-28T10:15:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Data',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Data/data_sync.json',
        active: true,
        triggerType: 'Scheduled',
        integrations: ['Airtable', 'Google Sheets', 'PostgreSQL', 'MySQL']
      },
      {
        id: 'ecommerce_order_processing',
        name: 'E-commerce Order Processing',
        description: 'Automatische Bestellverarbeitung mit Lagerverwaltung, Versand-Updates und Kundenbenachrichtigungen.',
        category: 'E-commerce',
        difficulty: 'Medium',
        estimatedTime: '2.5 h',
        estimatedCost: '€125',
        nodes: 8,
        connections: 5,
        downloads: 2341,
        rating: 4.6,
        createdAt: '2024-03-05T15:20:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Shopify',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Shopify/order_processing.json',
        active: true,
        triggerType: 'Webhook',
        integrations: ['Shopify', 'WooCommerce', 'ShipStation', 'Email']
      },
      {
        id: 'social_media_automation',
        name: 'Social Media Content Automation',
        description: 'Automatisierte Social Media Posts mit Content-Scheduling, Hashtag-Optimierung und Performance-Tracking.',
        category: 'Marketing',
        difficulty: 'Easy',
        estimatedTime: '1.5 h',
        estimatedCost: '€75',
        nodes: 6,
        connections: 4,
        downloads: 1876,
        rating: 4.3,
        createdAt: '2024-02-10T12:30:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Social',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Social/social_automation.json',
        active: true,
        triggerType: 'Scheduled',
        integrations: ['Twitter', 'LinkedIn', 'Facebook', 'Instagram', 'Buffer']
      },
      {
        id: 'project_management_automation',
        name: 'Project Management Workflow',
        description: 'Automatisierte Projektverwaltung mit Task-Zuweisung, Deadline-Tracking und Team-Kommunikation.',
        category: 'Development',
        difficulty: 'Medium',
        estimatedTime: '2 h',
        estimatedCost: '€100',
        nodes: 7,
        connections: 5,
        downloads: 1456,
        rating: 4.1,
        createdAt: '2024-01-20T14:45:00Z',
        url: 'https://github.com/Zie619/n8n-workflows/tree/main/workflows/Project',
        jsonUrl: 'https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/Project/project_management.json',
        active: true,
        triggerType: 'Webhook',
        integrations: ['Jira', 'Trello', 'Asana', 'Slack', 'GitHub']
      }
    ];
    
    return fallbackWorkflows.slice(0, limit);
  }

  // Get relevant categories based on task text and selected applications
  private getRelevantCategories(taskText: string, selectedApplications: string[]): string[] {
    const taskLower = taskText.toLowerCase();
    const relevantCategories: string[] = [];
    
    // Map applications to actual GitHub repository categories
    const appToCategory: { [key: string]: string[] } = {
      'excel': ['GoogleSheets', 'Airtable', 'Spreadsheet'],
      'quickbooks': ['Quickbooks', 'Xero', 'Stripe', 'Paypal'],
      'slack': ['Slack', 'Discord', 'Telegram', 'Whatsapp'],
      'email': ['Gmail', 'Outlook', 'Email'],
      'crm': ['Salesforce', 'Hubspot', 'Pipedrive'],
      'marketing': ['Mailchimp', 'SendGrid', 'Twitter', 'Linkedin', 'Instagram', 'Facebook'],
      'project': ['Asana', 'Trello', 'Jira', 'Clickup'],
      'calendar': ['GoogleCalendar', 'Calendly'],
      'file': ['GoogleDrive', 'Dropbox', 'Onedrive'],
      'social': ['Linkedin', 'Twitter', 'Facebook', 'Instagram'],
      'database': ['Postgres', 'Mysqltool', 'Mongodbtool', 'Postgrestool'],
      'hr': ['Bamboohr', 'Workday', 'HR', 'Personnel']
    };
    
    // Add categories based on selected applications
    selectedApplications.forEach(app => {
      const appLower = app.toLowerCase();
      Object.entries(appToCategory).forEach(([key, categories]) => {
        if (appLower.includes(key) || key.includes(appLower)) {
          relevantCategories.push(...categories);
        }
      });
    });
    
    // Add categories based on task text
    if (taskLower.includes('buchhaltung') || taskLower.includes('finance')) {
      relevantCategories.push('Quickbooks', 'Xero', 'Stripe', 'Paypal', 'Finance');
    }
    if (taskLower.includes('verkauf') || taskLower.includes('sales')) {
      relevantCategories.push('Salesforce', 'Hubspot', 'Pipedrive', 'CRM');
    }
    if (taskLower.includes('marketing')) {
      relevantCategories.push('Mailchimp', 'SendGrid', 'Twitter', 'Linkedin', 'Instagram', 'Facebook');
    }
    if (taskLower.includes('projekt') || taskLower.includes('project')) {
      relevantCategories.push('Asana', 'Trello', 'Jira', 'Clickup');
    }
    if (taskLower.includes('kommunikation') || taskLower.includes('communication')) {
      relevantCategories.push('Slack', 'Discord', 'Telegram', 'Whatsapp', 'Email');
    }
    if (taskLower.includes('daten') || taskLower.includes('data')) {
      relevantCategories.push('Airtable', 'GoogleSheets', 'Postgres', 'Mysqltool', 'Mongodbtool', 'Postgrestool');
    }
    if (taskLower.includes('personal') || taskLower.includes('hr') || taskLower.includes('mitarbeiter') || taskLower.includes('employee')) {
      relevantCategories.push('Bamboohr', 'Workday', 'HR', 'Personnel', 'Asana', 'Trello', 'GoogleSheets', 'Airtable');
    }
    
    // Remove duplicates and limit to top 10 most relevant
    return [...new Set(relevantCategories)].slice(0, 10);
  }

  // Search in existing workflows (fast)
  private searchInWorkflows(workflows: N8nWorkflow[], taskText: string, selectedApplications: string[]): N8nWorkflow[] {
    const taskLower = taskText.toLowerCase();
    const scoredWorkflows = workflows.map(workflow => {
      let score = 0;
      const workflowText = `${workflow.name} ${workflow.description} ${workflow.category} ${workflow.integrations.join(' ')}`.toLowerCase();
      
      // Application matches (highest priority)
      if (selectedApplications.length > 0) {
        const workflowIntegrations = workflow.integrations.map(i => i.toLowerCase());
        selectedApplications.forEach(app => {
          const appLower = app.toLowerCase();
          if (workflowIntegrations.some(integration => 
            integration.includes(appLower) || appLower.includes(integration)
          )) {
            score += 25;
          }
        });
      }
      
      // Extended keyword matches for HR/Personal
      const keywords = [
        'buchhaltung', 'finance', 'verkauf', 'sales', 'marketing', 'projekt', 'project', 
        'email', 'calendar', 'personal', 'hr', 'mitarbeiter', 'employee', 'onboarding',
        'recruitment', 'planning', 'development', 'training', 'management', 'automation'
      ];
      
      keywords.forEach(keyword => {
        if (taskLower.includes(keyword) && workflowText.includes(keyword)) {
          score += 10;
        }
      });
      
      // Partial keyword matches (more flexible)
      const taskWords = taskLower.split(/\s+/).filter(word => word.length > 3);
      taskWords.forEach(word => {
        if (workflowText.includes(word)) {
          score += 5;
        }
      });
      
      // Category relevance
      if (taskLower.includes('personal') || taskLower.includes('hr')) {
        if (workflow.category.toLowerCase().includes('hr') || 
            workflow.category.toLowerCase().includes('personnel') ||
            workflow.category.toLowerCase().includes('management')) {
          score += 15;
        }
      }
      
      return { workflow, score };
    });

    // If no high-scoring workflows, return some general ones
    const highScoringWorkflows = scoredWorkflows
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(item => item.workflow);

    if (highScoringWorkflows.length === 0) {
      console.log('No high-scoring workflows found, returning general workflows');
      return workflows.slice(0, 10); // Return first 10 workflows as fallback
    }
    
    return highScoringWorkflows;
  }

  // Fetch only relevant workflows from specific categories
  private async fetchRelevantWorkflows(categories: string[], taskText: string, selectedApplications: string[]): Promise<N8nWorkflow[]> {
    const workflows: N8nWorkflow[] = [];
    
    for (const category of categories) {
      try {
        console.log(`Fetching workflows from category: ${category}`);
        const categoryWorkflows = await this.fetchWorkflowsFromCategory(category, 20);
        workflows.push(...categoryWorkflows);
        console.log(`Added ${categoryWorkflows.length} workflows from ${category}`);
      } catch (error) {
        console.warn(`Failed to fetch from category ${category}:`, error);
      }
    }
    
    // Search in fetched workflows
    return this.searchInWorkflows(workflows, taskText, selectedApplications);
  }

  async searchWorkflowsByTask(taskText: string, selectedApplications: string[] = []): Promise<N8nWorkflow[]> {
    try {
      console.log('=== SMART WORKFLOW SEARCH ===');
      console.log('Task text:', taskText);
      console.log('Selected applications:', selectedApplications);
      
      // Get cached workflows first (fast)
      const cachedWorkflows = this.getCachedWorkflows();
      
      if (cachedWorkflows.length > 0) {
        console.log(`Using ${cachedWorkflows.length} cached workflows for smart search`);
        return this.searchInWorkflows(cachedWorkflows, taskText, selectedApplications);
      }
      
      // If no cache, fetch only relevant categories
      const relevantCategories = this.getRelevantCategories(taskText, selectedApplications);
      console.log('Relevant categories for search:', relevantCategories);
      
      // Fetch only relevant workflows
      const fetchedWorkflows = await this.fetchRelevantWorkflows(relevantCategories, taskText, selectedApplications);
      
      console.log(`Found ${fetchedWorkflows.length} relevant workflows`);
      
      if (fetchedWorkflows.length === 0) {
        console.log('No relevant workflows found, using fallback');
        return this.getFallbackWorkflows(10);
      }
      
      return fetchedWorkflows;
      
    } catch (error) {
      console.error('Error searching workflows:', error);
      return [];
    }
  }

  // Fast search method - only loads relevant categories
  async fastSearchWorkflows(taskText: string, selectedApplications: string[] = []): Promise<N8nWorkflow[]> {
    try {
      // Create a cache key for this search
      const cacheKey = `fast_search_${JSON.stringify({ taskText, selectedApplications })}`;
      
      // Check if we have a recent cache for this exact search
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();
          const cacheAge = now - timestamp;
          
          // Use cache if it's less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            console.log('Using cached fast search results');
            return data;
          }
        } catch (e) {
          // Invalid cache, continue with fresh search
        }
      }

      console.log('=== FAST WORKFLOW SEARCH ===');
      console.log('Task text:', taskText);
      console.log('Selected applications:', selectedApplications);
      
      // Get relevant categories based on task and applications
      const relevantCategories = this.getRelevantCategories(taskText, selectedApplications);
      console.log('Relevant categories:', relevantCategories);
      
      // Validate categories exist before fetching
      const validCategories = await this.validateCategories(relevantCategories);
      console.log('Valid categories:', validCategories);
      
      // Fetch only from valid categories (max 5 categories for speed)
      const limitedCategories = validCategories.slice(0, 5);
      const workflows: N8nWorkflow[] = [];
      
      for (const category of limitedCategories) {
        try {
          console.log(`Fetching from category: ${category}`);
          const categoryWorkflows = await this.fetchWorkflowsFromCategory(category, 10);
          workflows.push(...categoryWorkflows);
          console.log(`Added ${categoryWorkflows.length} workflows from ${category}`);
        } catch (error) {
          console.warn(`Failed to fetch from ${category}:`, error);
          // Continue with next category instead of stopping
        }
      }
      
      // If no workflows found from specific categories, try general categories
      if (workflows.length === 0) {
        console.log('No workflows found from specific categories, trying general categories...');
        const generalCategories = ['Automation', 'Automate', 'Code', 'Webhook'];
        
        for (const category of generalCategories) {
          try {
            console.log(`Fetching from general category: ${category}`);
            const categoryWorkflows = await this.fetchWorkflowsFromCategory(category, 5);
            workflows.push(...categoryWorkflows);
            console.log(`Added ${categoryWorkflows.length} workflows from ${category}`);
          } catch (error) {
            console.warn(`Failed to fetch from general category ${category}:`, error);
          }
        }
      }
      
      // Search in fetched workflows
      const results = this.searchInWorkflows(workflows, taskText, selectedApplications);
      console.log(`Found ${results.length} relevant workflows from ${workflows.length} total`);
      
      // Cache the results
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: results,
          timestamp: Date.now()
        }));
      } catch (e) {
        // Cache storage failed, continue without caching
        console.warn('Failed to cache search results:', e);
      }
      
      // Debug: Show some workflow names for troubleshooting
      if (workflows.length > 0 && results.length === 0) {
        console.log('Debug: Sample workflow names:', workflows.slice(0, 5).map(w => w.name));
        console.log('Debug: Task text:', taskText);
        console.log('Debug: Selected applications:', selectedApplications);
      }
      
      return results;
      
    } catch (error) {
      console.error('Error in fast search:', error);
      return this.getFallbackWorkflows(10);
    }
  }

  // Test method to debug workflow fetching
  async testWorkflowFetching(): Promise<void> {
    console.log('=== TESTING WORKFLOW FETCHING ===');
    
    try {
      // Test cache status
      const cacheStatus = this.getCacheStatus();
      console.log('Cache status:', cacheStatus);
      
      // Clear cache and fetch fresh
      this.clearCacheNow();
      
      // Fetch workflows
      const workflows = await this.fetchWorkflows();
      console.log('Fetched workflows:', workflows.length);
      
      // Test search
      const searchResults = await this.searchWorkflowsByTask('buchhaltung', []);
      console.log('Search results for "buchhaltung":', searchResults.length);
      
      // Test with applications
      const searchResultsWithApps = await this.searchWorkflowsByTask('buchhaltung', ['excel', 'quickbooks']);
      console.log('Search results with apps:', searchResultsWithApps.length);
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  }

  // Get available categories for debugging
  async getAvailableCategories(): Promise<string[]> {
    try {
      const response = await fetch(
        'https://api.github.com/repos/Zie619/n8n-workflows/contents/workflows',
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      
      const categories = await response.json();
      return categories.filter((cat: any) => cat.type === 'dir').map((cat: any) => cat.name);
    } catch (error) {
      console.error('Error fetching available categories:', error);
      return [];
    }
  }

  async getTotalWorkflowCount(): Promise<number> {
    try {
      // Try to get the count from GitHub API
      // Count all JSON files in the workflows directory
      const response = await fetch(
        'https://api.github.com/search/code?q=repo:Zie619/n8n-workflows+extension:json+path:workflows/',
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow count: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If we get a valid count, use it
      if (data.total_count && data.total_count > 0) {
        console.log(`Found ${data.total_count} workflows via GitHub API`);
        return data.total_count;
      }
      
      // If no count from API, try alternative search
      const altResponse = await fetch(
        'https://api.github.com/search/code?q=repo:Zie619/n8n-workflows+extension:json',
        {
          headers: this.getHeaders()
        }
      );
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        if (altData.total_count && altData.total_count > 0) {
          console.log(`Found ${altData.total_count} workflows via alternative GitHub API search`);
          return altData.total_count;
        }
      }
      
      // Fallback to the real count of 2,053 workflows (from repository documentation)
      console.log('Using fallback count of 2,053 workflows');
      return 2053;
    } catch (error) {
      console.error('Error fetching workflow count:', error);
      // Return the real count as fallback
      return 2053;
    }
  }

  // Map AI-generated categories to valid n8n categories
  private mapAICategoriesToN8n(aiCategories: string[]): string[] {
    const categoryMapping: Record<string, string[]> = {
      // HR & Personnel
      'HR': ['Asana', 'Mondaycom', 'Trello'],
      'Personnel': ['Asana', 'Mondaycom', 'Trello'],
      'Bamboohr': ['Asana', 'Mondaycom', 'Trello'],
      'Workday': ['Asana', 'Mondaycom', 'Trello'],
      'Recruitment': ['Asana', 'Mondaycom', 'Trello'],
      'Employee Management': ['Asana', 'Mondaycom', 'Trello'],
      
      // Communication & Email
      'Email': ['Emailsend', 'Gmail', 'Mailchimp', 'Sendgrid'],
      'Communication': ['Emailsend', 'Gmail', 'Mailchimp', 'Slack'],
      'SendGrid': ['Emailsend', 'Gmail', 'Mailchimp'],
      'Mailchimp': ['Mailchimp', 'Emailsend', 'Gmail'],
      
      // Social Media
      'Instagram': ['Facebook', 'Twitter', 'Linkedin'],
      'Facebook': ['Facebook', 'Facebookleadads'],
      'Twitter': ['Twitter', 'Twittertool'],
      'LinkedIn': ['Linkedin'],
      'Social Media': ['Facebook', 'Twitter', 'Linkedin'],
      
      // Marketing
      'Marketing': ['Mailchimp', 'Convertkit', 'Activecampaign'],
      'Content Creation': ['Googledocs', 'Notion', 'Markdown'],
      'SEO': ['Googleanalytics', 'Googlesheets'],
      'Analytics': ['Googleanalytics', 'Googlebigquery'],
      
      // Data & Analytics
      'Data Analysis': ['Googleanalytics', 'Googlebigquery', 'Googlesheets'],
      'Data Processing': ['Googlesheets', 'Airtable', 'Baserow'],
      'Reporting': ['Googlesheets', 'Googledocs', 'Markdown'],
      'Business Intelligence': ['Googleanalytics', 'Googlebigquery'],
      
      // Finance & Accounting
      'Finance': ['Quickbooks', 'Paypal', 'Stripe'],
      'Accounting': ['Quickbooks', 'Paypal'],
      'Bookkeeping': ['Quickbooks', 'Googlesheets'],
      'Payroll': ['Quickbooks', 'Asana'],
      
      // Technical
      'Software Development': ['Github', 'Gitlab', 'Code'],
      'IT': ['Github', 'Gitlab', 'Code'],
      'System Integration': ['Http', 'Webhook', 'Api'],
      'API': ['Http', 'Webhook', 'Graphql'],
      
      // General
      'Administrative': ['Automation', 'Process', 'Flow'],
      'Management': ['Asana', 'Mondaycom', 'Trello'],
      'Customer Service': ['Zendesk', 'Intercom', 'Helpscout'],
      'Sales': ['Hubspot', 'Pipedrive', 'Zohocrm'],
      'CRM': ['Hubspot', 'Pipedrive', 'Zohocrm']
    };

    const mappedCategories: string[] = [];
    
    for (const aiCategory of aiCategories) {
      const mapped = categoryMapping[aiCategory];
      if (mapped) {
        mappedCategories.push(...mapped);
      } else {
        // Try to find a similar category by partial match
        const similarCategory = Object.keys(categoryMapping).find(key => 
          key.toLowerCase().includes(aiCategory.toLowerCase()) || 
          aiCategory.toLowerCase().includes(key.toLowerCase())
        );
        
        if (similarCategory) {
          mappedCategories.push(...categoryMapping[similarCategory]);
        } else {
          // Fallback to general categories
          mappedCategories.push('Automation', 'Process');
        }
      }
    }
    
    // Remove duplicates and return
    return [...new Set(mappedCategories)];
  }

  // Validate categories exist before fetching
  private async validateCategories(categories: string[]): Promise<string[]> {
    try {
      // First, map AI categories to n8n categories
      const mappedCategories = this.mapAICategoriesToN8n(categories);
      
      const availableCategories = await this.getAvailableCategories();
      const validCategories = mappedCategories.filter(cat => availableCategories.includes(cat));
      
      if (validCategories.length !== mappedCategories.length) {
        const invalidCategories = mappedCategories.filter(cat => !availableCategories.includes(cat));
        console.warn('Invalid mapped categories found:', invalidCategories);
        console.log('Available categories:', availableCategories.slice(0, 20)); // Show first 20
      }
      
      if (validCategories.length === 0) {
        // Fallback to general categories if no valid categories found
        console.log('No valid categories found, using fallback categories');
        return ['Automation', 'Process'];
      }
      
      return validCategories;
    } catch (error) {
      console.error('Error validating categories:', error);
      return ['Automation', 'Process']; // Fallback categories
    }
  }
}

export const n8nApiClient = new N8nApi();
