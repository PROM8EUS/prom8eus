// Task Analysis and Subtask Generation - REAL WORLD TASKS
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

export class TaskAnalyzer {
  // REAL WORLD TASK PATTERNS based on actual business tasks
  private static taskPatterns = {
    'customer-service': {
      keywords: [
        // English
        'customer service', 'customer support', 'helpdesk', 'support ticket', 'inquiry', 'complaint', 'customer care',
        'phone support', 'email support', 'chat support', 'customer assistance', 'customer relations',
        // German
        'kundenservice', 'kundensupport', 'kundenbetreuung', 'kundenberatung', 'telefonische beratung', 'hotline',
        'kundensupport', 'kundenanfragen', 'kundenbeschwerden', 'kundenservice', 'kundenbetreuung',
        'telefon', 'beratung', 'support', 'anfragen', 'beschwerden', 'kundendienst'
      ],
      subtasks: [
        {
          id: 'inquiry-processing',
          title: 'Kundenanfragen erfassen und kategorisieren',
          systems: ['CRM', 'Helpdesk', 'Email', 'Phone System', 'Chat Platform'],
          manualHoursShare: 0.25,
          automationPotential: 0.80,
          risks: ['Unvollständige Informationen', 'Falsche Kategorisierung'],
          assumptions: ['Strukturierte Anfragen', 'CRM-System verfügbar']
        },
        {
          id: 'response-generation',
          title: 'Standardantworten und Lösungen generieren',
          systems: ['Knowledge Base', 'AI Assistant', 'CRM', 'Template System'],
          manualHoursShare: 0.30,
          automationPotential: 0.85,
          risks: ['Falsche Antworten', 'Unvollständige Lösungen'],
          assumptions: ['Aktuelle Wissensbasis', 'Vollständige FAQ']
        },
        {
          id: 'escalation-handling',
          title: 'Komplexe Anfragen eskalieren und verfolgen',
          systems: ['CRM', 'Slack', 'Email', 'Escalation System'],
          manualHoursShare: 0.20,
          automationPotential: 0.60,
          risks: ['Verzögerte Eskalation', 'Verlorene Anfragen'],
          assumptions: ['Klare Eskalationsregeln', 'Experten verfügbar']
        },
        {
          id: 'follow-up',
          title: 'Nachverfolgung und Kundenzufriedenheit',
          systems: ['CRM', 'Survey Tool', 'Email', 'Feedback System'],
          manualHoursShare: 0.25,
          automationPotential: 0.75,
          risks: ['Fehlendes Feedback', 'Unzufriedene Kunden'],
          assumptions: ['Kundenbereitschaft', 'Feedback-System']
        }
      ]
    },
    'data-analysis': {
      keywords: [
        // English
        'data analysis', 'data processing', 'reporting', 'analytics', 'business intelligence', 'data insights',
        'data extraction', 'data cleaning', 'data visualization', 'dashboard', 'metrics', 'kpi',
        'data mining', 'statistical analysis', 'performance analysis', 'trend analysis',
        // German
        'datenanalyse', 'datenverarbeitung', 'berichterstattung', 'analytik', 'business intelligence', 'datenauswertung',
        'datenexport', 'datenbereinigung', 'datenvisualisierung', 'dashboard', 'kennzahlen', 'kpi',
        'datenauswertung', 'statistische analyse', 'leistungsanalyse', 'trendanalyse',
        'export', 'konsolidierung', 'visualisierung', 'berichte', 'auswertung'
      ],
      subtasks: [
        {
          id: 'data-collection',
          title: 'Daten aus verschiedenen Quellen sammeln',
          systems: ['Database', 'API', 'Excel', 'CSV', 'Web Scraping', 'ETL Tools'],
          manualHoursShare: 0.20,
          automationPotential: 0.90,
          risks: ['Datenzugriff verweigert', 'API-Limits', 'Datenqualität'],
          assumptions: ['Verfügbare Datenquellen', 'API-Zugang', 'Konsistente Formate']
        },
        {
          id: 'data-preparation',
          title: 'Daten bereinigen und für Analyse vorbereiten',
          systems: ['Excel', 'Python', 'R', 'Data Cleaning Tools', 'ETL'],
          manualHoursShare: 0.25,
          automationPotential: 0.85,
          risks: ['Datenverlust', 'Falsche Bereinigung', 'Schema-Drift'],
          assumptions: ['Datenqualitätsstandards', 'Bereinigungsregeln definiert']
        },
        {
          id: 'data-analysis',
          title: 'Analyse durchführen und Insights generieren',
          systems: ['Python', 'R', 'SQL', 'BI Tools', 'Analytics Platform'],
          manualHoursShare: 0.30,
          automationPotential: 0.70,
          risks: ['Falsche Interpretation', 'Statistische Fehler', 'Voreingenommenheit'],
          assumptions: ['Klare Analyseziele', 'Statistische Kenntnisse']
        },
        {
          id: 'data-presentation',
          title: 'Ergebnisse visualisieren und präsentieren',
          systems: ['Power BI', 'Tableau', 'Excel', 'Presentation Tools', 'Dashboard'],
          manualHoursShare: 0.25,
          automationPotential: 0.75,
          risks: ['Falsche Darstellung', 'Unverständliche Visualisierung'],
          assumptions: ['Design-Vorlagen', 'Präsentationsstandards']
        }
      ]
    },
    'marketing': {
      keywords: [
        // English
        'marketing', 'campaign', 'advertising', 'social media', 'content marketing', 'email marketing',
        'digital marketing', 'seo', 'sem', 'ppc', 'branding', 'lead generation', 'conversion',
        'marketing automation', 'customer acquisition', 'market research', 'competitive analysis',
        // German
        'marketing', 'kampagne', 'werbung', 'social media', 'content marketing', 'email marketing',
        'digitales marketing', 'seo', 'sem', 'ppc', 'branding', 'lead generation', 'konversion',
        'marketing automation', 'kundengewinnung', 'marktforschung', 'wettbewerbsanalyse',
        'kampagne', 'werbung', 'social media', 'content', 'email', 'seo', 'sem'
      ],
      subtasks: [
        {
          id: 'campaign-planning',
          title: 'Marketing-Kampagne planen und strategieren',
          systems: ['Marketing Platform', 'Analytics', 'Research Tools', 'Planning Tools'],
          manualHoursShare: 0.20,
          automationPotential: 0.60,
          risks: ['Falsche Zielgruppe', 'Unrealistische Ziele', 'Budget-Überschreitung'],
          assumptions: ['Marktkenntnis', 'Budget verfügbar', 'Klare Ziele']
        },
        {
          id: 'content-creation',
          title: 'Marketing-Content erstellen und optimieren',
          systems: ['Design Tools', 'AI Tools', 'Content Management', 'SEO Tools'],
          manualHoursShare: 0.35,
          automationPotential: 0.80,
          risks: ['Qualitätsverlust', 'SEO-Fehler', 'Brand-Violations'],
          assumptions: ['Brand-Guidelines', 'Content-Strategie', 'Kreative Tools']
        },
        {
          id: 'campaign-execution',
          title: 'Kampagne ausführen und überwachen',
          systems: ['Marketing Automation', 'Analytics', 'Social Media', 'Email Platform'],
          manualHoursShare: 0.25,
          automationPotential: 0.85,
          risks: ['Technische Fehler', 'Performance-Probleme', 'Timing-Fehler'],
          assumptions: ['Automatisierungstools', 'Performance-Monitoring']
        },
        {
          id: 'performance-analysis',
          title: 'Kampagnen-Performance analysieren und optimieren',
          systems: ['Analytics', 'Reporting Tools', 'A/B Testing', 'Optimization Tools'],
          manualHoursShare: 0.20,
          automationPotential: 0.90,
          risks: ['Falsche Interpretation', 'Verpasste Optimierungen'],
          assumptions: ['Performance-Daten', 'Optimierungsregeln']
        }
      ]
    },
    'sales': {
      keywords: [
        // English
        'sales', 'lead generation', 'prospecting', 'pipeline', 'deal', 'opportunity', 'quota',
        'sales process', 'customer acquisition', 'account management', 'sales forecasting',
        'sales reporting', 'commission', 'sales training', 'sales enablement',
        // German
        'vertrieb', 'lead generation', 'akquise', 'pipeline', 'deal', 'opportunity', 'quote',
        'vertriebsprozess', 'kundengewinnung', 'account management', 'vertriebsprognose',
        'vertriebsberichte', 'provision', 'vertriebstraining', 'sales enablement',
        'vertrieb', 'akquise', 'pipeline', 'deal', 'kundengewinnung', 'prognose'
      ],
      subtasks: [
        {
          id: 'lead-generation',
          title: 'Leads generieren und qualifizieren',
          systems: ['CRM', 'Lead Generation Tools', 'LinkedIn', 'Email', 'Phone'],
          manualHoursShare: 0.25,
          automationPotential: 0.80,
          risks: ['Schlechte Lead-Qualität', 'Spam-Filter', 'Datenschutz'],
          assumptions: ['Lead-Quellen', 'Qualifizierungskriterien', 'Datenschutz-Compliance']
        },
        {
          id: 'prospecting',
          title: 'Prospekte recherchieren und kontaktieren',
          systems: ['CRM', 'Research Tools', 'LinkedIn', 'Email', 'Phone', 'Social Media'],
          manualHoursShare: 0.30,
          automationPotential: 0.70,
          risks: ['Falsche Kontaktdaten', 'Keine Antwort', 'Spam-Filter'],
          assumptions: ['Prospekt-Datenbank', 'Kontaktstrategie', 'Follow-up-Prozess']
        },
        {
          id: 'deal-management',
          title: 'Deals verwalten und durch Pipeline führen',
          systems: ['CRM', 'Pipeline Tools', 'Proposal Tools', 'Contract Management'],
          manualHoursShare: 0.25,
          automationPotential: 0.75,
          risks: ['Deal-Stagnation', 'Verlorene Deals', 'Falsche Prognosen'],
          assumptions: ['Pipeline-Prozess', 'Qualifizierungskriterien', 'Follow-up-System']
        },
        {
          id: 'sales-reporting',
          title: 'Vertriebsberichte erstellen und analysieren',
          systems: ['CRM', 'Analytics', 'Reporting Tools', 'Excel', 'BI Tools'],
          manualHoursShare: 0.20,
          automationPotential: 0.85,
          risks: ['Falsche Daten', 'Verzögerte Berichte', 'Fehlende Insights'],
          assumptions: ['Datenqualität', 'Reporting-Standards', 'Analytics-Tools']
        }
      ]
    },
    'finance-accounting': {
      keywords: [
        // English
        'finance', 'accounting', 'invoice', 'payment', 'billing', 'expense', 'bookkeeping',
        'financial reporting', 'budget', 'forecasting', 'reconciliation', 'audit',
        'tax', 'compliance', 'financial analysis', 'cost analysis',
        // German
        'finanzen', 'buchhaltung', 'rechnung', 'zahlung', 'abrechnung', 'ausgaben', 'buchführung',
        'finanzberichte', 'budget', 'prognose', 'abstimmung', 'prüfung',
        'steuern', 'compliance', 'finanzanalyse', 'kostenanalyse',
        'buchhaltung', 'rechnung', 'zahlung', 'ausgaben', 'finanzberichte', 'budget'
      ],
      subtasks: [
        {
          id: 'invoice-processing',
          title: 'Rechnungen verarbeiten und buchen',
          systems: ['Accounting Software', 'OCR', 'Email', 'Invoice Management'],
          manualHoursShare: 0.30,
          automationPotential: 0.85,
          risks: ['OCR-Fehler', 'Falsche Buchung', 'Doppelte Rechnungen'],
          assumptions: ['Digitale Rechnungen', 'Buchungsregeln', 'OCR-System']
        },
        {
          id: 'payment-tracking',
          title: 'Zahlungen verfolgen und abstimmen',
          systems: ['Banking System', 'Accounting', 'CRM', 'Payment Platform'],
          manualHoursShare: 0.25,
          automationPotential: 0.80,
          risks: ['Verzögerte Zahlungen', 'Fehlende Zahlungen', 'Abstimmungsfehler'],
          assumptions: ['Bank-API-Zugang', 'Zahlungsprozess', 'Abstimmungsregeln']
        },
        {
          id: 'expense-management',
          title: 'Ausgaben verwalten und genehmigen',
          systems: ['Expense Tool', 'Receipt Scanner', 'Approval System', 'Accounting'],
          manualHoursShare: 0.25,
          automationPotential: 0.90,
          risks: ['Fehlende Belege', 'Genehmigungsverzögerungen', 'Policy-Violations'],
          assumptions: ['Expense-Policy', 'Digitale Belege', 'Genehmigungsprozess']
        },
        {
          id: 'financial-reporting',
          title: 'Finanzberichte erstellen und analysieren',
          systems: ['Accounting', 'BI Tools', 'Excel', 'Reporting Platform'],
          manualHoursShare: 0.20,
          automationPotential: 0.75,
          risks: ['Falsche Daten', 'Verzögerte Berichte', 'Compliance-Fehler'],
          assumptions: ['Buchungsqualität', 'Reporting-Standards', 'Compliance-Regeln']
        }
      ]
    },
    'hr-recruitment': {
      keywords: [
        // English
        'hr', 'recruitment', 'hiring', 'talent acquisition', 'onboarding', 'employee',
        'candidate', 'interview', 'job posting', 'resume', 'application', 'screening',
        'performance management', 'training', 'compensation', 'benefits',
        // German
        'hr', 'recruiting', 'einstellung', 'talent acquisition', 'onboarding', 'mitarbeiter',
        'kandidat', 'interview', 'stellenanzeige', 'lebenslauf', 'bewerbung', 'screening',
        'leistungsmanagement', 'training', 'vergütung', 'benefits',
        'recruiting', 'einstellung', 'kandidat', 'interview', 'stellenanzeige', 'bewerbung'
      ],
      subtasks: [
        {
          id: 'job-posting',
          title: 'Stellenanzeigen erstellen und veröffentlichen',
          systems: ['ATS', 'Job Boards', 'Social Media', 'Company Website'],
          manualHoursShare: 0.20,
          automationPotential: 0.80,
          risks: ['Falsche Anzeigen', 'Schlechte Reichweite', 'Diskriminierung'],
          assumptions: ['Job-Description', 'Budget für Job Boards', 'Compliance-Regeln']
        },
        {
          id: 'candidate-screening',
          title: 'Bewerber vorsortieren und qualifizieren',
          systems: ['ATS', 'AI Screening', 'Email', 'Assessment Tools'],
          manualHoursShare: 0.30,
          automationPotential: 0.85,
          risks: ['Gute Kandidaten übersehen', 'Bias in Screening', 'Schlechte Kandidaten'],
          assumptions: ['Klare Kriterien', 'Screening-Tools', 'Bias-Training']
        },
        {
          id: 'interview-process',
          title: 'Interviews koordinieren und durchführen',
          systems: ['Calendar', 'Video Platform', 'Interview Tools', 'Feedback System'],
          manualHoursShare: 0.25,
          automationPotential: 0.90,
          risks: ['Termin-Konflikte', 'Technische Probleme', 'Schlechte Interviews'],
          assumptions: ['Interviewer verfügbar', 'Technische Ausstattung', 'Interview-Guide']
        },
        {
          id: 'onboarding',
          title: 'Onboarding-Prozess durchführen',
          systems: ['HR System', 'Training Platform', 'Documentation', 'Communication Tools'],
          manualHoursShare: 0.25,
          automationPotential: 0.75,
          risks: ['Unvollständiges Onboarding', 'Überforderung', 'Frühe Kündigung'],
          assumptions: ['Onboarding-Plan', 'Training-Material', 'Mentor-System']
        }
      ]
    },
    'operations': {
      keywords: [
        // English
        'operations', 'process', 'workflow', 'efficiency', 'optimization', 'automation',
        'supply chain', 'inventory', 'logistics', 'quality control', 'production',
        'maintenance', 'scheduling', 'resource management', 'performance monitoring',
        // German
        'operationen', 'prozess', 'workflow', 'effizienz', 'optimierung', 'automatisierung',
        'lieferkette', 'inventar', 'logistik', 'qualitätskontrolle', 'produktion',
        'wartung', 'planung', 'ressourcenmanagement', 'leistungsüberwachung',
        'prozess', 'workflow', 'effizienz', 'optimierung', 'automatisierung', 'planung'
      ],
      subtasks: [
        {
          id: 'process-analysis',
          title: 'Prozesse analysieren und optimieren',
          systems: ['Process Mining', 'Analytics', 'Documentation', 'Mapping Tools'],
          manualHoursShare: 0.25,
          automationPotential: 0.70,
          risks: ['Unvollständige Analyse', 'Falsche Optimierung', 'Widerstand gegen Änderungen'],
          assumptions: ['Prozess-Dokumentation', 'Analytics-Tools', 'Change Management']
        },
        {
          id: 'workflow-automation',
          title: 'Workflows automatisieren und implementieren',
          systems: ['RPA', 'Workflow Tools', 'Integration Platform', 'Testing Tools'],
          manualHoursShare: 0.30,
          automationPotential: 0.90,
          risks: ['Technische Fehler', 'Prozess-Ausfälle', 'Schlechte Performance'],
          assumptions: ['Stabile Prozesse', 'Technische Expertise', 'Testing-Umgebung']
        },
        {
          id: 'performance-monitoring',
          title: 'Performance überwachen und optimieren',
          systems: ['Monitoring Tools', 'Analytics', 'Dashboard', 'Alert System'],
          manualHoursShare: 0.20,
          automationPotential: 0.85,
          risks: ['Späte Erkennung', 'Falsche Alerts', 'Performance-Probleme'],
          assumptions: ['Monitoring-Setup', 'Performance-Baseline', 'Optimierungsregeln']
        },
        {
          id: 'continuous-improvement',
          title: 'Kontinuierliche Verbesserung implementieren',
          systems: ['Feedback System', 'Analytics', 'Collaboration Tools', 'Documentation'],
          manualHoursShare: 0.25,
          automationPotential: 0.75,
          risks: ['Fehlende Verbesserungen', 'Widerstand', 'Ressourcenmangel'],
          assumptions: ['Improvement-Kultur', 'Feedback-Prozess', 'Ressourcen']
        }
      ]
    }
  };

  // Analyze task and generate appropriate subtasks
  public static analyzeTask(task: TaskContext): GeneratedSubtask[] {
    const taskText = `${task.title} ${task.description || ''} ${task.category}`.toLowerCase();
    
    console.log('🔍 Task Analysis:', {
      taskText,
      title: task.title,
      category: task.category,
      systems: task.systems
    });
    
    // Find the best matching task pattern
    let bestMatch = 'general';
    let bestScore = 0;
    
    Object.entries(this.taskPatterns).forEach(([pattern, config]) => {
      const score = config.keywords.reduce((acc, keyword) => {
        return acc + (taskText.includes(keyword) ? 1 : 0);
      }, 0);
      
      console.log(`  Pattern "${pattern}": score ${score}`);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    });
    
    console.log(`🎯 Best match: "${bestMatch}" with score ${bestScore}`);
    
    // Get subtasks for the matched pattern
    const pattern = this.taskPatterns[bestMatch as keyof typeof this.taskPatterns];
    
    if (!pattern) {
      console.log('⚠️ No pattern found, using universal fallback');
      // Universal fallback subtasks for any task
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
    
    // Customize subtasks based on task context
    const customizedSubtasks = pattern.subtasks.map(subtask => ({
      ...subtask,
      systems: this.customizeSystems(subtask.systems, task.systems || [])
    }));
    
    console.log(`✅ Generated ${customizedSubtasks.length} subtasks for pattern "${bestMatch}"`);
    return customizedSubtasks;
  }

  // Customize systems based on task context
  private static customizeSystems(defaultSystems: string[], taskSystems: string[]): string[] {
    if (taskSystems.length === 0) return defaultSystems;
    
    // Merge task-specific systems with default systems
    const allSystems = [...new Set([...defaultSystems, ...taskSystems])];
    
    // Prioritize task-specific systems
    return [
      ...taskSystems,
      ...defaultSystems.filter(system => !taskSystems.includes(system))
    ];
  }

  // Get task domain for workflow matching
  public static getTaskDomain(task: TaskContext): string {
    const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
    
    const domainPatterns = {
      'customer-service': ['customer', 'support', 'beratung', 'telefon', 'phone', 'call', 'hotline', 'kundenservice'],
      'data-analysis': ['data', 'analysis', 'report', 'analytics', 'daten', 'analyse', 'export', 'konsolidierung'],
      'marketing': ['marketing', 'campaign', 'werbung', 'social media', 'content', 'seo', 'sem'],
      'sales': ['sales', 'vertrieb', 'akquise', 'pipeline', 'deal', 'kundengewinnung'],
      'finance-accounting': ['finance', 'accounting', 'buchhaltung', 'rechnung', 'zahlung', 'ausgaben'],
      'hr-recruitment': ['hr', 'recruitment', 'recruiting', 'einstellung', 'kandidat', 'interview'],
      'operations': ['operations', 'prozess', 'workflow', 'effizienz', 'optimierung', 'automatisierung']
    };
    
    let bestDomain = 'general';
    let bestScore = 0;
    
    Object.entries(domainPatterns).forEach(([domain, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (taskText.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    });
    
    return bestDomain;
  }
}
