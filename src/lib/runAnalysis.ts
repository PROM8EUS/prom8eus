import { extractTasks as extractTasksAdvanced } from './extractTasks';

interface Task {
  text: string;
  score: number;
  label: "Automatisierbar" | "Mensch";
  category: string;
  confidence: number;
  humanRatio: number; // Percentage of human work required (0-100)
  automationRatio: number; // Percentage that can be automated (0-100)
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
  
  // Step 1: Extract tasks using the advanced extractor
  const rawTasks = extractTasksAdvanced(jobText);
  console.log('Raw tasks extracted:', rawTasks.length, rawTasks.map(t => `${t.text} (${t.source})`));
  
  // Convert to text array for analysis
  const extractedTasks = rawTasks.map(t => t.text);
  console.log('Tasks for analysis:', extractedTasks.length);

  // Step 2: Analyze and score each task
  const analyzedTasks = extractedTasks.map(taskText => analyzeTask(taskText));

  // Step 3: Calculate aggregated scores - make them consistent
  const totalTasks = analyzedTasks.length;
  const automatisierbareCount = analyzedTasks.filter(t => t.label === "Automatisierbar").length;
  const menschCount = analyzedTasks.filter(t => t.label === "Mensch").length;

  // Calculate the overall automation potential based on task scores (weighted average)
  const weightedScore = totalTasks > 0 ? analyzedTasks.reduce((sum, task) => sum + task.score, 0) / totalTasks : 0;
  
  // The ratio should reflect the overall automation potential, not just task counts
  const overallAutomationPotential = Math.round(weightedScore);
  const ratio = {
    automatisierbar: overallAutomationPotential,
    mensch: 100 - overallAutomationPotential
  };
  
  // Debug logging to verify consistency



  // Step 4: Generate summary and recommendations
  console.log('DEBUG: Calling generateSummary with lang =', lang);
  const summary = generateSummary(overallAutomationPotential, ratio, totalTasks, lang);
  console.log('DEBUG: Generated summary =', summary);
  const recommendations = generateRecommendations(analyzedTasks, overallAutomationPotential);

  return {
    totalScore: overallAutomationPotential,
    ratio,
    tasks: analyzedTasks,
    summary,
    recommendations
  };
}

// Remove the old extractTasks function - now using the advanced extractor

function analyzeTask(taskText: string): Task {
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
      weight: 35, // Reduced weight - even with AI assistance, human oversight needed
      aiTools: ['ChatGPT', 'GitHub Copilot', 'Grok', 'Claude', 'CodeWhisperer']
    },
    dataAnalysis: {
      keywords: [
        // German - Datenanalyse und -verarbeitung
        'datenanalyse', 'auswertung', 'statistik', 'kennzahlen', 'reporting', 'dashboard',
        'excel', 'tabelle', 'datenerfassung', 'dateneingabe', 'datenverarbeitung',
        'analytics', 'metrics', 'kpi', 'bericht', 'report', 'visualisierung',
        // English
        'data analysis', 'analytics', 'statistics', 'metrics', 'reporting', 'dashboard',
        'excel', 'spreadsheet', 'data entry', 'data processing', 'visualization'
      ],
      weight: 30,
      aiTools: ['ChatGPT', 'Claude', 'Grok', 'Excel AI', 'Tableau AI']
    },
    documentation: {
      keywords: [
        // German - Dokumentation und Kommunikation
        'dokumentation', 'protokoll', 'aufzeichnung', 'dokumentieren', 'notieren',
        'e-mail', 'email', 'kommunikation', 'bericht', 'report', 'zusammenfassung',
        'terminplanung', 'kalender', 'erinnerung', 'benachrichtigung',
        // English
        'documentation', 'recording', 'logging', 'documenting', 'noting',
        'email', 'communication', 'report', 'summary', 'scheduling', 'calendar'
      ],
      weight: 25,
      aiTools: ['ChatGPT', 'Claude', 'Grok', 'Notion AI', 'Grammarly']
    },
    systemIntegration: {
      keywords: [
        // German - Systemintegration und -verwaltung
        'integration', 'api', 'synchronisation', 'datenübertragung', 'systemverbindung',
        'crm', 'erp', 'software', 'datenbank', 'system', 'buchung', 'rechnung',
        'fakturierung', 'bestellung', 'verwaltung im system', 'datev',
        // English
        'integration', 'api', 'synchronization', 'data transfer', 'system connection',
        'order processing', 'system entry', 'database', 'invoicing', 'billing'
      ],
      weight: 45,
      aiTools: ['ChatGPT', 'Zapier', 'n8n', 'Make.com', 'IFTTT']
    },
    accounting: {
      keywords: [
        // German - Buchhaltung und Finanzen
        'buchhaltung', 'finanzbuchhaltung', 'kontierung', 'belege', 'rechnungswesen',
        'abschluss', 'monatsabschluss', 'jahresabschluss', 'umsatzsteuer',
        'mahnwesen', 'zahlungsverkehr', 'kontoabstimmung', 'buchen', 'verbuchen',
        // English
        'bookkeeping', 'accounting', 'posting', 'vouchers', 'invoicing', 'reconciliation'
      ],
      weight: 40,
      aiTools: ['ChatGPT', 'Claude', 'Datev AI', 'Sage AI', 'QuickBooks AI']
    },
    collaboration: {
      keywords: [
        // German - Zusammenarbeit mit KI-Unterstützung
        'zusammenarbeit', 'kooperation', 'abstimmung', 'koordination', 'teamarbeit',
        'agil', 'agile', 'scrum', 'kanban', 'meeting', 'besprechung', 'planning',
        'code-review', 'code review', 'testing', 'qualitätssicherung',
        // English
        'collaboration', 'cooperation', 'coordination', 'teamwork', 'agile', 'scrum',
        'kanban', 'meeting', 'planning', 'code review', 'testing', 'quality assurance'
      ],
      weight: 35,
      aiTools: ['ChatGPT', 'Claude', 'Grok', 'Slack AI', 'Microsoft Teams AI']
    },
    physicalTasks: {
      keywords: [
        // German - Physische Aufgaben mit Automatisierungspotenzial
        'schneiden', 'schneidet', 'schneidest', 'packen', 'packt', 'packst', 'sortieren', 'sortiert', 'sortierst',
        'bearbeiten', 'bearbeitet', 'bearbeitest', 'verarbeiten', 'verarbeitet', 'verarbeitest',
        'kontrollieren', 'kontrolliert', 'kontrollierst', 'prüfen', 'prüft', 'prüfst',
        'lagerst', 'lagern', 'lagert', 'transportieren', 'transportiert', 'transportierst',
        'liefern', 'liefert', 'lieferst', 'versenden', 'versendet', 'versendest',
        'verpacken', 'verpackt', 'verpackst', 'etikettieren', 'etikettiert', 'etikettierst',
        'montieren', 'montiert', 'montierst', 'assemblieren', 'assembliert', 'assemblierst',
        'produzieren', 'produziert', 'produzierst', 'fertigen', 'fertigt', 'fertigst',
        'reparieren', 'repariert', 'reparierst', 'installieren', 'installiert', 'installierst',
        'wartet', 'wartest', 'wartet', 'testen', 'testet', 'testest',
        // English
        'cut', 'cutting', 'pack', 'packing', 'sort', 'sorting', 'process', 'processing',
        'check', 'checking', 'inspect', 'inspecting', 'store', 'storing',
        'transport', 'transporting', 'deliver', 'delivering', 'ship', 'shipping',
        'package', 'packaging', 'label', 'labeling', 'assemble', 'assembling',
        'produce', 'producing', 'manufacture', 'manufacturing', 'repair', 'repairing',
        'install', 'installing', 'maintain', 'maintaining', 'test', 'testing'
      ],
      weight: 40,
      aiTools: ['Robotics', 'Automated Systems', 'IoT Sensors', 'Computer Vision']
    }
  };

  // Define human-required indicators (expanded scope for realistic assessment)
  const humanSignals = {
    // Customer interaction and communication
    customerInteraction: {
      keywords: [
        // German - Customer interaction tasks
        'beratung', 'kundenberatung', 'telefonische beratung', 'persönliche beratung',
        'kundenservice', 'kundenkontakt', 'kundengespräch', 'kundensupport',
        'verkaufsgespräch', 'akquise', 'kundengewinnung', 'kundenbetreuung',
        'kundenzufriedenheit', 'kundenbeziehung', 'kundenpflege',
        // English
        'consultation', 'customer service', 'customer support', 'customer contact',
        'sales conversation', 'customer acquisition', 'customer care',
        'customer satisfaction', 'customer relationship', 'customer retention'
      ],
      weight: 65
    },
    // Interpersonal and communication skills
    interpersonalCommunication: {
      keywords: [
        // German - Interpersonal communication
        'kommunikation', 'gespräch', 'verhandlung', 'überzeugung', 'präsentation',
        'meeting', 'besprechung', 'teamarbeit', 'zusammenarbeit', 'koordination',
        'abstimmung', 'rücksprache', 'feedback', 'schulung', 'training',
        'moderation', 'mediation', 'konfliktlösung', 'diplomatie',
        // English
        'communication', 'conversation', 'negotiation', 'persuasion', 'presentation',
        'meeting', 'discussion', 'teamwork', 'collaboration', 'coordination',
        'consultation', 'feedback', 'training', 'moderation', 'mediation',
        'conflict resolution', 'diplomacy'
      ],
      weight: 55
    },
    // Emotional intelligence and empathy
    emotionalIntelligence: {
      keywords: [
        // German - Emotional Intelligence (hard to automate)
        'empathie', 'einfühlungsvermögen', 'emotionale unterstützung', 'psychologische beratung',
        'trauerbegleitung', 'konfliktmediation', 'therapie', 'coaching', 'mentoring',
        'zwischenmenschliche beziehungen', 'vertrauensaufbau', 'motivation', 'inspiration',
        'geduld', 'höflichkeit', 'respekt', 'verständnis', 'zwischenmenschlich',
        // English
        'empathy', 'emotional support', 'psychological counseling', 'grief counseling',
        'conflict mediation', 'therapy', 'coaching', 'mentoring', 'interpersonal relationships',
        'trust building', 'motivation', 'inspiration', 'patience', 'courtesy', 'respect'
      ],
      weight: 60
    },
    // Physical interaction and manual tasks
    physicalInteraction: {
      keywords: [
        // German - Physical tasks
        'körperlich', 'handwerk', 'reparatur', 'wartung vor ort', 'installation',
        'lieferung', 'transport', 'kundenservice vor ort', 'schulung vor ort',
        'schneiden', 'packen', 'sortieren', 'bearbeiten', 'verarbeiten',
        'kontrollieren', 'prüfen', 'testen', 'montieren', 'assemblieren',
        // English
        'physical', 'manual work', 'repair', 'on-site maintenance', 'installation',
        'delivery', 'transport', 'on-site customer service', 'on-site training',
        'cutting', 'packing', 'sorting', 'processing', 'inspecting', 'testing'
      ],
      weight: 55
    },
    // Complex decision making and judgment
    complexDecisionMaking: {
      keywords: [
        // German - Complex strategic decisions
        'strategische entscheidung', 'unternehmensführung', 'investitionsentscheidung',
        'risikobewertung', 'krisenmanagement', 'notfall', 'kritische situation',
        'ethische entscheidung', 'moralische abwägung', 'komplexe urteile',
        'entscheidung', 'entscheidungsfindung', 'beurteilung', 'einschätzung',
        'bewertung', 'analyse', 'diagnose', 'prognose', 'planung',
        // English
        'strategic decision', 'executive leadership', 'investment decision',
        'risk assessment', 'crisis management', 'emergency', 'critical situation',
        'ethical decision', 'moral judgment', 'complex judgments', 'decision making',
        'assessment', 'evaluation', 'analysis', 'diagnosis', 'prognosis', 'planning'
      ],
      weight: 50
    },
    // Creative and innovative thinking
    creativeInnovation: {
      keywords: [
        // German - Creative innovation (not routine creativity)
        'kreativ', 'kreative innovation', 'disruptive idee', 'revolutionär', 'bahnbrechend',
        'künstlerische schöpfung', 'originale konzeption', 'visionäre entwicklung',
        'innovation', 'design', 'konzept', 'strategie', 'vision', 'brainstorming',
        'entwicklung', 'ideen', 'lösungen', 'ansätze', 'methoden',
        // English
        'creative', 'creative innovation', 'disruptive idea', 'revolutionary', 'groundbreaking',
        'artistic creation', 'original conception', 'visionary development',
        'innovation', 'design', 'concept', 'strategy', 'vision', 'ideation'
      ],
      weight: 45
    }
  };

  let automationScore = 0;
  let humanScore = 0;
  let detectedCategory = 'Allgemein';

  // Calculate automation score
  Object.entries(automationSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length > 0) {
  
      automationScore += signal.weight * Math.min(matches.length, 3);
      detectedCategory = category;
    }
  });

  // Calculate human score  
  Object.entries(humanSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length > 0) {
  
      humanScore += signal.weight * Math.min(matches.length, 3);
      detectedCategory = category;
    }
  });



  // Determine final score and label with AI assistance consideration
  const baseScore = 35; // Higher base score for AI assistance
  let netScore = Math.max(0, Math.min(100, automationScore - humanScore + baseScore));
  
  // Cap automation scores realistically - never 100% if human interaction is needed
  if (netScore > 85) {
    netScore = 85; // Maximum realistic automation score
  }
  
  // Improved confidence calculation
  const totalSignalStrength = Math.max(automationScore, humanScore);
  const confidence = Math.min(95, Math.max(15, (totalSignalStrength / 30) * 60));
  
  // Much more realistic assessment - most tasks require human involvement
  let label: "Automatisierbar" | "Mensch";
  if (automationScore >= 40 && humanScore < 20) {
    // Only truly automatable tasks with strong automation signals and weak human signals
    label = "Automatisierbar";
  } else if (humanScore >= 25) {
    // Most tasks require human interaction
    label = "Mensch";
  } else {
    // Default to human - most tasks require human involvement
    label = "Mensch";
  }
  
  // Adjust score based on task complexity and human interaction needed
  if (label === "Automatisierbar") {
    // Reduce score for tasks that require human oversight or decision-making
    if (taskText.includes('entwicklung') || taskText.includes('programmierung') || taskText.includes('coding')) {
      netScore = Math.min(netScore, 75); // Software development needs human oversight
    }
    if (taskText.includes('zusammenarbeit') || taskText.includes('team') || taskText.includes('agil')) {
      netScore = Math.min(netScore, 70); // Collaboration requires human interaction
    }
    if (taskText.includes('debugging') || taskText.includes('fehlerbehebung')) {
      netScore = Math.min(netScore, 65); // Debugging often needs human judgment
    }
    if (taskText.includes('code review') || taskText.includes('testing')) {
      netScore = Math.min(netScore, 60); // Reviews and testing need human validation
    }
  }

  // Calculate human vs automation ratios - make them consistent with the score
  let humanRatio = 0;
  let automationRatio = 0;
  
  // The score represents the automation potential, so use it directly
  automationRatio = Math.round(netScore);
  humanRatio = 100 - automationRatio;
  
  // Ensure realistic minimums based on the label
  if (label === "Automatisierbar") {
    // Even automatable tasks need some human oversight
    humanRatio = Math.max(humanRatio, 15);
    automationRatio = Math.min(automationRatio, 85);
  } else {
    // Human tasks should have significant human involvement
    humanRatio = Math.max(humanRatio, 60);
    automationRatio = Math.min(automationRatio, 40);
  }
  
  // Recalculate to ensure they add up to 100
  const total = humanRatio + automationRatio;
  if (total !== 100) {
    if (label === "Automatisierbar") {
      automationRatio = Math.round((automationRatio / total) * 100);
      humanRatio = 100 - automationRatio;
    } else {
      humanRatio = Math.round((humanRatio / total) * 100);
      automationRatio = 100 - humanRatio;
    }
  }

  return {
    text: taskText,
    score: netScore,
    label,
    category: detectedCategory,
    confidence: Math.min(100, confidence),
    humanRatio,
    automationRatio
  };
}

export function generateSummary(totalScore: number, ratio: { automatisierbar: number; mensch: number }, taskCount: number, lang: 'de' | 'en' = 'de'): string {
  console.log('DEBUG generateSummary: lang =', lang, 'taskCount =', taskCount);
  
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
  
  console.log('DEBUG generateSummary: returning:', summary);
  return summary;
}

function generateRecommendations(tasks: Task[], totalScore: number): string[] {
  const recommendations: string[] = [];
  
  // Count task categories
  const automationTasks = tasks.filter(t => t.label === "Automatisierbar");
  const categories = automationTasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (totalScore >= 70) {
    recommendations.push('Hohe Automatisierungseignung - Implementierung von Workflow-Tools empfohlen');
  }
  
  if (categories['dataProcessing'] >= 2) {
    recommendations.push('Excel-Automatisierung oder Business Intelligence Tools einsetzen');
  }
  
  if (categories['communication'] >= 2) {
    recommendations.push('Email-Automatisierung und Terminplanungstools implementieren');
  }
  
  if (categories['systems'] >= 2) {
    recommendations.push('API-Integrationen zwischen bestehenden Systemen prüfen');
  }
  
  if (totalScore < 40) {
    recommendations.push('Fokus auf menschliche Stärken - Automatisierung nur für unterstützende Prozesse');
  }

  return recommendations.length > 0 ? recommendations : ['Individuelle Analyse der Arbeitsprozesse für spezifische Empfehlungen durchführen'];
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word)).length;
  return commonWords / Math.max(words1.length, words2.length);
}