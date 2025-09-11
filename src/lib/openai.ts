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

  constructor() {
    const config = getOpenAIConfig();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o-mini';
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
   * Analyze job description and extract tasks using AI
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
    const systemPrompt = lang === 'de' 
      ? `Du bist ein Experte für Arbeitsplatzautomatisierung. Analysiere Stellenbeschreibungen und extrahiere spezifische Aufgaben mit ihrem Automatisierungspotenzial.

Antworte im JSON-Format:
{
  "tasks": [
    {
      "text": "Aufgabentext",
      "automationPotential": 85,
      "category": "Kategorie",
      "reasoning": "Begründung für das Automatisierungspotenzial"
    }
  ],
  "summary": "Zusammenfassung der Analyse"
}

Kategorien: administrative, technical, analytical, creative, management, communication, routine, physical
Automatisierungspotenzial: 0-100 (0 = nicht automatisierbar, 100 = vollständig automatisierbar)`
      : `You are an expert in workplace automation. Analyze job descriptions and extract specific tasks with their automation potential.

Respond in JSON format:
{
  "tasks": [
    {
      "text": "Task description",
      "automationPotential": 85,
      "category": "Category",
      "reasoning": "Reasoning for automation potential"
    }
  ],
  "summary": "Analysis summary"
}

Categories: administrative, technical, analytical, creative, management, communication, routine, physical
Automation potential: 0-100 (0 = not automatable, 100 = fully automatable)`;

    const userPrompt = lang === 'de'
      ? `Analysiere diese Stellenbeschreibung und extrahiere die wichtigsten Aufgaben:\n\n${jobText}`
      : `Analyze this job description and extract the most important tasks:\n\n${jobText}`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, {
      temperature: 0.3,
      max_tokens: 2000,
    });

    try {
      const parsed = JSON.parse(response.content);
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
   * Analyze individual task with AI
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
    
    const systemPrompt = lang === 'de' 
      ? `Du bist ein Experte für Arbeitsplatzautomatisierung. Analysiere einzelne Aufgaben und bewerte ihr Automatisierungspotenzial.

Antworte im JSON-Format:
{
  "automationPotential": 85,
  "confidence": 90,
  "category": "Datenverarbeitung",
  "industry": "IT",
  "complexity": "medium",
  "trend": "increasing",
  "systems": ["Excel", "API", "Database"],
  "reasoning": "Diese Aufgabe kann durch API-Integration und Datenverarbeitung automatisiert werden",
  "subtasks": [
    {
      "id": "subtask-1",
      "title": "Daten sammeln",
      "automationPotential": 90,
      "estimatedTime": 15
    }
  ]
}

Bewerte das Automatisierungspotenzial (0-100):
- 90-100%: Vollständig automatisierbar
- 70-89%: Größtenteils automatisierbar  
- 50-69%: Teilweise automatisierbar
- 30-49%: Wenig automatisierbar
- 0-29%: Nicht automatisierbar

Komplexität: low, medium, high
Trend: increasing, stable, decreasing`
      : `You are an expert in workplace automation. Analyze individual tasks and evaluate their automation potential.

Respond in JSON format:
{
  "automationPotential": 85,
  "confidence": 90,
  "category": "Data Processing",
  "industry": "IT",
  "complexity": "medium",
  "trend": "increasing",
  "systems": ["Excel", "API", "Database"],
  "reasoning": "This task can be automated through API integration and data processing",
  "subtasks": [
    {
      "id": "subtask-1",
      "title": "Collect data",
      "automationPotential": 90,
      "estimatedTime": 15
    }
  ]
}

Rate automation potential (0-100):
- 90-100%: Fully automatable
- 70-89%: Mostly automatable
- 50-69%: Partially automatable
- 30-49%: Slightly automatable
- 0-29%: Not automatable

Complexity: low, medium, high
Trend: increasing, stable, decreasing`;

    const userPrompt = lang === 'de'
      ? `Analysiere diese Aufgabe im Kontext der Stellenbeschreibung:

AUFGABE: ${taskText}

KONTEXT: ${jobContext}

Bewerte das Automatisierungspotenzial und erstelle Unteraufgaben.`
      : `Analyze this task in the context of the job description:

TASK: ${taskText}

CONTEXT: ${jobContext}

Evaluate automation potential and create subtasks.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, { max_tokens: 1000 });
    
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
   * Find best AI agents and workflows for a specific task
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
    const systemPrompt = lang === 'de' 
      ? `Du bist ein Experte für AI-Automatisierung. Finde die besten AI-Agenten und Workflows für spezifische Aufgaben.

Antworte im JSON-Format:
{
  "agents": [
    {
      "name": "AI-Agent Name",
      "technology": "ChatGPT + GitHub Copilot + Claude",
      "implementation": "Schritt-für-Schritt Anleitung",
      "difficulty": "Mittel",
      "setupTime": "2-4 Stunden",
      "matchScore": 95,
      "reasoning": "Warum dieser Agent perfekt für diese Aufgabe ist"
    }
  ],
  "workflows": [
    {
      "name": "Workflow Name",
      "technology": "n8n + API + Automation",
      "steps": ["Schritt 1", "Schritt 2", "Schritt 3"],
      "difficulty": "Einfach",
      "setupTime": "1-2 Stunden",
      "matchScore": 90,
      "reasoning": "Warum dieser Workflow optimal ist"
    }
  ]
}

Schwierigkeit: Einfach, Mittel, Schwer
Setup-Zeit: 1-2 Stunden, 2-4 Stunden, 4-8 Stunden, 8+ Stunden
Match-Score: 0-100 (wie gut passt die Lösung zur Aufgabe)

Fokussiere dich auf:
- Konkrete, umsetzbare Lösungen
- Realistische Setup-Zeiten
- Klare Implementierungsschritte
- Hohe Match-Scores für relevante Lösungen`
      : `You are an expert in AI automation. Find the best AI agents and workflows for specific tasks.

Respond in JSON format:
{
  "agents": [
    {
      "name": "AI Agent Name",
      "technology": "ChatGPT + GitHub Copilot + Claude",
      "implementation": "Step-by-step implementation guide",
      "difficulty": "Medium",
      "setupTime": "2-4 hours",
      "matchScore": 95,
      "reasoning": "Why this agent is perfect for this task"
    }
  ],
  "workflows": [
    {
      "name": "Workflow Name",
      "technology": "n8n + API + Automation",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "difficulty": "Easy",
      "setupTime": "1-2 hours",
      "matchScore": 90,
      "reasoning": "Why this workflow is optimal"
    }
  ]
}

Difficulty: Easy, Medium, Hard
Setup Time: 1-2 hours, 2-4 hours, 4-8 hours, 8+ hours
Match Score: 0-100 (how well the solution fits the task)

Focus on:
- Concrete, actionable solutions
- Realistic setup times
- Clear implementation steps
- High match scores for relevant solutions`;

    const userPrompt = lang === 'de'
      ? `Finde die besten AI-Lösungen für diese Aufgabe:

AUFGABE: ${taskText}

UNTERAUFGABEN: ${subtasks.map(s => s.title || s.text).join(', ')}

Empfehle spezifische AI-Agenten und Workflows mit hoher Relevanz.`
      : `Find the best AI solutions for this task:

TASK: ${taskText}

SUBTASKS: ${subtasks.map(s => s.title || s.text).join(', ')}

Recommend specific AI agents and workflows with high relevance.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, { max_tokens: 1500 });
    
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
