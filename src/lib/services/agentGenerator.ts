/**
 * AI Agent Generator Service
 * Generates AI agent configurations for subtasks when no matches are found
 */

import { DynamicSubtask, SolutionStatus, GenerationMetadata } from '../types';
import { openaiClient } from '../openai';
import { AgentSolutionInterface } from '../interfaces';

export interface GeneratedAgent extends AgentSolutionInterface {
  isAIGenerated: true;
  generatedAt: string;
  config: {
    name: string;
    description: string;
    functions: string[];
    tools: string[];
    technology: string;
    parameters: Record<string, any>;
    environment: Record<string, string>;
  };
}

/**
 * Generate an AI agent configuration for a subtask
 */
export async function generateAgentForSubtask(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'en',
  timeoutMs: number = 5000
): Promise<GeneratedAgent | null> {
  console.log(`🤖 [AgentGenerator] Generating AI agent for: "${subtask.title}" (timeout: ${timeoutMs}ms)`);
  
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout')), timeoutMs);
    });
    
    // Race between API call and timeout
    const prompt = lang === 'de' ? `
Erstelle eine AI-Agent Konfiguration für diese Teilaufgabe:

Titel: ${subtask.title}
Beschreibung: ${subtask.description || 'Keine Beschreibung'}
Automatisierungspotenzial: ${Math.round(subtask.automationPotential * 100)}%
Komplexität: ${subtask.complexity}
Systeme: ${subtask.systems.join(', ') || 'Keine angegeben'}

Erstelle eine detaillierte Agent-Konfiguration mit:
1. Name des Agents (präzise und beschreibend)
2. 3-5 konkrete Funktionen die der Agent ausführen kann
3. Die wichtigsten Tools/APIs (max 3)
4. Technologie-Stack (z.B. Python, Node.js, etc.)
5. Geschätzte Zeitersparnis pro Monat in Stunden
6. Komplexität (Low/Medium/High)

Antworte nur mit einem JSON-Objekt im folgenden Format:
{
  "name": "Agent Name",
  "description": "Kurze Beschreibung",
  "functions": [
    "Funktion 1: Was der Agent macht",
    "Funktion 2: Weitere Fähigkeit"
  ],
  "tools": ["Tool1", "Tool2"],
  "technology": "Python",
  "timeSavings": 5.0,
  "complexity": "Medium"
}
` : `
Create an AI agent configuration for this subtask:

Title: ${subtask.title}
Description: ${subtask.description || 'No description'}
Automation Potential: ${Math.round(subtask.automationPotential * 100)}%
Complexity: ${subtask.complexity}
Systems: ${subtask.systems.join(', ') || 'None specified'}

Create a detailed agent configuration with:
1. Agent name (precise and descriptive)
2. 3-5 concrete functions the agent can perform
3. The main tools/APIs (max 3)
4. Technology stack (e.g., Python, Node.js, etc.)
5. Estimated time savings per month in hours
6. Complexity (Low/Medium/High)

Respond only with a JSON object in this format:
{
  "name": "Agent Name",
  "description": "Short description",
  "functions": [
    "Function 1: What the agent does",
    "Function 2: Another capability"
  ],
  "tools": ["Tool1", "Tool2"],
  "technology": "Python",
  "timeSavings": 5.0,
  "complexity": "Medium"
}
`;

    console.log('📡 [AgentGenerator] Calling OpenAI API with timeout...');
    
    const apiCallPromise = openaiClient.chatCompletion([
      {
        role: 'system',
        content: lang === 'de' 
          ? 'Du bist ein Experte für AI-Agent Entwicklung und Automatisierung. Erstelle präzise, umsetzbare Agent-Konfigurationen. Antworte NUR mit gültigem JSON.'
          : 'You are an expert in AI agent development and automation. Create precise, actionable agent configurations. Respond ONLY with valid JSON.'
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
    
    console.log('✅ [AgentGenerator] OpenAI API responded successfully');

    const content = response.content;
    if (!content) {
      console.warn('⚠️ [AgentGenerator] No content in AI response');
      return null;
    }

    console.log('📝 [AgentGenerator] Parsing AI response...');
    const aiAgent = JSON.parse(content);
    console.log('✨ [AgentGenerator] Parsed agent:', aiAgent.name);
    
    // Create generation metadata
    const generationMetadata: GenerationMetadata = {
      timestamp: Date.now(),
      model: 'gpt-4o-mini',
      language: lang,
      cacheKey: `agent_${subtask.id}_${Date.now()}`
    };

    // Calculate setup cost based on complexity
    const complexity = aiAgent.complexity || 'Medium';
    const setupCost = calculateSetupCost(complexity);

    // Create agent configuration
    const config = {
      name: aiAgent.name,
      description: aiAgent.description,
      functions: aiAgent.functions || [],
      tools: aiAgent.tools || [],
      technology: aiAgent.technology || 'Python',
      parameters: {
        timeout: 30000,
        retries: 3,
        concurrency: 1
      },
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      }
    };

    const agent: GeneratedAgent = {
      id: `ai-generated-agent-${subtask.id}-${Date.now()}`,
      name: aiAgent.name,
      description: aiAgent.description,
      functions: aiAgent.functions || [],
      tools: aiAgent.tools || [],
      technology: aiAgent.technology || 'Python',
      status: 'generated',
      complexity: aiAgent.complexity || 'Medium',
      setupCost,
      isAIGenerated: true,
      generationMetadata,
      generatedAt: new Date().toISOString(),
      config
    };

    console.log('✨ [AgentGenerator] Generated AI agent:', agent.name);
    return agent;

  } catch (error) {
    console.error('❌ [AgentGenerator] Error generating agent:', error);
    return null;
  }
}

/**
 * Generate agents for all subtasks in parallel
 */
export async function generateAgentsForSubtasks(
  subtasks: DynamicSubtask[],
  lang: 'de' | 'en' = 'en'
): Promise<Map<string, GeneratedAgent>> {
  const agentMap = new Map<string, GeneratedAgent>();

  // Generate in parallel with Promise.allSettled to avoid one failure blocking others
  const promises = subtasks.map(async (subtask) => {
    const agent = await generateAgentForSubtask(subtask, lang);
    return { subtaskId: subtask.id, agent };
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.agent) {
      agentMap.set(result.value.subtaskId, result.value.agent);
    }
  });

  console.log(`✨ [AgentGenerator] Generated ${agentMap.size}/${subtasks.length} agents`);
  return agentMap;
}

/**
 * Calculate setup cost based on complexity
 */
function calculateSetupCost(complexity: string): number {
  const normalizedComplexity = complexity.toLowerCase();
  
  switch (normalizedComplexity) {
    case 'low': return 300;
    case 'medium': return 750;
    case 'high': return 1500;
    default: return 750;
  }
}

/**
 * Generate fallback agent when AI generation fails
 */
export function generateFallbackAgent(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'en'
): GeneratedAgent {
  const fallbackName = lang === 'de' 
    ? `Fallback Agent für: ${subtask.title}`
    : `Fallback Agent for: ${subtask.title}`;
    
  const fallbackDescription = lang === 'de'
    ? `Basis-Agent für die Automatisierung von: ${subtask.description || subtask.title}`
    : `Basic agent for automating: ${subtask.description || subtask.title}`;

  const fallbackFunctions = [
    lang === 'de' ? 'Datenverarbeitung und -analyse' : 'Data processing and analysis',
    lang === 'de' ? 'Automatisierte Berichterstellung' : 'Automated reporting',
    lang === 'de' ? 'E-Mail Benachrichtigungen' : 'Email notifications'
  ];

  const fallbackTools = [
    'Python',
    'REST API',
    'Database'
  ];

  const generationMetadata: GenerationMetadata = {
    timestamp: Date.now(),
    model: 'fallback',
    language: lang,
    cacheKey: `fallback_agent_${subtask.id}_${Date.now()}`
  };

  const config = {
    name: fallbackName,
    description: fallbackDescription,
    functions: fallbackFunctions,
    tools: fallbackTools,
    technology: 'Python',
    parameters: {
      timeout: 30000,
      retries: 3,
      concurrency: 1
    },
    environment: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    }
  };

  return {
    id: `fallback-agent-${subtask.id}-${Date.now()}`,
    name: fallbackName,
    description: fallbackDescription,
    functions: fallbackFunctions,
    tools: fallbackTools,
    technology: 'Python',
    status: 'fallback',
    complexity: 'Medium',
    setupCost: 750, // Medium complexity
    isAIGenerated: true,
    generationMetadata,
    generatedAt: new Date().toISOString(),
    config
  };
}

/**
 * Enhanced agent generation with fallback support
 */
export async function generateAgentWithFallback(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'en',
  timeoutMs: number = 3000
): Promise<GeneratedAgent> {
  try {
    const agent = await generateAgentForSubtask(subtask, lang, timeoutMs);
    if (agent) {
      return agent;
    }
  } catch (error) {
    console.warn('⚠️ [AgentGenerator] AI generation failed, using fallback:', error);
  }
  
  // Return fallback agent
  return generateFallbackAgent(subtask, lang);
}

/**
 * Batch generate agents with fallback support
 */
export async function generateAgentsWithFallback(
  subtasks: DynamicSubtask[],
  lang: 'de' | 'en' = 'en'
): Promise<Map<string, GeneratedAgent>> {
  const agentMap = new Map<string, GeneratedAgent>();

  // Generate in parallel with fallback support
  const promises = subtasks.map(async (subtask) => {
    const agent = await generateAgentWithFallback(subtask, lang);
    return { subtaskId: subtask.id, agent };
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      agentMap.set(result.value.subtaskId, result.value.agent);
    }
  });

  console.log(`✨ [AgentGenerator] Generated ${agentMap.size}/${subtasks.length} agents (with fallbacks)`);
  return agentMap;
}

export default {
  generateAgentForSubtask,
  generateAgentsForSubtasks,
  generateFallbackAgent,
  generateAgentWithFallback,
  generateAgentsWithFallback
};
