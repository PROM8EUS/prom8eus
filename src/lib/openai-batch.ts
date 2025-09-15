/**
 * OpenAI Batch Processing
 * Verarbeitet mehrere Aufgaben in einem API-Aufruf um Token zu sparen
 */

import { optimizedOpenAIClient } from './openai-optimized';

export class BatchOpenAIClient {
  /**
   * Analysiert mehrere Tasks in einem Batch-Aufruf
   * Token-Einsparung: ~70% weniger API-Aufrufe
   */
  async analyzeTasksBatch(
    tasks: string[], 
    jobContext: string, 
    lang: 'de' | 'en' = 'de'
  ): Promise<Array<{
    task: string;
    score: number;
    label: "Automatisierbar" | "Teilweise Automatisierbar" | "Mensch";
    reasoning: string;
    confidence: number;
  }>> {
    if (tasks.length === 0) return [];

    // Kombiniere alle Tasks in einem Prompt
    const tasksText = tasks.map((task, index) => `${index + 1}. ${task}`).join('\n');
    
    const systemPrompt = lang === 'de'
      ? `Analysiere mehrere Aufgaben gleichzeitig. JSON:
{"results":[{"task":"Aufgabe 1","score":85,"label":"Automatisierbar","reasoning":"Begründung","confidence":0.9}]}
Labels: Automatisierbar, Teilweise Automatisierbar, Mensch`
      : `Analyze multiple tasks simultaneously. JSON:
{"results":[{"task":"Task 1","score":85,"label":"Automatable","reasoning":"reasoning","confidence":0.9}]}
Labels: Automatable, Partially Automatable, Human`;

    const userPrompt = `Context: ${jobContext.slice(0, 500)}\n\nTasks:\n${tasksText.slice(0, 2000)}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await optimizedOpenAIClient.chatCompletion(messages, {
      temperature: 0.2,
      max_tokens: 1500, // Mehr Tokens für Batch-Verarbeitung
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed.results || [];
    } catch (error) {
      console.error('Failed to parse batch response:', error);
      // Fallback: Einzelne Analyse
      return this.analyzeTasksIndividually(tasks, jobContext, lang);
    }
  }

  /**
   * Fallback: Analysiert Tasks einzeln wenn Batch fehlschlägt
   */
  private async analyzeTasksIndividually(
    tasks: string[], 
    jobContext: string, 
    lang: 'de' | 'en' = 'de'
  ): Promise<Array<{
    task: string;
    score: number;
    label: "Automatisierbar" | "Teilweise Automatisierbar" | "Mensch";
    reasoning: string;
    confidence: number;
  }>> {
    const results = [];
    
    // Verarbeite Tasks in kleineren Batches (3-5 Tasks)
    const batchSize = 3;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await this.analyzeTasksBatch(batch, jobContext, lang);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Generiert Subtasks für mehrere Hauptaufgaben gleichzeitig
   * Token-Einsparung: ~60% weniger API-Aufrufe
   */
  async generateSubtasksBatch(
    mainTasks: string[], 
    lang: 'de' | 'en' = 'de'
  ): Promise<Array<{
    mainTask: string;
    subtasks: Array<{
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
    }>;
  }>> {
    if (mainTasks.length === 0) return [];

    const tasksText = mainTasks.map((task, index) => `${index + 1}. ${task}`).join('\n');
    
    const systemPrompt = lang === 'de'
      ? `Zerlege mehrere Hauptaufgaben in Unteraufgaben. JSON:
{"results":[{"mainTask":"Hauptaufgabe","subtasks":[{"id":"1","title":"Unteraufgabe","description":"Beschreibung","automationPotential":75,"estimatedTime":30,"priority":"high","complexity":"medium","systems":["System"],"risks":["Risiko"],"opportunities":["Chance"],"dependencies":["Abhängigkeit"]}]}]}`
      : `Break down multiple main tasks into subtasks. JSON:
{"results":[{"mainTask":"Main task","subtasks":[{"id":"1","title":"subtask","description":"description","automationPotential":75,"estimatedTime":30,"priority":"high","complexity":"medium","systems":["system"],"risks":["risk"],"opportunities":["opportunity"],"dependencies":["dependency"]}]}]}`;

    const userPrompt = `Main Tasks:\n${tasksText.slice(0, 1500)}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await optimizedOpenAIClient.chatCompletion(messages, {
      temperature: 0.3,
      max_tokens: 2000, // Mehr Tokens für komplexere Batch-Verarbeitung
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed.results || [];
    } catch (error) {
      console.error('Failed to parse batch subtasks response:', error);
      // Fallback: Einzelne Verarbeitung
      return this.generateSubtasksIndividually(mainTasks, lang);
    }
  }

  /**
   * Fallback: Generiert Subtasks einzeln
   */
  private async generateSubtasksIndividually(
    mainTasks: string[], 
    lang: 'de' | 'en' = 'de'
  ): Promise<Array<{
    mainTask: string;
    subtasks: Array<{
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
    }>;
  }>> {
    const results = [];
    
    for (const task of mainTasks) {
      try {
        const subtasks = await optimizedOpenAIClient.generateSubtasks(task, lang);
        results.push({
          mainTask: task,
          subtasks
        });
      } catch (error) {
        console.error(`Failed to generate subtasks for task: ${task}`, error);
        results.push({
          mainTask: task,
          subtasks: []
        });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const batchOpenAIClient = new BatchOpenAIClient();
