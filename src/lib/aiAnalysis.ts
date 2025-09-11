/**
 * AI-Enhanced Analysis Engine
 * Integrates OpenAI for intelligent task analysis and recommendations
 */

import { openaiClient, isOpenAIAvailable } from './openai';
import { Task } from './runAnalysis';
import { DynamicSubtask } from './types';

export interface AIAnalysisResult {
  tasks: Task[];
  summary: string;
  confidence: number;
  aiEnabled: boolean;
  fallbackUsed: boolean;
}

export interface AISubtaskResult {
  subtasks: DynamicSubtask[];
  aiEnabled: boolean;
  fallbackUsed: boolean;
}

export interface AIAgentResult {
  agents: Array<{
    name: string;
    technology: string;
    implementation: string;
    difficulty: 'Einfach' | 'Mittel' | 'Schwer';
    setupTime: string;
  }>;
  aiEnabled: boolean;
  fallbackUsed: boolean;
}

/**
 * AI-Enhanced Job Analysis
 * Uses OpenAI to analyze job descriptions and extract tasks
 */
export async function analyzeJobWithAI(
  jobText: string, 
  lang: 'de' | 'en' = 'de'
): Promise<AIAnalysisResult> {
  console.log('🤖 Starting AI-enhanced job analysis...');
  
  if (!isOpenAIAvailable()) {
    throw new Error('OpenAI API nicht verfügbar. Bitte API-Key konfigurieren.');
  }

  console.log('🚀 Using OpenAI for job analysis...');
  const aiResult = await openaiClient.analyzeJobDescription(jobText, lang);
  
  if (!aiResult.tasks || aiResult.tasks.length === 0) {
    throw new Error('AI konnte keine Aufgaben aus der Stellenbeschreibung extrahieren.');
  }
  
  // Convert AI result to Task format
  const tasks: Task[] = aiResult.tasks.map((task, index) => ({
    id: `ai-task-${index}`,
    text: task.text,
    name: task.text,
    score: task.automationPotential,
    label: task.automationPotential >= 70 ? 'Automatisierbar' : 
           task.automationPotential >= 30 ? 'Teilweise Automatisierbar' : 'Mensch',
    category: task.category,
    confidence: 90, // High confidence for AI analysis (90%)
    automationRatio: task.automationPotential,
    humanRatio: 100 - task.automationPotential,
    complexity: task.automationPotential >= 70 ? 'low' : 
                task.automationPotential >= 30 ? 'medium' : 'high',
    automationTrend: 'increasing' as const,
    signals: [task.reasoning],
  }));

  return {
    tasks,
    summary: aiResult.summary,
    confidence: 90,
    aiEnabled: true,
    fallbackUsed: false,
  };
}

/**
 * AI-Enhanced Subtask Generation
 * Uses OpenAI to generate detailed subtasks
 */
export async function generateSubtasksWithAI(
  taskText: string,
  lang: 'de' | 'en' = 'de'
): Promise<AISubtaskResult> {
  console.log('🤖 Starting AI-enhanced subtask generation...');
  
  if (!isOpenAIAvailable()) {
    throw new Error('OpenAI API nicht verfügbar. Bitte API-Key konfigurieren.');
  }

  console.log('🚀 Using OpenAI for subtask generation...');
  const aiSubtasks = await openaiClient.generateSubtasks(taskText, lang);
  
  if (!aiSubtasks || aiSubtasks.length === 0) {
    throw new Error('AI konnte keine Unteraufgaben generieren.');
  }
  
  // Convert AI result to DynamicSubtask format
  const subtasks: DynamicSubtask[] = aiSubtasks.map(subtask => ({
    id: subtask.id,
    title: subtask.title,
    description: subtask.description,
    automationPotential: subtask.automationPotential,
    estimatedTime: subtask.estimatedTime,
    priority: subtask.priority,
    complexity: subtask.complexity,
    systems: subtask.systems,
    risks: subtask.risks,
    opportunities: subtask.opportunities,
    dependencies: subtask.dependencies,
    aiTools: [], // Will be populated by other systems
  }));

  return {
    subtasks,
    aiEnabled: true,
    fallbackUsed: false,
  };
}

/**
 * AI-Enhanced Agent Recommendations
 * Uses OpenAI to recommend AI agents and workflows
 */
export async function recommendAgentsWithAI(
  taskText: string,
  lang: 'de' | 'en' = 'de'
): Promise<AIAgentResult> {
  console.log('🤖 Starting AI-enhanced agent recommendations...');
  
  if (!isOpenAIAvailable()) {
    throw new Error('OpenAI API nicht verfügbar. Bitte API-Key konfigurieren.');
  }

  console.log('🚀 Using OpenAI for agent recommendations...');
  const aiAgents = await openaiClient.recommendAIAgents(taskText, lang);

  if (!aiAgents || aiAgents.length === 0) {
    throw new Error('AI konnte keine Agenten-Empfehlungen generieren.');
  }

  return {
    agents: aiAgents,
    aiEnabled: true,
    fallbackUsed: false,
  };
}

/**
 * AI-Enhanced Solution Matching
 * Uses OpenAI to find the best AI agents and workflows for specific tasks
 */
export async function findBestSolutionsWithAI(
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
  aiEnabled: boolean;
  fallbackUsed: boolean;
}> {
  console.log('🤖 Starting AI-enhanced solution matching...');
  
  if (!isOpenAIAvailable()) {
    throw new Error('OpenAI API nicht verfügbar. Bitte API-Key konfigurieren.');
  }

  console.log('🚀 Using OpenAI for solution matching...');
  const aiSolutions = await openaiClient.findBestSolutions(taskText, subtasks, lang);
  
  if (!aiSolutions || (!aiSolutions.agents && !aiSolutions.workflows)) {
    throw new Error('AI konnte keine Lösungen finden.');
  }
  
  return {
    ...aiSolutions,
    aiEnabled: true,
    fallbackUsed: false,
  };
}

/**
 * Test AI connectivity and provide detailed diagnostics
 */
export async function testAIConnectivity(): Promise<{
  isAvailable: boolean;
  isConfigured: boolean;
  testResult?: boolean;
  error?: string;
  diagnostics?: {
    modelsAvailable: boolean;
    quotaIssue: boolean;
    networkIssue: boolean;
    modelSpecificIssue: boolean;
  };
}> {
  const isConfigured = isOpenAIAvailable();
  
  if (!isConfigured) {
    return {
      isAvailable: false,
      isConfigured: false,
      error: 'OpenAI API Key nicht konfiguriert'
    };
  }

  const diagnostics = {
    modelsAvailable: false,
    quotaIssue: false,
    networkIssue: false,
    modelSpecificIssue: false
  };

  try {
    // Test 1: Check if models endpoint works
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        diagnostics.modelsAvailable = true;
        console.log('✅ Models endpoint accessible');
      } else {
        console.log('❌ Models endpoint failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Models endpoint error:', error);
      diagnostics.networkIssue = true;
    }

    // Test 2: Try chat completion with different models
    const models = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'];
    let successfulModel = null;
    
    for (const model of models) {
      try {
        const originalModel = openaiClient['model'];
        openaiClient['model'] = model;
        
        const testResult = await openaiClient.chatCompletion([
          { role: 'user', content: 'Hello' }
        ], { max_tokens: 5 });
        
        openaiClient['model'] = originalModel;
        
        if (testResult.content) {
          successfulModel = model;
          console.log(`✅ Chat completion successful with model: ${model}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Model ${model} failed:`, error);
        
        if (error instanceof Error && error.message.includes('quota')) {
          diagnostics.quotaIssue = true;
        } else if (error instanceof Error && error.message.includes('network')) {
          diagnostics.networkIssue = true;
        } else {
          diagnostics.modelSpecificIssue = true;
        }
      }
    }

    if (successfulModel) {
      return {
        isAvailable: true,
        isConfigured: true,
        testResult: true,
        diagnostics
      };
    } else {
      return {
        isAvailable: false,
        isConfigured: true,
        testResult: false,
        error: diagnostics.quotaIssue ? 'Quota issue' : 
               diagnostics.networkIssue ? 'Network issue' : 
               diagnostics.modelSpecificIssue ? 'Model-specific issue' : 'Unknown error',
        diagnostics
      };
    }
  } catch (error) {
    return {
      isAvailable: false,
      isConfigured: true,
      testResult: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      diagnostics
    };
  }
}