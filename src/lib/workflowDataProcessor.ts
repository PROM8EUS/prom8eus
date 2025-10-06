/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use the new unified schema files instead:
 * - For WorkflowIndex: use @/lib/schemas/workflowIndex
 * - For N8nWorkflow: use @/lib/schemas/n8nWorkflow
 * - For WorkflowIndexer: use @/lib/workflowIndexerUnified
 * - For N8nApi: use @/lib/n8nApiUnified
 */

/**
 * Workflow Data Processor
 * 
 * Handles data validation, normalization, and processing
 */

import { WorkflowIndex, AgentIndex, SolutionIndex } from './schemas/workflowIndex';
import { AuthorInfo, DomainClassification } from './schemas/common';

export interface WorkflowStats {
  totalWorkflows: number;
  totalAgents: number;
  totalSolutions: number;
  sources: Record<string, number>;
  categories: Record<string, number>;
  lastUpdated: Date | null;
}

export class WorkflowDataProcessor {
  /**
   * Validate and normalize a WorkflowIndex object
   */
  static validateWorkflowIndex(input: any): WorkflowIndex | null {
    try {
      // Check mandatory core fields
      if (!input?.id || !input?.source || !input?.title || !input?.summary || !input?.link) {
        console.warn('WorkflowIndex missing mandatory core fields:', input);
        return null;
      }

      // Check workflow-specific mandatory fields
      if (!input?.category || !input?.integrations || !input?.complexity) {
        console.warn('WorkflowIndex missing mandatory workflow fields:', input);
        return null;
      }

      // Validate field types and normalize
      const normalized: WorkflowIndex = {
        // Core fields
        id: String(input.id),
        source: String(input.source),
        title: String(input.title),
        summary: String(input.summary),
        link: String(input.link),
        license: this.normalizeLicense(String(input.license || 'Unknown')),

        // Workflow-specific fields
        category: this.normalizeCategory(String(input.category)),
        integrations: this.normalizeStringArray(input.integrations),
        complexity: this.normalizeComplexity(String(input.complexity)),

        // Optional fields with fallbacks
        filename: input.filename ? String(input.filename) : undefined,
        active: typeof input.active === 'boolean' ? input.active : true,
        triggerType: input.triggerType ? this.normalizeTriggerType(String(input.triggerType)) : undefined,
        nodeCount: typeof input.nodeCount === 'number' ? input.nodeCount : undefined,
        tags: this.normalizeStringArray(input.tags),
        fileHash: input.fileHash ? String(input.fileHash) : undefined,
        analyzedAt: input.analyzedAt ? String(input.analyzedAt) : undefined,

        // Author metadata
        author: input.author ? this.normalizeAuthor(input.author) : undefined,

        // Domain classification
        domainClassification: input.domainClassification ? this.normalizeDomainClassification(input.domainClassification) : undefined
      };

      return normalized;
    } catch (error) {
      console.error('Error validating WorkflowIndex:', error);
      return null;
    }
  }

  /**
   * Validate and normalize an AgentIndex object
   */
  static validateAgentIndex(input: any): AgentIndex | null {
    try {
      // Check mandatory core fields
      if (!input?.id || !input?.source || !input?.title || !input?.summary || !input?.link) {
        console.warn('AgentIndex missing mandatory core fields:', input);
        return null;
      }

      // Check agent-specific mandatory fields
      if (!input?.model || !input?.provider || !input?.capabilities) {
        console.warn('AgentIndex missing mandatory agent fields:', input);
        return null;
      }

      // Validate field types and normalize
      const normalized: AgentIndex = {
        // Core fields
        id: String(input.id),
        source: String(input.source),
        title: String(input.title),
        summary: String(input.summary),
        link: String(input.link),

        // Agent-specific fields
        model: String(input.model),
        provider: String(input.provider),
        capabilities: this.normalizeStringArray(input.capabilities),

        // Optional fields with fallbacks
        category: input.category ? String(input.category) : undefined,
        tags: this.normalizeStringArray(input.tags),
        difficulty: input.difficulty ? this.normalizeDifficulty(String(input.difficulty)) : undefined,
        setupTime: input.setupTime ? this.normalizeSetupTime(String(input.setupTime)) : undefined,
        deployment: input.deployment ? this.normalizeDeployment(String(input.deployment)) : undefined,
        license: this.normalizeLicense(String(input.license || 'Unknown')),
        pricing: input.pricing ? this.normalizePricing(String(input.pricing)) : undefined,
        requirements: this.normalizeStringArray(input.requirements),
        useCases: this.normalizeStringArray(input.useCases),
        automationPotential: typeof input.automationPotential === 'number' ? input.automationPotential : undefined,

        // Author metadata
        authorName: input.authorName ? String(input.authorName) : undefined,
        authorUsername: input.authorUsername ? String(input.authorUsername) : undefined,
        authorAvatar: input.authorAvatar ? String(input.authorAvatar) : undefined,
        authorVerified: typeof input.authorVerified === 'boolean' ? input.authorVerified : undefined,
        authorEmail: input.authorEmail ? String(input.authorEmail) : undefined,

        // Source-specific metadata
        likes: typeof input.likes === 'number' ? input.likes : undefined,
        downloads: typeof input.downloads === 'number' ? input.downloads : undefined,
        lastModified: input.lastModified ? String(input.lastModified) : undefined,
        githubUrl: input.githubUrl ? String(input.githubUrl) : undefined,
        demoUrl: input.demoUrl ? String(input.demoUrl) : undefined,
        documentationUrl: input.documentationUrl ? String(input.documentationUrl) : undefined,

        // Domain classification
        domains: this.normalizeStringArray(input.domains),
        domain_confidences: this.normalizeNumberArray(input.domain_confidences),
        domain_origin: input.domain_origin ? this.normalizeDomainOrigin(String(input.domain_origin)) : undefined
      };

      return normalized;
    } catch (error) {
      console.error('Error validating AgentIndex:', error);
      return null;
    }
  }

  /**
   * Process and validate an array of solutions
   */
  static processSolutions(inputs: any[]): SolutionIndex[] {
    const processed: SolutionIndex[] = [];

    for (const input of inputs) {
      let processedItem: SolutionIndex | null = null;

      // Try to determine if it's a workflow or agent
      if (input.category && input.integrations && input.complexity) {
        processedItem = this.validateWorkflowIndex(input);
      } else if (input.model && input.provider && input.capabilities) {
        processedItem = this.validateAgentIndex(input);
      }

      if (processedItem) {
        processed.push(processedItem);
      }
    }

    return processed;
  }

  /**
   * Calculate workflow statistics
   */
  static calculateStats(workflows: WorkflowIndex[], agents: AgentIndex[]): WorkflowStats {
    const sources: Record<string, number> = {};
    const categories: Record<string, number> = {};

    // Count workflows by source and category
    workflows.forEach(workflow => {
      sources[workflow.source] = (sources[workflow.source] || 0) + 1;
      categories[workflow.category] = (categories[workflow.category] || 0) + 1;
    });

    // Count agents by source and category
    agents.forEach(agent => {
      sources[agent.source] = (sources[agent.source] || 0) + 1;
      if (agent.category) {
        categories[agent.category] = (categories[agent.category] || 0) + 1;
      }
    });

    return {
      totalWorkflows: workflows.length,
      totalAgents: agents.length,
      totalSolutions: workflows.length + agents.length,
      sources,
      categories,
      lastUpdated: new Date()
    };
  }

  // Normalization helper methods
  private static normalizeStringArray(input: any): string[] {
    if (Array.isArray(input)) {
      return input.map(item => String(item)).filter(item => item.length > 0);
    }
    if (typeof input === 'string') {
      return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return [];
  }

  private static normalizeNumberArray(input: any): number[] {
    if (Array.isArray(input)) {
      return input.map(item => Number(item)).filter(item => !isNaN(item));
    }
    return [];
  }

  private static normalizeLicense(input: string): string {
    const normalized = input.toLowerCase().trim();
    const validLicenses = ['mit', 'apache-2.0', 'gpl-3.0', 'bsd-3-clause', 'unknown'];
    return validLicenses.includes(normalized) ? normalized : 'unknown';
  }

  private static normalizeCategory(input: string): string {
    return input.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
  }

  private static normalizeComplexity(input: string): 'Low' | 'Medium' | 'High' {
    const normalized = input.toLowerCase().trim();
    if (normalized.includes('low') || normalized.includes('easy') || normalized.includes('simple')) {
      return 'Low';
    }
    if (normalized.includes('high') || normalized.includes('hard') || normalized.includes('complex')) {
      return 'High';
    }
    return 'Medium';
  }

  private static normalizeTriggerType(input: string): 'Complex' | 'Webhook' | 'Manual' | 'Scheduled' {
    const normalized = input.toLowerCase().trim();
    if (normalized.includes('webhook')) return 'Webhook';
    if (normalized.includes('manual')) return 'Manual';
    if (normalized.includes('scheduled') || normalized.includes('cron')) return 'Scheduled';
    return 'Complex';
  }

  private static normalizeDifficulty(input: string): 'Beginner' | 'Intermediate' | 'Advanced' {
    const normalized = input.toLowerCase().trim();
    if (normalized.includes('beginner') || normalized.includes('easy')) return 'Beginner';
    if (normalized.includes('advanced') || normalized.includes('expert')) return 'Advanced';
    return 'Intermediate';
  }

  private static normalizeSetupTime(input: string): 'Quick' | 'Medium' | 'Long' {
    const normalized = input.toLowerCase().trim();
    if (normalized.includes('quick') || normalized.includes('fast')) return 'Quick';
    if (normalized.includes('long') || normalized.includes('extensive')) return 'Long';
    return 'Medium';
  }

  private static normalizeDeployment(input: string): 'Local' | 'Cloud' | 'Hybrid' {
    const normalized = input.toLowerCase().trim();
    if (normalized.includes('local')) return 'Local';
    if (normalized.includes('cloud')) return 'Cloud';
    return 'Hybrid';
  }

  private static normalizePricing(input: string): 'Free' | 'Freemium' | 'Paid' | 'Enterprise' {
    const normalized = input.toLowerCase().trim();
    if (normalized.includes('free')) return 'Free';
    if (normalized.includes('freemium')) return 'Freemium';
    if (normalized.includes('enterprise')) return 'Enterprise';
    return 'Paid';
  }

  private static normalizeDomainOrigin(input: string): 'llm' | 'admin' | 'mixed' {
    const normalized = input.toLowerCase().trim();
    if (normalized.includes('llm') || normalized.includes('ai')) return 'llm';
    if (normalized.includes('admin') || normalized.includes('manual')) return 'admin';
    return 'mixed';
  }

  private static normalizeAuthor(input: any): AuthorInfo {
    return {
      name: String(input.name || ''),
      username: String(input.username || ''),
      avatar: input.avatar ? String(input.avatar) : undefined,
      verified: typeof input.verified === 'boolean' ? input.verified : false,
      email: input.email ? String(input.email) : undefined,
      bio: input.bio ? String(input.bio) : undefined,
      website: input.website ? String(input.website) : undefined,
      socialLinks: input.socialLinks || undefined
    };
  }

  private static normalizeDomainClassification(input: any): DomainClassification {
    return {
      primary: String(input.primary || 'General'),
      secondary: this.normalizeStringArray(input.secondary),
      confidence: typeof input.confidence === 'number' ? input.confidence : 0.8,
      origin: input.origin ? this.normalizeDomainOrigin(String(input.origin)) : 'llm',
      lastUpdated: String(input.lastUpdated || new Date().toISOString())
    };
  }
}
