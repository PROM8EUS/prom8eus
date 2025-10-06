import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnhancedAnalysisRequest {
  taskInput: string;
  context?: {
    industry?: string;
    systems?: string[];
    complexity?: string;
    priority?: string;
  };
}

interface EnhancedTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  complexity: 'low' | 'medium' | 'high';
  automationPotential: number;
  estimatedHours: number;
  systems: string[];
  industry: string;
  tags: string[];
  confidence: number;
}

interface EnhancedSubtask {
  id: string;
  title: string;
  description: string;
  parentTaskId: string;
  systems: string[];
  manualHoursShare: number;
  automationPotential: number;
  complexity: 'low' | 'medium' | 'high';
  risks: string[];
  assumptions: string[];
  kpis: string[];
  qualityGates: string[];
  dependencies: string[];
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  learningData?: {
    successRate: number;
    averageTime: number;
    commonIssues: string[];
    optimizationSuggestions: string[];
  };
}

interface WorkflowRecommendation {
  id: string;
  title: string;
  description: string;
  subtaskMatches: string[];
  systems: string[];
  automationLevel: 'manual' | 'semi-automated' | 'fully-automated';
  estimatedTimeSavings: number;
  estimatedCostSavings: number;
  complexity: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  steps: any[];
  learningScore: number;
  confidence: number;
}

interface AgentRecommendation {
  id: string;
  title: string;
  description: string;
  subtaskMatches: string[];
  capabilities: string[];
  deployment: 'SaaS' | 'On-Prem' | 'Hybrid';
  pricing: {
    type: 'free' | 'subscription' | 'usage' | 'one-time';
    amount?: number;
    unit?: string;
  };
  learningScore: number;
  confidence: number;
  integrationComplexity: 'easy' | 'medium' | 'hard';
}

interface EnhancedAnalysisResult {
  task: EnhancedTask;
  subtasks: EnhancedSubtask[];
  workflowRecommendations: WorkflowRecommendation[];
  agentRecommendations: AgentRecommendation[];
  summary: {
    totalAutomationPotential: number;
    estimatedTimeSavings: number;
    estimatedCostSavings: number;
    complexityBreakdown: Record<string, number>;
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
  };
  learningInsights: {
    similarTasks: string[];
    commonPatterns: string[];
    optimizationOpportunities: string[];
    successFactors: string[];
  };
}

// Enhanced Task Patterns with Learning Capabilities
const taskPatterns = {
  'data-processing': {
    keywords: [
      'daten', 'data', 'verarbeitung', 'processing', 'export', 'import', 'synchronisation',
      'migration', 'transformation', 'cleaning', 'validation', 'consolidation'
    ],
    complexityFactors: {
      dataVolume: { low: '<1GB', medium: '1-10GB', high: '>10GB' },
      dataSources: { low: '1-2', medium: '3-5', high: '>5' },
      transformationComplexity: { low: 'simple mapping', medium: 'conditional logic', high: 'complex algorithms' }
    },
    subtaskTemplates: [
      {
        id: 'data-extraction',
        title: 'Daten aus Quellsystemen extrahieren',
        baseAutomationPotential: 0.85,
        complexity: 'medium',
        systems: ['API', 'Database', 'File System', 'ETL Tools'],
        risks: ['API-Limits', 'Datenzugriff verweigert', 'Format-Inkompatibilität'],
        assumptions: ['API-Zugang verfügbar', 'Datenformate bekannt', 'Berechtigungen vorhanden']
      },
      {
        id: 'data-validation',
        title: 'Datenqualität prüfen und validieren',
        baseAutomationPotential: 0.90,
        complexity: 'medium',
        systems: ['Validation Tools', 'Quality Checks', 'Error Handling'],
        risks: ['Falsche Validierungsregeln', 'Datenverlust', 'Performance-Probleme'],
        assumptions: ['Validierungsregeln definiert', 'Referenzdaten verfügbar']
      },
      {
        id: 'data-transformation',
        title: 'Daten transformieren und bereinigen',
        baseAutomationPotential: 0.80,
        complexity: 'high',
        systems: ['ETL Tools', 'Scripting', 'Data Processing'],
        risks: ['Transformationsfehler', 'Datenverlust', 'Performance-Issues'],
        assumptions: ['Transformationslogik definiert', 'Testdaten verfügbar']
      },
      {
        id: 'data-loading',
        title: 'Daten in Zielsysteme laden',
        baseAutomationPotential: 0.95,
        complexity: 'low',
        systems: ['Database', 'API', 'File System'],
        risks: ['Lade-Fehler', 'Duplikate', 'Constraint-Violations'],
        assumptions: ['Zielsystem verfügbar', 'Schema definiert']
      }
    ]
  },
  'reporting-analytics': {
    keywords: [
      'reporting', 'analytics', 'dashboard', 'kpi', 'metrics', 'statistics',
      'visualisierung', 'auswertung', 'berichte', 'kennzahlen', 'trends'
    ],
    complexityFactors: {
      reportFrequency: { low: 'monthly', medium: 'weekly', high: 'daily' },
      dataSources: { low: '1-2', medium: '3-5', high: '>5' },
      visualizationComplexity: { low: 'simple charts', medium: 'interactive dashboards', high: 'complex analytics' }
    },
    subtaskTemplates: [
      {
        id: 'data-aggregation',
        title: 'Daten aggregieren und berechnen',
        baseAutomationPotential: 0.95,
        complexity: 'medium',
        systems: ['SQL', 'Analytics Tools', 'Data Warehouse'],
        risks: ['Falsche Berechnungen', 'Performance-Probleme', 'Dateninkonsistenz'],
        assumptions: ['Berechnungsregeln definiert', 'Datenquellen verfügbar']
      },
      {
        id: 'report-generation',
        title: 'Berichte automatisch generieren',
        baseAutomationPotential: 0.90,
        complexity: 'low',
        systems: ['Reporting Tools', 'Templates', 'Scheduling'],
        risks: ['Template-Fehler', 'Format-Probleme', 'Delivery-Fehler'],
        assumptions: ['Report-Templates erstellt', 'Delivery-Kanäle konfiguriert']
      },
      {
        id: 'dashboard-update',
        title: 'Dashboards aktualisieren',
        baseAutomationPotential: 0.85,
        complexity: 'medium',
        systems: ['BI Tools', 'Real-time Data', 'Visualization'],
        risks: ['Performance-Issues', 'Visualisierungsfehler', 'Datenverzögerung'],
        assumptions: ['Dashboard-Design final', 'Daten-Pipeline funktioniert']
      },
      {
        id: 'insight-delivery',
        title: 'Insights und Alerts versenden',
        baseAutomationPotential: 0.80,
        complexity: 'low',
        systems: ['Email', 'Slack', 'Notification System'],
        risks: ['Spam-Filter', 'Falsche Empfänger', 'Überflutung'],
        assumptions: ['Empfänger-Liste aktuell', 'Alert-Regeln definiert']
      }
    ]
  },
  'communication-coordination': {
    keywords: [
      'kommunikation', 'coordination', 'meeting', 'email', 'notification',
      'follow-up', 'scheduling', 'calendar', 'messaging', 'collaboration'
    ],
    complexityFactors: {
      participantCount: { low: '1-5', medium: '6-20', high: '>20' },
      frequency: { low: 'monthly', medium: 'weekly', high: 'daily' },
      coordinationComplexity: { low: 'simple scheduling', medium: 'multi-timezone', high: 'complex dependencies' }
    },
    subtaskTemplates: [
      {
        id: 'meeting-scheduling',
        title: 'Termine koordinieren und planen',
        baseAutomationPotential: 0.90,
        complexity: 'medium',
        systems: ['Calendar', 'Scheduling Tools', 'Email'],
        risks: ['Termin-Konflikte', 'Zeitzonen-Probleme', 'Teilnehmer-Änderungen'],
        assumptions: ['Kalender-Integration', 'Verfügbarkeiten bekannt']
      },
      {
        id: 'communication-automation',
        title: 'Kommunikation automatisieren',
        baseAutomationPotential: 0.85,
        complexity: 'low',
        systems: ['Email', 'Slack', 'Messaging', 'Templates'],
        risks: ['Spam-Filter', 'Falsche Empfänger', 'Kontext-Fehler'],
        assumptions: ['Template-Bibliothek', 'Empfänger-Listen']
      },
      {
        id: 'follow-up-tracking',
        title: 'Follow-ups verfolgen und eskalieren',
        baseAutomationPotential: 0.75,
        complexity: 'medium',
        systems: ['CRM', 'Task Management', 'Escalation System'],
        risks: ['Verlorene Follow-ups', 'Eskalationsverzögerung', 'Falsche Prioritäten'],
        assumptions: ['Follow-up-Regeln definiert', 'Eskalationsprozess klar']
      },
      {
        id: 'collaboration-facilitation',
        title: 'Kollaboration unterstützen',
        baseAutomationPotential: 0.70,
        complexity: 'medium',
        systems: ['Collaboration Tools', 'Documentation', 'Workflow'],
        risks: ['Tool-Überflutung', 'Informationsverlust', 'Prozess-Verwirrung'],
        assumptions: ['Tool-Integration', 'Prozess-Dokumentation']
      }
    ]
  },
  'process-automation': {
    keywords: [
      'prozess', 'process', 'workflow', 'automation', 'optimization',
      'efficiency', 'streamlining', 'standardization', 'rpa', 'bot'
    ],
    complexityFactors: {
      processSteps: { low: '1-5', medium: '6-15', high: '>15' },
      decisionPoints: { low: '0-2', medium: '3-8', high: '>8' },
      systemIntegrations: { low: '1-2', medium: '3-5', high: '>5' }
    },
    subtaskTemplates: [
      {
        id: 'process-mapping',
        title: 'Prozess analysieren und mappen',
        baseAutomationPotential: 0.60,
        complexity: 'high',
        systems: ['Process Mining', 'Documentation', 'Mapping Tools'],
        risks: ['Unvollständige Analyse', 'Falsche Annahmen', 'Stakeholder-Widerstand'],
        assumptions: ['Prozess-Zugang', 'Stakeholder-Buy-in', 'Dokumentation verfügbar']
      },
      {
        id: 'automation-design',
        title: 'Automatisierung konzipieren',
        baseAutomationPotential: 0.70,
        complexity: 'high',
        systems: ['Design Tools', 'Architecture', 'Planning'],
        risks: ['Über-Engineering', 'Technische Schulden', 'Skalierbarkeitsprobleme'],
        assumptions: ['Technische Expertise', 'Architektur-Richtlinien']
      },
      {
        id: 'implementation',
        title: 'Automatisierung implementieren',
        baseAutomationPotential: 0.85,
        complexity: 'medium',
        systems: ['RPA Tools', 'Workflow Engine', 'Integration Platform'],
        risks: ['Implementierungsfehler', 'Performance-Probleme', 'Stabilitätsprobleme'],
        assumptions: ['Technische Infrastruktur', 'Test-Umgebung']
      },
      {
        id: 'monitoring-optimization',
        title: 'Performance überwachen und optimieren',
        baseAutomationPotential: 0.90,
        complexity: 'medium',
        systems: ['Monitoring', 'Analytics', 'Optimization Tools'],
        risks: ['Späte Erkennung', 'Falsche Optimierungen', 'Performance-Degradation'],
        assumptions: ['Monitoring-Setup', 'Performance-Baseline', 'Optimierungsregeln']
      }
    ]
  }
};

// Enhanced Task Analysis Functions
function analyzeAndClassifyTask(taskInput: string, context?: any): EnhancedTask {
  const taskText = taskInput.toLowerCase();
  
  // Find best matching pattern
  let bestPattern = 'general';
  let bestScore = 0;
  
  Object.entries(taskPatterns).forEach(([pattern, config]) => {
    const score = config.keywords.reduce((acc, keyword) => {
      return acc + (taskText.includes(keyword) ? 1 : 0);
    }, 0);
    
    if (score > bestScore) {
      bestScore = score;
      bestPattern = pattern;
    }
  });

  // Analyze complexity factors
  const complexity = analyzeComplexity(taskText, bestPattern);
  
  // Calculate automation potential
  const automationPotential = calculateAutomationPotential(taskText, bestPattern, complexity);
  
  // Estimate hours based on complexity and pattern
  const estimatedHours = estimateHours(complexity, bestPattern);
  
  // Extract systems and industry
  const systems = extractSystems(taskText);
  const industry = detectIndustry(taskText);
  
  // Generate tags
  const tags = generateTags(taskText, bestPattern, systems, industry);
  
  // Calculate confidence based on pattern match and data quality
  const confidence = calculateConfidence(bestScore, taskInput.length, systems.length);

  return {
    id: generateTaskId(taskInput),
    title: extractTitle(taskInput),
    description: taskInput,
    category: bestPattern,
    complexity,
    automationPotential,
    estimatedHours,
    systems,
    industry,
    tags,
    confidence
  };
}

function generateSubtasks(task: EnhancedTask): EnhancedSubtask[] {
  const pattern = taskPatterns[task.category as keyof typeof taskPatterns];
  
  if (!pattern) {
    return generateFallbackSubtasks(task);
  }

  // Generate subtasks from pattern templates
  const subtasks = pattern.subtaskTemplates.map((template, index) => {
    // Customize automation potential based on task context
    const customizedAutomationPotential = customizeAutomationPotential(
      template.baseAutomationPotential,
      task.systems,
      template.systems
    );

    // Calculate time distribution
    const timeShare = calculateTimeShare(index, pattern.subtaskTemplates.length, task.complexity);

    return {
      id: `${task.id}-${template.id}`,
      title: template.title,
      description: generateSubtaskDescription(template, task),
      parentTaskId: task.id,
      systems: mergeSystems(template.systems, task.systems),
      manualHoursShare: timeShare,
      automationPotential: customizedAutomationPotential,
      complexity: template.complexity,
      risks: template.risks,
      assumptions: template.assumptions,
      kpis: generateKPIs(template, task),
      qualityGates: generateQualityGates(template, task),
      dependencies: generateDependencies(index, pattern.subtaskTemplates.length),
      estimatedTime: estimateSubtaskTime(template, task),
      priority: calculatePriority(index, task.complexity),
      learningData: getLearningData(template.id, task.category)
    };
  });

  return subtasks;
}

function findWorkflowRecommendations(subtasks: EnhancedSubtask[], task: EnhancedTask): WorkflowRecommendation[] {
  const recommendations: WorkflowRecommendation[] = [];

  // Find workflows that match subtask systems and patterns
  subtasks.forEach(subtask => {
    const matchingWorkflows = findMatchingWorkflows(subtask, task);
    recommendations.push(...matchingWorkflows);
  });

  // Remove duplicates and sort by relevance
  const uniqueRecommendations = deduplicateAndSortWorkflows(recommendations);
  
  return uniqueRecommendations.slice(0, 5); // Return top 5
}

function findAgentRecommendations(subtasks: EnhancedSubtask[], task: EnhancedTask): AgentRecommendation[] {
  const recommendations: AgentRecommendation[] = [];

  // Find agents that match subtask capabilities
  subtasks.forEach(subtask => {
    const matchingAgents = findMatchingAgents(subtask, task);
    recommendations.push(...matchingAgents);
  });

  // Remove duplicates and sort by relevance
  const uniqueRecommendations = deduplicateAndSortAgents(recommendations);
  
  return uniqueRecommendations.slice(0, 5); // Return top 5
}

function generateSummary(
  task: EnhancedTask, 
  subtasks: EnhancedSubtask[], 
  workflows: WorkflowRecommendation[], 
  agents: AgentRecommendation[]
) {
  const totalAutomationPotential = subtasks.reduce((acc, subtask) => 
    acc + (subtask.automationPotential * subtask.manualHoursShare), 0) / subtasks.reduce((acc, subtask) => acc + subtask.manualHoursShare, 0);

  const estimatedTimeSavings = task.estimatedHours * totalAutomationPotential;
  const estimatedCostSavings = estimatedTimeSavings * 60; // Assuming 60 EUR/hour

  const complexityBreakdown = {
    low: subtasks.filter(s => s.complexity === 'low').length,
    medium: subtasks.filter(s => s.complexity === 'medium').length,
    high: subtasks.filter(s => s.complexity === 'high').length
  };

  const riskLevel = calculateRiskLevel(subtasks, workflows, agents);
  const confidence = calculateOverallConfidence(task, subtasks, workflows, agents);

  return {
    totalAutomationPotential: Math.round(totalAutomationPotential * 100),
    estimatedTimeSavings: Math.round(estimatedTimeSavings * 10) / 10,
    estimatedCostSavings: Math.round(estimatedCostSavings),
    complexityBreakdown,
    riskLevel,
    confidence
  };
}

function generateLearningInsights(task: EnhancedTask, subtasks: EnhancedSubtask[]) {
  // Generate insights based on learning database
  const similarTasks = findSimilarTasks(task);
  const commonPatterns = identifyCommonPatterns(subtasks);
  const optimizationOpportunities = identifyOptimizationOpportunities(task, subtasks);
  const successFactors = identifySuccessFactors(task, subtasks);

  return {
    similarTasks,
    commonPatterns,
    optimizationOpportunities,
    successFactors
  };
}

// Helper functions
function analyzeComplexity(taskText: string, pattern: string): 'low' | 'medium' | 'high' {
  const complexityIndicators = {
    low: ['simple', 'basic', 'routine', 'standard', 'einfach', 'grundlegend', 'routine'],
    medium: ['moderate', 'intermediate', 'complex', 'advanced', 'mittel', 'fortgeschritten'],
    high: ['complex', 'advanced', 'sophisticated', 'expert', 'komplex', 'experte', 'spezialisiert']
  };

  let complexityScore = { low: 0, medium: 0, high: 0 };

  Object.entries(complexityIndicators).forEach(([level, indicators]) => {
    indicators.forEach(indicator => {
      if (taskText.includes(indicator)) {
        complexityScore[level as keyof typeof complexityScore]++;
      }
    });
  });

  if (complexityScore.high > 0) return 'high';
  if (complexityScore.medium > 0) return 'medium';
  return 'low';
}

function calculateAutomationPotential(taskText: string, pattern: string, complexity: string): number {
  let basePotential = 0.7; // Default automation potential

  // Adjust based on pattern
  const patternPotentials = {
    'data-processing': 0.85,
    'reporting-analytics': 0.80,
    'communication-coordination': 0.75,
    'process-automation': 0.90
  };
  basePotential = patternPotentials[pattern as keyof typeof patternPotentials] || basePotential;

  // Adjust based on complexity
  const complexityMultipliers = { low: 1.1, medium: 1.0, high: 0.9 };
  basePotential *= complexityMultipliers[complexity];

  // Adjust based on automation keywords
  const automationKeywords = ['automatisch', 'automatic', 'workflow', 'api', 'integration', 'sync'];
  const automationMatches = automationKeywords.filter(keyword => taskText.includes(keyword)).length;
  basePotential += automationMatches * 0.05;

  return Math.min(0.95, Math.max(0.2, basePotential));
}

function estimateHours(complexity: string, pattern: string): number {
  const baseHours = { low: 4, medium: 8, high: 16 };
  const patternMultipliers = {
    'data-processing': 1.2,
    'reporting-analytics': 1.0,
    'communication-coordination': 0.8,
    'process-automation': 1.5
  };

  return Math.round(baseHours[complexity as keyof typeof baseHours] * 
    (patternMultipliers[pattern as keyof typeof patternMultipliers] || 1.0));
}

function extractSystems(taskText: string): string[] {
  const systemKeywords = [
    'api', 'database', 'excel', 'sheets', 'crm', 'erp', 'slack', 'email', 'calendar',
    'power bi', 'tableau', 'python', 'r', 'sql', 'etl', 'rpa', 'workflow'
  ];

  return systemKeywords.filter(keyword => taskText.includes(keyword));
}

function detectIndustry(taskText: string): string {
  const industryPatterns = {
    'finance': ['finance', 'accounting', 'buchhaltung', 'rechnung', 'zahlung'],
    'marketing': ['marketing', 'campaign', 'werbung', 'social media'],
    'sales': ['sales', 'vertrieb', 'akquise', 'pipeline'],
    'hr': ['hr', 'recruitment', 'recruiting', 'einstellung'],
    'operations': ['operations', 'prozess', 'workflow', 'efficiency']
  };

  for (const [industry, keywords] of Object.entries(industryPatterns)) {
    if (keywords.some(keyword => taskText.includes(keyword))) {
      return industry;
    }
  }

  return 'general';
}

function generateTags(taskText: string, pattern: string, systems: string[], industry: string): string[] {
  const tags = [pattern, industry, ...systems];
  
  // Add complexity and automation tags
  if (taskText.includes('automatisch') || taskText.includes('automatic')) {
    tags.push('automation');
  }
  if (taskText.includes('workflow') || taskText.includes('prozess')) {
    tags.push('workflow');
  }
  if (taskText.includes('api') || taskText.includes('integration')) {
    tags.push('integration');
  }

  return [...new Set(tags)].slice(0, 10); // Remove duplicates and limit
}

function calculateConfidence(patternScore: number, inputLength: number, systemsCount: number): number {
  let confidence = 50; // Base confidence

  // Adjust based on pattern match
  confidence += patternScore * 10;

  // Adjust based on input quality
  if (inputLength > 100) confidence += 20;
  if (inputLength > 500) confidence += 10;

  // Adjust based on system identification
  confidence += systemsCount * 5;

  return Math.min(100, Math.max(0, confidence));
}

function generateTaskId(taskInput: string): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function extractTitle(taskInput: string): string {
  // Extract first sentence or first 50 characters as title
  const firstSentence = taskInput.split(/[.!?]/)[0];
  return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence;
}

function generateFallbackSubtasks(task: EnhancedTask): EnhancedSubtask[] {
  // Generate specific subtasks based on task category and content
  const taskTitle = task.title.toLowerCase();
  const taskDescription = task.description.toLowerCase();
  
  // Category-specific subtask patterns
  const categoryPatterns = {
    'finanzen': [
      {
        title: 'Budgetvorgaben definieren und Kostenstellen strukturieren',
        description: 'Festlegung von Budgetrichtlinien und Aufbau der Kostenstellenstruktur',
        systems: ['ERP-Systeme', 'Budget-Tools', 'Finanzplanung'],
        automationPotential: 0.7,
        manualHoursShare: 0.25
      },
      {
        title: 'Monatliche Ist-Kosten erfassen und Soll-Ist-Abweichungen analysieren',
        description: 'Datenerfassung und Abweichungsanalyse für Budgetkontrolle',
        systems: ['Buchhaltungssysteme', 'Analytics-Tools', 'Reporting'],
        automationPotential: 0.8,
        manualHoursShare: 0.4
      },
      {
        title: 'Budget-Reporting erstellen und Stakeholder informieren',
        description: 'Erstellung von Berichten und Kommunikation mit Verantwortlichen',
        systems: ['Reporting-Tools', 'Dashboard-Systeme', 'Kommunikation'],
        automationPotential: 0.6,
        manualHoursShare: 0.35
      }
    ],
    'marketing': [
      {
        title: 'Marktanalyse durchführen und Zielgruppen identifizieren',
        description: 'Recherche und Analyse von Marktdaten und Zielgruppen',
        systems: ['Analytics-Tools', 'CRM-Systeme', 'Marktforschung'],
        automationPotential: 0.7,
        manualHoursShare: 0.3
      },
      {
        title: 'Kampagnenstrategie entwickeln und Kanäle auswählen',
        description: 'Strategische Planung und Kanalauswahl für Marketingkampagnen',
        systems: ['Marketing-Tools', 'Planungssoftware', 'Kreativ-Tools'],
        automationPotential: 0.5,
        manualHoursShare: 0.35
      },
      {
        title: 'Kampagnenausführung überwachen und Performance messen',
        description: 'Monitoring und Performance-Analyse der Marketingaktivitäten',
        systems: ['Analytics-Dashboards', 'Tracking-Tools', 'Reporting'],
        automationPotential: 0.8,
        manualHoursShare: 0.35
      }
    ],
    'hr': [
      {
        title: 'Stellenausschreibungen erstellen und Kanäle bespielen',
        description: 'Entwicklung von Job-Postings und Verteilung auf Recruiting-Kanäle',
        systems: ['ATS-Systeme', 'Job-Portale', 'Social Media'],
        automationPotential: 0.6,
        manualHoursShare: 0.3
      },
      {
        title: 'Bewerbungen sichten und Kandidaten vorauswählen',
        description: 'Erstbewertung von Bewerbungen und Vorauswahl geeigneter Kandidaten',
        systems: ['ATS-Systeme', 'AI-Screening', 'Bewertungstools'],
        automationPotential: 0.7,
        manualHoursShare: 0.4
      },
      {
        title: 'Interviews führen und Entscheidungen treffen',
        description: 'Durchführung von Vorstellungsgesprächen und finale Kandidatenauswahl',
        systems: ['Interview-Tools', 'Bewertungssysteme', 'Kommunikation'],
        automationPotential: 0.3,
        manualHoursShare: 0.3
      }
    ],
    'vertrieb': [
      {
        title: 'Lead-Generierung und Qualifizierung durchführen',
        description: 'Gewinnung und Erstqualifizierung von Verkaufschancen',
        systems: ['CRM-Systeme', 'Marketing-Automation', 'Lead-Scoring'],
        automationPotential: 0.7,
        manualHoursShare: 0.3
      },
      {
        title: 'Kundenberatung und Angebotserstellung',
        description: 'Beratungsgespräche führen und maßgeschneiderte Angebote erstellen',
        systems: ['CRM-Systeme', 'CPQ-Tools', 'Kommunikation'],
        automationPotential: 0.5,
        manualHoursShare: 0.4
      },
      {
        title: 'Vertragsverhandlung und Abschlussabwicklung',
        description: 'Verhandlungen führen und Vertragsabschlüsse abwickeln',
        systems: ['Vertragsmanagement', 'E-Signature', 'CRM-Systeme'],
        automationPotential: 0.6,
        manualHoursShare: 0.3
      }
    ]
  };

  // Determine category based on task content
  let selectedPattern = null;
  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (taskTitle.includes(category) || taskDescription.includes(category) || 
        task.category?.toLowerCase().includes(category)) {
      selectedPattern = pattern;
      break;
    }
  }

  // Use specific pattern or create generic but more specific subtasks
  const subtaskTemplates = selectedPattern || [
    {
      title: 'Anforderungsanalyse und Zieldefinition',
      description: 'Analyse der Anforderungen und Definition klarer Ziele',
      systems: ['Analytics-Tools', 'Dokumentation', 'Planungstools'],
      automationPotential: 0.6,
      manualHoursShare: 0.25
    },
    {
      title: 'Prozessdesign und Workflow-Entwicklung',
      description: 'Entwicklung von Prozessen und Arbeitsabläufen',
      systems: ['Workflow-Tools', 'Prozessmanagement', 'Design-Tools'],
      automationPotential: 0.7,
      manualHoursShare: 0.4
    },
    {
      title: 'Implementierung und Qualitätssicherung',
      description: 'Umsetzung der Lösung und Sicherstellung der Qualität',
      systems: ['Implementierungs-Tools', 'Testing-Systeme', 'Monitoring'],
      automationPotential: 0.8,
      manualHoursShare: 0.35
    }
  ];

  return subtaskTemplates.map((template, index) => ({
    id: `${task.id}-${index + 1}`,
    title: template.title,
    description: template.description,
    parentTaskId: task.id,
    systems: template.systems,
    manualHoursShare: template.manualHoursShare,
    automationPotential: template.automationPotential,
    complexity: task.complexity || 'medium',
    risks: ['Qualitätsrisiken', 'Zeitverzögerungen'],
    assumptions: ['Verfügbare Ressourcen', 'Klare Anforderungen'],
    kpis: ['Qualitätskriterien', 'Zeitplan-Einhaltung'],
    qualityGates: ['Qualitätsprüfung', 'Freigabe'],
    dependencies: index > 0 ? [`${task.id}-${index}`] : [],
    estimatedTime: Math.round(template.manualHoursShare * 400), // Base 400h per task
    priority: index === 0 ? 'high' : index === subtaskTemplates.length - 1 ? 'medium' : 'critical'
  }));
}

function customizeAutomationPotential(basePotential: number, taskSystems: string[], templateSystems: string[]): number {
  let potential = basePotential;

  // Increase potential if task systems match template systems
  const systemOverlap = taskSystems.filter(system => templateSystems.includes(system)).length;
  potential += systemOverlap * 0.05;

  return Math.min(0.95, Math.max(0.2, potential));
}

function calculateTimeShare(index: number, totalSubtasks: number, complexity: string): number {
  // Distribute time based on complexity and position
  const complexityMultipliers = { low: 0.8, medium: 1.0, high: 1.3 };
  const baseShare = 1 / totalSubtasks;
  
  return baseShare * complexityMultipliers[complexity as keyof typeof complexityMultipliers];
}

function generateSubtaskDescription(template: any, task: EnhancedTask): string {
  return `${template.title} für ${task.title}`;
}

function mergeSystems(templateSystems: string[], taskSystems: string[]): string[] {
  return [...new Set([...templateSystems, ...taskSystems])];
}

function generateKPIs(template: any, task: EnhancedTask): string[] {
  return [
    'Zeitplan-Einhaltung',
    'Qualitätsstandards',
    'Automatisierungsgrad',
    'Fehlerrate'
  ];
}

function generateQualityGates(template: any, task: EnhancedTask): string[] {
  return [
    'Ergebnis validiert',
    'Qualitätskriterien erfüllt',
    'Dokumentation erstellt'
  ];
}

function generateDependencies(index: number, totalSubtasks: number): string[] {
  if (index === 0) return [];
  return [`subtask-${index - 1}`];
}

function estimateSubtaskTime(template: any, task: EnhancedTask): number {
  const baseTime = { low: 30, medium: 60, high: 120 };
  return baseTime[template.complexity as keyof typeof baseTime];
}

function calculatePriority(index: number, complexity: string): 'low' | 'medium' | 'high' | 'critical' {
  if (index === 0) return 'critical';
  if (complexity === 'high') return 'high';
  return 'medium';
}

function getLearningData(templateId: string, category: string): any {
  // This would retrieve historical data from the learning database
  return {
    successRate: 0.85,
    averageTime: 45,
    commonIssues: ['API-Limits', 'Datenqualität'],
    optimizationSuggestions: ['Caching implementieren', 'Batch-Processing verwenden']
  };
}

function findMatchingWorkflows(subtask: EnhancedSubtask, task: EnhancedTask): WorkflowRecommendation[] {
  // Mock implementation - would integrate with real workflow system
  return [
    {
      id: `workflow-${subtask.id}`,
      title: `Workflow für ${subtask.title}`,
      description: `Automatisierter Workflow für ${subtask.title}`,
      subtaskMatches: [subtask.id],
      systems: subtask.systems,
      automationLevel: 'fully-automated',
      estimatedTimeSavings: subtask.estimatedTime / 60 * subtask.automationPotential,
      estimatedCostSavings: subtask.estimatedTime / 60 * subtask.automationPotential * 60,
      complexity: 'medium',
      prerequisites: ['API-Zugang', 'System-Integration'],
      steps: [],
      learningScore: 85,
      confidence: 80
    }
  ];
}

function findMatchingAgents(subtask: EnhancedSubtask, task: EnhancedTask): AgentRecommendation[] {
  // Mock implementation - would integrate with real agent system
  return [
    {
      id: `agent-${subtask.id}`,
      title: `AI Agent für ${subtask.title}`,
      description: `Intelligenter Agent für ${subtask.title}`,
      subtaskMatches: [subtask.id],
      capabilities: ['data-processing', 'automation', 'integration'],
      deployment: 'SaaS',
      pricing: { type: 'subscription', amount: 50, unit: 'monthly' },
      learningScore: 90,
      confidence: 85,
      integrationComplexity: 'medium'
    }
  ];
}

function deduplicateAndSortWorkflows(workflows: WorkflowRecommendation[]): WorkflowRecommendation[] {
  const unique = new Map<string, WorkflowRecommendation>();
  workflows.forEach(workflow => {
    if (!unique.has(workflow.id)) {
      unique.set(workflow.id, workflow);
    }
  });
  
  return Array.from(unique.values()).sort((a, b) => b.learningScore - a.learningScore);
}

function deduplicateAndSortAgents(agents: AgentRecommendation[]): AgentRecommendation[] {
  const unique = new Map<string, AgentRecommendation>();
  agents.forEach(agent => {
    if (!unique.has(agent.id)) {
      unique.set(agent.id, agent);
    }
  });
  
  return Array.from(unique.values()).sort((a, b) => b.learningScore - a.learningScore);
}

function calculateRiskLevel(subtasks: EnhancedSubtask[], workflows: WorkflowRecommendation[], agents: AgentRecommendation[]): 'low' | 'medium' | 'high' {
  const highRiskSubtasks = subtasks.filter(s => s.complexity === 'high').length;
  const totalSubtasks = subtasks.length;
  
  if (highRiskSubtasks / totalSubtasks > 0.5) return 'high';
  if (highRiskSubtasks / totalSubtasks > 0.2) return 'medium';
  return 'low';
}

function calculateOverallConfidence(task: EnhancedTask, subtasks: EnhancedSubtask[], workflows: WorkflowRecommendation[], agents: AgentRecommendation[]): number {
  const taskConfidence = task.confidence;
  const subtaskConfidence = subtasks.reduce((acc, s) => acc + (s.learningData?.successRate || 0.8) * 100, 0) / subtasks.length;
  const workflowConfidence = workflows.reduce((acc, w) => acc + w.confidence, 0) / Math.max(workflows.length, 1);
  const agentConfidence = agents.reduce((acc, a) => acc + a.confidence, 0) / Math.max(agents.length, 1);
  
  return Math.round((taskConfidence + subtaskConfidence + workflowConfidence + agentConfidence) / 4);
}

function findSimilarTasks(task: EnhancedTask): string[] {
  // Mock implementation - would search learning database
  return [`Similar task 1 (${task.category})`, `Similar task 2 (${task.industry})`];
}

function identifyCommonPatterns(subtasks: EnhancedSubtask[]): string[] {
  // Mock implementation - would analyze learning database
  return ['Data extraction pattern', 'Automation workflow pattern'];
}

function identifyOptimizationOpportunities(task: EnhancedTask, subtasks: EnhancedSubtask[]): string[] {
  // Mock implementation - would analyze learning database
  return ['Batch processing', 'Parallel execution', 'Caching strategy'];
}

function identifySuccessFactors(task: EnhancedTask, subtasks: EnhancedSubtask[]): string[] {
  // Mock implementation - would analyze learning database
  return ['Clear requirements', 'Proper testing', 'Stakeholder involvement'];
}

// Main analysis function
async function analyzeTask(taskInput: string, context?: any): Promise<EnhancedAnalysisResult> {
  console.log('🔍 Starting Enhanced Task Analysis:', { taskInput, context });

  // Step 1: Analyze and classify the task
  const enhancedTask = analyzeAndClassifyTask(taskInput, context);

  // Step 2: Generate intelligent subtasks
  const subtasks = generateSubtasks(enhancedTask);

  // Step 3: Find matching workflows
  const workflowRecommendations = findWorkflowRecommendations(subtasks, enhancedTask);

  // Step 4: Find matching agents
  const agentRecommendations = findAgentRecommendations(subtasks, enhancedTask);

  // Step 5: Generate summary and insights
  const summary = generateSummary(enhancedTask, subtasks, workflowRecommendations, agentRecommendations);
  const learningInsights = generateLearningInsights(enhancedTask, subtasks);

  return {
    task: enhancedTask,
    subtasks,
    workflowRecommendations,
    agentRecommendations,
    summary,
    learningInsights
  };
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskInput, context }: EnhancedAnalysisRequest = await req.json();
    
    console.log('Starting enhanced analysis for:', { taskInput: taskInput?.substring(0, 100), context });

    if (!taskInput || taskInput.trim().length < 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Zu wenig Inhalt gefunden. Bitte fügen Sie mindestens 10 Zeichen ein." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Run enhanced analysis
    const result = await analyzeTask(taskInput, context);
    
    console.log('Enhanced analysis completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in enhanced-analysis:', error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut." 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
