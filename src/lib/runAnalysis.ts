import { extractTasks } from './extractTasks';
import { getToolsByIndustry } from './catalog/aiTools';
import { fastAnalysisEngine, FastAnalysisResult } from './patternEngine/fastAnalysisEngine';

interface Task {
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
  originalText?: string; // Add original text for job title extraction
}

export async function runAnalysis(jobText: string, lang: 'de' | 'en' = 'de'): Promise<AnalysisResult> {
  console.log('DEBUG runAnalysis: lang =', lang);
  
  // Step 1: Extract tasks using the original extractor
  const rawTasks = extractTasks(jobText);
  
  // Convert to text array for analysis
  const extractedTasks = rawTasks.map(t => t.text);
  console.log('Tasks for analysis:', extractedTasks.length);

  // Step 2: Fast analysis using pattern engine
  console.log('🚀 Starting fast pattern analysis...');
  const fastResults = fastAnalysisEngine.analyzeTasks(extractedTasks, jobText);
  
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
      signals: [result.reasoning],
      aiTools: getToolsByIndustry(result.category).map(tool => tool.id),
      industry: result.category,
      category: result.pattern,
      confidence: result.confidence,
      automationRatio: result.automationPotential,
      humanRatio: 100 - result.automationPotential,
      complexity: result.complexity,
      automationTrend: result.trend || 'stable' as const,
      subtasks: result.subtasks || [] // Include subtasks from pattern engine
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
    confidence: Math.round(automationScore), // Confidence basiert auf dem Automatisierungsscore
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
