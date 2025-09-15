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
    // Verwende TextEncoder für Unicode-Unterstützung
    const encoder = new TextEncoder();
    const data = encoder.encode(prompt);
    return Array.from(data)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
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
      ? `Du bist ein Experte für Aufgabenanalyse und Automatisierung. Zerlege komplexe Aufgaben in spezifische, automatisierbare Unteraufgaben.

WICHTIG: Antworte ausschließlich mit gültigem JSON, keine zusätzlichen Erklärungen!

AUFGABE: Erstelle 3-5 spezifische Unteraufgaben, die:
1. Konkret und umsetzbar sind
2. Verschiedene Automatisierungsgrade haben (30-95%)
3. Realistische Zeitschätzungen haben
4. Relevante Systeme und Technologien nennen
5. Praktische Risiken und Chancen identifizieren

JSON-Format:
{
  "subtasks": [
    {
      "id": "task-1",
      "title": "Spezifische Unteraufgabe",
      "description": "Detaillierte Beschreibung der Aufgabe und ihrer Ziele",
      "automationPotential": 75,
      "estimatedTime": 30,
      "priority": "high",
      "complexity": "medium",
      "systems": ["Excel", "Python", "API"],
      "risks": ["Datenqualität", "API-Limits"],
      "opportunities": ["Automatisierung", "Zeitersparnis"],
      "dependencies": ["Datenbankzugang", "API-Keys"]
    }
  ]
}

Prioritäten: low, medium, high, critical
Komplexität: low, medium, high
Automatisierungspotenzial: 0-100 (0=nicht automatisierbar, 100=vollständig automatisierbar)
Geschätzte Zeit in Minuten`
      : `You are an expert in task analysis and automation. Break down complex tasks into specific, automatable subtasks.

IMPORTANT: Respond exclusively with valid JSON, no additional explanations!

TASK: Create 3-5 specific subtasks that are:
1. Concrete and actionable
2. Have different automation levels (30-95%)
3. Have realistic time estimates
4. Mention relevant systems and technologies
5. Identify practical risks and opportunities

JSON Format:
{
  "subtasks": [
    {
      "id": "task-1",
      "title": "Specific subtask",
      "description": "Detailed description of the task and its goals",
      "automationPotential": 75,
      "estimatedTime": 30,
      "priority": "high",
      "complexity": "medium",
      "systems": ["Excel", "Python", "API"],
      "risks": ["Data quality", "API limits"],
      "opportunities": ["Automation", "Time savings"],
      "dependencies": ["Database access", "API keys"]
    }
  ]
}

Priorities: low, medium, high, critical
Complexity: low, medium, high
Automation potential: 0-100 (0=not automatable, 100=fully automatable)
Estimated time in minutes`;

    const userPrompt = lang === 'de'
      ? `Zerlege diese Aufgabe in spezifische, automatisierbare Unteraufgaben:

AUFGABE: ${taskText}

FOKUS: Erstelle Unteraufgaben, die verschiedene Automatisierungsgrade haben und konkrete, umsetzbare Schritte darstellen.`
      : `Break down this task into specific, automatable subtasks:

TASK: ${taskText}

FOCUS: Create subtasks with different automation levels that represent concrete, actionable steps.`;

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
      console.log('Raw response:', response.content);
      
      // Versuche JSON aus der Antwort zu extrahieren
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed.subtasks || [];
        }
      } catch (extractError) {
        console.error('Failed to extract JSON from response:', extractError);
      }
      
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
    
    // Verbesserter Prompt mit klarer JSON-Anweisung
    const systemPrompt = lang === 'de' 
      ? `Du bist ein Experte für Arbeitsplatzautomatisierung. Analysiere Aufgaben und antworte NUR mit gültigem JSON.

WICHTIG: Antworte ausschließlich mit gültigem JSON, keine zusätzlichen Erklärungen!

JSON-Format:
{"automationPotential":85,"confidence":90,"category":"admin","industry":"IT","complexity":"medium","trend":"increasing","systems":["Excel"],"reasoning":"Begründung","subtasks":[{"id":"1","title":"Unteraufgabe","automationPotential":90,"estimatedTime":15}]}`
      : `You are an expert in workplace automation. Analyze tasks and respond ONLY with valid JSON.

IMPORTANT: Respond exclusively with valid JSON, no additional explanations!

JSON Format:
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
      // Versuche JSON zu parsen
      let result = JSON.parse(response.content);
      return {
        ...result,
        analysisTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw response:', response.content);
      
      // Versuche JSON aus der Antwort zu extrahieren
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            ...result,
            analysisTime: Date.now() - startTime
          };
        }
      } catch (extractError) {
        console.error('Failed to extract JSON from response:', extractError);
      }
      
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
   * Find best AI agents and workflows for a specific task (ENHANCED)
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
    // Allgemeine Workflow-Kategorien für OpenAI zur intelligenten Auswahl
    const workflowCategories = lang === 'de' 
      ? `VERFÜGBARE WORKFLOW-KATEGORIEN:
1. Datenverarbeitung: ETL-Pipelines, Datenbereinigung, Transformation
2. Automatisierung: Scripts, APIs, Workflow-Orchestrierung
3. Analyse: Reporting, Dashboards, Business Intelligence
4. Integration: Systemverbindungen, Datenbanken, APIs
5. Qualitätssicherung: Validierung, Monitoring, Alerts
6. Content-Erstellung: Dokumentation, Präsentationen, Reports
7. Kommunikation: E-Mail, Notifications, Collaboration
8. Projektmanagement: Task-Tracking, Scheduling, Coordination
9. Entwicklung: Code-Generierung, Testing, Deployment
10. Kundenbetreuung: Support, Onboarding, Feedback

WORKFLOW-TECHNOLOGIEN:
- AI-Tools: ChatGPT, Claude, GitHub Copilot, Excel AI, Power BI AI
- Automatisierung: Python, n8n, Zapier, Microsoft Power Automate
- Datenbanken: SQL, PostgreSQL, MongoDB, Excel, CSV
- APIs: REST, GraphQL, Webhooks, Integrations
- Cloud: AWS, Azure, Google Cloud, Supabase
- Monitoring: Alerts, Dashboards, Logs, Analytics`
      : `AVAILABLE WORKFLOW CATEGORIES:
1. Data Processing: ETL pipelines, data cleaning, transformation
2. Automation: Scripts, APIs, workflow orchestration
3. Analytics: Reporting, dashboards, business intelligence
4. Integration: System connections, databases, APIs
5. Quality Assurance: Validation, monitoring, alerts
6. Content Creation: Documentation, presentations, reports
7. Communication: Email, notifications, collaboration
8. Project Management: Task tracking, scheduling, coordination
9. Development: Code generation, testing, deployment
10. Customer Support: Support, onboarding, feedback

WORKFLOW TECHNOLOGIES:
- AI Tools: ChatGPT, Claude, GitHub Copilot, Excel AI, Power BI AI
- Automation: Python, n8n, Zapier, Microsoft Power Automate
- Databases: SQL, PostgreSQL, MongoDB, Excel, CSV
- APIs: REST, GraphQL, Webhooks, Integrations
- Cloud: AWS, Azure, Google Cloud, Supabase
- Monitoring: Alerts, Dashboards, Logs, Analytics`;

    const systemPrompt = lang === 'de' 
      ? `Du bist ein Experte für AI-Workflow-Automatisierung. Analysiere die Hauptaufgabe und Teilaufgaben, um passende Workflows zu empfehlen.

${workflowCategories}

AUFGABE: Erstelle spezifische, umsetzbare Workflows basierend auf:
1. Der Hauptaufgabe und ihren Anforderungen
2. Den konkreten Teilaufgaben und deren Automatisierungspotenzial
3. Den verfügbaren Technologien und AI-Tools
4. Realistischen Setup-Zeiten und Schwierigkeitsgraden

WICHTIG: Antworte ausschließlich mit gültigem JSON, keine zusätzlichen Erklärungen!

JSON-Format:
{"agents":[{"name":"Spezifischer AI-Agent","technology":"Konkrete Technologie-Stack","implementation":"Schritt-für-Schritt Anleitung","difficulty":"Einfach/Mittel/Schwer","setupTime":"Realistische Zeit","matchScore":0-100,"reasoning":"Warum dieser Agent perfekt für diese spezifische Aufgabe ist"}],"workflows":[{"name":"Spezifischer Workflow-Name","technology":"Konkrete Technologien","steps":["Spezifische Schritte für diese Aufgabe"],"difficulty":"Einfach/Mittel/Schwer","setupTime":"Realistische Zeit","matchScore":0-100,"reasoning":"Warum dieser Workflow optimal für diese Aufgabe ist"}]}

FOKUS: Erstelle Workflows, die direkt zur Aufgabe passen, nicht generische Lösungen!`
      : `You are an expert in AI workflow automation. Analyze the main task and subtasks to recommend suitable workflows.

${workflowCategories}

TASK: Create specific, actionable workflows based on:
1. The main task and its requirements
2. The concrete subtasks and their automation potential
3. Available technologies and AI tools
4. Realistic setup times and difficulty levels

IMPORTANT: Respond exclusively with valid JSON, no additional explanations!

JSON Format:
{"agents":[{"name":"Specific AI Agent","technology":"Concrete Technology Stack","implementation":"Step-by-step guide","difficulty":"Easy/Medium/Hard","setupTime":"Realistic time","matchScore":0-100,"reasoning":"Why this agent is perfect for this specific task"}],"workflows":[{"name":"Specific Workflow Name","technology":"Concrete Technologies","steps":["Specific steps for this task"],"difficulty":"Easy/Medium/Hard","setupTime":"Realistic time","matchScore":0-100,"reasoning":"Why this workflow is optimal for this task"}]}

FOCUS: Create workflows that directly match the task, not generic solutions!`;

    // Detaillierter User-Prompt mit Teilaufgaben
    const subtasksText = subtasks.map((subtask, index) => 
      `${index + 1}. ${subtask.title || subtask.text} (${subtask.automationPotential || 50}% automatisierbar, ${subtask.estimatedTime || 0}min, ${subtask.systems?.join(', ') || 'keine Systeme'})`
    ).join('\n');

    const userPrompt = lang === 'de'
      ? `HAUPTAUFGABE: ${taskText}

DETAILLIERTE TEILAUFGABEN:
${subtasksText}

AUFGABE: Erstelle spezifische Workflows und AI-Agenten, die:
1. Direkt zu den Teilaufgaben passen
2. Das Automatisierungspotenzial nutzen
3. Die genannten Systeme integrieren
4. Realistische Setup-Zeiten haben
5. Hohe Match-Scores (80-95%) haben

FOKUS: Workflows, die diese spezifische Aufgabe lösen, nicht generische Lösungen!`
      : `MAIN TASK: ${taskText}

DETAILED SUBTASKS:
${subtasksText}

TASK: Create specific workflows and AI agents that:
1. Directly match the subtasks
2. Utilize the automation potential
3. Integrate the mentioned systems
4. Have realistic setup times
5. Have high match scores (80-95%)

FOCUS: Workflows that solve this specific task, not generic solutions!`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, { max_tokens: 1200 }); // Erhöht für bessere Workflows
    
    try {
      const result = JSON.parse(response.content);
      
      // Kein Post-Processing - OpenAI hat die volle Kontrolle
      return result;
    } catch (error) {
      console.error('Failed to parse AI solutions response:', error);
      console.log('Raw response:', response.content);
      
      // Versuche JSON aus der Antwort zu extrahieren
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return result;
        }
      } catch (extractError) {
        console.error('Failed to extract JSON from response:', extractError);
      }
      
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
