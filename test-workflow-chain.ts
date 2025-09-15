/**
 * Test Script für den kompletten Workflow: Teilaufgaben → Workflow-Empfehlungen
 */

// Simuliere Vite-Umgebungsvariablen für Tests
const mockEnv = {
  VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || 'test-key',
  VITE_OPENAI_BASE_URL: process.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  VITE_OPENAI_MODEL: process.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
};

// Mock import.meta.env
(global as any).import = {
  meta: {
    env: mockEnv
  }
};

// Import nach dem Mock
import { openaiClient } from './src/lib/openai';

// Test-Szenario: Datensammlung und -aufbereitung
const testTask = "Datensammlung und -aufbereitung";
const testJobContext = "Marketing Manager Position - Verantwortlich für die Sammlung, Aufbereitung und Analyse von Kundendaten für Marketingkampagnen. Arbeitet mit verschiedenen Datenquellen wie CRM, Website-Analytics, Social Media und E-Mail-Marketing-Tools.";

async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete Workflow Chain\n');
  console.log('=' .repeat(80));
  
  try {
    // Prüfe OpenAI-Konfiguration
    if (!openaiClient.isConfigured()) {
      console.log('⚠️ OpenAI not configured, using mock data for testing\n');
      return testWithMockData();
    }
    
    // Schritt 1: Teilaufgaben generieren
    console.log('📋 STEP 1: Generating Subtasks');
    console.log(`Task: ${testTask}`);
    console.log(`Context: ${testJobContext.slice(0, 100)}...\n`);
    
    const subtasks = await openaiClient.generateSubtasks(testTask, 'de');
    console.log(`✅ Generated ${subtasks.length} subtasks:`);
    
    subtasks.forEach((subtask, index) => {
      console.log(`  ${index + 1}. ${subtask.title}`);
      console.log(`     Automation: ${subtask.automationPotential}%`);
      console.log(`     Time: ${subtask.estimatedTime}min`);
      console.log(`     Priority: ${subtask.priority}`);
      console.log(`     Systems: ${subtask.systems.join(', ')}`);
      console.log('');
    });
    
    // Schritt 2: Workflow-Empfehlungen basierend auf Teilaufgaben
    console.log('🔄 STEP 2: Generating Workflow Recommendations');
    console.log('Based on generated subtasks...\n');
    
    const solutions = await openaiClient.findBestSolutions(testTask, subtasks, 'de');
    
    console.log(`✅ Generated ${solutions.workflows.length} workflows:`);
    solutions.workflows.forEach((workflow, index) => {
      console.log(`  ${index + 1}. ${workflow.name}`);
      console.log(`     Technology: ${workflow.technology}`);
      console.log(`     Match Score: ${workflow.matchScore}%`);
      console.log(`     Setup Time: ${workflow.setupTime}`);
      console.log(`     Difficulty: ${workflow.difficulty}`);
      console.log(`     Steps: ${workflow.steps.join(' → ')}`);
      console.log(`     Reasoning: ${workflow.reasoning}`);
      console.log('');
    });
    
    console.log(`✅ Generated ${solutions.agents.length} AI agents:`);
    solutions.agents.forEach((agent, index) => {
      console.log(`  ${index + 1}. ${agent.name}`);
      console.log(`     Technology: ${agent.technology}`);
      console.log(`     Match Score: ${agent.matchScore}%`);
      console.log(`     Setup Time: ${agent.setupTime}`);
      console.log(`     Difficulty: ${agent.difficulty}`);
      console.log(`     Reasoning: ${agent.reasoning}`);
      console.log('');
    });
    
    // Schritt 3: Qualitätsbewertung
    console.log('📊 STEP 3: Quality Assessment');
    console.log('=' .repeat(80));
    
    const qualityScore = assessQuality(subtasks, solutions);
    console.log(`Overall Quality Score: ${qualityScore}/100\n`);
    
    // Schritt 4: Verbesserungsvorschläge
    console.log('💡 STEP 4: Improvement Suggestions');
    console.log('=' .repeat(80));
    
    const improvements = suggestImprovements(subtasks, solutions);
    improvements.forEach((improvement, index) => {
      console.log(`${index + 1}. ${improvement}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔄 Falling back to mock data test...\n');
    return testWithMockData();
  }
}

function testWithMockData() {
  console.log('📋 STEP 1: Mock Subtasks (for testing)');
  const mockSubtasks = [
    {
      id: 'data-collection-1',
      title: 'Daten aus verschiedenen Quellen sammeln',
      description: 'Automatische Sammlung von Kundendaten aus CRM, Website-Analytics und Social Media',
      automationPotential: 85,
      estimatedTime: 120,
      priority: 'high',
      complexity: 'medium',
      systems: ['CRM', 'Google Analytics', 'Social Media APIs'],
      risks: ['Datenqualität', 'API-Limits'],
      opportunities: ['Automatisierung', 'Echtzeitdaten'],
      dependencies: ['API-Zugänge', 'Datenbankverbindungen']
    },
    {
      id: 'data-processing-2',
      title: 'Daten bereinigen und strukturieren',
      description: 'Bereinigung von Duplikaten, Formatierung und Strukturierung für Analyse',
      automationPotential: 90,
      estimatedTime: 90,
      priority: 'high',
      complexity: 'medium',
      systems: ['Python', 'Pandas', 'Excel AI'],
      risks: ['Datenverlust', 'Fehlerhafte Bereinigung'],
      opportunities: ['AI-gestützte Bereinigung', 'Automatische Validierung'],
      dependencies: ['Datenqualitätsregeln', 'Bereinigungslogik']
    },
    {
      id: 'data-analysis-3',
      title: 'Daten analysieren und Insights generieren',
      description: 'Erstellung von Reports, Dashboards und Marketing-Insights',
      automationPotential: 75,
      estimatedTime: 180,
      priority: 'medium',
      complexity: 'high',
      systems: ['Power BI', 'Python', 'ChatGPT'],
      risks: ['Fehlinterpretation', 'Komplexe Analysen'],
      opportunities: ['AI-gestützte Insights', 'Automatische Reports'],
      dependencies: ['Analysemodelle', 'Visualisierungsregeln']
    }
  ];
  
  console.log(`✅ Mock ${mockSubtasks.length} subtasks:`);
  mockSubtasks.forEach((subtask, index) => {
    console.log(`  ${index + 1}. ${subtask.title}`);
    console.log(`     Automation: ${subtask.automationPotential}%`);
    console.log(`     Time: ${subtask.estimatedTime}min`);
    console.log(`     Priority: ${subtask.priority}`);
    console.log(`     Systems: ${subtask.systems.join(', ')}`);
    console.log('');
  });
  
  console.log('🔄 STEP 2: Mock Workflow Recommendations');
  const mockSolutions = {
    workflows: [
      {
        name: 'Automatische Daten-ETL-Pipeline',
        technology: 'Python + Pandas + SQL + Excel AI',
        steps: ['1. Daten-Sammlung', '2. Automatische Bereinigung', '3. Strukturierung', '4. Export'],
        difficulty: 'Mittel',
        setupTime: '4-6h',
        matchScore: 95,
        reasoning: 'Perfekt für automatische Datensammlung und -aufbereitung basierend auf den Teilaufgaben'
      },
      {
        name: 'Datenqualitäts-Überwachung',
        technology: 'Power BI + Alerts + Data Validation',
        steps: ['1. Qualitätsprüfung', '2. Automatische Alerts', '3. Validierung', '4. Reporting'],
        difficulty: 'Einfach',
        setupTime: '2-3h',
        matchScore: 85,
        reasoning: 'Automatisiert die Datenqualitätskontrolle für bessere Analyseergebnisse'
      }
    ],
    agents: [
      {
        name: 'Excel AI Assistant',
        technology: 'Microsoft Excel AI + Power Query',
        implementation: '1. Excel AI aktivieren 2. Datenquellen verbinden 3. Automatische Bereinigung einrichten',
        difficulty: 'Einfach',
        setupTime: '1-2h',
        matchScore: 90,
        reasoning: 'Ideal für Datenaufbereitung und -bereinigung in Excel-Umgebungen'
      }
    ]
  };
  
  console.log(`✅ Mock ${mockSolutions.workflows.length} workflows:`);
  mockSolutions.workflows.forEach((workflow, index) => {
    console.log(`  ${index + 1}. ${workflow.name}`);
    console.log(`     Technology: ${workflow.technology}`);
    console.log(`     Match Score: ${workflow.matchScore}%`);
    console.log(`     Setup Time: ${workflow.setupTime}`);
    console.log(`     Difficulty: ${workflow.difficulty}`);
    console.log(`     Steps: ${workflow.steps.join(' → ')}`);
    console.log(`     Reasoning: ${workflow.reasoning}`);
    console.log('');
  });
  
  console.log(`✅ Mock ${mockSolutions.agents.length} AI agents:`);
  mockSolutions.agents.forEach((agent, index) => {
    console.log(`  ${index + 1}. ${agent.name}`);
    console.log(`     Technology: ${agent.technology}`);
    console.log(`     Match Score: ${agent.matchScore}%`);
    console.log(`     Setup Time: ${agent.setupTime}`);
    console.log(`     Difficulty: ${agent.difficulty}`);
    console.log(`     Reasoning: ${agent.reasoning}`);
    console.log('');
  });
  
  // Qualitätsbewertung
  console.log('📊 STEP 3: Quality Assessment');
  console.log('=' .repeat(80));
  
  const qualityScore = assessQuality(mockSubtasks, mockSolutions);
  console.log(`Overall Quality Score: ${qualityScore}/100\n`);
  
  // Verbesserungsvorschläge
  console.log('💡 STEP 4: Improvement Suggestions');
  console.log('=' .repeat(80));
  
  const improvements = suggestImprovements(mockSubtasks, mockSolutions);
  improvements.forEach((improvement, index) => {
    console.log(`${index + 1}. ${improvement}`);
  });
}

function assessQuality(subtasks: any[], solutions: any): number {
  let score = 0;
  
  // Bewerte Teilaufgaben-Qualität (40 Punkte)
  const subtaskScore = Math.min(40, subtasks.length * 8); // Max 5 subtasks = 40 Punkte
  score += subtaskScore;
  
  // Bewerte Workflow-Relevanz (30 Punkte)
  const avgWorkflowScore = solutions.workflows.reduce((sum: number, w: any) => sum + w.matchScore, 0) / solutions.workflows.length;
  score += (avgWorkflowScore / 100) * 30;
  
  // Bewerte Agent-Relevanz (20 Punkte)
  const avgAgentScore = solutions.agents.reduce((sum: number, a: any) => sum + a.matchScore, 0) / solutions.agents.length;
  score += (avgAgentScore / 100) * 20;
  
  // Bewerte Automatisierungspotenzial (10 Punkte)
  const avgAutomation = subtasks.reduce((sum, s) => sum + s.automationPotential, 0) / subtasks.length;
  score += (avgAutomation / 100) * 10;
  
  return Math.round(score);
}

function suggestImprovements(subtasks: any[], solutions: any): string[] {
  const improvements: string[] = [];
  
  // Prüfe Teilaufgaben-Qualität
  if (subtasks.length < 3) {
    improvements.push('Generate more subtasks (currently ' + subtasks.length + ', should be 3-5)');
  }
  
  if (subtasks.some(s => s.automationPotential < 30)) {
    improvements.push('Some subtasks have very low automation potential - consider breaking them down further');
  }
  
  // Prüfe Workflow-Qualität
  if (solutions.workflows.length === 0) {
    improvements.push('No workflows generated - check prompt and AI response');
  }
  
  const lowScoreWorkflows = solutions.workflows.filter((w: any) => w.matchScore < 70);
  if (lowScoreWorkflows.length > 0) {
    improvements.push('Some workflows have low match scores - improve task-specific recommendations');
  }
  
  // Prüfe Agent-Qualität
  if (solutions.agents.length === 0) {
    improvements.push('No AI agents generated - check prompt and AI response');
  }
  
  // Prüfe Setup-Zeiten
  const unrealisticTimes = solutions.workflows.filter((w: any) => 
    w.setupTime.includes('0min') || w.setupTime.includes('0h')
  );
  if (unrealisticTimes.length > 0) {
    improvements.push('Some workflows have unrealistic setup times - provide more realistic estimates');
  }
  
  return improvements;
}

// Führe den Test aus
if (require.main === module) {
  testCompleteWorkflow().catch(console.error);
}

export { testCompleteWorkflow };