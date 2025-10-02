/**
 * AI-Powered Blueprint Generator
 * Generates n8n workflow blueprints for subtasks when no matches are found
 */

import { DynamicSubtask, SolutionStatus, GenerationMetadata } from './types';
import { openaiClient } from './openai';
import { BlueprintData } from '@/components/BlueprintCard';
import { WorkflowSolutionInterface } from './interfaces';

export interface GeneratedBlueprint extends BlueprintData {
  isAIGenerated: true;
  generatedAt: string;
  // Enhanced properties for expanded task detail view
  status: SolutionStatus;
  generationMetadata: GenerationMetadata;
  setupCost: number;
  downloadUrl?: string;
  validationStatus: 'valid' | 'invalid';
  n8nWorkflow: {
    name: string;
    nodes: any[];
    connections: any;
    active: boolean;
    settings: any;
    versionId: string;
  };
}

/**
 * Generate a workflow blueprint for a subtask using AI
 */
export async function generateBlueprintForSubtask(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'de',
  timeoutMs: number = 5000 // 5 second timeout
): Promise<GeneratedBlueprint | null> {
  console.log(`🎨 [BlueprintGenerator] Generating AI blueprint for: "${subtask.title}" (timeout: ${timeoutMs}ms)`);
  
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout')), timeoutMs);
    });
    
    // Race between API call and timeout
    const prompt = lang === 'de' ? `
Erstelle einen n8n Workflow-Blueprint für diese Teilaufgabe:

Titel: ${subtask.title}
Beschreibung: ${subtask.description || 'Keine Beschreibung'}
Automatisierungspotenzial: ${Math.round(subtask.automationPotential * 100)}%
Komplexität: ${subtask.complexity}
Systeme: ${subtask.systems.join(', ') || 'Keine angegeben'}

Erstelle einen detaillierten Workflow mit:
1. Name des Workflows (präzise und beschreibend)
2. 3-5 konkrete n8n Nodes mit Namen und Typ
3. Die wichtigsten Integrationen (max 3)
4. Geschätzte Zeitersparnis pro Monat in Stunden
5. Komplexität (Low/Medium/High)

Antworte nur mit einem JSON-Objekt im folgenden Format:
{
  "name": "Workflow Name",
  "description": "Kurze Beschreibung",
  "nodes": [
    {"name": "Node Name", "type": "n8n-nodes-base.nodeType", "description": "Was dieser Node macht"}
  ],
  "integrations": ["Integration1", "Integration2"],
  "timeSavings": 5.0,
  "complexity": "Medium"
}
` : `
Create an n8n workflow blueprint for this subtask:

Title: ${subtask.title}
Description: ${subtask.description || 'No description'}
Automation Potential: ${Math.round(subtask.automationPotential * 100)}%
Complexity: ${subtask.complexity}
Systems: ${subtask.systems.join(', ') || 'None specified'}

Create a detailed workflow with:
1. Workflow name (precise and descriptive)
2. 3-5 concrete n8n nodes with names and types
3. The main integrations (max 3)
4. Estimated time savings per month in hours
5. Complexity (Low/Medium/High)

Respond only with a JSON object in this format:
{
  "name": "Workflow Name",
  "description": "Short description",
  "nodes": [
    {"name": "Node Name", "type": "n8n-nodes-base.nodeType", "description": "What this node does"}
  ],
  "integrations": ["Integration1", "Integration2"],
  "timeSavings": 5.0,
  "complexity": "Medium"
}
`;

    console.log('📡 [BlueprintGenerator] Calling OpenAI API with timeout...');
    
    const apiCallPromise = openaiClient.chatCompletion([
      {
        role: 'system',
        content: lang === 'de' 
          ? 'Du bist ein Experte für Workflow-Automatisierung und n8n. Erstelle präzise, umsetzbare Workflow-Blueprints. Antworte NUR mit gültigem JSON.'
          : 'You are an expert in workflow automation and n8n. Create precise, actionable workflow blueprints. Respond ONLY with valid JSON.'
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
    
    console.log('✅ [BlueprintGenerator] OpenAI API responded successfully');

    const content = response.content;
    if (!content) {
      console.warn('⚠️ [BlueprintGenerator] No content in AI response');
      return null;
    }

    console.log('📝 [BlueprintGenerator] Parsing AI response...');
    const aiBlueprint = JSON.parse(content);
    console.log('✨ [BlueprintGenerator] Parsed blueprint:', aiBlueprint.name);
    
    // Convert to n8n workflow format
    const n8nWorkflow = {
      name: aiBlueprint.name,
      nodes: (aiBlueprint.nodes || []).map((node: any, idx: number) => ({
        id: `node_${idx}`,
        name: node.name,
        type: node.type || 'n8n-nodes-base.function',
        typeVersion: 1,
        position: [250 + (idx * 200), 300],
        parameters: {},
        description: node.description
      })),
      connections: {}, // AI could generate connections in future
      active: false,
      settings: {
        executionOrder: 'v1'
      },
      versionId: '1'
    };

    // Create generation metadata
    const generationMetadata: GenerationMetadata = {
      timestamp: Date.now(),
      model: 'gpt-4o-mini',
      language: lang,
      cacheKey: `blueprint_${subtask.id}_${Date.now()}`
    };

    // Calculate setup cost based on complexity
    const complexity = aiBlueprint.complexity || 'Medium';
    const setupCost = calculateSetupCost(complexity);

    // Generate download URL
    const downloadUrl = generateDownloadUrl(`ai-generated-${subtask.id}-${Date.now()}`);

    // Validate the generated blueprint
    const validationStatus = validateBlueprint(aiBlueprint);

    const blueprint: GeneratedBlueprint = {
      id: `ai-generated-${subtask.id}-${Date.now()}`,
      name: aiBlueprint.name,
      description: aiBlueprint.description,
      timeSavings: aiBlueprint.timeSavings || subtask.estimatedTime * subtask.automationPotential,
      complexity: aiBlueprint.complexity || 'Medium',
      integrations: aiBlueprint.integrations || subtask.systems.slice(0, 3),
      category: 'AI Generated',
      isAIGenerated: true,
      generatedAt: new Date().toISOString(),
      status: 'generated',
      generationMetadata,
      setupCost,
      downloadUrl,
      validationStatus,
      n8nWorkflow,
      workflowData: n8nWorkflow
    };

    console.log('✨ [BlueprintGenerator] Generated AI blueprint:', blueprint.name);
    return blueprint;

  } catch (error) {
    console.error('❌ [BlueprintGenerator] Error generating blueprint:', error);
    return null;
  }
}

/**
 * Generate blueprints for all subtasks in parallel
 */
export async function generateBlueprintsForSubtasks(
  subtasks: DynamicSubtask[],
  lang: 'de' | 'en' = 'de'
): Promise<Map<string, GeneratedBlueprint>> {
  const blueprintMap = new Map<string, GeneratedBlueprint>();

  // Generate in parallel with Promise.allSettled to avoid one failure blocking others
  const promises = subtasks.map(async (subtask) => {
    const blueprint = await generateBlueprintForSubtask(subtask, lang);
    return { subtaskId: subtask.id, blueprint };
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.blueprint) {
      blueprintMap.set(result.value.subtaskId, result.value.blueprint);
    }
  });

  console.log(`✨ [BlueprintGenerator] Generated ${blueprintMap.size}/${subtasks.length} blueprints`);
  return blueprintMap;
}

/**
 * Calculate setup cost based on complexity
 */
function calculateSetupCost(complexity: string): number {
  const normalizedComplexity = complexity.toLowerCase();
  
  switch (normalizedComplexity) {
    case 'low': return 200;
    case 'medium': return 500;
    case 'high': return 1000;
    default: return 500;
  }
}

/**
 * Generate download URL for blueprint
 */
function generateDownloadUrl(blueprintId: string): string {
  return `/api/blueprints/${blueprintId}/download`;
}

/**
 * Validate generated blueprint structure
 */
function validateBlueprint(blueprint: any): 'valid' | 'invalid' {
  // Check for required properties
  if (!blueprint.name || !blueprint.description) {
    return 'invalid';
  }
  
  // Check for valid nodes array
  if (!Array.isArray(blueprint.nodes) || blueprint.nodes.length === 0) {
    return 'invalid';
  }
  
  // Check for valid integrations array
  if (!Array.isArray(blueprint.integrations)) {
    return 'invalid';
  }
  
  // Check for valid complexity
  const validComplexities = ['low', 'medium', 'high'];
  if (!validComplexities.includes(blueprint.complexity?.toLowerCase())) {
    return 'invalid';
  }
  
  // Check for valid time savings
  if (typeof blueprint.timeSavings !== 'number' || blueprint.timeSavings <= 0) {
    return 'invalid';
  }
  
  return 'valid';
}

/**
 * Generate fallback blueprint when AI generation fails
 */
export function generateFallbackBlueprint(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'en'
): GeneratedBlueprint {
  const fallbackName = lang === 'de' 
    ? `Fallback Workflow für: ${subtask.title}`
    : `Fallback Workflow for: ${subtask.title}`;
    
  const fallbackDescription = lang === 'de'
    ? `Basis-Workflow für die Automatisierung von: ${subtask.description || subtask.title}`
    : `Basic workflow for automating: ${subtask.description || subtask.title}`;

  const fallbackNodes = [
    {
      id: 'node_0',
      name: lang === 'de' ? 'Trigger' : 'Trigger',
      type: 'n8n-nodes-base.manualTrigger',
      typeVersion: 1,
      position: [250, 300],
      parameters: {},
      description: lang === 'de' ? 'Manueller Start des Workflows' : 'Manual workflow trigger'
    },
    {
      id: 'node_1',
      name: lang === 'de' ? 'Verarbeitung' : 'Processing',
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      position: [450, 300],
      parameters: {},
      description: lang === 'de' ? 'Hauptverarbeitungslogik' : 'Main processing logic'
    },
    {
      id: 'node_2',
      name: lang === 'de' ? 'Ausgabe' : 'Output',
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      position: [650, 300],
      parameters: {},
      description: lang === 'de' ? 'Ergebnisausgabe' : 'Result output'
    }
  ];

  const n8nWorkflow = {
    name: fallbackName,
    nodes: fallbackNodes,
    connections: {},
    active: false,
    settings: {
      executionOrder: 'v1'
    },
    versionId: '1'
  };

  const generationMetadata: GenerationMetadata = {
    timestamp: Date.now(),
    model: 'fallback',
    language: lang,
    cacheKey: `fallback_${subtask.id}_${Date.now()}`
  };

  return {
    id: `fallback-${subtask.id}-${Date.now()}`,
    name: fallbackName,
    description: fallbackDescription,
    timeSavings: subtask.estimatedTime * 0.3, // Conservative estimate
    complexity: 'Medium',
    integrations: subtask.systems.slice(0, 3),
    category: 'Fallback',
    isAIGenerated: true,
    generatedAt: new Date().toISOString(),
    status: 'fallback',
    generationMetadata,
    setupCost: 500, // Medium complexity
    downloadUrl: generateDownloadUrl(`fallback-${subtask.id}-${Date.now()}`),
    validationStatus: 'valid',
    n8nWorkflow,
    workflowData: n8nWorkflow
  };
}

/**
 * Enhanced blueprint generation with fallback support
 */
export async function generateBlueprintWithFallback(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'en',
  timeoutMs: number = 3000
): Promise<GeneratedBlueprint> {
  try {
    const blueprint = await generateBlueprintForSubtask(subtask, lang, timeoutMs);
    if (blueprint) {
      return blueprint;
    }
  } catch (error) {
    console.warn('⚠️ [BlueprintGenerator] AI generation failed, using fallback:', error);
  }
  
  // Return fallback blueprint
  return generateFallbackBlueprint(subtask, lang);
}

/**
 * Batch generate blueprints with fallback support
 */
export async function generateBlueprintsWithFallback(
  subtasks: DynamicSubtask[],
  lang: 'de' | 'en' = 'en'
): Promise<Map<string, GeneratedBlueprint>> {
  const blueprintMap = new Map<string, GeneratedBlueprint>();

  // Generate in parallel with fallback support
  const promises = subtasks.map(async (subtask) => {
    const blueprint = await generateBlueprintWithFallback(subtask, lang);
    return { subtaskId: subtask.id, blueprint };
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      blueprintMap.set(result.value.subtaskId, result.value.blueprint);
    }
  });

  console.log(`✨ [BlueprintGenerator] Generated ${blueprintMap.size}/${subtasks.length} blueprints (with fallbacks)`);
  return blueprintMap;
}

export default {
  generateBlueprintForSubtask,
  generateBlueprintsForSubtasks,
  generateFallbackBlueprint,
  generateBlueprintWithFallback,
  generateBlueprintsWithFallback
};

