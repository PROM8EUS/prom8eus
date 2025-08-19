import { extractTasks as extractTasksAdvanced } from './extractTasks';

interface Task {
  text: string;
  score: number;
  label: "Automatisierbar" | "Mensch";
  category: string;
  confidence: number;
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

export function runAnalysis(jobText: string): AnalysisResult {
  console.log('Starting job analysis with text length:', jobText.length);
  
  // Step 1: Extract tasks using the advanced extractor
  const rawTasks = extractTasksAdvanced(jobText);
  console.log('Raw tasks extracted:', rawTasks.length, rawTasks.map(t => `${t.text} (${t.source})`));
  
  // Convert to text array for analysis
  const extractedTasks = rawTasks.map(t => t.text);
  console.log('Tasks for analysis:', extractedTasks.length);

  // Step 2: Analyze and score each task
  const analyzedTasks = extractedTasks.map(taskText => analyzeTask(taskText));

  // Step 3: Calculate aggregated scores
  const totalTasks = analyzedTasks.length;
  const automatisierbareCount = analyzedTasks.filter(t => t.label === "Automatisierbar").length;
  const menschCount = analyzedTasks.filter(t => t.label === "Mensch").length;

  const weightedScore = totalTasks > 0 ? analyzedTasks.reduce((sum, task) => sum + task.score, 0) / totalTasks : 0;
  
  const ratio = {
    automatisierbar: totalTasks > 0 ? Math.round((automatisierbareCount / totalTasks) * 100) : 0,
    mensch: totalTasks > 0 ? Math.round((menschCount / totalTasks) * 100) : 0
  };

  // Step 4: Generate summary and recommendations
  const summary = generateSummary(weightedScore, ratio, totalTasks);
  const recommendations = generateRecommendations(analyzedTasks, weightedScore);

  return {
    totalScore: Math.round(weightedScore),
    ratio,
    tasks: analyzedTasks,
    summary,
    recommendations
  };
}

// Remove the old extractTasks function - now using the advanced extractor

function analyzeTask(taskText: string): Task {
  const lowerText = taskText.toLowerCase();
  
  // Define automation indicators (with English keywords added)
  const automationSignals = {
    dataProcessing: {
      keywords: [
        // German
        'datenerfassung', 'dateneingabe', 'datenverarbeitung', 'auswertung', 'statistik', 'reporting', 'report',
        'excel', 'tabelle', 'eingabe', 'erfassung', 'archivierung', 'verwaltung', 'aktualisierung',
        // English  
        'data entry', 'data processing', 'analytics', 'metrics', 'dashboard', 'input', 'processing', 'reporting'
      ],
      weight: 30
    },
    systemWork: {
      keywords: [
        // German
        'auftragserfassung', 'systembearbeitung', 'crm', 'erp', 'software', 'datenbank', 'system',
        'buchung', 'rechnung', 'fakturierung', 'bestellung', 'verwaltung im system',
        // English
        'order processing', 'system entry', 'database', 'invoicing', 'billing', 'system management'
      ],
      weight: 30
    },
    communication: {
      keywords: [
        // German - nur automatisierbare Kommunikation
        'e-mail bearbeitung', 'email bearbeitung', 'terminplanung', 'kalender', 'erinnerung', 'benachrichtigung',
        'nachricht versenden', 'status updates', 'dokumentation', 'protokoll',
        // English
        'email processing', 'scheduling', 'calendar management', 'notifications', 'status updates'
      ],
      weight: 25
    },
    routine: {
      keywords: [
        // German
        'routine', 'wiederkehrend', 'täglich', 'wöchentlich', 'regelmäßig', 'standard', 'prozess',
        'abwicklung', 'bearbeitung von', 'durchführung von',
        // English
        'routine', 'recurring', 'daily', 'weekly', 'regular', 'standard', 'process', 'workflow'
      ],
      weight: 20
    }
  };

  // Define human-required indicators (with English keywords added)
  const humanSignals = {
    interpersonal: {
      keywords: [
        // German - interpersonal skills, personality traits, social abilities
        'beratung', 'kundenberatung', 'telefonische beratung', 'persönliche beratung', 'verkaufsgespräch',
        'freundlich', 'professionell', 'auftreten', 'erscheinungsbild', 'kommunikativ', 'empathie', 'einfühlungsvermögen',
        'geduld', 'höflichkeit', 'respekt', 'verständnis', 'zwischenmenschlich', 'sozial', 'charisma', 'ausstrahlung',
        'persönlichkeit', 'menschlich', 'emotional', 'diplomatie', 'takt', 'fingerspitzengefühl',
        'kundenservice', 'kundenkontakt', 'beziehungsaufbau',
        // English
        'customer service', 'consultation', 'personal advice', 'sales conversation', 'relationship building',
        'friendly', 'professional', 'demeanor', 'appearance', 'interpersonal', 'empathy', 'patience', 
        'courtesy', 'respect', 'understanding', 'social', 'charisma', 'personality', 'emotional', 'diplomacy'
      ],
      weight: 50
    },
    salesNegotiation: {
      keywords: [
        // German
        'verkauf', 'verkaufen', 'vertrieb', 'akquise', 'verhandlung', 'überzeugung', 'produktberatung',
        'abschluss', 'deal', 'verkaufsgespräch', 'kundengewinnung', 'umsatz',
        // English
        'sales', 'selling', 'negotiation', 'persuasion', 'closing', 'deal', 'revenue', 'acquisition'
      ],
      weight: 45
    },
    creative: {
      keywords: [
        // German
        'kreativ', 'innovation', 'design', 'konzept', 'strategie', 'vision', 'brainstorming', 'entwicklung',
        // English
        'creative', 'innovation', 'strategy', 'design', 'conceptual', 'vision', 'ideation', 'brainstorm'
      ],
      weight: 35
    },
    leadership: {
      keywords: [
        // German
        'führung', 'team', 'leitung', 'management', 'mitarbeiter', 'personalentwicklung', 'koordination',
        // English
        'leadership', 'manage', 'lead', 'mentor', 'guide', 'supervise', 'coordinate', 'stakeholder'
      ],
      weight: 30
    },
    problemSolving: {
      keywords: [
        // German
        'reklamation', 'beschwerde', 'problemlösung', 'konflikt', 'schwierige situation', 'komplexe fälle',
        'entscheidung', 'kritisch', 'herausfordernd', 'individuell',
        // English
        'complaint', 'problem solving', 'conflict', 'complex cases', 'decision making', 'critical', 'challenging'
      ],
      weight: 30
    }
  };

  let automationScore = 0;
  let humanScore = 0;
  let detectedCategory = 'Allgemein';

  // Calculate automation score
  Object.entries(automationSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > 0) {
      automationScore += signal.weight * Math.min(matches, 3); // Erhöht auf max 3 matches
      detectedCategory = category;
    }
  });

  // Calculate human score  
  Object.entries(humanSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > 0) {
      humanScore += signal.weight * Math.min(matches, 3); // Erhöht auf max 3 matches
      detectedCategory = category;
    }
  });

  // Determine final score and label
  const baseScore = 30; // Niedrigerer Basis-Score für konservativere Bewertung
  const netScore = Math.max(0, Math.min(100, automationScore - humanScore + baseScore));
  
  // Bessere Confidence-Berechnung basierend auf tatsächlichen Matches
  const totalMatches = Math.max(automationScore, humanScore) / 25; // Durchschnittliches Gewicht
  const confidence = Math.min(95, Math.max(10, totalMatches * 25)); // Mindestens 10%, max 95%
  
  // Noch konservativere Bewertung:
  // - Wenn human signals erkannt werden, immer "Mensch"
  // - Nur als "Automatisierbar" wenn klare automation signals UND keine human signals
  let label: "Automatisierbar" | "Mensch";
  if (humanScore > 0) {
    label = "Mensch";
  } else if (automationScore >= 25 && netScore >= 60) {
    label = "Automatisierbar";
  } else {
    label = "Mensch"; // Default zu Mensch bei Unsicherheit
  }

  return {
    text: taskText,
    score: netScore,
    label,
    category: detectedCategory,
    confidence: Math.min(100, confidence)
  };
}

function generateSummary(totalScore: number, ratio: { automatisierbar: number; mensch: number }, taskCount: number): string {
  const scoreCategory = totalScore >= 75 ? 'hoch' : totalScore >= 50 ? 'mittel' : 'niedrig';
  
  return `Analyse von ${taskCount} identifizierten Aufgaben ergab ein ${scoreCategory}es Automatisierungspotenzial von ${totalScore}%. ${ratio.automatisierbar}% der Aufgaben sind potentiell automatisierbar, ${ratio.mensch}% erfordern menschliche Fähigkeiten.`;
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