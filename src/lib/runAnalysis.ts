import { getToolsByIndustry } from './catalog/aiTools';
import { FastAnalysisResult } from './types';
import { openaiClient, isOpenAIAvailable } from './openai';

export interface Task {
  text: string;
  score: number;
  label: "Automatisierbar" | "Teilweise Automatisierbar" | "Mensch";
  signals?: string[];
  aiTools?: string[];
  industry?: string;
  category?: string;
  confidence?: number;
  automationRatio?: number; // 0-100% wie viel automatisierbar ist
  humanRatio?: number; // 0-100% wie viel menschlich ist
  complexity?: 'low' | 'medium' | 'high';
  automationTrend?: 'increasing' | 'stable' | 'decreasing';
  subtasks?: Array<{
    id: string;
    title: string;
    description: string;
    automationPotential: number;
    estimatedTime: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'low' | 'medium' | 'high';
    systems: string[];
    risks: string[];
    opportunities: string[];
    dependencies: string[];
  }>;
  businessCase?: {
    manualHours: number;
    automatedHours: number;
    automationPotential: number;
    savedHours: number;
    setupCostHours: number;
    setupCostMoney: number;
    roi: number;
    paybackPeriodYears: number;
    hourlyRateEmployee: number;
    hourlyRateFreelancer: number;
    employmentType: 'employee' | 'freelancer';
    reasoning: string;
  };
  solutions?: {
    workflows: Array<{
      id: string;
      name: string;
      description: string;
      automationPotential: number;
      setupTime: string;
      cost: string;
      systems: string[];
      benefits: string[];
    }>;
    agents: Array<{
      id: string;
      name: string;
      technology: string;
      implementation: string;
      difficulty: string;
      setupTime: string;
      benefits: string[];
    }>;
  };
}

export interface AnalysisResult {
  totalScore: number;
  ratio: {
    automatisierbar: number;
    mensch: number;
  };
  tasks: Task[];
  summary: string;
  recommendations: string[];
  originalText?: string; // Add original text for job title extraction
}

export async function runAnalysis(jobText: string, lang: 'de' | 'en' = 'de'): Promise<AnalysisResult> {
  console.log('DEBUG runAnalysis: lang =', lang);
  
  // Step 1: AI-First approach - no fallback, clear error handling
  console.log('🤖 Starting AI-first analysis...');
  
  if (!isOpenAIAvailable()) {
    throw new Error('OpenAI API nicht konfiguriert. Bitte API-Key in .env hinterlegen.');
  }

  try {
    // Direct complete analysis (tasks + subtasks + business case + solutions)
    console.log('🚀 Starting complete AI analysis...');
    const fastResults = await analyzeJobWithCompleteAI(jobText, lang);
    
    // Step 3: Convert FastAnalysisResult to Task format with subtasks
    console.log('🔄 Converting to task format...');
    const analyzedTasks: Task[] = fastResults.map(result => {
    console.log('🔍 [runAnalysis] Task result:', {
      text: result.text,
      subtasks: result.subtasks?.length || 0,
      subtasksData: result.subtasks
    });
    
    return {
      text: result.text,
      score: result.automationPotential,
      label: result.label,
      signals: [result.reasoning ?? ''],
      aiTools: getToolsByIndustry(result.category).map(tool => tool.id),
      industry: result.category,
      category: result.category, // Use the proper category instead of pattern
      confidence: result.confidence,
      automationRatio: result.automationPotential,
      humanRatio: 100 - result.automationPotential,
      complexity: result.complexity || 'medium', // Use the calculated complexity
      automationTrend: result.trend || 'stable' as const,
      subtasks: result.subtasks || [], // Include subtasks from complete analysis
      businessCase: result.businessCase, // Include complete business case data
      solutions: result.solutions
    };
  });
  
  console.log('✅ Enhanced analysis completed with', analyzedTasks.length, 'tasks');
  console.log('🔍 [runAnalysis] Final tasks with subtasks:', analyzedTasks.map(t => ({
    text: t.text,
    subtasks: t.subtasks?.length || 0
  })));

  // Step 3: Calculate aggregated scores - make them consistent
  const totalTasks = analyzedTasks.length;
  const automatisierbareCount = analyzedTasks.filter(t => t.label === "Automatisierbar").length;
  const teilweiseCount = analyzedTasks.filter(t => t.label === "Teilweise Automatisierbar").length;
  const menschCount = analyzedTasks.filter(t => t.label === "Mensch").length;

  // Calculate the overall automation potential based on task scores (weighted average)
  const weightedScore = totalTasks > 0 ? analyzedTasks.reduce((sum, task) => sum + task.score, 0) / totalTasks : 0;
  
  // The ratio should reflect the overall automation potential, not just task counts
  const overallAutomationPotential = Math.round(weightedScore);
  
  // Berechne das tatsächliche Automatisierungspotenzial basierend auf den Task-Scores
  const totalAutomationScore = analyzedTasks.reduce((sum, task) => sum + task.score, 0);
  const maxPossibleScore = totalTasks * 100;
  const actualAutomationPotential = totalTasks > 0 ? Math.round((totalAutomationScore / maxPossibleScore) * 100) : 0;
  
  const ratio = {
    automatisierbar: actualAutomationPotential,
    mensch: 100 - actualAutomationPotential
  };
  
  // Ensure ratio values are valid numbers
  if (isNaN(ratio.automatisierbar)) ratio.automatisierbar = 0;
  if (isNaN(ratio.mensch)) ratio.mensch = 0;
  
  // Debug logging to verify consistency



  // Step 4: Generate summary and recommendations
  const summary = `Analyse mit ${overallAutomationPotential}% Automatisierungspotenzial für ${totalTasks} Aufgaben`;
  const recommendations = [`${Math.round(ratio.automatisierbar)}% der Aufgaben können automatisiert werden`];

    return {
      totalScore: overallAutomationPotential,
      ratio,
      tasks: analyzedTasks,
      summary,
      recommendations,
      originalText: jobText // Store original text for job title extraction
    };
    
  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    
    // Provide clear error message instead of fallback
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    
    throw new Error(`AI-Analyse fehlgeschlagen: ${errorMessage}. Bitte überprüfen Sie:
    1. OpenAI API-Key ist korrekt konfiguriert
    2. Internetverbindung ist verfügbar
    3. OpenAI API ist erreichbar
    4. Stellenbeschreibung enthält ausreichend Inhalt`);
  }
}



// Branchenspezifische AI-Tool-IDs für Aufgabenautomatisierung
const AI_TOOL_IDS_BY_INDUSTRY = {
  tech: ['chatgpt', 'claude', 'github-copilot', 'code-whisperer', 'tabnine'],
  healthcare: ['chatgpt', 'claude', 'notion-ai', 'obsidian-ai', 'microsoft-copilot', 'perplexity'],
  finance: ['chatgpt', 'claude', 'excel-ai', 'power-bi-ai', 'google-sheets-ai', 'airtable-ai'],
  marketing: ['chatgpt', 'claude', 'jasper', 'copy-ai', 'writesonic', 'canva-ai'],
  hr: ['chatgpt', 'claude', 'notion-ai', 'microsoft-copilot', 'airtable-ai'],
  production: ['chatgpt', 'claude', 'excel-ai', 'power-bi-ai', 'airtable-ai'],
  education: ['chatgpt', 'claude', 'notion-ai', 'obsidian-ai', 'perplexity', 'grammarly'],
  legal: ['chatgpt', 'claude', 'notion-ai', 'perplexity'],
  general: ['chatgpt', 'claude', 'grok', 'gemini', 'perplexity', 'microsoft-copilot', 'notion-ai']
};

// Browser-kompatible Keywords-Verwaltung
const INDUSTRY_KEYWORDS = {
  tech: [
    "software", "development", "programming", "code", "api", "system", "technical",
    "engineer", "developer", "programmer", "frontend", "backend", "fullstack",
    "javascript", "typescript", "react", "vue", "angular", "node.js", "python",
    "java", "c++", "database", "sql", "nosql", "mongodb", "postgresql",
    "docker", "kubernetes", "aws", "azure", "cloud", "devops", "ci/cd",
    "git", "github", "gitlab", "agile", "scrum", "sprint",
    "software engineer", "coding", "api development", "system design", "technical lead",
    "ux", "ui", "user experience", "user interface", "designer", "design",
    "figma", "sketch", "adobe xd", "wireframe", "mockup", "prototyp",
    "designsystem", "design system", "usability", "user research", "user feedback"
  ],
  marketing: [
    "marketing", "campaign", "brand", "content", "social media", "advertising",
    "promotion", "seo", "sem", "google ads", "facebook ads", "instagram",
    "linkedin", "twitter", "youtube", "email marketing", "newsletter",
    "lead generation", "conversion", "analytics", "google analytics",
    "influencer", "affiliate", "pr", "public relations", "copywriting",
    "marketing manager", "campaign management", "brand strategy", "content creation", "digital marketing"
  ],
  finance: [
    "financial", "accounting", "tax", "budget", "invoice", "payment",
    "controller", "accountant", "bookkeeper", "audit", "compliance",
    "bilanz", "buchhaltung", "buchhalter", "buchführung", "steuer",
    "rechnungswesen", "finanzen", "controlling", "kostenrechnung",
    "liquidität", "cashflow", "reporting", "abrechnung", "kassenbuch"
  ],
  hr: [
    "hr", "human resources", "recruitment", "personnel", "employee", "hiring",
    "talent", "onboarding", "offboarding", "performance", "evaluation",
    "personal", "mitarbeiter", "recruiting", "bewerbung", "einstellung",
    "personalentwicklung", "weiterbildung", "arbeitsrecht", "betriebsrat",
    "hr manager", "hr director", "hr specialist", "human resources manager",
    "personalmanager", "personalchef", "personalreferent", "recruiter", "talent acquisition"
  ],
  healthcare: [
    "medical", "patient", "healthcare", "clinical", "nursing", "treatment",
    "doctor", "nurse", "physician", "hospital", "clinic", "therapy",
    "medizinisch", "patient", "pflege", "krankenhaus", "praxis", "therapie",
    "gesundheit", "medikament", "diagnose", "behandlung", "operation",
    "medical professional", "patient care", "healthcare management", "clinical operations"
  ],
  production: [
    "production", "manufacturing", "quality", "process", "operations",
    "factory", "plant", "assembly", "lean", "six sigma", "kaizen",
    "produktion", "fertigung", "qualität", "prozess", "betrieb",
    "fabrik", "werk", "montage", "logistik", "supply chain", "warehouse",
    "production manager", "quality assurance", "process optimization"
  ]
};

function getKeywords(industry: string): string[] {
  return INDUSTRY_KEYWORDS[industry as keyof typeof INDUSTRY_KEYWORDS] || [];
}

// Branchenerkennung mit dynamischen Keywords
export function detectIndustry(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Definiere die Reihenfolge der Branchenerkennung (wichtig für Prioritäten)
  const industries = ['hr', 'finance', 'marketing', 'tech', 'healthcare', 'production'];
  
  // Prüfe jede Branche mit ihren Keywords
  for (const industry of industries) {
    const keywords = getKeywords(industry);
    
    // Spezielle Logik für HR (muss spezifisch sein)
    if (industry === 'hr') {
      const hrSpecificKeywords = [
        'hr manager', 'hr director', 'hr specialist', 'human resources manager',
        'personalmanager', 'personalchef', 'personalreferent', 'recruiter',
        'talent acquisition', 'recruitment', 'onboarding', 'offboarding'
      ];
      
      const hasSpecificHrMatch = hrSpecificKeywords.some(keyword => lowerText.includes(keyword));
      if (hasSpecificHrMatch) {
        return industry;
      }
    } else {
      // Für andere Branchen: Prüfe alle Keywords
      const hasMatch = keywords.some(keyword => lowerText.includes(keyword));
      if (hasMatch) {
        return industry;
      }
    }
  }
  
  // Fallback für allgemeine Büro- und Verwaltungsaufgaben
  const generalKeywords = [
    'verwaltung', 'administration', 'büro', 'office', 'koordination', 'coordination',
    'planung', 'planning', 'organisation', 'organization', 'kommunikation', 'communication',
    'berichterstattung', 'reporting', 'dokumentation', 'documentation',
    'präsentation', 'presentation'
  ];
  
  if (generalKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'general';
  }
  
  return 'general';
}

// Funktion zur Bestimmung der Aufgabenkategorie
function detectTaskCategory(taskText: string): string {
  const lowerText = taskText.toLowerCase();
  
  // Administrative Aufgaben
  if (lowerText.includes('verwaltung') || lowerText.includes('administration') ||
      lowerText.includes('büro') || lowerText.includes('office') ||
      lowerText.includes('koordination') || lowerText.includes('coordination') ||
      lowerText.includes('planung') || lowerText.includes('planning') ||
      lowerText.includes('organisation') || lowerText.includes('organization') ||
      lowerText.includes('berichterstattung') || lowerText.includes('reporting') ||
      lowerText.includes('dokumentation') || lowerText.includes('documentation') ||
      lowerText.includes('datenerfassung') || lowerText.includes('data entry') ||
      lowerText.includes('abrechnung') || lowerText.includes('accounting')) {
    return 'administrative';
  }
  
  // Kommunikationsaufgaben
  if (lowerText.includes('kommunikation') || lowerText.includes('communication') ||
      lowerText.includes('präsentation') || lowerText.includes('presentation') ||
      lowerText.includes('meeting') || lowerText.includes('gespräch') ||
      lowerText.includes('verhandlung') || lowerText.includes('negotiation') ||
      lowerText.includes('kundeninteraktion') || lowerText.includes('customer interaction')) {
    return 'communication';
  }
  
  // Technische Aufgaben
  if (lowerText.includes('entwicklung') || lowerText.includes('development') ||
      lowerText.includes('programmierung') || lowerText.includes('programming') ||
      lowerText.includes('system') || lowerText.includes('integration') ||
      lowerText.includes('datenbank') || lowerText.includes('database') ||
      lowerText.includes('api') || lowerText.includes('software')) {
    return 'technical';
  }
  
  // Analytische Aufgaben
  if (lowerText.includes('analyse') || lowerText.includes('analysis') ||
      lowerText.includes('auswertung') || lowerText.includes('evaluation') ||
      lowerText.includes('statistik') || lowerText.includes('statistics') ||
      lowerText.includes('datenanalyse') || lowerText.includes('data analysis') ||
      lowerText.includes('forschung') || lowerText.includes('research')) {
    return 'analytical';
  }
  
  // Kreative Aufgaben
  if (lowerText.includes('content') || lowerText.includes('design') ||
      lowerText.includes('kreativ') || lowerText.includes('creative') ||
      lowerText.includes('marketing') || lowerText.includes('werbung') ||
      lowerText.includes('kampagne') || lowerText.includes('campaign')) {
    return 'creative';
  }
  
  // Management-Aufgaben
  if (lowerText.includes('führung') || lowerText.includes('leadership') ||
      lowerText.includes('management') || lowerText.includes('leitung') ||
      lowerText.includes('strategie') || lowerText.includes('strategy') ||
      lowerText.includes('entscheidung') || lowerText.includes('decision')) {
    return 'management';
  }
  
  // Physische Aufgaben
  if (lowerText.includes('körperlich') || lowerText.includes('physical') ||
      lowerText.includes('bewegung') || lowerText.includes('movement') ||
      lowerText.includes('handarbeit') || lowerText.includes('manual work') ||
      lowerText.includes('transport') || lowerText.includes('lieferung')) {
    return 'physical';
  }
  
  // Routine-Aufgaben
  if (lowerText.includes('routine') || lowerText.includes('wiederkehrend') ||
      lowerText.includes('repetitive') || lowerText.includes('standard') ||
      lowerText.includes('prozess') || lowerText.includes('process')) {
    return 'routine';
  }
  
  return 'general';
}

function calculateAutomationPotential(lowerText: string, category: string): number {
  // Basis-Automatisierungspotenzial basierend auf Kategorie
  const categoryScores = {
    'administrative': 85,
    'routine': 90,
    'technical': 80,
    'analytical': 75,
    'communication': 40,
    'creative': 30,
    'management': 25,
    'physical': 20,
    'general': 50
  };
  
  let baseScore = categoryScores[category as keyof typeof categoryScores] || 50;
  
  // Keyword-basierte Anpassungen
  const automationKeywords = [
    'daten', 'data', 'excel', 'tabelle', 'table', 'bericht', 'report', 'routine', 'wiederkehrend',
    'repetitive', 'standard', 'prozess', 'process', 'automatisch', 'automatic', 'system', 'software'
  ];
  
  const manualKeywords = [
    'kreativ', 'creative', 'beratung', 'consultation', 'entscheidung', 'decision', 'strategie',
    'strategy', 'führung', 'leadership', 'körperlich', 'physical', 'handarbeit', 'manual'
  ];
  
  const automationMatches = automationKeywords.filter(keyword => lowerText.includes(keyword)).length;
  const manualMatches = manualKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  // Anpassung basierend auf Keywords
  baseScore += automationMatches * 5;
  baseScore -= manualMatches * 8;
  
  return Math.max(0, Math.min(100, baseScore));
}

async function analyzeTask(taskText: string, jobTitle?: string): Promise<Task> {
  const lowerText = taskText.toLowerCase();
  
  // Branchenerkennung für die Aufgabe - verwende Job-Titel wenn verfügbar
  const taskIndustry = jobTitle ? detectIndustry(jobTitle + ' ' + taskText) : detectIndustry(taskText);
  
  // Aufgabenkategorie bestimmen
  const taskCategory = detectTaskCategory(taskText);
  
  // Schnelle, lokale Analyse ohne externe API-Calls
  console.log('🔍 Fast Local Analysis for task:', taskText);
  
  // Verwende schnelle Keyword-basierte Analyse
  const automationPotential = calculateAutomationPotential(lowerText, taskCategory);
  const reasoning = `Fast analysis: ${taskCategory} category`;
  
  return {
    text: taskText,
    score: Math.round(automationPotential),
    label: automationPotential >= 70 ? "Automatisierbar" : 
           automationPotential >= 30 ? "Teilweise Automatisierbar" : "Mensch",
    signals: [reasoning],
    aiTools: getToolsByIndustry(taskIndustry).map(tool => tool.id),
    industry: taskIndustry,
    category: taskCategory,
    confidence: 0.7,
    automationRatio: automationPotential,
    humanRatio: 100 - automationPotential,
    complexity: automationPotential >= 70 ? 'low' : automationPotential >= 30 ? 'medium' : 'high',
    automationTrend: 'increasing'
  };
}

function analyzeTaskFallback(taskText: string, jobTitle?: string, taskIndustry?: string, taskCategory?: string): Task {
  const lowerText = taskText.toLowerCase();
  
  // Define automation indicators (with modern AI tools consideration)
  const automationSignals = {
    // High automation potential with AI tools
    softwareDevelopment: {
      keywords: [
        // German - Software-Entwicklung mit KI-Unterstützung
        'entwicklung', 'programmierung', 'coding', 'code', 'software', 'webanwendung', 'app', 'api',
        'react', 'node.js', 'javascript', 'typescript', 'python', 'java', 'c#', 'php', 'html', 'css',
        'datenbank', 'database', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql',
        'debugging', 'fehlerbehebung', 'testing', 'code-review', 'code review',
        'dokumentation', 'komponenten', 'integration', 'system', 'architektur',
        // English
        'development', 'programming', 'coding', 'software', 'web application', 'app', 'api',
        'database design', 'optimization', 'debugging', 'error handling', 'testing', 'code review',
        'documentation', 'components', 'integration', 'system', 'architecture'
      ],
      weight: 25, // Reduced weight for more nuanced scoring
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.tech
    },
    dataAnalysis: {
      keywords: [
        // German - Datenanalyse und -verarbeitung
        'datenanalyse', 'auswertung', 'statistik', 'kennzahlen', 'reporting', 'dashboard',
        'excel', 'tabelle', 'datenerfassung', 'dateneingabe',
        // English
        'data analysis', 'analytics', 'statistics', 'metrics', 'reporting', 'dashboard',
        'excel', 'spreadsheet', 'data entry', 'data input'
      ],
      weight: 30,
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.finance
    },
    // Branchenspezifische Automatisierungssignale
    healthcare: {
      keywords: [
        'dokumentation', 'protokollierung', 'patientendaten', 'medizinische berichte',
        'documentation', 'logging', 'patient data', 'medical reports', 'charting',
        'vital signs', 'medication', 'treatment plans', 'care coordination'
      ],
      weight: 30,
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.healthcare
    },
    finance: {
      keywords: [
        'buchhaltung', 'abrechnung', 'steuern', 'finanzberichte', 'prüfung',
        'accounting', 'reconciliation', 'tax', 'financial reports', 'audit',
        'data entry', 'reporting', 'compliance', 'risk assessment'
      ],
      weight: 45,
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.finance
    },
    marketing: {
      keywords: [
        'content erstellung', 'kampagnen', 'analysen', 'social media', 'seo',
        'content creation', 'campaigns', 'analytics', 'social media', 'seo',
        'email marketing', 'lead generation', 'conversion optimization',
        'marketingstrategien', 'marketing strategies', 'werbekampagnen', 'advertising campaigns',
        'budgetplanung', 'budget planning', 'social media kanäle', 'social media channels',
        'events', 'messen', 'trade shows', 'präsentationen', 'presentations', 'reports'
      ],
      weight: 20, // Lower weight for more nuanced scoring
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.marketing
    },
    hr: {
      keywords: [
        'rekrutierung', 'bewerbungsanalyse', 'onboarding', 'mitarbeiterdaten',
        'recruitment', 'application analysis', 'onboarding', 'employee data',
        'screening', 'interview scheduling', 'performance reviews'
      ],
      weight: 30,
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.hr
    },
    production: {
      keywords: [
        'produktionsplanung', 'qualitätskontrolle', 'lagerverwaltung', 'wartung',
        'production planning', 'quality control', 'inventory management', 'maintenance',
        'safety monitoring', 'equipment tracking', 'supply chain'
      ],
      weight: 40,
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.production
    },
    education: {
      keywords: [
        'unterrichtsvorbereitung', 'materialerstellung', 'bewertung', 'dokumentation',
        'lesson planning', 'material creation', 'assessment', 'documentation',
        'grading', 'curriculum development', 'student tracking'
      ],
      weight: 25,
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.education
    },
    legal: {
      keywords: [
        'vertragsprüfung', 'dokumentation', 'recherche', 'compliance',
        'contract review', 'documentation', 'research', 'compliance',
        'legal research', 'case analysis', 'regulatory review'
      ],
      weight: 30,
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.legal
    },
    // Medium automation potential
    documentation: {
      keywords: [
        'dokumentation', 'protokoll', 'aufzeichnung', 'dokumentieren', 'notieren',
        'documentation', 'recording', 'logging', 'documenting', 'noting',
        'präsentationen', 'presentations', 'reports', 'berichte'
      ],
      weight: 25,
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.general
    },
    monitoring: {
      keywords: [
        'überwachung', 'monitoring', 'kontrolle', 'beobachtung',
        'monitoring', 'surveillance', 'control', 'observation'
      ],
      weight: 35,
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.general
    },
    // Low automation potential (human-centric tasks)
    creativeStrategy: {
      keywords: [
        'strategie', 'planung', 'konzeption', 'kreativ', 'innovation',
        'strategy', 'planning', 'concept', 'creative', 'innovation',
        'marketingstrategien', 'marketing strategies'
      ],
      weight: 10, // Lower weight for creative tasks
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.general
    },
    humanInteraction: {
      keywords: [
        'beratung', 'kommunikation', 'führung', 'mentoring', 'coaching',
        'advice', 'communication', 'leadership', 'mentoring', 'coaching',
        'zusammenarbeit', 'collaboration', 'koordination', 'coordination', 'agenturen', 'agencies'
      ],
      weight: 5, // Very low weight for human interaction tasks
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.general
    },
    // Partially automatable tasks with AI assistance
    aiAssistedTasks: {
      keywords: [
        'analyse', 'analysis', 'trends', 'trends', 'kundenverhalten', 'customer behavior',
        'markttrends', 'market trends', 'events', 'messen', 'trade shows',
        'organisation', 'organization', 'planung', 'planning'
      ],
      weight: 15, // Medium weight for AI-assisted tasks
      aiTools: AI_TOOL_IDS_BY_INDUSTRY.general
    }
  };

  // Calculate automation score based on detected signals
  let totalScore = 0;
  let totalWeight = 0;
  const detectedSignals: string[] = [];
  const recommendedTools: string[] = [];

  for (const [signalName, signal] of Object.entries(automationSignals)) {
    const hasSignal = signal.keywords.some(keyword => lowerText.includes(keyword));
    if (hasSignal) {
      totalScore += signal.weight;
      totalWeight += signal.weight;
      detectedSignals.push(signalName);
      
      // Add recommended AI tools for this signal
      if (signal.aiTools) {
        recommendedTools.push(...signal.aiTools);
      }
    }
  }

  // Add industry-specific bonus
  const industryToolIds = AI_TOOL_IDS_BY_INDUSTRY[taskIndustry as keyof typeof AI_TOOL_IDS_BY_INDUSTRY];
  if (industryToolIds && taskIndustry !== 'general') {
    totalScore += 5; // Small bonus for industry-specific tasks
    totalWeight += 5;
    recommendedTools.push(...industryToolIds);
  }

  // Always add general AI tools for any automation potential
  if (totalScore > 0) {
    recommendedTools.push(...AI_TOOL_IDS_BY_INDUSTRY.general);
  }

  // Normalize score to 0-100 range with more realistic scoring
  let automationScore = totalWeight > 0 ? Math.min(85, Math.round((totalScore / totalWeight) * 85)) : 0;
  
  // Add nuance based on number of detected signals
  if (detectedSignals.length === 1) {
    // Single signal - moderate the score
    automationScore = Math.round(automationScore * 0.7);
  } else if (detectedSignals.length >= 3) {
    // Multiple signals - boost the score slightly but cap at 85%
    automationScore = Math.min(85, Math.round(automationScore * 1.05));
  }
  
  // Apply realistic caps based on task type
  if (detectedSignals.includes('humanInteraction') || detectedSignals.includes('creativeStrategy')) {
    automationScore = Math.min(automationScore, 40); // Max 40% for human interaction tasks
  } else if (detectedSignals.includes('management') || detectedSignals.includes('leadership')) {
    automationScore = Math.min(automationScore, 60); // Max 60% for management tasks
  } else if (detectedSignals.includes('documentation') || detectedSignals.includes('dataAnalysis')) {
    automationScore = Math.min(automationScore, 80); // Max 80% for documentation tasks
  }
  
  // Ensure score is within bounds
  automationScore = Math.max(0, Math.min(85, automationScore));

  // Determine automation label with more realistic thresholds
  let label: "Automatisierbar" | "Teilweise Automatisierbar" | "Mensch";
  if (automationScore >= 60) {
    label = "Automatisierbar";
  } else if (automationScore >= 20) {
    label = "Teilweise Automatisierbar";
  } else {
    label = "Mensch";
  }
  
  // Remove duplicate tools and limit to top 5, prioritize industry-specific tools
  const uniqueTools = Array.from(new Set(recommendedTools));
  
  // If we have industry-specific tools, prioritize them
  let finalTools = uniqueTools;
  if (industryToolIds && industryToolIds.length > 0) {
    const industryTools = uniqueTools.filter(tool => industryToolIds.includes(tool));
    const generalTools = uniqueTools.filter(tool => !industryToolIds.includes(tool));
    finalTools = [...industryTools, ...generalTools];
  }
  
  // Limit to top 5 tools
  finalTools = finalTools.slice(0, 5);

  // Calculate automation vs human ratio based on actual score
  let automationRatio = automationScore;
  let humanRatio = 100 - automationRatio;
  
  // Apply realistic caps based on task type
  if (detectedSignals.includes('humanInteraction') || detectedSignals.includes('creativeStrategy')) {
    automationRatio = Math.min(automationRatio, 40); // Max 40% for human interaction tasks
  } else if (detectedSignals.includes('management') || detectedSignals.includes('leadership')) {
    automationRatio = Math.min(automationRatio, 60); // Max 60% for management tasks
  } else if (detectedSignals.includes('documentation') || detectedSignals.includes('dataAnalysis')) {
    automationRatio = Math.min(automationRatio, 80); // Max 80% for documentation tasks
  }
  
  // Ensure automationRatio doesn't exceed 85%
  automationRatio = Math.min(automationRatio, 85);
  humanRatio = 100 - automationRatio;

  // Determine complexity based on task characteristics
  let complexity: 'low' | 'medium' | 'high' = 'medium';
  if (detectedSignals.includes('humanInteraction') || detectedSignals.includes('creativeStrategy')) {
    complexity = 'high';
  } else if (detectedSignals.includes('dataAnalysis') || detectedSignals.includes('documentation')) {
    complexity = 'low';
  }

  // Determine automation trend based on score and industry
  let automationTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (automationScore >= 70 && (taskIndustry === 'tech' || taskIndustry === 'finance')) {
    automationTrend = 'increasing';
  } else if (automationScore <= 25 && (taskIndustry === 'healthcare' || taskIndustry === 'legal')) {
    automationTrend = 'decreasing';
  }

  return {
    text: taskText,
    score: automationScore,
    label,
    signals: detectedSignals,
    aiTools: finalTools,
    industry: taskIndustry,
    category: taskCategory,
    confidence: 85, // Confidence der Analyse (nicht das Automatisierungspotenzial)
    automationRatio: Math.round(automationRatio),
    humanRatio: Math.round(humanRatio),
    complexity,
    automationTrend
  };
}

export function generateSummary(totalScore: number, ratio: { automatisierbar: number; mensch: number }, taskCount: number, lang: 'de' | 'en' = 'de'): string {
  
  // Handle edge case of no tasks found
  if (taskCount === 0) {
    if (lang === 'en') {
      return 'No specific tasks could be identified in the provided text. Please provide a more detailed job description or task list for analysis.';
    } else {
      return 'Es konnten keine spezifischen Aufgaben im bereitgestellten Text identifiziert werden. Bitte geben Sie eine detailliertere Stellenbeschreibung oder Aufgabenliste für die Analyse an.';
    }
  }
  
  let summary: string;
  if (lang === 'en') {
    const scoreCategory = totalScore >= 75 ? 'high' : totalScore >= 50 ? 'medium' : 'low';
    summary = `Analysis of ${taskCount} identified tasks revealed ${scoreCategory} automation potential of ${totalScore}%. ${ratio.automatisierbar}% of tasks are potentially automatable, ${ratio.mensch}% require human capabilities.`;
  } else {
    const scoreCategory = totalScore >= 75 ? 'hoch' : totalScore >= 50 ? 'mittel' : 'niedrig';
    summary = `Analyse von ${taskCount} identifizierten Aufgaben ergab ein ${scoreCategory}es Automatisierungspotenzial von ${totalScore}%. ${ratio.automatisierbar}% der Aufgaben sind potentiell automatisierbar, ${ratio.mensch}% erfordern menschliche Fähigkeiten.`;
  }
  
  return summary;
}

function generateRecommendations(tasks: Task[], overallScore: number): string[] {
  const recommendations: string[] = [];
  
  // Branchenerkennung basierend auf den Aufgaben
  const industries = tasks.map(t => t.industry).filter(Boolean);
  const primaryIndustry = industries.length > 0 ? 
    industries.sort((a, b) => 
      industries.filter(v => v === a).length - 
      industries.filter(v => v === b).length
    ).pop() : 'general';

  // Sammle alle empfohlenen AI-Tools
  const allRecommendedTools = tasks
    .flatMap(t => t.aiTools || [])
    .filter((tool, index, arr) => arr.indexOf(tool) === index); // Deduplizieren

  // Allgemeine Empfehlungen basierend auf Score
  if (overallScore >= 70) {
    recommendations.push("Hohes Automatisierungspotenzial! Fokus auf AI-Tools und Workflow-Automatisierung.");
  } else if (overallScore >= 40) {
    recommendations.push("Mittleres Automatisierungspotenzial. Kombinieren Sie AI-Tools mit menschlicher Expertise.");
  } else {
    recommendations.push("Niedriges Automatisierungspotenzial. Fokus auf menschliche Fähigkeiten und AI-Unterstützung.");
  }

  // Branchenspezifische Empfehlungen
  const industryRecommendations = {
    tech: [
      "Implementieren Sie GitHub Copilot für Code-Vervollständigung",
      "Nutzen Sie Claude für Code-Reviews und Sicherheitsanalysen",
      "Verwenden Sie ChatGPT für Dokumentation und Debugging-Hilfe",
      "Integrieren Sie CI/CD-Pipelines mit AI-gestützter Qualitätskontrolle"
    ],
    healthcare: [
      "Etablieren Sie Notion AI für Patientendaten-Management",
      "Nutzen Sie Claude für klinische Entscheidungsunterstützung",
      "Implementieren Sie Microsoft Copilot für medizinische Berichte",
      "Verwenden Sie Perplexity für medizinische Recherche"
    ],
    finance: [
      "Integrieren Sie Excel AI für automatische Datenverarbeitung",
      "Nutzen Sie Power BI AI für Finanzdashboards",
      "Implementieren Sie Claude für Risikoanalysen",
      "Verwenden Sie Airtable AI für Workflow-Automatisierung"
    ],
    marketing: [
      "Etablieren Sie Jasper für Content-Erstellung",
      "Nutzen Sie Copy.ai für Conversion-optimierte Texte",
      "Implementieren Sie Canva AI für Visual Content",
      "Verwenden Sie Claude für Marktanalysen"
    ],
    hr: [
      "Integrieren Sie Notion AI für HR-Dokumentation",
      "Nutzen Sie Airtable AI für Bewerber-Management",
      "Implementieren Sie ChatGPT für Recruiting-Unterstützung",
      "Verwenden Sie Microsoft Copilot für Office-Aufgaben"
    ],
    production: [
      "Etablieren Sie Excel AI für Produktionsdaten",
      "Nutzen Sie Power BI AI für Performance-Monitoring",
      "Implementieren Sie Airtable AI für Lagerverwaltung",
      "Verwenden Sie Claude für Prozessoptimierung"
    ],
    education: [
      "Integrieren Sie Notion AI für Kurs-Management",
      "Nutzen Sie Obsidian AI für Forschungsnotizen",
      "Implementieren Sie ChatGPT für Unterrichtsvorbereitung",
      "Verwenden Sie Perplexity für Literaturrecherche"
    ],
    legal: [
      "Etablieren Sie Notion AI für Fall-Management",
      "Nutzen Sie Claude für Rechtsanalysen",
      "Implementieren Sie Perplexity für Rechtsrecherche",
      "Verwenden Sie ChatGPT für Vertragsentwürfe"
    ],
    general: [
      "Starten Sie mit ChatGPT für allgemeine Aufgaben",
      "Nutzen Sie Claude für detaillierte Analysen",
      "Implementieren Sie Microsoft Copilot für Office-Integration",
      "Verwenden Sie Notion AI für Dokumentation"
    ]
  };

  // Füge branchenspezifische Empfehlungen hinzu
  const industryRecs = industryRecommendations[primaryIndustry as keyof typeof industryRecommendations] || industryRecommendations.general;
  recommendations.push(...industryRecs.slice(0, 3));

  // AI-Tool-spezifische Empfehlungen
  if (allRecommendedTools.length > 0) {
    const topTools = allRecommendedTools.slice(0, 3);
    recommendations.push(`Empfohlene AI-Tools: ${topTools.join(', ')}`);
  }

  // Moderne Automatisierungstrends
  recommendations.push("Implementieren Sie schrittweise Automatisierung mit kontinuierlicher Evaluation");
  recommendations.push("Kombinieren Sie AI-Tools mit menschlicher Expertise für optimale Ergebnisse");
  recommendations.push("Fokussieren Sie sich auf repetitive, strukturierte Aufgaben für maximale Effizienz");

  return recommendations.slice(0, 8); // Begrenzen auf 8 Empfehlungen
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word)).length;
  return commonWords / Math.max(words1.length, words2.length);
}

/**
 * Complete Job Analysis - generates main tasks with subtasks, business case, and solutions
 */
async function analyzeJobWithCompleteAI(
  jobText: string,
  lang: 'de' | 'en' = 'de'
): Promise<FastAnalysisResult[]> {
  console.log('🤖 Starting COMPLETE job analysis...');
  
  if (!isOpenAIAvailable()) {
    throw new Error('OpenAI API nicht verfügbar. Bitte API-Key konfigurieren.');
  }

  try {
    // ULTRA FAST: Simple task extraction only (no subtasks/business case for speed)
    console.log('🚀 FAST task extraction (no subtasks/business case)...');
    const completeAnalysis = await openaiClient.analyzeJobDescription(jobText, lang);
      
      if (!completeAnalysis.tasks || completeAnalysis.tasks.length === 0) {
        throw new Error('AI-Analyse fehlgeschlagen - keine Aufgaben extrahiert');
      }
      
      console.log('✅ Tasks extracted and analyzed:', completeAnalysis.tasks.length, 'tasks');
      const mainTasks = completeAnalysis.tasks;
      
      // Convert AI results directly to FastAnalysisResult format
      const results: FastAnalysisResult[] = [];
      
      for (let i = 0; i < mainTasks.length; i++) {
        const task = mainTasks[i];
        const taskText = typeof task === 'string' ? task : task.text;
        console.log(`📋 Processing main task ${i + 1}/${mainTasks.length}: ${taskText.slice(0, 50)}...`);
        
        // Generate varied complexity and trend based on task content
        const taskTextLower = taskText.toLowerCase();
        let complexity: 'low' | 'medium' | 'high';
        let automationTrend: 'increasing' | 'stable' | 'decreasing';
        let category = 'Allgemein';
        
        // Determine complexity based on task content
        if (taskTextLower.includes('debugging') || taskTextLower.includes('fehlerbehebung') || 
            taskTextLower.includes('integration') || taskTextLower.includes('optimierung') ||
            taskTextLower.includes('entwicklung') || taskTextLower.includes('programmierung')) {
          complexity = 'high';
        } else if (taskTextLower.includes('dokumentation') || taskTextLower.includes('testing') || 
                   taskTextLower.includes('review') || taskTextLower.includes('code-review')) {
          complexity = 'medium';
        } else if (completeAnalysis?.businessCase?.automationPotential >= 85) {
          complexity = 'low';
        } else if (completeAnalysis?.businessCase?.automationPotential >= 60) {
          complexity = 'medium';
        } else {
          complexity = 'high';
        }
        
        // Determine trend based on task type
        if (taskTextLower.includes('ai') || taskTextLower.includes('automatisierung') || 
            taskTextLower.includes('workflow') || taskTextLower.includes('machine learning')) {
          automationTrend = 'increasing';
        } else if (taskTextLower.includes('debugging') || taskTextLower.includes('fehlerbehebung') ||
                   taskTextLower.includes('support') || taskTextLower.includes('wartung') ||
                   taskTextLower.includes('pflege')) {
          automationTrend = 'stable';
        } else {
          automationTrend = 'increasing';
        }
        
        // Determine proper category
        if (taskTextLower.includes('entwicklung') || taskTextLower.includes('programmierung') || taskTextLower.includes('coding')) {
          category = 'Software-Entwicklung';
        } else if (taskTextLower.includes('daten') || taskTextLower.includes('database') || taskTextLower.includes('datenbank')) {
          category = 'Datenmanagement';
        } else if (taskTextLower.includes('api') || taskTextLower.includes('integration')) {
          category = 'Integration';
        } else if (taskTextLower.includes('testing') || taskTextLower.includes('test')) {
          category = 'Qualitätssicherung';
        } else if (taskTextLower.includes('dokumentation') || taskTextLower.includes('documentation')) {
          category = 'Dokumentation';
        } else if (taskTextLower.includes('debugging') || taskTextLower.includes('fehlerbehebung')) {
          category = 'Fehlerbehebung';
        } else if (taskTextLower.includes('team') || taskTextLower.includes('zusammenarbeit')) {
          category = 'Teamarbeit';
        }

        // Convert to FastAnalysisResult format with PRE-GENERATED data
        const result: FastAnalysisResult = {
          text: taskText,
          automationPotential: task.automationPotential || 50,
          confidence: 90, // High confidence for single AI call
          category: task.category || category,
          pattern: 'ai-single-call-preloaded',
          reasoning: task.reasoning || 'Single AI call analysis completed',
          subtasks: task.subtasks || [], // Pre-generate subtasks
          solutions: { workflows: [], agents: [] }, // Skip solutions for speed
          businessCase: task.businessCase || null, // Pre-generate business case
          complexity: complexity,
          trend: automationTrend
        };
        
        results.push(result);
        console.log(`✅ Main task ${i + 1} completed (batch processed)`);
      }
      
      console.log(`🚀 ALL ${mainTasks.length} tasks analyzed in ONE AI call!`);
      
      console.log(`✅ Complete job analysis finished: ${results.length} main tasks processed`);
      return results;
      
    } catch (error) {
      console.error(`❌ Failed to analyze tasks in batch:`, error);
      
      // Fallback: create basic results for all tasks
      const fallbackResults: FastAnalysisResult[] = [];
      for (let i = 0; i < mainTasks.length; i++) {
        const taskText = mainTasks[i];
        const fallbackResult: FastAnalysisResult = {
          text: taskText,
          automationPotential: 50,
          confidence: 30,
          category: 'general',
          pattern: 'fallback',
          reasoning: 'Fallback analysis due to AI error',
          subtasks: [],
          solutions: { workflows: [], agents: [] },
          businessCase: null,
          complexity: 'medium',
          trend: 'stable'
        };
        fallbackResults.push(fallbackResult);
      }
      
      console.log(`✅ Fallback analysis finished: ${fallbackResults.length} main tasks processed`);
      return fallbackResults;
    }
}

/**
 * AI-Enhanced Task Analysis (OPTIMIZED)
 * Uses OpenAI to analyze individual tasks with better accuracy and token savings
 */
async function analyzeTasksWithCompleteAI(
  taskTexts: string[], 
  jobContext: string, 
  lang: 'de' | 'en' = 'de'
): Promise<FastAnalysisResult[]> {
  console.log('🤖 Starting COMPLETE AI analysis (subtasks + business case + solutions)...');
  
  if (!isOpenAIAvailable()) {
    throw new Error('OpenAI API nicht verfügbar. Bitte API-Key konfigurieren.');
  }

  const results: FastAnalysisResult[] = [];
  
  // Process each task individually with complete analysis
  for (let i = 0; i < taskTexts.length; i++) {
    const taskText = taskTexts[i];
    console.log(`📋 Processing task ${i + 1}/${taskTexts.length}: ${taskText.slice(0, 50)}...`);
    
    try {
      // Use the new complete analysis method
      const completeAnalysis = await openaiClient.generateCompleteAnalysis(taskText, lang);
      
      // Convert to FastAnalysisResult format
      const result: FastAnalysisResult = {
        text: taskText,
        automationPotential: completeAnalysis?.businessCase?.automationPotential || 50,
        confidence: 90, // High confidence since it's AI-generated
        category: 'general', // Could be enhanced to detect category
        pattern: 'ai-analyzed',
        reasoning: completeAnalysis?.businessCase?.reasoning ?? '',
        subtasks: completeAnalysis?.subtasks || [],
        solutions: completeAnalysis?.solutions || { workflows: [], agents: [] }
      };
      
      results.push(result);
      console.log(`✅ Task ${i + 1} completed with ${completeAnalysis?.subtasks?.length || 0} subtasks`);
      
    } catch (error) {
      console.error(`❌ Failed to analyze task ${i + 1}:`, error);
      // Fallback to basic analysis
      const fallbackResult: FastAnalysisResult = {
        text: taskText,
        automationPotential: 50,
        confidence: 30,
        category: 'general',
        pattern: 'fallback',
        reasoning: 'Fallback analysis due to AI error',
        subtasks: [],
        solutions: { workflows: [], agents: [] }
      };
      results.push(fallbackResult);
    }
  }
  
  console.log(`✅ Complete analysis finished: ${results.length} tasks processed`);
  return results;
}

/**
 * OPTIMIZATION: Batch processing for similar tasks
 * Reduces API calls by processing multiple tasks in one request
 */
async function processBatchWithAI(
  taskTexts: string[], 
  jobContext: string, 
  lang: 'de' | 'en' = 'de'
): Promise<FastAnalysisResult[]> {
  console.log('🚀 Processing batch with AI...');
  
  // Create a combined prompt for all tasks
  const tasksText = taskTexts.map((task, index) => `${index + 1}. ${task}`).join('\n');
  
  const systemPrompt = lang === 'de' 
    ? `Du bist ein Experte für Arbeitsplatzautomatisierung. Analysiere mehrere Aufgaben gleichzeitig und antworte NUR mit gültigem JSON.

WICHTIG: Antworte ausschließlich mit gültigem JSON, keine zusätzlichen Erklärungen!

JSON-Format:
{"results":[{"taskIndex":1,"automationPotential":85,"confidence":90,"category":"admin","industry":"IT","complexity":"medium","trend":"increasing","systems":["Excel"],"reasoning":"Begründung","subtasks":[{"id":"1","title":"Unteraufgabe","automationPotential":90,"estimatedTime":15}]}]}`
    : `You are an expert in workplace automation. Analyze multiple tasks simultaneously and respond ONLY with valid JSON.

IMPORTANT: Respond exclusively with valid JSON, no additional explanations!

JSON Format:
{"results":[{"taskIndex":1,"automationPotential":85,"confidence":90,"category":"admin","industry":"IT","complexity":"medium","trend":"increasing","systems":["Excel"],"reasoning":"Reasoning","subtasks":[{"id":"1","title":"Subtask","automationPotential":90,"estimatedTime":15}]}]}`;

  const userPrompt = lang === 'de'
    ? `Analysiere diese Aufgaben:\n${tasksText}\n\nKontext: ${jobContext.slice(0, 500)}`
    : `Analyze these tasks:\n${tasksText}\n\nContext: ${jobContext.slice(0, 500)}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ];

  const response = await openaiClient.chatCompletion(messages, { 
    max_tokens: 800, // Reduced for batch processing
    temperature: 0.3 
  });

  try {
    // Versuche JSON zu parsen
    let parsed = JSON.parse(response.content);
    const results: FastAnalysisResult[] = [];
    
    // Convert batch results back to individual results
    for (let i = 0; i < taskTexts.length; i++) {
      const taskText = taskTexts[i];
      const batchResult = parsed.results?.find((r: any) => r.taskIndex === i + 1) || parsed.results?.[i];
      
      if (batchResult) {
        results.push({
          text: taskText,
          automationPotential: batchResult.automationPotential || 50,
          confidence: batchResult.confidence || 0.7,
          pattern: batchResult.category || 'general',
          category: batchResult.industry || 'general',
          complexity: batchResult.complexity || 'medium',
          trend: batchResult.trend || 'stable',
          systems: batchResult.systems || [],
          label: batchResult.automationPotential >= 70 ? 'Automatisierbar' : 
                 batchResult.automationPotential >= 30 ? 'Teilweise Automatisierbar' : 'Mensch',
          reasoning: batchResult.reasoning || 'Batch analysis',
          analysisTime: 0,
          subtasks: batchResult.subtasks || []
        });
      } else {
        // Fallback for missing results
        results.push({
          text: taskText,
          automationPotential: 50,
          confidence: 0.5,
          pattern: 'general',
          category: 'general',
          complexity: 'medium',
          trend: 'stable',
          systems: [],
          label: 'Teilweise Automatisierbar',
          reasoning: 'Fallback analysis',
          analysisTime: 0,
          subtasks: []
        });
      }
    }
    
    console.log('✅ Batch processing successful');
    return results;
  } catch (error) {
    console.error('❌ Batch processing failed:', error);
    console.log('Raw response:', response.content);
    
    // Versuche JSON aus der Antwort zu extrahieren
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Verarbeite extrahiertes JSON...
        console.log('✅ Extracted JSON from response');
        // Hier könnte man das extrahierte JSON verarbeiten
      }
    } catch (extractError) {
      console.error('Failed to extract JSON from response:', extractError);
    }
    
    throw error;
  }
}
