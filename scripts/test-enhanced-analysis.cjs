#!/usr/bin/env node

// Enhanced Test-Job-Beschreibungen mit modernen Technologien
const testJobs = [
  {
    title: "AI/ML Engineer",
    content: `AI/ML Engineer

RESPONSIBILITIES:
• Develop machine learning models and algorithms
• Automate data processing pipelines
• Create AI-powered automation solutions
• Implement natural language processing systems
• Build predictive analytics models
• Deploy machine learning models to production
• Monitor and optimize AI system performance
• Collaborate with data scientists and engineers

QUALIFICATIONS:
• Master's degree in Computer Science or related field
• Experience with Python, TensorFlow, PyTorch
• Knowledge of cloud platforms (AWS, Azure, GCP)
• Strong understanding of machine learning algorithms
• Experience with MLOps and model deployment`
  },
  {
    title: "RPA Developer",
    content: `RPA Developer

RESPONSIBILITIES:
• Design and implement robotic process automation solutions
• Automate routine data entry and processing tasks
• Create workflow automation scripts
• Integrate RPA with existing business systems
• Monitor and maintain automation processes
• Document automation procedures and workflows
• Train end users on automated processes
• Optimize automation performance and efficiency

QUALIFICATIONS:
• Bachelor's degree in Computer Science or Information Technology
• Experience with RPA tools (UiPath, Automation Anywhere, Blue Prism)
• Knowledge of programming languages (Python, C#, JavaScript)
• Understanding of business process optimization
• Experience with API integration and system connectivity`
  },
  {
    title: "Digital Transformation Consultant",
    content: `Digital Transformation Consultant

RESPONSIBILITIES:
• Develop digital transformation strategies for clients
• Analyze current business processes and identify automation opportunities
• Create innovative solutions using emerging technologies
• Lead change management initiatives
• Collaborate with stakeholders across all levels
• Present strategic recommendations to executive leadership
• Manage digital transformation projects
• Drive cultural change towards digital adoption

QUALIFICATIONS:
• MBA or advanced degree in Business Administration
• 5+ years of consulting experience in digital transformation
• Strong analytical and strategic thinking skills
• Excellent communication and presentation abilities
• Experience with change management methodologies`
  },
  {
    title: "Customer Success Manager",
    content: `Customer Success Manager

RESPONSIBILITIES:
• Build and maintain strong customer relationships
• Provide personalized customer consultation and support
• Conduct product demonstrations and training sessions
• Handle customer inquiries and resolve complex issues
• Develop customer success strategies and best practices
• Monitor customer satisfaction and engagement metrics
• Collaborate with sales and product teams
• Create customer success stories and case studies

QUALIFICATIONS:
• Bachelor's degree in Business, Marketing, or related field
• 3+ years of customer success or account management experience
• Excellent interpersonal and communication skills
• Strong problem-solving and analytical abilities
• Experience with CRM systems and customer analytics tools`
  },
  {
    title: "Creative Director",
    content: `Creative Director

RESPONSIBILITIES:
• Lead creative vision and strategy for brand campaigns
• Develop innovative design concepts and creative solutions
• Manage creative team and oversee project execution
• Collaborate with clients to understand creative requirements
• Present creative concepts and strategies to stakeholders
• Stay current with design trends and creative technologies
• Mentor junior designers and creative professionals
• Ensure brand consistency across all creative deliverables

QUALIFICATIONS:
• Bachelor's degree in Design, Fine Arts, or related field
• 8+ years of experience in creative design and leadership
• Strong portfolio demonstrating creative excellence
• Excellent leadership and team management skills
• Proficiency in design software and creative tools`
  }
];

// Enhanced analysis function with complexity and trend analysis
function analyzeJobEnhanced(jobTitle, jobContent) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`ENHANCED ANALYSE: ${jobTitle}`);
  console.log(`${'='.repeat(80)}`);
  
  // Schritt 1: Aufgaben extrahieren
  console.log('\n📋 SCHRITT 1: AUFGABEN EXTRAHIEREN');
  console.log('-'.repeat(50));
  
  const lines = jobContent.split('\n');
  const responsibilities = [];
  let inResponsibilities = false;
  
  for (const line of lines) {
    if (line.includes('RESPONSIBILITIES:')) {
      inResponsibilities = true;
      continue;
    }
    if (line.includes('QUALIFICATIONS:')) {
      inResponsibilities = false;
      continue;
    }
    if (inResponsibilities && line.trim().startsWith('•')) {
      const task = line.trim().substring(1).trim();
      if (task.length > 10) {
        responsibilities.push(task);
      }
    }
  }
  
  console.log(`Gefundene Aufgaben: ${responsibilities.length}`);
  responsibilities.forEach((task, index) => {
    console.log(`${index + 1}. [bullet] ${task}`);
  });
  
  // Schritt 2: Erweiterte Automatisierungs-Analyse
  console.log('\n🔍 SCHRITT 2: ERWEITERTE AUTOMATISIERUNGS-ANALYSE');
  console.log('-'.repeat(50));
  
  // Erweiterte Keyword-Kategorien mit Komplexität und Trends
  const automationCategories = {
    dataEntry: {
      keywords: ['data entry', 'input', 'entry', 'recording', 'logging', 'datenerfassung', 'eingabe'],
      weight: 45,
      complexity: 'low',
      trend: 'increasing'
    },
    reporting: {
      keywords: ['report', 'analytics', 'metrics', 'dashboard', 'kennzahlen', 'auswertung'],
      weight: 40,
      complexity: 'medium',
      trend: 'increasing'
    },
    systemIntegration: {
      keywords: ['api', 'integration', 'synchronization', 'system', 'integration', 'datenübertragung'],
      weight: 50,
      complexity: 'high',
      trend: 'increasing'
    },
    aiMl: {
      keywords: ['ai', 'machine learning', 'ml', 'artificial intelligence', 'neural network', 'algorithm'],
      weight: 60,
      complexity: 'high',
      trend: 'increasing'
    },
    automation: {
      keywords: ['automate', 'automation', 'rpa', 'robotic', 'automatisier', 'automatisch'],
      weight: 55,
      complexity: 'medium',
      trend: 'increasing'
    },
    routineProcessing: {
      keywords: ['routine', 'standard', 'recurring', 'batch', 'wiederkehrend', 'standardisiert'],
      weight: 35,
      complexity: 'low',
      trend: 'increasing'
    }
  };
  
  const humanCategories = {
    creativeStrategy: {
      keywords: ['creative', 'innovation', 'strategy', 'vision', 'concept', 'kreativ', 'strategie'],
      weight: 60,
      complexity: 'high',
      trend: 'decreasing'
    },
    interpersonalCommunication: {
      keywords: ['consultation', 'customer service', 'phone', 'personal', 'beratung', 'kunde'],
      weight: 55,
      complexity: 'medium',
      trend: 'stable'
    },
    emotionalIntelligence: {
      keywords: ['empathy', 'emotional', 'human', 'understanding', 'empathie', 'menschlich'],
      weight: 65,
      complexity: 'high',
      trend: 'decreasing'
    },
    leadershipManagement: {
      keywords: ['lead', 'manage', 'leadership', 'supervision', 'führung', 'leitung'],
      weight: 45,
      complexity: 'high',
      trend: 'stable'
    },
    problemSolving: {
      keywords: ['problem solving', 'conflict', 'decision making', 'problemlösung', 'entscheidung'],
      weight: 40,
      complexity: 'high',
      trend: 'decreasing'
    }
  };
  
  const analyzedTasks = responsibilities.map(task => {
    const lowerTask = task.toLowerCase();
    let automationScore = 0;
    let humanScore = 0;
    let detectedCategory = 'Allgemein';
    let complexity = 'medium';
    let automationTrend = 'stable';
    
    // Automation scoring
    Object.entries(automationCategories).forEach(([category, config]) => {
      config.keywords.forEach(keyword => {
        if (lowerTask.includes(keyword)) {
          automationScore += config.weight;
          detectedCategory = category;
          complexity = config.complexity;
          automationTrend = config.trend;
        }
      });
    });
    
    // Human scoring
    Object.entries(humanCategories).forEach(([category, config]) => {
      config.keywords.forEach(keyword => {
        if (lowerTask.includes(keyword)) {
          humanScore += config.weight;
          detectedCategory = category;
          complexity = config.complexity;
          automationTrend = config.trend;
        }
      });
    });
    
    // Context multiplier
    let contextMultiplier = 1.0;
    if (lowerTask.includes('ai') || lowerTask.includes('machine learning') || lowerTask.includes('automatisier')) {
      contextMultiplier = 1.3;
    } else if (lowerTask.includes('kreativ') || lowerTask.includes('strategie') || lowerTask.includes('innovation')) {
      contextMultiplier = 0.7;
    } else if (lowerTask.includes('kunde') || lowerTask.includes('beratung') || lowerTask.includes('persönlich')) {
      contextMultiplier = 0.6;
    }
    
    const baseScore = 20;
    const finalScore = Math.max(0, Math.min(100, (automationScore - humanScore) * contextMultiplier + baseScore));
    const label = humanScore > automationScore * 1.2 ? 'Mensch' : 'Automatisierbar';
    const confidence = Math.min(95, Math.max(20, Math.abs(automationScore - humanScore) * 2));
    
    return {
      text: task,
      score: Math.round(finalScore),
      label,
      category: detectedCategory,
      confidence: Math.round(confidence),
      complexity,
      automationTrend
    };
  });
  
  const totalScore = analyzedTasks.reduce((sum, task) => sum + task.score, 0) / analyzedTasks.length;
  const automatisierbarCount = analyzedTasks.filter(t => t.label === 'Automatisierbar').length;
  const menschCount = analyzedTasks.filter(t => t.label === 'Mensch').length;
  
  console.log(`\n📊 ERWEITERTES GESAMTERGEBNIS:`);
  console.log(`   Gesamtscore: ${Math.round(totalScore)}%`);
  console.log(`   Verhältnis: ${Math.round((automatisierbarCount / analyzedTasks.length) * 100)}% automatisierbar, ${Math.round((menschCount / analyzedTasks.length) * 100)}% menschlich`);
  console.log(`   Aufgaben analysiert: ${analyzedTasks.length}`);
  
  // Schritt 3: Detaillierte Aufgaben-Analyse mit neuen Features
  console.log('\n🎯 SCHRITT 3: DETAILLIERTE AUFGABEN-ANALYSE (ERWEITERT)');
  console.log('-'.repeat(50));
  
  analyzedTasks.forEach((task, index) => {
    const icon = task.label === 'Automatisierbar' ? '🤖' : '👤';
    const scoreColor = task.score >= 70 ? '🟢' : task.score >= 40 ? '🟡' : '🔴';
    const complexityIcon = task.complexity === 'low' ? '🟢' : task.complexity === 'medium' ? '🟡' : '🔴';
    const trendIcon = task.automationTrend === 'increasing' ? '📈' : task.automationTrend === 'decreasing' ? '📉' : '➡️';
    
    console.log(`\n${index + 1}. ${icon} ${task.text}`);
    console.log(`   Score: ${scoreColor} ${task.score}%`);
    console.log(`   Kategorie: ${task.category}`);
    console.log(`   Komplexität: ${complexityIcon} ${task.complexity}`);
    console.log(`   Trend: ${trendIcon} ${task.automationTrend}`);
    console.log(`   Confidence: ${task.confidence}%`);
    console.log(`   Label: ${task.label}`);
  });
  
  // Schritt 4: Automatisierungstrends
  console.log('\n📈 SCHRITT 4: AUTOMATISIERUNGSTRENDS');
  console.log('-'.repeat(50));
  
  const highPotential = analyzedTasks.filter(t => t.automationTrend === 'increasing' && t.label === 'Automatisierbar').map(t => t.text);
  const mediumPotential = analyzedTasks.filter(t => t.automationTrend === 'stable' && t.label === 'Automatisierbar').map(t => t.text);
  const lowPotential = analyzedTasks.filter(t => t.automationTrend === 'decreasing' || t.label === 'Mensch').map(t => t.text);
  
  console.log(`\n🚀 Hohes Automatisierungspotenzial (${highPotential.length}):`);
  highPotential.forEach((task, index) => {
    console.log(`   ${index + 1}. ${task}`);
  });
  
  console.log(`\n⏳ Mittleres Potenzial (${mediumPotential.length}):`);
  mediumPotential.forEach((task, index) => {
    console.log(`   ${index + 1}. ${task}`);
  });
  
  console.log(`\n🛡️ Niedriges Potenzial (${lowPotential.length}):`);
  lowPotential.forEach((task, index) => {
    console.log(`   ${index + 1}. ${task}`);
  });
  
  return {
    jobTitle,
    rawTasks: responsibilities,
    analysis: {
      totalScore: Math.round(totalScore),
      ratio: {
        automatisierbar: Math.round((automatisierbarCount / analyzedTasks.length) * 100),
        mensch: Math.round((menschCount / analyzedTasks.length) * 100)
      },
      tasks: analyzedTasks,
      automationTrends: {
        highPotential: highPotential.slice(0, 5),
        mediumPotential: mediumPotential.slice(0, 5),
        lowPotential: lowPotential.slice(0, 5)
      }
    }
  };
}

// Hauptfunktion
function main() {
  console.log('🚀 ERWEITERTE JOB-ANALYSE TEST STARTET');
  console.log('Verbesserte Analyse mit Komplexität, Trends und Kontext-Bewusstsein\n');
  
  const results = testJobs.map(job => analyzeJobEnhanced(job.title, job.content));
  
  // Erweiterte Zusammenfassung
  console.log(`\n${'='.repeat(80)}`);
  console.log('📈 ERWEITERTE ZUSAMMENFASSUNG ALLER ANALYSEN');
  console.log(`${'='.repeat(80)}`);
  
  results.forEach(result => {
    const { jobTitle, analysis } = result;
    console.log(`\n${jobTitle}:`);
    console.log(`  • Score: ${analysis.totalScore}%`);
    console.log(`  • Automatisierbar: ${analysis.ratio.automatisierbar}%`);
    console.log(`  • Menschlich: ${analysis.ratio.mensch}%`);
    console.log(`  • Aufgaben: ${analysis.tasks.length}`);
    console.log(`  • Hohes Potenzial: ${analysis.automationTrends.highPotential.length}`);
    console.log(`  • Mittleres Potenzial: ${analysis.automationTrends.mediumPotential.length}`);
    console.log(`  • Niedriges Potenzial: ${analysis.automationTrends.lowPotential.length}`);
  });
  
  // Durchschnittswerte
  const avgScore = results.reduce((sum, r) => sum + r.analysis.totalScore, 0) / results.length;
  const avgAutomatisierbar = results.reduce((sum, r) => sum + r.analysis.ratio.automatisierbar, 0) / results.length;
  const avgMensch = results.reduce((sum, r) => sum + r.analysis.ratio.mensch, 0) / results.length;
  
  console.log(`\n📊 DURCHSCHNITTSWERTE:`);
  console.log(`  • Durchschnittlicher Score: ${avgScore.toFixed(1)}%`);
  console.log(`  • Durchschnittlich automatisierbar: ${avgAutomatisierbar.toFixed(1)}%`);
  console.log(`  • Durchschnittlich menschlich: ${avgMensch.toFixed(1)}%`);
  
  console.log(`\n🔍 VERBESSERUNGEN DER ANALYSE-ENGINE:`);
  console.log(`  ✅ Feinere Keyword-Kategorien mit Komplexitätsbewertung`);
  console.log(`  ✅ Kontext-basierte Multiplikatoren für präzisere Bewertung`);
  console.log(`  ✅ Automatisierungstrends (steigend/stabil/fallend)`);
  console.log(`  ✅ Technologie-Trends (AI/ML, RPA, etc.) berücksichtigt`);
  console.log(`  ✅ Gewichtung nach Aufgabenkomplexität`);
  console.log(`  ✅ Verbesserte Confidence-Berechnung`);
  console.log(`  ✅ Konservativere Standardbewertung für menschliche Aufgaben`);
}

// Skript ausführen
if (require.main === module) {
  main();
}

module.exports = { analyzeJobEnhanced, testJobs };

