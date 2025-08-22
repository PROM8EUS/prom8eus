// LLM Provider Configuration for Task Analysis
export interface LLMConfig {
  name: string;
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  costPer1kTokens: number;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'low';
  features: string[];
  pros: string[];
  cons: string[];
  apiEndpoint: string;
  requiresKey: boolean;
}

export const LLM_PROVIDERS: Record<string, LLMConfig> = {
  // OpenAI Options
  'gpt-4': {
    name: 'GPT-4',
    provider: 'OpenAI',
    model: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.3,
    costPer1kTokens: 0.03, // $0.03 per 1K input tokens
    speed: 'medium',
    quality: 'high',
    features: ['JSON Output', 'Structured Analysis', 'Context Understanding'],
    pros: ['Beste Qualität', 'Zuverlässige JSON-Ausgabe', 'Gute Dokumentation'],
    cons: ['Teuer', 'Rate Limits', 'Datenschutz-Bedenken'],
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    requiresKey: true
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    model: 'gpt-4-1106-preview',
    maxTokens: 128000,
    temperature: 0.3,
    costPer1kTokens: 0.01, // $0.01 per 1K input tokens
    speed: 'fast',
    quality: 'high',
    features: ['JSON Output', 'Structured Analysis', 'Large Context'],
    pros: ['Günstiger als GPT-4', 'Schneller', 'Großer Kontext'],
    cons: ['Noch teuer', 'Rate Limits'],
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    requiresKey: true
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo',
    maxTokens: 4000,
    temperature: 0.3,
    costPer1kTokens: 0.002, // $0.002 per 1K input tokens
    speed: 'fast',
    quality: 'medium',
    features: ['JSON Output', 'Cost Effective'],
    pros: ['Sehr günstig', 'Schnell', 'Stabil'],
    cons: ['Niedrigere Qualität', 'Kleinerer Kontext'],
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    requiresKey: true
  },

  // Anthropic Options
  'claude-3-opus': {
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    model: 'claude-3-opus-20240229',
    maxTokens: 200000,
    temperature: 0.3,
    costPer1kTokens: 0.015, // $0.015 per 1K input tokens
    speed: 'medium',
    quality: 'high',
    features: ['JSON Output', 'Business Analysis', 'Large Context'],
    pros: ['Sehr hohe Qualität', 'Großer Kontext', 'Business-fokussiert'],
    cons: ['Teuer', 'Langsamer', 'Rate Limits'],
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    requiresKey: true
  },
  'claude-3-sonnet': {
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 200000,
    temperature: 0.3,
    costPer1kTokens: 0.003, // $0.003 per 1K input tokens
    speed: 'fast',
    quality: 'high',
    features: ['JSON Output', 'Business Analysis', 'Cost Effective'],
    pros: ['Gute Qualität', 'Günstig', 'Schnell'],
    cons: ['Rate Limits'],
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    requiresKey: true
  },

  // Local/Open Source Options
  'ollama-mistral': {
    name: 'Mistral (Ollama)',
    provider: 'Ollama',
    model: 'mistral',
    maxTokens: 4000,
    temperature: 0.3,
    costPer1kTokens: 0, // Free
    speed: 'medium',
    quality: 'medium',
    features: ['Local Deployment', 'No API Costs', 'Privacy'],
    pros: ['Kostenlos', 'Datenschutz', 'Keine Rate Limits'],
    cons: ['Niedrigere Qualität', 'Setup erforderlich', 'Ressourcen-intensiv'],
    apiEndpoint: 'http://localhost:11434/api/generate',
    requiresKey: false
  },
  'ollama-llama2': {
    name: 'Llama 2 (Ollama)',
    provider: 'Ollama',
    model: 'llama2',
    maxTokens: 4000,
    temperature: 0.3,
    costPer1kTokens: 0, // Free
    speed: 'slow',
    quality: 'medium',
    features: ['Local Deployment', 'No API Costs'],
    pros: ['Kostenlos', 'Datenschutz'],
    cons: ['Langsam', 'Niedrigere Qualität', 'Setup erforderlich'],
    apiEndpoint: 'http://localhost:11434/api/generate',
    requiresKey: false
  },

  // Google Options
  'gemini-pro': {
    name: 'Gemini Pro',
    provider: 'Google',
    model: 'gemini-pro',
    maxTokens: 30000,
    temperature: 0.3,
    costPer1kTokens: 0.0005, // $0.0005 per 1K input tokens
    speed: 'fast',
    quality: 'medium',
    features: ['JSON Output', 'Very Cost Effective'],
    pros: ['Sehr günstig', 'Schnell', 'Google Integration'],
    cons: ['Niedrigere Qualität', 'Rate Limits'],
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    requiresKey: true
  }
};

// Recommended configurations for different use cases
export const RECOMMENDATIONS = {
  'production-high-quality': {
    name: 'Production - High Quality',
    provider: 'claude-3-sonnet',
    reasoning: 'Beste Balance aus Qualität und Kosten für Produktionsumgebung',
    estimatedCost: '~$0.50 pro 1000 Analysen'
  },
  'production-cost-effective': {
    name: 'Production - Cost Effective',
    provider: 'gemini-pro',
    reasoning: 'Sehr günstig bei akzeptabler Qualität',
    estimatedCost: '~$0.10 pro 1000 Analysen'
  },
  'development-testing': {
    name: 'Development & Testing',
    provider: 'gpt-3.5-turbo',
    reasoning: 'Günstig und schnell für Entwicklung',
    estimatedCost: '~$0.20 pro 1000 Analysen'
  },
  'privacy-focused': {
    name: 'Privacy Focused',
    provider: 'ollama-mistral',
    reasoning: 'Lokale Ausführung, keine Datenübertragung',
    estimatedCost: 'Kostenlos (Hardware-Kosten)'
  }
};

// LLM Client Implementation
export class LLMClient {
  private config: LLMConfig;
  private apiKey?: string;

  constructor(providerKey: string, apiKey?: string) {
    this.config = LLM_PROVIDERS[providerKey];
    this.apiKey = apiKey;
  }

  async analyzeTask(taskContext: string): Promise<string> {
    const prompt = this.buildTaskAnalysisPrompt(taskContext);
    
    switch (this.config.provider) {
      case 'OpenAI':
        return this.callOpenAI(prompt);
      case 'Anthropic':
        return this.callAnthropic(prompt);
      case 'Google':
        return this.callGoogle(prompt);
      case 'Ollama':
        return this.callOllama(prompt);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private buildTaskAnalysisPrompt(taskContext: string): string {
    return `Analyze the following business task and generate appropriate subtasks:

${taskContext}

Please analyze this task and:
1. Determine the most appropriate business domain (customer-service, data-analysis, marketing, sales, finance-accounting, hr-recruitment, operations, or general)
2. Generate 4 relevant subtasks with realistic time allocations and automation potential
3. Provide reasoning for your domain classification

Respond in JSON format with:
{
  "domain": "string",
  "confidence": number (0-1),
  "subtasks": [
    {
      "id": "string",
      "title": "string",
      "systems": ["string"],
      "manualHoursShare": number (0-1),
      "automationPotential": number (0-1),
      "risks": ["string"],
      "assumptions": ["string"]
    }
  ],
  "reasoning": "string"
}`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error('OpenAI API key required');
    
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a business process analyst. Analyze tasks and generate appropriate subtasks in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error('Anthropic API key required');
    
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    const data = await response.json();
    return data.content[0].text;
  }

  private async callGoogle(prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error('Google API key required');
    
    const response = await fetch(`${this.config.apiEndpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens
        }
      })
    });
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async callOllama(prompt: string): Promise<string> {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.config.temperature
        }
      })
    });
    
    const data = await response.json();
    return data.response;
  }
}

// Cost Calculator
export function calculateAnalysisCost(providerKey: string, averageTokensPerAnalysis: number = 500): number {
  const config = LLM_PROVIDERS[providerKey];
  return (config.costPer1kTokens * averageTokensPerAnalysis) / 1000;
}

// Provider Selection Helper
export function getRecommendedProvider(useCase: keyof typeof RECOMMENDATIONS): string {
  return RECOMMENDATIONS[useCase].provider;
}
