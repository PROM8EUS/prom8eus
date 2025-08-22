export interface TaskPattern {
  id: string;
  name: string;
  keywords: string[];
  automationScore: number;
  complexity: 'low' | 'medium' | 'high';
  confidence: number;
  category: string;
}

export interface PatternMatch {
  pattern: string;
  score: number;
  confidence: number;
  category: string;
  complexity: 'low' | 'medium' | 'high';
}

export class InstantPatternMatcher {
  private patterns: Record<string, TaskPattern> = {
    'data-entry': {
      id: 'data-entry',
      name: 'Dateneingabe',
      keywords: ['eingabe', 'erfassung', 'daten', 'excel', 'tabelle', 'input', 'data entry', 'dateneingabe'],
      automationScore: 85,
      complexity: 'low',
      confidence: 0.8,
      category: 'administrative'
    },
    'reporting': {
      id: 'reporting',
      name: 'Berichtserstellung',
      keywords: ['bericht', 'report', 'dashboard', 'kpi', 'auswertung', 'reporting', 'statistik'],
      automationScore: 75,
      complexity: 'medium',
      confidence: 0.7,
      category: 'analytical'
    },
    'communication': {
      id: 'communication',
      name: 'Kommunikation',
      keywords: ['email', 'meeting', 'präsentation', 'kommunikation', 'gespräch', 'verhandlung'],
      automationScore: 45,
      complexity: 'medium',
      confidence: 0.6,
      category: 'communication'
    },
    'planning': {
      id: 'planning',
      name: 'Planung',
      keywords: ['planung', 'planning', 'organisation', 'koordination', 'scheduling'],
      automationScore: 60,
      complexity: 'medium',
      confidence: 0.7,
      category: 'administrative'
    },
    'analysis': {
      id: 'analysis',
      name: 'Datenanalyse',
      keywords: ['analyse', 'analysis', 'auswertung', 'evaluation', 'forschung', 'research'],
      automationScore: 70,
      complexity: 'high',
      confidence: 0.8,
      category: 'analytical'
    },
    'documentation': {
      id: 'documentation',
      name: 'Dokumentation',
      keywords: ['dokumentation', 'documentation', 'protokoll', 'minutes', 'notizen'],
      automationScore: 80,
      complexity: 'low',
      confidence: 0.8,
      category: 'administrative'
    },
    'quality-control': {
      id: 'quality-control',
      name: 'Qualitätskontrolle',
      keywords: ['qualität', 'quality', 'kontrolle', 'prüfung', 'review', 'testing'],
      automationScore: 65,
      complexity: 'medium',
      confidence: 0.7,
      category: 'analytical'
    },
    'creative': {
      id: 'creative',
      name: 'Kreative Arbeit',
      keywords: ['design', 'kreativ', 'creative', 'content', 'marketing', 'werbung'],
      automationScore: 35,
      complexity: 'high',
      confidence: 0.6,
      category: 'creative'
    },
    'management': {
      id: 'management',
      name: 'Management',
      keywords: ['führung', 'management', 'leitung', 'strategie', 'decision', 'entscheidung'],
      automationScore: 25,
      complexity: 'high',
      confidence: 0.5,
      category: 'management'
    },
    // Finance & Accounting Patterns
    'finance': {
      id: 'finance',
      name: 'Finanzwesen',
      keywords: ['finanz', 'finance', 'buchhaltung', 'accounting', 'buchung', 'konto', 'account'],
      automationScore: 70,
      complexity: 'medium',
      confidence: 0.8,
      category: 'finance'
    },
    'accounting': {
      id: 'accounting',
      name: 'Buchhaltung',
      keywords: ['buchhaltung', 'accounting', 'buchung', 'beleg', 'kontierung', 'kontierung von belegen'],
      automationScore: 75,
      complexity: 'medium',
      confidence: 0.8,
      category: 'finance'
    },
    'bookkeeping': {
      id: 'bookkeeping',
      name: 'Buchführung',
      keywords: ['buchführung', 'bookkeeping', 'finanzbuchhaltung', 'führung der finanzbuchhaltung'],
      automationScore: 80,
      complexity: 'medium',
      confidence: 0.9,
      category: 'finance'
    },
    'financial-reporting': {
      id: 'financial-reporting',
      name: 'Finanzberichte',
      keywords: ['monatsabschluss', 'jahresabschluss', 'erstellung von monats- und jahresabschlüssen', 'abschluss'],
      automationScore: 65,
      complexity: 'high',
      confidence: 0.8,
      category: 'finance'
    },
    'tax-accounting': {
      id: 'tax-accounting',
      name: 'Steuerwesen',
      keywords: ['umsatzsteuervoranmeldung', 'umsatzsteuervoranmeldungen', 'steuer', 'tax', 'steuerberater'],
      automationScore: 60,
      complexity: 'high',
      confidence: 0.7,
      category: 'finance'
    },
    'budget-control': {
      id: 'budget-control',
      name: 'Budget & Controlling',
      keywords: ['budgetplanung', 'budgetplanung und controlling', 'controlling', 'budget'],
      automationScore: 70,
      complexity: 'medium',
      confidence: 0.8,
      category: 'finance'
    },
    'payment-processing': {
      id: 'payment-processing',
      name: 'Zahlungsverkehr',
      keywords: ['mahnwesen', 'zahlungsverkehr', 'mahnwesen und zahlungsverkehr'],
      automationScore: 85,
      complexity: 'low',
      confidence: 0.9,
      category: 'finance'
    },
    'account-reconciliation': {
      id: 'account-reconciliation',
      name: 'Kontenabstimmung',
      keywords: ['abstimmung', 'abstimmung von konten', 'kontenabstimmung'],
      automationScore: 80,
      complexity: 'medium',
      confidence: 0.8,
      category: 'finance'
    },
    'routine': {
      id: 'routine',
      name: 'Routineaufgaben',
      keywords: ['routine', 'wiederkehrend', 'repetitive', 'standard', 'prozess'],
      automationScore: 90,
      complexity: 'low',
      confidence: 0.9,
      category: 'administrative'
    },
    // Neue Patterns für gängige Stellenanzeigen
    'recruitment': {
      id: 'recruitment',
      name: 'Recruiting',
      keywords: ['recruiting', 'stellenanzeige', 'bewerbung', 'kandidat', 'interview', 'onboarding', 'personal', 'hr'],
      automationScore: 60,
      complexity: 'medium',
      confidence: 0.85,
      category: 'hr'
    },
    'sales': {
      id: 'sales',
      name: 'Vertrieb',
      keywords: ['vertrieb', 'sales', 'verkauf', 'lead', 'kunde', 'angebot', 'vertrag', 'umsatz', 'akquise'],
      automationScore: 50,
      complexity: 'medium',
      confidence: 0.8,
      category: 'sales'
    },
    'marketing': {
      id: 'marketing',
      name: 'Marketing',
      keywords: ['marketing', 'kampagne', 'content', 'social media', 'werbung', 'branding', 'seo', 'roi'],
      automationScore: 55,
      complexity: 'medium',
      confidence: 0.8,
      category: 'marketing'
    },
    'marketing-strategy': {
      id: 'marketing-strategy',
      name: 'Marketing-Strategie',
      keywords: ['strategie', 'strategic', 'planung', 'planning', 'konzept', 'concept', 'zielgruppe', 'target audience', 'positionierung'],
      automationScore: 35,
      complexity: 'high',
      confidence: 0.85,
      category: 'marketing'
    },
    'marketing-campaign': {
      id: 'marketing-campaign',
      name: 'Marketing-Kampagne',
      keywords: ['kampagne', 'campaign', 'werbung', 'advertising', 'promotion', 'launch', 'rollout', 'aktivierung'],
      automationScore: 60,
      complexity: 'medium',
      confidence: 0.8,
      category: 'marketing'
    },
    'content-marketing': {
      id: 'content-marketing',
      name: 'Content Marketing',
      keywords: ['content', 'blog', 'artikel', 'article', 'whitepaper', 'ebook', 'video', 'podcast', 'storytelling'],
      automationScore: 50,
      complexity: 'medium',
      confidence: 0.8,
      category: 'marketing'
    },
    'social-media': {
      id: 'social-media',
      name: 'Social Media Marketing',
      keywords: ['social media', 'facebook', 'instagram', 'linkedin', 'twitter', 'xing', 'post', 'community', 'engagement'],
      automationScore: 65,
      complexity: 'medium',
      confidence: 0.85,
      category: 'marketing'
    },
    'digital-marketing': {
      id: 'digital-marketing',
      name: 'Digital Marketing',
      keywords: ['digital', 'online', 'web', 'seo', 'sem', 'ppc', 'google ads', 'facebook ads', 'remarketing'],
      automationScore: 70,
      complexity: 'medium',
      confidence: 0.85,
      category: 'marketing'
    },
    'brand-marketing': {
      id: 'brand-marketing',
      name: 'Brand Marketing',
      keywords: ['brand', 'branding', 'marke', 'identity', 'image', 'reputation', 'positioning', 'messaging'],
      automationScore: 40,
      complexity: 'high',
      confidence: 0.8,
      category: 'marketing'
    },
    'performance-marketing': {
      id: 'performance-marketing',
      name: 'Performance Marketing',
      keywords: ['performance', 'roi', 'conversion', 'ctr', 'cpc', 'cpa', 'attribution', 'tracking', 'optimization'],
      automationScore: 75,
      complexity: 'medium',
      confidence: 0.9,
      category: 'marketing'
    },
    'customer-service': {
      id: 'customer-service',
      name: 'Kundenservice',
      keywords: ['kundenservice', 'support', 'ticket', 'anfrage', 'problem', 'lösung', 'kunde', 'sla'],
      automationScore: 65,
      complexity: 'medium',
      confidence: 0.85,
      category: 'service'
    },
    'project-management': {
      id: 'project-management',
      name: 'Projektmanagement',
      keywords: ['projekt', 'projektmanagement', 'pm', 'team', 'milestone', 'deliverable', 'risiko', 'agile'],
      automationScore: 45,
      complexity: 'high',
      confidence: 0.8,
      category: 'management'
    },
    'accounting': {
      id: 'accounting',
      name: 'Buchhaltung',
      keywords: ['buchhaltung', 'accounting', 'beleg', 'buchung', 'konto', 'steuer', 'jahresabschluss', 'finanzen'],
      automationScore: 75,
      complexity: 'medium',
      confidence: 0.9,
      category: 'finance'
    },
    'hr': {
      id: 'hr',
      name: 'Personalwesen',
      keywords: ['hr', 'personal', 'mitarbeiter', 'vertrag', 'entwicklung', 'konflikt', 'compliance', 'strategie'],
      automationScore: 50,
      complexity: 'medium',
      confidence: 0.8,
      category: 'hr'
    },
    'it-support': {
      id: 'it-support',
      name: 'IT-Support',
      keywords: ['it', 'support', 'ticket', 'system', 'problem', 'lösung', 'update', 'wartung', 'schulung'],
      automationScore: 70,
      complexity: 'medium',
      confidence: 0.85,
      category: 'it'
    },
    'research': {
      id: 'research',
      name: 'Forschung',
      keywords: ['forschung', 'research', 'analyse', 'studie', 'umfrage', 'daten', 'ergebnis', 'bericht'],
      automationScore: 40,
      complexity: 'high',
      confidence: 0.75,
      category: 'research'
    },
    'logistics': {
      id: 'logistics',
      name: 'Logistik',
      keywords: ['logistik', 'lieferung', 'transport', 'lager', 'route', 'versand', 'supply chain', 'warehouse'],
      automationScore: 70,
      complexity: 'medium',
      confidence: 0.85,
      category: 'logistics'
    }
  };

  match(taskText: string): PatternMatch {
    const lowerText = taskText.toLowerCase();
    let bestMatch: PatternMatch = {
      pattern: 'general',
      score: 50,
      confidence: 0.5,
      category: 'general',
      complexity: 'medium'
    };
    
    let highestScore = 0;
    
    // Spezielle Behandlung für Finance-Aufgaben
    if (lowerText.includes('buchhaltung') || lowerText.includes('finanz') || lowerText.includes('buchung') || 
        lowerText.includes('konto') || lowerText.includes('beleg') || lowerText.includes('abschluss') ||
        lowerText.includes('steuer') || lowerText.includes('budget') || lowerText.includes('controlling') ||
        lowerText.includes('zahlung') || lowerText.includes('mahnwesen') || lowerText.includes('abstimmung')) {
      
      // Finance-spezifische Patterns priorisieren
      const financePatterns = [
        'bookkeeping', 'financial-reporting', 'accounting', 'tax-accounting', 
        'budget-control', 'payment-processing', 'account-reconciliation', 'finance'
      ];
      
      for (const patternId of financePatterns) {
        const pattern = this.patterns[patternId];
        if (!pattern) continue;
        
        const matches = pattern.keywords.filter(keyword => lowerText.includes(keyword));
        
        if (matches.length > 0) {
          // Höhere Gewichtung für Finance-spezifische Keywords
          const keywordCoverage = matches.length / pattern.keywords.length;
          const matchScore = pattern.automationScore * keywordCoverage * 1.5; // 50% Bonus für Finance-Patterns
          
          if (matchScore > highestScore) {
            highestScore = matchScore;
            bestMatch = {
              pattern: patternId,
              score: Math.round(matchScore),
              confidence: pattern.confidence,
              category: pattern.category,
              complexity: pattern.complexity
            };
          }
        }
      }
    }
    
    // Spezielle Behandlung für Marketing-Aufgaben
    if (lowerText.includes('marketing') || lowerText.includes('kampagne') || lowerText.includes('content') || 
        lowerText.includes('social') || lowerText.includes('brand') || lowerText.includes('performance')) {
      
      // Marketing-spezifische Patterns priorisieren
      const marketingPatterns = [
        'marketing-strategy', 'marketing-campaign', 'content-marketing', 'social-media',
        'digital-marketing', 'brand-marketing', 'performance-marketing', 'marketing'
      ];
      
      for (const patternId of marketingPatterns) {
        const pattern = this.patterns[patternId];
        if (!pattern) continue;
        
        const matches = pattern.keywords.filter(keyword => lowerText.includes(keyword));
        
        if (matches.length > 0) {
          // Höhere Gewichtung für Marketing-spezifische Keywords
          const keywordCoverage = matches.length / pattern.keywords.length;
          const matchScore = pattern.automationScore * keywordCoverage * 1.5; // 50% Bonus für Marketing-Patterns
          
          if (matchScore > highestScore) {
            highestScore = matchScore;
            bestMatch = {
              pattern: patternId,
              score: Math.round(matchScore),
              confidence: pattern.confidence,
              category: pattern.category,
              complexity: pattern.complexity
            };
          }
        }
      }
    }
    
    // Standard Pattern-Erkennung für alle anderen Aufgaben
    if (bestMatch.pattern === 'general') {
      for (const [patternId, pattern] of Object.entries(this.patterns)) {
        const matches = pattern.keywords.filter(keyword => lowerText.includes(keyword));
        
        if (matches.length > 0) {
          const keywordCoverage = matches.length / pattern.keywords.length;
          const matchScore = pattern.automationScore * keywordCoverage;
          
          if (matchScore > highestScore) {
            highestScore = matchScore;
            bestMatch = {
              pattern: patternId,
              score: Math.round(matchScore),
              confidence: pattern.confidence,
              category: pattern.category,
              complexity: pattern.complexity
            };
          }
        }
      }
    }
    
    return bestMatch;
  }

  getPatternDetails(patternId: string): TaskPattern | null {
    return this.patterns[patternId] || null;
  }

  getAllPatterns(): TaskPattern[] {
    return Object.values(this.patterns);
  }
}

// Export singleton instance
export const instantMatcher = new InstantPatternMatcher();
