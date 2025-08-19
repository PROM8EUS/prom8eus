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

    // Validate content length
    if (!analysisText || analysisText.length < 200) {
      throw new Error("Zu wenig Inhalt gefunden. Bitte fügen Sie mehr Text ein oder wählen Sie eine andere Quelle.");
    }

    console.log(`Analyzing text with ${analysisText.length} characters`);

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
    const clean = (body ?? "")
      .replace(/<[^>]+>/g, " ")
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
  
  // Extract tasks from text
  const extractedTasks = extractTasks(jobText);
  console.log('Extracted tasks:', extractedTasks.length);

  // Analyze and score each task
  const analyzedTasks = extractedTasks.map(taskText => analyzeTask(taskText));

  // Calculate aggregated scores
  const totalTasks = analyzedTasks.length;
  const automatisierbareCount = analyzedTasks.filter(t => t.label === "Automatisierbar").length;
  const menschCount = analyzedTasks.filter(t => t.label === "Mensch").length;

  const weightedScore = totalTasks > 0 ? analyzedTasks.reduce((sum, task) => sum + task.score, 0) / totalTasks : 0;
  
  const ratio = {
    automatisierbar: totalTasks > 0 ? Math.round((automatisierbareCount / totalTasks) * 100) : 0,
    mensch: totalTasks > 0 ? Math.round((menschCount / totalTasks) * 100) : 0
  };

  // Generate summary and recommendations
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
  
  // Split into sentences
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  
  // Extract bullet points
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

  // Extract action verb sentences
  const actionVerbs = [
    'planen', 'koordinieren', 'erstellen', 'entwickeln', 'verwalten', 'organisieren',
    'durchführen', 'bearbeiten', 'überwachen', 'analysieren', 'dokumentieren',
    'pflegen', 'betreuen', 'unterstützen', 'leiten', 'führen',
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

  // Remove duplicates
  const uniqueTasks = tasks.filter((task, index, arr) => {
    return arr.findIndex(t => calculateSimilarity(t.toLowerCase(), task.toLowerCase()) > 0.8) === index;
  });

  return uniqueTasks.slice(0, 15);
}

function analyzeTask(taskText: string): Task {
  const lowerText = taskText.toLowerCase();
  
  // Automation signals
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

  // Human signals
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

  // Calculate scores
  Object.entries(automationSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > 0) {
      automationScore += signal.weight * Math.min(matches, 2);
      detectedCategory = category;
    }
  });

  Object.entries(humanSignals).forEach(([category, signal]) => {
    const matches = signal.keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > 0) {
      humanScore += signal.weight * Math.min(matches, 2);
      detectedCategory = category;
    }
  });

  const netScore = Math.max(0, Math.min(100, automationScore - humanScore + 50));
  const label = netScore >= 50 ? "Automatisierbar" : "Mensch";
  const confidence = Math.abs(netScore - 50) * 2;

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