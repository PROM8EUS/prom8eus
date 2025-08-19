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
        'excel', 'daten', 'tabelle', 'reporting', 'report', 'statistik', 'auswertung', 'eingabe', 'erfassung',
        // English
        'data', 'database', 'spreadsheet', 'analytics', 'metrics', 'dashboard', 'entry', 'input', 'processing'
      ],
      weight: 25
    },
    communication: {
      keywords: [
        // German
        'email', 'e-mail', 'nachricht', 'benachrichtigung', 'terminplanung', 'kalender', 'erinnerung',
        // English
        'notification', 'scheduling', 'calendar', 'reminder', 'message', 'communication', 'coordination'
      ],
      weight: 20
    },
    routine: {
      keywords: [
        // German
        'routine', 'wiederkehrend', 'täglich', 'wöchentlich', 'regelmäßig', 'standard', 'prozess',
        // English
        'routine', 'recurring', 'daily', 'weekly', 'regular', 'standard', 'process', 'workflow', 'systematic'
      ],
      weight: 20
    },
    systems: {
      keywords: [
        // German
        'crm', 'erp', 'system', 'software', 'tool', 'plattform', 'dashboard', 'datenbank',
        // English
        'platform', 'infrastructure', 'integration', 'api', 'automation', 'deployment', 'monitoring'
      ],
      weight: 15
    },
    documentation: {
      keywords: [
        // German
        'dokumentation', 'protokoll', 'liste', 'archivierung', 'ablage', 'verwaltung',
        // English
        'documentation', 'logging', 'tracking', 'maintenance', 'updating', 'management'
      ],
      weight: 15
    }
  };

  // Define human-required indicators (with English keywords added)
  const humanSignals = {
    creative: {
      keywords: [
        // German
        'kreativ', 'innovation', 'design', 'konzept', 'strategie', 'vision', 'brainstorming',
        // English
        'creative', 'innovation', 'strategy', 'design', 'conceptual', 'vision', 'ideation', 'brainstorm'
      ],
      weight: 30
    },
    leadership: {
      keywords: [
        // German
        'führung', 'team', 'leitung', 'management', 'mitarbeiter', 'personalentwicklung',
        // English
        'leadership', 'manage', 'lead', 'mentor', 'guide', 'supervise', 'coordinate', 'stakeholder'
      ],
      weight: 25
    },
    consultation: {
      keywords: [
        // German
        'beratung', 'beratend', 'empfehlung', 'expertise', 'fachlich', 'spezialist',
        // English
        'consultation', 'advise', 'recommend', 'expertise', 'specialist', 'counsel', 'guidance'
      ],
      weight: 25
    },
    negotiation: {
      keywords: [
        // German
        'verhandlung', 'verkauf', 'akquise', 'überzeugung', 'kundenbeziehung', 'networking',
        // English
        'negotiation', 'sales', 'persuasion', 'relationship', 'networking', 'client', 'customer'
      ],
      weight: 20
    },
    complex: {
      keywords: [
        // German
        'komplex', 'schwierig', 'herausfordernd', 'problemlösung', 'entscheidung', 'kritisch',
        // English
        'complex', 'difficult', 'challenging', 'problem-solving', 'decision', 'critical', 'judgment'
      ],
      weight: 15
    }
  };

  let automationScore = 0;
  let humanScore = 0;
  let detectedCategory = 'Allgemein';

  // Calculate automation score
  Object.entries(automationSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > 0) {
      automationScore += signal.weight * Math.min(matches, 2); // Cap at 2 matches per category
      detectedCategory = category;
    }
  });

  // Calculate human score
  Object.entries(humanSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > 0) {
      humanScore += signal.weight * Math.min(matches, 2);
      detectedCategory = category;
    }
  });

  // Determine final score and label
  const netScore = Math.max(0, Math.min(100, automationScore - humanScore + 50)); // Base score of 50
  const confidence = Math.abs(netScore - 50) * 2; // Confidence based on deviation from neutral
  
  // Conservative labeling: 
  // - If confidence is 0%, always label as "Mensch" (no confidence = human intervention needed)
  // - Only label as "Automatisierbar" if we have reasonable confidence and score
  const label = (confidence === 0) ? "Mensch" :
                (netScore >= 60 || (netScore >= 50 && confidence >= 20)) ? "Automatisierbar" : "Mensch";

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