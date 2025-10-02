/**
 * AI-Powered Blueprint Generator
 * Generates n8n workflow blueprints for subtasks when no matches are found
 */

import { DynamicSubtask } from './types';
import { openaiClient } from './openai';
import { BlueprintData } from '@/components/BlueprintCard';

export interface GeneratedBlueprint extends BlueprintData {
  isAIGenerated: true;
  generatedAt: string;
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

export default {
  generateBlueprintForSubtask,
  generateBlueprintsForSubtasks
};

