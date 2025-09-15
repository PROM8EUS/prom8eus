/**
 * Workflow-Empfehlungs-Beispiele
 * Demonstriert die verbesserten Workflow-Empfehlungen basierend auf Teilaufgaben
 */

import { openaiClient } from './openai';

// Beispiel-Teilaufgaben für verschiedene Szenarien
export const exampleScenarios = {
  softwareEngineer: {
    mainTask: "Debug application issues",
    subtasks: [
      {
        title: "Identify error sources",
        automationPotential: 80,
        text: "Identify error sources"
      },
      {
        title: "Analyze stack traces",
        automationPotential: 90,
        text: "Analyze stack traces"
      },
      {
        title: "Generate test cases",
        automationPotential: 85,
        text: "Generate test cases"
      },
      {
        title: "Update documentation",
        automationPotential: 70,
        text: "Update documentation"
      }
    ]
  },
  marketingManager: {
    mainTask: "Manage advertising campaigns",
    subtasks: [
      {
        title: "Analyze campaign performance",
        automationPotential: 85,
        text: "Analyze campaign performance"
      },
      {
        title: "Create ad variations",
        automationPotential: 75,
        text: "Create ad variations"
      },
      {
        title: "Optimize targeting",
        automationPotential: 80,
        text: "Optimize targeting"
      },
      {
        title: "Generate reports",
        automationPotential: 90,
        text: "Generate reports"
      }
    ]
  },
  dataScientist: {
    mainTask: "Analyze market research data",
    subtasks: [
      {
        title: "Collect data from sources",
        automationPotential: 85,
        text: "Collect data from sources"
      },
      {
        title: "Clean and preprocess data",
        automationPotential: 90,
        text: "Clean and preprocess data"
      },
      {
        title: "Create visualizations",
        automationPotential: 80,
        text: "Create visualizations"
      },
      {
        title: "Generate insights",
        automationPotential: 70,
        text: "Generate insights"
      }
    ]
  }
};

/**
 * Testet die verbesserten Workflow-Empfehlungen
 */
export async function testWorkflowRecommendations() {
  console.log('🧪 Testing enhanced workflow recommendations...\n');

  for (const [role, scenario] of Object.entries(exampleScenarios)) {
    console.log(`📋 Testing ${role}:`);
    console.log(`Main Task: ${scenario.mainTask}`);
    console.log(`Subtasks: ${scenario.subtasks.map(s => s.title).join(', ')}\n`);

    try {
      const result = await openaiClient.findBestSolutions(
        scenario.mainTask,
        scenario.subtasks,
        'de'
      );

      console.log('🤖 AI Agents:');
      result.agents.forEach((agent, index) => {
        console.log(`  ${index + 1}. ${agent.name} (${agent.matchScore}% match)`);
        console.log(`     Technology: ${agent.technology}`);
        console.log(`     Setup: ${agent.setupTime} - ${agent.difficulty}`);
        console.log(`     Reasoning: ${agent.reasoning}\n`);
      });

      console.log('🔄 Workflows:');
      result.workflows.forEach((workflow, index) => {
        console.log(`  ${index + 1}. ${workflow.name} (${workflow.matchScore}% match)`);
        console.log(`     Technology: ${workflow.technology}`);
        console.log(`     Steps: ${workflow.steps.join(' → ')}`);
        console.log(`     Setup: ${workflow.setupTime} - ${workflow.difficulty}`);
        console.log(`     Reasoning: ${workflow.reasoning}\n`);
      });

      console.log('─'.repeat(80) + '\n');
    } catch (error) {
      console.error(`❌ Error testing ${role}:`, error);
    }
  }
}

/**
 * Demonstriert spezifische Workflow-Mappings
 */
export function demonstrateWorkflowMappings() {
  console.log('🎯 Workflow-Mapping Demonstration:\n');

  const mappings = {
    'debug': 'Bug-Tracking Workflow',
    'analyze': 'Datenanalyse-Pipeline',
    'create': 'Content-Erstellung Workflow',
    'manage': 'Projekt-Management Workflow',
    'optimize': 'Performance-Monitoring Workflow'
  };

  console.log('Keyword → Workflow Mapping:');
  Object.entries(mappings).forEach(([keyword, workflow]) => {
    console.log(`  "${keyword}" → ${workflow}`);
  });

  console.log('\n📊 Automation Potential → Workflow Fallback:');
  console.log('  >70% → Datenanalyse-Pipeline');
  console.log('  50-70% → Projekt-Management Workflow');
  console.log('  <50% → Content-Erstellung Workflow');
}

// Beispiel-Ausführung
if (typeof window === 'undefined') {
  // Nur in Node.js-Umgebung ausführen
  console.log('🚀 Workflow Examples loaded. Call testWorkflowRecommendations() to test.');
}
