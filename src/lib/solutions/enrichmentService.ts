import { supabase } from '../supabase';
import { openaiClient } from '../openai';
import { SolutionIndex, WorkflowIndex, AgentIndex } from './schemas/workflowIndex';

export interface EnrichmentResult {
  success: boolean;
  solution: SolutionIndex;
  enrichment_type: 'summary' | 'categories' | 'capabilities' | 'domains';
  content_hash: string;
  llm_response?: any;
  error?: string;
  processing_time_ms: number;
  cached: boolean;
}

export interface EnrichmentCache {
  id: string;
  content_hash: string;
  enrichment_type: string;
  solution_id: string;
  solution_type: 'workflow' | 'agent';
  result: any;
  llm_model: string;
  llm_tokens_used: number;
  processing_time_ms: number;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentLog {
  id: string;
  solution_id: string;
  solution_type: 'workflow' | 'agent';
  enrichment_type: string;
  status: 'success' | 'error' | 'cached' | 'skipped';
  content_hash: string;
  processing_time_ms: number;
  llm_tokens_used?: number;
  error_message?: string;
  created_at: string;
}

export class EnrichmentService {
  private static readonly CACHE_TABLE = 'enrichment_cache';
  private static readonly LOGS_TABLE = 'enrichment_logs';
  private static readonly LLM_MODEL = 'gpt-4o-mini';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  /**
   * Generate content hash for caching
   */
  private static generateContentHash(
    solutionId: string,
    solutionType: 'workflow' | 'agent',
    enrichmentType: string,
    content: string
  ): string {
    const crypto = require('crypto');
    const hashInput = `${solutionId}:${solutionType}:${enrichmentType}:${content}`;
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Check if enrichment result is cached
   */
  private static async getCachedEnrichment(
    contentHash: string,
    enrichmentType: string
  ): Promise<EnrichmentCache | null> {
    try {
      const { data, error } = await supabase
        .from(this.CACHE_TABLE)
        .select('*')
        .eq('content_hash', contentHash)
        .eq('enrichment_type', enrichmentType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching cached enrichment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCachedEnrichment:', error);
      return null;
    }
  }

  /**
   * Cache enrichment result
   */
  private static async cacheEnrichment(
    contentHash: string,
    enrichmentType: string,
    solutionId: string,
    solutionType: 'workflow' | 'agent',
    result: any,
    llmTokensUsed: number,
    processingTimeMs: number
  ): Promise<void> {
    try {
      await supabase
        .from(this.CACHE_TABLE)
        .upsert({
          content_hash: contentHash,
          enrichment_type: enrichmentType,
          solution_id: solutionId,
          solution_type: solutionType,
          result,
          llm_model: this.LLM_MODEL,
          llm_tokens_used: llmTokensUsed,
          processing_time_ms: processingTimeMs,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'content_hash,enrichment_type'
        });
    } catch (error) {
      console.error('Error caching enrichment result:', error);
    }
  }

  /**
   * Log enrichment activity
   */
  private static async logEnrichment(
    solutionId: string,
    solutionType: 'workflow' | 'agent',
    enrichmentType: string,
    status: 'success' | 'error' | 'cached' | 'skipped',
    contentHash: string,
    processingTimeMs: number,
    llmTokensUsed?: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from(this.LOGS_TABLE)
        .insert({
          solution_id: solutionId,
          solution_type: solutionType,
          enrichment_type: enrichmentType,
          status,
          content_hash: contentHash,
          processing_time_ms: processingTimeMs,
          llm_tokens_used: llmTokensUsed,
          error_message: errorMessage
        });
    } catch (error) {
      console.error('Error logging enrichment activity:', error);
    }
  }

  /**
   * Enrich solution summary using LLM
   */
  static async enrichSummary(
    solution: SolutionIndex,
    forceRefresh: boolean = false
  ): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const contentHash = this.generateContentHash(
      solution.id,
      solution.type === 'workflow' ? 'workflow' : 'agent',
      'summary',
      `${solution.title}:${solution.summary}`
    );

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await this.getCachedEnrichment(contentHash, 'summary');
        if (cached) {
          await this.logEnrichment(
            solution.id,
            solution.type === 'workflow' ? 'workflow' : 'agent',
            'summary',
            'cached',
            contentHash,
            Date.now() - startTime
          );

          return {
            success: true,
            solution: {
              ...solution,
              summary: cached.result.summary
            },
            enrichment_type: 'summary',
            content_hash: contentHash,
            processing_time_ms: Date.now() - startTime,
            cached: true
          };
        }
      }

      // Generate enhanced summary using LLM
      const prompt = this.buildSummaryPrompt(solution);
      const response = await this.callLLMWithRetry(prompt);
      
      const enrichedSummary = response.choices[0]?.message?.content?.trim() || solution.summary;
      const tokensUsed = response.usage?.total_tokens || 0;

      // Cache the result
      await this.cacheEnrichment(
        contentHash,
        'summary',
        solution.id,
        solution.type === 'workflow' ? 'workflow' : 'agent',
        { summary: enrichedSummary },
        tokensUsed,
        Date.now() - startTime
      );

      // Log the activity
      await this.logEnrichment(
        solution.id,
        solution.type === 'workflow' ? 'workflow' : 'agent',
        'summary',
        'success',
        contentHash,
        Date.now() - startTime,
        tokensUsed
      );

      return {
        success: true,
        solution: {
          ...solution,
          summary: enrichedSummary
        },
        enrichment_type: 'summary',
        content_hash: contentHash,
        llm_response: response,
        processing_time_ms: Date.now() - startTime,
        cached: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logEnrichment(
        solution.id,
        solution.type === 'workflow' ? 'workflow' : 'agent',
        'summary',
        'error',
        contentHash,
        Date.now() - startTime,
        undefined,
        errorMessage
      );

      return {
        success: false,
        solution,
        enrichment_type: 'summary',
        content_hash: contentHash,
        error: errorMessage,
        processing_time_ms: Date.now() - startTime,
        cached: false
      };
    }
  }

  /**
   * Enrich solution categories using LLM
   */
  static async enrichCategories(
    solution: SolutionIndex,
    forceRefresh: boolean = false
  ): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const contentHash = this.generateContentHash(
      solution.id,
      solution.type === 'workflow' ? 'workflow' : 'agent',
      'categories',
      `${solution.title}:${solution.summary}`
    );

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await this.getCachedEnrichment(contentHash, 'categories');
        if (cached) {
          await this.logEnrichment(
            solution.id,
            solution.type === 'workflow' ? 'workflow' : 'agent',
            'categories',
            'cached',
            contentHash,
            Date.now() - startTime
          );

          return {
            success: true,
            solution: {
              ...solution,
              category: cached.result.category,
              tags: cached.result.tags
            },
            enrichment_type: 'categories',
            content_hash: contentHash,
            processing_time_ms: Date.now() - startTime,
            cached: true
          };
        }
      }

      // Generate categories using LLM
      const prompt = this.buildCategoriesPrompt(solution);
      const response = await this.callLLMWithRetry(prompt);
      
      const categoriesResult = this.parseCategoriesResponse(response.choices[0]?.message?.content || '');
      const tokensUsed = response.usage?.total_tokens || 0;

      // Cache the result
      await this.cacheEnrichment(
        contentHash,
        'categories',
        solution.id,
        solution.type === 'workflow' ? 'workflow' : 'agent',
        categoriesResult,
        tokensUsed,
        Date.now() - startTime
      );

      // Log the activity
      await this.logEnrichment(
        solution.id,
        solution.type === 'workflow' ? 'workflow' : 'agent',
        'categories',
        'success',
        contentHash,
        Date.now() - startTime,
        tokensUsed
      );

      return {
        success: true,
        solution: {
          ...solution,
          category: categoriesResult.category,
          tags: categoriesResult.tags
        },
        enrichment_type: 'categories',
        content_hash: contentHash,
        llm_response: response,
        processing_time_ms: Date.now() - startTime,
        cached: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logEnrichment(
        solution.id,
        solution.type === 'workflow' ? 'workflow' : 'agent',
        'categories',
        'error',
        contentHash,
        Date.now() - startTime,
        undefined,
        errorMessage
      );

      return {
        success: false,
        solution,
        enrichment_type: 'categories',
        content_hash: contentHash,
        error: errorMessage,
        processing_time_ms: Date.now() - startTime,
        cached: false
      };
    }
  }

  /**
   * Enrich agent capabilities using LLM
   */
  static async enrichCapabilities(
    solution: AgentIndex,
    forceRefresh: boolean = false
  ): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const contentHash = this.generateContentHash(
      solution.id,
      'agent',
      'capabilities',
      `${solution.title}:${solution.summary}:${solution.capabilities.join(',')}`
    );

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await this.getCachedEnrichment(contentHash, 'capabilities');
        if (cached) {
          await this.logEnrichment(
            solution.id,
            'agent',
            'capabilities',
            'cached',
            contentHash,
            Date.now() - startTime
          );

          return {
            success: true,
            solution: {
              ...solution,
              capabilities: cached.result.capabilities
            },
            enrichment_type: 'capabilities',
            content_hash: contentHash,
            processing_time_ms: Date.now() - startTime,
            cached: true
          };
        }
      }

      // Generate enhanced capabilities using LLM
      const prompt = this.buildCapabilitiesPrompt(solution);
      const response = await this.callLLMWithRetry(prompt);
      
      const capabilitiesResult = this.parseCapabilitiesResponse(response.choices[0]?.message?.content || '');
      const tokensUsed = response.usage?.total_tokens || 0;

      // Cache the result
      await this.cacheEnrichment(
        contentHash,
        'capabilities',
        solution.id,
        'agent',
        capabilitiesResult,
        tokensUsed,
        Date.now() - startTime
      );

      // Log the activity
      await this.logEnrichment(
        solution.id,
        'agent',
        'capabilities',
        'success',
        contentHash,
        Date.now() - startTime,
        tokensUsed
      );

      return {
        success: true,
        solution: {
          ...solution,
          capabilities: capabilitiesResult.capabilities
        },
        enrichment_type: 'capabilities',
        content_hash: contentHash,
        llm_response: response,
        processing_time_ms: Date.now() - startTime,
        cached: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logEnrichment(
        solution.id,
        'agent',
        'capabilities',
        'error',
        contentHash,
        Date.now() - startTime,
        undefined,
        errorMessage
      );

      return {
        success: false,
        solution,
        enrichment_type: 'capabilities',
        content_hash: contentHash,
        error: errorMessage,
        processing_time_ms: Date.now() - startTime,
        cached: false
      };
    }
  }

  /**
   * Enrich solution domains using LLM
   */
  static async enrichDomains(
    solution: SolutionIndex,
    forceRefresh: boolean = false
  ): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const contentHash = this.generateContentHash(
      solution.id,
      solution.type === 'workflow' ? 'workflow' : 'agent',
      'domains',
      `${solution.title}:${solution.summary}`
    );

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await this.getCachedEnrichment(contentHash, 'domains');
        if (cached) {
          await this.logEnrichment(
            solution.id,
            solution.type === 'workflow' ? 'workflow' : 'agent',
            'domains',
            'cached',
            contentHash,
            Date.now() - startTime
          );

          return {
            success: true,
            solution: {
              ...solution,
              domains: cached.result.domains,
              domain_confidences: cached.result.domain_confidences,
              domain_origin: cached.result.domain_origin
            },
            enrichment_type: 'domains',
            content_hash: contentHash,
            processing_time_ms: Date.now() - startTime,
            cached: true
          };
        }
      }

      // Generate domain classification using LLM
      const prompt = this.buildDomainsPrompt(solution);
      const response = await this.callLLMWithRetry(prompt);
      
      const domainsResult = this.parseDomainsResponse(response.choices[0]?.message?.content || '');
      const tokensUsed = response.usage?.total_tokens || 0;

      // Cache the result
      await this.cacheEnrichment(
        contentHash,
        'domains',
        solution.id,
        solution.type === 'workflow' ? 'workflow' : 'agent',
        domainsResult,
        tokensUsed,
        Date.now() - startTime
      );

      // Log the activity
      await this.logEnrichment(
        solution.id,
        solution.type === 'workflow' ? 'workflow' : 'agent',
        'domains',
        'success',
        contentHash,
        Date.now() - startTime,
        tokensUsed
      );

      return {
        success: true,
        solution: {
          ...solution,
          domains: domainsResult.domains,
          domain_confidences: domainsResult.domain_confidences,
          domain_origin: domainsResult.domain_origin
        },
        enrichment_type: 'domains',
        content_hash: contentHash,
        llm_response: response,
        processing_time_ms: Date.now() - startTime,
        cached: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logEnrichment(
        solution.id,
        solution.type === 'workflow' ? 'workflow' : 'agent',
        'domains',
        'error',
        contentHash,
        Date.now() - startTime,
        undefined,
        errorMessage
      );

      return {
        success: false,
        solution,
        enrichment_type: 'domains',
        content_hash: contentHash,
        error: errorMessage,
        processing_time_ms: Date.now() - startTime,
        cached: false
      };
    }
  }

  /**
   * Batch enrich multiple solutions
   */
  static async batchEnrich(
    solutions: SolutionIndex[],
    enrichmentTypes: ('summary' | 'categories' | 'capabilities' | 'domains')[] = ['summary', 'categories', 'domains'],
    forceRefresh: boolean = false
  ): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];

    for (const solution of solutions) {
      for (const enrichmentType of enrichmentTypes) {
        try {
          let result: EnrichmentResult;

          switch (enrichmentType) {
            case 'summary':
              result = await this.enrichSummary(solution, forceRefresh);
              break;
            case 'categories':
              result = await this.enrichCategories(solution, forceRefresh);
              break;
            case 'capabilities':
              if (solution.type === 'agent') {
                result = await this.enrichCapabilities(solution as AgentIndex, forceRefresh);
              } else {
                result = {
                  success: false,
                  solution,
                  enrichment_type: 'capabilities',
                  content_hash: '',
                  error: 'Capabilities enrichment only available for agents',
                  processing_time_ms: 0,
                  cached: false
                };
              }
              break;
            case 'domains':
              result = await this.enrichDomains(solution, forceRefresh);
              break;
            default:
              result = {
                success: false,
                solution,
                enrichment_type: enrichmentType,
                content_hash: '',
                error: `Unknown enrichment type: ${enrichmentType}`,
                processing_time_ms: 0,
                cached: false
              };
          }

          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            solution,
            enrichment_type: enrichmentType,
            content_hash: '',
            error: error instanceof Error ? error.message : 'Unknown error',
            processing_time_ms: 0,
            cached: false
          });
        }
      }
    }

    return results;
  }

  /**
   * Get enrichment statistics
   */
  static async getEnrichmentStats(): Promise<{
    total_enrichments: number;
    successful_enrichments: number;
    cached_enrichments: number;
    failed_enrichments: number;
    total_tokens_used: number;
    avg_processing_time_ms: number;
    enrichment_types: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from(this.LOGS_TABLE)
        .select('*');

      if (error) {
        console.error('Error fetching enrichment stats:', error);
        return {
          total_enrichments: 0,
          successful_enrichments: 0,
          cached_enrichments: 0,
          failed_enrichments: 0,
          total_tokens_used: 0,
          avg_processing_time_ms: 0,
          enrichment_types: {}
        };
      }

      const stats = {
        total_enrichments: data.length,
        successful_enrichments: data.filter(log => log.status === 'success').length,
        cached_enrichments: data.filter(log => log.status === 'cached').length,
        failed_enrichments: data.filter(log => log.status === 'error').length,
        total_tokens_used: data.reduce((sum, log) => sum + (log.llm_tokens_used || 0), 0),
        avg_processing_time_ms: data.length > 0 ? data.reduce((sum, log) => sum + log.processing_time_ms, 0) / data.length : 0,
        enrichment_types: data.reduce((acc, log) => {
          acc[log.enrichment_type] = (acc[log.enrichment_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      console.error('Error calculating enrichment stats:', error);
      return {
        total_enrichments: 0,
        successful_enrichments: 0,
        cached_enrichments: 0,
        failed_enrichments: 0,
        total_tokens_used: 0,
        avg_processing_time_ms: 0,
        enrichment_types: {}
      };
    }
  }

  /**
   * Build LLM prompt for summary enrichment
   */
  private static buildSummaryPrompt(solution: SolutionIndex): string {
    const solutionType = solution.type === 'workflow' ? 'workflow' : 'AI agent';
    
    return `You are an expert technical writer. Please enhance the following ${solutionType} description to be more informative, clear, and engaging while maintaining accuracy.

Original Title: ${solution.title}
Original Description: ${solution.summary}

Requirements:
- Keep the enhanced description between 50-150 words
- Use clear, professional language
- Highlight key capabilities and benefits
- Make it more engaging for potential users
- Maintain technical accuracy
- Do not add information not implied by the original

Enhanced Description:`;
  }

  /**
   * Build LLM prompt for categories enrichment
   */
  private static buildCategoriesPrompt(solution: SolutionIndex): string {
    const solutionType = solution.type === 'workflow' ? 'workflow' : 'AI agent';
    const categories = solution.type === 'workflow' 
      ? 'messaging, ai_ml, database, email, cloud_storage, project_management, social_media, ecommerce, analytics, calendar_tasks'
      : 'ai_ml, content_generation, data_analysis, automation, chatbot, nlp, image_processing, code_generation';

    return `You are a technical categorization expert. Please categorize the following ${solutionType} and provide relevant tags.

Title: ${solution.title}
Description: ${solution.summary}

Available categories: ${categories}

Please respond in JSON format:
{
  "category": "most_appropriate_category",
  "tags": ["tag1", "tag2", "tag3"]
}

Requirements:
- Choose the most appropriate category from the available list
- Provide 2-5 relevant tags
- Tags should be descriptive and useful for filtering
- Use lowercase with underscores for tags

Response:`;
  }

  /**
   * Build LLM prompt for capabilities enrichment
   */
  private static buildCapabilitiesPrompt(solution: AgentIndex): string {
    const standardCapabilities = 'web_search, data_analysis, file_io, email_send, api_integration, text_generation, image_processing, code_generation, content_summarization, language_translation, sentiment_analysis, document_processing';

    return `You are an AI capabilities expert. Please analyze the following AI agent and provide standardized capability tags.

Title: ${solution.title}
Description: ${solution.summary}
Current Capabilities: ${solution.capabilities.join(', ')}

Standard capabilities: ${standardCapabilities}

Please respond in JSON format:
{
  "capabilities": ["capability1", "capability2", "capability3"]
}

Requirements:
- Select 2-6 most relevant capabilities from the standard list
- Focus on core capabilities the agent actually provides
- Avoid redundant or overlapping capabilities
- Use exact names from the standard list

Response:`;
  }

  /**
   * Build LLM prompt for domains enrichment
   */
  private static buildDomainsPrompt(solution: SolutionIndex): string {
    const domains = 'Healthcare & Medicine, Nursing & Care, Life Sciences & Biotech, Finance & Accounting, Marketing & Advertising, Sales & CRM, Human Resources & Recruiting, Education & Training, Legal & Compliance, IT & Software Development, DevOps & Cloud, Design & Creative, E-commerce & Retail, Manufacturing & Supply Chain, Real Estate & Property, Travel & Hospitality, Media & Entertainment, Non-profit & Social Impact, Government & Public Sector, Research & Development, Other';

    return `You are a business domain expert. Please classify the following solution into appropriate business domains.

Title: ${solution.title}
Description: ${solution.summary}

Available domains: ${domains}

Please respond in JSON format:
{
  "domains": ["domain1", "domain2", "domain3"],
  "confidences": [0.9, 0.7, 0.5]
}

Requirements:
- Select 1-3 most relevant domains
- Provide confidence scores (0.0-1.0) for each domain
- Use exact domain names from the list
- Order by relevance (highest confidence first)

Response:`;
  }

  /**
   * Call LLM with retry logic
   */
  private static async callLLMWithRetry(prompt: string, retries: number = this.MAX_RETRIES): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await openaiClient.chat.completions.create({
          model: this.LLM_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that provides accurate, structured responses in JSON format when requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });

        return response;
      } catch (error) {
        console.error(`LLM call attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS * attempt));
      }
    }
  }

  /**
   * Parse categories response from LLM
   */
  private static parseCategoriesResponse(response: string): { category: string; tags: string[] } {
    try {
      const parsed = JSON.parse(response);
      return {
        category: parsed.category || 'other',
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
      };
    } catch (error) {
      console.error('Error parsing categories response:', error);
      return {
        category: 'other',
        tags: []
      };
    }
  }

  /**
   * Parse capabilities response from LLM
   */
  private static parseCapabilitiesResponse(response: string): { capabilities: string[] } {
    try {
      const parsed = JSON.parse(response);
      return {
        capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : []
      };
    } catch (error) {
      console.error('Error parsing capabilities response:', error);
      return {
        capabilities: []
      };
    }
  }

  /**
   * Parse domains response from LLM
   */
  private static parseDomainsResponse(response: string): { 
    domains: string[]; 
    domain_confidences: number[]; 
    domain_origin: 'llm' 
  } {
    try {
      const parsed = JSON.parse(response);
      return {
        domains: Array.isArray(parsed.domains) ? parsed.domains : ['Other'],
        domain_confidences: Array.isArray(parsed.confidences) ? parsed.confidences : [1.0],
        domain_origin: 'llm'
      };
    } catch (error) {
      console.error('Error parsing domains response:', error);
      return {
        domains: ['Other'],
        domain_confidences: [1.0],
        domain_origin: 'llm'
      };
    }
  }
}
