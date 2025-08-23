import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as cheerio from "https://esm.sh/cheerio@1.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface AnalyzeInputRequest {
  url?: string;
  rawText?: string;
}

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

interface RawTask { 
  text: string; 
  source: "bullet" | "verbline" | "sentence"; 
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, rawText }: AnalyzeInputRequest = await req.json();
    
    console.log('Starting unified analysis for:', { hasUrl: !!url, hasRawText: !!rawText });

    let analysisText = rawText || '';

    // For now, just handle rawText (URL processing can be added later)
    if (!analysisText || analysisText.trim().length < 5) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Zu wenig Inhalt gefunden. Bitte fügen Sie mehr Text ein." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // For very short inputs (likely single tasks), create a simple task structure
    if (analysisText.length < 100 && !analysisText.includes('\n') && analysisText.split(' ').length <= 10) {
      console.log('Detected simple task input, analyzing as single task');
      // Wrap single task in a structure that the analysis can work with
      analysisText = `Aufgabe: ${analysisText.trim()}`;
    }

    console.log(`Analyzing text with ${analysisText.length} characters`);
    console.log('Analysis text sample:', analysisText.substring(0, 300));

    // Run analysis on the text (hard cap at 10,000 characters)
    const result = runAnalysis(analysisText.slice(0, 10000));
    
    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          originalText: analysisText, // Store full original text for sharing
          ...result
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in analyze-input-unified:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function runAnalysis(jobText: string): AnalysisResult {
  console.log('Starting enhanced job analysis with text length:', jobText.length);
  
  // Step 1: Extract tasks using the advanced extractor
  const rawTasks = extractTasks(jobText);
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
    totalScore: Math.round(weightedScore * 100) / 100,
    ratio,
    tasks: analyzedTasks,
    summary,
    recommendations,
    automationTrends
  };
}

function extractTasks(text: string): RawTask[] {
  const lines = text.split(/\r?\n/).map(l => clean(l)).filter(Boolean);
  
  // Branchenerkennung
  const detectedIndustry = detectIndustry(text);
  console.log(`Detected industry: ${detectedIndustry}`);

  // 1) Relevanten Abschnitt finden: ab "Aufgaben/Responsibilities" 
  let startIdx = -1;
  const SECTION_START = /aufgaben|responsibilities|duties|role/i;
  for (let i = 0; i < lines.length; i++) {
    if (SECTION_START.test(lines[i])) { 
      startIdx = i; 
      break; 
    }
  }
  
  // Falls kein expliziter Aufgaben-Abschnitt gefunden, nehme den ganzen Text
  let scoped = startIdx >= 0 ? lines.slice(startIdx + 1) : lines;

  // 2) Bis zur nächsten irrelevanten Section
  const SECTION_END = /anforderungen|requirements|qualifikationen|qualifications/i;
  const stopAt = scoped.findIndex(l => SECTION_END.test(l));
  if (stopAt >= 0) scoped = scoped.slice(0, stopAt);

  // 3) Bullets einsammeln (priorisiert)
  const bullets: RawTask[] = [];
  const BULLET = /^\s*(?:[-–—*•●▪▫◦‣⁃]|[0-9]+\.|\([0-9]+\)|[a-z]\.|\([a-z]\))\s+(.+)$/i;
  
  for (const l of scoped) {
    if (isHeadingOrIntro(l) || isFluff(l) || isQualification(l)) continue;
    
    const m = l.match(BULLET);
    if (m && m[1] && m[1].length >= 10) { // Mindestlänge für sinnvolle Tasks
      const cleanText = clean(m[1]);
      if (!isQualification(cleanText)) { // Doppelte Prüfung nach dem Cleaning
        const txt = shorten(cleanText);
        if (txt.length >= 10) bullets.push({ text: txt, source: "bullet" });
      }
    }
  }

  console.log(`Found ${bullets.length} bullet points for industry: ${detectedIndustry}`);
  return bullets;
}

// Qualifikations-Keywords die keine Aufgaben sind
const QUALIFICATION_PATTERNS = [
  // Bildung & Abschlüsse
  /\b(ausbildung|studium|abschluss|degree|education|background|certified|certification)\b/i,
  /\b(steuerfachangestellte|buchhalter|accountant|tax specialist|steuerberatung)\b/i,
  
  // Erfahrung & Zeit
  /\b(erfahrung|experience|jahre|years|berufserfahrung|work experience)\b/i,
  /\b(mehrjährig|langjährig|long-term|several years)\b/i,
  
  // Kenntnisse & Fähigkeiten (erweitert)
  /\b(kenntnisse|knowledge|skills|fähigkeiten|fertigkeiten|competence|proficiency|vertraut|familiar)\b/i,
  /\b(datev|sap|software kenntnisse|tool kenntnisse|system kenntnisse|application knowledge)\b/i,
  /\b(pc-kenntnisse|computer skills|it-kenntnisse|software skills|ms office)\b/i,
  /\b(sprachkenntnisse|language|englisch|deutsch|english|german|französisch|french)\b/i,
  
  // Eigenschaften & Soft Skills (erweitert)
  /\b(genauigkeit|zuverlässigkeit|accuracy|reliability|sorgfalt|precision)\b/i,
  /\b(kommunikationsstärke|communication skills|soft skills|social skills)\b/i,
  /\b(teamfähigkeit|team player|leadership skills|führungskompetenz)\b/i,
  /\b(belastbarkeit|stress resistance|flexibilität|flexibility)\b/i,
  /\b(geduld|patience|empathie|empathy|freundlich|friendly|höflich|polite)\b/i,
  /\b(professionell|professional)\s+(auftreten|demeanor|erscheinung|behavior)\b/i,
  
  // Rechtliche & fachliche Kenntnisse
  /\b(steuerrechtlich|tax law|rechtlich|legal|compliance|regulatory)\b/i,
  /\b(bilanzierung|accounting standards|gaap|ifrs|hgb)\b/i,
  
  // Voraussetzungen
  /\b(voraussetzung|requirement|must have|should have|preferred|wünschenswert|nice to have)\b/i,
  /\b(berechtigung|lizenz|license|permit|authorization|zertifikat|certificate)\b/i,
  /^\s*(?:mindestens|minimum|at least)\s+\d+/i, // "Mindestens 3 Jahre"
  
  // Bildungsabschlüsse
  /\b(?:bachelor|master|diplom|phd|dr\.|mba|fachhochschule|universität|university)\b/i,
  /\b(?:kaufmännisch|commercial|business|wirtschafts|betriebswirt)\b/i
];

function detectIndustry(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('software') || lowerText.includes('entwicklung') || lowerText.includes('programmierung') || lowerText.includes('coding') || lowerText.includes('web') || lowerText.includes('app') || lowerText.includes('api') || lowerText.includes('system') || lowerText.includes('database') || lowerText.includes('code')) {
    return 'tech';
  }
  if (lowerText.includes('patient') || lowerText.includes('pflege') || lowerText.includes('arzt') || lowerText.includes('klinik') || lowerText.includes('medizin') || lowerText.includes('healthcare') || lowerText.includes('nursing') || lowerText.includes('doctor') || lowerText.includes('hospital') || lowerText.includes('medical')) {
    return 'healthcare';
  }
  if (lowerText.includes('buchhaltung') || lowerText.includes('finanz') || lowerText.includes('steuer') || lowerText.includes('accounting') || lowerText.includes('finance') || lowerText.includes('tax') || lowerText.includes('audit') || lowerText.includes('controlling') || lowerText.includes('billing') || lowerText.includes('payroll')) {
    return 'finance';
  }
  if (lowerText.includes('marketing') || lowerText.includes('kampagne') || lowerText.includes('werbung') || lowerText.includes('vertrieb') || lowerText.includes('sales') || lowerText.includes('advertising') || lowerText.includes('campaign') || lowerText.includes('social media') || lowerText.includes('seo') || lowerText.includes('content')) {
    return 'marketing';
  }
  if (lowerText.includes('personal') || lowerText.includes('hr') || lowerText.includes('rekrutierung') || lowerText.includes('einstellung') || lowerText.includes('mitarbeiter') || lowerText.includes('human resources') || lowerText.includes('recruitment') || lowerText.includes('hiring') || lowerText.includes('employee') || lowerText.includes('onboarding')) {
    return 'hr';
  }
  if (lowerText.includes('produktion') || lowerText.includes('fertigung') || lowerText.includes('lager') || lowerText.includes('logistik') || lowerText.includes('production') || lowerText.includes('manufacturing') || lowerText.includes('warehouse') || lowerText.includes('logistics') || lowerText.includes('quality control') || lowerText.includes('maintenance')) {
    return 'production';
  }
  if (lowerText.includes('lehre') || lowerText.includes('unterricht') || lowerText.includes('forschung') || lowerText.includes('bildung') || lowerText.includes('teaching') || lowerText.includes('instruction') || lowerText.includes('research') || lowerText.includes('education') || lowerText.includes('curriculum') || lowerText.includes('academic')) {
    return 'education';
  }
  if (lowerText.includes('recht') || lowerText.includes('legal') || lowerText.includes('compliance') || lowerText.includes('vertrag') || lowerText.includes('contract') || lowerText.includes('regulatory') || lowerText.includes('litigation') || lowerText.includes('mediation') || lowerText.includes('legal advice') || lowerText.includes('documentation')) {
    return 'legal';
  }
  
  return 'general';
}

function isQualification(text: string): boolean {
  const taskVerbs = [
    'entwicklung', 'koordination', 'analyse', 'betreuung', 'organisation', 'zusammenarbeit', 'erstellung',
    'planung', 'kontrolle', 'verwaltung', 'führung', 'leitung', 'optimierung', 'implementierung',
    'budgetplanung', 'budget', 'budgeting', 'finanzplanung'
  ];

  const lowerText = text.toLowerCase();
  if (taskVerbs.some(verb => lowerText.startsWith(verb))) {
    return false; // Das ist eine Aufgabe, keine Qualifikation
  }

  return QUALIFICATION_PATTERNS.some(pattern => pattern.test(text));
}

function isFluff(text: string): boolean {
  const fluffPatterns = [
    // Generic headings and meta information
    /\b(hard facts|details|benefits|profil|qualifikationen|anforderungen|requirement|qualification|benefit|perk|nice to have|plus|bonus)\b/i,
    /^\s*(?:weitere|additional|other|more)\s+/i,
    /^\s*(?:sonstige|miscellaneous|various)\s+/i,
    /\b(?:etc\.?|usw\.?|and more|and similar)\s*$/i,
    // Application and contact related text
    /bewerben sie sich|weitere informationen|link hierzu|kontakt|bewerbung|stellenausschreibung/i,
    /^\s*den\s+link.*weitere\s+informationen/i,
    /^\s*bewerben\s+sie\s+sich/i,
    // Short meaningless text  
    /^.{1,15}$/,
    /^\s*(&nbsp;)+/i,
    /^\s*planen\s*$/i,
    /^\s*(&nbsp;|\s)+planen/i,
    // HTML artifacts and navigation
    /^(email|e-mail|telefon|kontakt|adresse|navigation|menu|zurück|weiter|home|start)$/i,
    /^\d+\s*$/,
    // Generic action words without context
    /^(entwickeln|planen|arbeiten|führen|koordinieren|unterstützen)$/i,
  ];
  
  return fluffPatterns.some(pattern => pattern.test(text.trim()));
}

function isHeadingOrIntro(text: string): boolean {
  const headingPatterns = [
    /^(?:aufgaben|deine aufgaben|responsibilities|duties|role|tasks):?\s*$/i,
    /^(?:zu|in|for|as)\s+(?:dieser|your|this|the)\s+(?:stelle|position|role)/i,
    /^(?:als|as)\s+(?:unser|our)/i
  ];
  return headingPatterns.some(pattern => pattern.test(text));
}

function clean(s: string): string {
  return s
    .replace(/[*_`#>]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+[,;]$/, "")
    .trim();
}

function shorten(s: string, n = 140): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

function analyzeTaskEnhanced(taskText: string): Task {
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
    },
    // AI/ML specific
    aiMl: {
      keywords: [
        'ai', 'machine learning', 'ml', 'artificial intelligence', 'neural network', 'algorithm',
        'automatisier', 'automation', 'rpa', 'robotic', 'automatisch'
      ],
      weight: 60,
      complexity: "high" as const,
      trend: "increasing" as const

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
  
  return `Analyse von ${taskCount} identifizierten Aufgaben ergab ein ${scoreCategory}es Automatisierungspotenzial von ${totalScore.toFixed(2)}% ${trendText}. ${ratio.automatisierbar}% der Aufgaben sind potentiell automatisierbar, ${ratio.mensch}% erfordern menschliche Fähigkeiten.`;
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