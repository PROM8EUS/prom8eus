/**
 * Test-Funktionen für den Workflow: Teilaufgaben → Workflow-Empfehlungen
 */

import { openaiClient } from './openai';

export interface TestResult {
  subtasks: any[];
  solutions: any;
  qualityScore: number;
  improvements: string[];
  executionTime: number;
}

export async function testWorkflowChain(
  taskText: string, 
  lang: 'de' | 'en' = 'de'
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🧪 Testing Workflow Chain:', taskText);
    
    // Schritt 1: Teilaufgaben generieren
    console.log('📋 Generating subtasks...');
    const subtasks = await openaiClient.generateSubtasks(taskText, lang);
    console.log(`✅ Generated ${subtasks.length} subtasks`);
    
    // Schritt 2: Workflow-Empfehlungen
    console.log('🔄 Generating workflow recommendations...');
    const solutions = await openaiClient.findBestSolutions(taskText, subtasks, lang);
    console.log(`✅ Generated ${solutions.workflows.length} workflows and ${solutions.agents.length} agents`);
    
    // Schritt 3: Qualitätsbewertung
    const qualityScore = assessQuality(subtasks, solutions);
    const improvements = suggestImprovements(subtasks, solutions);
    
    const executionTime = Date.now() - startTime;
    
    return {
      subtasks,
      solutions,
      qualityScore,
      improvements,
      executionTime
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

export function assessQuality(subtasks: any[], solutions: any): number {
  let score = 0;
  
  // Bewerte Teilaufgaben-Qualität (40 Punkte)
  const subtaskScore = Math.min(40, subtasks.length * 8); // Max 5 subtasks = 40 Punkte
  score += subtaskScore;
  
  // Bewerte Workflow-Relevanz (30 Punkte)
  if (solutions.workflows.length > 0) {
    const avgWorkflowScore = solutions.workflows.reduce((sum: number, w: any) => sum + w.matchScore, 0) / solutions.workflows.length;
    score += (avgWorkflowScore / 100) * 30;
  }
  
  // Bewerte Agent-Relevanz (20 Punkte)
  if (solutions.agents.length > 0) {
    const avgAgentScore = solutions.agents.reduce((sum: number, a: any) => sum + a.matchScore, 0) / solutions.agents.length;
    score += (avgAgentScore / 100) * 20;
  }
  
  // Bewerte Automatisierungspotenzial (10 Punkte)
  if (subtasks.length > 0) {
    const avgAutomation = subtasks.reduce((sum, s) => sum + s.automationPotential, 0) / subtasks.length;
    score += (avgAutomation / 100) * 10;
  }
  
  return Math.round(score);
}

export function suggestImprovements(subtasks: any[], solutions: any): string[] {
  const improvements: string[] = [];
  
  // Prüfe Teilaufgaben-Qualität
  if (subtasks.length < 3) {
    improvements.push(`Generate more subtasks (currently ${subtasks.length}, should be 3-5)`);
  }
  
  if (subtasks.length > 5) {
    improvements.push(`Too many subtasks (${subtasks.length}), consider consolidating to 3-5`);
  }
  
  const lowAutomationTasks = subtasks.filter(s => s.automationPotential < 30);
  if (lowAutomationTasks.length > 0) {
    improvements.push(`${lowAutomationTasks.length} subtasks have very low automation potential - consider breaking them down further`);
  }
  
  // Prüfe Workflow-Qualität
  if (solutions.workflows.length === 0) {
    improvements.push('No workflows generated - check prompt and AI response');
  }
  
  const lowScoreWorkflows = solutions.workflows.filter((w: any) => w.matchScore < 70);
  if (lowScoreWorkflows.length > 0) {
    improvements.push(`${lowScoreWorkflows.length} workflows have low match scores - improve task-specific recommendations`);
  }
  
  // Prüfe Agent-Qualität
  if (solutions.agents.length === 0) {
    improvements.push('No AI agents generated - check prompt and AI response');
  }
  
  const lowScoreAgents = solutions.agents.filter((a: any) => a.matchScore < 70);
  if (lowScoreAgents.length > 0) {
    improvements.push(`${lowScoreAgents.length} agents have low match scores - improve task-specific recommendations`);
  }
  
  // Prüfe Setup-Zeiten
  const unrealisticTimes = solutions.workflows.filter((w: any) => 
    w.setupTime.includes('0min') || w.setupTime.includes('0h')
  );
  if (unrealisticTimes.length > 0) {
    improvements.push(`${unrealisticTimes.length} workflows have unrealistic setup times - provide more realistic estimates`);
  }
  
  // Prüfe Technologie-Spezifität
  const genericWorkflows = solutions.workflows.filter((w: any) => 
    w.technology.includes('Various') || w.technology.includes('Multiple')
  );
  if (genericWorkflows.length > 0) {
    improvements.push(`${genericWorkflows.length} workflows have generic technology descriptions - be more specific`);
  }
  
  return improvements;
}

export function printTestResults(result: TestResult, taskText: string) {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 WORKFLOW CHAIN TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Task: ${taskText}`);
  console.log(`Execution Time: ${result.executionTime}ms`);
  console.log(`Quality Score: ${result.qualityScore}/100`);
  console.log('');
  
  console.log('📋 SUBTASKS:');
  result.subtasks.forEach((subtask, index) => {
    console.log(`  ${index + 1}. ${subtask.title}`);
    console.log(`     Automation: ${subtask.automationPotential}%`);
    console.log(`     Time: ${subtask.estimatedTime}min`);
    console.log(`     Priority: ${subtask.priority}`);
    console.log(`     Systems: ${subtask.systems?.join(', ') || 'none'}`);
    console.log('');
  });
  
  console.log('🔄 WORKFLOWS:');
  result.solutions.workflows.forEach((workflow: any, index: number) => {
    console.log(`  ${index + 1}. ${workflow.name}`);
    console.log(`     Technology: ${workflow.technology}`);
    console.log(`     Match Score: ${workflow.matchScore}%`);
    console.log(`     Setup Time: ${workflow.setupTime}`);
    console.log(`     Difficulty: ${workflow.difficulty}`);
    console.log(`     Steps: ${workflow.steps?.join(' → ') || 'none'}`);
    console.log(`     Reasoning: ${workflow.reasoning}`);
    console.log('');
  });
  
  console.log('🤖 AI AGENTS:');
  result.solutions.agents.forEach((agent: any, index: number) => {
    console.log(`  ${index + 1}. ${agent.name}`);
    console.log(`     Technology: ${agent.technology}`);
    console.log(`     Match Score: ${agent.matchScore}%`);
    console.log(`     Setup Time: ${agent.setupTime}`);
    console.log(`     Difficulty: ${agent.difficulty}`);
    console.log(`     Reasoning: ${agent.reasoning}`);
    console.log('');
  });
  
  if (result.improvements.length > 0) {
    console.log('💡 IMPROVEMENTS:');
    result.improvements.forEach((improvement, index) => {
      console.log(`  ${index + 1}. ${improvement}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

// Test-Szenarien
export const testScenarios = [
  {
    name: 'Data Collection & Processing',
    task: 'Datensammlung und -aufbereitung',
    lang: 'de' as const
  },
  {
    name: 'Report Generation',
    task: 'Monatliche Berichte erstellen',
    lang: 'de' as const
  },
  {
    name: 'Customer Support',
    task: 'Kundensupport automatisieren',
    lang: 'de' as const
  },
  {
    name: 'Data Analysis',
    task: 'Datenanalyse und Visualisierung',
    lang: 'de' as const
  }
];

export async function runAllTests(): Promise<void> {
  console.log('🧪 Running all workflow chain tests...\n');
  
  for (const scenario of testScenarios) {
    try {
      console.log(`\n📋 Testing: ${scenario.name}`);
      const result = await testWorkflowChain(scenario.task, scenario.lang);
      printTestResults(result, scenario.task);
      
      // Warte zwischen Tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Test failed for ${scenario.name}:`, error);
    }
  }
  
  console.log('\n✅ All tests completed!');
}
