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

interface ExtractedJob {
  title?: string;
  description?: string;
  responsibilities?: string;
  qualifications?: string;
  fulltext?: string;
  source?: string;
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, rawText }: AnalyzeInputRequest = await req.json();
    
    console.log('Starting unified analysis for:', { hasUrl: !!url, hasRawText: !!rawText });

    let analysisText = rawText || '';

    // If URL is provided, extract job text
    if (isUrl(url)) {
      console.log('Extracting job text from URL:', url);
      
      // Check cache first
      const urlHash = await generateUrlHash(url!);
      const cachedData = await getCachedUrlData(urlHash);
      
      if (cachedData) {
        console.log('Using cached data for URL');
        analysisText = cachedData.composedText;
      } else {
        console.log('Fetching fresh content from URL');
        // Fetch HTML content
        let html = '';
        try {
          const response = await fetch(url!, {
            headers: { 
              "User-Agent": "Mozilla/5.0 Prom8eusBot/1.0",
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(10000)
          });
          
          if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status}`);
          }
          
          html = await response.text();
        } catch (error) {
          console.error('Error fetching URL:', error);
          throw new Error("Seite konnte nicht automatisch gelesen werden. Bitte Text manuell einfügen.");
        }

        // Extract job text from HTML
        const extracted = extractJobText(html, url!);
        analysisText = composeJobText(extracted);
        
        // Cache the results
        if (analysisText.length > 100) {
          await setCachedUrlData(urlHash, url!, {
            ...extracted,
            composedText: analysisText
          }, analysisText.length);
        }
      }
    }

    // Validate content length - allow shorter inputs for single tasks
    if (!analysisText || analysisText.trim().length < 5) {
      throw new Error("Zu wenig Inhalt gefunden. Bitte fügen Sie mehr Text ein oder wählen Sie eine andere Quelle.");
    }

    // For very short inputs (likely single tasks), create a simple task structure
    let isSimpleTask = false;
    if (analysisText.length < 100 && !analysisText.includes('\n') && analysisText.split(' ').length <= 10) {
      console.log('Detected simple task input, analyzing as single task');
      isSimpleTask = true;
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

function isUrl(s?: string): boolean {
  return !!s && /^https?:\/\/\S+/i.test(s.trim());
}

// Generate SHA-256 hash from URL
async function generateUrlHash(url: string): Promise<string> {
  const normalizedUrl = url.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedUrl);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check cached URL data
async function getCachedUrlData(urlHash: string): Promise<{ composedText: string } | null> {
  try {
    const { data, error } = await supabase.rpc('get_cached_url_data', {
      url_hash_param: urlHash
    });
    
    if (error || !data || data.length === 0) return null;
    
    return {
      composedText: data[0].extracted_data.composedText || ''
    };
  } catch (error) {
    console.error('Error fetching cached data:', error);
    return null;
  }
}

// Cache URL data
async function setCachedUrlData(
  urlHash: string, 
  url: string, 
  data: ExtractedJob & { composedText: string }, 
  textLength: number
): Promise<void> {
  try {
    await supabase.from('url_cache').insert({
      url_hash: urlHash,
      original_url: url,
      extracted_data: data,
      text_length: textLength,
      was_rendered: false
    });
  } catch (error) {
    console.error('Error caching URL data:', error);
  }
}

function extractJobText(html: string, url: string): ExtractedJob {
  const $ = cheerio.load(html);
  
  let title = '';
  let description = '';
  let responsibilities = '';
  let qualifications = '';
  let fulltext = '';

  // Extract JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const jsonLd = JSON.parse($(element).html() || '');
      const jobPosting = Array.isArray(jsonLd) 
        ? jsonLd.find(item => item['@type'] === 'JobPosting')
        : jsonLd['@type'] === 'JobPosting' ? jsonLd : null;

      if (jobPosting) {
        title = jobPosting.title || '';
        description = jobPosting.description || '';
        responsibilities = jobPosting.responsibilities || '';
        qualifications = jobPosting.qualifications || '';
      }
    } catch (e) {
      // Invalid JSON-LD, continue with fallback
    }
  });

  // Fallback extraction
  if (!title) {
    title = $('title').text() || '';
  }

  if (!description) {
    description = $('meta[name="description"]').attr('content') || '';
  }

  // Extract main content
  if (!fulltext) {
    const contentSelectors = [
      'main', 'article', '[role="main"]', '#content', '.content', 
      '.job-description', '.job-details'
    ];

    const contentElements: string[] = [];
    contentSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        $(element).find('nav, footer, script, style, .navigation, .nav').remove();
        const text = $(element).text();
        if (text && text.trim().length > 50) {
          contentElements.push(text);
        }
      });
    });

    fulltext = contentElements.join('\n\n');
  }

  // Clean up text
  const cleanText = (text: string): string => {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
      .substring(0, 10000);
  };

  return {
    title: cleanText(title),
    description: cleanText(description),
    responsibilities: cleanText(responsibilities),
    qualifications: cleanText(qualifications),
    fulltext: cleanText(fulltext),
    source: url
  };
}

function composeJobText(j: ExtractedJob): string {
  const parts: string[] = [];
  if (j.title) parts.push(j.title.trim());

  const pushBlock = (label: string, body?: string) => {
    let clean = (body ?? "")
      .replace(/<[^>]+>/g, " ")
      // Comprehensive HTML entity decoding
      .replace(/&ouml;/gi, 'ö')
      .replace(/&auml;/gi, 'ä')
      .replace(/&uuml;/gi, 'ü')
      .replace(/&Ouml;/gi, 'Ö')
      .replace(/&Auml;/gi, 'Ä')
      .replace(/&Uuml;/gi, 'Ü')
      .replace(/&szlig;/gi, 'ß')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&quot;/gi, '"')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\s{2,}/g, " ")
      .trim();
    if (clean) parts.push(`${label}:\n${clean}`);
  };

  // Auto-detect German/English
  const text = [j.responsibilities, j.qualifications, j.description, j.fulltext].join(" ");
  const de = /aufgaben|anforderungen|verantwortlichkeiten|qualifikationen/i.test(text);

  pushBlock(de ? "AUFGABEN" : "RESPONSIBILITIES", j.responsibilities);
  pushBlock(de ? "ANFORDERUNGEN" : "QUALIFICATIONS", j.qualifications);
  pushBlock(de ? "BESCHREIBUNG" : "DESCRIPTION", j.description || j.fulltext);

  if (j.source) parts.push(`\nQuelle: ${j.source}`);

  return parts.join("\n\n").trim();
}

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
    if (isHeadingOrIntro(l) || isFluff(l)) continue;
    
    // Standard bullet point matching
    const m = l.match(BULLET);
    if (m && m[1] && m[1].length >= 10) {
      const txt = shorten(clean(m[1]));
      if (txt.length >= 10) bullets.push({ text: txt, source: "bullet" });
      continue;
    }
    
    // Enhanced detection for lines that start with action verbs (paragraph format)
    const ACTION_STARTS = /^(write|create|develop|design|build|maintain|manage|lead|coordinate|support|implement|analyze|optimize|collaborate|partner|help|assist|ensure|provide|deliver|execute|plan|organize|monitor|review|evaluate|establish|enhance|improve|facilitate|guide|mentor|supervise|oversee|direct|control|handle|process|generate|produce|publish|distribute|communicate|present|report|document|research|investigate|identify|recommend|advise|consult|negotiate|sell|market|promote|train|teach|educate|install|configure|deploy|test|debug|troubleshoot|resolve|fix|update|upgrade|integrate|connect|link|sync|backup|restore|archive|store|retrieve|fetch|collect|gather|compile|summarize|translate|convert|transform|adapt|customize|personalize|tailor|schreiben|erstellen|entwickeln|gestalten|bauen|pflegen|verwalten|leiten|koordinieren|unterstützen|implementieren|analysieren|optimieren|zusammenarbeiten|helfen|sicherstellen|bereitstellen|liefern|ausführen|planen|organisieren|überwachen|überprüfen|bewerten|etablieren|verbessern|erleichtern|führen|betreuen|beaufsichtigen|überwachen|dirigieren|kontrollieren|handhaben|verarbeiten|generieren|produzieren|veröffentlichen|verteilen|kommunizieren|präsentieren|berichten|dokumentieren|recherchieren|untersuchen|identifizieren|empfehlen|beraten|konsultieren|verhandeln|verkaufen|vermarkten|bewerben|trainieren|lehren|bilden|installieren|konfigurieren|einsetzen|testen|debuggen|beheben|lösen|reparieren|aktualisieren|upgraden|integrieren|verbinden|verknüpfen|synchronisieren|sichern|wiederherstellen|archivieren|speichern|abrufen|sammeln|zusammenstellen|zusammenfassen|übersetzen|konvertieren|transformieren|anpassen|personalisieren|maßschneidern)\b/i;
    
    if (l.length >= 20 && ACTION_STARTS.test(l)) {
      const txt = shorten(clean(l));
      if (txt.length >= 15) bullets.push({ text: txt, source: "action" as any });
    }
  }

  console.log(`Found ${bullets.length} bullet points`);

  // 4) Enhanced sentence-based extraction for paragraph-form responsibilities
  const sentenceTasks: RawTask[] = [];
  if (bullets.length === 0) {
    console.log('No bullet points found, trying sentence-based extraction');
    
    // Join scoped lines and split by sentence endings
    const fullText = scoped.join(' ').replace(/\s+/g, ' ');
    const sentences = fullText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    const ACTION_VERBS = new RegExp(
      [
        // English action verbs (common in job descriptions)
        "\\b(write|edit|create|develop|design|build|maintain|manage|lead|coordinate|support|implement|analyze|optimize|collaborate|partner|help|assist|ensure|provide|deliver|execute|plan|organize|monitor|review|evaluate|establish|enhance|improve|facilitate|guide|mentor|supervise|oversee|direct|control|handle|process|generate|produce|publish|distribute|communicate|present|report|document|research|investigate|identify|recommend|advise|consult|negotiate|sell|market|promote|train|teach|educate|install|configure|deploy|test|debug|troubleshoot|resolve|fix|update|upgrade|integrate|connect|link|sync|backup|restore|archive|store|retrieve|fetch|collect|gather|compile|summarize|translate|convert|transform|adapt|customize|personalize|tailor)\\b",
        // German action verbs
        "\\b(schreiben|bearbeiten|erstellen|entwickeln|gestalten|bauen|pflegen|verwalten|leiten|koordinieren|unterstützen|implementieren|analysieren|optimieren|zusammenarbeiten|helfen|sicherstellen|bereitstellen|liefern|ausführen|planen|organisieren|überwachen|überprüfen|bewerten|etablieren|verbessern|erleichtern|führen|betreuen|beaufsichtigen|überwachen|dirigieren|kontrollieren|handhaben|verarbeiten|generieren|produzieren|veröffentlichen|verteilen|kommunizieren|präsentieren|berichten|dokumentieren|recherchieren|untersuchen|identifizieren|empfehlen|beraten|konsultieren|verhandeln|verkaufen|vermarkten|bewerben|trainieren|lehren|bilden|installieren|konfigurieren|einsetzen|testen|debuggen|beheben|lösen|reparieren|aktualisieren|upgraden|integrieren|verbinden|verknüpfen|synchronisieren|sichern|wiederherstellen|archivieren|speichern|abrufen|sammeln|zusammenstellen|zusammenfassen|übersetzen|konvertieren|transformieren|anpassen|personalisieren|maßschneidern)\\b"
      ].join("|"),
      "i"
    );

    for (const sentence of sentences) {
      if (sentence.length >= 20 && ACTION_VERBS.test(sentence) && !isFluff(sentence)) {
        // Split compound sentences on conjunctions
        const parts = sentence.split(/\b(?:and|und|sowie|oder|or)\b/i);
        for (const part of parts) {
          const cleanPart = clean(part.trim());
          if (cleanPart.length >= 15 && ACTION_VERBS.test(cleanPart)) {
            sentenceTasks.push({ text: shorten(cleanPart), source: "sentence" as any });
          }
        }
      }
    }
  }

  console.log(`Found ${sentenceTasks.length} sentence-based tasks`);

  // 5) Fallback: Verb-Linien (nur falls keine oder wenige Bullets und Sentences)
  const VERB_LINE_ENHANCED = new RegExp(
    [
      // DE (Erweiterte Verben am Satzanfang)
      "^(?:du\\s+|sie\\s+|wir\\s+)?(?:entwickelst|entwickeln|planst|planen|gestaltest|gestalten|führst|führen|koordinierst|koordinieren|optimierst|optimieren|automatisierst|automatisieren|dokumentierst|dokumentieren|betreust|betreuen|repräsentierst|repräsentieren)\\b",
      // DE (Du/Sie/Wir Form direkt)
      "^(?:du|sie|wir)\\s+(?:entwickelst|entwickeln|planst|planen|gestaltest|gestalten|führst|führen|koordinierst|koordinieren|optimierst|optimieren|automatisierst|automatisieren|dokumentierst|dokumentieren|betreust|betreuen|repräsentierst|repräsentieren)",
      // EN (Imperative/3rd Person - erweitert)
      "^(?:develop|design|maintain|build|coordinate|lead|create|plan|optimi[sz]e|automate|represent)\\b",
      // Fallback für weitere Verben
      "^(?:[–—-]\\s*)?(?:du\\s+)?(?:entwickelst|gestaltest|planst|koordinierst|analysierst|implementierst|pflegst|migrierst|übernimmst|führst|mentorst|betreust|optimierst|automatisierst|dokumentierst|überwachst|integrierst|erstellst|verwaltst|unterstützt|leitest|bearbeitest|durchführst|sicherstellst|verantwortest)\\b"
    ].join("|"),
    "i"
  );

  const verbLines: RawTask[] = (bullets.length + sentenceTasks.length) >= 3 
    ? []
    : scoped
        .filter(l => !isHeadingOrIntro(l) && !isFluff(l) && VERB_LINE_ENHANCED.test(l))
        .map(l => ({ text: shorten(clean(l)), source: "verbline" as const }))
        .filter(t => t.text.length >= 10);

  console.log(`Found ${verbLines.length} verb lines with enhanced detection as fallback`);

  // 6) Kombinieren + deduplizieren
  const dedup = new Map<string, RawTask>();
  for (const t of [...bullets, ...sentenceTasks, ...verbLines]) {
    const key = t.text.toLowerCase().replace(/[^\w\s]/g, ''); // Normalisiert für Duplikatserkennung
    if (!dedup.has(key) && !isFluff(t.text)) {
      dedup.set(key, t);
    }
  }

  // 7) Filter für generische Titel/Meta-Informationen
  const GENERIC_TITLES = /(hard facts|details|profil|anforderungen|qualifikationen|benefits|wir bieten|about you|requirements|what we offer|company|unternehmen|zur person|dein profil|ihr profil|das bieten wir|leistungen|perks)/i;
  
  // 8) Begrenzen und sortieren (längere Tasks zuerst, da sie meist detaillierter sind)
  const result = Array.from(dedup.values())
    .filter(t => !GENERIC_TITLES.test(t.text)) // Generische Titel entfernen
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 20); // Max 20 Tasks

  console.log(`Final extracted tasks after generic filter: ${result.length}`);
  return result;
}

// Floskeln und überflüssige Begriffe
const FLUFF_PATTERNS = [
  /\b(hard facts|details|benefits|profil|qualifikationen|anforderungen|requirement|qualification|benefit|perk|nice to have|plus|bonus)\b/i,
  /^\s*(?:weitere|additional|other|more)\s+/i, // "Weitere Aufgaben", "Additional duties"
  /^\s*(?:sonstige|miscellaneous|various)\s+/i,
  /\b(?:etc\.?|usw\.?|and more|and similar)\s*$/i
];

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

interface RawTask { 
  text: string; 
  source: "bullet" | "verbline" | "sentence"; 
}

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
        'platform', 'infrastructure', 'integration', 'api', 'automation', 'deployment', 'monitoring', 'code', 'development'
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
    physical: {
      keywords: [
        // German - körperliche Tätigkeiten
        'fegen', 'putzen', 'reinigen', 'wischen', 'saugen', 'kehren', 'aufräumen', 'reparieren', 'montieren', 'demontieren', 'bauen', 'installieren', 'bewegen', 'tragen', 'heben', 'transportieren', 'sortieren', 'packen', 'auspacken', 'laden', 'entladen', 'schneiden', 'sägen', 'bohren', 'schrauben', 'kleben', 'schweißen', 'lackieren', 'streichen', 'pflegen', 'gießen', 'ernten', 'pflanzen', 'graben', 'mähen',
        // German - Handwerk und Bau
        'fliesen', 'legen', 'verlegen', 'mauern', 'verputzen', 'tapezieren', 'dachdecken', 'zimmern', 'schleifen', 'hobeln', 'stemmen', 'hämmern', 'nageln', 'spachteln', 'grundieren', 'isolieren', 'dämmen', 'fliesenlegen', 'parkettlegen', 'dacharbeiten', 'maurerarbeiten', 'elektroinstallation', 'rohrleitungen', 'sanitärarbeiten',
        // English - physical tasks
        'sweep', 'clean', 'mop', 'vacuum', 'wipe', 'dust', 'scrub', 'polish', 'wash', 'dry', 'repair', 'fix', 'assemble', 'disassemble', 'build', 'construct', 'install', 'move', 'carry', 'lift', 'transport', 'load', 'unload', 'pack', 'unpack', 'sort', 'organize', 'cut', 'saw', 'drill', 'screw', 'glue', 'weld', 'paint', 'maintain', 'water', 'harvest', 'plant', 'dig', 'mow',
        // English - crafts and construction  
        'tile', 'lay', 'laying', 'tiling', 'masonry', 'bricklaying', 'plastering', 'wallpapering', 'roofing', 'carpentry', 'sanding', 'planing', 'hammering', 'nailing', 'filling', 'priming', 'insulating', 'flooring', 'electrical', 'plumbing', 'piping'
      ],
      weight: 40 // Höchste Gewichtung für körperliche Arbeit
    },
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