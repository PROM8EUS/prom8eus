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
    // Erweiterte Workflow-Beispiele basierend auf verfügbaren Workflows
    const workflowExamples = lang === 'de' 
      ? `VERFÜGBARE WORKFLOWS:
1. Code-Review-Automatisierung: GitHub Copilot + ChatGPT + CI/CD
2. Datenanalyse-Pipeline: Excel AI + Power BI + Python Scripts
3. Content-Erstellung: Jasper + Canva AI + Social Media Scheduler
4. E-Mail-Marketing: Copy.ai + Mailchimp + Analytics Dashboard
5. Bug-Tracking: GitHub Issues + Claude + Automated Testing
6. Social Media Management: ChatGPT + Buffer + Analytics
7. Dokumentation: Notion AI + GitHub + Automated Updates
8. Lead-Generierung: Perplexity + CRM + Email Automation
9. Performance-Monitoring: Power BI + Alerts + Automated Reports
10. Customer Support: ChatGPT + Zendesk + Knowledge Base

BEISPIELE FÜR SPEZIFISCHE AUFGABEN:
- "Debug application issues" → Bug-Tracking Workflow
- "Manage advertising campaigns" → E-Mail-Marketing Workflow  
- "Analyze market research" → Datenanalyse-Pipeline
- "Create content strategies" → Content-Erstellung Workflow
- "Optimize database queries" → Performance-Monitoring Workflow`
      : `AVAILABLE WORKFLOWS:
1. Code Review Automation: GitHub Copilot + ChatGPT + CI/CD
2. Data Analysis Pipeline: Excel AI + Power BI + Python Scripts
3. Content Creation: Jasper + Canva AI + Social Media Scheduler
4. Email Marketing: Copy.ai + Mailchimp + Analytics Dashboard
5. Bug Tracking: GitHub Issues + Claude + Automated Testing
6. Social Media Management: ChatGPT + Buffer + Analytics
7. Documentation: Notion AI + GitHub + Automated Updates
8. Lead Generation: Perplexity + CRM + Email Automation
9. Performance Monitoring: Power BI + Alerts + Automated Reports
10. Customer Support: ChatGPT + Zendesk + Knowledge Base

EXAMPLES FOR SPECIFIC TASKS:
- "Debug application issues" → Bug Tracking Workflow
- "Manage advertising campaigns" → Email Marketing Workflow
- "Analyze market research" → Data Analysis Pipeline
- "Create content strategies" → Content Creation Workflow
- "Optimize database queries" → Performance Monitoring Workflow`;

    const systemPrompt = lang === 'de' 
      ? `Du bist ein Experte für AI-Workflow-Automatisierung. Empfehle spezifische Workflows basierend auf den Teilaufgaben.

${workflowExamples}

JSON-Format:
{"agents":[{"name":"GitHub Copilot","technology":"AI Code Assistant","implementation":"1. Install VS Code Extension 2. Configure API Key 3. Start coding with AI suggestions","difficulty":"Einfach","setupTime":"30min","matchScore":95,"reasoning":"Perfekt für Code-Review und Debugging"}],"workflows":[{"name":"Bug-Tracking Workflow","technology":"GitHub + Claude + Testing","steps":["1. Automatische Bug-Erkennung","2. AI-gestützte Analyse","3. Automatische Test-Generierung","4. Status-Updates"],"difficulty":"Mittel","setupTime":"2-4h","matchScore":90,"reasoning":"Automatisiert kompletten Bug-Lifecycle"}]}

WICHTIG: Basiere Empfehlungen auf den konkreten Teilaufgaben, nicht auf generischen Lösungen!`
      : `You are an expert in AI workflow automation. Recommend specific workflows based on subtasks.

${workflowExamples}

JSON Format:
{"agents":[{"name":"GitHub Copilot","technology":"AI Code Assistant","implementation":"1. Install VS Code Extension 2. Configure API Key 3. Start coding with AI suggestions","difficulty":"Easy","setupTime":"30min","matchScore":95,"reasoning":"Perfect for code review and debugging"}],"workflows":[{"name":"Bug Tracking Workflow","technology":"GitHub + Claude + Testing","steps":["1. Automatic bug detection","2. AI-powered analysis","3. Automated test generation","4. Status updates"],"difficulty":"Medium","setupTime":"2-4h","matchScore":90,"reasoning":"Automates complete bug lifecycle"}]}

IMPORTANT: Base recommendations on concrete subtasks, not generic solutions!`;

    // Detaillierter User-Prompt mit Teilaufgaben
    const subtasksText = subtasks.map((subtask, index) => 
      `${index + 1}. ${subtask.title || subtask.text} (${subtask.automationPotential || 50}% automatisierbar)`
    ).join('\n');

    const userPrompt = lang === 'de'
      ? `HAUPTAUFGABE: ${taskText}

TEILAUFGABEN:
${subtasksText}

Empfehle spezifische AI-Agenten und Workflows, die zu diesen Teilaufgaben passen. Fokussiere auf konkrete, umsetzbare Lösungen.`
      : `MAIN TASK: ${taskText}

SUBTASKS:
${subtasksText}

Recommend specific AI agents and workflows that match these subtasks. Focus on concrete, actionable solutions.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, { max_tokens: 1200 }); // Erhöht für bessere Workflows
    
    try {
      const result = JSON.parse(response.content);
      
      // Post-Processing: Verbessere Workflows basierend auf Teilaufgaben
      const enhancedResult = this.enhanceWorkflowRecommendations(result, subtasks, lang);
      
      return enhancedResult;
    } catch (error) {
      console.error('Failed to parse AI solutions response:', error);
      // Fallback response
      return {
        agents: [],
        workflows: []
      };
    }
  }

  /**
   * Verbessert Workflow-Empfehlungen basierend auf konkreten Teilaufgaben
   */
  private enhanceWorkflowRecommendations(
    result: any, 
    subtasks: any[], 
    lang: 'de' | 'en' = 'de'
  ): any {
    // Workflow-Mapping basierend auf Teilaufgaben-Keywords
    const workflowMappings = {
      'debug': {
        name: lang === 'de' ? 'Bug-Tracking Workflow' : 'Bug Tracking Workflow',
        technology: 'GitHub + Claude + Automated Testing',
        steps: lang === 'de' 
          ? ['1. Automatische Bug-Erkennung', '2. AI-gestützte Analyse', '3. Test-Generierung', '4. Status-Updates']
          : ['1. Automatic bug detection', '2. AI-powered analysis', '3. Test generation', '4. Status updates'],
        difficulty: lang === 'de' ? 'Mittel' : 'Medium',
        setupTime: '2-4h',
        matchScore: 95,
        reasoning: lang === 'de' ? 'Automatisiert kompletten Bug-Lifecycle' : 'Automates complete bug lifecycle'
      },
      'analyze': {
        name: lang === 'de' ? 'Datenanalyse-Pipeline' : 'Data Analysis Pipeline',
        technology: 'Excel AI + Power BI + Python Scripts',
        steps: lang === 'de'
          ? ['1. Daten-Sammlung', '2. AI-gestützte Analyse', '3. Visualisierung', '4. Automatische Reports']
          : ['1. Data collection', '2. AI-powered analysis', '3. Visualization', '4. Automated reports'],
        difficulty: lang === 'de' ? 'Mittel' : 'Medium',
        setupTime: '3-5h',
        matchScore: 90,
        reasoning: lang === 'de' ? 'Automatisiert komplette Datenanalyse' : 'Automates complete data analysis'
      },
      'create': {
        name: lang === 'de' ? 'Content-Erstellung Workflow' : 'Content Creation Workflow',
        technology: 'Jasper + Canva AI + Social Media Scheduler',
        steps: lang === 'de'
          ? ['1. Content-Ideen', '2. AI-gestützte Erstellung', '3. Design-Optimierung', '4. Automatische Veröffentlichung']
          : ['1. Content ideas', '2. AI-powered creation', '3. Design optimization', '4. Automatic publishing'],
        difficulty: lang === 'de' ? 'Einfach' : 'Easy',
        setupTime: '1-2h',
        matchScore: 85,
        reasoning: lang === 'de' ? 'Automatisiert Content-Produktion' : 'Automates content production'
      },
      'manage': {
        name: lang === 'de' ? 'Projekt-Management Workflow' : 'Project Management Workflow',
        technology: 'Notion AI + GitHub + Automated Updates',
        steps: lang === 'de'
          ? ['1. Task-Erstellung', '2. Automatische Zuordnung', '3. Progress-Tracking', '4. Status-Updates']
          : ['1. Task creation', '2. Automatic assignment', '3. Progress tracking', '4. Status updates'],
        difficulty: lang === 'de' ? 'Mittel' : 'Medium',
        setupTime: '2-3h',
        matchScore: 80,
        reasoning: lang === 'de' ? 'Automatisiert Projekt-Workflows' : 'Automates project workflows'
      },
      'optimize': {
        name: lang === 'de' ? 'Performance-Monitoring Workflow' : 'Performance Monitoring Workflow',
        technology: 'Power BI + Alerts + Automated Reports',
        steps: lang === 'de'
          ? ['1. Performance-Monitoring', '2. Automatische Alerts', '3. Optimierungs-Vorschläge', '4. Report-Generierung']
          : ['1. Performance monitoring', '2. Automatic alerts', '3. Optimization suggestions', '4. Report generation'],
        difficulty: lang === 'de' ? 'Schwer' : 'Hard',
        setupTime: '4-6h',
        matchScore: 85,
        reasoning: lang === 'de' ? 'Automatisiert Performance-Optimierung' : 'Automates performance optimization'
      }
    };

    // Analysiere Teilaufgaben und finde passende Workflows
    const enhancedWorkflows = [];
    const subtaskTexts = subtasks.map(s => (s.title || s.text).toLowerCase()).join(' ');

    // Prüfe auf Keywords in Teilaufgaben
    for (const [keyword, workflow] of Object.entries(workflowMappings)) {
      if (subtaskTexts.includes(keyword)) {
        enhancedWorkflows.push(workflow);
      }
    }

    // Füge spezifische Workflows hinzu, falls noch keine vorhanden
    if (enhancedWorkflows.length === 0) {
      // Fallback: Generiere basierend auf Automatisierungspotenzial
      const avgAutomation = subtasks.reduce((sum, s) => sum + (s.automationPotential || 50), 0) / subtasks.length;
      
      if (avgAutomation > 70) {
        enhancedWorkflows.push(workflowMappings['analyze']);
      } else if (avgAutomation > 50) {
        enhancedWorkflows.push(workflowMappings['manage']);
      } else {
        enhancedWorkflows.push(workflowMappings['create']);
      }
    }

    // Kombiniere AI-generierte und verbesserte Workflows
    const finalWorkflows = [
      ...(result.workflows || []),
      ...enhancedWorkflows
    ];

    // Entferne Duplikate basierend auf Namen
    const uniqueWorkflows = finalWorkflows.filter((workflow, index, self) => 
      index === self.findIndex(w => w.name === workflow.name)
    );

    return {
      ...result,
      workflows: uniqueWorkflows.slice(0, 3) // Max 3 Workflows
    };
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
