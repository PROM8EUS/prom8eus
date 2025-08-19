#!/usr/bin/env ts-node

import { extractTasks } from '../src/lib/extractTasks';
import { runAnalysis } from '../src/lib/runAnalysis';

// Test-Job-Beschreibungen
const testJobs = [
  {
    title: "Software Engineer",
    content: `Software Engineer

RESPONSIBILITIES:
• Develop web applications using React and Node.js
• Code reviews and testing
• Database design and optimization
• API development and integration
• Debugging and troubleshooting
• Document software components
• Work in agile development teams
• Maintain existing systems

QUALIFICATIONS:
• Computer Science degree or equivalent
• Experience with JavaScript, React, Node.js
• Knowledge of SQL and NoSQL databases
• Git version control
• Problem-solving mindset`
  },
  {
    title: "Data Scientist",
    content: `Data Scientist

RESPONSIBILITIES:
• Data collection and preparation
• Statistical analysis and modeling
• Develop machine learning algorithms
• Create dashboards and reports
• Data visualization and presentation
• A/B testing and experiments
• Automate analysis processes
• Collaborate with business units

QUALIFICATIONS:
• Mathematics, Statistics or Computer Science degree
• Experience with Python, R and SQL
• Machine learning knowledge
• Analytical thinking
• Presentation skills`
  },
  {
    title: "Customer Service Representative",
    content: `Customer Service Representative

RESPONSIBILITIES:
• Phone customer consultation
• Handle email inquiries
• Process complaints
• Order entry in system
• Product consulting and sales
• Schedule appointments for field service
• Document customer interactions
• Support at trade shows and events

QUALIFICATIONS:
• Commercial training or degree
• Friendly and professional demeanor
• Strong phone communication skills
• Patience in customer interactions
• PC skills and CRM experience`
  },
  {
    title: "Accountant",
    content: `Accountant

RESPONSIBILITIES:
• Maintain financial accounting records
• Prepare monthly and annual financial statements
• Account for receipts and invoices
• VAT returns
• Accounts receivable and payment processing
• Reconcile accounts
• Collaborate with tax consultants
• Budget planning and controlling

QUALIFICATIONS:
• Training as tax specialist or accountant
• Several years of accounting experience
• Knowledge of accounting software
• Accuracy and reliability
• Tax law knowledge`
  },
  {
    title: "Marketing Manager",
    content: `Marketing Manager

RESPONSIBILITIES:
• Develop and implement marketing strategies
• Coordinate advertising campaigns
• Analyze market trends and customer behavior
• Budget planning and control
• Manage social media channels
• Organize events and trade shows
• Collaborate with external agencies
• Create presentations and reports

QUALIFICATIONS:
• Bachelor's degree in Marketing or Business Administration
• 3-5 years of marketing experience
• Creativity and analytical thinking
• Excellent communication skills
• Proficiency in MS Office and marketing tools`
  }
];

function analyzeJob(jobTitle: string, jobContent: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`ANALYSE: ${jobTitle}`);
  console.log(`${'='.repeat(80)}`);
  
  // Schritt 1: Aufgaben extrahieren
  console.log('\n📋 SCHRITT 1: AUFGABEN EXTRAHIEREN');
  console.log('-'.repeat(50));
  
  const rawTasks = extractTasks(jobContent);
  console.log(`Gefundene Aufgaben: ${rawTasks.length}`);
  
  rawTasks.forEach((task, index) => {
    console.log(`${index + 1}. [${task.source}] ${task.text}`);
  });
  
  // Schritt 2: Analyse durchführen
  console.log('\n🔍 SCHRITT 2: AUTOMATISIERUNGS-ANALYSE');
  console.log('-'.repeat(50));
  
  const analysis = runAnalysis(jobContent);
  
  console.log(`\n📊 GESAMTERGEBNIS:`);
  console.log(`   Gesamtscore: ${analysis.totalScore}%`);
  console.log(`   Verhältnis: ${analysis.ratio.automatisierbar}% automatisierbar, ${analysis.ratio.mensch}% menschlich`);
  console.log(`   Aufgaben analysiert: ${analysis.tasks.length}`);
  
  console.log(`\n📝 ZUSAMMENFASSUNG:`);
  console.log(`   ${analysis.summary}`);
  
  console.log(`\n💡 EMPFEHLUNGEN:`);
  analysis.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });
  
  // Schritt 3: Detaillierte Aufgaben-Analyse
  console.log('\n🎯 SCHRITT 3: DETAILLIERTE AUFGABEN-ANALYSE');
  console.log('-'.repeat(50));
  
  analysis.tasks.forEach((task, index) => {
    const icon = task.label === 'Automatisierbar' ? '🤖' : '👤';
    const scoreColor = task.score >= 70 ? '🟢' : task.score >= 40 ? '🟡' : '🔴';
    
    console.log(`\n${index + 1}. ${icon} ${task.text}`);
    console.log(`   Score: ${scoreColor} ${task.score}%`);
    console.log(`   Kategorie: ${task.category}`);
    console.log(`   Confidence: ${task.confidence}%`);
    console.log(`   Label: ${task.label}`);
  });
  
  return {
    jobTitle,
    rawTasks,
    analysis
  };
}

// Hauptfunktion
function main() {
  console.log('🚀 JOB-ANALYSE TEST STARTET');
  console.log('Untersuche Job-Eingaben und Ausgabe als Aufgaben mit Scores\n');
  
  const results = testJobs.map(job => analyzeJob(job.title, job.content));
  
  // Zusammenfassung
  console.log(`\n${'='.repeat(80)}`);
  console.log('📈 ZUSAMMENFASSUNG ALLER ANALYSEN');
  console.log(`${'='.repeat(80)}`);
  
  results.forEach(result => {
    const { jobTitle, analysis } = result;
    console.log(`\n${jobTitle}:`);
    console.log(`  • Score: ${analysis.totalScore}%`);
    console.log(`  • Automatisierbar: ${analysis.ratio.automatisierbar}%`);
    console.log(`  • Menschlich: ${analysis.ratio.mensch}%`);
    console.log(`  • Aufgaben: ${analysis.tasks.length}`);
  });
  
  // Durchschnittswerte
  const avgScore = results.reduce((sum, r) => sum + r.analysis.totalScore, 0) / results.length;
  const avgAutomatisierbar = results.reduce((sum, r) => sum + r.analysis.ratio.automatisierbar, 0) / results.length;
  const avgMensch = results.reduce((sum, r) => sum + r.analysis.ratio.mensch, 0) / results.length;
  
  console.log(`\n📊 DURCHSCHNITTSWERTE:`);
  console.log(`  • Durchschnittlicher Score: ${avgScore.toFixed(1)}%`);
  console.log(`  • Durchschnittlich automatisierbar: ${avgAutomatisierbar.toFixed(1)}%`);
  console.log(`  • Durchschnittlich menschlich: ${avgMensch.toFixed(1)}%`);
}

// Skript ausführen
if (require.main === module) {
  main();
}

export { analyzeJob, testJobs };
