/**
 * OpenAI Proxy - Secure backend for OpenAI API calls
 * This Edge Function acts as a secure proxy to prevent API key exposure
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequestBody {
  action: 'chat' | 'analyze-job' | 'generate-subtasks' | 'generate-business-case' | 'find-solutions' | 'complete-analysis';
  messages?: OpenAIMessage[];
  jobText?: string;
  taskText?: string;
  subtasks?: any[];
  lang?: 'de' | 'en';
  options?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get OpenAI API key from environment (NOT prefixed with VITE_)
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured on server');
    }

    const { action, messages, jobText, taskText, subtasks, lang = 'de', options }: OpenAIRequestBody = await req.json();

    let systemPrompt = '';
    let userPrompt = '';
    let maxTokens = 1000;

    // Route to appropriate action
    switch (action) {
      case 'chat':
        if (!messages) {
          throw new Error('Messages required for chat action');
        }
        return await makeOpenAIRequest(OPENAI_API_KEY, messages, options);

      case 'analyze-job':
        if (!jobText) {
          throw new Error('jobText required for analyze-job action');
        }
        systemPrompt = lang === 'de' 
          ? `Extrahiere Aufgaben aus Stellenbeschreibungen. JSON:
{"tasks":[{"text":"Aufgabe","automationPotential":85,"category":"admin","reasoning":"Begründung"}],"summary":"Zusammenfassung"}
Kategorien: admin, tech, analytical, creative, mgmt, comm, routine, physical`
          : `Extract tasks from job descriptions. JSON:
{"tasks":[{"text":"Task","automationPotential":85,"category":"admin","reasoning":"Reasoning"}],"summary":"Summary"}
Categories: admin, tech, analytical, creative, mgmt, comm, routine, physical`;
        
        userPrompt = lang === 'de'
          ? `Analysiere: ${jobText.slice(0, 2000)}`
          : `Analyze: ${jobText.slice(0, 2000)}`;
        maxTokens = 1200;
        break;

      case 'analyze-job-complete':
        if (!jobText) {
          throw new Error('jobText required for analyze-job-complete action');
        }
        systemPrompt = lang === 'de' 
          ? `Extrahiere Hauptaufgaben aus Stellenbeschreibungen MIT Teilaufgaben. Nur JSON zurückgeben, keine Markdown.

Format:
{
  "tasks": [
    {
      "text": "Hauptaufgabe",
      "automationPotential": 85,
      "category": "tech",
      "reasoning": "Kurze Begründung",
      "subtasks": [
        {"id": "sub1", "title": "Teilaufgabe 1", "automationPotential": 80, "estimatedTime": 2},
        {"id": "sub2", "title": "Teilaufgabe 2", "automationPotential": 70, "estimatedTime": 3}
      ]
    }
  ],
  "summary": "Kurze Zusammenfassung"
}

WICHTIGE KATEGORIEN (wähle die passendste):
- admin: Verwaltung, Büroarbeit, Dokumentation, Buchhaltung
- mgmt: Führung, Management, Personal, Strategie
- tech: Programmierung, IT, Software-Entwicklung, Systeme
- analytical: Analyse, Daten, Reporting, KPIs
- creative: Design, Marketing, Content, Kreative Arbeit
- comm: Kommunikation, Kundenbetreuung, Verkauf
- routine: Wiederkehrende, einfache Tätigkeiten
- physical: Körperliche Arbeit, Handwerk, Produktion

Analysiere den Job-Kontext: HR-Manager = mgmt, Buchhalter = admin, Entwickler = tech`
          : `Extract main tasks from job descriptions WITH subtasks. Return only JSON, no markdown.

Format:
{
  "tasks": [
    {
      "text": "Main task",
      "automationPotential": 85,
      "category": "tech",
      "reasoning": "Brief reasoning",
      "subtasks": [
        {"id": "sub1", "title": "Subtask 1", "automationPotential": 80, "estimatedTime": 2},
        {"id": "sub2", "title": "Subtask 2", "automationPotential": 70, "estimatedTime": 3}
      ]
    }
  ],
  "summary": "Brief summary"
}

IMPORTANT CATEGORIES (choose the most fitting):
- admin: Administration, office work, documentation, accounting
- mgmt: Leadership, management, HR, strategy
- tech: Programming, IT, software development, systems
- analytical: Analysis, data, reporting, KPIs
- creative: Design, marketing, content, creative work
- comm: Communication, customer service, sales
- routine: Repetitive, simple tasks
- physical: Physical work, crafts, production

Analyze job context: HR Manager = mgmt, Accountant = admin, Developer = tech`;
        
        userPrompt = lang === 'de'
          ? `Extrahiere 5-8 Hauptaufgaben aus dieser Stellenbeschreibung. Für jede Aufgabe erstelle 2-3 spezifische Teilaufgaben:

${jobText.slice(0, 1000)}`
          : `Extract 5-8 main tasks from this job description. For each task create 2-3 specific subtasks:

${jobText.slice(0, 1000)}`;
        maxTokens = 2500; // Increased tokens for subtasks
        break;

      case 'generate-subtasks':
        if (!taskText) {
          throw new Error('taskText required for generate-subtasks action');
        }
        systemPrompt = buildSubtasksPrompt(lang);
        userPrompt = lang === 'de'
          ? `Zerlege diese Aufgabe in spezifische Unteraufgaben:\n\nAUFGABE: ${taskText}\n\nFOKUS: Erstelle realistische Unteraufgaben mit korrekten Automatisierungswerten.`
          : `Break down this task into specific subtasks:\n\nTASK: ${taskText}\n\nFOCUS: Create realistic subtasks with correct automation values.`;
        maxTokens = 1500;
        break;

      case 'generate-business-case':
        if (!taskText || !subtasks) {
          throw new Error('taskText and subtasks required for generate-business-case action');
        }
        systemPrompt = buildBusinessCasePrompt(lang);
        userPrompt = buildBusinessCaseUserPrompt(taskText, subtasks, lang);
        maxTokens = 1200;
        break;

      case 'find-solutions':
        if (!taskText || !subtasks) {
          throw new Error('taskText and subtasks required for find-solutions action');
        }
        systemPrompt = buildSolutionsPrompt(lang);
        userPrompt = buildSolutionsUserPrompt(taskText, subtasks, lang);
        maxTokens = 1500;
        break;

      case 'complete-analysis':
        if (!taskText) {
          throw new Error('taskText required for complete-analysis action');
        }
        systemPrompt = buildCompleteAnalysisPrompt(lang);
        userPrompt = lang === 'de'
          ? `Führe eine komplette Analyse dieser Aufgabe durch:\n\nAUFGABE: ${taskText}`
          : `Perform a complete analysis of this task:\n\nTASK: ${taskText}`;
        maxTokens = 3000;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Make OpenAI API request
    const response = await makeOpenAIRequest(
      OPENAI_API_KEY,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      { ...options, max_tokens: maxTokens }
    );

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('OpenAI Proxy Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function makeOpenAIRequest(apiKey: string, messages: OpenAIMessage[], options: any = {}) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      top_p: options.top_p || 1,
      frequency_penalty: options.frequency_penalty || 0,
      presence_penalty: options.presence_penalty || 0,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  // Extract JSON from markdown code blocks if present
  let content = data.choices[0]?.message?.content || '';
  
  // Check if response is wrapped in markdown code blocks
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    content = jsonMatch[1].trim();
  } else if (content.startsWith('```') && content.endsWith('```')) {
    // Handle generic code blocks
    const lines = content.split('\n');
    content = lines.slice(1, -1).join('\n').trim();
  }

  return {
    content: content,
    usage: data.usage,
    model: data.model,
  };
}

// Prompt builders
function buildSubtasksPrompt(lang: string): string {
  return lang === 'de'
    ? `Du bist ein Experte für Aufgabenanalyse. Zerlege komplexe Aufgaben in spezifische Unteraufgaben.

WICHTIG: Antworte ausschließlich mit gültigem JSON, keine zusätzlichen Erklärungen!

JSON-Format:
{
  "subtasks": [
    {
      "id": "task-1",
      "title": "Spezifische Unteraufgabe",
      "description": "Detaillierte Beschreibung",
      "automationPotential": 75,
      "estimatedTime": 30,
      "priority": "high",
      "complexity": "medium",
      "systems": ["Excel", "Python"],
      "risks": ["Datenqualität"],
      "opportunities": ["Automatisierung"],
      "dependencies": ["API-Zugang"]
    }
  ]
}`
    : `You are an expert in task analysis. Break down complex tasks into specific subtasks.

IMPORTANT: Respond exclusively with valid JSON, no additional explanations!

JSON Format:
{
  "subtasks": [
    {
      "id": "task-1",
      "title": "Specific subtask",
      "description": "Detailed description",
      "automationPotential": 75,
      "estimatedTime": 30,
      "priority": "high",
      "complexity": "medium",
      "systems": ["Excel", "Python"],
      "risks": ["Data quality"],
      "opportunities": ["Automation"],
      "dependencies": ["API access"]
    }
  ]
}`;
}

function buildBusinessCasePrompt(lang: string): string {
  return lang === 'de'
    ? `Du bist ein Experte für Business Case Analyse. Berechne realistische Kennzahlen.

WICHTIG: Antworte ausschließlich mit gültigem JSON!

JSON-Format:
{
  "manualHours": 160.0,
  "automatedHours": 99.2,
  "automationPotential": 67,
  "savedHours": 60.8,
  "setupCostHours": 43.0,
  "setupCostMoney": 1720.0,
  "roi": 12190.9,
  "paybackPeriodYears": 0.0,
  "hourlyRateEmployee": 45.0,
  "hourlyRateFreelancer": 35.0,
  "employmentType": "employee",
  "reasoning": "Begründung"
}`
    : `You are an expert in business case analysis. Calculate realistic metrics.

IMPORTANT: Respond exclusively with valid JSON!

JSON Format:
{
  "manualHours": 160.0,
  "automatedHours": 99.2,
  "automationPotential": 67,
  "savedHours": 60.8,
  "setupCostHours": 43.0,
  "setupCostMoney": 1720.0,
  "roi": 12190.9,
  "paybackPeriodYears": 0.0,
  "hourlyRateEmployee": 45.0,
  "hourlyRateFreelancer": 35.0,
  "employmentType": "employee",
  "reasoning": "Reasoning"
}`;
}

function buildSolutionsPrompt(lang: string): string {
  return lang === 'de'
    ? `Du bist ein Experte für AI-Workflow-Automatisierung. Empfehle passende Workflows.

WICHTIG: Antworte ausschließlich mit gültigem JSON!

JSON-Format:
{
  "agents": [
    {
      "name": "AI-Agent",
      "technology": "Technologie",
      "implementation": "Schritte",
      "difficulty": "Mittel",
      "setupTime": "2-4 Wochen",
      "matchScore": 85,
      "reasoning": "Begründung"
    }
  ],
  "workflows": [
    {
      "name": "Workflow",
      "technology": "Technologien",
      "steps": ["Schritt 1"],
      "difficulty": "Mittel",
      "setupTime": "2-4 Wochen",
      "matchScore": 85,
      "reasoning": "Begründung"
    }
  ]
}`
    : `You are an expert in AI workflow automation. Recommend suitable workflows.

IMPORTANT: Respond exclusively with valid JSON!

JSON Format:
{
  "agents": [{
    "name": "AI Agent",
    "technology": "Technology",
    "implementation": "Steps",
    "difficulty": "Medium",
    "setupTime": "2-4 weeks",
    "matchScore": 85,
    "reasoning": "Reasoning"
  }],
  "workflows": [{
    "name": "Workflow",
    "technology": "Technologies",
    "steps": ["Step 1"],
    "difficulty": "Medium",
    "setupTime": "2-4 weeks",
    "matchScore": 85,
    "reasoning": "Reasoning"
  }]
}`;
}

function buildCompleteAnalysisPrompt(lang: string): string {
  return lang === 'de'
    ? `Du bist ein Experte für Arbeitsplatzautomatisierung. Führe eine komplette Analyse durch.

WICHTIG: Antworte ausschließlich mit gültigem JSON!

Erstelle: Teilaufgaben, Business Case und Lösungen in einem JSON-Objekt.`
    : `You are an expert in workplace automation. Perform a complete analysis.

IMPORTANT: Respond exclusively with valid JSON!

Create: Subtasks, business case, and solutions in one JSON object.`;
}

function buildBusinessCaseUserPrompt(taskText: string, subtasks: any[], lang: string): string {
  const subtasksText = subtasks.map((s, i) => 
    `${i + 1}. ${s.title} (${s.automationPotential}% Automatisierung)`
  ).join('\n');

  return lang === 'de'
    ? `Analysiere diese Aufgabe:\n\nHAUPTAUFGABE: ${taskText}\n\nTEILAUFGABEN:\n${subtasksText}`
    : `Analyze this task:\n\nMAIN TASK: ${taskText}\n\nSUBTASKS:\n${subtasksText}`;
}

function buildSolutionsUserPrompt(taskText: string, subtasks: any[], lang: string): string {
  const subtasksText = subtasks.map((s, i) => 
    `${i + 1}. ${s.title} (${s.automationPotential}%)`
  ).join('\n');

  return lang === 'de'
    ? `HAUPTAUFGABE: ${taskText}\n\nTEILAUFGABEN:\n${subtasksText}\n\nErstelle spezifische Workflows und AI-Agenten.`
    : `MAIN TASK: ${taskText}\n\nSUBTASKS:\n${subtasksText}\n\nCreate specific workflows and AI agents.`;
}

