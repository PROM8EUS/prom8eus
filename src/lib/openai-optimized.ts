/**
 * Optimized OpenAI Client - Token-Efficient Version
 * Reduziert Token-Verbrauch durch kürzere Prompts und bessere Strukturierung
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

export class OptimizedOpenAIClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    const config = getOpenAIConfig();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o-mini'; // Günstigeres Modell
  }

  isConfigured(): boolean {
    return isAIEnabled() && !!this.apiKey;
  }

  async chatCompletion(
    messages: OpenAIMessage[],
    options?: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
    }
  ): Promise<OpenAIResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI not configured');
    }

    const requestBody = {
      model: this.model,
      messages,
      temperature: options?.temperature || 0.3, // Niedrigere Temperatur = konsistentere Antworten
      max_tokens: options?.max_tokens || 800, // Reduzierte Token-Limits
      top_p: options?.top_p || 0.9,
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
        const errorData = await response.json();
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
   * OPTIMIERT: Kürzerer Prompt für Job-Analyse
   * Token-Einsparung: ~60% weniger System-Prompt
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
    // Kürzerer System-Prompt
    const systemPrompt = lang === 'de' 
      ? `Extrahiere Aufgaben aus Stellenbeschreibungen. JSON-Format:
{"tasks":[{"text":"Aufgabe","automationPotential":85,"category":"admin","reasoning":"Begründung"}],"summary":"Zusammenfassung"}
Kategorien: admin,tech,analytisch,kreativ,management,kommunikation,routine,physisch`
      : `Extract tasks from job descriptions. JSON format:
{"tasks":[{"text":"task","automationPotential":85,"category":"admin","reasoning":"reasoning"}],"summary":"summary"}
Categories: admin,tech,analytical,creative,management,communication,routine,physical`;

    // Kürzerer User-Prompt
    const userPrompt = `${jobText.slice(0, 2000)}`; // Begrenze Input-Länge

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, {
      temperature: 0.2,
      max_tokens: 1200, // Reduziert von 2000
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
   * OPTIMIERT: Vereinfachte Subtask-Generierung
   * Token-Einsparung: ~50% weniger Prompt
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
      ? `Zerlege Aufgabe in Unteraufgaben. JSON:
{"subtasks":[{"id":"1","title":"Titel","description":"Beschreibung","automationPotential":75,"estimatedTime":30,"priority":"high","complexity":"medium","systems":["System"],"risks":["Risiko"],"opportunities":["Chance"],"dependencies":["Abhängigkeit"]}]}`
      : `Break task into subtasks. JSON:
{"subtasks":[{"id":"1","title":"title","description":"description","automationPotential":75,"estimatedTime":30,"priority":"high","complexity":"medium","systems":["system"],"risks":["risk"],"opportunities":["opportunity"],"dependencies":["dependency"]}]}`;

    const userPrompt = `${taskText.slice(0, 1000)}`; // Begrenzte Input-Länge

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, {
      temperature: 0.3,
      max_tokens: 1000, // Reduziert von 1500
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
   * OPTIMIERT: Kompakte AI-Agent Empfehlungen
   * Token-Einsparung: ~70% weniger Prompt
   */
  async recommendAIAgents(taskText: string, lang: 'de' | 'en' = 'de'): Promise<Array<{
    name: string;
    technology: string;
    implementation: string;
    difficulty: 'Einfach' | 'Mittel' | 'Schwer';
    setupTime: string;
  }>> {
    const systemPrompt = lang === 'de'
      ? `Empfehle AI-Agenten. JSON:
{"agents":[{"name":"Name","technology":"Tech","implementation":"Schritte","difficulty":"Mittel","setupTime":"2-4h"}]}`
      : `Recommend AI agents. JSON:
{"agents":[{"name":"name","technology":"tech","implementation":"steps","difficulty":"Medium","setupTime":"2-4h"}]}`;

    const userPrompt = `${taskText.slice(0, 800)}`; // Noch kürzerer Input

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, {
      temperature: 0.4,
      max_tokens: 800, // Reduziert von 1500
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
   * OPTIMIERT: Vereinfachte Task-Analyse
   * Token-Einsparung: ~40% weniger Prompt
   */
  async analyzeTask(taskText: string, jobContext: string, lang: 'de' | 'en' = 'de'): Promise<{
    score: number;
    label: "Automatisierbar" | "Teilweise Automatisierbar" | "Mensch";
    reasoning: string;
    confidence: number;
  }> {
    const systemPrompt = lang === 'de'
      ? `Analysiere Automatisierungspotenzial. JSON:
{"score":85,"label":"Automatisierbar","reasoning":"Begründung","confidence":0.9}
Labels: Automatisierbar, Teilweise Automatisierbar, Mensch`
      : `Analyze automation potential. JSON:
{"score":85,"label":"Automatable","reasoning":"reasoning","confidence":0.9}
Labels: Automatable, Partially Automatable, Human`;

    const userPrompt = `Task: ${taskText.slice(0, 500)}\nContext: ${jobContext.slice(0, 300)}`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await this.chatCompletion(messages, {
      temperature: 0.2,
      max_tokens: 400, // Reduziert von 1000
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed;
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }
  }
}

// Export singleton instance
export const optimizedOpenAIClient = new OptimizedOpenAIClient();
