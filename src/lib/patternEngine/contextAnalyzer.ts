export interface ContextAnalysis {
  complexity: 'low' | 'medium' | 'high';
  trend: 'increasing' | 'stable' | 'decreasing';
  systems: string[];
  automationSignals: {
    repetitive: number;
    structured: number;
    digital: number;
    routine: number;
    creative: number;
    human: number;
  };
  finalScore: number;
}

export class ContextAnalyzer {
  private systemKeywords = {
    'excel': ['excel', 'spreadsheet', 'tabelle', 'formel', 'pivot', 'vlookup'],
    'crm': ['crm', 'customer', 'kunde', 'salesforce', 'hubspot', 'pipedrive'],
    'erp': ['erp', 'sap', 'oracle', 'enterprise', 'business software'],
    'email': ['email', 'outlook', 'gmail', 'mail', 'newsletter', 'kampagne'],
    'calendar': ['calendar', 'kalender', 'termin', 'meeting', 'appointment'],
    'database': ['database', 'datenbank', 'sql', 'mysql', 'postgresql'],
    'api': ['api', 'integration', 'webhook', 'schnittstelle', 'rest', 'json'],
    'cloud': ['cloud', 'aws', 'azure', 'google cloud', 'saas', 'online'],
    'social': ['social media', 'linkedin', 'facebook', 'twitter', 'xing', 'instagram'],
    'cms': ['cms', 'wordpress', 'content management', 'website', 'blog'],
    // Neue Systeme für gängige Stellenanzeigen
    'ats': ['ats', 'bewerbermanagement', 'recruiting software', 'workday', 'bamboo', 'greenhouse'],
    'jobboard': ['jobboard', 'indeed', 'stepstone', 'monster', 'stellenanzeige', 'job posting'],
    'slack': ['slack', 'teams', 'chat', 'kommunikation', 'messaging', 'collaboration'],
    'jira': ['jira', 'ticket', 'project management', 'agile', 'scrum', 'kanban'],
    'confluence': ['confluence', 'wiki', 'dokumentation', 'wissen', 'knowledge base'],
    'marketing-automation': ['marketing automation', 'hubspot', 'mailchimp', 'campaign', 'lead nurturing'],
    'accounting-software': ['sap', 'datev', 'lexware', 'buchhaltung', 'accounting', 'finanzen'],
    'hr-software': ['hr software', 'personio', 'bamboo', 'workday', 'personal', 'hr'],
    'helpdesk': ['helpdesk', 'zendesk', 'freshdesk', 'support', 'ticket', 'service'],
    'analytics': ['analytics', 'google analytics', 'tableau', 'power bi', 'datenanalyse', 'reporting'],
    'erp': ['erp', 'sap', 'oracle', 'enterprise', 'business software', 'prozess']
  };

  private repetitiveKeywords = [
    'wiederkehrend', 'repetitive', 'routine', 'standard', 'regelmäßig',
    'täglich', 'wöchentlich', 'monatlich', 'automatisch', 'systematisch'
  ];

  private structuredKeywords = [
    'strukturiert', 'structured', 'format', 'template', 'vorlage',
    'standard', 'protokoll', 'formular', 'checkliste', 'workflow'
  ];

  private digitalKeywords = [
    'digital', 'online', 'software', 'system', 'tool', 'app',
    'computer', 'internet', 'web', 'platform', 'portal'
  ];

  private routineKeywords = [
    'routine', 'alltäglich', 'gewöhnlich', 'normal', 'standard',
    'prozess', 'ablauf', 'verfahren', 'methode', 'praxis'
  ];

  private creativeKeywords = [
    'kreativ', 'creative', 'design', 'konzept', 'idee', 'innovation',
    'gestaltung', 'entwicklung', 'erfindung', 'original', 'einzigartig'
  ];

  private humanKeywords = [
    'menschlich', 'human', 'persönlich', 'face-to-face', 'gespräch',
    'beratung', 'coaching', 'training', 'interaktion', 'kommunikation'
  ];

  // Trend detection keywords
  private increasingTrendKeywords = [
    'ai', 'automatisierung', 'automatisch', 'digitalisierung', 'digital',
    'software', 'system', 'tool', 'platform', 'online', 'cloud',
    'api', 'integration', 'workflow', 'prozess', 'optimierung',
    'machine learning', 'robotic', 'rpa', 'chatbot', 'assistant'
  ];

  private decreasingTrendKeywords = [
    'manuell', 'handschriftlich', 'papier', 'analog', 'physisch',
    'persönlich', 'face-to-face', 'vor ort', 'kreativ', 'innovativ',
    'strategisch', 'entscheidung', 'führung', 'management', 'beratung'
  ];

  analyzeContext(taskText: string, jobContext?: string): ContextAnalysis {
    const lowerText = taskText.toLowerCase();
    const fullContext = jobContext ? `${jobContext} ${taskText}`.toLowerCase() : lowerText;

    // Extract systems
    const systems = this.extractSystems(fullContext);

    // Analyze automation signals
    const automationSignals = {
      repetitive: this.calculateSignal(lowerText, this.repetitiveKeywords),
      structured: this.calculateSignal(lowerText, this.structuredKeywords),
      digital: this.calculateSignal(lowerText, this.digitalKeywords),
      routine: this.calculateSignal(lowerText, this.routineKeywords),
      creative: this.calculateSignal(lowerText, this.creativeKeywords),
      human: this.calculateSignal(lowerText, this.humanKeywords)
    };

    // Calculate complexity
    const complexity = this.assessComplexity(lowerText, systems);

    // Calculate trend
    const trend = this.assessTrend(lowerText, systems);

    // Calculate final score
    const finalScore = this.calculateFinalScore(automationSignals, complexity);

    return {
      complexity,
      trend,
      systems,
      automationSignals,
      finalScore: Math.round(finalScore)
    };
  }

  private extractSystems(text: string): string[] {
    const foundSystems: string[] = [];
    
    for (const [system, keywords] of Object.entries(this.systemKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        foundSystems.push(system);
      }
    }
    
    return foundSystems;
  }

  private calculateSignal(text: string, keywords: string[]): number {
    const matches = keywords.filter(keyword => text.includes(keyword));
    return Math.min(100, matches.length * 20); // Max 100 points
  }

  private assessComplexity(text: string, systems: string[]): 'low' | 'medium' | 'high' {
    let complexityScore = 0;
    
    // Task-specific complexity factors
    const highComplexityKeywords = [
      'strategie', 'strategy', 'planung', 'planning', 'entwicklung', 'development',
      'integration', 'api', 'database', 'analysis', 'analysieren', 'beratung', 'consulting',
      'führung', 'leadership', 'management', 'koordination', 'coordination', 'abstimmung',
      'steuerung', 'controlling', 'optimierung', 'optimization', 'architektur', 'architecture'
    ];
    
    const mediumComplexityKeywords = [
      'bericht', 'report', 'dokumentation', 'documentation', 'überwachung', 'monitoring',
      'verwaltung', 'administration', 'organisation', 'organization', 'kommunikation', 'communication',
      'abstimmung', 'reconciliation', 'prüfung', 'review', 'validierung', 'validation'
    ];
    
    const lowComplexityKeywords = [
      'eingabe', 'input', 'erfassung', 'entry', 'sortierung', 'sorting', 'filterung', 'filtering',
      'kopieren', 'copy', 'verschieben', 'move', 'archivierung', 'archiving', 'drucken', 'printing'
    ];
    
    // Calculate complexity based on keywords
    const highMatches = highComplexityKeywords.filter(keyword => text.includes(keyword));
    const mediumMatches = mediumComplexityKeywords.filter(keyword => text.includes(keyword));
    const lowMatches = lowComplexityKeywords.filter(keyword => text.includes(keyword));
    
    complexityScore += highMatches.length * 25;
    complexityScore += mediumMatches.length * 15;
    complexityScore -= lowMatches.length * 10;
    
    // System integration factor (more systems = higher complexity)
    complexityScore += systems.length * 8;
    
    // Text length factor (longer descriptions = higher complexity)
    if (text.length > 150) complexityScore += 15;
    else if (text.length > 80) complexityScore += 8;
    
    // Industry-specific complexity adjustments
    if (text.includes('finanz') || text.includes('finance') || text.includes('buchhaltung') || text.includes('accounting')) {
      complexityScore += 10; // Financial tasks are typically more complex
    }
    
    if (text.includes('marketing') || text.includes('kampagne') || text.includes('campaign')) {
      complexityScore += 5; // Marketing tasks have medium complexity
    }
    
    // Determine complexity level
    if (complexityScore >= 40) return 'high';
    if (complexityScore >= 20) return 'medium';
    return 'low';
  }

  private assessTrend(text: string, systems: string[]): 'increasing' | 'stable' | 'decreasing' {
    let trendScore = 0;
    
    // Count increasing trend keywords
    const increasingMatches = this.increasingTrendKeywords.filter(keyword => text.includes(keyword));
    trendScore += increasingMatches.length * 15;
    
    // Count decreasing trend keywords
    const decreasingMatches = this.decreasingTrendKeywords.filter(keyword => text.includes(keyword));
    trendScore -= decreasingMatches.length * 15;
    
    // System-based trend analysis
    const automationSystems = ['api', 'cloud', 'workflow', 'integration', 'analytics'];
    const automationSystemCount = systems.filter(system => automationSystems.includes(system)).length;
    trendScore += automationSystemCount * 10;
    
    // Industry-specific trend adjustments
    if (text.includes('buchhaltung') || text.includes('accounting') || text.includes('finanz') || text.includes('finance')) {
      trendScore += 20; // Finance/accounting is rapidly automating
    }
    
    if (text.includes('marketing') || text.includes('kampagne') || text.includes('campaign')) {
      trendScore += 15; // Marketing automation is growing
    }
    
    if (text.includes('hr') || text.includes('personal') || text.includes('recruiting')) {
      trendScore += 10; // HR automation is increasing
    }
    
    // Determine trend
    if (trendScore >= 25) return 'increasing';
    if (trendScore <= -25) return 'decreasing';
    return 'stable';
  }

  private calculateFinalScore(signals: any, complexity: string): number {
    let score = 50; // Base score
    
    // Positive signals
    score += signals.repetitive * 0.3;
    score += signals.structured * 0.4;
    score += signals.digital * 0.3;
    score += signals.routine * 0.2;
    
    // Negative signals
    score -= signals.creative * 0.4;
    score -= signals.human * 0.3;
    
    // Complexity adjustment
    if (complexity === 'low') score += 10;
    if (complexity === 'high') score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  detectIndustry(text: string): string {
    const lowerText = text.toLowerCase();
    
    const industryKeywords = {
      'tech': ['software', 'development', 'programming', 'api', 'system'],
      'finance': ['finance', 'accounting', 'banking', 'investment', 'budget'],
      'marketing': ['marketing', 'advertising', 'campaign', 'social media', 'content'],
      'hr': ['hr', 'human resources', 'recruitment', 'personnel', 'training'],
      'healthcare': ['healthcare', 'medical', 'patient', 'clinical', 'treatment'],
      'education': ['education', 'teaching', 'learning', 'training', 'course'],
      'legal': ['legal', 'law', 'contract', 'compliance', 'regulation'],
      'sales': ['sales', 'customer', 'client', 'deal', 'negotiation']
    };
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return industry;
      }
    }
    
    return 'general';
  }
}

// Export singleton instance
export const contextAnalyzer = new ContextAnalyzer();
