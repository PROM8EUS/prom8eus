/**
 * Domain Classification Service
 * 
 * Dedicated service for domain classification using LLM
 */

import { supabase } from '@/integrations/supabase/client';
import { openaiClient } from '../openai';
import { DomainClassification } from '../schemas/common';

export interface DomainClassificationResult {
  domains: string[];
  domain_confidences: number[];
  domain_origin: 'llm' | 'admin' | 'mixed';
}

export interface DomainClassificationCache {
  domains: string[];
  domain_confidences: number[];
  domain_origin: 'llm' | 'admin' | 'mixed';
  timestamp: number;
  ttl: number;
}

export class DomainClassificationService {
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_DOMAINS = 3;
  private static readonly MIN_CONFIDENCE = 0.1;
  private static readonly MAX_CONFIDENCE_SUM = 1.0;

  /**
   * Classify solution into ontology domains using LLM with caching
   */
  static async classifySolutionDomains(
    title: string,
    summary: string,
    source: string,
    additionalContext?: string
  ): Promise<DomainClassificationResult> {
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
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}`;

      // Call OpenAI API
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      let classificationResult;
      try {
        classificationResult = JSON.parse(content);
      } catch (parseError) {
        console.warn('Failed to parse OpenAI response:', parseError);
        throw new Error('Invalid JSON response from OpenAI');
      }

      // Validate and normalize the result
      const validatedResult = this.validateClassificationResult(classificationResult, domainLabels);

      // Cache the result
      await this.cacheDomainClassification(title, summary, source, validatedResult);

      return validatedResult;

    } catch (error) {
      console.error('Error in domain classification:', error);
      
      // Return fallback result
      const fallbackResult = {
        domains: ['Other'],
        domain_confidences: [1.0],
        domain_origin: 'llm' as const
      };
      
      // Cache fallback result
      await this.cacheDomainClassification(title, summary, source, fallbackResult);
      
      return fallbackResult;
    }
  }

  /**
   * Get cached domain classification
   */
  private static async getCachedDomainClassification(
    title: string,
    summary: string,
    source: string
  ): Promise<DomainClassificationCache | null> {
    try {
      const cacheKey = this.generateCacheKey(title, summary, source);
      
      const { data, error } = await supabase
        .from('domain_classification_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache is still valid
      const now = Date.now();
      if (now - data.timestamp > this.CACHE_TTL) {
        // Cache expired, delete it
        await supabase
          .from('domain_classification_cache')
          .delete()
          .eq('cache_key', cacheKey);
        return null;
      }

      return {
        domains: data.domains,
        domain_confidences: data.domain_confidences,
        domain_origin: data.domain_origin,
        timestamp: data.timestamp,
        ttl: this.CACHE_TTL
      };

    } catch (error) {
      console.warn('Error getting cached domain classification:', error);
      return null;
    }
  }

  /**
   * Cache domain classification result
   */
  private static async cacheDomainClassification(
    title: string,
    summary: string,
    source: string,
    result: DomainClassificationResult
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(title, summary, source);
      
      await supabase
        .from('domain_classification_cache')
        .upsert({
          cache_key: cacheKey,
          title,
          summary,
          source,
          domains: result.domains,
          domain_confidences: result.domain_confidences,
          domain_origin: result.domain_origin,
          timestamp: Date.now()
        });

    } catch (error) {
      console.warn('Error caching domain classification:', error);
    }
  }

  /**
   * Generate cache key for domain classification
   */
  private static generateCacheKey(title: string, summary: string, source: string): string {
    const content = `${title}|${summary}|${source}`.toLowerCase();
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `domain_classification_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Validate and normalize classification result
   */
  private static validateClassificationResult(
    result: any,
    availableDomains: string[]
  ): DomainClassificationResult {
    // Ensure we have the required fields
    if (!result.domains || !result.confidences) {
      return {
        domains: ['Other'],
        domain_confidences: [1.0],
        domain_origin: 'llm'
      };
    }

    // Ensure domains is an array
    if (!Array.isArray(result.domains)) {
      return {
        domains: ['Other'],
        domain_confidences: [1.0],
        domain_origin: 'llm'
      };
    }

    // Ensure confidences is an array
    if (!Array.isArray(result.confidences)) {
      return {
        domains: ['Other'],
        domain_confidences: [1.0],
        domain_origin: 'llm'
      };
    }

    // Filter and validate domains
    const validDomains: string[] = [];
    const validConfidences: number[] = [];

    for (let i = 0; i < Math.min(result.domains.length, this.MAX_DOMAINS); i++) {
      const domain = result.domains[i];
      const confidence = result.confidences[i];

      // Check if domain is in available domains
      if (availableDomains.includes(domain)) {
        // Validate confidence
        const validConfidence = Math.max(
          this.MIN_CONFIDENCE,
          Math.min(1.0, typeof confidence === 'number' ? confidence : 0.5)
        );
        
        validDomains.push(domain);
        validConfidences.push(validConfidence);
      }
    }

    // If no valid domains found, use fallback
    if (validDomains.length === 0) {
      return {
        domains: ['Other'],
        domain_confidences: [1.0],
        domain_origin: 'llm'
      };
    }

    // Normalize confidences to ensure sum doesn't exceed MAX_CONFIDENCE_SUM
    const totalConfidence = validConfidences.reduce((sum, conf) => sum + conf, 0);
    if (totalConfidence > this.MAX_CONFIDENCE_SUM) {
      const scaleFactor = this.MAX_CONFIDENCE_SUM / totalConfidence;
      for (let i = 0; i < validConfidences.length; i++) {
        validConfidences[i] *= scaleFactor;
      }
    }

    return {
      domains: validDomains,
      domain_confidences: validConfidences,
      domain_origin: 'llm'
    };
  }

  /**
   * Get domain classification for multiple solutions
   */
  static async classifyMultipleSolutions(
    solutions: Array<{ title: string; summary: string; source: string; additionalContext?: string }>
  ): Promise<DomainClassificationResult[]> {
    const results: DomainClassificationResult[] = [];
    
    // Process solutions in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < solutions.length; i += batchSize) {
      const batch = solutions.slice(i, i + batchSize);
      
      const batchPromises = batch.map(solution => 
        this.classifySolutionDomains(
          solution.title,
          solution.summary,
          solution.source,
          solution.additionalContext
        )
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add small delay between batches
      if (i + batchSize < solutions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Clear domain classification cache
   */
  static async clearCache(): Promise<void> {
    try {
      await supabase
        .from('domain_classification_cache')
        .delete()
        .neq('cache_key', ''); // Delete all records
    } catch (error) {
      console.error('Error clearing domain classification cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    validEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('domain_classification_cache')
        .select('timestamp');

      if (error || !data) {
        return {
          totalEntries: 0,
          expiredEntries: 0,
          validEntries: 0,
          oldestEntry: null,
          newestEntry: null
        };
      }

      const now = Date.now();
      const timestamps = data.map(entry => entry.timestamp);
      
      const expiredEntries = timestamps.filter(timestamp => now - timestamp > this.CACHE_TTL).length;
      const validEntries = timestamps.length - expiredEntries;
      
      const oldestTimestamp = Math.min(...timestamps);
      const newestTimestamp = Math.max(...timestamps);

      return {
        totalEntries: timestamps.length,
        expiredEntries,
        validEntries,
        oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null,
        newestEntry: newestTimestamp ? new Date(newestTimestamp) : null
      };

    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        expiredEntries: 0,
        validEntries: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }
  }
}
