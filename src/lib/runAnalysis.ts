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
  
  // Step 1: Extract tasks from text
  const extractedTasks = extractTasks(jobText);
  console.log('Extracted tasks:', extractedTasks.length);

  // Step 2: Analyze and score each task
  const analyzedTasks = extractedTasks.map(taskText => analyzeTask(taskText));

  // Step 3: Calculate aggregated scores
  const totalTasks = analyzedTasks.length;
  const automatisierbareCount = analyzedTasks.filter(t => t.label === "Automatisierbar").length;
  const menschCount = analyzedTasks.filter(t => t.label === "Mensch").length;

  const weightedScore = analyzedTasks.reduce((sum, task) => sum + task.score, 0) / totalTasks;
  
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

function extractTasks(text: string): string[] {
  const tasks: string[] = [];
  
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  
  // Extract bullet points and list items
  const bulletRegex = /(?:^|\n)\s*[-•*]\s*(.+?)(?=\n|$)/gm;
  let match;
  while ((match = bulletRegex.exec(text)) !== null) {
    if (match[1].trim().length > 15) {
      tasks.push(match[1].trim());
    }
  }

  // Extract numbered lists
  const numberedRegex = /(?:^|\n)\s*\d+\.?\s*(.+?)(?=\n|$)/gm;
  while ((match = numberedRegex.exec(text)) !== null) {
    if (match[1].trim().length > 15) {
      tasks.push(match[1].trim());
    }
  }

  // Extract sentences with action verbs (German)
  const actionVerbs = [
    'planen', 'koordinieren', 'erstellen', 'entwickeln', 'verwalten', 'organisieren',
    'durchführen', 'bearbeiten', 'überwachen', 'analysieren', 'dokumentieren',
    'erstellen', 'pflegen', 'betreuen', 'unterstützen', 'leiten', 'führen',
    'beraten', 'kommunizieren', 'präsentieren', 'verhandeln', 'verkaufen'
  ];

  sentences.forEach(sentence => {
    const hasActionVerb = actionVerbs.some(verb => 
      sentence.toLowerCase().includes(verb)
    );
    
    if (hasActionVerb && sentence.length > 20 && sentence.length < 200) {
      tasks.push(sentence);
    }
  });

  // Remove duplicates and very similar tasks
  const uniqueTasks = tasks.filter((task, index, arr) => {
    return arr.findIndex(t => calculateSimilarity(t.toLowerCase(), task.toLowerCase()) > 0.8) === index;
  });

  return uniqueTasks.slice(0, 15); // Limit to 15 most relevant tasks
}

function analyzeTask(taskText: string): Task {
  const lowerText = taskText.toLowerCase();
  
  // Define automation indicators
  const automationSignals = {
    dataProcessing: {
      keywords: ['excel', 'daten', 'tabelle', 'reporting', 'report', 'statistik', 'auswertung', 'eingabe', 'erfassung'],
      weight: 25
    },
    communication: {
      keywords: ['email', 'e-mail', 'nachricht', 'benachrichtigung', 'terminplanung', 'kalender', 'erinnerung'],
      weight: 20
    },
    routine: {
      keywords: ['routine', 'wiederkehrend', 'täglich', 'wöchentlich', 'regelmäßig', 'standard', 'prozess'],
      weight: 20
    },
    systems: {
      keywords: ['crm', 'erp', 'system', 'software', 'tool', 'plattform', 'dashboard', 'datenbank'],
      weight: 15
    },
    documentation: {
      keywords: ['dokumentation', 'protokoll', 'liste', 'archivierung', 'ablage', 'verwaltung'],
      weight: 15
    }
  };

  // Define human-required indicators
  const humanSignals = {
    creative: {
      keywords: ['kreativ', 'innovation', 'design', 'konzept', 'strategie', 'vision', 'brainstorming'],
      weight: 30
    },
    leadership: {
      keywords: ['führung', 'team', 'leitung', 'management', 'mitarbeiter', 'personalentwicklung'],
      weight: 25
    },
    consultation: {
      keywords: ['beratung', 'beratend', 'empfehlung', 'expertise', 'fachlich', 'spezialist'],
      weight: 25
    },
    negotiation: {
      keywords: ['verhandlung', 'verkauf', 'akquise', 'überzeugung', 'kundenbeziehung', 'networking'],
      weight: 20
    },
    complex: {
      keywords: ['komplex', 'schwierig', 'herausfordernd', 'problemlösung', 'entscheidung', 'kritisch'],
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
  const label = netScore >= 50 ? "Automatisierbar" : "Mensch";
  const confidence = Math.abs(netScore - 50) * 2; // Confidence based on deviation from neutral

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