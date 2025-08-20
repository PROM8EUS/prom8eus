import { extractTasks } from './extractTasks';
import { getToolsByIndustry } from './catalog/aiTools';

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
}

export function runAnalysis(jobText: string, lang: 'de' | 'en' = 'de'): AnalysisResult {
  console.log('DEBUG runAnalysis: lang =', lang);
  
  // Step 1: Extract tasks using the extractor
  const rawTasks = extractTasks(jobText);
  
  // Convert to text array for analysis
  const extractedTasks = rawTasks.map(t => t.text);
  console.log('Tasks for analysis:', extractedTasks.length);

  // Step 2: Analyze and score each task
  const analyzedTasks = extractedTasks.map(taskText => analyzeTask(taskText, jobText));

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
  const summary = generateSummary(overallAutomationPotential, ratio, totalTasks, lang);
  const recommendations = generateRecommendations(analyzedTasks, overallAutomationPotential);

  return {
    totalScore: overallAutomationPotential,
    ratio,
    tasks: analyzedTasks,
    summary,
    recommendations
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

// Branchenerkennung
export function detectIndustry(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Finanzwesen (muss vor Tech geprüft werden wegen "accountant" vs "count")
  if (lowerText.includes('accounting') || lowerText.includes('finance') || lowerText.includes('tax') ||
      lowerText.includes('bookkeeping') || lowerText.includes('financial') || lowerText.includes('audit') ||
      lowerText.includes('buchhaltung') || lowerText.includes('finanzen') || lowerText.includes('steuer') ||
      lowerText.includes('buchführung') || lowerText.includes('finanziell') || lowerText.includes('prüfung') ||
      lowerText.includes('buchhalter') || lowerText.includes('controller') || lowerText.includes('rechnungswesen') ||
      lowerText.includes('bilanz') || lowerText.includes('abrechnung') || lowerText.includes('kassenbuch') ||
      lowerText.includes('accountant') || lowerText.includes('bookkeeper') || lowerText.includes('auditor')) {
    return 'finance';
  }
  
  // Marketing & Sales (muss vor Tech geprüft werden wegen "marketing manager" vs "manager")
  if (lowerText.includes('marketing') || lowerText.includes('sales') || lowerText.includes('campaign') ||
      lowerText.includes('advertising') || lowerText.includes('promotion') || lowerText.includes('lead') ||
      lowerText.includes('marketing') || lowerText.includes('vertrieb') || lowerText.includes('kampagne') ||
      lowerText.includes('werbung') || lowerText.includes('promotion') || lowerText.includes('lead') ||
      lowerText.includes('marketing manager') || lowerText.includes('sales manager') || lowerText.includes('marketing director') ||
      lowerText.includes('marketingchef') || lowerText.includes('vertriebsleiter') || lowerText.includes('marketingleiter') ||
      lowerText.includes('content') || lowerText.includes('social media') || lowerText.includes('seo') ||
      lowerText.includes('email marketing') || lowerText.includes('lead generation') ||
      lowerText.includes('marketingstrategie') || lowerText.includes('marketing strategy') ||
      lowerText.includes('werbekampagne') || lowerText.includes('advertising campaign') ||
      lowerText.includes('budgetplanung') || lowerText.includes('budget planning') ||
      lowerText.includes('events') || lowerText.includes('messen') || lowerText.includes('trade shows')) {
    return 'marketing';
  }
  
  // Technologie & IT
  if (lowerText.includes('software') || lowerText.includes('programming') || lowerText.includes('development') || 
      lowerText.includes('coding') || lowerText.includes('api') || lowerText.includes('database') ||
      lowerText.includes('entwicklung') || lowerText.includes('programmierung') || lowerText.includes('coding') ||
      lowerText.includes('datenbank') || lowerText.includes('system') || lowerText.includes('technisch') ||
      lowerText.includes('engineer') || lowerText.includes('developer') || lowerText.includes('programmer') ||
      lowerText.includes('data scientist') || lowerText.includes('data science') || lowerText.includes('machine learning') ||
      lowerText.includes('artificial intelligence') || lowerText.includes('ai') || lowerText.includes('ml') ||
      lowerText.includes('analytics') || lowerText.includes('statistics') || lowerText.includes('algorithm') ||
      lowerText.includes('datenwissenschaft') || lowerText.includes('maschinelles lernen') || lowerText.includes('künstliche intelligenz') ||
      lowerText.includes('analytik') || lowerText.includes('statistik') || lowerText.includes('algorithmus') ||
      lowerText.includes('data analyst') || lowerText.includes('business analyst') || lowerText.includes('datenanalyst') ||
      (lowerText.includes('analyst') && lowerText.includes('data')) ||
      lowerText.includes('software manager') || lowerText.includes('tech manager') || lowerText.includes('it manager') ||
      lowerText.includes('development manager') || lowerText.includes('engineering manager')) {
    return 'tech';
  }
  
  // Gesundheitswesen
  if (lowerText.includes('patient') || lowerText.includes('medical') || lowerText.includes('nursing') ||
      lowerText.includes('clinical') || lowerText.includes('healthcare') || lowerText.includes('care') ||
      lowerText.includes('patient') || lowerText.includes('medizinisch') || lowerText.includes('pflege') ||
      lowerText.includes('klinisch') || lowerText.includes('gesundheit') || lowerText.includes('behandlung')) {
    return 'healthcare';
  }
  

  
  // HR & Personal
  if (lowerText.includes('hr') || lowerText.includes('human resources') || lowerText.includes('recruitment') ||
      lowerText.includes('personnel') || lowerText.includes('employee') || lowerText.includes('hiring') ||
      lowerText.includes('personal') || lowerText.includes('rekrutierung') || lowerText.includes('mitarbeiter') ||
      lowerText.includes('einstellung') || lowerText.includes('personalwesen') ||
      lowerText.includes('hr manager') || lowerText.includes('hr director') || lowerText.includes('hr specialist') ||
      lowerText.includes('talent acquisition') || lowerText.includes('recruiter') || lowerText.includes('headhunter') ||
      lowerText.includes('personalmanager') || lowerText.includes('personalchef') || lowerText.includes('personalreferent') ||
      lowerText.includes('arbeitsvertrag') || lowerText.includes('employment contract') ||
      lowerText.includes('mitarbeiterdaten') || lowerText.includes('employee data') ||
      lowerText.includes('bewerbung') || lowerText.includes('application') ||
      lowerText.includes('onboarding') || lowerText.includes('offboarding')) {
    return 'hr';
  }
  
  // Produktion & Logistik
  if (lowerText.includes('production') || lowerText.includes('manufacturing') || lowerText.includes('logistics') ||
      lowerText.includes('warehouse') || lowerText.includes('supply chain') || lowerText.includes('inventory') ||
      lowerText.includes('produktion') || lowerText.includes('fertigung') || lowerText.includes('logistik') ||
      lowerText.includes('lager') || lowerText.includes('lieferkette') || lowerText.includes('bestand')) {
    return 'production';
  }
  
  // Bildung & Forschung
  if (lowerText.includes('teaching') || lowerText.includes('education') || lowerText.includes('research') ||
      lowerText.includes('academic') || lowerText.includes('university') || lowerText.includes('school') ||
      lowerText.includes('lehre') || lowerText.includes('bildung') || lowerText.includes('forschung') ||
      lowerText.includes('akademisch') || lowerText.includes('universität') || lowerText.includes('schule')) {
    return 'education';
  }
  
  // Recht & Compliance
  if (lowerText.includes('legal') || lowerText.includes('law') || lowerText.includes('compliance') ||
      lowerText.includes('regulatory') || lowerText.includes('contract') || lowerText.includes('attorney') ||
      lowerText.includes('recht') || lowerText.includes('gesetz') || lowerText.includes('compliance') ||
      lowerText.includes('regulatorisch') || lowerText.includes('vertrag') || lowerText.includes('anwalt') ||
      lowerText.includes('arbeitsvertrag') || lowerText.includes('employment contract') ||
      lowerText.includes('vertragsprüfung') || lowerText.includes('contract review')) {
    return 'legal';
  }
  
  // Allgemeine Büro- und Verwaltungsaufgaben
  if (lowerText.includes('verwaltung') || lowerText.includes('administration') ||
      lowerText.includes('büro') || lowerText.includes('office') ||
      lowerText.includes('koordination') || lowerText.includes('coordination') ||
      lowerText.includes('planung') || lowerText.includes('planning') ||
      lowerText.includes('organisation') || lowerText.includes('organization') ||
      lowerText.includes('kommunikation') || lowerText.includes('communication') ||
      lowerText.includes('berichterstattung') || lowerText.includes('reporting') ||
      lowerText.includes('dokumentation') || lowerText.includes('documentation') ||
      lowerText.includes('präsentation') || lowerText.includes('presentation')) {
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

function analyzeTask(taskText: string, jobTitle?: string): Task {
  const lowerText = taskText.toLowerCase();
  
  // Branchenerkennung für die Aufgabe - verwende Job-Titel wenn verfügbar
  const taskIndustry = jobTitle ? detectIndustry(jobTitle + ' ' + taskText) : detectIndustry(taskText);
  
  // Aufgabenkategorie bestimmen
  const taskCategory = detectTaskCategory(taskText);
  
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
  const uniqueTools = [...new Set(recommendedTools)];
  
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