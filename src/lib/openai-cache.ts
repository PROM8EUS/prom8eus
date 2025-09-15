/**
 * OpenAI Response Cache
 * Speichert häufig verwendete Antworten um Token zu sparen
 */

interface CacheEntry {
  response: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class OpenAICache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 Stunden

  /**
   * Generiert einen Cache-Key basierend auf dem Prompt
   */
  private generateKey(prompt: string, model: string): string {
    // Erstelle einen Hash des Prompts für konsistente Keys
    const encoder = new TextEncoder();
    const data = encoder.encode(`${prompt}-${model}`);
    return Array.from(data)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32); // Kürze auf 32 Zeichen
  }

  /**
   * Speichert eine Antwort im Cache
   */
  set(prompt: string, model: string, response: any, ttl?: number): void {
    const key = this.generateKey(prompt, model);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }

  /**
   * Holt eine Antwort aus dem Cache
   */
  get(prompt: string, model: string): any | null {
    const key = this.generateKey(prompt, model);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Prüfe ob der Eintrag abgelaufen ist
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  /**
   * Löscht abgelaufene Einträge
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gibt Cache-Statistiken zurück
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implementiere Hit-Rate Tracking
    };
  }

  /**
   * Leert den gesamten Cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const openAICache = new OpenAICache();

/**
 * Cached OpenAI Client Wrapper
 * Kombiniert den optimierten Client mit Caching
 */
export class CachedOpenAIClient {
  private client: any;
  private cache: OpenAICache;

  constructor(client: any) {
    this.client = client;
    this.cache = openAICache;
  }

  async analyzeJobDescription(jobText: string, lang: 'de' | 'en' = 'de'): Promise<any> {
    const prompt = `analyze-job-${jobText.slice(0, 500)}-${lang}`;
    const model = 'gpt-4o-mini';
    
    // Prüfe Cache zuerst
    const cached = this.cache.get(prompt, model);
    if (cached) {
      console.log('🎯 Cache hit for job analysis - Token gespart!');
      return cached;
    }

    // Falls nicht im Cache, führe API-Aufruf durch
    const response = await this.client.analyzeJobDescription(jobText, lang);
    
    // Speichere im Cache
    this.cache.set(prompt, model, response, 12 * 60 * 60 * 1000); // 12 Stunden TTL
    
    return response;
  }

  async analyzeTask(taskText: string, jobContext: string, lang: 'de' | 'en' = 'de'): Promise<any> {
    const prompt = `analyze-task-${taskText.slice(0, 300)}-${lang}`;
    const model = 'gpt-4o-mini';
    
    // Prüfe Cache zuerst
    const cached = this.cache.get(prompt, model);
    if (cached) {
      console.log('🎯 Cache hit for task analysis - Token gespart!');
      return cached;
    }

    // Falls nicht im Cache, führe API-Aufruf durch
    const response = await this.client.analyzeTask(taskText, jobContext, lang);
    
    // Speichere im Cache
    this.cache.set(prompt, model, response, 6 * 60 * 60 * 1000); // 6 Stunden TTL
    
    return response;
  }

  async generateSubtasks(taskText: string, lang: 'de' | 'en' = 'de'): Promise<any> {
    const prompt = `generate-subtasks-${taskText.slice(0, 300)}-${lang}`;
    const model = 'gpt-4o-mini';
    
    // Prüfe Cache zuerst
    const cached = this.cache.get(prompt, model);
    if (cached) {
      console.log('🎯 Cache hit for subtasks - Token gespart!');
      return cached;
    }

    // Falls nicht im Cache, führe API-Aufruf durch
    const response = await this.client.generateSubtasks(taskText, lang);
    
    // Speichere im Cache
    this.cache.set(prompt, model, response, 8 * 60 * 60 * 1000); // 8 Stunden TTL
    
    return response;
  }

  async recommendAIAgents(taskText: string, lang: 'de' | 'en' = 'de'): Promise<any> {
    const prompt = `recommend-agents-${taskText.slice(0, 300)}-${lang}`;
    const model = 'gpt-4o-mini';
    
    // Prüfe Cache zuerst
    const cached = this.cache.get(prompt, model);
    if (cached) {
      console.log('🎯 Cache hit for agent recommendations - Token gespart!');
      return cached;
    }

    // Falls nicht im Cache, führe API-Aufruf durch
    const response = await this.client.recommendAIAgents(taskText, lang);
    
    // Speichere im Cache
    this.cache.set(prompt, model, response, 24 * 60 * 60 * 1000); // 24 Stunden TTL
    
    return response;
  }
}
