import { getToolsByIndustry } from '../catalog/aiTools';

export interface Task {
  text: string;
  score: number;
  label: "Automatisierbar" | "Teilweise Automatisierbar" | "Mensch";
  signals?: string[];
  aiTools?: string[];
  industry?: string;
  category?: string;
  confidence?: number;
  automationRatio?: number;
  humanRatio?: number;
  complexity?: 'low' | 'medium' | 'high';
  automationTrend?: 'increasing' | 'stable' | 'decreasing';
  subtasks?: Array<{
    id: string;
    title: string;
    description: string;
    automationPotential: number;
    estimatedTime: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'low' | 'medium' | 'high';
    systems: string[];
    risks: string[];
    opportunities: string[];
    dependencies: string[];
  }>;
  businessCase?: {
    manualHours: number;
    automatedHours: number;
    automationPotential: number;
    savedHours: number;
    setupCostHours: number;
    setupCostMoney: number;
    roi: number;
    paybackPeriodYears: number;
    hourlyRateEmployee: number;
    hourlyRateFreelancer: number;
    employmentType: 'employee' | 'freelancer';
    reasoning: string;
  };
  solutions?: {
    workflows: Array<{
      id: string;
      name: string;
      description: string;
      automationPotential: number;
      setupTime: string;
      cost: string;
      systems: string[];
      benefits: string[];
    }>;
    agents: Array<{
      id: string;
      name: string;
      technology: string;
      implementation: string;
      difficulty: string;
      setupTime: string;
      benefits: string[];
    }>;
  };
}

/**
 * Task Classifier Service
 * Handles classification and analysis of individual tasks
 */
export class TaskClassifier {
  // Branchenspezifische AI-Tool-IDs für Aufgabenautomatisierung
  private readonly AI_TOOL_IDS_BY_INDUSTRY = {
    tech: ['chatgpt', 'claude', 'github-copilot', 'code-whisperer', 'tabnine'],
    healthcare: ['chatgpt', 'claude', 'notion-ai', 'obsidian-ai', 'microsoft-copilot', 'perplexity'],
    finance: ['chatgpt', 'claude', 'excel-ai', 'power-bi-ai', 'google-sheets-ai', 'airtable-ai'],
    marketing: ['chatgpt', 'claude', 'jasper', 'copy-ai', 'writesonic', 'canva-ai'],
    hr: ['chatgpt', 'claude', 'notion-ai', 'microsoft-copilot', 'airtable-ai'],
    production: ['chatgpt', 'claude', 'excel-ai', 'power-bi-ai', 'airtable-ai'],
    education: ['chatgpt', 'claude', 'notion-ai', 'obsidian-ai', 'perplexity', 'grammarly'],
    legal: ['chatgpt', 'claude', 'notion-ai', 'perplexity'],
    general: ['chatgpt', 'claude', 'grok', 'gemini', 'perplexity', 'microsoft-copilot', 'notion-ai']
  };

  // Browser-kompatible Keywords-Verwaltung
  private readonly INDUSTRY_KEYWORDS = {
    tech: [
      "software", "development", "programming", "code", "api", "system", "technical",
      "engineer", "developer", "programmer", "frontend", "backend", "fullstack",
      "javascript", "typescript", "react", "vue", "angular", "node.js", "python",
      "java", "c++", "database", "sql", "nosql", "mongodb", "postgresql",
      "docker", "kubernetes", "aws", "azure", "cloud", "devops", "ci/cd",
      "git", "github", "gitlab", "agile", "scrum", "sprint",
      "software engineer", "coding", "api development", "system design", "technical lead",
      "ux", "ui", "user experience", "user interface", "designer", "design",
      "figma", "sketch", "adobe xd", "wireframe", "mockup", "prototyp",
      "designsystem", "design system", "usability", "user research", "user feedback"
    ],
    marketing: [
      "marketing", "campaign", "brand", "content", "social media", "advertising",
      "promotion", "seo", "sem", "google ads", "facebook ads", "instagram",
      "linkedin", "twitter", "youtube", "email marketing", "newsletter",
      "lead generation", "conversion", "analytics", "google analytics",
      "influencer", "affiliate", "pr", "public relations", "copywriting",
      "marketing manager", "campaign management", "brand strategy", "content creation", "digital marketing"
    ],
    finance: [
      "financial", "accounting", "tax", "budget", "invoice", "payment",
      "controller", "accountant", "bookkeeper", "audit", "compliance",
      "bilanz", "buchhaltung", "buchhalter", "buchführung", "steuer",
      "rechnungswesen", "finanzen", "controlling", "kostenrechnung",
      "liquidität", "cashflow", "reporting", "abrechnung", "kassenbuch"
    ],
    hr: [
      "hr", "human resources", "recruitment", "personnel", "employee", "hiring",
      "talent", "onboarding", "offboarding", "performance", "evaluation",
      "personal", "mitarbeiter", "recruiting", "bewerbung", "einstellung",
      "personalentwicklung", "weiterbildung", "arbeitsrecht", "betriebsrat",
      "hr manager", "hr director", "hr specialist", "human resources manager",
      "personalmanager", "personalchef", "personalreferent", "recruiter", "talent acquisition"
    ],
    healthcare: [
      "medical", "patient", "healthcare", "clinical", "nursing", "treatment",
      "doctor", "nurse", "physician", "hospital", "clinic", "therapy",
      "medizinisch", "patient", "pflege", "krankenhaus", "praxis", "therapie",
      "gesundheit", "medikament", "diagnose", "behandlung", "operation",
      "medical professional", "patient care", "healthcare management", "clinical operations"
    ],
    production: [
      "production", "manufacturing", "quality", "process", "operations",
      "factory", "plant", "assembly", "lean", "six sigma", "kaizen",
      "produktion", "fertigung", "qualität", "prozess", "betrieb",
      "fabrik", "werk", "montage", "logistik", "supply chain", "warehouse",
      "production manager", "quality assurance", "process optimization"
    ]
  };

  /**
   * Classify a single task
   */
  async classifyTask(taskText: string, jobTitle?: string): Promise<Task> {
    const lowerText = taskText.toLowerCase();
    
    // Branchenerkennung für die Aufgabe - verwende Job-Titel wenn verfügbar
    const taskIndustry = jobTitle ? this.detectIndustry(jobTitle + ' ' + taskText) : this.detectIndustry(taskText);
    
    // Aufgabenkategorie bestimmen
    const taskCategory = this.detectTaskCategory(taskText);
    
    // Schnelle, lokale Analyse ohne externe API-Calls
    console.log('🔍 Fast Local Analysis for task:', taskText);
    
    // Verwende schnelle Keyword-basierte Analyse
    const automationPotential = this.calculateAutomationPotential(lowerText, taskCategory);
    const reasoning = `Fast analysis: ${taskCategory} category`;
    
    return {
      text: taskText,
      score: Math.round(automationPotential),
      label: automationPotential >= 70 ? "Automatisierbar" : 
             automationPotential >= 30 ? "Teilweise Automatisierbar" : "Mensch",
      signals: [reasoning],
      aiTools: getToolsByIndustry(taskIndustry).map(tool => tool.id),
      industry: taskIndustry,
      category: taskCategory,
      confidence: 0.7,
      automationRatio: automationPotential,
      humanRatio: 100 - automationPotential,
      complexity: automationPotential >= 70 ? 'low' : automationPotential >= 30 ? 'medium' : 'high',
      automationTrend: 'increasing'
    };
  }

  /**
   * Detect industry from text
   */
  detectIndustry(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Definiere die Reihenfolge der Branchenerkennung (wichtig für Prioritäten)
    const industries = ['hr', 'finance', 'marketing', 'tech', 'healthcare', 'production'];
    
    // Prüfe jede Branche mit ihren Keywords
    for (const industry of industries) {
      const keywords = this.getKeywords(industry);
      
      // Spezielle Logik für HR (muss spezifisch sein)
      if (industry === 'hr') {
        const hrSpecificKeywords = [
          'hr manager', 'hr director', 'hr specialist', 'human resources manager',
          'personalmanager', 'personalchef', 'personalreferent', 'recruiter',
          'talent acquisition', 'recruitment', 'onboarding', 'offboarding'
        ];
        
        const hasSpecificHrMatch = hrSpecificKeywords.some(keyword => lowerText.includes(keyword));
        if (hasSpecificHrMatch) {
          return industry;
        }
      } else {
        // Für andere Branchen: Prüfe alle Keywords
        const hasMatch = keywords.some(keyword => lowerText.includes(keyword));
        if (hasMatch) {
          return industry;
        }
      }
    }
    
    // Fallback für allgemeine Büro- und Verwaltungsaufgaben
    const generalKeywords = [
      'verwaltung', 'administration', 'büro', 'office', 'koordination', 'coordination',
      'planung', 'planning', 'organisation', 'organization', 'kommunikation', 'communication',
      'berichterstattung', 'reporting', 'dokumentation', 'documentation',
      'präsentation', 'presentation'
    ];
    
    if (generalKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'general';
    }
    
    return 'general';
  }

  /**
   * Detect task category
   */
  detectTaskCategory(taskText: string): string {
    const lowerText = taskText.toLowerCase();
    
    // Administrative Aufgaben
    if (lowerText.includes('verwaltung') || lowerText.includes('administration') ||
        lowerText.includes('büro') || lowerText.includes('office') ||
        lowerText.includes('koordination') || lowerText.includes('coordination') ||
        lowerText.includes('planung') || lowerText.includes('planning') ||
        lowerText.includes('organisation') || lowerText.includes('organization') ||
        lowerText.includes('berichterstattung') || lowerText.includes('reporting') ||
        lowerText.includes('dokumentation') || lowerText.includes('documentation') ||
        lowerText.includes('datenerfassung') || lowerText.includes('data entry') ||
        lowerText.includes('abrechnung') || lowerText.includes('accounting')) {
      return 'administrative';
    }
    
    // Kommunikationsaufgaben
    if (lowerText.includes('kommunikation') || lowerText.includes('communication') ||
        lowerText.includes('präsentation') || lowerText.includes('presentation') ||
        lowerText.includes('meeting') || lowerText.includes('gespräch') ||
        lowerText.includes('verhandlung') || lowerText.includes('negotiation') ||
        lowerText.includes('kundeninteraktion') || lowerText.includes('customer interaction')) {
      return 'communication';
    }
    
    // Technische Aufgaben
    if (lowerText.includes('entwicklung') || lowerText.includes('development') ||
        lowerText.includes('programmierung') || lowerText.includes('programming') ||
        lowerText.includes('system') || lowerText.includes('integration') ||
        lowerText.includes('datenbank') || lowerText.includes('database') ||
        lowerText.includes('api') || lowerText.includes('software')) {
      return 'technical';
    }
    
    // Analytische Aufgaben
    if (lowerText.includes('analyse') || lowerText.includes('analysis') ||
        lowerText.includes('auswertung') || lowerText.includes('evaluation') ||
        lowerText.includes('statistik') || lowerText.includes('statistics') ||
        lowerText.includes('datenanalyse') || lowerText.includes('data analysis') ||
        lowerText.includes('forschung') || lowerText.includes('research')) {
      return 'analytical';
    }
    
    // Kreative Aufgaben
    if (lowerText.includes('content') || lowerText.includes('design') ||
        lowerText.includes('kreativ') || lowerText.includes('creative') ||
        lowerText.includes('marketing') || lowerText.includes('werbung') ||
        lowerText.includes('kampagne') || lowerText.includes('campaign')) {
      return 'creative';
    }
    
    // Management-Aufgaben
    if (lowerText.includes('führung') || lowerText.includes('leadership') ||
        lowerText.includes('management') || lowerText.includes('leitung') ||
        lowerText.includes('strategie') || lowerText.includes('strategy') ||
        lowerText.includes('entscheidung') || lowerText.includes('decision')) {
      return 'management';
    }
    
    // Physische Aufgaben
    if (lowerText.includes('körperlich') || lowerText.includes('physical') ||
        lowerText.includes('bewegung') || lowerText.includes('movement') ||
        lowerText.includes('handarbeit') || lowerText.includes('manual work') ||
        lowerText.includes('transport') || lowerText.includes('lieferung')) {
      return 'physical';
    }
    
    // Routine-Aufgaben
    if (lowerText.includes('routine') || lowerText.includes('wiederkehrend') ||
        lowerText.includes('repetitive') || lowerText.includes('standard') ||
        lowerText.includes('prozess') || lowerText.includes('process')) {
      return 'routine';
    }
    
    return 'general';
  }

  /**
   * Calculate automation potential
   */
  calculateAutomationPotential(lowerText: string, category: string): number {
    // Basis-Automatisierungspotenzial basierend auf Kategorie
    const categoryScores = {
      'administrative': 85,
      'routine': 90,
      'technical': 80,
      'analytical': 75,
      'communication': 40,
      'creative': 30,
      'management': 25,
      'physical': 20,
      'general': 50
    };
    
    let baseScore = categoryScores[category as keyof typeof categoryScores] || 50;
    
    // Keyword-basierte Anpassungen
    const automationKeywords = [
      'daten', 'data', 'excel', 'tabelle', 'table', 'bericht', 'report', 'routine', 'wiederkehrend',
      'repetitive', 'standard', 'prozess', 'process', 'automatisch', 'automatic', 'system', 'software'
    ];
    
    const manualKeywords = [
      'kreativ', 'creative', 'beratung', 'consultation', 'entscheidung', 'decision', 'strategie',
      'strategy', 'führung', 'leadership', 'körperlich', 'physical', 'handarbeit', 'manual'
    ];
    
    const automationMatches = automationKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const manualMatches = manualKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Anpassung basierend auf Keywords
    baseScore += automationMatches * 5;
    baseScore -= manualMatches * 8;
    
    return Math.max(0, Math.min(100, baseScore));
  }

  /**
   * Get keywords for industry
   */
  private getKeywords(industry: string): string[] {
    return this.INDUSTRY_KEYWORDS[industry as keyof typeof this.INDUSTRY_KEYWORDS] || [];
  }
}
