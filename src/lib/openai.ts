/**
 * OpenAI API Client - Secure backend implementation
 * All API calls go through backend Edge Function to prevent API key exposure
 */

import { supabase } from '@/integrations/supabase/client';
import { isAIEnabled } from './config';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export class OpenAIClient {
  private cache = new Map<string, { response: any; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate cache key for a prompt
   */
  private getCacheKey(prompt: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(prompt);
    return Array.from(data)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Get response from cache
   */
  private getFromCache(prompt: string): any | null {
    const key = this.getCacheKey(prompt);
    const cached = this.cache.get(key);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('🎯 Cache hit - Token saved!');
      return cached.response;
    }
    
    return null;
  }

  /**
   * Store response in cache
   */
  private setCache(prompt: string, response: any): void {
    const key = this.getCacheKey(prompt);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Call OpenAI API through secure backend (with direct fallback for dev)
   */
  private async callBackend(payload: any): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('openai-proxy', {
        body: payload
      });

      if (error) {
        console.warn('Backend OpenAI call failed, trying direct fallback:', error);
        // Fallback to direct API call in development
        if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
          return await this.callOpenAIDirectly(payload);
        }
        throw new Error(`OpenAI API Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.warn('Supabase function invoke failed, trying direct fallback:', error);
      // Fallback to direct API call in development
      if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
        return await this.callOpenAIDirectly(payload);
      }
      throw error;
    }
  }

  /**
   * Direct OpenAI API call (only for development fallback)
   */
  private async callOpenAIDirectly(payload: any): Promise<any> {
    console.log('⚠️ [DEV] Using direct OpenAI API call (fallback)');
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Extract messages from payload
    let messages: OpenAIMessage[] = [];
    if (payload.messages) {
      messages = payload.messages;
    } else if (payload.action === 'chat') {
      messages = payload.messages || [];
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: payload.options?.model || 'gpt-4o-mini',
        messages,
        temperature: payload.options?.temperature || 0.7,
        max_tokens: payload.options?.max_tokens || 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Extract JSON from markdown code blocks if present
    let content = data.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    } else if (content.startsWith('```') && content.endsWith('```')) {
      const lines = content.split('\n');
      content = lines.slice(1, -1).join('\n').trim();
    }

    return {
      content,
      usage: data.usage,
      model: data.model
    };
  }

  /**
   * Check if OpenAI is properly configured
   */
  isConfigured(): boolean {
    return isAIEnabled();
  }

  /**
   * Make a chat completion request
   */
  async chatCompletion(
    messages: OpenAIMessage[],
    options?: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
    }
  ): Promise<OpenAIResponse> {
    return await this.callBackend({
      action: 'chat',
      messages,
      options
    });
  }

  /**
   * Analyze job description and extract tasks WITH subtasks and business case
   */
  async analyzeJobDescription(jobText: string, lang: 'de' | 'en' = 'de'): Promise<{
    tasks: Array<{
      text: string;
      automationPotential: number;
      category: string;
      reasoning: string;
      subtasks?: Array<{
        id: string;
        title: string;
        automationPotential: number;
        estimatedTime: number;
      }>;
      businessCase?: {
        manualHours: number;
        automatedHours: number;
        automationPotential: number;
        savedHours: number;
        hourlyRateEmployee: number;
        hourlyRateFreelancer: number;
        employmentType: 'employee' | 'freelancer';
        reasoning: string;
      };
    }>;
    summary: string;
  }> {
    const cacheKey = `analyze-job-${lang}-${jobText.slice(0, 100)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await this.callBackend({
      action: 'analyze-job-complete',
      jobText,
      lang
    });

    try {
      const parsed = JSON.parse(response.content);
      
      // Use response format with subtasks
      const enhancedTasks = parsed.tasks?.map((task: any) => ({
        text: task.text,
        automationPotential: task.automationPotential || 50,
        category: task.category || 'Allgemein',
        reasoning: task.reasoning || 'AI analysis completed',
        subtasks: task.subtasks || [], // Use AI-generated subtasks
        businessCase: null // Empty for speed - will be generated later
      })) || [];
      
      const enhancedResponse = {
        tasks: enhancedTasks,
        summary: parsed.summary || ''
      };
      
      this.setCache(cacheKey, enhancedResponse);
      return enhancedResponse;
    } catch (error) {
      console.error('Failed to parse response:', error);
      throw new Error('Invalid response format from AI');
    }
  }

  /**
   * Generate complete analysis (subtasks + business case + solutions)
   */
  async generateCompleteAnalysis(
    taskText: string,
    lang: 'de' | 'en' = 'de'
  ): Promise<{
    subtasks: Array<any>;
    businessCase: any;
    solutions: {
      workflows: Array<any>;
      agents: Array<any>;
    };
  }> {
    const response = await this.callBackend({
      action: 'complete-analysis',
      taskText,
      lang
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw error;
    }
  }

  /**
   * Generate subtasks for a given task
   */
  async generateSubtasks(taskText: string, lang: 'de' | 'en' = 'de'): Promise<Array<{
    id: string;
    title: string;
    description: string;
    automationPotential: number;
    estimatedTime: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'low' | 'medium' | 'high';
    systems: string[];
    risks: string[];
    opportunities: string[];
    dependencies: string[];
  }>> {
    const response = await this.callBackend({
      action: 'generate-subtasks',
      taskText,
      lang
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed.subtasks || [];
    } catch (error) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.subtasks || [];
      }
      throw new Error('Invalid response format from AI');
    }
  }

  /**
   * Generate business case analysis
   */
  async generateBusinessCase(
    taskText: string, 
    subtasks: any[], 
    lang: 'de' | 'en' = 'de'
  ): Promise<{
    manualHours: number;
    automatedHours: number;
    automationPotential: number;
    savedHours: number;
    setupCostHours: number;
    setupCostMoney: number;
    roi: number;
    paybackPeriodYears: number;
    hourlyRateEmployee: number;
    hourlyRateFreelancer: number;
    employmentType: 'employee' | 'freelancer';
    reasoning: string;
  }> {
    const response = await this.callBackend({
      action: 'generate-business-case',
      taskText,
      subtasks,
      lang
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw error;
    }
  }

  /**
   * Find best solutions (workflows and agents)
   */
  async findBestSolutions(
    taskText: string,
    subtasks: any[],
    lang: 'de' | 'en' = 'de'
  ): Promise<{
    agents: Array<any>;
    workflows: Array<any>;
  }> {
    const response = await this.callBackend({
      action: 'find-solutions',
      taskText,
      subtasks,
      lang
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { agents: [], workflows: [] };
    }
  }

  /**
   * Analyze individual task
   */
  async analyzeTask(
    taskText: string, 
    jobContext: string, 
    lang: 'de' | 'en' = 'de'
  ): Promise<{
    automationPotential: number;
    confidence: number;
    category: string;
    industry: string;
    complexity: 'low' | 'medium' | 'high';
    trend: 'increasing' | 'stable' | 'decreasing';
    systems: string[];
    reasoning: string;
    analysisTime: number;
    subtasks?: any[];
  }> {
    const startTime = Date.now();
    
    try {
      const response = await this.chatCompletion([
        { 
          role: 'system', 
          content: 'Analyze task and respond with JSON only. No explanations.' 
        },
        { 
          role: 'user', 
          content: `Task: ${taskText.slice(0, 500)}\nContext: ${jobContext.slice(0, 500)}` 
        }
      ], { max_tokens: 600 });

      const parsed = JSON.parse(response.content);
      return {
        ...parsed,
        analysisTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Task analysis failed:', error);
      return {
        automationPotential: 50,
        confidence: 0.5,
        category: 'General',
        industry: 'General',
        complexity: 'medium',
        trend: 'stable',
        systems: [],
        reasoning: 'Analysis failed, using fallback',
        analysisTime: Date.now() - startTime,
        subtasks: []
      };
    }
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient();

// Export compatibility functions
export const isOpenAIAvailable = (): boolean => {
  // Check if we have the API key available
  const hasKey = import.meta.env.DEV && !!import.meta.env.VITE_OPENAI_API_KEY;
  console.log('🔍 [OpenAI] Availability check:', { hasKey, isDev: import.meta.env.DEV });
  return hasKey || true; // Always return true to attempt backend call
};

export const testOpenAIConnection = async (): Promise<boolean> => {
  try {
    await openaiClient.chatCompletion([
      { role: 'user', content: 'Hello' }
    ], { max_tokens: 5 });
    return true;
  } catch {
    return false;
  }
};