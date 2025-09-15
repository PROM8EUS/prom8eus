/**
 * Source Documentation System
 * 
 * This module provides comprehensive documentation for all source management
 * functionality including API documentation, user guides, troubleshooting,
 * and maintenance procedures.
 */

export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  type: 'overview' | 'api' | 'guide' | 'troubleshooting' | 'maintenance' | 'examples';
  category: string;
  tags: string[];
  lastUpdated: Date;
  version: string;
  author: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  prerequisites: string[];
  relatedSections: string[];
}

export interface APIDocumentation {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  examples: APIExample[];
  authentication: string;
  rateLimits: string;
  version: string;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: any;
  validation: string[];
}

export interface APIResponse {
  status: number;
  description: string;
  schema: any;
  example: any;
}

export interface APIExample {
  title: string;
  description: string;
  request: any;
  response: any;
  code: string;
}

export interface UserGuide {
  id: string;
  title: string;
  description: string;
  steps: GuideStep[];
  prerequisites: string[];
  expectedOutcome: string;
  troubleshooting: string[];
  relatedGuides: string[];
}

export interface GuideStep {
  number: number;
  title: string;
  description: string;
  code?: string;
  screenshot?: string;
  expectedResult: string;
  tips: string[];
}

export interface TroubleshootingGuide {
  id: string;
  title: string;
  description: string;
  symptoms: string[];
  causes: string[];
  solutions: TroubleshootingSolution[];
  prevention: string[];
  relatedIssues: string[];
}

export interface TroubleshootingSolution {
  title: string;
  description: string;
  steps: string[];
  code?: string;
  verification: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceProcedure {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  estimatedTime: number; // minutes
  steps: MaintenanceStep[];
  tools: string[];
  safety: string[];
  rollback: string[];
}

export interface MaintenanceStep {
  number: number;
  title: string;
  description: string;
  commands?: string[];
  verification: string;
  estimatedTime: number; // minutes
}

export interface DocumentationSearchResult {
  section: DocumentationSection;
  relevanceScore: number;
  matchedTerms: string[];
  snippet: string;
}

/**
 * Documentation Manager
 */
export class DocumentationManager {
  private sections: Map<string, DocumentationSection> = new Map();
  private apiDocs: Map<string, APIDocumentation> = new Map();
  private userGuides: Map<string, UserGuide> = new Map();
  private troubleshootingGuides: Map<string, TroubleshootingGuide> = new Map();
  private maintenanceProcedures: Map<string, MaintenanceProcedure> = new Map();

  constructor() {
    this.initializeDocumentation();
  }

  /**
   * Get documentation section by ID
   */
  getSection(id: string): DocumentationSection | null {
    return this.sections.get(id) || null;
  }

  /**
   * Get all documentation sections
   */
  getAllSections(): DocumentationSection[] {
    return Array.from(this.sections.values());
  }

  /**
   * Search documentation
   */
  searchDocumentation(query: string, filters?: {
    type?: string;
    category?: string;
    difficulty?: string;
    tags?: string[];
  }): DocumentationSearchResult[] {
    const results: DocumentationSearchResult[] = [];
    const queryTerms = query.toLowerCase().split(' ');

    for (const section of this.sections.values()) {
      if (filters) {
        if (filters.type && section.type !== filters.type) continue;
        if (filters.category && section.category !== filters.category) continue;
        if (filters.difficulty && section.difficulty !== filters.difficulty) continue;
        if (filters.tags && !filters.tags.some(tag => section.tags.includes(tag))) continue;
      }

      const relevanceScore = this.calculateRelevanceScore(section, queryTerms);
      if (relevanceScore > 0) {
        results.push({
          section,
          relevanceScore,
          matchedTerms: this.findMatchedTerms(section, queryTerms),
          snippet: this.generateSnippet(section, queryTerms)
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get API documentation
   */
  getAPIDocumentation(endpoint: string): APIDocumentation | null {
    return this.apiDocs.get(endpoint) || null;
  }

  /**
   * Get all API documentation
   */
  getAllAPIDocumentation(): APIDocumentation[] {
    return Array.from(this.apiDocs.values());
  }

  /**
   * Get user guide
   */
  getUserGuide(id: string): UserGuide | null {
    return this.userGuides.get(id) || null;
  }

  /**
   * Get all user guides
   */
  getAllUserGuides(): UserGuide[] {
    return Array.from(this.userGuides.values());
  }

  /**
   * Get troubleshooting guide
   */
  getTroubleshootingGuide(id: string): TroubleshootingGuide | null {
    return this.troubleshootingGuides.get(id) || null;
  }

  /**
   * Get all troubleshooting guides
   */
  getAllTroubleshootingGuides(): TroubleshootingGuide[] {
    return Array.from(this.troubleshootingGuides.values());
  }

  /**
   * Get maintenance procedure
   */
  getMaintenanceProcedure(id: string): MaintenanceProcedure | null {
    return this.maintenanceProcedures.get(id) || null;
  }

  /**
   * Get all maintenance procedures
   */
  getAllMaintenanceProcedures(): MaintenanceProcedure[] {
    return Array.from(this.maintenanceProcedures.values());
  }

  /**
   * Add documentation section
   */
  addSection(section: DocumentationSection): void {
    this.sections.set(section.id, section);
  }

  /**
   * Update documentation section
   */
  updateSection(id: string, updates: Partial<DocumentationSection>): void {
    const section = this.sections.get(id);
    if (section) {
      this.sections.set(id, { ...section, ...updates, lastUpdated: new Date() });
    }
  }

  /**
   * Delete documentation section
   */
  deleteSection(id: string): void {
    this.sections.delete(id);
  }

  /**
   * Generate documentation index
   */
  generateIndex(): any {
    return {
      sections: this.getAllSections().map(section => ({
        id: section.id,
        title: section.title,
        type: section.type,
        category: section.category,
        tags: section.tags,
        difficulty: section.difficulty,
        estimatedTime: section.estimatedTime
      })),
      apiDocs: this.getAllAPIDocumentation().map(api => ({
        endpoint: api.endpoint,
        method: api.method,
        description: api.description,
        version: api.version
      })),
      userGuides: this.getAllUserGuides().map(guide => ({
        id: guide.id,
        title: guide.title,
        description: guide.description,
        prerequisites: guide.prerequisites
      })),
      troubleshootingGuides: this.getAllTroubleshootingGuides().map(guide => ({
        id: guide.id,
        title: guide.title,
        description: guide.description,
        symptoms: guide.symptoms
      })),
      maintenanceProcedures: this.getAllMaintenanceProcedures().map(procedure => ({
        id: procedure.id,
        title: procedure.title,
        description: procedure.description,
        frequency: procedure.frequency,
        estimatedTime: procedure.estimatedTime
      }))
    };
  }

  /**
   * Export documentation
   */
  exportDocumentation(format: 'json' | 'markdown' | 'html'): string {
    const data = {
      sections: this.getAllSections(),
      apiDocs: this.getAllAPIDocumentation(),
      userGuides: this.getAllUserGuides(),
      troubleshootingGuides: this.getAllTroubleshootingGuides(),
      maintenanceProcedures: this.getAllMaintenanceProcedures(),
      generated: new Date(),
      version: '1.0.0'
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'markdown':
        return this.generateMarkdownDocumentation(data);
      case 'html':
        return this.generateHTMLDocumentation(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Private helper methods
   */
  private calculateRelevanceScore(section: DocumentationSection, queryTerms: string[]): number {
    let score = 0;
    const content = `${section.title} ${section.content}`.toLowerCase();

    for (const term of queryTerms) {
      if (section.title.toLowerCase().includes(term)) {
        score += 3; // Title matches are more important
      }
      if (section.tags.some(tag => tag.toLowerCase().includes(term))) {
        score += 2; // Tag matches are important
      }
      if (content.includes(term)) {
        score += 1; // Content matches
      }
    }

    return score;
  }

  private findMatchedTerms(section: DocumentationSection, queryTerms: string[]): string[] {
    const matchedTerms: string[] = [];
    const content = `${section.title} ${section.content}`.toLowerCase();

    for (const term of queryTerms) {
      if (section.title.toLowerCase().includes(term) || 
          section.tags.some(tag => tag.toLowerCase().includes(term)) ||
          content.includes(term)) {
        matchedTerms.push(term);
      }
    }

    return matchedTerms;
  }

  private generateSnippet(section: DocumentationSection, queryTerms: string[]): string {
    const content = section.content;
    const maxLength = 200;
    
    if (content.length <= maxLength) {
      return content;
    }

    // Find the best position to start the snippet
    let bestPosition = 0;
    let bestScore = 0;

    for (let i = 0; i <= content.length - maxLength; i += 50) {
      const snippet = content.substring(i, i + maxLength).toLowerCase();
      let score = 0;
      
      for (const term of queryTerms) {
        if (snippet.includes(term)) {
          score++;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestPosition = i;
      }
    }

    const snippet = content.substring(bestPosition, bestPosition + maxLength);
    return bestPosition > 0 ? `...${snippet}...` : `${snippet}...`;
  }

  private generateMarkdownDocumentation(data: any): string {
    let markdown = '# Source Management Documentation\n\n';
    markdown += `Generated on: ${data.generated.toISOString()}\n`;
    markdown += `Version: ${data.version}\n\n`;

    // Table of Contents
    markdown += '## Table of Contents\n\n';
    markdown += '- [Overview](#overview)\n';
    markdown += '- [API Documentation](#api-documentation)\n';
    markdown += '- [User Guides](#user-guides)\n';
    markdown += '- [Troubleshooting](#troubleshooting)\n';
    markdown += '- [Maintenance](#maintenance)\n\n';

    // Overview
    markdown += '## Overview\n\n';
    const overviewSections = data.sections.filter((s: DocumentationSection) => s.type === 'overview');
    for (const section of overviewSections) {
      markdown += `### ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;
    }

    // API Documentation
    markdown += '## API Documentation\n\n';
    for (const api of data.apiDocs) {
      markdown += `### ${api.method} ${api.endpoint}\n\n`;
      markdown += `${api.description}\n\n`;
      markdown += `**Version:** ${api.version}\n\n`;
      markdown += `**Authentication:** ${api.authentication}\n\n`;
      markdown += `**Rate Limits:** ${api.rateLimits}\n\n`;
    }

    // User Guides
    markdown += '## User Guides\n\n';
    for (const guide of data.userGuides) {
      markdown += `### ${guide.title}\n\n`;
      markdown += `${guide.description}\n\n`;
      markdown += `**Prerequisites:** ${guide.prerequisites.join(', ')}\n\n`;
      markdown += `**Expected Outcome:** ${guide.expectedOutcome}\n\n`;
    }

    // Troubleshooting
    markdown += '## Troubleshooting\n\n';
    for (const guide of data.troubleshootingGuides) {
      markdown += `### ${guide.title}\n\n`;
      markdown += `${guide.description}\n\n`;
      markdown += `**Symptoms:**\n`;
      for (const symptom of guide.symptoms) {
        markdown += `- ${symptom}\n`;
      }
      markdown += '\n';
    }

    // Maintenance
    markdown += '## Maintenance\n\n';
    for (const procedure of data.maintenanceProcedures) {
      markdown += `### ${procedure.title}\n\n`;
      markdown += `${procedure.description}\n\n`;
      markdown += `**Frequency:** ${procedure.frequency}\n\n`;
      markdown += `**Estimated Time:** ${procedure.estimatedTime} minutes\n\n`;
    }

    return markdown;
  }

  private generateHTMLDocumentation(data: any): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Source Management Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #333; }
        h2 { color: #666; border-bottom: 1px solid #666; }
        h3 { color: #888; }
        .toc { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .api-endpoint { background: #e8f4f8; padding: 10px; border-radius: 5px; }
        .code { background: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Source Management Documentation</h1>
    <p><strong>Generated:</strong> ${data.generated.toISOString()}</p>
    <p><strong>Version:</strong> ${data.version}</p>
`;

    // Table of Contents
    html += `
    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            <li><a href="#overview">Overview</a></li>
            <li><a href="#api">API Documentation</a></li>
            <li><a href="#guides">User Guides</a></li>
            <li><a href="#troubleshooting">Troubleshooting</a></li>
            <li><a href="#maintenance">Maintenance</a></li>
        </ul>
    </div>
`;

    // Overview
    html += '<div id="overview" class="section"><h2>Overview</h2>';
    const overviewSections = data.sections.filter((s: DocumentationSection) => s.type === 'overview');
    for (const section of overviewSections) {
      html += `<h3>${section.title}</h3><p>${section.content}</p>`;
    }
    html += '</div>';

    // API Documentation
    html += '<div id="api" class="section"><h2>API Documentation</h2>';
    for (const api of data.apiDocs) {
      html += `
        <div class="api-endpoint">
            <h3>${api.method} ${api.endpoint}</h3>
            <p>${api.description}</p>
            <p><strong>Version:</strong> ${api.version}</p>
            <p><strong>Authentication:</strong> ${api.authentication}</p>
            <p><strong>Rate Limits:</strong> ${api.rateLimits}</p>
        </div>
      `;
    }
    html += '</div>';

    // User Guides
    html += '<div id="guides" class="section"><h2>User Guides</h2>';
    for (const guide of data.userGuides) {
      html += `
        <h3>${guide.title}</h3>
        <p>${guide.description}</p>
        <p><strong>Prerequisites:</strong> ${guide.prerequisites.join(', ')}</p>
        <p><strong>Expected Outcome:</strong> ${guide.expectedOutcome}</p>
      `;
    }
    html += '</div>';

    // Troubleshooting
    html += '<div id="troubleshooting" class="section"><h2>Troubleshooting</h2>';
    for (const guide of data.troubleshootingGuides) {
      html += `
        <h3>${guide.title}</h3>
        <p>${guide.description}</p>
        <p><strong>Symptoms:</strong></p>
        <ul>
      `;
      for (const symptom of guide.symptoms) {
        html += `<li>${symptom}</li>`;
      }
      html += '</ul>';
    }
    html += '</div>';

    // Maintenance
    html += '<div id="maintenance" class="section"><h2>Maintenance</h2>';
    for (const procedure of data.maintenanceProcedures) {
      html += `
        <h3>${procedure.title}</h3>
        <p>${procedure.description}</p>
        <p><strong>Frequency:</strong> ${procedure.frequency}</p>
        <p><strong>Estimated Time:</strong> ${procedure.estimatedTime} minutes</p>
      `;
    }
    html += '</div>';

    html += '</body></html>';
    return html;
  }

  private initializeDocumentation(): void {
    // Initialize with comprehensive documentation
    this.initializeOverviewDocumentation();
    this.initializeAPIDocumentation();
    this.initializeUserGuides();
    this.initializeTroubleshootingGuides();
    this.initializeMaintenanceProcedures();
  }

  private initializeOverviewDocumentation(): void {
    const overviewSections: DocumentationSection[] = [
      {
        id: 'source-management-overview',
        title: 'Source Management Overview',
        content: 'The Source Management system provides comprehensive functionality for managing workflow and AI agent sources including prioritization, health monitoring, caching, deduplication, performance metrics, fallback mechanisms, configuration management, data validation, usage analytics, security, and compliance.',
        type: 'overview',
        category: 'general',
        tags: ['overview', 'introduction', 'architecture'],
        lastUpdated: new Date(),
        version: '1.0.0',
        author: 'System',
        difficulty: 'beginner',
        estimatedTime: 10,
        prerequisites: [],
        relatedSections: []
      },
      {
        id: 'source-prioritization-overview',
        title: 'Source Prioritization System',
        content: 'The Source Prioritization System ranks sources based on quality, freshness, and relevance scores. It uses weighted algorithms to calculate overall source rankings and provides dynamic reordering based on performance metrics.',
        type: 'overview',
        category: 'prioritization',
        tags: ['prioritization', 'ranking', 'quality', 'freshness', 'relevance'],
        lastUpdated: new Date(),
        version: '1.0.0',
        author: 'System',
        difficulty: 'intermediate',
        estimatedTime: 15,
        prerequisites: ['source-management-overview'],
        relatedSections: ['source-health-monitoring-overview', 'source-performance-metrics-overview']
      },
      {
        id: 'source-health-monitoring-overview',
        title: 'Source Health Monitoring',
        content: 'The Source Health Monitoring system provides real-time status checking, automated error detection, response time monitoring, success rate tracking, and proactive notification systems for source issues.',
        type: 'overview',
        category: 'monitoring',
        tags: ['health', 'monitoring', 'status', 'errors', 'alerts'],
        lastUpdated: new Date(),
        version: '1.0.0',
        author: 'System',
        difficulty: 'intermediate',
        estimatedTime: 20,
        prerequisites: ['source-management-overview'],
        relatedSections: ['source-prioritization-overview', 'source-fallback-overview']
      }
    ];

    overviewSections.forEach(section => this.sections.set(section.id, section));
  }

  private initializeAPIDocumentation(): void {
    const apiDocs: APIDocumentation[] = [
      {
        endpoint: '/api/sources',
        method: 'GET',
        description: 'Retrieve all source configurations',
        parameters: [
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Maximum number of sources to return',
            example: 100,
            validation: ['min:1', 'max:1000']
          },
          {
            name: 'offset',
            type: 'number',
            required: false,
            description: 'Number of sources to skip',
            example: 0,
            validation: ['min:0']
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Successfully retrieved sources',
            schema: { type: 'array', items: { $ref: '#/components/schemas/Source' } },
            example: [{ id: 'source-1', name: 'GitHub', type: 'api', isActive: true }]
          }
        ],
        examples: [
          {
            title: 'Get all sources',
            description: 'Retrieve all active sources',
            request: { method: 'GET', url: '/api/sources' },
            response: { status: 200, data: [] },
            code: 'fetch("/api/sources").then(response => response.json())'
          }
        ],
        authentication: 'Bearer token required',
        rateLimits: '100 requests per minute',
        version: '1.0.0'
      }
    ];

    apiDocs.forEach(api => this.apiDocs.set(api.endpoint, api));
  }

  private initializeUserGuides(): void {
    const userGuides: UserGuide[] = [
      {
        id: 'add-new-source',
        title: 'Adding a New Source',
        description: 'Learn how to add a new source to the system',
        steps: [
          {
            number: 1,
            title: 'Access Source Management',
            description: 'Navigate to the Source Management section',
            expectedResult: 'Source Management interface is displayed',
            tips: ['Use the navigation menu to access Source Management']
          },
          {
            number: 2,
            title: 'Click Add Source',
            description: 'Click the "Add Source" button',
            expectedResult: 'Source configuration form is displayed',
            tips: ['The form will guide you through the configuration process']
          },
          {
            number: 3,
            title: 'Configure Source',
            description: 'Fill in the source configuration details',
            code: '{\n  "name": "My Source",\n  "type": "api",\n  "endpoint": "https://api.example.com"\n}',
            expectedResult: 'All required fields are filled',
            tips: ['Ensure the endpoint URL is accessible', 'Test the connection before saving']
          }
        ],
        prerequisites: ['Access to Source Management', 'Valid API credentials'],
        expectedOutcome: 'New source is successfully added and configured',
        troubleshooting: ['Connection timeout', 'Invalid credentials', 'Network errors'],
        relatedGuides: ['configure-source-credentials', 'test-source-connection']
      }
    ];

    userGuides.forEach(guide => this.userGuides.set(guide.id, guide));
  }

  private initializeTroubleshootingGuides(): void {
    const troubleshootingGuides: TroubleshootingGuide[] = [
      {
        id: 'source-connection-timeout',
        title: 'Source Connection Timeout',
        description: 'Resolve issues when sources fail to connect due to timeout',
        symptoms: [
          'Source status shows as "timeout"',
          'Error messages about connection timeout',
          'Slow response times from source'
        ],
        causes: [
          'Network connectivity issues',
          'Source server overload',
          'Firewall blocking connections',
          'Invalid endpoint URL'
        ],
        solutions: [
          {
            title: 'Check Network Connectivity',
            description: 'Verify network connection to the source',
            steps: [
              'Ping the source endpoint',
              'Check firewall settings',
              'Verify DNS resolution'
            ],
            verification: 'Source responds to ping',
            severity: 'high'
          },
          {
            title: 'Increase Timeout Settings',
            description: 'Increase timeout values for slow sources',
            code: '{\n  "timeout": 30000,\n  "retries": 3\n}',
            verification: 'Source connects within timeout period',
            severity: 'medium'
          }
        ],
        prevention: [
          'Monitor source response times',
          'Set appropriate timeout values',
          'Implement retry mechanisms'
        ],
        relatedIssues: ['source-authentication-failure', 'source-rate-limiting']
      }
    ];

    troubleshootingGuides.forEach(guide => this.troubleshootingGuides.set(guide.id, guide));
  }

  private initializeMaintenanceProcedures(): void {
    const maintenanceProcedures: MaintenanceProcedure[] = [
      {
        id: 'source-health-check',
        title: 'Source Health Check',
        description: 'Regular health check of all sources to ensure optimal performance',
        frequency: 'daily',
        estimatedTime: 30,
        steps: [
          {
            number: 1,
            title: 'Check Source Status',
            description: 'Verify all sources are responding',
            commands: ['curl -f https://api.example.com/health'],
            verification: 'All sources return 200 status',
            estimatedTime: 10
          },
          {
            number: 2,
            title: 'Review Error Logs',
            description: 'Check for any errors in source logs',
            verification: 'No critical errors found',
            estimatedTime: 10
          },
          {
            number: 3,
            title: 'Update Metrics',
            description: 'Update performance metrics for all sources',
            verification: 'Metrics updated successfully',
            estimatedTime: 10
          }
        ],
        tools: ['curl', 'monitoring dashboard', 'log viewer'],
        safety: ['Backup configuration before changes', 'Test in staging environment'],
        rollback: ['Restore from backup', 'Revert configuration changes']
      }
    ];

    maintenanceProcedures.forEach(procedure => this.maintenanceProcedures.set(procedure.id, procedure));
  }
}

// Export singleton instance
export const documentationManager = new DocumentationManager();
