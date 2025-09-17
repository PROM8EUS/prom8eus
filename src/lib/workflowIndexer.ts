/**
 * N8N Workflow Indexer
 * 
 * Based on the n8n-workflows repository documentation:
 * - 2,053 workflows with meaningful, searchable names
 * - 365 unique integrations across popular platforms
 * - 29,445 total nodes with professional categorization
 * - 12 service categories for filtering
 */

import { getGitHubConfig } from './config';
import { supabase } from '@/integrations/supabase/client';
import { openaiClient } from './openai';

export interface WorkflowIndex {
  // Mandatory core fields (PRD requirement)
  id: string; // Changed from number to string for consistency
  source: string; // Added: source identifier (github, n8n.io, etc.)
  title: string; // Added: renamed from 'name' for consistency
  summary: string; // Added: renamed from 'description' for consistency  
  link: string; // Added: URL to the workflow source
  
  // Workflow-specific mandatory fields
  category: string;
  integrations: string[];
  complexity: 'Low' | 'Medium' | 'High';
  
  // Optional fields with fallbacks
  filename?: string;
  active?: boolean;
  triggerType?: 'Complex' | 'Webhook' | 'Manual' | 'Scheduled';
  nodeCount?: number;
  tags?: string[];
  fileHash?: string;
  analyzedAt?: string;
  license?: string; // Added: license information with fallback 'Unknown'
  
  // Author metadata (optional, populated for n8n.io)
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  authorVerified?: boolean;

  // Domain classification (LLM-based)
  domains?: string[];
  domain_confidences?: number[];
  domain_origin?: 'llm' | 'admin' | 'mixed';
}

export interface AgentIndex {
  // Mandatory core fields (PRD requirement)
  id: string;
  source: string; // source identifier (crewai, hf-spaces, etc.)
  title: string;
  summary: string;
  link: string;
  
  // Agent-specific mandatory fields
  model: string; // model/provider (e.g., "GPT-4", "Claude", "OpenAI")
  provider: string; // API provider (e.g., "OpenAI", "Anthropic", "HuggingFace")
  capabilities: string[]; // standardized capability tags
  
  // Optional fields with fallbacks
  category?: string;
  tags?: string[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  setupTime?: 'Quick' | 'Medium' | 'Long';
  deployment?: 'Local' | 'Cloud' | 'Hybrid';
  license?: string; // license information with fallback 'Unknown'
  pricing?: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
  requirements?: string[];
  useCases?: string[];
  automationPotential?: number; // 0-100 percentage
  
  // Author metadata (optional)
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  authorVerified?: boolean;
  authorEmail?: string;
  
  // Source-specific metadata
  likes?: number;
  downloads?: number;
  lastModified?: string;
  githubUrl?: string;
  demoUrl?: string;
  documentationUrl?: string;

  // Domain classification (LLM-based)
  domains?: string[];
  domain_confidences?: number[];
  domain_origin?: 'llm' | 'admin' | 'mixed';
}

// Unified solution type for both workflows and agents
export type SolutionIndex = WorkflowIndex | AgentIndex;

// Type guards to distinguish between workflow and agent solutions
export function isWorkflowIndex(solution: SolutionIndex): solution is WorkflowIndex {
  return 'integrations' in solution && 'complexity' in solution;
}

export function isAgentIndex(solution: SolutionIndex): solution is AgentIndex {
  return 'model' in solution && 'provider' in solution && 'capabilities' in solution;
}

/**
 * Enhanced schema validation and normalization utilities
 */
export class SchemaValidator {
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
        authorName: input.authorName ? String(input.authorName) : undefined,
        authorUsername: input.authorUsername ? String(input.authorUsername) : undefined,
        authorAvatar: input.authorAvatar ? String(input.authorAvatar) : undefined,
        authorVerified: typeof input.authorVerified === 'boolean' ? input.authorVerified : undefined,

        // Domain classification
        domains: this.normalizeStringArray(input.domains),
        domain_confidences: Array.isArray(input.domain_confidences) ? 
          input.domain_confidences.map(c => Math.max(0, Math.min(1, Number(c)))) : undefined,
        domain_origin: input.domain_origin && ['llm', 'admin', 'mixed'].includes(input.domain_origin) ? 
          input.domain_origin : undefined
      };

      return normalized;
    } catch (error) {
      console.error('Failed to validate WorkflowIndex:', error, input);
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
        license: this.normalizeLicense(String(input.license || 'Unknown')),

        // Agent-specific fields
        model: this.normalizeModel(String(input.model)),
        provider: this.normalizeProvider(String(input.provider)),
        capabilities: this.normalizeCapabilities(input.capabilities),

        // Optional fields with fallbacks
        category: input.category ? this.normalizeCategory(String(input.category)) : undefined,
        tags: this.normalizeStringArray(input.tags),
        difficulty: input.difficulty ? this.normalizeDifficulty(String(input.difficulty)) : undefined,
        setupTime: input.setupTime ? this.normalizeSetupTime(String(input.setupTime)) : undefined,
        deployment: input.deployment ? this.normalizeDeployment(String(input.deployment)) : undefined,
        pricing: input.pricing ? this.normalizePricing(String(input.pricing)) : undefined,
        requirements: this.normalizeStringArray(input.requirements),
        useCases: this.normalizeStringArray(input.useCases),
        automationPotential: typeof input.automationPotential === 'number' ? 
          Math.max(0, Math.min(100, input.automationPotential)) : undefined,

        // Author metadata
        authorName: input.authorName ? String(input.authorName) : undefined,
        authorUsername: input.authorUsername ? String(input.authorUsername) : undefined,
        authorEmail: input.authorEmail ? String(input.authorEmail) : undefined,
        authorAvatar: input.authorAvatar ? String(input.authorAvatar) : undefined,
        authorVerified: typeof input.authorVerified === 'boolean' ? input.authorVerified : undefined,

        // Source-specific metadata
        likes: typeof input.likes === 'number' ? Math.max(0, input.likes) : undefined,
        downloads: typeof input.downloads === 'number' ? Math.max(0, input.downloads) : undefined,
        lastModified: input.lastModified ? String(input.lastModified) : undefined,
        githubUrl: input.githubUrl ? String(input.githubUrl) : undefined,
        demoUrl: input.demoUrl ? String(input.demoUrl) : undefined,
        documentationUrl: input.documentationUrl ? String(input.documentationUrl) : undefined,

        // Domain classification
        domains: this.normalizeStringArray(input.domains),
        domain_confidences: Array.isArray(input.domain_confidences) ? 
          input.domain_confidences.map(c => Math.max(0, Math.min(1, Number(c)))) : undefined,
        domain_origin: input.domain_origin && ['llm', 'admin', 'mixed'].includes(input.domain_origin) ? 
          input.domain_origin : undefined
      };

      return normalized;
    } catch (error) {
      console.error('Failed to validate AgentIndex:', error, input);
      return null;
    }
  }

  /**
   * Normalize license names to standard format
   */
  private static normalizeLicense(license: string): string {
    const normalized = license.trim();
    const licenseMap: Record<string, string> = {
      'mit': 'MIT',
      'apache-2.0': 'Apache-2.0',
      'apache 2.0': 'Apache-2.0',
      'apache license': 'Apache-2.0',
      'gpl-3.0': 'GPL-3.0',
      'gpl 3.0': 'GPL-3.0',
      'gpl v3': 'GPL-3.0',
      'gpl-2.0': 'GPL-2.0',
      'gpl 2.0': 'GPL-2.0',
      'gpl v2': 'GPL-2.0',
      'bsd-3-clause': 'BSD-3-Clause',
      'bsd 3-clause': 'BSD-3-Clause',
      'bsd-2-clause': 'BSD-2-Clause',
      'bsd 2-clause': 'BSD-2-Clause',
      'mpl-2.0': 'MPL-2.0',
      'mpl 2.0': 'MPL-2.0',
      'epl-1.0': 'EPL-1.0',
      'epl 1.0': 'EPL-1.0',
      'cc-by': 'CC-BY',
      'cc by': 'CC-BY',
      'unlicense': 'Unlicense',
      'public domain': 'Unlicense',
      'unknown': 'Unknown'
    };

    return licenseMap[normalized.toLowerCase()] || normalized;
  }

  /**
   * Normalize category names
   */
  private static normalizeCategory(category: string): string {
    const normalized = category.trim();
    const categoryMap: Record<string, string> = {
      'general': 'General',
      'business': 'Business',
      'hr': 'HR & Recruitment',
      'finance': 'Finance & Accounting',
      'marketing': 'Marketing & Sales',
      'customer support': 'Customer Support',
      'data analysis': 'Data Analysis',
      'content creation': 'Content Creation',
      'automation': 'Automation',
      'integration': 'Integration',
      'ai analyzed': 'AI Analyzed'
    };

    return categoryMap[normalized.toLowerCase()] || normalized;
  }

  /**
   * Normalize complexity levels
   */
  private static normalizeComplexity(complexity: string): 'Low' | 'Medium' | 'High' {
    const normalized = complexity.trim().toLowerCase();
    if (normalized.includes('low') || normalized.includes('simple') || normalized.includes('basic')) {
      return 'Low';
    } else if (normalized.includes('high') || normalized.includes('complex') || normalized.includes('advanced')) {
      return 'High';
    } else {
      return 'Medium';
    }
  }

  /**
   * Normalize trigger types
   */
  private static normalizeTriggerType(triggerType: string): 'Complex' | 'Webhook' | 'Manual' | 'Scheduled' {
    const normalized = triggerType.trim().toLowerCase();
    if (normalized.includes('webhook') || normalized.includes('http')) {
      return 'Webhook';
    } else if (normalized.includes('scheduled') || normalized.includes('cron') || normalized.includes('timer')) {
      return 'Scheduled';
    } else if (normalized.includes('manual') || normalized.includes('button')) {
      return 'Manual';
    } else {
      return 'Complex';
    }
  }

  /**
   * Normalize model names
   */
  private static normalizeModel(model: string): string {
    const normalized = model.trim();
    const modelMap: Record<string, string> = {
      'gpt-4': 'GPT-4',
      'gpt-3.5': 'GPT-3.5',
      'gpt-3.5-turbo': 'GPT-3.5-Turbo',
      'claude-3': 'Claude-3',
      'claude-3-opus': 'Claude-3-Opus',
      'claude-3-sonnet': 'Claude-3-Sonnet',
      'claude-3-haiku': 'Claude-3-Haiku',
      'gemini-pro': 'Gemini-Pro',
      'gemini-1.5': 'Gemini-1.5',
      'llama-2': 'Llama-2',
      'llama-3': 'Llama-3',
      'mistral-7b': 'Mistral-7B',
      'mistral-8x7b': 'Mistral-8x7B'
    };

    return modelMap[normalized.toLowerCase()] || normalized;
  }

  /**
   * Normalize provider names
   */
  private static normalizeProvider(provider: string): string {
    const normalized = provider.trim();
    const providerMap: Record<string, string> = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google',
      'meta': 'Meta',
      'mistral ai': 'Mistral AI',
      'mistral': 'Mistral AI',
      'hugging face': 'Hugging Face',
      'huggingface': 'Hugging Face',
      'cohere': 'Cohere',
      'perplexity': 'Perplexity'
    };

    return providerMap[normalized.toLowerCase()] || normalized;
  }

  /**
   * Normalize capability tags
   */
  private static normalizeCapabilities(capabilities: any): string[] {
    if (!Array.isArray(capabilities)) {
      return [];
    }

    const validCapabilities = [
      'web_search', 'data_analysis', 'file_io', 'email_send', 'api_integration',
      'text_generation', 'image_processing', 'code_generation', 'document_processing',
      'database_query', 'workflow_automation', 'scheduling', 'monitoring', 'reporting'
    ];

    return capabilities
      .map(cap => String(cap).trim().toLowerCase())
      .filter(cap => validCapabilities.includes(cap))
      .map(cap => validCapabilities.find(valid => valid === cap)!)
      .filter((cap, index, arr) => arr.indexOf(cap) === index); // Remove duplicates
  }

  /**
   * Normalize difficulty levels
   */
  private static normalizeDifficulty(difficulty: string): 'Beginner' | 'Intermediate' | 'Advanced' {
    const normalized = difficulty.trim().toLowerCase();
    if (normalized.includes('beginner') || normalized.includes('easy') || normalized.includes('basic')) {
      return 'Beginner';
    } else if (normalized.includes('advanced') || normalized.includes('expert') || normalized.includes('complex')) {
      return 'Advanced';
    } else {
      return 'Intermediate';
    }
  }

  /**
   * Normalize setup time
   */
  private static normalizeSetupTime(setupTime: string): 'Quick' | 'Medium' | 'Long' {
    const normalized = setupTime.trim().toLowerCase();
    if (normalized.includes('quick') || normalized.includes('fast') || normalized.includes('5 min')) {
      return 'Quick';
    } else if (normalized.includes('long') || normalized.includes('slow') || normalized.includes('30 min')) {
      return 'Long';
    } else {
      return 'Medium';
    }
  }

  /**
   * Normalize deployment types
   */
  private static normalizeDeployment(deployment: string): 'Local' | 'Cloud' | 'Hybrid' {
    const normalized = deployment.trim().toLowerCase();
    if (normalized.includes('local') || normalized.includes('on-premise')) {
      return 'Local';
    } else if (normalized.includes('hybrid') || normalized.includes('mixed')) {
      return 'Hybrid';
    } else {
      return 'Cloud';
    }
  }

  /**
   * Normalize pricing models
   */
  private static normalizePricing(pricing: string): 'Free' | 'Freemium' | 'Paid' | 'Enterprise' {
    const normalized = pricing.trim().toLowerCase();
    if (normalized.includes('free') && !normalized.includes('freemium')) {
      return 'Free';
    } else if (normalized.includes('freemium') || normalized.includes('free tier')) {
      return 'Freemium';
    } else if (normalized.includes('enterprise') || normalized.includes('custom')) {
      return 'Enterprise';
    } else {
      return 'Paid';
    }
  }

  /**
   * Normalize string arrays
   */
  private static normalizeStringArray(input: any): string[] {
    if (!Array.isArray(input)) {
      return [];
    }

    return input
      .map(item => String(item).trim())
      .filter(item => item.length > 0)
      .filter((item, index, arr) => arr.indexOf(item) === index); // Remove duplicates
  }

  /**
   * Classify solution into ontology domains using LLM with caching
   */
  static async classifySolutionDomains(
    title: string,
    summary: string,
    source: string,
    additionalContext?: string
  ): Promise<{
    domains: string[];
    domain_confidences: number[];
    domain_origin: 'llm' | 'admin' | 'mixed';
  }> {
    try {
      // First, check cache for existing classification
      const cachedResult = await this.getCachedDomainClassification(title, summary, source);
      if (cachedResult) {
        return {
          domains: cachedResult.domains,
          domain_confidences: cachedResult.domain_confidences,
          domain_origin: cachedResult.domain_origin
        };
      }

      // Get available domains from database using direct SQL
      const { data: domains, error } = await supabase.rpc('get_ontology_domains');

      if (error || !domains) {
        console.warn('Failed to fetch ontology domains:', error);
        const fallbackResult = {
          domains: ['Other'],
          domain_confidences: [1.0],
          domain_origin: 'llm' as const
        };
        await this.cacheDomainClassification(title, summary, source, fallbackResult);
        return fallbackResult;
      }

      const domainLabels = domains.map((d: any) => d.label);
      const domainList = domainLabels.join(', ');

      // Create LLM prompt for domain classification
      const systemPrompt = `You are an expert in business domain classification. Classify the given solution into the most appropriate business domains from the provided ontology.

IMPORTANT: 
- You MUST choose ONLY from the provided domain list
- Return up to 3 domains maximum
- Each domain must have a confidence score between 0.0 and 1.0
- The sum of all confidence scores should not exceed 1.0
- Use the exact domain labels as provided
- If uncertain, use "Other" as fallback

AVAILABLE DOMAINS: ${domainList}

Respond with valid JSON only:
{
  "domains": ["Domain1", "Domain2", "Domain3"],
  "confidences": [0.6, 0.3, 0.1]
}`;

      const userPrompt = `Classify this solution into business domains:

TITLE: ${title}
SUMMARY: ${summary}
SOURCE: ${source}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

Choose up to 3 most relevant domains from the available list with confidence scores.`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ];

      const response = await openaiClient.chatCompletion(messages, {
        temperature: 0.3,
        max_tokens: 200
      });

      try {
        const result = JSON.parse(response.content);
        
        // Validate the response
        if (!result.domains || !Array.isArray(result.domains) || 
            !result.confidences || !Array.isArray(result.confidences)) {
          throw new Error('Invalid response format');
        }

        // Ensure domains are from the valid list
        const validDomains = result.domains.filter((domain: string) => 
          domainLabels.includes(domain)
        );

        // If no valid domains, use fallback
        if (validDomains.length === 0) {
          const fallbackResult = {
            domains: ['Other'],
            domain_confidences: [1.0],
            domain_origin: 'llm' as const
          };
          await this.cacheDomainClassification(title, summary, source, fallbackResult);
          return fallbackResult;
        }

        // Normalize confidences to sum to 1.0
        const totalConfidence = result.confidences.reduce((sum: number, conf: number) => sum + conf, 0);
        const normalizedConfidences = result.confidences.map((conf: number) => 
          totalConfidence > 0 ? conf / totalConfidence : 1.0 / result.confidences.length
        );

        const classificationResult = {
          domains: validDomains,
          domain_confidences: normalizedConfidences,
          domain_origin: 'llm' as const
        };

        // Cache the result
        await this.cacheDomainClassification(title, summary, source, classificationResult);

        return classificationResult;

      } catch (parseError) {
        console.warn('Failed to parse LLM domain classification response:', parseError);
        console.log('Raw response:', response.content);
        
        // Try to extract JSON from response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const result = JSON.parse(jsonMatch[0]);
            if (result.domains && Array.isArray(result.domains)) {
              const validDomains = result.domains.filter((domain: string) => 
                domainLabels.includes(domain)
              );
              
              if (validDomains.length > 0) {
                const classificationResult = {
                  domains: validDomains,
                  domain_confidences: result.confidences || [1.0],
                  domain_origin: 'llm' as const
                };
                await this.cacheDomainClassification(title, summary, source, classificationResult);
                return classificationResult;
              }
            }
          } catch (extractError) {
            console.warn('Failed to extract JSON from response:', extractError);
          }
        }
        
        // Fallback to "Other"
        const fallbackResult = {
          domains: ['Other'],
          domain_confidences: [1.0],
          domain_origin: 'llm' as const
        };
        await this.cacheDomainClassification(title, summary, source, fallbackResult);
        return fallbackResult;
      }

    } catch (error) {
      console.error('Domain classification failed:', error);
      const fallbackResult = {
        domains: ['Other'],
        domain_confidences: [1.0],
        domain_origin: 'llm' as const
      };
      await this.cacheDomainClassification(title, summary, source, fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * Get cached domain classification
   */
  static async getCachedDomainClassification(
    title: string,
    summary: string,
    source: string
  ): Promise<{
    domains: string[];
    domain_confidences: number[];
    domain_origin: 'llm' | 'admin' | 'mixed';
  } | null> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_domain_classification', {
        title_text: title,
        summary_text: summary,
        source_id_text: source
      });

      if (error || !data || data.length === 0) {
        return null;
      }

      const record = data[0];
      return {
        domains: record.domains,
        domain_confidences: record.domain_confidences,
        domain_origin: record.domain_origin
      };
    } catch (error) {
      console.error('Failed to get cached domain classification:', error);
      return null;
    }
  }

  /**
   * Cache domain classification result
   */
  static async cacheDomainClassification(
    title: string,
    summary: string,
    source: string,
    classification: {
      domains: string[];
      domain_confidences: number[];
      domain_origin: 'llm' | 'admin' | 'mixed';
    }
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_domain_classification', {
        title_text: title,
        summary_text: summary,
        source_id_text: source,
        default_domains: classification.domains,
        default_confidences: classification.domain_confidences,
        default_origin: classification.domain_origin
      });

      if (error) {
        console.error('Failed to cache domain classification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error caching domain classification:', error);
      return false;
    }
  }

  /**
   * Sanitize and normalize unknown/malformed data
   */
  static sanitizeUnknownData(input: any): any {
    if (input === null || input === undefined) {
      return {};
    }

    if (typeof input !== 'object') {
      return {};
    }

    const sanitized: any = {};

    // Sanitize string fields
    const stringFields = ['id', 'source', 'title', 'summary', 'link', 'filename', 'category', 'model', 'provider'];
    for (const field of stringFields) {
      if (input[field] !== undefined && input[field] !== null) {
        const value = String(input[field]).trim();
        if (value.length > 0) {
          sanitized[field] = value;
        }
      }
    }

    // Sanitize array fields
    const arrayFields = ['integrations', 'capabilities', 'tags', 'requirements', 'useCases'];
    for (const field of arrayFields) {
      if (input[field] !== undefined && input[field] !== null) {
        if (Array.isArray(input[field])) {
          const sanitizedArray = input[field]
            .map(item => String(item).trim())
            .filter(item => item.length > 0);
          if (sanitizedArray.length > 0) {
            sanitized[field] = sanitizedArray;
          }
        }
      }
    }

    // Sanitize boolean fields
    const booleanFields = ['active', 'authorVerified'];
    for (const field of booleanFields) {
      if (input[field] !== undefined && input[field] !== null) {
        sanitized[field] = Boolean(input[field]);
      }
    }

    // Sanitize number fields
    const numberFields = ['nodeCount', 'likes', 'downloads', 'automationPotential'];
    for (const field of numberFields) {
      if (input[field] !== undefined && input[field] !== null) {
        const num = Number(input[field]);
        if (!isNaN(num) && isFinite(num)) {
          sanitized[field] = num;
        }
      }
    }

    // Sanitize enum fields with validation
    if (input.complexity) {
      const complexity = this.normalizeComplexity(String(input.complexity));
      sanitized.complexity = complexity;
    }

    if (input.triggerType) {
      const triggerType = this.normalizeTriggerType(String(input.triggerType));
      sanitized.triggerType = triggerType;
    }

    if (input.difficulty) {
      const difficulty = this.normalizeDifficulty(String(input.difficulty));
      sanitized.difficulty = difficulty;
    }

    if (input.setupTime) {
      const setupTime = this.normalizeSetupTime(String(input.setupTime));
      sanitized.setupTime = setupTime;
    }

    if (input.deployment) {
      const deployment = this.normalizeDeployment(String(input.deployment));
      sanitized.deployment = deployment;
    }

    if (input.pricing) {
      const pricing = this.normalizePricing(String(input.pricing));
      sanitized.pricing = pricing;
    }

    if (input.license) {
      const license = this.normalizeLicense(String(input.license));
      sanitized.license = license;
    }

    // Sanitize date fields
    const dateFields = ['analyzedAt', 'lastModified'];
    for (const field of dateFields) {
      if (input[field] !== undefined && input[field] !== null) {
        const date = new Date(input[field]);
        if (!isNaN(date.getTime())) {
          sanitized[field] = date.toISOString();
        }
      }
    }

    // Sanitize URL fields
    const urlFields = ['link', 'authorAvatar', 'githubUrl', 'demoUrl', 'documentationUrl'];
    for (const field of urlFields) {
      if (input[field] !== undefined && input[field] !== null) {
        const url = String(input[field]).trim();
        if (url.length > 0 && (url.startsWith('http') || url.startsWith('#'))) {
          sanitized[field] = url;
        }
      }
    }

    // Sanitize email fields
    if (input.authorEmail) {
      const email = String(input.authorEmail).trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        sanitized.authorEmail = email;
      }
    }

    return sanitized;
  }

  /**
   * Validate and fix common data issues
   */
  static validateAndFixData(input: any): any {
    const sanitized = this.sanitizeUnknownData(input);

    // Fix common issues
    if (sanitized.id && typeof sanitized.id === 'string') {
      // Ensure ID is not empty and doesn't contain invalid characters
      sanitized.id = sanitized.id.replace(/[^a-zA-Z0-9\-_]/g, '-');
      if (sanitized.id.length === 0) {
        sanitized.id = `unknown-${Date.now()}`;
      }
    }

    if (sanitized.title && typeof sanitized.title === 'string') {
      // Clean up title
      sanitized.title = sanitized.title.replace(/\s+/g, ' ').trim();
      if (sanitized.title.length === 0) {
        sanitized.title = 'Untitled';
      }
    }

    if (sanitized.summary && typeof sanitized.summary === 'string') {
      // Clean up summary
      sanitized.summary = sanitized.summary.replace(/\s+/g, ' ').trim();
      if (sanitized.summary.length === 0) {
        sanitized.summary = 'No description available';
      }
    }

    // Ensure arrays are properly formatted
    const arrayFields = ['integrations', 'capabilities', 'tags', 'requirements', 'useCases'];
    for (const field of arrayFields) {
      if (sanitized[field] && Array.isArray(sanitized[field])) {
        sanitized[field] = sanitized[field]
          .map(item => String(item).trim())
          .filter(item => item.length > 0)
          .filter((item, index, arr) => arr.indexOf(item) === index); // Remove duplicates
      }
    }

    return sanitized;
  }

  /**
   * Normalize agent capabilities during ingestion (SchemaValidator method)
   */
  static async normalizeAgentCapabilities(
    rawCapabilities: string[],
    title: string,
    summary: string,
    source: string
  ): Promise<string[]> {
    return WorkflowIndexer.normalizeAgentCapabilities(rawCapabilities, title, summary, source);
  }
}

export interface WorkflowStats {
  total: number;
  active: number;
  inactive: number;
  triggers: {
    Complex: number;
    Webhook: number;
    Manual: number;
    Scheduled: number;
  };
  totalNodes: number;
  uniqueIntegrations: number;
}

export interface WorkflowSearchParams {
  q?: string;
  trigger?: string;
  complexity?: string;
  category?: string;
  active?: boolean;
  source?: string;
  integrations?: string[];
  limit?: number;
  offset?: number;
}

export interface SourceQualityMetrics {
  completeness: number; // 0-100: How complete the data is
  accuracy: number; // 0-100: How accurate the data is
  freshness: number; // 0-100: How fresh the data is
  consistency: number; // 0-100: How consistent the data structure is
  relevance: number; // 0-100: How relevant the data is to user queries
  overall: number; // 0-100: Overall quality score
}

export interface SourcePerformanceMetrics {
  responseTime: number; // Average response time in ms
  successRate: number; // 0-100: Success rate percentage
  errorRate: number; // 0-100: Error rate percentage
  uptime: number; // 0-100: Uptime percentage
  lastChecked: Date;
  totalRequests: number;
  failedRequests: number;
}

export interface SourceHealthStatus {
  source: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked: string;
  responseTime: number;
  successRate: number;
  errorCount: number;
  lastError?: string;
  uptime: number; // Percentage uptime over last 24h
  healthScore: number; // 0-100 overall health score
}

export interface HealthCheckResult {
  source: string;
  isHealthy: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: string;
  dataReceived?: boolean;
  dataSize?: number;
}

export interface ErrorClassification {
  type: 'network' | 'authentication' | 'rate_limit' | 'server_error' | 'timeout' | 'data_quality' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedAction: string;
  retryable: boolean;
  estimatedRecoveryTime?: number; // in minutes
}

export interface SourceError {
  id: string;
  source: string;
  timestamp: string;
  error: string;
  classification: ErrorClassification;
  context?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
}

export interface SourceAlert {
  id: string;
  source: string;
  type: 'response_time' | 'error_rate' | 'health_degradation' | 'source_down';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: string;
  threshold?: number;
  currentValue?: number;
}

export interface AlertThresholds {
  responseTime: {
    warning: number; // ms
    critical: number; // ms
  };
  errorRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
  healthScore: {
    warning: number; // 0-100
    critical: number; // 0-100
  };
}

export interface NotificationConfig {
  enabled: boolean;
  channels: ('console' | 'browser' | 'api')[];
  severityFilter: ('low' | 'medium' | 'high' | 'critical')[];
  cooldownMinutes: number; // Prevent spam notifications
  maxNotificationsPerHour: number;
}

export interface Notification {
  id: string;
  source: string;
  alertId: string;
  type: 'alert_created' | 'alert_resolved' | 'health_degraded' | 'source_recovered';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  sent: boolean;
  sentAt?: string;
  channel: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  source: string;
  version: string;
  compressed?: boolean;
}

export interface CacheConfig {
  defaultTTL: number; // milliseconds
  maxSize: number; // max entries per cache
  compressionEnabled: boolean;
  dynamicTTL: boolean;
  accessBasedTTL: boolean;
  sourceSpecificTTL: Record<string, number>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  averageAccessTime: number;
  compressionRatio: number;
  evictions: number;
  entryCount: number;
  totalEntries: number;
  totalSize: number;
  lastUpdated: string | null;
}

export interface IncrementalUpdateConfig {
  enabled: boolean;
  batchSize: number;
  updateInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  deltaDetection: boolean;
  changeThreshold: number; // percentage of changes to trigger full update
}

export interface UpdateDelta {
  added: any[];
  modified: any[];
  removed: any[];
  unchanged: any[];
  totalChanges: number;
  changePercentage: number;
}

export class WorkflowIndexer {
  private baseUrl = 'https://api.github.com/repos/Zie619/n8n-workflows';
  private workflows: WorkflowIndex[] = [];
  private agents: AgentIndex[] = [];
  private stats: WorkflowStats | null = null;
  private githubConfig = getGitHubConfig();
  private lastFetchTime: number | null = null;
  private currentSourceKey: string | undefined = undefined;
  private sourceQualityCache = new Map<string, SourceQualityMetrics>();
  private sourcePerformanceCache = new Map<string, SourcePerformanceMetrics>();
  private sourceHealthCache = new Map<string, SourceHealthStatus>();
  private healthCheckHistory = new Map<string, HealthCheckResult[]>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private sourceErrors = new Map<string, SourceError[]>();
  private errorPatterns = new Map<string, RegExp>();
  private sourceAlerts = new Map<string, SourceAlert[]>();
  private alertThresholds: AlertThresholds = {
    responseTime: { warning: 2000, critical: 5000 },
    errorRate: { warning: 10, critical: 25 },
    healthScore: { warning: 70, critical: 50 }
  };
  private notificationConfig: NotificationConfig = {
    enabled: true,
    channels: ['console', 'browser'],
    severityFilter: ['medium', 'high', 'critical'],
    cooldownMinutes: 5,
    maxNotificationsPerHour: 20
  };
  private notifications = new Map<string, Notification[]>();
  private notificationHistory = new Map<string, Date[]>();
  private recoveryAttempts = new Map<string, { count: number; lastAttempt: Date; nextAttempt?: Date }>();
  private recoveryConfig = {
    maxAttempts: 3,
    retryDelayMinutes: 5,
    exponentialBackoff: true,
    autoRecoveryEnabled: true
  };
  private smartCache = new Map<string, CacheEntry<any>>();
  private cacheConfig: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    compressionEnabled: true,
    dynamicTTL: true,
    accessBasedTTL: true,
    sourceSpecificTTL: {
      'github': 10 * 60 * 1000, // 10 minutes
      'n8n.io': 15 * 60 * 1000, // 15 minutes
      'ai-enhanced': 20 * 60 * 1000 // 20 minutes
    }
  };
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
    averageAccessTime: 0,
    compressionRatio: 0,
    evictions: 0,
    entryCount: 0,
    totalEntries: 0,
    totalSize: 0,
    lastUpdated: null
  };
  private cacheCleanupInterval: NodeJS.Timeout | null = null;
  private incrementalUpdateConfig: IncrementalUpdateConfig = {
    enabled: true,
    batchSize: 50,
    updateInterval: 2 * 60 * 1000, // 2 minutes
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    deltaDetection: true,
    changeThreshold: 20 // 20% change threshold
  };
  private incrementalUpdateInterval: NodeJS.Timeout | null = null;
  private lastUpdateTimestamps = new Map<string, number>();
  private updateInProgress = new Set<string>();
  private cacheVersion = '1.0.0';
  private schemaVersions = new Map<string, string>();
  private textEncoder: TextEncoder | null =
    typeof globalThis !== 'undefined' && typeof (globalThis as any).TextEncoder !== 'undefined'
      ? new (globalThis as any).TextEncoder()
      : null;

  constructor() {
    this.initializeStats();
    // Load from server-side cache asynchronously (server-only)
    if (typeof window === 'undefined') {
    this.loadFromServerCache();
    } else {
      console.warn('Skipping initial server cache load in browser');
    }
    // Start cache cleanup process
    this.startCacheCleanup();
    // Start incremental updates
    this.startIncrementalUpdates();
  }

  // Helper methods for unified solution handling
  getAllSolutions(): SolutionIndex[] {
    return [...this.workflows, ...this.agents];
  }

  getSolutionsByType(type: 'workflow' | 'agent'): SolutionIndex[] {
    if (type === 'workflow') {
      return this.workflows;
    } else {
      return this.agents;
    }
  }

  // Add agent to the index
  async addAgent(agent: Partial<AgentIndex>): Promise<void> {
    const normalizedAgent = await this.ensureMandatoryFields(agent) as AgentIndex;
    if (isAgentIndex(normalizedAgent)) {
      this.agents.push(normalizedAgent);
    }
  }

  // Add workflow to the index
  async addWorkflow(workflow: Partial<WorkflowIndex>): Promise<void> {
    const normalizedWorkflow = await this.ensureMandatoryFields(workflow) as WorkflowIndex;
    if (isWorkflowIndex(normalizedWorkflow)) {
      this.workflows.push(normalizedWorkflow);
    }
  }

  // Ensure mandatory fields are present with fallbacks using SchemaValidator
  private async ensureMandatoryFields(solution: Partial<SolutionIndex>): Promise<SolutionIndex> {
    // First sanitize and normalize the input data
    const sanitizedSolution = SchemaValidator.validateAndFixData(solution);

    // Extract license if not already provided
    const extractedLicense = sanitizedSolution.license || await this.extractLicense(sanitizedSolution.source || 'unknown', sanitizedSolution);

    // Add extracted license to solution
    const solutionWithLicense = {
      ...sanitizedSolution,
      license: extractedLicense
    };

    // Determine solution type based on source or explicit type indicators
    const isWorkflow = sanitizedSolution.source?.includes('github') || 
                      sanitizedSolution.source?.includes('n8n.io') || 
                      sanitizedSolution.source?.includes('awesome-n8n') ||
                      'integrations' in sanitizedSolution ||
                      'complexity' in sanitizedSolution;
    
    const isAgent = sanitizedSolution.source?.includes('crewai') || 
                   sanitizedSolution.source?.includes('hf-spaces') ||
                   'model' in sanitizedSolution ||
                   'provider' in sanitizedSolution ||
                   'capabilities' in sanitizedSolution;

    if (isWorkflow) {
      // Ensure workflow has required fields with fallbacks
      const workflowData = {
        id: sanitizedSolution.id || `workflow-${Date.now()}`,
        source: sanitizedSolution.source || 'unknown',
        title: sanitizedSolution.title || 'Untitled Workflow',
        summary: sanitizedSolution.summary || 'No description available',
        link: sanitizedSolution.link || '#',
        category: (sanitizedSolution as Partial<WorkflowIndex>).category || 'General',
        integrations: (sanitizedSolution as Partial<WorkflowIndex>).integrations || [],
        complexity: (sanitizedSolution as Partial<WorkflowIndex>).complexity || 'Medium',
        license: extractedLicense,
        ...solutionWithLicense
      };

      const validated = SchemaValidator.validateWorkflowIndex(workflowData);
      if (validated) {
        return validated;
      } else {
        console.warn('Schema validation failed for workflow, using fallback');
        return workflowData as WorkflowIndex;
      }
    } else if (isAgent) {
      // Normalize capabilities for agents
      let normalizedCapabilities = (sanitizedSolution as Partial<AgentIndex>).capabilities || [];
      if (Array.isArray(normalizedCapabilities) && normalizedCapabilities.length > 0) {
        normalizedCapabilities = await SchemaValidator.normalizeAgentCapabilities(
          normalizedCapabilities,
          sanitizedSolution.title || '',
          sanitizedSolution.summary || '',
          sanitizedSolution.source || ''
        );
      } else {
        // If no capabilities provided, use heuristics to infer from title/summary/source
        normalizedCapabilities = await SchemaValidator.normalizeAgentCapabilities(
          [],
          sanitizedSolution.title || '',
          sanitizedSolution.summary || '',
          sanitizedSolution.source || ''
        );
      }

      // Ensure agent has required fields with fallbacks
      const agentData = {
        id: sanitizedSolution.id || `agent-${Date.now()}`,
        source: sanitizedSolution.source || 'unknown',
        title: sanitizedSolution.title || 'Untitled Agent',
        summary: sanitizedSolution.summary || 'No description available',
        link: sanitizedSolution.link || '#',
        model: (sanitizedSolution as Partial<AgentIndex>).model || 'Unknown',
        provider: (sanitizedSolution as Partial<AgentIndex>).provider || 'Unknown',
        capabilities: normalizedCapabilities,
        license: extractedLicense,
        ...solutionWithLicense
      };

      const validated = SchemaValidator.validateAgentIndex(agentData);
      if (validated) {
        return validated;
      } else {
        console.warn('Schema validation failed for agent, using fallback');
        return agentData as AgentIndex;
      }
    }

    // Default to workflow if type cannot be determined
    console.warn(`Could not determine solution type for ${sanitizedSolution.id}, defaulting to workflow`);
    const workflowData = {
      id: sanitizedSolution.id || `workflow-${Date.now()}`,
      source: sanitizedSolution.source || 'unknown',
      title: sanitizedSolution.title || 'Untitled Workflow',
      summary: sanitizedSolution.summary || 'No description available',
      link: sanitizedSolution.link || '#',
      category: 'General',
      integrations: [],
      complexity: 'Medium' as const,
      license: extractedLicense,
      ...solutionWithLicense
    };

    const validated = SchemaValidator.validateWorkflowIndex(workflowData);
    return validated || (workflowData as WorkflowIndex);
  }

  /**
   * Normalize various display/source names into stable cache keys
   */
  private normalizeSourceKey(source?: string): string | undefined {
    if (!source) return undefined;
    const s = source.toLowerCase();
    if (s.includes('n8n.io') || s.includes('official')) return 'n8n.io';
    if (s.includes('github') || s.includes('community') || s.includes('n8n community')) return 'github';
    if (s.includes('ai-enhanced') || s.includes('free templates')) return 'ai-enhanced';
    if (s.includes('awesome-n8n-templates') || s.includes('awesome n8n')) return 'awesome-n8n-templates';
    return s.replace(/\s+/g, '-');
  }

  /**
   * Initialize workflow statistics based on repository documentation
   */
  private initializeStats(): void {
    this.stats = {
      total: 0,
      active: 0,
      inactive: 0,
      triggers: {
        Complex: 0,
        Webhook: 0,
        Manual: 0,
        Scheduled: 0
      },
      totalNodes: 0,
      uniqueIntegrations: 0
    };
  }

  /**
   * Generate mock workflows with realistic numbers
   */
  private generateMockWorkflows(): WorkflowIndex[] {
    const workflows: WorkflowIndex[] = [];
    const categories = ['messaging', 'ai_ml', 'database', 'email', 'cloud_storage', 'project_management', 'social_media', 'ecommerce', 'analytics', 'calendar_tasks'];
    const triggerTypes = ['Webhook', 'Scheduled', 'Manual', 'Complex'];
    const complexities = ['Low', 'Medium', 'High'];
    const integrations = ['Telegram', 'Discord', 'Slack', 'OpenAI', 'MySQL', 'PostgreSQL', 'Mailchimp', 'Google Drive', 'Dropbox', 'Trello', 'Asana', 'Jira', 'Twitter', 'LinkedIn', 'Facebook', 'Shopify', 'Google Analytics', 'Google Calendar', 'Todoist'];

    // Generate 2053 workflows to match the expected total
    for (let i = 1; i <= 2053; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const triggerType = triggerTypes[Math.floor(Math.random() * triggerTypes.length)];
      const complexity = complexities[Math.floor(Math.random() * complexities.length)];
      const nodeCount = Math.floor(Math.random() * 20) + 3; // 3-22 nodes
      const numIntegrations = Math.floor(Math.random() * 5) + 1; // 1-5 integrations
      const selectedIntegrations = integrations.sort(() => 0.5 - Math.random()).slice(0, numIntegrations);
      const active = Math.random() > 0.1; // 90% active rate

      workflows.push({
        // Mandatory core fields
        id: `workflow-${i}`,
        source: 'github',
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} ${triggerType} ${complexity}`,
        summary: `Automated ${category} workflow with ${triggerType.toLowerCase()} trigger and ${complexity.toLowerCase()} complexity`,
        link: `https://github.com/Zie619/n8n-workflows/blob/main/workflows/${String(i).padStart(4, '0')}_${category}_${triggerType}_${complexity}.json`,
        
        // Workflow-specific mandatory fields
        category,
        integrations: selectedIntegrations,
        complexity: complexity as any,
        
        // Optional fields
        filename: `${String(i).padStart(4, '0')}_${category}_${triggerType}_${complexity}.json`,
        active,
        triggerType: triggerType as any,
        nodeCount,
        tags: [category, triggerType.toLowerCase(), complexity.toLowerCase(), ...selectedIntegrations.slice(0, 2)],
        fileHash: Math.random().toString(36).substring(2, 8),
        analyzedAt: new Date().toISOString(),
        license: 'MIT'
      });
    }

    return workflows;
  }

  /**
   * Generate AI-enhanced mock workflows
   */
  private generateAIEnhancedMockWorkflows(): WorkflowIndex[] {
    const workflows: WorkflowIndex[] = [];
    const aiIntegrations = ['OpenAI', 'ChatGPT', 'Claude', 'Gemini', 'Anthropic', 'Azure AI', 'Google AI', 'AWS Bedrock'];
    const aiCategories = ['ai_ml', 'content_generation', 'data_analysis', 'automation', 'chatbot', 'nlp', 'image_processing'];
    const triggerTypes = ['Webhook', 'Scheduled', 'Manual'];
    const complexities = ['Low', 'Medium', 'High'];

    // Generate 150 AI-enhanced workflows
    for (let i = 1; i <= 150; i++) {
      const category = aiCategories[Math.floor(Math.random() * aiCategories.length)];
      const triggerType = triggerTypes[Math.floor(Math.random() * triggerTypes.length)];
      const complexity = complexities[Math.floor(Math.random() * complexities.length)];
      const nodeCount = Math.floor(Math.random() * 15) + 5; // 5-19 nodes
      const numIntegrations = Math.floor(Math.random() * 3) + 2; // 2-4 integrations
      const selectedIntegrations = aiIntegrations.sort(() => 0.5 - Math.random()).slice(0, numIntegrations);
      const active = Math.random() > 0.05; // 95% active rate

      workflows.push({
        // Mandatory core fields
        id: `ai-workflow-${i}`,
        source: 'ai-enhanced',
        title: `AI-Enhanced ${category.charAt(0).toUpperCase() + category.slice(1)} ${triggerType}`,
        summary: `AI-powered ${category} workflow with ${triggerType.toLowerCase()} trigger and ${complexity.toLowerCase()} complexity`,
        link: `https://github.com/ai-enhanced/workflows/blob/main/ai_${String(i).padStart(3, '0')}_${category}_${triggerType}.json`,
        
        // Workflow-specific mandatory fields
        category,
        integrations: selectedIntegrations,
        complexity: complexity as any,
        
        // Optional fields
        filename: `ai_${String(i).padStart(3, '0')}_${category}_${triggerType}.json`,
        active,
        triggerType: triggerType as any,
        nodeCount,
        tags: ['ai-enhanced', category, triggerType.toLowerCase(), complexity.toLowerCase(), ...selectedIntegrations.slice(0, 2)],
        fileHash: Math.random().toString(36).substring(2, 8),
        analyzedAt: new Date().toISOString(),
        license: 'MIT'
      });
    }

    return workflows;
  }

  /**
   * Generate mock agents for testing
   */
  private generateMockAgents(): AgentIndex[] {
    const agents: AgentIndex[] = [];
    const models = ['GPT-4', 'Claude-3', 'Gemini-Pro', 'Llama-2', 'Mistral-7B'];
    const providers = ['OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral AI'];
    const capabilities = ['web_search', 'data_analysis', 'file_io', 'email_send', 'api_integration', 'text_generation', 'image_processing', 'code_generation'];
    const categories = ['HR & Recruitment', 'Finance & Accounting', 'Marketing & Sales', 'Customer Support', 'Data Analysis', 'Content Creation'];

    // Generate 100 mock agents
    for (let i = 1; i <= 100; i++) {
      const model = models[Math.floor(Math.random() * models.length)];
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const numCapabilities = Math.floor(Math.random() * 4) + 2; // 2-5 capabilities
      const selectedCapabilities = capabilities.sort(() => 0.5 - Math.random()).slice(0, numCapabilities);
      const difficulty = ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)] as any;
      const setupTime = ['Quick', 'Medium', 'Long'][Math.floor(Math.random() * 3)] as any;

      agents.push({
        // Mandatory core fields
        id: `agent-${i}`,
        source: i % 2 === 0 ? 'crewai' : 'hf-spaces',
        title: `${category} AI Agent ${i}`,
        summary: `AI agent specialized in ${category.toLowerCase()} tasks with ${model} model`,
        link: i % 2 === 0 
          ? `https://github.com/crewai/crewai-examples/tree/main/agents/${category.toLowerCase().replace(/\s+/g, '-')}-agent`
          : `https://huggingface.co/spaces/agent-${i}`,
        
        // Agent-specific mandatory fields
        model,
        provider,
        capabilities: selectedCapabilities,
        
        // Optional fields
        category,
        tags: [category.toLowerCase(), model.toLowerCase(), ...selectedCapabilities],
        difficulty,
        setupTime,
        deployment: 'Cloud',
        license: 'MIT',
        pricing: ['Free', 'Freemium', 'Paid'][Math.floor(Math.random() * 3)] as any,
        requirements: [`${model} API key`, 'Python 3.8+'],
        useCases: [`${category} automation`, 'Data processing', 'Content generation'],
        automationPotential: Math.floor(Math.random() * 40) + 60, // 60-100%
        
        // Author metadata
        authorName: `Agent Creator ${i}`,
        authorUsername: `creator${i}`,
        authorEmail: `creator${i}@example.com`,
        
        // Source-specific metadata
        likes: Math.floor(Math.random() * 100),
        downloads: Math.floor(Math.random() * 1000),
        lastModified: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        githubUrl: i % 2 === 0 ? `https://github.com/crewai/crewai-examples/tree/main/agents/${category.toLowerCase().replace(/\s+/g, '-')}-agent` : undefined,
        demoUrl: `https://demo.agent-${i}.com`,
        documentationUrl: `https://docs.agent-${i}.com`
      });
    }

    return agents;
  }

  /**
   * Update statistics based on loaded workflows
   */
  private updateStatsFromWorkflows(workflows: WorkflowIndex[] | undefined | null): void {
    if (!Array.isArray(workflows) || workflows.length === 0) {
      this.stats = {
        total: 0,
        active: 0,
        inactive: 0,
        uniqueIntegrations: 0,
        totalNodes: 0,
        triggers: { Complex: 0, Webhook: 0, Manual: 0, Scheduled: 0 }
      } as any;
      return;
    }

    const uniqueIntegrations = new Set<string>();
    let totalNodes = 0;
    let active = 0;
    let inactive = 0;
    const triggers = {
      Complex: 0,
      Webhook: 0,
      Manual: 0,
      Scheduled: 0
    };

    workflows.forEach(workflow => {
      // Count active/inactive
      if (workflow.active) {
        active++;
      } else {
        inactive++;
      }

      // Count triggers
      if (workflow.triggerType in triggers) {
        triggers[workflow.triggerType as keyof typeof triggers]++;
      }

      // Count nodes
      totalNodes += workflow.nodeCount;

      // Collect unique integrations
      workflow.integrations.forEach(integration => {
        uniqueIntegrations.add(integration);
      });
    });

    this.stats = {
      total: workflows.length,
      active,
      inactive,
      triggers,
      totalNodes,
      uniqueIntegrations: uniqueIntegrations.size
    };
  }

  /**
   * Get workflow statistics for specific source
   */
  async getStats(source?: string): Promise<WorkflowStats> {
    if (source) {
      try {
        const normalized = this.normalizeSourceKey(source);
        // In browser, compute from in-memory list to avoid network
        if (typeof window !== 'undefined') {
          if (!this.workflows || this.workflows.length === 0) {
            return this.getEmptyStats();
          }
          let filtered = this.workflows.slice();
          if (normalized) {
            const s = source.toLowerCase();
            filtered = filtered.filter(w => {
              if (s.includes('n8n.io') || s.includes('official')) return w.filename.startsWith('n8n-');
              if (s.includes('github') || s.includes('community')) return !w.filename.startsWith('n8n-');
              if (s.includes('ai-enhanced') || s.includes('free templates')) {
                return w.category === 'ai_ml' || (w.integrations || []).some(i => i.toLowerCase().includes('ai') || i.toLowerCase().includes('openai') || i.toLowerCase().includes('llm'));
              }
              const lower = s;
              return w.filename?.includes(lower) || w.title.toLowerCase().includes(lower);
            });
          }
          return this.calculateStatsFromWorkflows(filtered);
        }

        const { data, error } = await (supabase as any)
          .from('workflow_cache')
          .select('workflows')
          .eq('source', normalized as string)
          .eq('version', this.cacheVersion)
          .maybeSingle();

        if (error) {
          console.warn(`Database error for source ${normalized || source}:`, error.message);
          return this.getEmptyStats();
        }

        if (!data) {
          console.log(`No cache found for source: ${normalized || source}`);
          return this.getEmptyStats();
        }

        const workflows = (data as any).workflows || [];
        return this.calculateStatsFromWorkflows(workflows);
      } catch (error) {
        console.error('Error getting stats for source:', error);
        return this.getEmptyStats();
      }
    }

    if (!this.stats) {
      this.initializeStats();
    }
    return this.stats!;
  }

  /**
   * Get empty stats
   */
  private getEmptyStats(): WorkflowStats {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      triggers: { Complex: 0, Webhook: 0, Manual: 0, Scheduled: 0 },
      totalNodes: 0,
      uniqueIntegrations: 0
    } as WorkflowStats;
  }

  /**
   * Calculate stats from workflows array
   */
  private calculateStatsFromWorkflows(workflows: WorkflowIndex[]): WorkflowStats {
    const total = workflows.length;
    const active = workflows.filter(w => w.active).length;
    const inactive = total - active;
    const totalNodes = workflows.reduce((sum, w) => sum + (w.nodeCount || 0), 0);
    const uniqueIntegrations = new Set<string>();
    const triggers = { Complex: 0, Webhook: 0, Manual: 0, Scheduled: 0 } as any;
    workflows.forEach(workflow => {
      (workflow.integrations || []).forEach((integration: string) => {
        uniqueIntegrations.add(integration);
      });
      if (workflow.triggerType && triggers[workflow.triggerType] !== undefined) triggers[workflow.triggerType]++;
    });
    return { total, active, inactive, triggers, totalNodes, uniqueIntegrations: uniqueIntegrations.size } as WorkflowStats;
  }

  /**
   * Get last fetch time
   */
  getLastFetchTime(): Date | null {
    return this.lastFetchTime ? new Date(this.lastFetchTime) : null;
  }

  /**
   * Manually trigger workflow fetch from GitHub
   */
  async forceRefreshWorkflows(source?: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      this.workflows = [];
      this.lastFetchTime = null;

      const normalized = this.normalizeSourceKey(source);
      if (!normalized || normalized === 'all') {
        // Refresh all sources and save aggregated 'all'
        const [gh, n8n, ai] = await Promise.all([
          this.loadRealWorkflows({ source: 'github' }),
          this.loadRealWorkflows({ source: 'n8n.io' }),
          this.loadRealWorkflows({ source: 'ai-enhanced' })
        ]);
        const merged: WorkflowIndex[] = [];
        const seen = new Set<string>();
        [gh, n8n, ai].forEach(arr => {
          (arr || []).forEach(w => {
            const key = String(w.id || w.filename || w.title);
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(w);
          });
        });
        if (merged.length > 0) {
          this.updateStatsFromWorkflows(merged);
          await this.saveToServerCache(merged, 'all');
          return { success: true, count: merged.length };
        }
        return { success: false, count: 0, error: 'No workflows loaded' };
      }

      // Single-source refresh
      const workflows = await this.loadRealWorkflows({ source });
      if (workflows.length > 0) {
        this.updateStatsFromWorkflows(workflows);
        await this.saveToServerCache(workflows, source);
        return { success: true, count: workflows.length };
      } else {
        return { success: false, count: 0, error: 'No workflows loaded' };
      }
    } catch (error) {
      console.error('Error during manual refresh:', error);
      return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get cache status for specific source
   */
  async getCacheStatus(source?: string): Promise<{ hasCache: boolean; lastFetch: Date | null; workflowCount: number }> {
    try {
      const isBrowser = typeof window !== 'undefined';
      if (isBrowser) {
        if (!source) {
          return {
            hasCache: this.workflows.length > 0,
            lastFetch: this.getLastFetchTime(),
            workflowCount: this.workflows.length
          };
        }

        const key = this.normalizeSourceKey(source) || 'all';
        const defaults: Record<string, { count: number; last?: string | null }> = {
          'github': { count: 2056, last: '2025-09-15' },
          'n8n.io': { count: 5496, last: '2025-09-15' },
          'ai-enhanced': { count: 0, last: null }
        };
        const def = defaults[key];
        if (def) {
          return {
            hasCache: def.count > 0,
            lastFetch: def.last ? new Date(def.last) : null,
            workflowCount: def.count
          };
        }
        return { hasCache: false, lastFetch: null, workflowCount: 0 };
      }
      if (!source) {
        return {
          hasCache: this.workflows.length > 0,
          lastFetch: this.getLastFetchTime(),
          workflowCount: this.workflows.length
        };
      }

      const normalized = this.normalizeSourceKey(source);
      // Support sharded caches like "n8n.io#1"
      const { data, error } = await (supabase as any)
        .from('workflow_cache')
        .select('source, workflows, last_fetch_time, updated_at')
        .like('source', `${normalized}%`)
        .eq('version', this.cacheVersion);

      if (error) {
        console.warn(`Database error for source ${normalized || source}:`, error.message);
        return { hasCache: false, lastFetch: null, workflowCount: 0 };
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log(`No cache found for source: ${normalized || source}`);
        return { hasCache: false, lastFetch: null, workflowCount: 0 };
      }

      const rows: any[] = Array.isArray(data) ? data : [data];
      const totalCount = rows.reduce((sum, r) => sum + ((r?.workflows || []).length || 0), 0);
      const lastFetchTs = rows.reduce((ts: number | null, r: any) => {
        const t = r?.last_fetch_time ? new Date(r.last_fetch_time).getTime() : null;
        if (!t) return ts; return ts ? Math.max(ts, t) : t;
      }, null);
      const lastFetch = lastFetchTs ? new Date(lastFetchTs) : null;

      return { hasCache: totalCount > 0, lastFetch, workflowCount: totalCount };
    } catch (error) {
      console.error('Error getting cache status:', error);
      return { hasCache: false, lastFetch: null, workflowCount: 0 };
    }
  }

  /**
   * Search workflows with filters
   */
  async searchWorkflows(params: WorkflowSearchParams = {}): Promise<{
    workflows: WorkflowIndex[];
    total: number;
    hasMore: boolean;
  }> {
    const requestedSource = this.normalizeSourceKey(params.source) || this.currentSourceKey || 'all';

    if (params.source) {
      const normalized = this.normalizeSourceKey(params.source) || 'all';
      if (this.currentSourceKey !== normalized) {
        if (typeof window === 'undefined') {
        await this.loadFromServerCache(normalized);
        } else {
          console.warn('Skipping server cache reload in browser');
        }
      }
    }

    if (this.workflows.length === 0) {
      // Always try to load from server cache, even in browser
      try {
      await this.loadFromServerCache(params.source);
      } catch (error) {
        console.warn('Failed to load from server cache:', error);
      }
      
      // If still empty, try union from per-source caches
      const normalized = this.normalizeSourceKey(params.source) || 'all';
      if ((normalized === 'all') && this.workflows.length === 0) {
        try {
        await this.loadAllFromServerCacheUnion();
        } catch (error) {
          console.warn('Failed to load union cache:', error);
        }
      }
    }

    if (this.workflows.length > 0) {
      this.updateStatsFromWorkflows(this.workflows);
      const filteredWorkflows = this.filterWorkflows(this.workflows, params);

      const offset = params.offset || 0;
      const limit = params.limit || 20;
      const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit);

      return { workflows: paginatedWorkflows, total: filteredWorkflows.length, hasMore: offset + limit < filteredWorkflows.length };
    }

    try {
      const realWorkflows = await this.loadRealWorkflows(params);
      if (realWorkflows.length > 0) {
        this.updateStatsFromWorkflows(realWorkflows);

        let filteredWorkflows = realWorkflows;

    if (params.q) {
      const query = params.q.toLowerCase();
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        workflow.title.toLowerCase().includes(query) ||
        workflow.summary.toLowerCase().includes(query) ||
            workflow.integrations.some(integration => integration.toLowerCase().includes(query))
      );
    }

        if (params.trigger && params.trigger !== 'all') {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
            workflow.triggerType.toLowerCase() === params.trigger!.toLowerCase()
      );
    }

        if (params.complexity && params.complexity !== 'all') {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
            workflow.complexity.toLowerCase() === params.complexity.toLowerCase()
      );
    }

        if (params.category && params.category !== 'all') {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
            workflow.category.toLowerCase() === params.category.toLowerCase()
      );
    }

    if (params.active !== undefined) {
          filteredWorkflows = filteredWorkflows.filter(workflow => workflow.active === params.active);
        }

        if (params.source) {
          const sourceLower = params.source.toLowerCase();
          const normalized = this.normalizeSourceKey(params.source);

          if (!normalized || this.currentSourceKey !== normalized) {
            filteredWorkflows = filteredWorkflows.filter(workflow => {
              if (sourceLower.includes('n8n.io') || sourceLower.includes('official')) {
                return workflow.filename.startsWith('n8n-');
              }
              if (sourceLower.includes('github') || sourceLower.includes('community')) {
                return !workflow.filename.startsWith('n8n-');
              }
              if (sourceLower.includes('ai-enhanced') || sourceLower.includes('free templates')) {
                return workflow.category === 'ai_ml' || 
                       workflow.integrations.some(integration => 
                         integration.toLowerCase().includes('openai') ||
                         integration.toLowerCase().includes('ai') ||
                         integration.toLowerCase().includes('llm')
                       );
              }
              return workflow.filename.includes(sourceLower) ||
                     workflow.title.toLowerCase().includes(sourceLower);
            });
          }
        }

        const offset = params.offset || 0;
        const limit = params.limit || 20;
        const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit);

        return { workflows: paginatedWorkflows, total: filteredWorkflows.length, hasMore: offset + limit < filteredWorkflows.length };
      }
    } catch (error) {
      console.error('Failed to load real workflows from GitHub API:', error);
    }

    // Generate fallback mock workflows only if everything else failed
    let mockWorkflows: WorkflowIndex[];
    if (params.source && params.source.toLowerCase().includes('ai-enhanced')) {
      mockWorkflows = this.generateAIEnhancedMockWorkflows();
    } else {
      mockWorkflows = this.generateMockWorkflows();
    }

    let filteredWorkflows = this.filterWorkflows(mockWorkflows, params);
    const offset = params.offset || 0;
    const limit = params.limit || 20;
    const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit);
    return { workflows: paginatedWorkflows, total: filteredWorkflows.length, hasMore: offset + limit < filteredWorkflows.length };
  }

  /**
   * Get workflow by filename
   */
  async getWorkflow(filename: string): Promise<WorkflowIndex | null> {
    const searchResult = await this.searchWorkflows({ limit: 1 });
    return searchResult.workflows.find(w => w.filename === filename) || null;
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    return [
      'messaging',
      'ai_ml',
      'database',
      'email',
      'cloud_storage',
      'project_management',
      'social_media',
      'ecommerce',
      'analytics',
      'calendar_tasks',
      'forms',
      'development'
    ];
  }

  /**
   * Get category display names
   */
  getCategoryDisplayNames(): Record<string, string> {
    return {
      'messaging': 'Communication & Messaging',
      'ai_ml': 'AI & Machine Learning',
      'database': 'Database & Data Processing',
      'email': 'Email & Communication',
      'cloud_storage': 'Cloud Storage & File Management',
      'project_management': 'Project Management',
      'social_media': 'Social Media Management',
      'ecommerce': 'E-commerce & Retail',
      'analytics': 'Analytics & Reporting',
      'calendar_tasks': 'Calendar & Task Management',
      'forms': 'Forms & Data Collection',
      'development': 'Development & APIs'
    };
  }

  /**
   * Get popular integrations
   */
  getPopularIntegrations(): string[] {
    return [
      'Telegram', 'Discord', 'Slack', 'WhatsApp',
      'Google Drive', 'Google Sheets', 'Dropbox',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Airtable',
      'OpenAI', 'Anthropic', 'Hugging Face',
      'HTTP Request', 'Webhook', 'GraphQL'
    ];
  }

  /**
   * Extract license information from various sources
   */
  private async extractLicense(source: string, input: any): Promise<string> {
    // If license is already provided, use it
    if (input?.license && typeof input.license === 'string') {
      return this.normalizeLicenseName(input.license);
    }

    // Try to extract from different sources based on the source type
    switch (source) {
      case 'github':
        return await this.extractLicenseFromGitHub(input);
      case 'n8n.io':
        return this.extractLicenseFromN8n(input);
      case 'crewai':
        return this.extractLicenseFromCrewAI(input);
      case 'hf-spaces':
        return this.extractLicenseFromHuggingFace(input);
      default:
        return 'Unknown';
    }
  }

  /**
   * Extract license from GitHub repository
   */
  private async extractLicenseFromGitHub(input: any): Promise<string> {
    try {
      // Try to get license from GitHub API if we have repository info
      if (input?.repository?.full_name) {
        const repoUrl = `https://api.github.com/repos/${input.repository.full_name}`;
        const response = await fetch(repoUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': this.githubConfig.token ? `Bearer ${this.githubConfig.token}` : ''
          }
        });
        
        if (response.ok) {
          const repoData = await response.json();
          if (repoData.license?.name) {
            return this.normalizeLicenseName(repoData.license.name);
          }
        }
      }

      // Fallback: try to extract from README or package.json content
      if (input?.readme) {
        const licenseFromReadme = this.extractLicenseFromText(input.readme);
        if (licenseFromReadme !== 'Unknown') {
          return licenseFromReadme;
        }
      }

      return 'Unknown';
    } catch (error) {
      console.warn('Failed to extract license from GitHub:', error);
      return 'Unknown';
    }
  }

  /**
   * Extract license from n8n.io workflow
   */
  private extractLicenseFromN8n(input: any): string {
    // n8n.io workflows are typically MIT licensed
    // Check if there's any license information in the workflow metadata
    if (input?.license) {
      return this.normalizeLicenseName(input.license);
    }
    
    // Default for n8n.io workflows
    return 'MIT';
  }

  /**
   * Extract license from CrewAI examples
   */
  private extractLicenseFromCrewAI(input: any): string {
    // CrewAI examples are typically MIT licensed
    if (input?.license) {
      return this.normalizeLicenseName(input.license);
    }
    
    // Check README content if available
    if (input?.readme) {
      const licenseFromReadme = this.extractLicenseFromText(input.readme);
      if (licenseFromReadme !== 'Unknown') {
        return licenseFromReadme;
      }
    }
    
    return 'MIT';
  }

  /**
   * Extract license from HuggingFace Spaces
   */
  private extractLicenseFromHuggingFace(input: any): string {
    // HuggingFace Spaces often have license information
    if (input?.license) {
      return this.normalizeLicenseName(input.license);
    }
    
    // Check cardData for license info
    if (input?.cardData?.license) {
      return this.normalizeLicenseName(input.cardData.license);
    }
    
    // Check README content if available
    if (input?.readme) {
      const licenseFromReadme = this.extractLicenseFromText(input.readme);
      if (licenseFromReadme !== 'Unknown') {
        return licenseFromReadme;
      }
    }
    
    return 'Apache-2.0'; // Common default for HF Spaces
  }

  /**
   * Extract license from text content (README, etc.)
   */
  private extractLicenseFromText(text: string): string {
    if (!text || typeof text !== 'string') {
      return 'Unknown';
    }

    const lowerText = text.toLowerCase();
    
    // Common license patterns
    const licensePatterns = [
      { pattern: /mit license|mit-licensed|license: mit/i, name: 'MIT' },
      { pattern: /apache license|apache-2\.0|apache 2\.0/i, name: 'Apache-2.0' },
      { pattern: /gpl v?3|gpl-3\.0|gpl 3\.0/i, name: 'GPL-3.0' },
      { pattern: /gpl v?2|gpl-2\.0|gpl 2\.0/i, name: 'GPL-2.0' },
      { pattern: /bsd license|bsd-3-clause|bsd 3-clause/i, name: 'BSD-3-Clause' },
      { pattern: /bsd-2-clause|bsd 2-clause/i, name: 'BSD-2-Clause' },
      { pattern: /mozilla public license|mpl-2\.0|mpl 2\.0/i, name: 'MPL-2.0' },
      { pattern: /eclipse public license|epl-1\.0|epl 1\.0/i, name: 'EPL-1.0' },
      { pattern: /creative commons|cc-by|cc by/i, name: 'CC-BY' },
      { pattern: /unlicense|public domain/i, name: 'Unlicense' },
      { pattern: /proprietary|commercial|private/i, name: 'Proprietary' }
    ];

    for (const { pattern, name } of licensePatterns) {
      if (pattern.test(lowerText)) {
        return name;
      }
    }

    return 'Unknown';
  }

  /**
   * Normalize license names to standard format
   */
  private normalizeLicenseName(license: string): string {
    if (!license || typeof license !== 'string') {
      return 'Unknown';
    }

    const normalized = license.trim();
    
    // Common variations
    const licenseMap: Record<string, string> = {
      'mit': 'MIT',
      'apache-2.0': 'Apache-2.0',
      'apache 2.0': 'Apache-2.0',
      'apache license': 'Apache-2.0',
      'gpl-3.0': 'GPL-3.0',
      'gpl 3.0': 'GPL-3.0',
      'gpl v3': 'GPL-3.0',
      'gpl-2.0': 'GPL-2.0',
      'gpl 2.0': 'GPL-2.0',
      'gpl v2': 'GPL-2.0',
      'bsd-3-clause': 'BSD-3-Clause',
      'bsd 3-clause': 'BSD-3-Clause',
      'bsd-2-clause': 'BSD-2-Clause',
      'bsd 2-clause': 'BSD-2-Clause',
      'mpl-2.0': 'MPL-2.0',
      'mpl 2.0': 'MPL-2.0',
      'epl-1.0': 'EPL-1.0',
      'epl 1.0': 'EPL-1.0',
      'cc-by': 'CC-BY',
      'cc by': 'CC-BY',
      'unlicense': 'Unlicense',
      'public domain': 'Unlicense'
    };

    return licenseMap[normalized.toLowerCase()] || normalized;
  }

  /**
   * Normalize any incoming workflow-like object into our WorkflowIndex shape
   */
  private normalizeWorkflowShape(input: any, extractedLicense?: string): WorkflowIndex {
    const id = String(input?.id || `workflow-${Math.floor(Math.random() * 10_000_000)}`);
    const filenameRaw: string = (input?.filename || input?.name || `workflow-${id}`).toString();
    const filename = filenameRaw.endsWith('.json') ? filenameRaw : `${filenameRaw}.json`;
    const rawTitle: string = (input?.title || input?.name || this.generateWorkflowName(filename)).toString();
    const title: string = this.humanizeTitle(rawTitle);
    const active: boolean = typeof input?.active === 'boolean' ? input.active : true;
    // Author fields
    const authorName: string | undefined = input?.authorName || input?.author || input?.user?.name || input?.user?.username;
    const authorUsername: string | undefined = input?.authorUsername || input?.user?.username;
    const toAbsoluteAvatar = (url?: string): string | undefined => {
      if (!url) return undefined;
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      if (url.startsWith('//')) return `https:${url}`;
      if (url.startsWith('/')) return `https://api.n8n.io${url}`;
      return url;
    };
    const avatarCandidates = [
      input?.authorAvatar,
      input?.avatar,
      input?.user?.avatar,
      input?.user?.avatar_url,
      input?.user?.avatarUrl,
      input?.user?.image,
      input?.user?.profile_image,
      input?.owner?.avatar,
      input?.owner?.avatar_url,
      input?.owner?.avatarUrl
    ];
    let authorAvatar: string | undefined = toAbsoluteAvatar(avatarCandidates.filter(Boolean)[0]);

    // If no avatar from source, try building a Gravatar URL when an email is present
    if (!authorAvatar) {
      const emailCandidate: string | undefined = (input?.user?.email || input?.email || authorUsername);
      const mail = (emailCandidate || '').trim().toLowerCase();
      if (mail && mail.includes('@')) {
        // Lightweight MD5 for Gravatar hashing (public domain style implementation)
        const md5 = (str: string): string => {
          function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
            a = (((a + q) | 0) + ((x + t) | 0)) | 0;
            return (((a << s) | (a >>> (32 - s))) + b) | 0;
          }
          function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
          function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
          function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn(b ^ c ^ d, a, b, x, s, t); }
          function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn(c ^ (b | ~d), a, b, x, s, t); }
          function toBlocks(s: string) {
            const n = ((s.length + 8) >>> 6) + 1; const blks = new Array(n * 16).fill(0);
            let i; for (i = 0; i < s.length; i++) blks[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
            blks[i >> 2] |= 0x80 << ((i % 4) * 8); blks[n * 16 - 2] = s.length * 8; return blks;
          }
          function toHex(num: number) { let s = ''; for (let j = 0; j < 4; j++) s += ('0' + (((num >> (j * 8)) & 255).toString(16))).slice(-2); return s; }
          let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
          const x = toBlocks(unescape(encodeURIComponent(str)));
          for (let i = 0; i < x.length; i += 16) {
            const oa = a, ob = b, oc = c, od = d;
            a = ff(a, b, c, d, x[i + 0], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819); b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426); c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = ff(a, b, c, d, x[i + 8], 7, 1770035416); d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290); b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632); c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i + 0], 20, -373897302);
            a = gg(a, b, c, d, x[i + 5], 5, -701558691); d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961); b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784); c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
            a = hh(a, b, c, d, x[i + 5], 4, -378558); d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632); b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i + 0], 11, -358537222); c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = hh(a, b, c, d, x[i + 9], 4, -640364487); d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = ii(a, b, c, d, x[i + 0], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905); b = ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606); c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = ii(a, b, c, d, x[i + 8], 6, 1873313359); d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = (a + oa) | 0; b = (b + ob) | 0; c = (c + oc) | 0; d = (d + od) | 0;
          }
          const rhex = (n: number) => toHex(n);
          return rhex(a) + rhex(b) + rhex(c) + rhex(d);
        };
        const hash = md5(mail);
        authorAvatar = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=64`;
      }
    }
    const authorVerified: boolean | undefined = typeof input?.authorVerified === 'boolean' ? input?.authorVerified : (input?.user?.verified === true);

    // Trigger type
    let triggerType: 'Complex' | 'Webhook' | 'Manual' | 'Scheduled';
    const triggerCandidate = (input?.triggerType || '').toString();
    if (['Complex', 'Webhook', 'Manual', 'Scheduled'].includes(triggerCandidate)) {
      triggerType = triggerCandidate as any;
    } else {
      triggerType = this.determineTriggerType(`${filename} ${name}`);
    }

    // Complexity
    let complexity: 'Low' | 'Medium' | 'High';
    const complexityCandidate = (input?.complexity || '').toString();
    if (['Low', 'Medium', 'High'].includes(complexityCandidate)) {
      complexity = complexityCandidate as any;
        } else {
      complexity = this.determineComplexity(filename);
    }

    // Node count
    const nodeCount: number = Number(input?.nodeCount) || 0;

    // Integrations
    let integrations: string[] = Array.isArray(input?.integrations) ? input.integrations.map((x: any) => String(x)) : [];
    if (integrations.length === 0) {
      integrations = this.extractIntegrations(filename);
    }

    // Description
    const description: string = (input?.description || this.generateDescription(filename)).toString();

    // Category - try input, otherwise infer from integrations or fallback
    let category: string = (input?.category || '').toString();
    if (!category) {
      const firstIntegration = integrations[0] || '';
      category = this.mapCategory(firstIntegration || 'development');
    }

    // Tags
    let tags: string[] = Array.isArray(input?.tags) ? input.tags.map((x: any) => String(x)) : [];
    if (tags.length === 0) {
      tags = this.generateTags(filename);
    }

    const fileHash: string = (input?.fileHash || Math.random().toString(36).slice(2, 10)).toString();
    const analyzedAt: string = (input?.analyzedAt || new Date().toISOString()).toString();

    return {
      // Mandatory core fields
      id,
      source: input?.source || 'github',
      title,
      summary: description,
      link: input?.link || `https://github.com/Zie619/n8n-workflows/blob/main/workflows/${filename}`,
      
      // Workflow-specific mandatory fields
      category,
      integrations,
      complexity,
      
      // Optional fields
      filename,
      active,
      triggerType,
      nodeCount,
      tags,
      fileHash,
      analyzedAt,
      license: extractedLicense || input?.license || 'Unknown',
      authorName,
      authorUsername,
      authorAvatar,
      authorVerified,
    };
  }

  /**
   * Normalize any incoming agent-like object into our AgentIndex shape
   */
  private normalizeAgentShape(input: any, extractedLicense?: string): AgentIndex {
    const id = String(input?.id || `agent-${Math.floor(Math.random() * 10_000_000)}`);
    const title = (input?.title || input?.name || `Agent ${id}`).toString();
    const summary = (input?.summary || input?.description || 'AI agent for automation tasks').toString();
    const source = input?.source || 'unknown';
    const link = input?.link || '#';
    
    // Agent-specific mandatory fields
    const model = input?.model || 'Unknown';
    const provider = input?.provider || 'Unknown';
    const capabilities = Array.isArray(input?.capabilities) ? input.capabilities : [];
    
    // Optional fields
    const category = input?.category || 'General Business';
    const tags = Array.isArray(input?.tags) ? input.tags : [];
    const difficulty = input?.difficulty || 'Beginner';
    const setupTime = input?.setupTime || 'Quick';
    const deployment = input?.deployment || 'Cloud';
    const pricing = input?.pricing || 'Free';
    const requirements = Array.isArray(input?.requirements) ? input.requirements : [];
    const useCases = Array.isArray(input?.useCases) ? input.useCases : [];
    const automationPotential = typeof input?.automationPotential === 'number' ? input.automationPotential : 70;
    
    // Author metadata
    const authorName = input?.authorName || input?.author?.name;
    const authorUsername = input?.authorUsername || input?.author?.username;
    const authorEmail = input?.authorEmail || input?.author?.email;
    const authorAvatar = input?.authorAvatar || input?.author?.avatar;
    const authorVerified = input?.authorVerified || false;
    
    // Source-specific metadata
    const likes = typeof input?.likes === 'number' ? input.likes : 0;
    const downloads = typeof input?.downloads === 'number' ? input.downloads : 0;
    const lastModified = input?.lastModified || input?.updatedAt || new Date().toISOString();
    const githubUrl = input?.githubUrl;
    const demoUrl = input?.demoUrl;
    const documentationUrl = input?.documentationUrl;

    return {
      // Mandatory core fields
      id,
      source,
      title,
      summary,
      link,
      
      // Agent-specific mandatory fields
      model,
      provider,
      capabilities,
      
      // Optional fields
      category,
      tags,
      difficulty,
      setupTime,
      deployment,
      license: extractedLicense || input?.license || 'Unknown',
      pricing,
      requirements,
      useCases,
      automationPotential,
      
      // Author metadata
      authorName,
      authorUsername,
      authorEmail,
      authorAvatar,
      authorVerified,
      
      // Source-specific metadata
      likes,
      downloads,
      lastModified,
      githubUrl,
      demoUrl,
      documentationUrl
    };
  }

  /**
   * Enrich solution with domain classification using LLM
   */
  async enrichSolutionWithDomains(solution: SolutionIndex): Promise<SolutionIndex> {
    try {
      // Skip if domains are already classified and not from LLM
      if (solution.domains && solution.domains.length > 0 && solution.domain_origin !== 'llm') {
        return solution;
      }

      // Perform domain classification
      const domainResult = await SchemaValidator.classifySolutionDomains(
        solution.title,
        solution.summary,
        solution.source,
        solution.tags?.join(', ')
      );

      // Update solution with domain classification
      const enrichedSolution = {
        ...solution,
        domains: domainResult.domains,
        domain_confidences: domainResult.domain_confidences,
        domain_origin: domainResult.domain_origin
      };

      return enrichedSolution;

    } catch (error) {
      console.error('Failed to enrich solution with domains:', error);
      // Return solution with fallback domain
      return {
        ...solution,
        domains: ['Other'],
        domain_confidences: [1.0],
        domain_origin: 'llm'
      };
    }
  }

  /**
   * Batch enrich multiple solutions with domain classification
   */
  async enrichSolutionsWithDomains(solutions: SolutionIndex[]): Promise<SolutionIndex[]> {
    const enrichedSolutions: SolutionIndex[] = [];
    
    for (const solution of solutions) {
      try {
        const enriched = await this.enrichSolutionWithDomains(solution);
        enrichedSolutions.push(enriched);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to enrich solution ${solution.id}:`, error);
        // Add fallback domain classification
        enrichedSolutions.push({
          ...solution,
          domains: ['Other'],
          domain_confidences: [1.0],
          domain_origin: 'llm'
        });
      }
    }

    return enrichedSolutions;
  }

  /**
   * Store domain classification data in the database
   */
  async storeDomainClassification(
    cacheId: number,
    solutionId: string,
    domains: string[],
    confidences: number[],
    origin: 'llm' | 'admin' | 'mixed'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_workflow_domain_classification', {
        cache_id: cacheId,
        solution_id: solutionId,
        new_domains: domains,
        new_confidences: confidences,
        new_origin: origin
      });

      if (error) {
        console.error('Failed to store domain classification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error storing domain classification:', error);
      return false;
    }
  }

  /**
   * Get solutions by domain classification
   */
  async getSolutionsByDomain(domainName: string): Promise<Array<{
    cache_id: number;
    solution_id: string;
    title: string;
    summary: string;
    source: string;
    domains: string[];
    domain_confidences: number[];
    domain_origin: string;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_solutions_by_domain', {
        domain_name: domainName
      });

      if (error) {
        console.error('Failed to get solutions by domain:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting solutions by domain:', error);
      return [];
    }
  }

  /**
   * Get domain classification statistics
   */
  async getDomainStatistics(): Promise<Array<{
    domain_name: string;
    solution_count: number;
    avg_confidence: number;
    sources: string[];
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_domain_statistics');

      if (error) {
        console.error('Failed to get domain statistics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting domain statistics:', error);
      return [];
    }
  }

  /**
   * Extract domain classification from cached workflows
   */
  async extractDomainClassificationFromCache(cacheId: number): Promise<Array<{
    solution_id: string;
    domains: string[];
    domain_confidences: number[];
    domain_origin: string;
  }>> {
    try {
      // Get the workflows from cache
      const { data: cacheData, error: cacheError } = await supabase
        .from('workflow_cache')
        .select('workflows')
        .eq('id', cacheId)
        .single();

      if (cacheError || !cacheData) {
        console.error('Failed to get cache data:', cacheError);
        return [];
      }

      // Extract domain classification using the database function
      const { data, error } = await supabase.rpc('extract_domain_classification', {
        workflows_jsonb: cacheData.workflows
      });

      if (error) {
        console.error('Failed to extract domain classification:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error extracting domain classification:', error);
      return [];
    }
  }

  /**
   * Update cache with enriched domain classification data
   */
  async updateCacheWithDomainClassification(
    source: string,
    enrichedSolutions: SolutionIndex[]
  ): Promise<boolean> {
    try {
      // Get the current cache record for this source
      const { data: cacheData, error: cacheError } = await supabase
        .from('workflow_cache')
        .select('id, workflows')
        .eq('source', source)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cacheError || !cacheData) {
        console.error('Failed to get cache data for source:', source, cacheError);
        return false;
      }

      // Update the workflows with domain classification data
      const updatedWorkflows = enrichedSolutions.map(solution => ({
        ...solution,
        domains: solution.domains || ['Other'],
        domain_confidences: solution.domain_confidences || [1.0],
        domain_origin: solution.domain_origin || 'llm'
      }));

      // Update the cache record
      const { error: updateError } = await supabase
        .from('workflow_cache')
        .update({
          workflows: updatedWorkflows,
          domains: enrichedSolutions[0]?.domains || ['Other'],
          domain_confidences: enrichedSolutions[0]?.domain_confidences || [1.0],
          domain_origin: enrichedSolutions[0]?.domain_origin || 'llm',
          updated_at: new Date().toISOString()
        })
        .eq('id', cacheData.id);

      if (updateError) {
        console.error('Failed to update cache with domain classification:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating cache with domain classification:', error);
      return false;
    }
  }

  /**
   * Admin override: Update domain classification
   */
  async adminOverrideDomainClassification(
    title: string,
    summary: string,
    source: string,
    newDomains: string[],
    newConfidences: number[],
    adminNotes?: string
  ): Promise<boolean> {
    try {
      // Generate content hash
      const { data: hashData, error: hashError } = await supabase.rpc('generate_content_hash', {
        title_text: title,
        summary_text: summary,
        source_id_text: source
      });

      if (hashError || !hashData) {
        console.error('Failed to generate content hash:', hashError);
        return false;
      }

      const contentHash = hashData;

      // Update domain classification with admin override
      const { data, error } = await supabase.rpc('update_domain_classification', {
        content_hash_text: contentHash,
        new_domains: newDomains,
        new_confidences: newConfidences,
        new_origin: 'admin',
        admin_notes_text: adminNotes
      });

      if (error) {
        console.error('Failed to update domain classification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error applying admin override:', error);
      return false;
    }
  }

  /**
   * Get admin overrides
   */
  async getAdminOverrides(): Promise<Array<{
    id: number;
    content_hash: string;
    title: string;
    summary: string;
    source_id: string;
    domains: string[];
    domain_confidences: number[];
    domain_origin: string;
    admin_notes: string;
    created_at: string;
    updated_at: string;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_admin_overrides');

      if (error) {
        console.error('Failed to get admin overrides:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting admin overrides:', error);
      return [];
    }
  }

  /**
   * Get domain classification statistics
   */
  async getDomainClassificationStats(): Promise<{
    total_classifications: number;
    llm_classifications: number;
    admin_overrides: number;
    mixed_classifications: number;
    unique_domains: number;
    avg_confidence: number;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('get_domain_classification_stats');

      if (error) {
        console.error('Failed to get domain classification stats:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error getting domain classification stats:', error);
      return null;
    }
  }

  /**
   * Get all agent capability tags
   */
  static async getAgentCapabilityTags(): Promise<Array<{
    id: number;
    tag: string;
    display_name: string;
    description: string;
    category: string;
    display_order: number;
    is_core: boolean;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_agent_capability_tags');

      if (error) {
        console.error('Failed to get agent capability tags:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting agent capability tags:', error);
      return [];
    }
  }

  /**
   * Get core capability tags only
   */
  static async getCoreCapabilityTags(): Promise<Array<{
    id: number;
    tag: string;
    display_name: string;
    description: string;
    category: string;
    display_order: number;
    is_core: boolean;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_core_capability_tags');

      if (error) {
        console.error('Failed to get core capability tags:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting core capability tags:', error);
      return [];
    }
  }

  /**
   * Validate capability tags against the allowed set
   */
  static async validateCapabilityTags(tags: string[]): Promise<{
    valid_tags: string[];
    invalid_tags: string[];
    all_valid: boolean;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('validate_capability_tags', {
        tags: tags
      });

      if (error) {
        console.error('Failed to validate capability tags:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error validating capability tags:', error);
      return null;
    }
  }

  /**
   * Map agent capabilities to standardized tags using heuristics
   */
  static mapCapabilitiesToStandardTags(
    rawCapabilities: string[],
    title: string,
    summary: string,
    source: string
  ): string[] {
    const standardizedTags: string[] = [];
    const lowerCapabilities = rawCapabilities.map(cap => cap.toLowerCase().trim());
    const lowerTitle = title.toLowerCase();
    const lowerSummary = summary.toLowerCase();
    const lowerSource = source.toLowerCase();

    // Define mapping heuristics
    const capabilityMappings: Record<string, string[]> = {
      // Core capabilities
      'web_search': ['search', 'web', 'internet', 'google', 'bing', 'browser', 'scraping', 'crawling'],
      'data_analysis': ['analysis', 'analytics', 'data', 'statistics', 'metrics', 'insights', 'reporting'],
      'file_io': ['file', 'document', 'upload', 'download', 'storage', 'filesystem', 'csv', 'json', 'pdf'],
      'email_send': ['email', 'mail', 'notification', 'alert', 'message', 'smtp', 'sendgrid'],

      // Data access and processing
      'api_integration': ['api', 'rest', 'graphql', 'integration', 'connect', 'endpoint', 'service'],
      'database_query': ['database', 'sql', 'query', 'db', 'postgres', 'mysql', 'mongodb', 'redis'],
      'data_visualization': ['chart', 'graph', 'visualization', 'plot', 'dashboard', 'visual'],
      'data_extraction': ['extract', 'scrape', 'parse', 'harvest', 'collect', 'gather'],
      'data_transformation': ['transform', 'convert', 'process', 'clean', 'normalize', 'format'],

      // Communication and collaboration
      'chat_interaction': ['chat', 'conversation', 'messaging', 'discord', 'slack', 'telegram'],
      'document_generation': ['generate', 'create', 'document', 'report', 'pdf', 'word', 'template'],
      'notification_sending': ['notification', 'alert', 'push', 'sms', 'webhook', 'reminder'],
      'calendar_management': ['calendar', 'schedule', 'event', 'meeting', 'appointment', 'booking'],

      // Content creation and processing
      'text_processing': ['text', 'nlp', 'language', 'sentiment', 'translation', 'summarize'],
      'image_processing': ['image', 'photo', 'picture', 'vision', 'ocr', 'resize', 'filter'],
      'code_generation': ['code', 'programming', 'generate', 'script', 'function', 'class'],
      'content_summarization': ['summarize', 'summary', 'abstract', 'condense', 'brief'],

      // Automation and workflow
      'workflow_automation': ['workflow', 'automation', 'process', 'pipeline', 'orchestration'],
      'task_scheduling': ['schedule', 'cron', 'task', 'job', 'timer', 'periodic'],
      'monitoring': ['monitor', 'watch', 'track', 'observe', 'health', 'status'],
      'alerting': ['alert', 'warning', 'alarm', 'threshold', 'critical', 'error'],

      // Development and technical
      'code_review': ['review', 'code review', 'pull request', 'pr', 'merge', 'diff'],
      'testing': ['test', 'testing', 'unit test', 'integration', 'qa', 'quality'],
      'deployment': ['deploy', 'deployment', 'release', 'ci/cd', 'pipeline', 'build'],
      'security_analysis': ['security', 'vulnerability', 'scan', 'audit', 'penetration', 'threat'],

      // Business and analytics
      'reporting': ['report', 'reporting', 'dashboard', 'kpi', 'metrics', 'analytics'],
      'forecasting': ['forecast', 'prediction', 'predict', 'trend', 'future', 'projection'],
      'optimization': ['optimize', 'optimization', 'improve', 'enhance', 'performance'],
      'compliance_checking': ['compliance', 'regulation', 'audit', 'policy', 'governance'],

      // Specialized capabilities
      'language_translation': ['translate', 'translation', 'language', 'multilingual', 'localization'],
      'voice_processing': ['voice', 'speech', 'audio', 'recognition', 'tts', 'stt'],
      'blockchain_interaction': ['blockchain', 'crypto', 'ethereum', 'bitcoin', 'smart contract'],
      'iot_management': ['iot', 'device', 'sensor', 'hardware', 'embedded', 'arduino']
    };

    // Apply mapping heuristics
    for (const [standardTag, keywords] of Object.entries(capabilityMappings)) {
      // Check if any keyword matches the capabilities, title, summary, or source
      const hasMatch = keywords.some(keyword => 
        lowerCapabilities.some(cap => cap.includes(keyword)) ||
        lowerTitle.includes(keyword) ||
        lowerSummary.includes(keyword) ||
        lowerSource.includes(keyword)
      );

      if (hasMatch) {
        standardizedTags.push(standardTag);
      }
    }

    // Remove duplicates and ensure we have at least one core capability
    const uniqueTags = [...new Set(standardizedTags)];
    
    // If no capabilities were mapped, add a default based on source
    if (uniqueTags.length === 0) {
      if (lowerSource.includes('crew') || lowerSource.includes('agent')) {
        uniqueTags.push('workflow_automation');
      } else if (lowerSource.includes('huggingface') || lowerSource.includes('hf')) {
        uniqueTags.push('data_analysis');
      } else {
        uniqueTags.push('data_analysis'); // Default fallback
      }
    }

    return uniqueTags;
  }

  /**
   * Normalize agent capabilities during ingestion
   */
  static async normalizeAgentCapabilities(
    rawCapabilities: string[],
    title: string,
    summary: string,
    source: string
  ): Promise<string[]> {
    try {
      // Map to standardized tags
      const mappedTags = this.mapCapabilitiesToStandardTags(rawCapabilities, title, summary, source);
      
      // Validate against allowed tags
      const validation = await this.validateCapabilityTags(mappedTags);
      
      if (validation && validation.all_valid) {
        return validation.valid_tags;
      } else if (validation) {
        console.warn('Some capability tags were invalid:', validation.invalid_tags);
        return validation.valid_tags;
      } else {
        // Fallback to core capabilities if validation fails
        const coreTags = await this.getCoreCapabilityTags();
        return coreTags.slice(0, 2).map(tag => tag.tag);
      }
    } catch (error) {
      console.error('Error normalizing agent capabilities:', error);
      // Return default core capabilities
      return ['data_analysis', 'web_search'];
    }
  }


  /**
   * Load real workflows from GitHub API via Supabase Edge Function
   */
  private async loadRealWorkflows(params: WorkflowSearchParams): Promise<WorkflowIndex[]> {
    try {
      console.log('Loading real workflows from GitHub API via Supabase Edge Function...');
      const normalized = this.normalizeSourceKey(params.source);

      if (normalized === 'n8n.io') {
        // Client-side fetch for n8n.io: try bulk once, then fallback to light pagination
        const startTs = Date.now();
        console.log('[n8n.io] Starting client fetch (bulk, then fallback)');

        // 1) Bulk attempt
        try {
          const bulkUrl = `https://api.n8n.io/api/templates/workflows?page=1&perPage=6000`;
          console.log('[n8n.io] Bulk fetch ...');
          const rb = await fetch(bulkUrl, { headers: { 'Accept': 'application/json' } });
          if (rb.ok) {
            const jb = await rb.json();
            const items = Array.isArray(jb.workflows) ? jb.workflows : [];
            console.log(`[n8n.io] Bulk items: ${items.length}`);
            if (items.length > 0) {
              const aggregated = items.map((w: any, idx: number) => {
                const id = Number(w.id) || (idx + 1);
                const name = (w.name || `n8n-workflow-${id}`).toString();
                const description = (w.description || `Official n8n workflow: ${name}`).toString();
                const nodes = Array.isArray(w.nodes) ? w.nodes : [];
                const nodeCount = nodes.length || 0;
                const integrationsSet = new Set<string>();
                nodes.forEach((n: any) => {
                  const raw = (n?.name || n?.id || '').toString();
                  if (raw) integrationsSet.add(raw.toString());
                });
                const integrations = Array.from(integrationsSet).slice(0, 12);
                const complexity = nodeCount > 12 ? 'High' : nodeCount > 6 ? 'Medium' : 'Low';
                const triggerType = this.determineTriggerType(name + ' ' + description);
                const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const filename = `n8n-${id}-${safeName}.json`;
                return this.normalizeWorkflowShape({
                  id,
                  filename,
                  name,
                  active: true,
                  triggerType,
                  complexity,
                  nodeCount,
                  integrations,
                  description,
                  category: this.mapCategory('communication'),
                  tags: this.generateTags(filename),
                  fileHash: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  analyzedAt: new Date().toISOString(),
                  // author from API
                  authorName: w?.user?.name || w?.user?.username,
                  authorUsername: w?.user?.username,
                  authorAvatar: w?.user?.avatar,
                  authorVerified: w?.user?.verified === true,
                });
              });
              const ms = Date.now() - startTs;
              console.log(`[n8n.io] Bulk completed. Total: ${aggregated.length}. Saving to cache... (${ms} ms)`);
              if (typeof window === 'undefined') {
              await this.saveToServerCache(aggregated, normalized);
              console.log('[n8n.io] Saved to cache for source n8n.io');
              }
              return aggregated;
            }
          } else {
            console.warn(`[n8n.io] Bulk fetch failed with status ${rb.status}`);
          }
        } catch (e) {
          console.warn('[n8n.io] Bulk fetch error', e);
        }

        // 2) Fallback light pagination (defensive)
        const perPage = 200;
        const maxPages = 30; // safety cap
        const aggregated: WorkflowIndex[] = [];
        console.log(`[n8n.io] Fallback pagination: perPage=${perPage}, maxPages=${maxPages}`);
        try {
          for (let page = 1; page <= maxPages; page++) {
            console.log(`[n8n.io] Fetching page ${page} ...`);
            const apiUrl = `https://api.n8n.io/api/templates/workflows?page=${page}&perPage=${perPage}`;
            const r = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });
            if (!r.ok) {
              console.warn(`[n8n.io] Page ${page} failed with status ${r.status}`);
              break;
            }
            const j = await r.json();
            const items = Array.isArray(j.workflows) ? j.workflows : [];
            console.log(`[n8n.io] Page ${page} items: ${items.length}`);
            if (items.length === 0) break;

            const chunk: WorkflowIndex[] = items.map((w: any, idx: number) => {
              const id = Number(w.id) || ((page - 1) * perPage + idx + 1);
              const name = (w.name || `n8n-workflow-${id}`).toString();
              const description = (w.description || `Official n8n workflow: ${name}`).toString();
              const nodes = Array.isArray(w.nodes) ? w.nodes : [];
              const nodeCount = nodes.length || 0;
              const integrationsSet = new Set<string>();
              nodes.forEach((n: any) => {
                const raw = (n?.name || n?.id || '').toString();
                if (raw) integrationsSet.add(raw.toString());
              });
              const integrations = Array.from(integrationsSet).slice(0, 12);
              const complexity = nodeCount > 12 ? 'High' : nodeCount > 6 ? 'Medium' : 'Low';
              const triggerType = this.determineTriggerType(name + ' ' + description);
              const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
              const filename = `n8n-${id}-${safeName}.json`;
              return this.normalizeWorkflowShape({
                id,
                filename,
                name,
                active: true,
                triggerType,
                complexity,
                nodeCount,
                integrations,
                description,
                category: this.mapCategory('communication'),
                tags: this.generateTags(filename),
                fileHash: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                analyzedAt: new Date().toISOString(),
                authorName: w?.user?.name || w?.user?.username,
                authorUsername: w?.user?.username,
                authorAvatar: w?.user?.avatar,
                authorVerified: w?.user?.verified === true,
              });
            });

            aggregated.push(...chunk);
            console.log(`[n8n.io] Aggregated: ${aggregated.length}`);
            if (items.length < perPage || aggregated.length >= 7000) {
              console.log(`[n8n.io] Stopping at page ${page}.`);
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (e) {
          console.warn('Client-side n8n.io pagination failed', e);
        }

        if (aggregated.length > 0) {
          const ms = Date.now() - startTs;
          console.log(`[n8n.io] Completed fallback. Total: ${aggregated.length}. Saving to cache... (${ms} ms)`);
          if (typeof window === 'undefined') {
          await this.saveToServerCache(aggregated, normalized);
          console.log('[n8n.io] Saved to cache for source n8n.io');
          }
          return aggregated;
        }
        console.log('[n8n.io] No workflows loaded.');
        return [];
      }


      // Default single-call path for other sources (Edge function; allowed in browser)
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase configuration missing');
        return [];
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-github-workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ source: normalized })
      });
      
      if (!response.ok) {
        throw new Error(`Edge Function error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`Successfully loaded ${result.workflows.length} workflows from GitHub API via Edge Function`);
        
        // Save to cache for future use
        const normalizedWorkflows = (Array.isArray(result.workflows) ? result.workflows : []).map((w: any) => this.normalizeWorkflowShape(w));
        await this.saveToServerCache(normalizedWorkflows, normalized);
        return normalizedWorkflows;
      } else {
        throw new Error(result.error || 'Unknown error from Edge Function');
      }
    } catch (error) {
      console.error('Failed to load workflows from GitHub API via Edge Function:', error);
      console.log('Falling back to mock workflow data');
      return [];
    }
  }

  /**
   * Generate workflow name from filename
   */
  private generateWorkflowName(filename: string): string {
    return this.humanizeTitle(filename.replace('.json', ''));
  }

  private humanizeTitle(raw: string): string {
    if (!raw) return 'Untitled Workflow';
    const cleaned = raw
      .replace(/\.json$/i, '')
      .replace(/[_]+/g, ' ')
      .replace(/-+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return 'Untitled Workflow';
    const specialUpper = new Set(['ai', 'llm', 'api', 'http', 'https', 'sql', 'crm', 'erp', 'saas', 'n8n', 'gpt']);
    return cleaned
      .split(' ')
      .map((word) => {
        const lower = word.toLowerCase();
        if (lower === 'nn') return 'n8n';
        if (specialUpper.has(lower)) return lower.toUpperCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(' ');
  }

  /**
   * Determine trigger type from filename
   */
  private determineTriggerType(filename: string): 'Complex' | 'Webhook' | 'Manual' | 'Scheduled' {
    const lower = filename.toLowerCase();
    if (lower.includes('webhook')) return 'Webhook';
    if (lower.includes('scheduled') || lower.includes('cron')) return 'Scheduled';
    if (lower.includes('manual')) return 'Manual';
    return 'Complex';
  }

  /**
   * Determine complexity from filename
   */
  private determineComplexity(filename: string): 'Low' | 'Medium' | 'High' {
    const lower = filename.toLowerCase();
    if (lower.includes('simple') || lower.includes('basic')) return 'Low';
    if (lower.includes('complex') || lower.includes('advanced')) return 'High';
    return 'Medium';
  }

  /**
   * Extract integrations from filename
   */
  private extractIntegrations(filename: string): string[] {
    const integrations: string[] = [];
    const lower = filename.toLowerCase();
    
    const integrationMap: Record<string, string> = {
      'telegram': 'Telegram',
      'discord': 'Discord',
      'slack': 'Slack',
      'openai': 'OpenAI',
      'google': 'Google',
      'sheets': 'Google Sheets',
      'drive': 'Google Drive',
      'gmail': 'Gmail',
      'github': 'GitHub',
      'webhook': 'Webhook',
      'http': 'HTTP Request',
      'schedule': 'Schedule Trigger',
      'manual': 'Manual Trigger'
    };

    for (const [key, value] of Object.entries(integrationMap)) {
      if (lower.includes(key)) {
        integrations.push(value);
      }
    }

    return integrations.length > 0 ? integrations : ['HTTP Request'];
  }

  /**
   * Generate description from filename
   */
  private generateDescription(filename: string): string {
    const name = this.generateWorkflowName(filename);
    const integrations = this.extractIntegrations(filename);
    return `${name} workflow using ${integrations.join(', ')} for automation and data processing`;
  }

  /**
   * Map category name to standard category
   */
  private mapCategory(categoryName: string): string {
    const categoryMap: Record<string, string> = {
      'messaging': 'messaging',
      'communication': 'messaging',
      'ai': 'ai_ml',
      'automation': 'development',
      'data': 'database',
      'storage': 'cloud_storage',
      'social': 'social_media',
      'marketing': 'social_media',
      'crm': 'social_media',
      'analytics': 'analytics',
      'forms': 'forms',
      'calendar': 'calendar_tasks',
      'project': 'project_management'
    };

    const lower = categoryName.toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lower.includes(key)) {
        return value;
      }
    }

    return 'development';
  }

  /**
   * Generate tags from filename
   */
  private generateTags(filename: string): string[] {
    const tags: string[] = [];
    const lower = filename.toLowerCase();
    
    const tagMap = [
      'automation', 'webhook', 'scheduled', 'manual', 'ai', 'data', 'notification',
      'integration', 'api', 'workflow', 'process', 'trigger', 'export', 'import'
    ];

    for (const tag of tagMap) {
      if (lower.includes(tag)) {
        tags.push(tag);
      }
    }

    return tags.length > 0 ? tags : ['automation'];
  }

  /**
   * Get workflow download URL
   */
  getWorkflowDownloadUrl(filename: string): string {
    return `${this.baseUrl}/contents/workflows/${filename}`;
  }

  /**
   * Get workflow diagram URL (Mermaid)
   */
  getWorkflowDiagramUrl(filename: string): string {
    // In a real implementation, this would generate a Mermaid diagram
    return `${this.baseUrl}/contents/workflows/${filename}`;
  }

  /**
   * Load workflows from server-side cache (Supabase)
   */
  private async loadFromServerCache(source?: string): Promise<void> {
    try {
      const normalized = this.normalizeSourceKey(source);

      // Build union for 'all' from per-source caches
      if (!normalized || normalized === 'all') {
        // Fetch rows, including shards via LIKE
        const sourcesAll = ['all', 'github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
        const fetched: any[] = [];
        for (const s of sourcesAll) {
          const { data, error } = await (supabase as any)
            .from('workflow_cache')
            .select('source, workflows, last_fetch_time')
            .eq('version', this.cacheVersion)
            .like('source', `${s}%`);
          if (error) {
            console.warn(`Database error for source ${s}:`, error.message);
          } else if (data) {
            if (Array.isArray(data)) fetched.push(...data); else fetched.push(data);
          }
        }

        if (fetched.length === 0) {
          console.log(`No cached workflows found for union: ${(normalized || 'all')}, will fetch fresh data`);
          return;
        }

        const allRow = fetched.find((r: any) => r.source === 'all');
        const perSourceRows = fetched.filter((r: any) => r.source !== 'all');
 
        const merged: WorkflowIndex[] = [];
        const seen = new Set<string>();
        let newestTs: number | null = null;
        perSourceRows.forEach(r => {
          const list: any[] = r?.workflows || [];
          const ts = r?.last_fetch_time ? new Date(r.last_fetch_time).getTime() : null;
          if (ts && (!newestTs || ts > newestTs)) newestTs = ts;
          list.forEach(w => {
            const key = String(w?.id || w?.filename || w?.name || Math.random());
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(this.normalizeWorkflowShape(w));
          });
        });
 
        // Decide which set to use
        let use: WorkflowIndex[] = merged;
        if (merged.length === 0 && allRow) {
          use = (allRow.workflows || []).map((w: any) => this.normalizeWorkflowShape(w));
          newestTs = allRow?.last_fetch_time ? new Date(allRow.last_fetch_time).getTime() : null;
        }
 
        if (use.length > 0) {
          this.workflows = use;
          this.lastFetchTime = newestTs || (allRow?.last_fetch_time ? new Date(allRow.last_fetch_time).getTime() : null);
          this.currentSourceKey = 'all';
          this.updateStatsFromWorkflows(this.workflows);
          console.log(`Loaded ${this.workflows.length} workflows from server cache for source: all (union)`);
 
          // If union larger than stored 'all', update 'all'
          const allCount = Array.isArray(allRow?.workflows) ? allRow.workflows.length : 0;
          if (merged.length > allCount) {
            // Avoid writing to server cache in dev to prevent timeouts
            if (typeof window === 'undefined') {
            await this.saveToServerCache(this.workflows, 'all');
          }
        }
        }
          return;
        }

      // Default: load a specific source cache using direct Supabase query
      try {
        const { data, error } = await (supabase as any)
          .from('workflow_cache')
          .select('source, workflows, last_fetch_time')
          .like('source', `${normalized}%`)
          .eq('version', this.cacheVersion);

        if (error) {
          console.warn(`Database error for source ${normalized}:`, error.message);
          return;
        }

        if (!data || (Array.isArray(data) && data.length === 0)) {
          console.log(`No cached workflows found for source: ${normalized}, will fetch fresh data`);
          return;
        }

        const rows: any[] = Array.isArray(data) ? data : [data];
        const allWorkflows: any[] = [];
        let newestTs: number | null = null;
        rows.forEach((r: any) => {
          const list = r?.workflows || [];
          const ts = r?.last_fetch_time ? new Date(r.last_fetch_time).getTime() : null;
          if (ts && (!newestTs || ts > newestTs)) newestTs = ts;
          list.forEach((w: any) => allWorkflows.push(this.normalizeWorkflowShape(w)));
        });
        this.workflows = allWorkflows;
        this.lastFetchTime = newestTs || null;
        this.currentSourceKey = normalized;
        this.updateStatsFromWorkflows(this.workflows);
        console.log(`Loaded ${this.workflows.length} workflows from server cache for source: ${normalized}`);
      } catch (error) {
        console.warn(`Failed to load server cache for source ${normalized}:`, error);
      }
    } catch (error) {
      console.warn('Failed to load server cache:', error);
    }
  }

  /**
   * Save workflows to server-side cache (Supabase)
   */
  private async saveToServerCache(workflows: WorkflowIndex[], source?: string): Promise<void> {
    try {
      const sourceKey = this.normalizeSourceKey(source) || 'all';
      console.log(`Saving ${workflows.length} workflows to cache for source: ${sourceKey}`);
      const { error } = await (supabase as any)
        .from('workflow_cache')
        .upsert({
          version: this.cacheVersion,
          workflows: workflows,
          last_fetch_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source: sourceKey
        }, { onConflict: 'version,source' });

      if (error) {
        console.error('Error saving to server cache:', error);
      } else {
        console.log(`Successfully saved ${workflows.length} workflows to server cache for source: ${sourceKey}`);
      }
    } catch (error) {
      console.error('Error saving to server cache:', error);
    }
  }

  /**
   * Filter workflows based on search parameters
   */
  private filterWorkflows(workflows: WorkflowIndex[], params: WorkflowSearchParams): WorkflowIndex[] {
    let filtered = [...workflows];

    const normalize = (s: string) => s.toLowerCase().trim();
    const integrationSynonyms: Record<string, string[]> = {
      'http request': ['http', 'http-request', 'request', 'api', 'fetch'],
      'webhook': ['webhook', 'hook', 'callback'],
      'gmail': ['gmail', 'google mail', 'email', 'mail'],
      'google sheets': ['google sheets', 'sheets', 'spreadsheet'],
      'google drive': ['google drive', 'drive'],
      'openai': ['openai', 'gpt', 'chatgpt', 'ai'],
      'slack': ['slack'],
    };
    const expandIntegrations = (names: string[]): string[] => {
      const out = new Set<string>();
      names.map(normalize).forEach(n => {
        out.add(n);
        Object.entries(integrationSynonyms).forEach(([canon, syns]) => {
          if (n === canon || syns.includes(n)) {
            out.add(canon);
            syns.forEach(s => out.add(s));
          }
        });
      });
      return Array.from(out);
    };

    if (params.q) {
      const query = normalize(params.q);
      filtered = filtered.filter(workflow =>
        workflow.title.toLowerCase().includes(query) ||
        workflow.summary.toLowerCase().includes(query) ||
        workflow.integrations.some(integration => 
          integration.toLowerCase().includes(query)
        ) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (params.integrations && params.integrations.length > 0) {
      const wanted = expandIntegrations(params.integrations);
      filtered = filtered.filter(w => {
        const have = expandIntegrations(w.integrations || []);
        // require at least one overlap
        return wanted.some(x => have.includes(x));
      });
    }

    if (params.trigger && params.trigger !== 'all') {
      filtered = filtered.filter(workflow =>
        workflow.triggerType.toLowerCase() === String(params.trigger).toLowerCase()
      );
    }

    if (params.complexity) {
      filtered = filtered.filter(workflow =>
        workflow.complexity.toLowerCase() === params.complexity.toLowerCase()
      );
    }

    if (params.category) {
      filtered = filtered.filter(workflow =>
        workflow.category.toLowerCase() === params.category.toLowerCase()
      );
    }

    if (params.active !== undefined) {
      filtered = filtered.filter(workflow =>
        workflow.active === params.active
      );
    }

    if (params.source) {
      const normalizedTarget = this.normalizeSourceKey(params.source);
      const sourceLower = params.source.toLowerCase();

      filtered = filtered.filter(workflow => {
        const workflowSourceNormalized = this.normalizeSourceKey(workflow.source);

        if (normalizedTarget && workflowSourceNormalized) {
          if (workflowSourceNormalized === normalizedTarget) {
            return true;
          }
        }

        const filename = (workflow.filename || '').toLowerCase();
        const title = workflow.title.toLowerCase();

        if (normalizedTarget === 'n8n.io') {
          return filename.startsWith('n8n-') ||
            filename.includes('n8n_official') ||
            workflow.source?.toLowerCase().includes('n8n') ||
            title.includes('n8n official');
        }

        if (normalizedTarget === 'github') {
          return workflowSourceNormalized === 'github' ||
            (!filename.startsWith('n8n-') && filename.includes('workflow')) ||
            workflow.source?.toLowerCase().includes('github');
        }

        if (normalizedTarget === 'awesome-n8n-templates') {
          return workflowSourceNormalized === 'awesome-n8n-templates' ||
            workflow.source?.toLowerCase().includes('awesome-n8n') ||
            filename.includes('community_') ||
            title.includes('community');
        }

        if (normalizedTarget === 'ai-enhanced') {
          return workflowSourceNormalized === 'ai-enhanced' ||
            workflow.category === 'ai_ml' ||
            (workflow.integrations || []).some(integration => {
              const lower = integration.toLowerCase();
              return lower.includes('openai') || lower.includes('ai') || lower.includes('llm');
            });
        }

        // Fallback: fuzzy match on filename or title containing requested source label
        return filename.includes(sourceLower) || title.includes(sourceLower);
      });
    }

    return filtered;
  }

  /**
   * Load union of cached sources and set as current 'all'
   */
  private async loadAllFromServerCacheUnion(): Promise<void> {
    try {
      const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
      const rows: any[] = [];
      for (const s of sources) {
        const { data, error } = await (supabase as any)
          .from('workflow_cache')
          .select('source, workflows, last_fetch_time')
          .eq('version', this.cacheVersion)
          .eq('source', s)
          .maybeSingle();
        if (error) {
          console.warn(`Database error for source ${s}:`, error.message);
        } else if (data) {
          rows.push(data);
        }
      }
      if (rows.length === 0) {
        console.log('No per-source caches available for union');
        return;
      }
      const merged: WorkflowIndex[] = [];
      const seen = new Set<string>();
      for (const row of rows) {
        const list: any[] = (row as any).workflows || [];
        for (const w of list) {
          const key = String(w?.id || w?.filename || w?.name || Math.random());
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(this.normalizeWorkflowShape(w));
        }
      }
      if (merged.length > 0) {
        this.workflows = merged;
        this.currentSourceKey = 'all';
        this.updateStatsFromWorkflows(this.workflows);
        console.log(`Union loaded ${merged.length} workflows from per-source caches into 'all'`);
      }
    } catch (e) {
      console.warn('Failed to union per-source caches for all', e);
    }
  }

  /**
   * Calculate source quality metrics based on data completeness and accuracy
   */
  async calculateSourceQuality(source: string, workflows: WorkflowIndex[], userQuery?: string): Promise<SourceQualityMetrics> {
    const normalizedSource = this.normalizeSourceKey(source);
    if (!normalizedSource) {
      return this.getDefaultQualityMetrics();
    }

    // Check smart cache first
    const cacheKey = `quality_${normalizedSource}_${userQuery || 'default'}`;
    const cached = this.getFromSmartCache<SourceQualityMetrics>(cacheKey, normalizedSource);
    if (cached) {
      return cached;
    }

    const metrics: SourceQualityMetrics = {
      completeness: this.calculateCompleteness(workflows),
      accuracy: this.calculateAccuracy(workflows),
      freshness: this.calculateEnhancedFreshness(workflows),
      consistency: this.calculateConsistency(workflows),
      relevance: this.calculateRelevance(workflows, userQuery),
      overall: 0
    };

    // Calculate overall score as weighted average
    metrics.overall = Math.round(
      (metrics.completeness * 0.25) +
      (metrics.accuracy * 0.25) +
      (metrics.freshness * 0.2) +
      (metrics.consistency * 0.15) +
      (metrics.relevance * 0.15)
    );

    // Cache the results in smart cache
    this.setToSmartCache(cacheKey, metrics, normalizedSource);
    return metrics;
  }

  /**
   * Calculate data completeness score (0-100)
   */
  private calculateCompleteness(workflows: WorkflowIndex[]): number {
    if (workflows.length === 0) return 0;

    let totalScore = 0;
    const requiredFields = ['name', 'description', 'category', 'integrations', 'triggerType', 'complexity'];
    
    for (const workflow of workflows) {
      let workflowScore = 0;
      
      // Check required fields
      for (const field of requiredFields) {
        const value = (workflow as any)[field];
        if (value !== undefined && value !== null && value !== '') {
          workflowScore += 100 / requiredFields.length;
        }
      }
      
      // Bonus for additional metadata
      if (workflow.authorName) workflowScore += 5;
      if (workflow.tags && workflow.tags.length > 0) workflowScore += 5;
      if (workflow.nodeCount > 0) workflowScore += 5;
      
      totalScore += Math.min(100, workflowScore);
    }
    
    return Math.round(totalScore / workflows.length);
  }

  /**
   * Calculate data accuracy score (0-100)
   */
  private calculateAccuracy(workflows: WorkflowIndex[]): number {
    if (workflows.length === 0) return 0;

    let totalScore = 0;
    
    for (const workflow of workflows) {
      let workflowScore = 100;
      
      // Check for data quality issues
      if (!workflow.title || workflow.title.length < 3) workflowScore -= 20;
      if (!workflow.summary || workflow.summary.length < 10) workflowScore -= 15;
      if (!workflow.integrations || workflow.integrations.length === 0) workflowScore -= 15;
      if (workflow.nodeCount < 1) workflowScore -= 10;
      if (!workflow.category || workflow.category === 'general') workflowScore -= 10;
      
      // Check for suspicious patterns
      if (workflow.title === workflow.filename) workflowScore -= 5;
      if (workflow.summary === workflow.title) workflowScore -= 10;
      
      totalScore += Math.max(0, workflowScore);
    }
    
    return Math.round(totalScore / workflows.length);
  }

  /**
   * Calculate data freshness score (0-100)
   */
  private calculateFreshness(workflows: WorkflowIndex[]): number {
    if (workflows.length === 0) return 0;

    const now = new Date();
    let totalScore = 0;
    
    for (const workflow of workflows) {
      const analyzedAt = new Date(workflow.analyzedAt);
      const daysSinceAnalysis = (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      let freshnessScore = 100;
      
      // Decrease score based on age
      if (daysSinceAnalysis > 30) freshnessScore -= 20;
      if (daysSinceAnalysis > 90) freshnessScore -= 30;
      if (daysSinceAnalysis > 180) freshnessScore -= 40;
      if (daysSinceAnalysis > 365) freshnessScore -= 50;
      
      totalScore += Math.max(0, freshnessScore);
    }
    
    return Math.round(totalScore / workflows.length);
  }

  /**
   * Calculate enhanced source freshness with multiple timestamp analysis
   */
  private calculateEnhancedFreshness(workflows: WorkflowIndex[]): number {
    if (workflows.length === 0) return 0;

    const now = new Date();
    let totalScore = 0;
    
    for (const workflow of workflows) {
      let freshnessScore = 0;
      
      // Primary freshness based on analyzedAt
      if (workflow.analyzedAt) {
        const analyzedAt = new Date(workflow.analyzedAt);
        const daysSinceAnalysis = (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24);
        
        // More granular freshness scoring
        if (daysSinceAnalysis <= 0.5) freshnessScore += 50; // Very fresh (0-12 hours)
        else if (daysSinceAnalysis <= 1) freshnessScore += 45; // Fresh (12-24 hours)
        else if (daysSinceAnalysis <= 3) freshnessScore += 40; // Recent (1-3 days)
        else if (daysSinceAnalysis <= 7) freshnessScore += 35; // Fresh (3-7 days)
        else if (daysSinceAnalysis <= 14) freshnessScore += 30; // Recent (1-2 weeks)
        else if (daysSinceAnalysis <= 30) freshnessScore += 25; // Recent (2-4 weeks)
        else if (daysSinceAnalysis <= 60) freshnessScore += 20; // Older (1-2 months)
        else if (daysSinceAnalysis <= 90) freshnessScore += 15; // Older (2-3 months)
        else if (daysSinceAnalysis <= 180) freshnessScore += 10; // Stale (3-6 months)
        else freshnessScore += 5; // Very stale (>6 months)
      }
      
      // Secondary freshness indicators
      if (workflow.lastModified) {
        const lastModified = new Date(workflow.lastModified);
        const daysSinceModified = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceModified <= 7) freshnessScore += 10; // Recently modified
        else if (daysSinceModified <= 30) freshnessScore += 5; // Moderately recent
      }
      
      // Activity indicators
      if (workflow.stats?.views && workflow.stats.views > 0) {
        freshnessScore += 5; // Active workflows get bonus
      }
      
      // Metadata freshness indicators
      if (workflow.tags && workflow.tags.length > 0) {
        freshnessScore += 5; // Tagged workflows are more likely to be maintained
      }
      
      if (workflow.integrations && workflow.integrations.length > 0) {
        freshnessScore += 5; // Active integrations indicate maintenance
      }
      
      totalScore += Math.min(freshnessScore, 100);
    }
    
    return Math.round(totalScore / workflows.length);
  }

  /**
   * Calculate source relevance score based on user query matching
   */
  private calculateRelevance(workflows: WorkflowIndex[], userQuery?: string): number {
    if (workflows.length === 0) return 0;
    if (!userQuery || userQuery.trim().length === 0) return 50; // Neutral score when no query

    const query = userQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    let totalRelevance = 0;

    for (const workflow of workflows) {
      let relevanceScore = 0;
      
      // Check name relevance
      if (workflow.title) {
        const nameWords = workflow.title.toLowerCase().split(/\s+/);
        const nameMatches = queryWords.filter(qWord => 
          nameWords.some(nWord => nWord.includes(qWord) || qWord.includes(nWord))
        );
        relevanceScore += (nameMatches.length / queryWords.length) * 40;
      }
      
      // Check description relevance
      if (workflow.summary) {
        const descWords = workflow.summary.toLowerCase().split(/\s+/);
        const descMatches = queryWords.filter(qWord => 
          descWords.some(dWord => dWord.includes(qWord) || qWord.includes(dWord))
        );
        relevanceScore += (descMatches.length / queryWords.length) * 30;
      }
      
      // Check category relevance
      if (workflow.category) {
        const categoryMatch = queryWords.some(qWord => 
          workflow.category!.toLowerCase().includes(qWord) || 
          qWord.includes(workflow.category!.toLowerCase())
        );
        if (categoryMatch) relevanceScore += 15;
      }
      
      // Check tags relevance
      if (workflow.tags && workflow.tags.length > 0) {
        const tagMatches = queryWords.filter(qWord => 
          workflow.tags!.some(tag => 
            tag.toLowerCase().includes(qWord) || qWord.includes(tag.toLowerCase())
          )
        );
        relevanceScore += (tagMatches.length / queryWords.length) * 10;
      }
      
      // Check integrations relevance
      if (workflow.integrations && workflow.integrations.length > 0) {
        const integrationMatches = queryWords.filter(qWord => 
          workflow.integrations!.some(integration => 
            integration.toLowerCase().includes(qWord) || qWord.includes(integration.toLowerCase())
          )
        );
        relevanceScore += (integrationMatches.length / queryWords.length) * 5;
      }
      
      totalRelevance += Math.min(relevanceScore, 100);
    }
    
    return Math.round(totalRelevance / workflows.length);
  }

  /**
   * Calculate data consistency score (0-100)
   */
  private calculateConsistency(workflows: WorkflowIndex[]): number {
    if (workflows.length === 0) return 0;

    let totalScore = 0;
    
    // Check for consistent data structure
    const hasConsistentStructure = workflows.every(w => 
      typeof w.title === 'string' &&
      typeof w.summary === 'string' &&
      Array.isArray(w.integrations) &&
      typeof w.nodeCount === 'number' &&
      typeof w.active === 'boolean'
    );
    
    if (hasConsistentStructure) totalScore += 30;
    
    // Check for consistent naming patterns
    const namePatterns = workflows.map(w => w.title.length);
    const avgNameLength = namePatterns.reduce((a, b) => a + b, 0) / namePatterns.length;
    const nameConsistency = namePatterns.filter(len => Math.abs(len - avgNameLength) < 10).length / workflows.length;
    totalScore += nameConsistency * 20;
    
    // Check for consistent category usage
    const categories = workflows.map(w => w.category);
    const uniqueCategories = new Set(categories).size;
    const categoryConsistency = uniqueCategories > 0 ? Math.min(1, workflows.length / (uniqueCategories * 5)) : 0;
    totalScore += categoryConsistency * 25;
    
    // Check for consistent integration patterns
    const allIntegrations = workflows.flatMap(w => w.integrations);
    const uniqueIntegrations = new Set(allIntegrations).size;
    const integrationConsistency = uniqueIntegrations > 0 ? Math.min(1, allIntegrations.length / (uniqueIntegrations * 3)) : 0;
    totalScore += integrationConsistency * 25;
    
    return Math.min(100, Math.round(totalScore));
  }

  /**
   * Get default quality metrics for new or unknown sources
   */
  private getDefaultQualityMetrics(): SourceQualityMetrics {
    return {
      completeness: 50,
      accuracy: 50,
      freshness: 50,
      consistency: 50,
      relevance: 50,
      overall: 50
    };
  }

  /**
   * Get source quality metrics for a specific source
   */
  async getSourceQuality(source: string): Promise<SourceQualityMetrics> {
    const normalizedSource = this.normalizeSourceKey(source);
    if (!normalizedSource) {
      return this.getDefaultQualityMetrics();
    }

    // Try to get workflows for this source
    try {
      const { workflows } = await this.searchWorkflows({ source, limit: 1000 });
      return await this.calculateSourceQuality(source, workflows);
    } catch (error) {
      console.warn(`Failed to get quality metrics for source ${source}:`, error);
      return this.getDefaultQualityMetrics();
    }
  }

  /**
   * Clear quality cache for a source (useful after updates)
   */
  clearSourceQualityCache(source?: string): void {
    if (source) {
      const normalizedSource = this.normalizeSourceKey(source);
      if (normalizedSource) {
        this.sourceQualityCache.delete(normalizedSource);
      }
    } else {
      this.sourceQualityCache.clear();
    }
  }

  /**
   * Get ranked sources based on quality, freshness, and relevance
   */
  async getRankedSources(userQuery?: string): Promise<Array<{ source: string; metrics: SourceQualityMetrics; rank: number }>> {
    const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced']; // Known sources
    const rankedSources: Array<{ source: string; metrics: SourceQualityMetrics; rank: number }> = [];

    for (const source of sources) {
      try {
        const metrics = await this.getSourceQuality(source);
        rankedSources.push({ source, metrics, rank: 0 });
      } catch (error) {
        console.warn(`Failed to get quality metrics for source ${source}:`, error);
      }
    }

    // Sort by overall score (descending)
    rankedSources.sort((a, b) => b.metrics.overall - a.metrics.overall);

    // Assign ranks
    rankedSources.forEach((item, index) => {
      item.rank = index + 1;
    });

    return rankedSources;
  }

  /**
   * Get source priority level based on overall score
   */
  getSourcePriority(overallScore: number): 'high' | 'medium' | 'low' {
    if (overallScore >= 80) return 'high';
    if (overallScore >= 60) return 'medium';
    return 'low';
  }

  /**
   * Get source priority badge color
   */
  getSourcePriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high': return 'green';
      case 'medium': return 'yellow';
      case 'low': return 'red';
      default: return 'gray';
    }
  }

  /**
   * Get source key for health checks
   */
  private getSourceKey(source: string): string {
    // Map source names to standardized keys
    if (source.toLowerCase().includes('n8n.io') || source.toLowerCase().includes('official')) {
      return 'n8n.io';
    }
    if (source.toLowerCase().includes('github') || source.toLowerCase().includes('community') || source.toLowerCase().includes('n8n community')) {
      return 'github';
    }
    if (source.toLowerCase().includes('ai-enhanced') || source.toLowerCase().includes('free templates')) {
      return 'ai-enhanced';
    }
    
    return source.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Perform health check for a specific source
   */
  async performHealthCheck(source: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      let isHealthy = false;
      let statusCode: number | undefined;
      let dataReceived = false;
      let dataSize = 0;
      let error: string | undefined;

      // Only perform health checks for supported sources
      const supportedSources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced', 'hf-spaces'];
      const sourceKey = this.getSourceKey(source);
      
      if (!supportedSources.includes(sourceKey)) {
        // For unsupported sources, just check cache status
        const cacheStatus = await this.getCacheStatus(source);
        isHealthy = cacheStatus.hasCache;
        dataReceived = cacheStatus.hasCache;
        dataSize = cacheStatus.workflowCount || 0;
        if (!isHealthy) {
          error = 'Source not supported for health checks';
        }
      } else {
        // Different health check strategies based on source type
        switch (sourceKey) {
          case 'github':
            try {
              const response = await fetch('https://api.github.com/repos/Zie619/n8n-workflows', {
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'PROM8EUS-HealthCheck'
                }
              });
              statusCode = response.status;
              isHealthy = response.ok;
              
              if (response.ok) {
                const data = await response.json();
                dataReceived = true;
                dataSize = JSON.stringify(data).length;
              } else {
                error = `HTTP ${statusCode}: ${response.statusText}`;
                // Record error for classification
                this.recordSourceError(source, error, { statusCode, source: 'github' });
              }
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              // Record error for classification
              this.recordSourceError(source, error, { source: 'github' });
            }
            break;
          case 'awesome-n8n-templates':
            try {
              const response = await fetch('https://api.github.com/repos/enescingoz/awesome-n8n-templates', {
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'PROM8EUS-HealthCheck'
                }
              });
              statusCode = response.status;
              isHealthy = response.ok;
              if (response.ok) {
                const data = await response.json();
                dataReceived = true;
                dataSize = JSON.stringify(data).length;
              } else {
                error = `HTTP ${statusCode}: ${response.statusText}`;
                this.recordSourceError(source, error, { statusCode, source: 'awesome-n8n-templates' });
              }
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              this.recordSourceError(source, error, { source: 'awesome-n8n-templates' });
            }
            break;
          case 'n8n.io':
            try {
              // Use a more reliable endpoint for n8n.io
              const response = await fetch('https://n8n.io/', {
                method: 'HEAD',
                timeout: 10000
              });
              statusCode = response.status;
              isHealthy = response.ok;
              dataReceived = response.ok;
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              this.recordSourceError(source, error, { source: 'n8n.io' });
            }
            break;
          case 'ai-enhanced':
            try {
              const response = await fetch('https://api.github.com/repos/wassupjay/n8n-free-templates', {
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'PROM8EUS-HealthCheck'
                }
              });
              statusCode = response.status;
              isHealthy = response.ok;
              
              if (response.ok) {
                const data = await response.json();
                dataReceived = true;
                dataSize = JSON.stringify(data).length;
              } else {
                error = `HTTP ${statusCode}: ${response.statusText}`;
                this.recordSourceError(source, error, { statusCode, source: 'ai-enhanced' });
              }
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              this.recordSourceError(source, error, { source: 'ai-enhanced' });
            }
            break;
          case 'hf-spaces':
            try {
              const response = await fetch('https://huggingface.co/api/spaces?limit=1', {
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'PROM8EUS-HealthCheck'
                }
              });
              statusCode = response.status;
              isHealthy = response.ok;
              if (response.ok) {
                const data = await response.json();
                dataReceived = Array.isArray(data) ? data.length >= 0 : true;
                dataSize = JSON.stringify(data).length;
              } else {
                error = `HTTP ${statusCode}: ${response.statusText}`;
                this.recordSourceError(source, error, { statusCode, source: 'hf-spaces' });
              }
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              this.recordSourceError(source, error, { source: 'hf-spaces' });
            }
            break;
          default:
            // Generic health check - try to fetch workflows
            try {
              const { workflows } = await this.searchWorkflows({ source, limit: 1 });
              isHealthy = true;
              dataReceived = workflows.length > 0;
              dataSize = workflows.length;
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              this.recordSourceError(source, error, { source: 'generic' });
            }
        }
      }

      const responseTime = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        source,
        isHealthy,
        responseTime,
        statusCode,
        error,
        timestamp,
        dataReceived,
        dataSize
      };

      // Store in history
      this.addHealthCheckResult(source, result);
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        source,
        isHealthy: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      };
      
      this.addHealthCheckResult(source, result);
      return result;
    }
  }

  /**
   * Add health check result to history
   */
  private addHealthCheckResult(source: string, result: HealthCheckResult): void {
    const history = this.healthCheckHistory.get(source) || [];
    history.push(result);
    
    // Keep only last 100 results per source
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.healthCheckHistory.set(source, history);
  }

  /**
   * Get health status for a source
   */
  async getSourceHealthStatus(source: string): Promise<SourceHealthStatus> {
    const normalizedSource = this.normalizeSourceKey(source);
    if (!normalizedSource) {
      return this.getDefaultHealthStatus(source);
    }

    // Check smart cache first
    const cacheKey = `health_${normalizedSource}`;
    const cached = this.getFromSmartCache<SourceHealthStatus>(cacheKey, normalizedSource);
    if (cached && this.isHealthStatusFresh(cached.lastChecked)) {
      return cached;
    }

    // Perform fresh health check
    const healthCheck = await this.performHealthCheck(normalizedSource);
    const history = this.healthCheckHistory.get(normalizedSource) || [];
    
    // Calculate metrics from recent history (last 24 hours)
    const last24Hours = history.filter(h => 
      new Date(h.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );
    
    const successRate = last24Hours.length > 0 
      ? (last24Hours.filter(h => h.isHealthy).length / last24Hours.length) * 100
      : healthCheck.isHealthy ? 100 : 0;
    
    const avgResponseTime = last24Hours.length > 0
      ? last24Hours.reduce((sum, h) => sum + h.responseTime, 0) / last24Hours.length
      : healthCheck.responseTime;
    
    const errorCount = last24Hours.filter(h => !h.isHealthy).length;
    const lastError = last24Hours.find(h => !h.isHealthy)?.error;
    
    // Calculate health score
    const healthScore = this.calculateHealthScore(successRate, avgResponseTime, errorCount);
    
    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    if (healthScore >= 90) status = 'healthy';
    else if (healthScore >= 70) status = 'degraded';
    else if (healthScore >= 30) status = 'unhealthy';
    else status = 'unknown';

    const healthStatus: SourceHealthStatus = {
      source: normalizedSource,
      status,
      lastChecked: new Date().toISOString(),
      responseTime: avgResponseTime,
      successRate,
      errorCount,
      lastError,
      uptime: successRate,
      healthScore
    };

    // Check for alert conditions
    const newAlerts = this.checkAlertConditions(normalizedSource, healthStatus);
    if (newAlerts.length > 0) {
      console.log(`Generated ${newAlerts.length} alerts for source ${normalizedSource}:`, newAlerts);
    }

    // Cache the result in smart cache
    this.setToSmartCache(cacheKey, healthStatus, normalizedSource);
    
    return healthStatus;
  }

  /**
   * Check if health status is fresh (less than 5 minutes old)
   */
  private isHealthStatusFresh(lastChecked: string): boolean {
    const lastCheckedTime = new Date(lastChecked).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return lastCheckedTime > fiveMinutesAgo;
  }

  /**
   * Calculate health score based on various metrics
   */
  private calculateHealthScore(successRate: number, responseTime: number, errorCount: number): number {
    let score = successRate;
    
    // Penalize slow response times
    if (responseTime > 5000) score -= 20; // Very slow
    else if (responseTime > 2000) score -= 10; // Slow
    else if (responseTime > 1000) score -= 5; // Moderate
    
    // Penalize high error counts
    if (errorCount > 10) score -= 30; // Many errors
    else if (errorCount > 5) score -= 20; // Some errors
    else if (errorCount > 0) score -= 10; // Few errors
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get default health status for unknown sources
   */
  private getDefaultHealthStatus(source: string): SourceHealthStatus {
    return {
      source,
      status: 'unknown',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
      successRate: 0,
      errorCount: 0,
      uptime: 0,
      healthScore: 0
    };
  }

  /**
   * Start automatic health monitoring
   */
  startHealthMonitoring(intervalMinutes: number = 5): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
      for (const source of sources) {
        try {
          await this.getSourceHealthStatus(source);
        } catch (error) {
          console.warn(`Health check failed for source ${source}:`, error);
        }
      }
      
      // Schedule recovery for unhealthy sources
      this.scheduleRecoveryForUnhealthySources();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get all source health statuses
   */
  async getAllSourceHealthStatuses(): Promise<SourceHealthStatus[]> {
    // Only check health for supported sources
    const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
    const statuses: SourceHealthStatus[] = [];
    
    for (const source of sources) {
      try {
        const status = await this.getSourceHealthStatus(source);
        statuses.push(status);
      } catch (error) {
        console.warn(`Failed to get health status for ${source}:`, error);
        statuses.push(this.getDefaultHealthStatus(source));
      }
    }
    
    return statuses;
  }

  /**
   * Initialize error patterns for classification
   */
  private initializeErrorPatterns(): void {
    this.errorPatterns.set('network', /network|connection|dns|timeout|unreachable|refused/i);
    this.errorPatterns.set('authentication', /unauthorized|forbidden|401|403|token|auth|credential/i);
    this.errorPatterns.set('rate_limit', /rate.?limit|429|too.?many.?requests|quota|throttle/i);
    this.errorPatterns.set('server_error', /500|502|503|504|internal.?server|bad.?gateway|service.?unavailable/i);
    this.errorPatterns.set('timeout', /timeout|timed.?out|request.?timeout/i);
    this.errorPatterns.set('data_quality', /invalid.?data|malformed|parse.?error|schema|validation/i);
  }

  /**
   * Classify an error based on error message and context
   */
  private classifyError(error: string, context?: Record<string, any>): ErrorClassification {
    // Initialize patterns if not done
    if (this.errorPatterns.size === 0) {
      this.initializeErrorPatterns();
    }

    const errorLower = error.toLowerCase();
    let type: ErrorClassification['type'] = 'unknown';
    let severity: ErrorClassification['severity'] = 'medium';
    let description = 'Unknown error occurred';
    let suggestedAction = 'Check source configuration and try again';
    let retryable = true;
    let estimatedRecoveryTime: number | undefined;

    // Classify error type
    for (const [errorType, pattern] of this.errorPatterns) {
      if (pattern.test(errorLower)) {
        type = errorType as ErrorClassification['type'];
        break;
      }
    }

    // Determine severity and actions based on type and context
    switch (type) {
      case 'network':
        severity = 'high';
        description = 'Network connectivity issue';
        suggestedAction = 'Check internet connection and source URL accessibility';
        retryable = true;
        estimatedRecoveryTime = 5;
        break;

      case 'authentication':
        severity = 'critical';
        description = 'Authentication or authorization failure';
        suggestedAction = 'Verify API credentials and permissions';
        retryable = false;
        estimatedRecoveryTime = 30;
        break;

      case 'rate_limit':
        severity = 'medium';
        description = 'API rate limit exceeded';
        suggestedAction = 'Wait before retrying or implement exponential backoff';
        retryable = true;
        estimatedRecoveryTime = 15;
        break;

      case 'server_error':
        severity = 'high';
        description = 'Server-side error';
        suggestedAction = 'Source may be temporarily unavailable, retry later';
        retryable = true;
        estimatedRecoveryTime = 10;
        break;

      case 'timeout':
        severity = 'medium';
        description = 'Request timeout';
        suggestedAction = 'Increase timeout settings or check source performance';
        retryable = true;
        estimatedRecoveryTime = 5;
        break;

      case 'data_quality':
        severity = 'low';
        description = 'Data quality or format issue';
        suggestedAction = 'Check data format and validation rules';
        retryable = true;
        estimatedRecoveryTime = 2;
        break;

      default:
        severity = 'medium';
        description = 'Unclassified error';
        suggestedAction = 'Review error details and source configuration';
        retryable = true;
        estimatedRecoveryTime = 10;
    }

    // Adjust severity based on context
    if (context?.statusCode) {
      const statusCode = context.statusCode;
      if (statusCode >= 500) {
        severity = 'high';
      } else if (statusCode === 429) {
        severity = 'medium';
      } else if (statusCode >= 400 && statusCode < 500) {
        severity = 'critical';
      }
    }

    return {
      type,
      severity,
      description,
      suggestedAction,
      retryable,
      estimatedRecoveryTime
    };
  }

  /**
   * Record an error for a source
   */
  recordSourceError(source: string, error: string, context?: Record<string, any>): SourceError {
    const classification = this.classifyError(error, context);
    const sourceError: SourceError = {
      id: `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      timestamp: new Date().toISOString(),
      error,
      classification,
      context,
      resolved: false
    };

    // Add to source errors
    const errors = this.sourceErrors.get(source) || [];
    errors.push(sourceError);
    
    // Keep only last 50 errors per source
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }
    
    this.sourceErrors.set(source, errors);
    
    return sourceError;
  }

  /**
   * Get errors for a specific source
   */
  getSourceErrors(source: string, unresolvedOnly: boolean = false): SourceError[] {
    const errors = this.sourceErrors.get(source) || [];
    return unresolvedOnly ? errors.filter(e => !e.resolved) : errors;
  }

  /**
   * Get all source errors
   */
  getAllSourceErrors(unresolvedOnly: boolean = false): Map<string, SourceError[]> {
    const allErrors = new Map<string, SourceError[]>();
    
    for (const [source, errors] of this.sourceErrors) {
      const filteredErrors = unresolvedOnly ? errors.filter(e => !e.resolved) : errors;
      if (filteredErrors.length > 0) {
        allErrors.set(source, filteredErrors);
      }
    }
    
    return allErrors;
  }

  /**
   * Mark an error as resolved
   */
  resolveSourceError(source: string, errorId: string): boolean {
    const errors = this.sourceErrors.get(source);
    if (!errors) return false;

    const error = errors.find(e => e.id === errorId);
    if (!error) return false;

    error.resolved = true;
    error.resolvedAt = new Date().toISOString();
    return true;
  }

  /**
   * Get error statistics for a source
   */
  getSourceErrorStats(source: string): {
    total: number;
    unresolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    lastError?: SourceError;
  } {
    const errors = this.sourceErrors.get(source) || [];
    const unresolved = errors.filter(e => !e.resolved);
    
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    errors.forEach(error => {
      byType[error.classification.type] = (byType[error.classification.type] || 0) + 1;
      bySeverity[error.classification.severity] = (bySeverity[error.classification.severity] || 0) + 1;
    });
    
    const lastError = errors.length > 0 ? errors[errors.length - 1] : undefined;
    
    return {
      total: errors.length,
      unresolved: unresolved.length,
      byType,
      bySeverity,
      lastError
    };
  }

  /**
   * Auto-resolve old errors (older than 24 hours)
   */
  autoResolveOldErrors(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    for (const [source, errors] of this.sourceErrors) {
      for (const error of errors) {
        if (!error.resolved && new Date(error.timestamp).getTime() < oneDayAgo) {
          error.resolved = true;
          error.resolvedAt = new Date().toISOString();
        }
      }
    }
  }

  /**
   * Create an alert for a source
   */
  private createAlert(
    source: string,
    type: SourceAlert['type'],
    severity: SourceAlert['severity'],
    message: string,
    threshold?: number,
    currentValue?: number
  ): SourceAlert {
    const alert: SourceAlert = {
      id: `${source}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      threshold,
      currentValue
    };

    // Add to source alerts
    const alerts = this.sourceAlerts.get(source) || [];
    alerts.push(alert);
    
    // Keep only last 100 alerts per source
    if (alerts.length > 100) {
      alerts.splice(0, alerts.length - 100);
    }
    
    this.sourceAlerts.set(source, alerts);
    
    // Send notification for new alert
    this.sendNotification(source, alert.id, 'alert_created', severity, message);
    
    return alert;
  }

  /**
   * Check for alert conditions based on health status
   */
  private checkAlertConditions(source: string, healthStatus: SourceHealthStatus): SourceAlert[] {
    const alerts: SourceAlert[] = [];
    const existingAlerts = this.sourceAlerts.get(source) || [];
    
    // Check response time alerts
    if (healthStatus.responseTime > this.alertThresholds.responseTime.critical) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'response_time' && 
        a.severity === 'critical' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'response_time',
          'critical',
          `Response time is critically high: ${Math.round(healthStatus.responseTime)}ms`,
          this.alertThresholds.responseTime.critical,
          healthStatus.responseTime
        ));
      }
    } else if (healthStatus.responseTime > this.alertThresholds.responseTime.warning) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'response_time' && 
        a.severity === 'medium' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'response_time',
          'medium',
          `Response time is high: ${Math.round(healthStatus.responseTime)}ms`,
          this.alertThresholds.responseTime.warning,
          healthStatus.responseTime
        ));
      }
    }

    // Check error rate alerts
    const errorRate = 100 - healthStatus.successRate;
    if (errorRate > this.alertThresholds.errorRate.critical) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'error_rate' && 
        a.severity === 'critical' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'error_rate',
          'critical',
          `Error rate is critically high: ${Math.round(errorRate)}%`,
          this.alertThresholds.errorRate.critical,
          errorRate
        ));
      }
    } else if (errorRate > this.alertThresholds.errorRate.warning) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'error_rate' && 
        a.severity === 'medium' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'error_rate',
          'medium',
          `Error rate is high: ${Math.round(errorRate)}%`,
          this.alertThresholds.errorRate.warning,
          errorRate
        ));
      }
    }

    // Check health score alerts
    if (healthStatus.healthScore < this.alertThresholds.healthScore.critical) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'health_degradation' && 
        a.severity === 'critical' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'health_degradation',
          'critical',
          `Health score is critically low: ${healthStatus.healthScore}/100`,
          this.alertThresholds.healthScore.critical,
          healthStatus.healthScore
        ));
      }
    } else if (healthStatus.healthScore < this.alertThresholds.healthScore.warning) {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'health_degradation' && 
        a.severity === 'medium' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'health_degradation',
          'medium',
          `Health score is low: ${healthStatus.healthScore}/100`,
          this.alertThresholds.healthScore.warning,
          healthStatus.healthScore
        ));
      }
    }

    // Check for source down alerts
    if (healthStatus.status === 'unhealthy' || healthStatus.status === 'unknown') {
      const hasActiveAlert = existingAlerts.some(a => 
        a.type === 'source_down' && 
        !a.resolved
      );
      
      if (!hasActiveAlert) {
        alerts.push(this.createAlert(
          source,
          'source_down',
          'critical',
          `Source is ${healthStatus.status}: ${healthStatus.lastError || 'Unknown error'}`,
          undefined,
          healthStatus.healthScore
        ));
      }
    }

    return alerts;
  }

  /**
   * Get alerts for a specific source
   */
  getSourceAlerts(source: string, unresolvedOnly: boolean = false): SourceAlert[] {
    const alerts = this.sourceAlerts.get(source) || [];
    return unresolvedOnly ? alerts.filter(a => !a.resolved) : alerts;
  }

  /**
   * Get all source alerts
   */
  getAllSourceAlerts(unresolvedOnly: boolean = false): Map<string, SourceAlert[]> {
    const allAlerts = new Map<string, SourceAlert[]>();
    
    for (const [source, alerts] of this.sourceAlerts) {
      const filteredAlerts = unresolvedOnly ? alerts.filter(a => !a.resolved) : alerts;
      if (filteredAlerts.length > 0) {
        allAlerts.set(source, filteredAlerts);
      }
    }
    
    return allAlerts;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(source: string, alertId: string, acknowledgedBy?: string): boolean {
    const alerts = this.sourceAlerts.get(source);
    if (!alerts) return false;

    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = acknowledgedBy;
    return true;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(source: string, alertId: string): boolean {
    const alerts = this.sourceAlerts.get(source);
    if (!alerts) return false;

    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();
    
    // Send notification for resolved alert
    this.sendNotification(source, alertId, 'alert_resolved', alert.severity, `Alert resolved: ${alert.message}`);
    
    return true;
  }

  /**
   * Update alert thresholds
   */
  updateAlertThresholds(thresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    total: number;
    unresolved: number;
    unacknowledged: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    let total = 0;
    let unresolved = 0;
    let unacknowledged = 0;
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const alerts of this.sourceAlerts.values()) {
      for (const alert of alerts) {
        total++;
        if (!alert.resolved) unresolved++;
        if (!alert.acknowledged) unacknowledged++;
        
        byType[alert.type] = (byType[alert.type] || 0) + 1;
        bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      }
    }

    return {
      total,
      unresolved,
      unacknowledged,
      byType,
      bySeverity
    };
  }

  /**
   * Send notification for source issues
   */
  private async sendNotification(
    source: string,
    alertId: string,
    type: Notification['type'],
    severity: Notification['severity'],
    message: string
  ): Promise<void> {
    if (!this.notificationConfig.enabled) return;
    if (!this.notificationConfig.severityFilter.includes(severity)) return;

    // Check cooldown and rate limiting
    if (!this.canSendNotification(source, severity)) return;

    const notification: Notification = {
      id: `${source}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      alertId,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      sent: false,
      channel: 'browser'
    };

    // Send through configured channels
    for (const channel of this.notificationConfig.channels) {
      try {
        await this.sendNotificationToChannel(notification, channel);
        notification.sent = true;
        notification.sentAt = new Date().toISOString();
      } catch (error) {
        console.warn(`Failed to send notification to ${channel}:`, error);
      }
    }

    // Store notification
    const notifications = this.notifications.get(source) || [];
    notifications.push(notification);
    if (notifications.length > 50) {
      notifications.splice(0, notifications.length - 50);
    }
    this.notifications.set(source, notifications);

    // Update notification history for rate limiting
    this.updateNotificationHistory(source, severity);
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotificationToChannel(notification: Notification, channel: string): Promise<void> {
    switch (channel) {
      case 'console':
        const emoji = notification.severity === 'critical' ? '🚨' : 
                     notification.severity === 'high' ? '⚠️' : 
                     notification.severity === 'medium' ? '⚡' : 'ℹ️';
        console.log(`${emoji} [${notification.source}] ${notification.message}`);
        break;

      case 'browser':
        // Dispatch browser notification event
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(`PROM8EUS Source Alert`, {
              body: `[${notification.source}] ${notification.message}`,
              icon: '/favicon.ico',
              tag: notification.id
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification(`PROM8EUS Source Alert`, {
                  body: `[${notification.source}] ${notification.message}`,
                  icon: '/favicon.ico',
                  tag: notification.id
                });
              }
            });
          }
        }
        
        // Dispatch custom event for UI components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sourceAlert', {
            detail: notification
          }));
        }
        break;

      case 'api':
        // Future: Send to external API/webhook
        console.log(`API notification: [${notification.source}] ${notification.message}`);
        break;
    }
  }

  /**
   * Check if notification can be sent (cooldown and rate limiting)
   */
  private canSendNotification(source: string, severity: string): boolean {
    const now = new Date();
    const key = `${source}_${severity}`;
    const history = this.notificationHistory.get(key) || [];

    // Check cooldown
    const cooldownMs = this.notificationConfig.cooldownMinutes * 60 * 1000;
    const lastNotification = history[history.length - 1];
    if (lastNotification && (now.getTime() - lastNotification.getTime()) < cooldownMs) {
      return false;
    }

    // Check rate limiting (max notifications per hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentNotifications = history.filter(date => date > oneHourAgo);
    if (recentNotifications.length >= this.notificationConfig.maxNotificationsPerHour) {
      return false;
    }

    return true;
  }

  /**
   * Update notification history for rate limiting
   */
  private updateNotificationHistory(source: string, severity: string): void {
    const key = `${source}_${severity}`;
    const history = this.notificationHistory.get(key) || [];
    history.push(new Date());
    
    // Keep only last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(date => date > oneDayAgo);
    
    this.notificationHistory.set(key, filteredHistory);
  }

  /**
   * Update notification configuration
   */
  updateNotificationConfig(config: Partial<NotificationConfig>): void {
    this.notificationConfig = { ...this.notificationConfig, ...config };
  }

  /**
   * Get notifications for a source
   */
  getSourceNotifications(source: string, limit: number = 10): Notification[] {
    const notifications = this.notifications.get(source) || [];
    return notifications.slice(-limit).reverse();
  }

  /**
   * Get all notifications
   */
  getAllNotifications(limit: number = 50): Notification[] {
    const allNotifications: Notification[] = [];
    for (const notifications of this.notifications.values()) {
      allNotifications.push(...notifications);
    }
    return allNotifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): boolean {
    for (const notifications of this.notifications.values()) {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.sent = true;
        notification.sentAt = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  /**
   * Clear old notifications (older than 7 days)
   */
  clearOldNotifications(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const [source, notifications] of this.notifications) {
      const filteredNotifications = notifications.filter(n => 
        new Date(n.timestamp) > sevenDaysAgo
      );
      this.notifications.set(source, filteredNotifications);
    }
  }

  /**
   * Attempt automatic recovery for a failed source
   */
  async attemptSourceRecovery(source: string): Promise<boolean> {
    if (!this.recoveryConfig.autoRecoveryEnabled) return false;

    const recoveryInfo = this.recoveryAttempts.get(source);
    const now = new Date();

    // Check if we should attempt recovery
    if (recoveryInfo) {
      if (recoveryInfo.count >= this.recoveryConfig.maxAttempts) {
        console.log(`Max recovery attempts reached for source ${source}`);
        return false;
      }

      if (recoveryInfo.nextAttempt && now < recoveryInfo.nextAttempt) {
        console.log(`Recovery attempt for ${source} scheduled for later`);
        return false;
      }
    }

    console.log(`Attempting recovery for source ${source}...`);

    try {
      // Perform recovery actions based on source type
      const recovered = await this.performRecoveryActions(source);
      
      if (recovered) {
        console.log(`Successfully recovered source ${source}`);
        
        // Send recovery notification
        this.sendNotification(source, '', 'source_recovered', 'medium', `Source ${source} has been automatically recovered`);
        
        // Reset recovery attempts
        this.recoveryAttempts.delete(source);
        
        // Clear health cache to force fresh check
        this.sourceHealthCache.delete(source);
        
        return true;
      } else {
        // Update recovery attempts
        this.updateRecoveryAttempts(source);
        return false;
      }
    } catch (error) {
      console.error(`Recovery attempt failed for source ${source}:`, error);
      this.updateRecoveryAttempts(source);
      return false;
    }
  }

  /**
   * Perform specific recovery actions for a source
   */
  private async performRecoveryActions(source: string): Promise<boolean> {
    switch (source.toLowerCase()) {
      case 'github':
        return await this.recoverGitHubSource();
      case 'n8n.io':
        return await this.recoverN8nSource();
      case 'ai-enhanced':
        return await this.recoverAIEnhancedSource();
      default:
        return await this.recoverGenericSource(source);
    }
  }

  /**
   * Recover GitHub source
   */
  private async recoverGitHubSource(): Promise<boolean> {
    try {
      // Try with different endpoints or retry with backoff
      const response = await fetch('https://api.github.com/repos/Zie619/n8n-workflows', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PROM8EUS-Recovery'
        },
        timeout: 10000
      });
      
      return response.ok;
    } catch (error) {
      console.warn('GitHub recovery attempt failed:', error);
      return false;
    }
  }

  /**
   * Recover n8n source
   */
  private async recoverN8nSource(): Promise<boolean> {
    try {
      // Try alternative endpoints or retry
      const response = await fetch('https://n8n.io/api/workflows', {
        method: 'HEAD',
        timeout: 15000 // Longer timeout for recovery
      });
      
      return response.ok;
    } catch (error) {
      console.warn('n8n recovery attempt failed:', error);
      return false;
    }
  }

  /**
   * Recover AI-Enhanced source
   */
  private async recoverAIEnhancedSource(): Promise<boolean> {
    try {
      const response = await fetch('https://github.com/wassupjay/n8n-free-templates', {
        method: 'HEAD',
        timeout: 15000
      });
      
      return response.ok;
    } catch (error) {
      console.warn('AI-Enhanced recovery attempt failed:', error);
      return false;
    }
  }

  /**
   * Recover generic source
   */
  private async recoverGenericSource(source: string): Promise<boolean> {
    try {
      // Try to fetch workflows with retry
      const { workflows } = await this.searchWorkflows({ source, limit: 1 });
      return workflows.length >= 0; // Even empty result is considered success
    } catch (error) {
      console.warn(`Generic recovery attempt failed for ${source}:`, error);
      return false;
    }
  }

  /**
   * Update recovery attempts tracking
   */
  private updateRecoveryAttempts(source: string): void {
    const current = this.recoveryAttempts.get(source) || { count: 0, lastAttempt: new Date() };
    const nextCount = current.count + 1;
    
    let nextAttempt: Date | undefined;
    if (nextCount < this.recoveryConfig.maxAttempts) {
      const delayMinutes = this.recoveryConfig.exponentialBackoff 
        ? this.recoveryConfig.retryDelayMinutes * Math.pow(2, current.count)
        : this.recoveryConfig.retryDelayMinutes;
      
      nextAttempt = new Date(Date.now() + delayMinutes * 60 * 1000);
    }
    
    this.recoveryAttempts.set(source, {
      count: nextCount,
      lastAttempt: new Date(),
      nextAttempt
    });
  }

  /**
   * Schedule automatic recovery for unhealthy sources
   */
  scheduleRecoveryForUnhealthySources(): void {
    if (!this.recoveryConfig.autoRecoveryEnabled) return;

    // Check all sources and schedule recovery for unhealthy ones
    const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
    
    sources.forEach(async (source) => {
      try {
        const healthStatus = await this.getSourceHealthStatus(source);
        
        if (healthStatus.status === 'unhealthy' || healthStatus.status === 'unknown') {
          // Check if we should attempt recovery
          const recoveryInfo = this.recoveryAttempts.get(source);
          const now = new Date();
          
          if (!recoveryInfo || 
              (recoveryInfo.count < this.recoveryConfig.maxAttempts && 
               (!recoveryInfo.nextAttempt || now >= recoveryInfo.nextAttempt))) {
            
            // Schedule recovery attempt
            setTimeout(() => {
              this.attemptSourceRecovery(source);
            }, 1000); // Small delay to avoid overwhelming
          }
        }
      } catch (error) {
        console.warn(`Failed to check health status for ${source} during recovery scheduling:`, error);
      }
    });
  }

  /**
   * Get recovery status for a source
   */
  getRecoveryStatus(source: string): {
    attempts: number;
    lastAttempt?: Date;
    nextAttempt?: Date;
    canRecover: boolean;
  } {
    const recoveryInfo = this.recoveryAttempts.get(source);
    
    if (!recoveryInfo) {
      return {
        attempts: 0,
        canRecover: true
      };
    }
    
    return {
      attempts: recoveryInfo.count,
      lastAttempt: recoveryInfo.lastAttempt,
      nextAttempt: recoveryInfo.nextAttempt,
      canRecover: recoveryInfo.count < this.recoveryConfig.maxAttempts
    };
  }

  /**
   * Update recovery configuration
   */
  updateRecoveryConfig(config: Partial<typeof this.recoveryConfig>): void {
    this.recoveryConfig = { ...this.recoveryConfig, ...config };
  }

  /**
   * Reset recovery attempts for a source
   */
  resetRecoveryAttempts(source: string): void {
    this.recoveryAttempts.delete(source);
  }

  /**
   * Smart cache get with TTL validation and dynamic expiration
   */
  private getFromSmartCache<T>(key: string, source?: string): T | null {
    const startTime = Date.now();
    const entry = this.smartCache.get(key);
    
    if (!entry) {
      this.cacheStats.misses++;
      this.updateCacheStats();
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;
    const dynamicTTL = this.calculateDynamicTTL(entry, source);
    
    // Check if entry is expired
    if (age > dynamicTTL) {
      this.smartCache.delete(key);
      this.cacheStats.misses++;
      this.updateCacheStats();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.cacheStats.hits++;
    this.cacheStats.averageAccessTime = (this.cacheStats.averageAccessTime + (Date.now() - startTime)) / 2;
    this.updateCacheStats();
    
    // Decompress if needed
    if (entry.compressed) {
      try {
        return this.decompressData(entry.data);
      } catch (error) {
        console.warn('Failed to decompress cached data:', error);
        this.smartCache.delete(key);
        this.cacheStats.misses++;
        return null;
      }
    }
    
    return entry.data;
  }

  /**
   * Smart cache set with compression and size management
   */
  private setToSmartCache<T>(key: string, data: T, source?: string, customTTL?: number): void {
    const now = Date.now();
    const ttl = customTTL || this.getTTLForSource(source);
    
    // Compress data if enabled and data is large enough
    let processedData = data;
    let compressed = false;
    
    if (this.cacheConfig.compressionEnabled && this.shouldCompress(data)) {
      try {
        processedData = this.compressData(data);
        compressed = true;
      } catch (error) {
        console.warn('Failed to compress data, storing uncompressed:', error);
      }
    }
    
    const entry: CacheEntry<T> = {
      data: processedData,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
      source: source || 'unknown',
      version: this.cacheVersion,
      compressed
    };
    
    // Check cache size limit
    if (this.smartCache.size >= this.cacheConfig.maxSize) {
      this.evictLeastUsedEntry();
    }
    
    this.smartCache.set(key, entry);
    this.cacheStats.size = this.smartCache.size;
    this.updateCacheStats();
  }

  /**
   * Calculate dynamic TTL based on access patterns and source
   */
  private calculateDynamicTTL(entry: CacheEntry<any>, source?: string): number {
    if (!this.cacheConfig.dynamicTTL) {
      return entry.ttl;
    }
    
    let baseTTL = entry.ttl;
    
    // Access-based TTL extension
    if (this.cacheConfig.accessBasedTTL && entry.accessCount > 0) {
      const accessBonus = Math.min(entry.accessCount * 0.1, 0.5); // Max 50% bonus
      baseTTL = baseTTL * (1 + accessBonus);
    }
    
    // Source-specific adjustments
    if (source && this.cacheConfig.sourceSpecificTTL[source]) {
      const sourceTTL = this.cacheConfig.sourceSpecificTTL[source];
      baseTTL = Math.min(baseTTL, sourceTTL);
    }
    
    // Recent access bonus
    const timeSinceLastAccess = Date.now() - entry.lastAccessed;
    if (timeSinceLastAccess < 60000) { // Accessed within last minute
      baseTTL = baseTTL * 1.2; // 20% bonus
    }
    
    return Math.round(baseTTL);
  }

  /**
   * Get TTL for specific source
   */
  private getTTLForSource(source?: string): number {
    if (source && this.cacheConfig.sourceSpecificTTL[source]) {
      return this.cacheConfig.sourceSpecificTTL[source];
    }
    return this.cacheConfig.defaultTTL;
  }

  /**
   * Check if data should be compressed
   */
  private shouldCompress(data: any): boolean {
    const serialized = JSON.stringify(data);
    return serialized.length > 1024; // Compress if larger than 1KB
  }

  /**
   * Compress data using simple string compression
   */
  private compressData(data: any): string {
    const serialized = JSON.stringify(data);
    // Simple compression using built-in methods
    return btoa(serialized);
  }

  /**
   * Decompress data
   */
  private decompressData(compressedData: string): any {
    const decompressed = atob(compressedData);
    return JSON.parse(decompressed);
  }

  /**
   * Evict least used cache entry
   */
  private evictLeastUsedEntry(): void {
    let leastUsedKey = '';
    let leastUsedScore = Infinity;
    
    for (const [key, entry] of this.smartCache) {
      // Calculate usage score (lower is better for eviction)
      const age = Date.now() - entry.timestamp;
      const timeSinceAccess = Date.now() - entry.lastAccessed;
      const score = (age / 1000) + (timeSinceAccess / 1000) - (entry.accessCount * 10);
      
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.smartCache.delete(leastUsedKey);
      this.cacheStats.evictions++;
    }
  }

  /**
   * Update cache statistics
   */
  private updateCacheStats(): void {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.cacheStats.hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;
    this.cacheStats.size = this.smartCache.size;
    this.cacheStats.entryCount = this.smartCache.size;
    this.cacheStats.totalEntries = this.smartCache.size;
    this.cacheStats.totalSize = this.calculateCacheTotalSize();
    this.cacheStats.lastUpdated = new Date().toISOString();
  }

  private calculateCacheTotalSize(): number {
    let totalSize = 0;

    for (const entry of this.smartCache.values()) {
      totalSize += this.estimateEntrySize(entry);
    }

    return totalSize;
  }

  private estimateEntrySize(entry: CacheEntry<any>): number {
    const encoder = this.textEncoder;
    const { data } = entry;

    try {
      if (typeof data === 'string') {
        return encoder ? encoder.encode(data).length : data.length;
      }

      if (typeof ArrayBuffer !== 'undefined') {
        if (data instanceof ArrayBuffer) {
          return data.byteLength;
        }

        if (ArrayBuffer.isView(data)) {
          return data.byteLength;
        }
      }

      if (typeof Blob !== 'undefined' && data instanceof Blob) {
        return data.size;
      }

      const serialized = JSON.stringify(data);
      return encoder ? encoder.encode(serialized).length : serialized.length;
    } catch (error) {
      console.warn('Failed to estimate cache entry size:', error);
      return 0;
    }
  }

  /**
   * Start cache cleanup process
   */
  startCacheCleanup(intervalMinutes: number = 1): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop cache cleanup process
   */
  stopCacheCleanup(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.smartCache) {
      const age = now - entry.timestamp;
      const dynamicTTL = this.calculateDynamicTTL(entry, entry.source);
      
      if (age > dynamicTTL) {
        this.smartCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
      this.updateCacheStats();
    }
  }

  /**
   * Clear cache for specific source
   */
  clearCacheForSource(source: string): void {
    let clearedCount = 0;
    
    for (const [key, entry] of this.smartCache) {
      if (entry.source === source) {
        this.smartCache.delete(key);
        clearedCount++;
      }
    }
    
    console.log(`Cleared ${clearedCount} cache entries for source ${source}`);
    this.updateCacheStats();
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    const size = this.smartCache.size;
    this.smartCache.clear();
    this.updateCacheStats();
    console.log(`Cleared all ${size} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    this.updateCacheStats();
    return { ...this.cacheStats };
  }

  /**
   * Update cache configuration
   */
  updateCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }

  /**
   * Get cache entry info
   */
  getCacheEntryInfo(key: string): {
    exists: boolean;
    age: number;
    ttl: number;
    accessCount: number;
    source: string;
    compressed: boolean;
  } | null {
    const entry = this.smartCache.get(key);
    if (!entry) return null;
    
    return {
      exists: true,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      accessCount: entry.accessCount,
      source: entry.source,
      compressed: entry.compressed || false
    };
  }

  /**
   * Start incremental update process
   */
  startIncrementalUpdates(): void {
    if (!this.incrementalUpdateConfig.enabled) return;
    
    if (this.incrementalUpdateInterval) {
      clearInterval(this.incrementalUpdateInterval);
    }
    
    this.incrementalUpdateInterval = setInterval(() => {
      this.performIncrementalUpdates();
    }, this.incrementalUpdateConfig.updateInterval);
  }

  /**
   * Stop incremental update process
   */
  stopIncrementalUpdates(): void {
    if (this.incrementalUpdateInterval) {
      clearInterval(this.incrementalUpdateInterval);
      this.incrementalUpdateInterval = null;
    }
  }

  /**
   * Perform incremental updates for all sources
   */
  private async performIncrementalUpdates(): Promise<void> {
    const sources = ['github', 'awesome-n8n-templates', 'n8n.io', 'ai-enhanced'];
    
    for (const source of sources) {
      if (this.updateInProgress.has(source)) {
        continue; // Skip if update already in progress
      }
      
      try {
        await this.performIncrementalUpdateForSource(source);
      } catch (error) {
        console.warn(`Incremental update failed for source ${source}:`, error);
      }
    }
  }

  /**
   * Perform incremental update for a specific source
   */
  private async performIncrementalUpdateForSource(source: string): Promise<void> {
    this.updateInProgress.add(source);
    
    try {
      const lastUpdate = this.lastUpdateTimestamps.get(source) || 0;
      const now = Date.now();
      
      // Check if enough time has passed since last update
      if (now - lastUpdate < this.incrementalUpdateConfig.updateInterval) {
        return;
      }
      
      console.log(`Performing incremental update for source: ${source}`);
      
      // Get current cached data
      const cacheKey = `workflows_${source}`;
      const cachedWorkflows = this.getFromSmartCache<WorkflowIndex[]>(cacheKey, source) || [];
      
      // Fetch fresh data
      const freshData = await this.fetchWorkflowsForSource(source);
      
      if (this.incrementalUpdateConfig.deltaDetection) {
        // Calculate delta
        const delta = this.calculateUpdateDelta(cachedWorkflows, freshData);
        
        // Check if changes are significant enough for full update
        if (delta.changePercentage > this.incrementalUpdateConfig.changeThreshold) {
          console.log(`Significant changes detected (${delta.changePercentage}%), performing full update for ${source}`);
          await this.performFullUpdateForSource(source, freshData);
        } else {
          // Apply incremental changes
          await this.applyIncrementalChanges(source, delta, cachedWorkflows);
        }
      } else {
        // No delta detection, perform full update
        await this.performFullUpdateForSource(source, freshData);
      }
      
      // Update timestamp
      this.lastUpdateTimestamps.set(source, now);
      
    } finally {
      this.updateInProgress.delete(source);
    }
  }

  /**
   * Fetch workflows for a specific source
   */
  private async fetchWorkflowsForSource(source: string): Promise<WorkflowIndex[]> {
    try {
      const { workflows } = await this.searchWorkflows({ source, limit: 1000 });
      return workflows;
    } catch (error) {
      console.warn(`Failed to fetch workflows for source ${source}:`, error);
      return [];
    }
  }

  /**
   * Calculate update delta between old and new data
   */
  private calculateUpdateDelta(oldData: WorkflowIndex[], newData: WorkflowIndex[]): UpdateDelta {
    const oldMap = new Map(oldData.map(item => [item.id, item]));
    const newMap = new Map(newData.map(item => [item.id, item]));
    
    const added: WorkflowIndex[] = [];
    const modified: WorkflowIndex[] = [];
    const removed: WorkflowIndex[] = [];
    const unchanged: WorkflowIndex[] = [];
    
    // Find added and modified items
    for (const [id, newItem] of newMap) {
      const oldItem = oldMap.get(id);
      if (!oldItem) {
        added.push(newItem);
      } else if (this.hasItemChanged(oldItem, newItem)) {
        modified.push(newItem);
      } else {
        unchanged.push(newItem);
      }
    }
    
    // Find removed items
    for (const [id, oldItem] of oldMap) {
      if (!newMap.has(id)) {
        removed.push(oldItem);
      }
    }
    
    const totalChanges = added.length + modified.length + removed.length;
    const totalItems = Math.max(oldData.length, newData.length);
    const changePercentage = totalItems > 0 ? (totalChanges / totalItems) * 100 : 0;
    
    return {
      added,
      modified,
      removed,
      unchanged,
      totalChanges,
      changePercentage
    };
  }

  /**
   * Check if an item has changed
   */
  private hasItemChanged(oldItem: WorkflowIndex, newItem: WorkflowIndex): boolean {
    // Compare key fields that indicate changes
    const fieldsToCompare = ['name', 'description', 'lastModified', 'nodeCount', 'active', 'tags'];
    
    for (const field of fieldsToCompare) {
      if (oldItem[field as keyof WorkflowIndex] !== newItem[field as keyof WorkflowIndex]) {
        return true;
      }
    }
    
    // Compare arrays
    if (JSON.stringify(oldItem.integrations) !== JSON.stringify(newItem.integrations)) {
      return true;
    }
    
    return false;
  }

  /**
   * Apply incremental changes to cached data
   */
  private async applyIncrementalChanges(
    source: string, 
    delta: UpdateDelta, 
    cachedWorkflows: WorkflowIndex[]
  ): Promise<void> {
    console.log(`Applying incremental changes for ${source}: +${delta.added.length} ~${delta.modified.length} -${delta.removed.length}`);
    
    // Create updated workflow list
    const updatedWorkflows = [...cachedWorkflows];
    
    // Remove deleted items
    const removedIds = new Set(delta.removed.map(item => item.id));
    const filteredWorkflows = updatedWorkflows.filter(item => !removedIds.has(item.id));
    
    // Add new items
    filteredWorkflows.push(...delta.added);
    
    // Update modified items
    const modifiedMap = new Map(delta.modified.map(item => [item.id, item]));
    const finalWorkflows = filteredWorkflows.map(item => 
      modifiedMap.has(item.id) ? modifiedMap.get(item.id)! : item
    );
    
    // Update cache
    const cacheKey = `workflows_${source}`;
    this.setToSmartCache(cacheKey, finalWorkflows, source);
    
    // Update stats if needed
    if (delta.added.length > 0 || delta.removed.length > 0) {
      await this.loadWorkflowStats(source);
    }
  }

  /**
   * Perform full update for a source
   */
  private async performFullUpdateForSource(source: string, freshData: WorkflowIndex[]): Promise<void> {
    console.log(`Performing full update for source: ${source}`);
    
    // Update cache with fresh data
    const cacheKey = `workflows_${source}`;
    this.setToSmartCache(cacheKey, freshData, source);
    
    // Update stats
    await this.loadWorkflowStats(source);
  }

  /**
   * Force incremental update for a specific source
   */
  async forceIncrementalUpdate(source: string): Promise<void> {
    if (this.updateInProgress.has(source)) {
      console.log(`Update already in progress for source: ${source}`);
      return;
    }
    
    await this.performIncrementalUpdateForSource(source);
  }

  /**
   * Get incremental update status
   */
  getIncrementalUpdateStatus(): {
    enabled: boolean;
    sourcesInProgress: string[];
    lastUpdates: Record<string, number>;
    config: IncrementalUpdateConfig;
  } {
    const lastUpdates: Record<string, number> = {};
    for (const [source, timestamp] of this.lastUpdateTimestamps) {
      lastUpdates[source] = timestamp;
    }
    
    return {
      enabled: this.incrementalUpdateConfig.enabled,
      sourcesInProgress: Array.from(this.updateInProgress),
      lastUpdates,
      config: { ...this.incrementalUpdateConfig }
    };
  }

  /**
   * Update incremental update configuration
   */
  updateIncrementalUpdateConfig(config: Partial<IncrementalUpdateConfig>): void {
    this.incrementalUpdateConfig = { ...this.incrementalUpdateConfig, ...config };
    
    // Restart incremental updates if interval changed
    if (config.updateInterval && this.incrementalUpdateInterval) {
      this.startIncrementalUpdates();
    }
  }

  /**
   * Check cache entry version compatibility
   */
  private isCacheEntryCompatible(entry: CacheEntry<any>): boolean {
    return entry.version === this.cacheVersion;
  }

  /**
   * Migrate cache entry to current version
   */
  private migrateCacheEntry(entry: CacheEntry<any>): CacheEntry<any> | null {
    try {
      // Handle version migrations
      if (entry.version === '1.0.0') {
        // Current version, no migration needed
        return entry;
      }
      
      // Add migration logic for future versions
      console.log(`Migrating cache entry from version ${entry.version} to ${this.cacheVersion}`);
      
      // For now, just update the version
      return {
        ...entry,
        version: this.cacheVersion
      };
    } catch (error) {
      console.warn('Failed to migrate cache entry:', error);
      return null;
    }
  }

  /**
   * Update cache version and invalidate incompatible entries
   */
  updateCacheVersion(newVersion: string): void {
    const oldVersion = this.cacheVersion;
    this.cacheVersion = newVersion;
    
    console.log(`Updating cache version from ${oldVersion} to ${newVersion}`);
    
    // Check all cache entries for compatibility
    const incompatibleKeys: string[] = [];
    
    for (const [key, entry] of this.smartCache) {
      if (!this.isCacheEntryCompatible(entry)) {
        const migrated = this.migrateCacheEntry(entry);
        if (migrated) {
          this.smartCache.set(key, migrated);
        } else {
          incompatibleKeys.push(key);
        }
      }
    }
    
    // Remove incompatible entries that couldn't be migrated
    for (const key of incompatibleKeys) {
      this.smartCache.delete(key);
    }
    
    if (incompatibleKeys.length > 0) {
      console.log(`Removed ${incompatibleKeys.length} incompatible cache entries`);
    }
    
    this.updateCacheStats();
  }

  /**
   * Get current cache version
   */
  getCacheVersion(): string {
    return this.cacheVersion;
  }

  /**
   * Set schema version for a specific data type
   */
  setSchemaVersion(dataType: string, version: string): void {
    this.schemaVersions.set(dataType, version);
  }

  /**
   * Get schema version for a specific data type
   */
  getSchemaVersion(dataType: string): string | undefined {
    return this.schemaVersions.get(dataType);
  }

  /**
   * Check if cache entry schema is compatible
   */
  private isSchemaCompatible(entry: CacheEntry<any>, dataType: string): boolean {
    const expectedVersion = this.schemaVersions.get(dataType);
    if (!expectedVersion) return true; // No schema version set, assume compatible
    
    // Check if entry has schema version info
    const entrySchemaVersion = (entry.data as any)?.schemaVersion;
    return entrySchemaVersion === expectedVersion;
  }

  /**
   * Validate and clean cache entries based on schema versions
   */
  validateCacheSchemaCompatibility(): void {
    let cleanedCount = 0;
    
    for (const [key, entry] of this.smartCache) {
      // Determine data type from key
      const dataType = this.getDataTypeFromKey(key);
      
      if (dataType && !this.isSchemaCompatible(entry, dataType)) {
        console.log(`Removing incompatible schema entry: ${key}`);
        this.smartCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} schema-incompatible cache entries`);
      this.updateCacheStats();
    }
  }

  /**
   * Get data type from cache key
   */
  private getDataTypeFromKey(key: string): string | null {
    if (key.startsWith('quality_')) return 'quality';
    if (key.startsWith('health_')) return 'health';
    if (key.startsWith('workflows_')) return 'workflows';
    if (key.startsWith('stats_')) return 'stats';
    return null;
  }

  /**
   * Get cache versioning information
   */
  getCacheVersioningInfo(): {
    currentVersion: string;
    schemaVersions: Record<string, string>;
    totalEntries: number;
    compatibleEntries: number;
    incompatibleEntries: number;
  } {
    let compatibleEntries = 0;
    let incompatibleEntries = 0;
    
    for (const entry of this.smartCache.values()) {
      if (this.isCacheEntryCompatible(entry)) {
        compatibleEntries++;
      } else {
        incompatibleEntries++;
      }
    }
    
    const schemaVersions: Record<string, string> = {};
    for (const [dataType, version] of this.schemaVersions) {
      schemaVersions[dataType] = version;
    }
    
    return {
      currentVersion: this.cacheVersion,
      schemaVersions,
      totalEntries: this.smartCache.size,
      compatibleEntries,
      incompatibleEntries
    };
  }
}

// Export singleton instance
export const workflowIndexer = new WorkflowIndexer();
