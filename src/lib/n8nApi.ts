// n8n API Client for fetching workflows from n8n.io
export interface N8nWorkflow {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // in hours
  estimatedCost: number; // in EUR
  tools: string[];
  nodes: number;
  connections: number;
  author: string;
  downloads: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  jsonUrl: string;
}

export interface N8nApiResponse {
  workflows: N8nWorkflow[];
  total: number;
  page: number;
  limit: number;
}

class N8nApiClient {
  private baseUrl = 'https://n8n.io';
  private apiUrl = 'https://api.n8n.io';

  // Fetch workflows from n8n.io community
  async fetchWorkflows(options: {
    category?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    page?: number;
  } = {}): Promise<N8nWorkflow[]> {
    // Use mock workflows directly since GitHub workflows are not available
    return this.getMockWorkflows(options);
  }

  // Fetch workflows from n8n GitHub repository
  private async fetchFromGitHub(options: {
    category?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    page?: number;
  }): Promise<N8nWorkflow[]> {
    const githubUrl = 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows';
    
    // Known workflow files from n8n repository
    const workflowFiles = [
      'crm-to-sheets-sync.json',
      'invoice-processing-ocr.json',
      'social-media-scheduler.json',
      'customer-support-automation.json',
      'email-marketing-campaign.json',
      'data-backup-automation.json',
      'lead-scoring-automation.json',
      'expense-report-automation.json'
    ];

    const workflows: N8nWorkflow[] = [];
    
    for (const file of workflowFiles.slice(0, options.limit || 5)) {
      try {
        const response = await fetch(`${githubUrl}/${file}`);
        if (response.ok) {
          const workflowData = await response.json();
          const workflow = this.parseGitHubWorkflow(workflowData, file);
          
          // Filter by search term if provided
          if (options.search) {
            const searchLower = options.search.toLowerCase();
            if (!workflow.title.toLowerCase().includes(searchLower) && 
                !workflow.description.toLowerCase().includes(searchLower)) {
              continue;
            }
          }
          
          workflows.push(workflow);
        }
      } catch (error) {
        console.warn(`Failed to fetch workflow ${file}:`, error);
      }
    }

    return workflows;
  }

  // Parse GitHub workflow data into our format
  private parseGitHubWorkflow(data: any, filename: string): N8nWorkflow {
    const nodes = data.nodes || [];
    const connections = data.connections || {};
    
    return {
      id: filename.replace('.json', ''),
      title: this.generateTitleFromFilename(filename),
      description: this.generateDescriptionFromNodes(nodes),
      category: this.detectCategory(nodes),
      tags: this.extractTags(nodes),
      difficulty: this.assessDifficulty(nodes),
      estimatedTime: this.estimateTime(nodes),
      estimatedCost: this.estimateCost(nodes),
      tools: this.extractTools(nodes),
      nodes: nodes.length,
      connections: Object.keys(connections).length,
      author: 'n8n Community',
      downloads: Math.floor(Math.random() * 1000) + 100,
      rating: Math.floor(Math.random() * 5) + 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      url: `https://n8n.io/workflows/${filename.replace('.json', '')}`,
      jsonUrl: `https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/${filename}`
    };
  }

  private generateTitleFromFilename(filename: string): string {
    const name = filename.replace('.json', '').replace(/-/g, ' ');
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private generateDescriptionFromNodes(nodes: any[]): string {
    const nodeTypes = nodes.map(node => node.type).filter(Boolean);
    const uniqueTypes = [...new Set(nodeTypes)];
    
    if (uniqueTypes.includes('n8n-nodes-base.httpRequest')) {
      return 'HTTP-basierte Workflow-Automatisierung mit API-Integration';
    } else if (uniqueTypes.includes('n8n-nodes-base.emailSend')) {
      return 'E-Mail-Automatisierung und Marketing-Workflows';
    } else if (uniqueTypes.includes('n8n-nodes-base.googleSheets')) {
      return 'Google Sheets Integration und Datenverarbeitung';
    } else if (uniqueTypes.includes('n8n-nodes-base.slack')) {
      return 'Slack-Integration und Team-Kommunikation';
    }
    
    return 'Automatisierter Workflow für Geschäftsprozesse';
  }

  private detectCategory(nodes: any[]): string {
    const nodeTypes = nodes.map(node => node.type).join(' ').toLowerCase();
    
    if (nodeTypes.includes('email') || nodeTypes.includes('mailchimp')) {
      return 'marketing';
    } else if (nodeTypes.includes('sheets') || nodeTypes.includes('excel')) {
      return 'data-processing';
    } else if (nodeTypes.includes('slack') || nodeTypes.includes('discord')) {
      return 'communication';
    } else if (nodeTypes.includes('crm') || nodeTypes.includes('salesforce')) {
      return 'sales';
    } else if (nodeTypes.includes('invoice') || nodeTypes.includes('accounting')) {
      return 'finance';
    }
    
    return 'general';
  }

  private extractTags(nodes: any[]): string[] {
    const tags = new Set<string>();
    const nodeTypes = nodes.map(node => node.type).join(' ').toLowerCase();
    
    if (nodeTypes.includes('email')) tags.add('email');
    if (nodeTypes.includes('sheets')) tags.add('data-processing');
    if (nodeTypes.includes('slack')) tags.add('communication');
    if (nodeTypes.includes('crm')) tags.add('crm');
    if (nodeTypes.includes('invoice')) tags.add('finance');
    if (nodeTypes.includes('automation')) tags.add('automation');
    
    return Array.from(tags);
  }

  private assessDifficulty(nodes: any[]): 'easy' | 'medium' | 'hard' {
    const nodeCount = nodes.length;
    const hasComplexNodes = nodes.some(node => 
      node.type?.includes('function') || 
      node.type?.includes('code') ||
      node.type?.includes('httpRequest')
    );
    
    if (nodeCount <= 3 && !hasComplexNodes) return 'easy';
    if (nodeCount <= 8 || hasComplexNodes) return 'medium';
    return 'hard';
  }

  private estimateTime(nodes: any[]): number {
    const baseTime = nodes.length * 0.5; // 30 minutes per node
    const complexity = this.assessDifficulty(nodes);
    
    switch (complexity) {
      case 'easy': return Math.round(baseTime * 0.8);
      case 'medium': return Math.round(baseTime);
      case 'hard': return Math.round(baseTime * 1.5);
      default: return Math.round(baseTime);
    }
  }

  private estimateCost(nodes: any[]): number {
    const time = this.estimateTime(nodes);
    const hourlyRate = 60; // EUR per hour
    return Math.round(time * hourlyRate);
  }

  private extractTools(nodes: any[]): string[] {
    const tools = new Set<string>();
    
    nodes.forEach(node => {
      const type = node.type?.toLowerCase() || '';
      
      if (type.includes('google')) tools.add('Google Workspace');
      if (type.includes('slack')) tools.add('Slack');
      if (type.includes('email')) tools.add('Email');
      if (type.includes('sheets')) tools.add('Google Sheets');
      if (type.includes('crm')) tools.add('CRM System');
      if (type.includes('http')) tools.add('API Integration');
      if (type.includes('function')) tools.add('Custom Code');
    });
    
    return Array.from(tools);
  }

  // Mock workflows as fallback
  private getMockWorkflows(options: {
    category?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    page?: number;
  }): N8nWorkflow[] {
    const mockWorkflows: N8nWorkflow[] = [
      {
        id: 'email-marketing-automation',
        title: 'Email Marketing Automation',
        description: 'Automatisierte E-Mail-Kampagnen mit personalisierten Inhalten',
        category: 'marketing',
        tags: ['email', 'marketing', 'automation'],
        difficulty: 'medium',
        estimatedTime: 8,
        estimatedCost: 480,
        tools: ['Mailchimp', 'Google Sheets', 'API Integration'],
        nodes: 6,
        connections: 5,
        author: 'n8n Community',
        downloads: 1250,
        rating: 4.5,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        url: 'https://n8n.io/workflows/email-marketing-automation',
        jsonUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/email-marketing-automation.json'
      },
      {
        id: 'crm-data-sync',
        title: 'CRM Data Synchronization',
        description: 'Automatische Synchronisation von Kundendaten zwischen Systemen',
        category: 'sales',
        tags: ['crm', 'data-sync', 'automation'],
        difficulty: 'hard',
        estimatedTime: 12,
        estimatedCost: 720,
        tools: ['Salesforce', 'Google Sheets', 'API Integration'],
        nodes: 8,
        connections: 7,
        author: 'n8n Community',
        downloads: 890,
        rating: 4.2,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T16:45:00Z',
        url: 'https://n8n.io/workflows/crm-data-sync',
        jsonUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/crm-data-sync.json'
      },
      {
        id: 'invoice-processing',
        title: 'Invoice Processing Automation',
        description: 'Automatische Verarbeitung und Kategorisierung von Rechnungen',
        category: 'finance',
        tags: ['invoice', 'finance', 'ocr'],
        difficulty: 'medium',
        estimatedTime: 6,
        estimatedCost: 360,
        tools: ['OCR Service', 'Google Sheets', 'Email'],
        nodes: 5,
        connections: 4,
        author: 'n8n Community',
        downloads: 650,
        rating: 4.0,
        createdAt: '2024-01-12T11:00:00Z',
        updatedAt: '2024-01-19T13:20:00Z',
        url: 'https://n8n.io/workflows/invoice-processing',
        jsonUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/invoice-processing.json'
      },
      {
        id: 'buchhaltung-automation',
        title: 'Buchhaltung & Finanzberichte',
        description: 'Automatisierte Buchhaltungsprozesse und Finanzberichte',
        category: 'finance',
        tags: ['buchhaltung', 'finance', 'accounting', 'reports'],
        difficulty: 'medium',
        estimatedTime: 10,
        estimatedCost: 600,
        tools: ['DATEV', 'Excel', 'Email', 'PDF Generator'],
        nodes: 7,
        connections: 6,
        author: 'n8n Community',
        downloads: 1200,
        rating: 4.3,
        createdAt: '2024-01-08T08:00:00Z',
        updatedAt: '2024-01-16T12:30:00Z',
        url: 'https://n8n.io/workflows/buchhaltung-automation',
        jsonUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/buchhaltung-automation.json'
      },
      {
        id: 'umsatzsteuer-voranmeldung',
        title: 'Umsatzsteuer-Voranmeldung',
        description: 'Automatische Erstellung und Übermittlung der USt-Voranmeldung',
        category: 'finance',
        tags: ['umsatzsteuer', 'tax', 'finance', 'compliance'],
        difficulty: 'hard',
        estimatedTime: 15,
        estimatedCost: 900,
        tools: ['DATEV', 'ELSTER', 'Excel', 'API Integration'],
        nodes: 10,
        connections: 9,
        author: 'n8n Community',
        downloads: 750,
        rating: 4.6,
        createdAt: '2024-01-05T09:00:00Z',
        updatedAt: '2024-01-14T15:45:00Z',
        url: 'https://n8n.io/workflows/umsatzsteuer-voranmeldung',
        jsonUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/umsatzsteuer-voranmeldung.json'
      },
      {
        id: 'mahnwesen-automation',
        title: 'Mahnwesen & Zahlungsverkehr',
        description: 'Automatisiertes Mahnwesen und Zahlungsverkehr-Management',
        category: 'finance',
        tags: ['mahnwesen', 'zahlungen', 'finance', 'automation'],
        difficulty: 'medium',
        estimatedTime: 8,
        estimatedCost: 480,
        tools: ['Banking API', 'Email', 'Excel', 'CRM'],
        nodes: 6,
        connections: 5,
        author: 'n8n Community',
        downloads: 980,
        rating: 4.1,
        createdAt: '2024-01-12T10:00:00Z',
        updatedAt: '2024-01-20T11:20:00Z',
        url: 'https://n8n.io/workflows/mahnwesen-automation',
        jsonUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/mahnwesen-automation.json'
      },
      {
        id: 'konten-abstimmung',
        title: 'Konten-Abstimmung',
        description: 'Automatische Abstimmung von Bankkonten und Buchhaltung',
        category: 'finance',
        tags: ['konten', 'abstimmung', 'banking', 'finance'],
        difficulty: 'medium',
        estimatedTime: 7,
        estimatedCost: 420,
        tools: ['Banking API', 'DATEV', 'Excel', 'Matching Engine'],
        nodes: 5,
        connections: 4,
        author: 'n8n Community',
        downloads: 850,
        rating: 4.4,
        createdAt: '2024-01-10T14:00:00Z',
        updatedAt: '2024-01-18T09:15:00Z',
        url: 'https://n8n.io/workflows/konten-abstimmung',
        jsonUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/konten-abstimmung.json'
      },
      {
        id: 'budgetplanung-controlling',
        title: 'Budgetplanung & Controlling',
        description: 'Automatisierte Budgetplanung und Controlling-Prozesse',
        category: 'finance',
        tags: ['budget', 'controlling', 'planning', 'finance'],
        difficulty: 'hard',
        estimatedTime: 12,
        estimatedCost: 720,
        tools: ['Excel', 'Power BI', 'API Integration', 'Reporting'],
        nodes: 8,
        connections: 7,
        author: 'n8n Community',
        downloads: 650,
        rating: 4.2,
        createdAt: '2024-01-07T11:00:00Z',
        updatedAt: '2024-01-15T16:30:00Z',
        url: 'https://n8n.io/workflows/budgetplanung-controlling',
        jsonUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/budgetplanung-controlling.json'
      },
      {
        id: 'social-media-automation',
        title: 'Social Media Automation',
        description: 'Automatisierte Social Media Posts und Content Management',
        category: 'marketing',
        tags: ['social-media', 'marketing', 'content', 'automation'],
        difficulty: 'medium',
        estimatedTime: 9,
        estimatedCost: 540,
        tools: ['LinkedIn', 'Instagram', 'Twitter', 'Canva'],
        nodes: 7,
        connections: 6,
        author: 'n8n Community',
        downloads: 1100,
        rating: 4.3,
        createdAt: '2024-01-09T13:00:00Z',
        updatedAt: '2024-01-17T14:20:00Z',
        url: 'https://n8n.io/workflows/social-media-automation',
        jsonUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/social-media-automation.json'
      },
      {
        id: 'lead-scoring-automation',
        title: 'Lead Scoring Automation',
        description: 'Automatisches Lead Scoring und Qualifizierung',
        category: 'sales',
        tags: ['lead-scoring', 'sales', 'crm', 'automation'],
        difficulty: 'medium',
        estimatedTime: 8,
        estimatedCost: 480,
        tools: ['CRM', 'Email', 'Analytics', 'API Integration'],
        nodes: 6,
        connections: 5,
        author: 'n8n Community',
        downloads: 920,
        rating: 4.0,
        createdAt: '2024-01-11T15:00:00Z',
        updatedAt: '2024-01-19T10:45:00Z',
        url: 'https://n8n.io/workflows/lead-scoring-automation',
        jsonUrl: 'https://raw.githubusercontent.com/n8n-io/n8n/master/workflows/lead-scoring-automation.json'
      }
    ];

    // Filter by search term if provided
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      return mockWorkflows.filter(workflow => 
        workflow.title.toLowerCase().includes(searchLower) ||
        workflow.description.toLowerCase().includes(searchLower) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category if provided
    if (options.category) {
      return mockWorkflows.filter(workflow => 
        workflow.category === options.category
      );
    }

    return mockWorkflows.slice(0, options.limit || 3);
  }

  // Search workflows by task text
  async searchWorkflowsByTask(taskText: string, limit: number = 3): Promise<N8nWorkflow[]> {
    const lowerTask = taskText.toLowerCase();
    
    // Enhanced keyword mapping for German tasks
    const keywordMatches: Record<string, string[]> = {
      'buchhaltung': ['buchhaltung', 'finanzbuchhaltung', 'accounting', 'finance', 'buchführung', 'buchhalten'],
      'finanz': ['finanz', 'finanzen', 'finance', 'financial', 'geld', 'money'],
      'umsatzsteuer': ['umsatzsteuer', 'ust', 'tax', 'steuer', 'mwst', 'mehrwertsteuer'],
      'mahnwesen': ['mahnwesen', 'mahnung', 'zahlung', 'payment', 'zahlungsverkehr', 'inkasso'],
      'konten': ['konten', 'konto', 'account', 'banking', 'bank', 'abstimmung'],
      'budget': ['budget', 'budgetplanung', 'planning', 'planung', 'etat'],
      'controlling': ['controlling', 'control', 'reporting', 'analyse', 'auswertung'],
      'marketing': ['marketing', 'kampagne', 'campaign', 'werbung', 'promotion'],
      'email': ['email', 'mail', 'e-mail', 'newsletter', 'mailing'],
      'social': ['social', 'social-media', 'linkedin', 'instagram', 'facebook', 'twitter'],
      'crm': ['crm', 'kunde', 'customer', 'lead', 'kundenverwaltung', 'kundenbetreuung'],
      'verkauf': ['verkauf', 'sales', 'vertrieb', 'verkaufen', 'selling'],
      'daten': ['daten', 'data', 'report', 'bericht', 'information', 'datei'],
      'bericht': ['bericht', 'report', 'reporting', 'dokumentation', 'auswertung'],
      'abschluss': ['abschluss', 'closing', 'monthly', 'yearly', 'jahresabschluss', 'monatsabschluss'],
      'automatisierung': ['automatisierung', 'automation', 'automatisch', 'workflow'],
      'prozess': ['prozess', 'process', 'verfahren', 'ablauf', 'workflow'],
      'verwaltung': ['verwaltung', 'management', 'admin', 'administration'],
      'organisation': ['organisation', 'organization', 'struktur', 'ordnung'],
      'kommunikation': ['kommunikation', 'communication', 'nachricht', 'message'],
      'dokumentation': ['dokumentation', 'documentation', 'dokument', 'document'],
      'analyse': ['analyse', 'analysis', 'auswertung', 'evaluation'],
      'import': ['import', 'importieren', 'einlesen', 'laden'],
      'export': ['export', 'exportieren', 'ausgeben', 'speichern'],
      'synchronisation': ['synchronisation', 'sync', 'abgleich', 'synchronisierung']
    };

    // Find matching workflows based on keywords
    const allWorkflows = this.getMockWorkflows({});
    const scoredWorkflows = allWorkflows.map(workflow => {
      let score = 0;
      
      // Check for exact keyword matches
      for (const [keyword, matches] of Object.entries(keywordMatches)) {
        for (const match of matches) {
          if (lowerTask.includes(match)) {
            score += 10;
            // Bonus for category match
            if (workflow.category === this.getCategoryFromKeyword(keyword)) {
              score += 5;
            }
            // Bonus for tag matches
            if (workflow.tags.some(tag => tag.includes(match))) {
              score += 3;
            }
          }
        }
      }
      
      // Check title and description matches (partial matching)
      const taskWords = lowerTask.split(' ').filter(word => word.length > 2);
      const titleWords = workflow.title.toLowerCase().split(' ');
      const descWords = workflow.description.toLowerCase().split(' ');
      
      taskWords.forEach(taskWord => {
        if (titleWords.some(titleWord => titleWord.includes(taskWord) || taskWord.includes(titleWord))) {
          score += 6;
        }
        if (descWords.some(descWord => descWord.includes(taskWord) || taskWord.includes(descWord))) {
          score += 4;
        }
      });
      
      // Check tag matches (flexible)
      workflow.tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (lowerTask.includes(tagLower) || tagLower.includes(lowerTask)) {
          score += 3;
        }
        // Partial word matches
        taskWords.forEach(taskWord => {
          if (tagLower.includes(taskWord) || taskWord.includes(tagLower)) {
            score += 1;
          }
        });
      });
      
      // Base score for all workflows (ensures everyone gets some score)
      score += 1;
      
      return { workflow, score };
    });

    // Sort by score and return top matches (always return workflows)
    const sortedWorkflows = scoredWorkflows
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.workflow);

    return sortedWorkflows;
  }

  private getCategoryFromKeyword(keyword: string): string {
    const categoryMap: Record<string, string> = {
      'buchhaltung': 'finance',
      'finanz': 'finance',
      'umsatzsteuer': 'finance',
      'mahnwesen': 'finance',
      'konten': 'finance',
      'budget': 'finance',
      'controlling': 'finance',
      'abschluss': 'finance',
      'marketing': 'marketing',
      'email': 'marketing',
      'social': 'marketing',
      'crm': 'sales',
      'verkauf': 'sales',
      'daten': 'data-processing',
      'bericht': 'data-processing'
    };
    
    return categoryMap[keyword] || 'general';
  }
}

export const n8nApiClient = new N8nApiClient();
