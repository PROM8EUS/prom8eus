/**
 * AI Prompt Generator Service
 * Generates optimized prompts for different LLM services based on subtasks
 */

import { DynamicSubtask, SolutionStatus, GenerationMetadata } from '../types';
import { openaiClient } from '../openai';
import { LLMSolutionInterface } from '../interfaces';

export interface GeneratedPrompt extends LLMSolutionInterface {
  isAIGenerated: true;
  generatedAt: string;
  service: 'ChatGPT' | 'Claude' | 'Gemini' | 'Custom';
  style: 'formal' | 'creative' | 'technical';
  preview: string;
  config: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
}

/**
 * Generate an optimized prompt for a subtask
 */
export async function generatePromptForSubtask(
  subtask: DynamicSubtask,
  service: 'ChatGPT' | 'Claude' | 'Gemini' | 'Custom' = 'ChatGPT',
  style: 'formal' | 'creative' | 'technical' = 'formal',
  lang: 'de' | 'en' = 'en',
  timeoutMs: number = 5000
): Promise<GeneratedPrompt | null> {
  console.log(`💬 [PromptGenerator] Generating ${service} prompt for: "${subtask.title}" (style: ${style}, timeout: ${timeoutMs}ms)`);
  
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout')), timeoutMs);
    });
    
    // Race between API call and timeout
    const prompt = lang === 'de' ? `
Erstelle einen optimierten Prompt für ${service} für diese Teilaufgabe:

Titel: ${subtask.title}
Beschreibung: ${subtask.description || 'Keine Beschreibung'}
Automatisierungspotenzial: ${Math.round(subtask.automationPotential * 100)}%
Komplexität: ${subtask.complexity}
Systeme: ${subtask.systems.join(', ') || 'Keine angegeben'}

Erstelle einen ${style === 'formal' ? 'formellen' : style === 'creative' ? 'kreativen' : 'technischen'} Prompt mit:
1. Klare Anweisungen für die Aufgabe
2. Spezifische Kontextinformationen
3. Erwartete Ausgabeformat
4. Beispiele oder Vorlagen (falls relevant)
5. Qualitätskriterien

Antworte nur mit einem JSON-Objekt im folgenden Format:
{
  "prompt": "Der vollständige Prompt-Text",
  "preview": "Kurze Vorschau des Prompts (max 100 Zeichen)",
  "style": "${style}",
  "service": "${service}",
  "config": {
    "temperature": 0.7,
    "maxTokens": 1000,
    "topP": 0.9,
    "frequencyPenalty": 0.0,
    "presencePenalty": 0.0
  }
}
` : `
Create an optimized prompt for ${service} for this subtask:

Title: ${subtask.title}
Description: ${subtask.description || 'No description'}
Automation Potential: ${Math.round(subtask.automationPotential * 100)}%
Complexity: ${subtask.complexity}
Systems: ${subtask.systems.join(', ') || 'None specified'}

Create a ${style} prompt with:
1. Clear instructions for the task
2. Specific context information
3. Expected output format
4. Examples or templates (if relevant)
5. Quality criteria

Respond only with a JSON object in this format:
{
  "prompt": "The complete prompt text",
  "preview": "Short preview of the prompt (max 100 chars)",
  "style": "${style}",
  "service": "${service}",
  "config": {
    "temperature": 0.7,
    "maxTokens": 1000,
    "topP": 0.9,
    "frequencyPenalty": 0.0,
    "presencePenalty": 0.0
  }
}
`;

    console.log('📡 [PromptGenerator] Calling OpenAI API with timeout...');
    
    const apiCallPromise = openaiClient.chatCompletion([
      {
        role: 'system',
        content: lang === 'de' 
          ? 'Du bist ein Experte für Prompt-Engineering und LLM-Optimierung. Erstelle präzise, effektive Prompts für verschiedene AI-Services. Antworte NUR mit gültigem JSON.'
          : 'You are an expert in prompt engineering and LLM optimization. Create precise, effective prompts for different AI services. Respond ONLY with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.7,
      max_tokens: 800
    });
    
    // Race between API call and timeout
    const response = await Promise.race([apiCallPromise, timeoutPromise]);
    
    console.log('✅ [PromptGenerator] OpenAI API responded successfully');

    const content = response.content;
    if (!content) {
      console.warn('⚠️ [PromptGenerator] No content in AI response');
      return null;
    }

    console.log('📝 [PromptGenerator] Parsing AI response...');
    const aiPrompt = JSON.parse(content);
    console.log('✨ [PromptGenerator] Parsed prompt for:', aiPrompt.service);
    
    // Create generation metadata
    const generationMetadata: GenerationMetadata = {
      timestamp: Date.now(),
      model: 'gpt-4o-mini',
      language: lang,
      cacheKey: `prompt_${subtask.id}_${service}_${style}_${Date.now()}`
    };

    const generatedPrompt: GeneratedPrompt = {
      id: `ai-generated-prompt-${subtask.id}-${service}-${Date.now()}`,
      prompt: aiPrompt.prompt,
      service: aiPrompt.service || service,
      style: aiPrompt.style || style,
      preview: aiPrompt.preview || aiPrompt.prompt.substring(0, 100) + '...',
      status: 'generated',
      isAIGenerated: true,
      generationMetadata,
      generatedAt: new Date().toISOString(),
      config: aiPrompt.config || {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    };

    console.log('✨ [PromptGenerator] Generated AI prompt for:', generatedPrompt.service);
    return generatedPrompt;

  } catch (error) {
    console.error('❌ [PromptGenerator] Error generating prompt:', error);
    return null;
  }
}

/**
 * Generate prompts for all subtasks in parallel
 */
export async function generatePromptsForSubtasks(
  subtasks: DynamicSubtask[],
  service: 'ChatGPT' | 'Claude' | 'Gemini' | 'Custom' = 'ChatGPT',
  style: 'formal' | 'creative' | 'technical' = 'formal',
  lang: 'de' | 'en' = 'en'
): Promise<Map<string, GeneratedPrompt>> {
  const promptMap = new Map<string, GeneratedPrompt>();

  // Generate in parallel with Promise.allSettled to avoid one failure blocking others
  const promises = subtasks.map(async (subtask) => {
    const prompt = await generatePromptForSubtask(subtask, service, style, lang);
    return { subtaskId: subtask.id, prompt };
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.prompt) {
      promptMap.set(result.value.subtaskId, result.value.prompt);
    }
  });

  console.log(`✨ [PromptGenerator] Generated ${promptMap.size}/${subtasks.length} prompts`);
  return promptMap;
}

/**
 * Generate fallback prompt when AI generation fails
 */
export function generateFallbackPrompt(
  subtask: DynamicSubtask,
  service: 'ChatGPT' | 'Claude' | 'Gemini' | 'Custom' = 'ChatGPT',
  style: 'formal' | 'creative' | 'technical' = 'formal',
  lang: 'de' | 'en' = 'en'
): GeneratedPrompt {
  const fallbackPrompt = lang === 'de' ? `
Bitte helfen Sie mir bei der Automatisierung folgender Aufgabe:

**Aufgabe:** ${subtask.title}
**Beschreibung:** ${subtask.description || 'Keine Beschreibung verfügbar'}
**Komplexität:** ${subtask.complexity}
**Systeme:** ${subtask.systems.join(', ') || 'Keine angegeben'}

Bitte erstellen Sie:
1. Eine detaillierte Schritt-für-Schritt Anleitung
2. Mögliche Automatisierungsansätze
3. Empfohlene Tools oder Technologien
4. Geschätzte Zeitersparnis

Formatieren Sie die Antwort strukturiert und praxisnah.
` : `
Please help me automate the following task:

**Task:** ${subtask.title}
**Description:** ${subtask.description || 'No description available'}
**Complexity:** ${subtask.complexity}
**Systems:** ${subtask.systems.join(', ') || 'None specified'}

Please create:
1. A detailed step-by-step guide
2. Possible automation approaches
3. Recommended tools or technologies
4. Estimated time savings

Format your response in a structured and practical way.
`;

  const fallbackPreview = lang === 'de' 
    ? `Automatisierungshilfe für: ${subtask.title.substring(0, 50)}...`
    : `Automation help for: ${subtask.title.substring(0, 50)}...`;

  const generationMetadata: GenerationMetadata = {
    timestamp: Date.now(),
    model: 'fallback',
    language: lang,
    cacheKey: `fallback_prompt_${subtask.id}_${service}_${style}_${Date.now()}`
  };

  return {
    id: `fallback-prompt-${subtask.id}-${service}-${style}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    prompt: fallbackPrompt,
    service,
    style,
    preview: fallbackPreview,
    status: 'fallback',
    isAIGenerated: true,
    generationMetadata,
    generatedAt: new Date().toISOString(),
    config: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    }
  };
}

/**
 * Enhanced prompt generation with fallback support
 */
export async function generatePromptWithFallback(
  subtask: DynamicSubtask,
  service: 'ChatGPT' | 'Claude' | 'Gemini' | 'Custom' = 'ChatGPT',
  style: 'formal' | 'creative' | 'technical' = 'formal',
  lang: 'de' | 'en' = 'en',
  timeoutMs: number = 8000
): Promise<GeneratedPrompt> {
  try {
    const prompt = await generatePromptForSubtask(subtask, service, style, lang, timeoutMs);
    if (prompt) {
      return prompt;
    }
  } catch (error) {
    console.warn('⚠️ [PromptGenerator] AI generation failed, using fallback:', error);
  }
  
  // Return fallback prompt
  return generateFallbackPrompt(subtask, service, style, lang);
}

/**
 * Batch generate prompts with fallback support
 */
export async function generatePromptsWithFallback(
  subtasks: DynamicSubtask[],
  service: 'ChatGPT' | 'Claude' | 'Gemini' | 'Custom' = 'ChatGPT',
  style: 'formal' | 'creative' | 'technical' = 'formal',
  lang: 'de' | 'en' = 'en'
): Promise<Map<string, GeneratedPrompt>> {
  const promptMap = new Map<string, GeneratedPrompt>();

  // Generate in parallel with fallback support
  const promises = subtasks.map(async (subtask) => {
    const prompt = await generatePromptWithFallback(subtask, service, style, lang);
    return { subtaskId: subtask.id, prompt };
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      promptMap.set(result.value.subtaskId, result.value.prompt);
    }
  });

  console.log(`✨ [PromptGenerator] Generated ${promptMap.size}/${subtasks.length} prompts (with fallbacks)`);
  return promptMap;
}

/**
 * Generate multiple prompt variations for a single subtask
 */
export async function generatePromptVariations(
  subtask: DynamicSubtask,
  services: ('ChatGPT' | 'Claude' | 'Gemini' | 'Custom')[] = ['ChatGPT', 'Claude'],
  styles: ('formal' | 'creative' | 'technical')[] = ['formal', 'technical'],
  lang: 'de' | 'en' = 'en'
): Promise<Map<string, GeneratedPrompt>> {
  const promptMap = new Map<string, GeneratedPrompt>();

  // Generate all combinations
  const combinations = services.flatMap(service => 
    styles.map(style => ({ service, style }))
  );

  const promises = combinations.map(async ({ service, style }) => {
    const prompt = await generatePromptWithFallback(subtask, service, style, lang);
    const key = `${service}-${style}`;
    return { key, prompt };
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      promptMap.set(result.value.key, result.value.prompt);
    }
  });

  console.log(`✨ [PromptGenerator] Generated ${promptMap.size} prompt variations for: ${subtask.title}`);
  return promptMap;
}

export default {
  generatePromptForSubtask,
  generatePromptsForSubtasks,
  generateFallbackPrompt,
  generatePromptWithFallback,
  generatePromptsWithFallback,
  generatePromptVariations
};
