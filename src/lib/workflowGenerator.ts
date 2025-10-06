/**
 * Enhanced AI-Powered Blueprint Generator
 * Generates high-quality n8n workflow blueprints with intelligent caching and fallback
 */

import { DynamicSubtask, SolutionStatus, GenerationMetadata, UnifiedWorkflow, WorkflowCreationContext } from './types';
import { openaiClient } from './openai';
import { BlueprintData } from '@/components/BlueprintCard';
import { WorkflowSolutionInterface } from './interfaces';
import { cacheManager } from './services/cacheManager';
import { WorkflowSchemaMapper } from './schemas/unifiedWorkflow';
import { getFeatureFlagManager } from './featureFlags';

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
 * Convert UnifiedWorkflow to GeneratedBlueprint for backward compatibility
 */
function convertUnifiedToGeneratedBlueprint(workflow: UnifiedWorkflow): GeneratedBlueprint {
  return {
    id: workflow.id,
    name: workflow.title,
    description: workflow.description,
    category: workflow.category,
    complexity: workflow.complexity,
    integrations: workflow.integrations,
    estimatedTime: workflow.estimatedTime || '2 hours',
    estimatedCost: workflow.estimatedCost || '$100',
    automationPotential: workflow.timeSavings || 50,
    isAIGenerated: true,
    generatedAt: workflow.createdAt,
    status: workflow.status,
    generationMetadata: workflow.generationMetadata || {
      timestamp: Date.now(),
      model: 'gpt-4o-mini',
      language: 'de',
      cacheKey: workflow.cacheKey || ''
    },
    setupCost: workflow.setupCost || 100,
    downloadUrl: workflow.downloadUrl,
    validationStatus: workflow.validationStatus || 'valid',
    n8nWorkflow: workflow.n8nWorkflow || {
      name: workflow.title,
      nodes: [],
      connections: {},
      active: true,
      settings: {},
      versionId: '1.0.0'
    }
  };
}

/**
 * Generate a workflow for a subtask using AI with intelligent caching
 */
export async function generateWorkflowForSubtask(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'de',
  timeoutMs: number = 15000 // Increased to 15 seconds
): Promise<GeneratedBlueprint | null> {
  console.log(`🎨 [WorkflowGenerator] Generating AI workflow for: "${subtask.title}" (timeout: ${timeoutMs}ms)`);
  
  // Check if unified workflow schema is enabled
  const featureFlagManager = getFeatureFlagManager();
  const useUnified = await featureFlagManager.isEnabled('unified_workflow_read');
  const useAIGeneration = await featureFlagManager.isEnabled('unified_workflow_ai_generation');
  
  if (useUnified && useAIGeneration) {
    // Use unified workflow generator
    const { unifiedWorkflowGenerator } = await import('./workflowGeneratorUnified');
    const result = await unifiedWorkflowGenerator.generateWorkflowForSubtask({
      subtask,
      lang,
      timeoutMs
    });
    
    if (result.workflow) {
      // Convert UnifiedWorkflow to GeneratedBlueprint for backward compatibility
      return convertUnifiedToGeneratedBlueprint(result.workflow);
    }
    
    return null;
  }

  // Legacy implementation
  // Create generation metadata for caching
  const generationMetadata: GenerationMetadata = {
    timestamp: Date.now(),
    model: 'gpt-4o-mini',
    language: lang,
    cacheKey: `workflow_${subtask.id}_${lang}_${Math.floor(Date.now() / (60 * 1000))}`
  };

  // Check cache first
  const cachedWorkflow = cacheManager.getCachedWorkflow(subtask.id, generationMetadata);
  if (cachedWorkflow) {
    console.log('💾 [WorkflowGenerator] Using cached workflow:', cachedWorkflow.name);
    return cachedWorkflow;
  }
  
  try {
    // Use direct OpenAI API call instead of Supabase Edge Function
    const blueprint = await generateWorkflowDirect(subtask, lang, timeoutMs);
    if (blueprint) {
      // Cache the successful AI-generated workflow
      cacheManager.cacheWorkflow(subtask.id, generationMetadata, blueprint, 24 * 60 * 60 * 1000);
      console.log(`✅ [WorkflowGenerator] AI workflow generated and cached: "${blueprint.name}"`);
      return blueprint;
    }
  } catch (error) {
    console.error(`❌ [WorkflowGenerator] Error generating workflow:`, error);
    throw error;
  }
  
  return null;
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
    const blueprint = await generateWorkflowForSubtask(subtask, lang);
    return { subtaskId: subtask.id, blueprint };
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.blueprint) {
      blueprintMap.set(result.value.subtaskId, result.value.blueprint);
    }
  });

  console.log(`✨ [WorkflowGenerator] Generated ${blueprintMap.size}/${subtasks.length} workflows`);
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
 * Generate node connections for n8n workflow
 */
function generateNodeConnections(nodes: any[]): any {
  const connections: any = {};
  
  // Create linear connections between nodes
  for (let i = 0; i < nodes.length - 1; i++) {
    const currentNode = `node_${i}`;
    const nextNode = `node_${i + 1}`;
    
    if (!connections[currentNode]) {
      connections[currentNode] = {};
    }
    
    connections[currentNode].main = [[{
      node: nextNode,
      type: 'main',
      index: 0
    }]];
  }
  
  return connections;
}

/**
 * Enhanced validation for generated blueprint structure
 */
function validateBlueprint(blueprint: any): 'valid' | 'invalid' {
  // Check for required properties
  if (!blueprint.name || !blueprint.description) {
    console.warn('❌ [WorkflowGenerator] Missing name or description');
    return 'invalid';
  }
  
  // Check for valid nodes array
  if (!Array.isArray(blueprint.nodes) || blueprint.nodes.length === 0) {
    console.warn('❌ [WorkflowGenerator] Invalid or empty nodes array');
    return 'invalid';
  }
  
  // Validate each node
  for (const node of blueprint.nodes) {
    if (!node.name || !node.type) {
      console.warn('❌ [WorkflowGenerator] Node missing name or type:', node);
      return 'invalid';
    }
    
    // Check if node type is valid n8n node
    if (!node.type.startsWith('n8n-nodes-base.')) {
      console.warn('❌ [WorkflowGenerator] Invalid node type:', node.type);
      return 'invalid';
    }
  }
  
  // Check for valid integrations array
  if (!Array.isArray(blueprint.integrations)) {
    console.warn('❌ [WorkflowGenerator] Invalid integrations array');
    return 'invalid';
  }
  
  // Check for valid complexity
  const validComplexities = ['low', 'medium', 'high'];
  if (!validComplexities.includes(blueprint.complexity?.toLowerCase())) {
    console.warn('❌ [WorkflowGenerator] Invalid complexity:', blueprint.complexity);
    return 'invalid';
  }
  
  // Check for valid time savings
  if (typeof blueprint.timeSavings !== 'number' || blueprint.timeSavings <= 0) {
    console.warn('❌ [WorkflowGenerator] Invalid time savings:', blueprint.timeSavings);
    return 'invalid';
  }
  
  console.log('✅ [WorkflowGenerator] Blueprint validation passed');
  return 'valid';
}

/**
 * Get appropriate integrations for fallback workflows
 */
function getFallbackIntegrations(taskTitle: string, systems: string[]): string[] {
  const taskTitleLower = taskTitle.toLowerCase();
  
  if (taskTitleLower.includes('onboarding') || taskTitleLower.includes('einarbeitung')) {
    return ['Google Docs', 'Gmail', 'Slack', 'Airtable'];
  } else if (taskTitleLower.includes('bewerbung') || taskTitleLower.includes('recruiting')) {
    return ['Airtable', 'OpenAI', 'Gmail', 'LinkedIn'];
  } else if (taskTitleLower.includes('konflikt') || taskTitleLower.includes('mediation') || taskTitleLower.includes('gespräch')) {
    return ['Google Docs', 'Google Calendar', 'Gmail', 'Slack'];
  } else if (taskTitleLower.includes('gehalt') || taskTitleLower.includes('lohn')) {
    return ['MySQL', 'Google Sheets', 'Gmail', 'Excel'];
  } else {
    // Use systems from subtask or default integrations
    return systems.length > 0 ? systems.slice(0, 4) : ['Google Sheets', 'Gmail', 'Slack', 'Airtable'];
  }
}

/**
 * Generate fallback blueprint when AI generation fails
 */
export function generateFallbackBlueprint(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'en',
  variation: number = 0
): GeneratedBlueprint {
  // Generate specific names based on task type with variation
  const taskTitle = subtask.title.toLowerCase();
  let fallbackName, fallbackDescription;
  
  // Create unique variations based on subtask ID and variation number
  const uniqueId = subtask.id.split('-').pop() || '1';
  const variationSuffix = variation > 0 ? ` (Variante ${variation + 1})` : '';
  
  if (taskTitle.includes('konflikt') || taskTitle.includes('mediation')) {
    const variations = [
      `Mediations-Assistent: ${subtask.title}`,
      `Konfliktlöser: ${subtask.title}`,
      `Streitschlichter: ${subtask.title}`,
      `Mediations-Workflow: ${subtask.title}`
    ];
    fallbackName = (variations[variation % variations.length] || variations[0]) + variationSuffix;
    fallbackDescription = lang === 'de'
      ? `Intelligenter Workflow für strukturierte Konfliktlösung: ${subtask.description || subtask.title}`
      : `Intelligent workflow for structured conflict resolution: ${subtask.description || subtask.title}`;
  } else if (taskTitle.includes('gespräch')) {
    const variations = [
      `Gesprächs-Coach: ${subtask.title}`,
      `Kommunikations-Assistent: ${subtask.title}`,
      `Dialog-Workflow: ${subtask.title}`,
      `Gesprächs-Manager: ${subtask.title}`
    ];
    fallbackName = (variations[variation % variations.length] || variations[0]) + variationSuffix;
    fallbackDescription = lang === 'de'
      ? `KI-gestützter Workflow für effektive Gesprächsführung: ${subtask.description || subtask.title}`
      : `AI-powered workflow for effective conversation management: ${subtask.description || subtask.title}`;
  } else if (taskTitle.includes('mitarbeiterentwicklung') || taskTitle.includes('personalplanung')) {
    const variations = [
      `Talent-Entwickler: ${subtask.title}`,
      `Personal-Coach: ${subtask.title}`,
      `Mitarbeiter-Mentor: ${subtask.title}`,
      `Entwicklungs-Assistent: ${subtask.title}`,
      `HR-Workflow: ${subtask.title}`,
      `Personalplanung: ${subtask.title}`
    ];
    fallbackName = (variations[variation % variations.length] || variations[0]) + variationSuffix;
    fallbackDescription = lang === 'de'
      ? `Strategischer Workflow für Mitarbeiterentwicklung: ${subtask.description || subtask.title}`
      : `Strategic workflow for employee development: ${subtask.description || subtask.title}`;
  } else if (taskTitle.includes('onboarding') || taskTitle.includes('einarbeitung')) {
    const variations = [
      `Onboarding-Guide: ${subtask.title}`,
      `Einarbeitungs-Assistent: ${subtask.title}`,
      `Neulings-Workflow: ${subtask.title}`,
      `Start-Helfer: ${subtask.title}`
    ];
    fallbackName = (variations[variation % variations.length] || variations[0]) + variationSuffix;
    fallbackDescription = lang === 'de'
      ? `Strukturierter Workflow für nahtlose Einarbeitung: ${subtask.description || subtask.title}`
      : `Structured workflow for seamless onboarding: ${subtask.description || subtask.title}`;
  } else if (taskTitle.includes('bewerbung') || taskTitle.includes('recruiting')) {
    const variations = [
      `Recruiting-Expert: ${subtask.title}`,
      `Talent-Scout: ${subtask.title}`,
      `Bewerber-Manager: ${subtask.title}`,
      `HR-Recruiter: ${subtask.title}`
    ];
    fallbackName = (variations[variation % variations.length] || variations[0]) + variationSuffix;
    fallbackDescription = lang === 'de'
      ? `Intelligenter Workflow für effizientes Recruiting: ${subtask.description || subtask.title}`
      : `Intelligent workflow for efficient recruiting: ${subtask.description || subtask.title}`;
  } else {
    const variations = [
      `Smart-Workflow: ${subtask.title}`,
      `Automatisierungs-Assistent: ${subtask.title}`,
      `Prozess-Optimierer: ${subtask.title}`,
      `Workflow-Manager: ${subtask.title}`,
      `Task-Automator: ${subtask.title}`
    ];
    fallbackName = (variations[variation % variations.length] || variations[0]) + variationSuffix;
    fallbackDescription = lang === 'de'
      ? `Intelligenter Workflow für optimierte Prozesse: ${subtask.description || subtask.title}`
      : `Intelligent workflow for optimized processes: ${subtask.description || subtask.title}`;
  }

  // Generate specific nodes based on subtask title
  let fallbackNodes = [];
  
  if (taskTitle.includes('onboarding') || taskTitle.includes('einarbeitung')) {
    fallbackNodes = [
      {
        id: 'node_0',
        name: lang === 'de' ? 'Neuer Mitarbeiter' : 'New Employee',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
        parameters: {},
        description: lang === 'de' ? 'Webhook für neue Mitarbeiter' : 'Webhook for new employees'
      },
      {
        id: 'node_1',
        name: lang === 'de' ? 'Dokumente erstellen' : 'Create Documents',
        type: 'n8n-nodes-base.googleDocs',
        typeVersion: 1,
        position: [450, 300],
        parameters: {},
        description: lang === 'de' ? 'Automatische Dokumentenerstellung' : 'Automatic document creation'
      },
      {
        id: 'node_2',
        name: lang === 'de' ? 'E-Mail senden' : 'Send Email',
        type: 'n8n-nodes-base.emailSend',
        typeVersion: 1,
        position: [650, 300],
        parameters: {},
        description: lang === 'de' ? 'Willkommens-E-Mail' : 'Welcome email'
      }
    ];
  } else if (taskTitle.includes('bewerbung') || taskTitle.includes('recruiting')) {
    fallbackNodes = [
      {
        id: 'node_0',
        name: lang === 'de' ? 'Bewerbung erhalten' : 'Application Received',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
        parameters: {},
        description: lang === 'de' ? 'Webhook für neue Bewerbungen' : 'Webhook for new applications'
      },
      {
        id: 'node_1',
        name: lang === 'de' ? 'Bewerbung analysieren' : 'Analyze Application',
        type: 'n8n-nodes-base.openAi',
        typeVersion: 1,
        position: [450, 300],
        parameters: {},
        description: lang === 'de' ? 'AI-basierte Bewerbungsanalyse' : 'AI-based application analysis'
      },
      {
        id: 'node_2',
        name: lang === 'de' ? 'Status aktualisieren' : 'Update Status',
        type: 'n8n-nodes-base.airtable',
        typeVersion: 1,
        position: [650, 300],
        parameters: {},
        description: lang === 'de' ? 'Bewerberstatus in Airtable' : 'Update candidate status in Airtable'
      }
    ];
  } else if (taskTitle.includes('konflikt') || taskTitle.includes('mediation') || taskTitle.includes('gespräch')) {
    fallbackNodes = [
      {
        id: 'node_0',
        name: lang === 'de' ? 'Konflikt erkannt' : 'Conflict Detected',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
        parameters: {},
        description: lang === 'de' ? 'Webhook für Konflikterkennung' : 'Webhook for conflict detection'
      },
      {
        id: 'node_1',
        name: lang === 'de' ? 'Gesprächsleitfaden erstellen' : 'Create Conversation Guide',
        type: 'n8n-nodes-base.googleDocs',
        typeVersion: 1,
        position: [450, 300],
        parameters: {},
        description: lang === 'de' ? 'Automatische Leitfaden-Erstellung' : 'Automatic guide creation'
      },
      {
        id: 'node_2',
        name: lang === 'de' ? 'Termin planen' : 'Schedule Meeting',
        type: 'n8n-nodes-base.googleCalendar',
        typeVersion: 1,
        position: [650, 300],
        parameters: {},
        description: lang === 'de' ? 'Mediationstermin planen' : 'Schedule mediation meeting'
      }
    ];
  } else if (taskTitle.includes('gehalt') || taskTitle.includes('lohn')) {
    fallbackNodes = [
      {
        id: 'node_0',
        name: lang === 'de' ? 'Monatsende' : 'Month End',
        type: 'n8n-nodes-base.cron',
        typeVersion: 1,
        position: [250, 300],
        parameters: {},
        description: lang === 'de' ? 'Monatlicher Trigger' : 'Monthly trigger'
      },
      {
        id: 'node_1',
        name: lang === 'de' ? 'Gehaltsdaten laden' : 'Load Salary Data',
        type: 'n8n-nodes-base.mysql',
        typeVersion: 1,
        position: [450, 300],
        parameters: {},
        description: lang === 'de' ? 'Daten aus HR-System' : 'Data from HR system'
      },
      {
        id: 'node_2',
        name: lang === 'de' ? 'Abrechnung erstellen' : 'Create Payroll',
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        position: [650, 300],
        parameters: {},
        description: lang === 'de' ? 'Gehaltsabrechnung berechnen' : 'Calculate payroll'
      }
    ];
  } else {
    // Generic fallback
    fallbackNodes = [
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
        name: lang === 'de' ? 'Daten verarbeiten' : 'Process Data',
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        position: [450, 300],
        parameters: {},
        description: lang === 'de' ? 'Hauptverarbeitungslogik' : 'Main processing logic'
      },
      {
        id: 'node_2',
        name: lang === 'de' ? 'Ergebnis speichern' : 'Save Result',
        type: 'n8n-nodes-base.googleSheets',
        typeVersion: 1,
        position: [650, 300],
        parameters: {},
        description: lang === 'de' ? 'Ergebnis in Google Sheets' : 'Save result to Google Sheets'
      }
    ];
  }

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
    model: 'fallback-v2',
    language: lang,
    cacheKey: `fallback_${subtask.id}_${Date.now()}`
  };

  return {
      id: `fallback-v3-${subtask.id}-${variation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`,
    name: fallbackName,
    description: fallbackDescription,
    timeSavings: subtask.estimatedTime * 0.3, // Conservative estimate
    complexity: 'Medium',
    integrations: getFallbackIntegrations(taskTitle, subtask.systems),
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
 * Enhanced blueprint generation with fallback support and caching
 */
export async function generateBlueprintWithFallback(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'en',
  timeoutMs: number = 3000, // Reduced timeout for faster fallback
  variation: number = 0 // Add variation parameter
): Promise<GeneratedBlueprint> {
  console.log(`🎯 [WorkflowGenerator] Starting workflow generation with fallback for: "${subtask.title}" (variation: ${variation})`);
  
  // Create generation metadata for fallback caching with variation
  const fallbackMetadata: GenerationMetadata = {
    timestamp: Date.now(),
    model: 'fallback-v2',
    language: lang,
    cacheKey: `fallback_v2_${subtask.id}_${lang}_${variation}_${Math.floor(Date.now() / (60 * 1000))}`
  };

  // Check cache for fallback first
  const cachedFallback = cacheManager.getCachedWorkflow(subtask.id, fallbackMetadata);
  if (cachedFallback) {
    console.log('💾 [WorkflowGenerator] Using cached fallback workflow:', cachedFallback.name);
    return cachedFallback;
  }
  
  // Try AI generation with shorter timeout
  try {
    const blueprint = await generateWorkflowDirect(subtask, lang, timeoutMs);
    if (blueprint) {
      console.log(`✅ [WorkflowGenerator] AI workflow generated successfully: "${blueprint.name}"`);
      return blueprint;
    }
  } catch (error) {
    console.log(`🔄 [WorkflowGenerator] AI generation failed (${error.message}), using intelligent fallback`);
  }
  
  // Generate and cache fallback blueprint with variation
  const fallbackBlueprint = generateFallbackBlueprint(subtask, lang, variation);
  
  // Cache the fallback workflow
  cacheManager.cacheWorkflow(subtask.id, fallbackMetadata, fallbackBlueprint, 12 * 60 * 60 * 1000); // 12 hours
  
  console.log(`✅ [WorkflowGenerator] Generated and cached intelligent fallback workflow: "${fallbackBlueprint.name}"`);
  return fallbackBlueprint;
}

/**
 * Batch generate blueprints with fallback support and intelligent batching
 */
export async function generateBlueprintsWithFallback(
  subtasks: DynamicSubtask[],
  lang: 'de' | 'en' = 'en',
  batchSize: number = 5 // Process in smaller batches to avoid rate limits
): Promise<Map<string, GeneratedBlueprint>> {
  const blueprintMap = new Map<string, GeneratedBlueprint>();
  
  console.log(`🚀 [WorkflowGenerator] Starting batch generation for ${subtasks.length} subtasks (batch size: ${batchSize})`);

  // Process subtasks in batches to avoid overwhelming the API
  for (let i = 0; i < subtasks.length; i += batchSize) {
    const batch = subtasks.slice(i, i + batchSize);
    console.log(`📦 [WorkflowGenerator] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(subtasks.length / batchSize)}`);
    
    // Generate in parallel within each batch
    const promises = batch.map(async (subtask) => {
      try {
        const blueprint = await generateBlueprintWithFallback(subtask, lang);
        return { subtaskId: subtask.id, blueprint, success: true };
      } catch (error) {
        console.error(`❌ [WorkflowGenerator] Failed to generate workflow for ${subtask.title}:`, error);
        return { subtaskId: subtask.id, blueprint: null, success: false };
      }
    });

    const results = await Promise.allSettled(promises);

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success && result.value.blueprint) {
        blueprintMap.set(result.value.subtaskId, result.value.blueprint);
      }
    });

    // Small delay between batches to be respectful to the API
    if (i + batchSize < subtasks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const successRate = (blueprintMap.size / subtasks.length) * 100;
  console.log(`✨ [WorkflowGenerator] Batch generation completed: ${blueprintMap.size}/${subtasks.length} workflows (${successRate.toFixed(1)}% success rate)`);
  
  return blueprintMap;
}

/**
 * Get cache statistics for workflow generation
 */
export function getWorkflowCacheStats() {
  const stats = cacheManager.getStats();
  return {
    ...stats,
    cacheType: 'workflow_generation',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Clear all workflow generation cache
 */
export function clearWorkflowCache() {
  console.log('🗑️ [WorkflowGenerator] Clearing all workflow cache...');
  // Clear cache by removing all entries
  const keys = Array.from(cacheManager['cache'].keys());
  keys.forEach(key => cacheManager.delete(key));
  
  // Also clear localStorage cache
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('workflow') || key.includes('subtask') || key.includes('blueprint')) {
        localStorage.removeItem(key);
        console.log(`🗑️ [WorkflowGenerator] Removed cache key: ${key}`);
      }
    });
  }
  
  console.log('✅ [WorkflowGenerator] All caches cleared successfully');
}

/**
 * Clear workflow cache for specific subtask
 */
export function clearWorkflowCacheForSubtask(subtaskId: string) {
  const keys = Array.from(cacheManager['cache'].keys()).filter(key => 
    key.includes(subtaskId)
  );
  keys.forEach(key => cacheManager.delete(key));
  console.log(`🧹 [WorkflowGenerator] Cleared ${keys.length} cache entries for subtask: ${subtaskId}`);
}

/**
 * Generate only workflow metadata (name, description, complexity) for Solution Cards
 */
async function generateWorkflowMetadata(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'de',
  timeoutMs: number = 5000, // Longer timeout for better success rate
  variation: number = 0,
  context: 'overarching' | 'subtask-specific' = 'subtask-specific'
): Promise<GeneratedBlueprint | null> {
  console.log(`📋 [WorkflowGenerator] Generating metadata for: "${subtask.title}" (variation: ${variation}, timeout: ${timeoutMs}ms)`);
  
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`OpenAI API timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  // Create different prompts based on context (overarching vs subtask-specific)
  const variations = context === 'overarching' ? [
    // ÜBERGREIFENDE WORKFLOWS für Hauptaufgabe
    {
      system: lang === 'de' ? 'Generiere einen übergreifenden Workflow-Namen und Beschreibung für die Hauptaufgabe. Fokussiere auf GESAMTPROZESS und STRATEGIE. Nur JSON.' : 'Generate an overarching workflow name and description for the main task. Focus on OVERALL PROCESS and STRATEGY. JSON only.',
      user: lang === 'de' 
        ? `Hauptaufgabe: ${subtask.title}. Erstelle einen übergreifenden Workflow-Namen der den GESAMTPROZESS abdeckt. Verwende Begriffe wie "Master", "Complete", "Strategic". Generiere: {"name":"Master-[Spezifischer Name]","description":"Übergreifender Prozess für [was]","complexity":"medium"}`
        : `Main Task: ${subtask.title}. Create an overarching workflow name covering the ENTIRE PROCESS. Use terms like "Master", "Complete", "Strategic". Generate: {"name":"Master-[Specific Name]","description":"Overarching process for [what]","complexity":"medium"}`
    },
    {
      system: lang === 'de' ? 'Generiere einen strategischen Workflow-Namen und Beschreibung für die Hauptaufgabe. Fokussiere auf KOORDINATION und MANAGEMENT. Nur JSON.' : 'Generate a strategic workflow name and description for the main task. Focus on COORDINATION and MANAGEMENT. JSON only.',
      user: lang === 'de' 
        ? `Hauptaufgabe: ${subtask.title}. Erstelle einen strategischen Workflow-Namen der KOORDINATION betont. Verwende Begriffe wie "Coordinator", "Manager", "Hub". Generiere: {"name":"Coordinator-[Spezifischer Name]","description":"Koordiniert und verwaltet [was]","complexity":"medium"}`
        : `Main Task: ${subtask.title}. Create a strategic workflow name emphasizing COORDINATION. Use terms like "Coordinator", "Manager", "Hub". Generate: {"name":"Coordinator-[Specific Name]","description":"Coordinates and manages [what]","complexity":"medium"}`
    },
    {
      system: lang === 'de' ? 'Generiere einen integrierten Workflow-Namen und Beschreibung für die Hauptaufgabe. Fokussiere auf INTEGRATION und OPTIMIERUNG. Nur JSON.' : 'Generate an integrated workflow name and description for the main task. Focus on INTEGRATION and OPTIMIZATION. JSON only.',
      user: lang === 'de' 
        ? `Hauptaufgabe: ${subtask.title}. Erstelle einen integrierten Workflow-Namen der OPTIMIERUNG betont. Verwende Begriffe wie "Optimizer", "Integrator", "Pro". Generiere: {"name":"Optimizer-[Spezifischer Name]","description":"Integriert und optimiert [was]","complexity":"medium"}`
        : `Main Task: ${subtask.title}. Create an integrated workflow name emphasizing OPTIMIZATION. Use terms like "Optimizer", "Integrator", "Pro". Generate: {"name":"Optimizer-[Specific Name]","description":"Integrates and optimizes [what]","complexity":"medium"}`
    }
  ] : [
    // TEILAUFGABEN-SPEZIFISCHE WORKFLOWS - KONTEXT-SPEZIFISCH
    {
      system: lang === 'de' ? 'Generiere einen AUTOMATISIERUNGS-Workflow für die spezifische HR-Aufgabe. Fokussiere auf AUTOMATISIERUNG und EFFIZIENZ. Nur JSON.' : 'Generate an AUTOMATION workflow for the specific HR task. Focus on AUTOMATION and EFFICIENCY. JSON only.',
      user: lang === 'de' 
        ? `HR-Aufgabe: ${subtask.title}. Erstelle einen AUTOMATISIERUNGS-Workflow der spezifisch für diese HR-Aufgabe ist. Verwende Begriffe wie "Auto", "Smart", "Pro", "Bot", "Machine". Generiere: {"name":"Auto-[Spezifischer Name]","description":"Automatisiert ${subtask.title} durch [spezifische HR-Prozesse]","complexity":"medium"}`
        : `HR Task: ${subtask.title}. Create an AUTOMATION workflow specifically for this HR task. Use terms like "Auto", "Smart", "Pro", "Bot", "Machine". Generate: {"name":"Auto-[Specific Name]","description":"Automates ${subtask.title} through [specific HR processes]","complexity":"medium"}`
    },
    {
      system: lang === 'de' ? 'Generiere einen KOLLABORATIONS-Workflow für die spezifische HR-Aufgabe. Fokussiere auf TEAMWORK und ZUSAMMENARBEIT. Nur JSON.' : 'Generate a COLLABORATION workflow for the specific HR task. Focus on TEAMWORK and COLLABORATION. JSON only.',
      user: lang === 'de' 
        ? `HR-Aufgabe: ${subtask.title}. Erstelle einen KOLLABORATIONS-Workflow der spezifisch für diese HR-Aufgabe ist. Verwende Begriffe wie "Team", "Collaborative", "Hub", "Connect", "Social". Generiere: {"name":"Team-[Spezifischer Name]","description":"Fördert Zusammenarbeit bei ${subtask.title} durch [spezifische HR-Prozesse]","complexity":"medium"}`
        : `HR Task: ${subtask.title}. Create a COLLABORATION workflow specifically for this HR task. Use terms like "Team", "Collaborative", "Hub", "Connect", "Social". Generate: {"name":"Team-[Specific Name]","description":"Promotes collaboration in ${subtask.title} through [specific HR processes]","complexity":"medium"}`
    },
    {
      system: lang === 'de' ? 'Generiere einen ANALYSE-Workflow für die spezifische HR-Aufgabe. Fokussiere auf DATENANALYSE und INSIGHTS. Nur JSON.' : 'Generate an ANALYTICS workflow for the specific HR task. Focus on DATA ANALYSIS and INSIGHTS. JSON only.',
      user: lang === 'de' 
        ? `HR-Aufgabe: ${subtask.title}. Erstelle einen ANALYSE-Workflow der spezifisch für diese HR-Aufgabe ist. Verwende Begriffe wie "Analytics", "Insights", "Metrics", "Data", "Intelligence". Generiere: {"name":"Analytics-[Spezifischer Name]","description":"Analysiert und optimiert ${subtask.title} durch [spezifische HR-Datenanalyse]","complexity":"medium"}`
        : `HR Task: ${subtask.title}. Create an ANALYTICS workflow specifically for this HR task. Use terms like "Analytics", "Insights", "Metrics", "Data", "Intelligence". Generate: {"name":"Analytics-[Specific Name]","description":"Analyzes and optimizes ${subtask.title} through [specific HR data analysis]","complexity":"medium"}`
    }
  ];

  const selectedVariation = variations[variation % variations.length];

  const apiPromise = fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: selectedVariation.system },
        { role: 'user', content: selectedVariation.user }
      ],
      temperature: 1.0 + (variation * 0.3), // Maximum temperature for maximum variation
      max_tokens: 100,
      stream: false
    })
  });

  try {
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || '';
    
    console.log(`📝 [WorkflowGenerator] Raw metadata response: "${content}"`);
    
    // Try to extract JSON from response
    let jsonContent = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    // If no JSON found, create a specific one based on task type
    if (!jsonMatch) {
      const taskTitle = subtask.title.toLowerCase();
      if (taskTitle.includes('konflikt') || taskTitle.includes('mediation')) {
        jsonContent = `{"name":"Mediations-Assistent: ${subtask.title}","description":"Intelligenter Workflow für strukturierte Konfliktlösung","complexity":"medium"}`;
      } else if (taskTitle.includes('gespräch')) {
        jsonContent = `{"name":"Gesprächs-Coach: ${subtask.title}","description":"KI-gestützter Workflow für effektive Gesprächsführung","complexity":"medium"}`;
      } else if (taskTitle.includes('mitarbeiterentwicklung') || taskTitle.includes('personalplanung')) {
        jsonContent = `{"name":"Talent-Entwickler: ${subtask.title}","description":"Strategischer Workflow für Mitarbeiterentwicklung","complexity":"medium"}`;
      } else if (taskTitle.includes('onboarding') || taskTitle.includes('einarbeitung')) {
        jsonContent = `{"name":"Onboarding-Guide: ${subtask.title}","description":"Strukturierter Workflow für nahtlose Einarbeitung","complexity":"medium"}`;
      } else if (taskTitle.includes('bewerbung') || taskTitle.includes('recruiting')) {
        jsonContent = `{"name":"Recruiting-Expert: ${subtask.title}","description":"Intelligenter Workflow für effizientes Recruiting","complexity":"medium"}`;
      } else {
        jsonContent = `{"name":"Smart-Workflow: ${subtask.title}","description":"Intelligenter Workflow für optimierte Prozesse","complexity":"medium"}`;
      }
    }

    const metadata = JSON.parse(jsonContent);
    
    // Create a minimal valid blueprint with just metadata
    const validBlueprint: GeneratedBlueprint = {
      id: `metadata-v3-${subtask.id}-${variation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`,
      name: metadata.name || (subtask.title.toLowerCase().includes('konflikt') || subtask.title.toLowerCase().includes('mediation') 
        ? `Mediations-Assistent: ${subtask.title}`
        : subtask.title.toLowerCase().includes('gespräch')
        ? `Gesprächs-Coach: ${subtask.title}`
        : subtask.title.toLowerCase().includes('mitarbeiterentwicklung') || subtask.title.toLowerCase().includes('personalplanung')
        ? `Talent-Entwickler: ${subtask.title}`
        : subtask.title.toLowerCase().includes('onboarding') || subtask.title.toLowerCase().includes('einarbeitung')
        ? `Onboarding-Guide: ${subtask.title}`
        : subtask.title.toLowerCase().includes('bewerbung') || subtask.title.toLowerCase().includes('recruiting')
        ? `Recruiting-Expert: ${subtask.title}`
        : `Smart-Workflow: ${subtask.title}`),
      description: metadata.description || (subtask.title.toLowerCase().includes('konflikt') || subtask.title.toLowerCase().includes('mediation')
        ? `Intelligenter Workflow für strukturierte Konfliktlösung: ${subtask.title}`
        : subtask.title.toLowerCase().includes('gespräch')
        ? `KI-gestützter Workflow für effektive Gesprächsführung: ${subtask.title}`
        : subtask.title.toLowerCase().includes('mitarbeiterentwicklung') || subtask.title.toLowerCase().includes('personalplanung')
        ? `Strategischer Workflow für Mitarbeiterentwicklung: ${subtask.title}`
        : subtask.title.toLowerCase().includes('onboarding') || subtask.title.toLowerCase().includes('einarbeitung')
        ? `Strukturierter Workflow für nahtlose Einarbeitung: ${subtask.title}`
        : subtask.title.toLowerCase().includes('bewerbung') || subtask.title.toLowerCase().includes('recruiting')
        ? `Intelligenter Workflow für effizientes Recruiting: ${subtask.title}`
        : `Intelligenter Workflow für optimierte Prozesse: ${subtask.title}`),
      timeSavings: 4.0,
      complexity: metadata.complexity || 'medium',
      integrations: getFallbackIntegrations(subtask.title, ['API']),
      category: 'AI Generated',
      isAIGenerated: true,
      generatedAt: new Date().toISOString(),
      status: 'generated',
      generationMetadata: {
        timestamp: Date.now(),
        model: 'gpt-4o-mini-metadata',
        language: lang,
        cacheKey: `metadata_v2_${subtask.id}_${lang}`
      },
      setupCost: 500,
      downloadUrl: `/api/blueprints/metadata-${subtask.id}/download`,
      validationStatus: 'valid',
      n8nWorkflow: {
        name: metadata.name || (subtask.title.toLowerCase().includes('konflikt') || subtask.title.toLowerCase().includes('mediation')
          ? `Mediations-Assistent: ${subtask.title}`
          : subtask.title.toLowerCase().includes('gespräch')
          ? `Gesprächs-Coach: ${subtask.title}`
          : subtask.title.toLowerCase().includes('mitarbeiterentwicklung') || subtask.title.toLowerCase().includes('personalplanung')
          ? `Talent-Entwickler: ${subtask.title}`
          : subtask.title.toLowerCase().includes('onboarding') || subtask.title.toLowerCase().includes('einarbeitung')
          ? `Onboarding-Guide: ${subtask.title}`
          : subtask.title.toLowerCase().includes('bewerbung') || subtask.title.toLowerCase().includes('recruiting')
          ? `Recruiting-Expert: ${subtask.title}`
          : `Smart-Workflow: ${subtask.title}`),
        nodes: [
          {
            id: 'node_0',
            name: 'Start',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: {},
        active: false,
        settings: { executionOrder: 'v1' },
        versionId: '1'
      },
      workflowData: {}
    };
    
    console.log(`📋 [WorkflowGenerator] Metadata workflow created: "${validBlueprint.name}"`);
    return validBlueprint;
  } catch (error) {
    console.error(`❌ [WorkflowGenerator] Metadata generation failed:`, error.message);
    throw error;
  }
}

/**
 * Ultra-fast OpenAI API call with minimal prompt for fastest possible response
 */
async function generateWorkflowUltraFast(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'de',
  timeoutMs: number = 4000
): Promise<GeneratedBlueprint | null> {
  console.log(`⚡ [WorkflowGenerator] Ultra-fast generation for: "${subtask.title}" (timeout: ${timeoutMs}ms)`);
  
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`OpenAI API timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  const apiPromise = fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Respond ONLY with valid JSON. No explanations.' },
        { role: 'user', content: `{"name":"Workflow for ${subtask.title}","complexity":"medium","timeSavings":4}` }
      ],
      temperature: 0.1,
      max_tokens: 150, // Slightly more tokens for JSON
      stream: false
    })
  });

  try {
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || '';
    
    console.log(`📝 [WorkflowGenerator] Raw AI response: "${content}"`);
    
    // Try to extract JSON from response
    let jsonContent = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    // If no JSON found, create a basic one
    if (!jsonMatch) {
      jsonContent = `{"name":"Workflow for ${subtask.title}","complexity":"medium","timeSavings":4}`;
    }

    const blueprint = JSON.parse(jsonContent);
    
    // Create a basic valid blueprint
    const validBlueprint: GeneratedBlueprint = {
      id: `ultra-fast-${subtask.id}-${variation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`,
      name: blueprint.name || `Automatisierungs-Workflow: ${subtask.title}`,
      description: blueprint.description || `Automatisierung für ${subtask.title}`,
      timeSavings: blueprint.timeSavings || 4.0,
      complexity: blueprint.complexity || 'medium',
      integrations: blueprint.integrations || ['API'],
      category: 'AI Generated',
      isAIGenerated: true,
      generatedAt: new Date().toISOString(),
      status: 'generated',
      generationMetadata: {
        timestamp: Date.now(),
        model: 'gpt-4o-mini-ultra-fast',
        language: lang,
        cacheKey: `ultra_fast_${subtask.id}_${lang}`
      },
      setupCost: 500,
      downloadUrl: `/api/blueprints/ultra-fast-${subtask.id}/download`,
      validationStatus: 'valid',
      n8nWorkflow: {
        name: blueprint.name || `Workflow: ${subtask.title}`,
        nodes: [
          {
            id: 'node_0',
            name: 'Start',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          },
          {
            id: 'node_1',
            name: 'Process',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 1,
            position: [450, 300],
            parameters: {
              url: 'https://api.example.com',
              method: 'GET'
            }
          }
        ],
        connections: {
          node_0: {
            main: [[{ node: 'node_1', type: 'main', index: 0 }]]
          }
        },
        active: false,
        settings: { executionOrder: 'v1' },
        versionId: '1'
      },
      workflowData: {}
    };
    
    console.log(`⚡ [WorkflowGenerator] Ultra-fast workflow created: "${validBlueprint.name}"`);
    return validBlueprint;
  } catch (error) {
    console.error(`❌ [WorkflowGenerator] Ultra-fast generation failed:`, error.message);
    throw error;
  }
}

/**
 * Direct OpenAI API call for workflow generation (bypasses Supabase Edge Function)
 */
async function generateWorkflowDirect(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'de',
  timeoutMs: number = 8000
): Promise<GeneratedBlueprint | null> {
  console.log(`🎯 [WorkflowGenerator] Direct OpenAI generation for: "${subtask.title}" (timeout: ${timeoutMs}ms)`);
  
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = lang === 'de' 
    ? `JSON: {"name":"Workflow","nodes":[{"name":"Node","type":"n8n-nodes-base.httpRequest"}],"complexity":"medium","timeSavings":4}`
    : `JSON: {"name":"Workflow","nodes":[{"name":"Node","type":"n8n-nodes-base.httpRequest"}],"complexity":"medium","timeSavings":4}`;

  const userPrompt = lang === 'de'
    ? `${subtask.title}`
    : `${subtask.title}`;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`OpenAI API timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  const apiPromise = fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1, // Very low temperature for fastest responses
      max_tokens: 200, // Minimal tokens for fastest responses
      stream: false,
      top_p: 0.1 // Very focused responses
    })
  });

  try {
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || '';
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    } else if (content.startsWith('```') && content.endsWith('```')) {
      const lines = content.split('\n');
      content = lines.slice(1, -1).join('\n').trim();
    }

    const blueprint = JSON.parse(content);
    
    // Validate and enhance the blueprint
    if (validateBlueprint(blueprint) === 'valid') {
      // Generate node connections if not provided
      if (!blueprint.connections && blueprint.nodes) {
        blueprint.connections = generateNodeConnections(blueprint.nodes);
      }
      
      console.log(`✅ [WorkflowGenerator] Direct AI workflow generated: "${blueprint.name}"`);
      return blueprint;
    } else {
      throw new Error('Generated blueprint failed validation');
    }
  } catch (error) {
    console.error(`❌ [WorkflowGenerator] Direct generation failed:`, error.message);
    throw error;
  }
}

/**
 * Fast workflow generation with immediate fallback on timeout
 * This function prioritizes speed over AI quality
 */
export async function generateWorkflowFast(
  subtask: DynamicSubtask,
  lang: 'de' | 'en' = 'de',
  variation: number = 0,
  context: 'overarching' | 'subtask-specific' = 'subtask-specific'
): Promise<GeneratedBlueprint | null> {
  console.log(`⚡ [WorkflowGenerator] Fast generation for: "${subtask.title}"`);
  
  // Create generation metadata for caching based on context
  const cacheKey = `ai_metadata_v8_${subtask.id}_${lang}_${variation}_${context}`;
  const metadata: GenerationMetadata = {
    timestamp: Date.now(),
    model: 'gpt-4o-mini',
    language: lang,
    cacheKey: cacheKey
  };

  // Check cache first for AI-generated workflow
  const cachedBlueprint = cacheManager.getCachedWorkflow(subtask.id, metadata);
  if (cachedBlueprint) {
    console.log('💾 [WorkflowGenerator] Using cached AI workflow:', cachedBlueprint.name, 'ID:', cachedBlueprint.id);
    return cachedBlueprint;
  }

  // Try AI generation with context
  try {
    const blueprint = await generateWorkflowMetadata(subtask, lang, 5000, variation, context);
    if (blueprint) {
      console.log(`✅ [WorkflowGenerator] AI workflow metadata generated (${context}): "${blueprint.name}"`);
      // Cache the AI-generated workflow
      cacheManager.cacheWorkflow(subtask.id, metadata, blueprint, 12 * 60 * 60 * 1000);
      return blueprint;
    }
  } catch (error) {
    console.log(`❌ [WorkflowGenerator] AI generation failed: ${error.message}`);
  }
  
  // Use fallback with variation if AI fails
  console.log(`🔄 [WorkflowGenerator] Using fallback workflow for: "${subtask.title}" (${context}, variation: ${variation})`);
  const fallbackBlueprint = generateFallbackBlueprint(subtask, lang, variation);
  
  // Cache the fallback workflow
  cacheManager.cacheWorkflow(subtask.id, metadata, fallbackBlueprint, 12 * 60 * 60 * 1000);
  
  return fallbackBlueprint;
}

// Clear all workflow caches to force regeneration
export function clearAllWorkflowCaches() {
  console.log('🧹 [WorkflowGenerator] Clearing all workflow caches...');
  const keys = Object.keys(localStorage);
  const workflowKeys = keys.filter(key => 
    key.includes('ai_metadata_') || 
    key.includes('fallback_') || 
    key.includes('workflow_') ||
    key.includes('subtask_') ||
    key.includes('blueprint_') ||
    key.includes('cache_')
  );
  
  workflowKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ [WorkflowGenerator] Removed cache key: ${key}`);
  });
  
  // Also clear the in-memory cache
  if (typeof window !== 'undefined') {
    // Clear any global generation tracking
    if ((window as any).subtaskGenerationInProgress) {
      (window as any).subtaskGenerationInProgress.clear();
    }
  }
  
  console.log(`✅ [WorkflowGenerator] Cleared ${workflowKeys.length} cache entries`);
}

/**
 * NEW: Generate UnifiedWorkflow directly
 * Generiert direkt ein UnifiedWorkflow ohne Legacy-Schema
 */
export async function generateUnifiedWorkflow(
  subtask: DynamicSubtask,
  context: WorkflowCreationContext
): Promise<UnifiedWorkflow | null> {
  console.log(`🎯 [WorkflowGenerator] Generating UnifiedWorkflow for: "${subtask.title}"`);
  
  // Generate metadata using existing function
  const blueprint = await generateWorkflowFast(
    subtask, 
    context.language, 
    context.variation || 0, 
    context.context || 'subtask-specific'
  );
  
  if (!blueprint) {
    console.warn('⚠️ [WorkflowGenerator] Failed to generate blueprint for UnifiedWorkflow');
    return null;
  }
  
  // Convert to UnifiedWorkflow
  const unifiedWorkflow = WorkflowSchemaMapper.fromGeneratedBlueprint(blueprint);
  
  console.log(`✅ [WorkflowGenerator] Generated UnifiedWorkflow: "${unifiedWorkflow.title}"`);
  return unifiedWorkflow;
}

/**
 * NEW: Generate multiple UnifiedWorkflows
 * Generiert mehrere UnifiedWorkflows für eine Aufgabe
 */
export async function generateMultipleUnifiedWorkflows(
  subtask: DynamicSubtask,
  count: number = 3,
  context: WorkflowCreationContext
): Promise<UnifiedWorkflow[]> {
  console.log(`🎯 [WorkflowGenerator] Generating ${count} UnifiedWorkflows for: "${subtask.title}"`);
  
  const workflows: UnifiedWorkflow[] = [];
  
  const seenIds = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    try {
      const workflow = await generateUnifiedWorkflow(subtask, {
        ...context,
        variation: i
      });
      
      if (workflow && !seenIds.has(workflow.id)) {
        seenIds.add(workflow.id);
        workflows.push(workflow);
        console.log(`✅ [WorkflowGenerator] Generated workflow ${i + 1}/${count}: "${workflow.title}" (ID: ${workflow.id})`);
      } else if (workflow && seenIds.has(workflow.id)) {
        console.warn(`⚠️ [WorkflowGenerator] Skipping duplicate workflow ID: ${workflow.id}`);
      }
    } catch (error) {
      console.warn(`⚠️ [WorkflowGenerator] Failed to generate workflow ${i + 1}:`, error);
    }
  }
  
  console.log(`🎯 [WorkflowGenerator] Generated ${workflows.length}/${count} UnifiedWorkflows`);
  return workflows;
}

export default {
  generateWorkflowForSubtask,
  generateBlueprintsForSubtasks,
  generateFallbackBlueprint,
  generateBlueprintWithFallback,
  generateBlueprintsWithFallback,
  generateWorkflowFast,
  getWorkflowCacheStats,
  clearWorkflowCache,
  clearAllWorkflowCaches
};

