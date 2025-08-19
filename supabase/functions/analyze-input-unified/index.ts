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
          originalText: analysisText.substring(0, 500) + (analysisText.length > 500 ? '...' : ''),
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
  console.log('Starting job analysis with text length:', jobText.length);
  
  // Step 1: Extract tasks using the advanced extractor
  const rawTasks = extractTasks(jobText);
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

function extractTasks(text: string): RawTask[] {
  const lines = text.split(/\r?\n/).map(l => clean(l)).filter(Boolean);

  // Check if this is a simple wrapped task (e.g., "Aufgabe: boden fegen")
  if (lines.length === 1 && lines[0].match(/^aufgabe:\s*/i)) {
    const taskText = lines[0].replace(/^aufgabe:\s*/i, '').trim();
    if (taskText) {
      console.log('Detected single wrapped task:', taskText);
      return [{ text: taskText, source: "verbline" }];
    }
  }

  // ANALYZE ENTIRE TEXT - no section detection
  console.log(`Analyzing entire text with ${lines.length} lines - NO SECTION FILTERING`);
  // Use all lines without filtering
  let scoped = lines;

  // 3) Bullets einsammeln (priorisiert) - erweitert für verschiedene Formate
  const bullets: RawTask[] = [];
  const BULLET = /^\s*(?:[-–—*•●▪▫◦‣⁃]|[0-9]+\.|\([0-9]+\)|[a-z]\.|\([a-z]\))\s+(.+)$/i;
  
  for (const l of scoped) {
    if (isHeadingOrIntro(l) || isFluff(l) || isQualification(l)) continue;
    
    // Standard bullet point matching
    const m = l.match(BULLET);
    if (m && m[1] && m[1].length >= 10) {
      const cleanText = clean(m[1]);
      if (!isQualification(cleanText)) { // Doppelte Prüfung nach dem Cleaning
        const txt = shorten(cleanText);
        if (txt.length >= 10) bullets.push({ text: txt, source: "bullet" });
      }
      continue;
    }
  }

  console.log(`Found ${bullets.length} bullet points`);

  // 6) Kombinieren + deduplizieren
  const dedup = new Map<string, RawTask>();
  for (const t of bullets) {
    const key = t.text.toLowerCase().replace(/[^\w\s]/g, ''); // Normalisiert für Duplikatserkennung
    if (!dedup.has(key) && !isFluff(t.text) && !isQualification(t.text)) {
      dedup.set(key, t);
    }
  }

  // 8) Begrenzen und sortieren (längere Tasks zuerst, da sie meist detaillierter sind)
  const result = Array.from(dedup.values())
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 20); // Max 20 Tasks

  console.log(`Final extracted tasks after generic filter: ${result.length}`);
  return result;
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

function isQualification(text: string): boolean {
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

function analyzeTask(taskText: string): Task {
  const lowerText = taskText.toLowerCase();
  
  // Define automation indicators (with English keywords added)
  const automationSignals = {
    softwareDevelopment: {
      keywords: [
        // German - development tasks with high automation potential
        'debugging', 'fehlerbehebung', 'bug fixing', 'testing', 'testen', 'unit test', 'integration test',
        'code review', 'code-review', 'code analyse', 'static analysis', 'linting', 'refactoring',
        'deployment', 'continuous integration', 'ci/cd', 'automatisierung', 'automation',
        'dokumentation', 'code documentation', 'api documentation', 'logging', 'monitoring',
        'performance optimierung', 'performance tuning', 'profiling', 'benchmarking',
        'versionskontrolle', 'git', 'version control', 'merge', 'pull request', 'commit',
        'build', 'kompilierung', 'packaging', 'bundling', 'minification',
        'linter', 'formatter', 'prettier', 'eslint', 'quality gates',
        // English
        'debugging', 'bug fixing', 'testing', 'unit testing', 'integration testing', 'e2e testing',
        'code review', 'static analysis', 'linting', 'refactoring', 'deployment',
        'continuous integration', 'automation', 'documentation', 'logging', 'monitoring',
        'performance optimization', 'profiling', 'benchmarking', 'version control',
        'build process', 'compilation', 'packaging', 'quality assurance'
      ],
      weight: 50
    },
    accounting: {
      keywords: [
        // German - spezifische Buchhaltungsaufgaben
        'buchhaltung', 'finanzbuchhaltung', 'kontierung', 'belege', 'rechnungswesen', 'bilanzierung',
        'abschluss', 'monatsabschluss', 'jahresabschluss', 'umsatzsteuer', 'steuervoranmeldung',
        'mahnwesen', 'zahlungsverkehr', 'kontoabstimmung', 'abstimmung', 'buchen', 'verbuchen',
        // English
        'bookkeeping', 'accounting', 'posting', 'vouchers', 'invoicing', 'reconciliation', 'entries'
      ],
      weight: 40
    },
    dataProcessing: {
      keywords: [
        // German
        'datenerfassung', 'dateneingabe', 'datenverarbeitung', 'auswertung', 'statistik', 'reporting', 'report',
        'excel', 'tabelle', 'eingabe', 'erfassung', 'archivierung', 'verwaltung', 'aktualisierung',
        // English  
        'data entry', 'data processing', 'analytics', 'metrics', 'dashboard', 'input', 'processing', 'reporting'
      ],
      weight: 35
    },
    systemWork: {
      keywords: [
        // German
        'auftragserfassung', 'systembearbeitung', 'crm', 'erp', 'software', 'datenbank', 'system',
        'buchung', 'rechnung', 'fakturierung', 'bestellung', 'verwaltung im system', 'datev',
        // English
        'order processing', 'system entry', 'database', 'invoicing', 'billing', 'system management'
      ],
      weight: 35
    },
    budgetingPlanning: {
      keywords: [
        // German
        'budgetplanung', 'controlling', 'kostenrechnung', 'planung', 'kalkulation', 'budgetkontrolle',
        'finanzplanung', 'liquiditätsplanung', 'kennzahlen', 'analyse', 'auswertung',
        // English
        'budget planning', 'controlling', 'cost accounting', 'financial planning', 'analysis'
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
    }
  };

  // Define human-required indicators (with English keywords added)
  const humanSignals = {
    collaboration: {
      keywords: [
        // German - Zusammenarbeit mit Menschen
        'zusammenarbeit', 'kooperation', 'abstimmung mit', 'rücksprache', 'koordination mit',
        'besprechung', 'meeting', 'teamarbeit', 'steuerberater', 'externe partner',
        'kunde', 'kunden', 'mandant', 'mandanten', 'lieferant', 'lieferanten',
        // English
        'collaboration', 'cooperation', 'coordination with', 'meeting', 'teamwork', 'client', 'supplier'
      ],
      weight: 50
    },
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
      weight: 45
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
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length > 0) {
      console.log(`AUTOMATION MATCH in ${category}:`, matches);
      automationScore += signal.weight * Math.min(matches.length, 3);
      detectedCategory = category;
    }
  });

  // Calculate human score  
  Object.entries(humanSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length > 0) {
      console.log(`HUMAN MATCH in ${category}:`, matches);
      humanScore += signal.weight * Math.min(matches.length, 3);
      detectedCategory = category;
    }
  });

  console.log(`SCORES: automation=${automationScore}, human=${humanScore}, category=${detectedCategory}`);

  // Determine final score and label
  const baseScore = 25; // Noch niedrigerer Basis-Score
  const netScore = Math.max(0, Math.min(100, automationScore - humanScore + baseScore));
  
  // Verbesserte Confidence-Berechnung
  const totalSignalStrength = Math.max(automationScore, humanScore);
  const confidence = Math.min(95, Math.max(15, (totalSignalStrength / 25) * 50)); // Realistischere Confidence
  
  // Deutlich konservativere Bewertung:
  let label: "Automatisierbar" | "Mensch";
  if (humanScore > 0) {
    // Jede menschliche Komponente → Mensch  
    label = "Mensch";
  } else if (automationScore >= 30 && netScore >= 70) {
    // Nur bei starken Automation-Signalen → Automatisierbar
    label = "Automatisierbar";
  } else {
    // Bei Zweifel → Mensch (konservativ)
    label = "Mensch";
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