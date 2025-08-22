// LLM-based Task Analysis - Intelligent and Flexible
import { LLMConfigManager, rateLimiter } from './llmConfig';

export interface TaskContext {
  title: string;
  description?: string;
  category: string;
  systems?: string[];
}

export interface GeneratedSubtask {
  id: string;
  title: string;
  systems: string[];
  manualHoursShare: number;
  automationPotential: number;
  risks?: string[];
  assumptions?: string[];
}

export interface LLMAnalysisResult {
  domain: string;
  confidence: number;
  subtasks: GeneratedSubtask[];
  reasoning: string;
}

export class LLMTaskAnalyzer {
  // Simple LLM simulation for now - can be replaced with real API calls
  private static async callLLM(prompt: string): Promise<string> {
    // Simulate LLM response with intelligent pattern matching
    const taskText = prompt.toLowerCase();
    
    // Enhanced pattern matching with context understanding
    const patterns = {
      'customer-service': {
        keywords: ['customer', 'support', 'beratung', 'telefon', 'phone', 'call', 'hotline', 'service', 'help', 'kundenservice', 'kundenbetreuung'],
        weight: 1.5
      },
      'data-analysis': {
        keywords: ['data', 'analysis', 'report', 'analytics', 'daten', 'analyse', 'export', 'konsolidierung', 'visualisierung', 'dashboard'],
        weight: 1.3
      },
      'marketing': {
        keywords: ['marketing', 'campaign', 'werbung', 'social media', 'content', 'seo', 'sem', 'kampagne'],
        weight: 1.2
      },
      'sales': {
        keywords: ['sales', 'vertrieb', 'akquise', 'pipeline', 'deal', 'kundengewinnung', 'lead generation'],
        weight: 1.4
      },
      'finance-accounting': {
        keywords: ['finance', 'accounting', 'buchhaltung', 'rechnung', 'zahlung', 'ausgaben', 'finanzberichte'],
        weight: 1.1
      },
      'hr-recruitment': {
        keywords: ['hr', 'recruitment', 'recruiting', 'einstellung', 'kandidat', 'interview', 'stellenanzeige'],
        weight: 1.0
      },
      'operations': {
        keywords: ['operations', 'prozess', 'workflow', 'effizienz', 'optimierung', 'automatisierung'],
        weight: 1.2
      }
    };

    // Calculate domain scores with context
    let bestDomain = 'general';
    let bestScore = 0;
    let reasoning = '';

    Object.entries(patterns).forEach(([domain, config]) => {
      const score = config.keywords.reduce((acc, keyword) => {
        return acc + (taskText.includes(keyword) ? config.weight : 0);
      }, 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    });

    // Generate reasoning
    if (bestScore > 0) {
      const matchedKeywords = patterns[bestDomain as keyof typeof patterns].keywords
        .filter(keyword => taskText.includes(keyword));
      reasoning = `Erkannte Domain: ${bestDomain} (Score: ${bestScore}). Matched Keywords: ${matchedKeywords.join(', ')}`;
    } else {
      reasoning = 'Keine spezifische Domain erkannt, verwende universelle Aufgabenstruktur.';
    }

    // Generate subtasks based on domain
    const subtasks = this.generateSubtasksByDomain(bestDomain, taskText);
    
    return JSON.stringify({
      domain: bestDomain,
      confidence: Math.min(bestScore / 3, 1), // Normalize confidence
      subtasks,
      reasoning
    });
  }

  private static generateSubtasksByDomain(domain: string, taskText: string): GeneratedSubtask[] {
    const domainTemplates = {
      'customer-service': [
        {
          id: 'inquiry-processing',
          title: 'Kundenanfragen erfassen und kategorisieren',
          systems: ['CRM', 'Helpdesk', 'Email', 'Phone System'],
          manualHoursShare: 0.25,
          automationPotential: 0.80,
          risks: ['Unvollständige Informationen'],
          assumptions: ['Strukturierte Anfragen']
        },
        {
          id: 'response-generation',
          title: 'Standardantworten und Lösungen generieren',
          systems: ['Knowledge Base', 'AI Assistant', 'CRM'],
          manualHoursShare: 0.30,
          automationPotential: 0.85,
          risks: ['Falsche Antworten'],
          assumptions: ['Aktuelle Wissensbasis']
        },
        {
          id: 'escalation-handling',
          title: 'Komplexe Anfragen eskalieren und verfolgen',
          systems: ['CRM', 'Slack', 'Email'],
          manualHoursShare: 0.20,
          automationPotential: 0.60,
          risks: ['Verzögerte Eskalation'],
          assumptions: ['Klare Eskalationsregeln']
        },
        {
          id: 'follow-up',
          title: 'Nachverfolgung und Kundenzufriedenheit',
          systems: ['CRM', 'Survey Tool', 'Email'],
          manualHoursShare: 0.25,
          automationPotential: 0.75,
          risks: ['Fehlendes Feedback'],
          assumptions: ['Kundenbereitschaft']
        }
      ],
      'data-analysis': [
        {
          id: 'data-collection',
          title: 'Daten aus verschiedenen Quellen sammeln',
          systems: ['Database', 'API', 'Excel', 'ETL Tools'],
          manualHoursShare: 0.20,
          automationPotential: 0.90,
          risks: ['Datenzugriff verweigert'],
          assumptions: ['Verfügbare Datenquellen']
        },
        {
          id: 'data-preparation',
          title: 'Daten bereinigen und für Analyse vorbereiten',
          systems: ['Excel', 'Python', 'R', 'Data Cleaning Tools'],
          manualHoursShare: 0.25,
          automationPotential: 0.85,
          risks: ['Datenverlust'],
          assumptions: ['Datenqualitätsstandards']
        },
        {
          id: 'data-analysis',
          title: 'Analyse durchführen und Insights generieren',
          systems: ['Python', 'R', 'SQL', 'BI Tools'],
          manualHoursShare: 0.30,
          automationPotential: 0.70,
          risks: ['Falsche Interpretation'],
          assumptions: ['Klare Analyseziele']
        },
        {
          id: 'data-presentation',
          title: 'Ergebnisse visualisieren und präsentieren',
          systems: ['Power BI', 'Tableau', 'Excel'],
          manualHoursShare: 0.25,
          automationPotential: 0.75,
          risks: ['Falsche Darstellung'],
          assumptions: ['Design-Vorlagen']
        }
      ],
      'marketing': [
        {
          id: 'campaign-planning',
          title: 'Marketing-Kampagne planen und strategieren',
          systems: ['Marketing Platform', 'Analytics', 'Research Tools'],
          manualHoursShare: 0.20,
          automationPotential: 0.60,
          risks: ['Falsche Zielgruppe'],
          assumptions: ['Marktkenntnis']
        },
        {
          id: 'content-creation',
          title: 'Marketing-Content erstellen und optimieren',
          systems: ['Design Tools', 'AI Tools', 'Content Management'],
          manualHoursShare: 0.35,
          automationPotential: 0.80,
          risks: ['Qualitätsverlust'],
          assumptions: ['Brand-Guidelines']
        },
        {
          id: 'campaign-execution',
          title: 'Kampagne ausführen und überwachen',
          systems: ['Marketing Automation', 'Analytics', 'Social Media'],
          manualHoursShare: 0.25,
          automationPotential: 0.85,
          risks: ['Technische Fehler'],
          assumptions: ['Automatisierungstools']
        },
        {
          id: 'performance-analysis',
          title: 'Kampagnen-Performance analysieren und optimieren',
          systems: ['Analytics', 'Reporting Tools', 'A/B Testing'],
          manualHoursShare: 0.20,
          automationPotential: 0.90,
          risks: ['Falsche Interpretation'],
          assumptions: ['Performance-Daten']
        }
      ],
      'sales': [
        {
          id: 'lead-generation',
          title: 'Leads generieren und qualifizieren',
          systems: ['CRM', 'Lead Generation Tools', 'LinkedIn'],
          manualHoursShare: 0.25,
          automationPotential: 0.80,
          risks: ['Schlechte Lead-Qualität'],
          assumptions: ['Lead-Quellen']
        },
        {
          id: 'prospecting',
          title: 'Prospekte recherchieren und kontaktieren',
          systems: ['CRM', 'Research Tools', 'LinkedIn', 'Email'],
          manualHoursShare: 0.30,
          automationPotential: 0.70,
          risks: ['Falsche Kontaktdaten'],
          assumptions: ['Prospekt-Datenbank']
        },
        {
          id: 'deal-management',
          title: 'Deals verwalten und durch Pipeline führen',
          systems: ['CRM', 'Pipeline Tools', 'Proposal Tools'],
          manualHoursShare: 0.25,
          automationPotential: 0.75,
          risks: ['Deal-Stagnation'],
          assumptions: ['Pipeline-Prozess']
        },
        {
          id: 'sales-reporting',
          title: 'Vertriebsberichte erstellen und analysieren',
          systems: ['CRM', 'Analytics', 'Reporting Tools'],
          manualHoursShare: 0.20,
          automationPotential: 0.85,
          risks: ['Falsche Daten'],
          assumptions: ['Datenqualität']
        }
      ],
      'finance-accounting': [
        {
          id: 'invoice-processing',
          title: 'Rechnungen verarbeiten und buchen',
          systems: ['Accounting Software', 'OCR', 'Email'],
          manualHoursShare: 0.30,
          automationPotential: 0.85,
          risks: ['OCR-Fehler'],
          assumptions: ['Digitale Rechnungen']
        },
        {
          id: 'payment-tracking',
          title: 'Zahlungen verfolgen und abstimmen',
          systems: ['Banking System', 'Accounting', 'CRM'],
          manualHoursShare: 0.25,
          automationPotential: 0.80,
          risks: ['Verzögerte Zahlungen'],
          assumptions: ['Bank-API-Zugang']
        },
        {
          id: 'expense-management',
          title: 'Ausgaben verwalten und genehmigen',
          systems: ['Expense Tool', 'Receipt Scanner', 'Approval System'],
          manualHoursShare: 0.25,
          automationPotential: 0.90,
          risks: ['Fehlende Belege'],
          assumptions: ['Expense-Policy']
        },
        {
          id: 'financial-reporting',
          title: 'Finanzberichte erstellen und analysieren',
          systems: ['Accounting', 'BI Tools', 'Excel'],
          manualHoursShare: 0.20,
          automationPotential: 0.75,
          risks: ['Falsche Daten'],
          assumptions: ['Buchungsqualität']
        }
      ],
      'hr-recruitment': [
        {
          id: 'job-posting',
          title: 'Stellenanzeigen erstellen und veröffentlichen',
          systems: ['ATS', 'Job Boards', 'Social Media'],
          manualHoursShare: 0.20,
          automationPotential: 0.80,
          risks: ['Falsche Anzeigen'],
          assumptions: ['Job-Description']
        },
        {
          id: 'candidate-screening',
          title: 'Bewerber vorsortieren und qualifizieren',
          systems: ['ATS', 'AI Screening', 'Email'],
          manualHoursShare: 0.30,
          automationPotential: 0.85,
          risks: ['Gute Kandidaten übersehen'],
          assumptions: ['Klare Kriterien']
        },
        {
          id: 'interview-process',
          title: 'Interviews koordinieren und durchführen',
          systems: ['Calendar', 'Video Platform', 'Interview Tools'],
          manualHoursShare: 0.25,
          automationPotential: 0.90,
          risks: ['Termin-Konflikte'],
          assumptions: ['Interviewer verfügbar']
        },
        {
          id: 'onboarding',
          title: 'Onboarding-Prozess durchführen',
          systems: ['HR System', 'Training Platform', 'Documentation'],
          manualHoursShare: 0.25,
          automationPotential: 0.75,
          risks: ['Unvollständiges Onboarding'],
          assumptions: ['Onboarding-Plan']
        }
      ],
      'operations': [
        {
          id: 'process-analysis',
          title: 'Prozesse analysieren und optimieren',
          systems: ['Process Mining', 'Analytics', 'Documentation'],
          manualHoursShare: 0.25,
          automationPotential: 0.70,
          risks: ['Unvollständige Analyse'],
          assumptions: ['Prozess-Dokumentation']
        },
        {
          id: 'workflow-automation',
          title: 'Workflows automatisieren und implementieren',
          systems: ['RPA', 'Workflow Tools', 'Integration Platform'],
          manualHoursShare: 0.30,
          automationPotential: 0.90,
          risks: ['Technische Fehler'],
          assumptions: ['Stabile Prozesse']
        },
        {
          id: 'performance-monitoring',
          title: 'Performance überwachen und optimieren',
          systems: ['Monitoring Tools', 'Analytics', 'Dashboard'],
          manualHoursShare: 0.20,
          automationPotential: 0.85,
          risks: ['Späte Erkennung'],
          assumptions: ['Monitoring-Setup']
        },
        {
          id: 'continuous-improvement',
          title: 'Kontinuierliche Verbesserung implementieren',
          systems: ['Feedback System', 'Analytics', 'Collaboration Tools'],
          manualHoursShare: 0.25,
          automationPotential: 0.75,
          risks: ['Fehlende Verbesserungen'],
          assumptions: ['Improvement-Kultur']
        }
      ]
    };

    return domainTemplates[domain as keyof typeof domainTemplates] || this.getUniversalSubtasks();
  }

  private static getUniversalSubtasks(): GeneratedSubtask[] {
    return [
      {
        id: 'planning',
        title: 'Aufgabe planen und strukturieren',
        systems: ['Planning Tools', 'Documentation', 'Requirements'],
        manualHoursShare: 0.20,
        automationPotential: 0.60,
        risks: ['Unvollständige Planung'],
        assumptions: ['Klare Anforderungen']
      },
      {
        id: 'execution',
        title: 'Aufgabe ausführen',
        systems: ['Execution Tools', 'Workflow', 'Automation'],
        manualHoursShare: 0.40,
        automationPotential: 0.80,
        risks: ['Ausführungsfehler'],
        assumptions: ['Verfügbare Tools']
      },
      {
        id: 'coordination',
        title: 'Koordination und Kommunikation',
        systems: ['Communication Tools', 'Collaboration', 'Calendar'],
        manualHoursShare: 0.25,
        automationPotential: 0.75,
        risks: ['Kommunikationslücken'],
        assumptions: ['Team-Zugang']
      },
      {
        id: 'evaluation',
        title: 'Ergebnisse evaluieren und dokumentieren',
        systems: ['Analytics', 'Documentation', 'Reporting'],
        manualHoursShare: 0.15,
        automationPotential: 0.85,
        risks: ['Fehlende Dokumentation'],
        assumptions: ['Performance-Daten']
      }
    ];
  }

  // Main LLM-based analysis method with configuration support
  public static async analyzeTask(task: TaskContext): Promise<LLMAnalysisResult> {
    const config = LLMConfigManager.getConfig();
    
    if (config.debug) {
      console.log('🤖 LLM Analysis Request:', {
        title: task.title,
        description: task.description,
        category: task.category,
        llmEnabled: config.enabled
      });
    }

    // Check if LLM is disabled
    if (!config.enabled) {
      if (config.debug) {
        console.log('❌ LLM disabled, using fallback simulation');
      }
      return await this.getFallbackAnalysis(task);
    }

    // Check rate limiting
    if (config.rateLimit.enabled && !rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getTimeUntilNextRequest();
      if (config.debug) {
        console.warn(`⏱️ Rate limit reached, need to wait ${waitTime}ms`);
      }
      
      if (config.fallback.useSimulation) {
        console.log('🔄 Using fallback due to rate limit');
        return await this.getFallbackAnalysis(task);
      }
      
      // Wait for rate limit
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    const prompt = this.buildPrompt(task);
    
    if (config.debug) {
      console.log('📝 Generated Prompt:', prompt);
    }

    try {
      if (config.debug) {
        console.log('🔄 Calling OpenAI API...');
      }
      
      // Record the request for rate limiting
      rateLimiter.recordRequest();
      
      const response = await this.callRealLLM(prompt);
      
      if (config.debug) {
        console.log('📋 Raw OpenAI Response:', response);
      }
      
      const result = JSON.parse(response) as LLMAnalysisResult;
      
      console.log('✅ LLM Analysis Result:', {
        domain: result.domain,
        confidence: result.confidence,
        subtasksCount: result.subtasks.length,
        reasoning: result.reasoning
      });

      return result;
    } catch (error) {
      const config = LLMConfigManager.getConfig();
      if (config.debug) {
        console.error('❌ LLM analysis failed:', error);
      }
      
      // Use configured fallback
      if (config.fallback.useSimulation) {
        console.log('🔄 Using simulation fallback');
        return await this.getFallbackAnalysis(task);
      }
      
      // Minimal fallback
      return {
        domain: 'general',
        confidence: 0.5,
        subtasks: this.getUniversalSubtasks(),
        reasoning: 'LLM analysis failed, using minimal fallback'
      };
    }
  }

  // Intelligent fallback analysis (simulates LLM behavior)
  private static async getFallbackAnalysis(task: TaskContext): Promise<LLMAnalysisResult> {
    const config = LLMConfigManager.getConfig();
    
    if (config.debug) {
      console.log('🎯 Running fallback analysis for:', task.title);
    }

    // Use the original simulation logic
    const simulatedResponse = await this.callLLM(this.buildPrompt(task));
    return JSON.parse(simulatedResponse) as LLMAnalysisResult;
  }

  private static buildPrompt(task: TaskContext): string {
    return `
Analyze the following business task and generate appropriate subtasks:

Task Title: ${task.title}
Task Description: ${task.description || 'No description provided'}
Task Category: ${task.category}
Task Systems: ${task.systems?.join(', ') || 'No specific systems mentioned'}

Please analyze this task and:
1. Determine the most appropriate business domain (customer-service, data-analysis, marketing, sales, finance-accounting, hr-recruitment, operations, or general)
2. Generate 4 relevant subtasks with realistic time allocations and automation potential
3. Provide reasoning for your domain classification

Respond in JSON format with:
{
  "domain": "string",
  "confidence": number (0-1),
  "subtasks": [
    {
      "id": "string",
      "title": "string",
      "systems": ["string"],
      "manualHoursShare": number (0-1),
      "automationPotential": number (0-1),
      "risks": ["string"],
      "assumptions": ["string"]
    }
  ],
  "reasoning": "string"
}
    `.trim();
  }

  // Real LLM integration with OpenAI GPT-3.5 Turbo
  public static async callRealLLM(prompt: string): Promise<string> {
    const OPENAI_API_KEY = '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';
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a business process analyst. Analyze tasks and generate appropriate subtasks in JSON format. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️ Rate limit reached, using fallback analysis');
          throw new Error(`Rate limit exceeded`);
        }
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      console.log('🤖 OpenAI Response:', content);
      return content;
      
    } catch (error) {
      console.error('❌ OpenAI API call failed:', error);
      // Fallback to simulated response
      return this.callLLM(prompt);
    }
  }
}
