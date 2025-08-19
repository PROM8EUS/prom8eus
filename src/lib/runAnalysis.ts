import { extractTasks as extractTasksAdvanced } from './extractTasks';

interface Task {
  text: string;
  score: number;
  label: "Automatisierbar" | "Mensch";
  category: string;
  confidence: number;
  complexity: "low" | "medium" | "high";
  automationTrend: "increasing" | "stable" | "decreasing";
}

interface AnalysisResult {
  totalScore: number;
  ratio: {
    automatisierbar: number;
    mensch: number;
  };
  tasks: Task[];
  summary: string;
  recommendations: string[];
  automationTrends: {
    highPotential: string[];
    mediumPotential: string[];
    lowPotential: string[];
  };
}

export function runAnalysis(jobText: string): AnalysisResult {
  console.log('Starting enhanced job analysis with text length:', jobText.length);
  
  // Step 1: Extract tasks using the advanced extractor
  const rawTasks = extractTasksAdvanced(jobText);
  console.log('Raw tasks extracted:', rawTasks.length, rawTasks.map(t => `${t.text} (${t.source})`));
  
  // Convert to text array for analysis
  const extractedTasks = rawTasks.map(t => t.text);
  console.log('Tasks for analysis:', extractedTasks.length);

  // Step 2: Analyze and score each task with enhanced logic
  const analyzedTasks = extractedTasks.map(taskText => analyzeTaskEnhanced(taskText));

  // Step 3: Calculate aggregated scores with complexity weighting
  const totalTasks = analyzedTasks.length;
  const automatisierbareCount = analyzedTasks.filter(t => t.label === "Automatisierbar").length;
  const menschCount = analyzedTasks.filter(t => t.label === "Mensch").length;

  // Weighted score calculation considering complexity
  const complexityWeights = { low: 1, medium: 1.2, high: 1.5 };
  const weightedScore = totalTasks > 0 
    ? analyzedTasks.reduce((sum, task) => sum + (task.score * complexityWeights[task.complexity]), 0) / 
      analyzedTasks.reduce((sum, task) => sum + complexityWeights[task.complexity], 0)
    : 0;
  
  const ratio = {
    automatisierbar: totalTasks > 0 ? Math.round((automatisierbareCount / totalTasks) * 100) : 0,
    mensch: totalTasks > 0 ? Math.round((menschCount / totalTasks) * 100) : 0
  };

  // Step 4: Generate enhanced summary and recommendations
  const summary = generateEnhancedSummary(weightedScore, ratio, totalTasks, analyzedTasks);
  const recommendations = generateEnhancedRecommendations(analyzedTasks, weightedScore);
  const automationTrends = analyzeAutomationTrends(analyzedTasks);

  return {
    totalScore: Math.round(weightedScore),
    ratio,
    tasks: analyzedTasks,
    summary,
    recommendations,
    automationTrends
  };
}

function analyzeTaskEnhanced(taskText: string): Task {
  console.log(`ENHANCED ANALYZING TASK: "${taskText}"`);
  const lowerText = taskText.toLowerCase();
  
  // Enhanced automation indicators with technology trends
  const automationSignals = {
    // High automation potential categories
    dataEntry: {
      keywords: [
        'datenerfassung', 'dateneingabe', 'eingabe', 'erfassung', 'eintragung',
        'data entry', 'input', 'entry', 'recording', 'logging'
      ],
      weight: 45,
      complexity: "low" as const,
      trend: "increasing" as const
    },
    reporting: {
      keywords: [
        'bericht', 'report', 'auswertung', 'statistik', 'kennzahlen', 'dashboard',
        'reporting', 'analytics', 'metrics', 'statistics', 'kpi'
      ],
      weight: 40,
      complexity: "medium" as const,
      trend: "increasing" as const
    },
    systemIntegration: {
      keywords: [
        'api', 'integration', 'synchronisation', 'datenübertragung', 'systemverbindung',
        'system integration', 'data transfer', 'synchronization', 'interface'
      ],
      weight: 50,
      complexity: "high" as const,
      trend: "increasing" as const
    },
    routineProcessing: {
      keywords: [
        'routine', 'standard', 'wiederkehrend', 'automatisch', 'batch', 'massenvorgang',
        'routine processing', 'standardized', 'recurring', 'automated', 'batch processing'
      ],
      weight: 35,
      complexity: "low" as const,
      trend: "increasing" as const
    },
    // Medium automation potential
    documentation: {
      keywords: [
        'dokumentation', 'protokoll', 'aufzeichnung', 'dokumentieren', 'notieren',
        'documentation', 'recording', 'logging', 'documenting', 'noting'
      ],
      weight: 30,
      complexity: "medium" as const,
      trend: "stable" as const
    },
    monitoring: {
      keywords: [
        'überwachung', 'monitoring', 'kontrolle', 'prüfung', 'inspektion',
        'monitoring', 'surveillance', 'inspection', 'checking', 'verification'
      ],
      weight: 35,
      complexity: "medium" as const,
      trend: "increasing" as const
    },
    // Traditional automation categories
    accounting: {
      keywords: [
        'buchhaltung', 'finanzbuchhaltung', 'kontierung', 'belege', 'rechnungswesen',
        'bookkeeping', 'accounting', 'posting', 'vouchers', 'invoicing'
      ],
      weight: 40,
      complexity: "medium" as const,
      trend: "increasing" as const
    },
    dataProcessing: {
      keywords: [
        'datenverarbeitung', 'auswertung', 'verarbeitung', 'transformation',
        'data processing', 'analysis', 'processing', 'transformation'
      ],
      weight: 35,
      complexity: "medium" as const,
      trend: "increasing" as const
    }
  };

  // Enhanced human-required indicators with context awareness
  const humanSignals = {
    // High human requirement categories
    creativeStrategy: {
      keywords: [
        'kreativ', 'innovation', 'strategie', 'vision', 'konzept', 'entwicklung',
        'creative', 'innovation', 'strategy', 'vision', 'concept', 'development'
      ],
      weight: 60,
      complexity: "high" as const,
      trend: "decreasing" as const
    },
    interpersonalCommunication: {
      keywords: [
        'beratung', 'kundenberatung', 'telefonische beratung', 'persönliche beratung',
        'consultation', 'customer service', 'phone consultation', 'personal advice'
      ],
      weight: 55,
      complexity: "medium" as const,
      trend: "stable" as const
    },
    emotionalIntelligence: {
      keywords: [
        'empathie', 'einfühlungsvermögen', 'emotional', 'menschlich', 'verständnis',
        'empathy', 'emotional intelligence', 'understanding', 'human', 'compassion'
      ],
      weight: 65,
      complexity: "high" as const,
      trend: "decreasing" as const
    },
    negotiationSales: {
      keywords: [
        'verkauf', 'verhandlung', 'überzeugung', 'abschluss', 'deal', 'umsatz',
        'sales', 'negotiation', 'persuasion', 'closing', 'deal', 'revenue'
      ],
      weight: 50,
      complexity: "high" as const,
      trend: "stable" as const
    },
    leadershipManagement: {
      keywords: [
        'führung', 'leitung', 'management', 'mitarbeiter', 'personalentwicklung',
        'leadership', 'management', 'supervision', 'mentoring', 'team leadership'
      ],
      weight: 45,
      complexity: "high" as const,
      trend: "stable" as const
    },
    problemSolving: {
      keywords: [
        'problemlösung', 'konflikt', 'schwierige situation', 'entscheidung', 'kritisch',
        'problem solving', 'conflict resolution', 'difficult situation', 'decision making', 'critical'
      ],
      weight: 40,
      complexity: "high" as const,
      trend: "decreasing" as const
    },
    collaboration: {
      keywords: [
        'zusammenarbeit', 'kooperation', 'teamarbeit', 'abstimmung', 'koordination',
        'collaboration', 'cooperation', 'teamwork', 'coordination', 'partnership'
      ],
      weight: 35,
      complexity: "medium" as const,
      trend: "stable" as const
    }
  };

  let automationScore = 0;
  let humanScore = 0;
  let detectedCategory = 'Allgemein';
  let complexity = "medium" as const;
  let automationTrend = "stable" as const;

  // Calculate automation score with context awareness
  Object.entries(automationSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length > 0) {
      console.log(`AUTOMATION MATCH in ${category}:`, matches);
      automationScore += signal.weight * Math.min(matches.length, 3);
      detectedCategory = category;
      complexity = signal.complexity;
      automationTrend = signal.trend;
    }
  });

  // Calculate human score with context awareness
  Object.entries(humanSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length > 0) {
      console.log(`HUMAN MATCH in ${category}:`, matches);
      humanScore += signal.weight * Math.min(matches.length, 3);
      detectedCategory = category;
      complexity = signal.complexity;
      automationTrend = signal.trend;
    }
  });

  console.log(`ENHANCED SCORES: automation=${automationScore}, human=${humanScore}, category=${detectedCategory}`);

  // Enhanced scoring algorithm with context consideration
  const baseScore = 20; // Lower base score for more conservative assessment
  const contextMultiplier = getContextMultiplier(lowerText);
  const netScore = Math.max(0, Math.min(100, (automationScore - humanScore) * contextMultiplier + baseScore));
  
  // Enhanced confidence calculation
  const totalSignalStrength = Math.max(automationScore, humanScore);
  const confidence = Math.min(95, Math.max(20, (totalSignalStrength / 30) * 60));
  
  // Improved labeling logic with context awareness
  let label: "Automatisierbar" | "Mensch";
  if (humanScore > automationScore * 1.2) {
    // Strong human signals
    label = "Mensch";
  } else if (automationScore > humanScore * 1.5 && netScore >= 60) {
    // Strong automation signals
    label = "Automatisierbar";
  } else if (automationScore >= 40 && netScore >= 50) {
    // Moderate automation signals
    label = "Automatisierbar";
  } else {
    // Conservative default
    label = "Mensch";
  }

  return {
    text: taskText,
    score: Math.round(netScore),
    label,
    category: detectedCategory,
    confidence: Math.round(confidence),
    complexity,
    automationTrend
  };
}

function getContextMultiplier(text: string): number {
  // Context-aware multiplier based on task characteristics
  if (text.includes('ai') || text.includes('machine learning') || text.includes('automatisier')) {
    return 1.3; // Higher automation potential for AI/ML tasks
  }
  if (text.includes('kreativ') || text.includes('strategie') || text.includes('innovation')) {
    return 0.7; // Lower automation potential for creative/strategic tasks
  }
  if (text.includes('routine') || text.includes('standard') || text.includes('wiederkehrend')) {
    return 1.2; // Higher automation potential for routine tasks
  }
  if (text.includes('kunde') || text.includes('beratung') || text.includes('persönlich')) {
    return 0.6; // Lower automation potential for customer-facing tasks
  }
  return 1.0; // Default multiplier
}

function generateEnhancedSummary(totalScore: number, ratio: { automatisierbar: number; mensch: number }, taskCount: number, tasks: Task[]): string {
  const scoreCategory = totalScore >= 70 ? 'hoch' : totalScore >= 50 ? 'mittel' : 'niedrig';
  const complexityBreakdown = tasks.reduce((acc, task) => {
    acc[task.complexity] = (acc[task.complexity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const trendAnalysis = tasks.filter(t => t.automationTrend === 'increasing').length;
  const trendText = trendAnalysis > taskCount * 0.5 ? 'mit steigendem Automatisierungspotenzial' : 'mit stabiler Automatisierungsentwicklung';
  
  return `Analyse von ${taskCount} identifizierten Aufgaben ergab ein ${scoreCategory}es Automatisierungspotenzial von ${totalScore}% ${trendText}. ${ratio.automatisierbar}% der Aufgaben sind potentiell automatisierbar, ${ratio.mensch}% erfordern menschliche Fähigkeiten.`;
}

function generateEnhancedRecommendations(tasks: Task[], totalScore: number): string[] {
  const recommendations: string[] = [];
  
  // Analyze task categories and trends
  const automationTasks = tasks.filter(t => t.label === "Automatisierbar");
  const highComplexityTasks = tasks.filter(t => t.complexity === "high");
  const increasingTrendTasks = tasks.filter(t => t.automationTrend === "increasing");
  
  const categories = automationTasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // High automation potential recommendations
  if (totalScore >= 70) {
    recommendations.push('Hohe Automatisierungseignung - Implementierung von RPA und Workflow-Automatisierung empfohlen');
  }
  
  if (categories['dataEntry'] >= 2) {
    recommendations.push('OCR und intelligente Datenerfassung für Dokumentenverarbeitung einsetzen');
  }
  
  if (categories['reporting'] >= 2) {
    recommendations.push('Business Intelligence Tools und automatisierte Reporting-Pipelines implementieren');
  }
  
  if (categories['systemIntegration'] >= 2) {
    recommendations.push('API-First Architektur und Microservices für Systemintegration entwickeln');
  }
  
  if (increasingTrendTasks.length >= 3) {
    recommendations.push('KI-gestützte Automatisierung für Aufgaben mit steigendem Automatisierungspotenzial prüfen');
  }
  
  // Medium automation potential
  if (totalScore >= 40 && totalScore < 70) {
    recommendations.push('Selektive Automatisierung - Fokus auf Routineaufgaben und unterstützende Prozesse');
  }
  
  if (categories['monitoring'] >= 2) {
    recommendations.push('Predictive Analytics und proaktive Monitoring-Systeme einführen');
  }
  
  // Low automation potential
  if (totalScore < 40) {
    recommendations.push('Fokus auf menschliche Stärken - Automatisierung nur für administrative Unterstützung');
  }
  
  if (highComplexityTasks.length >= 3) {
    recommendations.push('Hybrid-Ansatz: Automatisierung für Routineaufgaben, menschliche Expertise für komplexe Entscheidungen');
  }

  return recommendations.length > 0 ? recommendations : ['Individuelle Prozessanalyse für maßgeschneiderte Automatisierungsstrategie durchführen'];
}

function analyzeAutomationTrends(tasks: Task[]) {
  const highPotential = tasks.filter(t => t.automationTrend === "increasing" && t.label === "Automatisierbar").map(t => t.text);
  const mediumPotential = tasks.filter(t => t.automationTrend === "stable" && t.label === "Automatisierbar").map(t => t.text);
  const lowPotential = tasks.filter(t => t.automationTrend === "decreasing" || t.label === "Mensch").map(t => t.text);
  
  return {
    highPotential: highPotential.slice(0, 5), // Top 5
    mediumPotential: mediumPotential.slice(0, 5),
    lowPotential: lowPotential.slice(0, 5)
  };
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word)).length;
  return commonWords / Math.max(words1.length, words2.length);
}