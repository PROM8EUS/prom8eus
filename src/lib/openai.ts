/**
 * OpenAI API Client
 * Secure wrapper for OpenAI API interactions
 */

import { getOpenAIConfig, isAIEnabled } from './config';

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
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private cache = new Map<string, { response: any; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Stunden

  constructor() {
    const config = getOpenAIConfig();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o-mini';
  }

  /**
   * Generiert einen Cache-Key für einen Prompt
   */
  private getCacheKey(prompt: string): string {
    return btoa(prompt).slice(0, 32);
  }

  /**
   * Prüft ob ein Cache-Eintrag noch gültig ist
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Holt eine Antwort aus dem Cache
   */
  private getFromCache(prompt: string): any | null {
    const key = this.getCacheKey(prompt);
    const cached = this.cache.get(key);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('🎯 Cache hit - Token gespart!');
      return cached.response;
    }
    
    return null;
  }

  /**
   * Speichert eine Antwort im Cache
   */
  private setCache(prompt: string, response: any): void {
    const key = this.getCacheKey(prompt);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Check if OpenAI is properly configured
   */
  isConfigured(): boolean {
    return isAIEnabled() && !!this.apiKey;
  }

  /**
   * Make a chat completion request to OpenAI
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
    if (!this.isConfigured()) {
      throw new Error('OpenAI is not properly configured. Please check your API key.');
    }

    const requestBody = {
      model: this.model,
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.max_tokens || 1000,
      top_p: options?.top_p || 1,
      frequency_penalty: options?.frequency_penalty || 0,
      presence_penalty: options?.presence_penalty || 0,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: OpenAIError = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error.message}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  /**
   * Analyze job description and extract tasks using AI (OPTIMIZED)
   */
  async analyzeJobDescription(jobText: string, lang: 'de' | 'en' = 'de'): Promise<{
    tasks: Array<{
      text: string;
      automationPotential: number;
      category: string;
      reasoning: string;
    }>;
    summary: string;
  }> {
    // Kürzerer, optimierter Prompt
    const systemPrompt = lang === 'de' 
      ? `Extrahiere Aufgaben aus Stellenbeschreibungen. JSON:
{"tasks":[{"text":"Aufgabe","automationPotential":85,"category":"admin","reasoning":"Begründung"}],"summary":"Zusammenfassung"}
Kategorien: admin, tech, analytical, creative, mgmt, comm, routine, physical`
      : `Extract tasks from job descriptions. JSON:
{"tasks":[{"text":"Task","automationPotential":85,"category":"admin","reasoning":"Reasoning"}],"summary":"Summary"}
Categories: admin, tech, analytical, creative, mgmt, comm, routine, physical`;

    // Kürzerer User-Prompt
    const userPrompt = lang === 'de'
      ? `Analysiere: ${jobText.slice(0, 2000)}` // Begrenze Input-Länge
      : `Analyze: ${jobText.slice(0, 2000)}`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Prüfe Cache zuerst
    const cacheKey = `${systemPrompt}${userPrompt}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.chatCompletion(messages, {
      temperature: 0.3,
      max_tokens: 1200, // Reduziert von 2000
    });

    try {
      const parsed = JSON.parse(response.content);
      // Speichere im Cache
      this.setCache(cacheKey, parsed);
      return parsed;
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }
  }

  /**
   * Generate subtasks for a given task using AI
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
    const systemPrompt = lang === 'de'
      ? `Du bist ein Experte für Aufgabenanalyse. Zerlege komplexe Aufgaben in spezifische Unteraufgaben.

Antworte im JSON-Format:
{
  "subtasks": [
    {
      "id": "unique-id",
      "title": "Unteraufgabentitel",
      "description": "Detaillierte Beschreibung",
      "automationPotential": 75,
      "estimatedTime": 30,
      "priority": "high",
      "complexity": "medium",
      "systems": ["System1", "System2"],
      "risks": ["Risiko1", "Risiko2"],
      "opportunities": ["Chance1", "Chance2"],
      "dependencies": ["Abhängigkeit1"]
    }
  ]
}

Prioritäten: low, medium, high, critical
Komplexität: low, medium, high
Geschätzte Zeit in Minuten`
      : `You are an expert in task analysis. Break down complex tasks into specific subtasks.

Respond in JSON format:
{
  "subtasks": [
    {
      "id": "unique-id",
      "title": "Subtask title",
      "description": "Detailed description",
      "automationPotential": 75,
      "estimatedTime": 30,
      "priority": "high",
      "complexity": "medium",
      "systems": ["System1", "System2"],
      "risks": ["Risk1", "Risk2"],
      "opportunities": ["Opportunity1", "Opportunity2"],
      "dependencies": ["Dependency1"]
    }
  ]
}

Priorities: low, medium, high, critical
Complexity: low, medium, high
Estimated time in minutes`;

    const userPrompt = lang === 'de'
      ? `Zerlege diese Aufgabe in spezifische Unteraufgaben:\n\n${taskText}`
      : `Break down this task into specific subtasks:\n\n${taskText}`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, {
      temperature: 0.4,
      max_tokens: 1500,
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed.subtasks || [];
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }
  }

  /**
   * Generate AI agent recommendations for a task
   */
  async recommendAIAgents(taskText: string, lang: 'de' | 'en' = 'de'): Promise<Array<{
    name: string;
    technology: string;
    implementation: string;
    difficulty: 'Einfach' | 'Mittel' | 'Schwer';
    setupTime: string;
  }>> {
    const systemPrompt = lang === 'de'
      ? `Du bist ein Experte für AI-Automatisierung. Empfehle passende AI-Agenten und Workflows für Aufgaben.

Antworte im JSON-Format:
{
  "agents": [
    {
      "name": "Agent-Name",
      "technology": "Technologie-Stack",
      "implementation": "Implementierungsschritte",
      "difficulty": "Mittel",
      "setupTime": "2-4 Stunden"
    }
  ]
}

Schwierigkeiten: Einfach, Mittel, Schwer`
      : `You are an expert in AI automation. Recommend suitable AI agents and workflows for tasks.

Respond in JSON format:
{
  "agents": [
    {
      "name": "Agent Name",
      "technology": "Technology Stack",
      "implementation": "Implementation steps",
      "difficulty": "Medium",
      "setupTime": "2-4 hours"
    }
  ]
}

Difficulties: Easy, Medium, Hard`;

    const userPrompt = lang === 'de'
      ? `Empfehle AI-Agenten für diese Aufgabe:\n\n${taskText}`
      : `Recommend AI agents for this task:\n\n${taskText}`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, {
      temperature: 0.5,
      max_tokens: 1200,
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed.agents || [];
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }
  }

  /**
   * Analyze individual task with AI (OPTIMIZED)
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
    
    // Stark verkürzter Prompt
    const systemPrompt = lang === 'de' 
      ? `Analysiere Aufgabe. JSON:
{"automationPotential":85,"confidence":90,"category":"admin","industry":"IT","complexity":"medium","trend":"increasing","systems":["Excel"],"reasoning":"Begründung","subtasks":[{"id":"1","title":"Unteraufgabe","automationPotential":90,"estimatedTime":15}]}`
      : `Analyze task. JSON:
{"automationPotential":85,"confidence":90,"category":"admin","industry":"IT","complexity":"medium","trend":"increasing","systems":["Excel"],"reasoning":"Reasoning","subtasks":[{"id":"1","title":"Subtask","automationPotential":90,"estimatedTime":15}]}`;

    // Kürzerer User-Prompt
    const userPrompt = lang === 'de'
      ? `Aufgabe: ${taskText.slice(0, 500)}\nKontext: ${jobContext.slice(0, 500)}`
      : `Task: ${taskText.slice(0, 500)}\nContext: ${jobContext.slice(0, 500)}`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, { max_tokens: 600 }); // Reduziert von 1000
    
    try {
      const result = JSON.parse(response.content);
      return {
        ...result,
        analysisTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Fallback response
      return {
        automationPotential: 50,
        confidence: 0.5,
        category: 'General',
        industry: 'General',
        complexity: 'medium',
        trend: 'stable',
        systems: [],
        reasoning: 'AI analysis failed, using fallback',
        analysisTime: Date.now() - startTime,
        subtasks: []
      };
    }
  }

  /**
   * Find best AI agents and workflows for a specific task (OPTIMIZED)
   */
  async findBestSolutions(
    taskText: string,
    subtasks: any[],
    lang: 'de' | 'en' = 'de'
  ): Promise<{
    agents: Array<{
      name: string;
      technology: string;
      implementation: string;
      difficulty: 'Einfach' | 'Mittel' | 'Schwer';
      setupTime: string;
      matchScore: number;
      reasoning: string;
    }>;
    workflows: Array<{
      name: string;
      technology: string;
      steps: string[];
      difficulty: 'Einfach' | 'Mittel' | 'Schwer';
      setupTime: string;
      matchScore: number;
      reasoning: string;
    }>;
  }> {
    // Stark verkürzter Prompt
    const systemPrompt = lang === 'de' 
      ? `Empfehle AI-Lösungen. JSON:
{"agents":[{"name":"Agent","technology":"Tech","implementation":"Schritte","difficulty":"Mittel","setupTime":"2-4h","matchScore":95,"reasoning":"Begründung"}],"workflows":[{"name":"Workflow","technology":"Tech","steps":["1","2"],"difficulty":"Einfach","setupTime":"1-2h","matchScore":90,"reasoning":"Begründung"}]}`
      : `Recommend AI solutions. JSON:
{"agents":[{"name":"Agent","technology":"Tech","implementation":"Steps","difficulty":"Medium","setupTime":"2-4h","matchScore":95,"reasoning":"Reasoning"}],"workflows":[{"name":"Workflow","technology":"Tech","steps":["1","2"],"difficulty":"Easy","setupTime":"1-2h","matchScore":90,"reasoning":"Reasoning"}]}`;

    // Kürzerer User-Prompt
    const userPrompt = lang === 'de'
      ? `Aufgabe: ${taskText.slice(0, 300)}\nUnteraufgaben: ${subtasks.slice(0, 3).map(s => s.title || s.text).join(', ')}`
      : `Task: ${taskText.slice(0, 300)}\nSubtasks: ${subtasks.slice(0, 3).map(s => s.title || s.text).join(', ')}`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, { max_tokens: 800 }); // Reduziert von 1500
    
    try {
      const result = JSON.parse(response.content);
      return result;
    } catch (error) {
      console.error('Failed to parse AI solutions response:', error);
      // Fallback response
      return {
        agents: [],
        workflows: []
      };
    }
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient();

// Export utility functions
export const isOpenAIAvailable = (): boolean => {
  return openaiClient.isConfigured();
};

export const testOpenAIConnection = async (): Promise<boolean> => {
  try {
    if (!isOpenAIAvailable()) {
      return false;
    }

    // Try different models in order of preference
    const models = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'];
    
    for (const model of models) {
      try {
        // Temporarily change model for this test
        const originalModel = openaiClient['model'];
        openaiClient['model'] = model;
        
        const response = await openaiClient.chatCompletion([
          { role: 'user', content: 'Hello' }
        ], { max_tokens: 5 });

        // Restore original model
        openaiClient['model'] = originalModel;
        
        if (response.content) {
          console.log(`✅ OpenAI connection successful with model: ${model}`);
          return true;
        }
      } catch (error) {
        console.warn(`❌ Model ${model} failed:`, error);
        continue;
      }
    }
    
    return false;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
};
