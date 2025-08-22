// Enhanced Pattern-Based Analysis for Task Recognition and Workflow Matching
export interface TaskPattern {
  id: string;
  name: string;
  keywords: string[];
  domain: string;
  category: string;
  automationPotential: number;
  relatedWorkflows: string[];
  relatedSystems: string[];
  subtasks: SubtaskPattern[];
}

export interface SubtaskPattern {
  id: string;
  title: string;
  systems: string[];
  manualHoursShare: number;
  automationPotential: number;
  risks: string[];
  assumptions: string[];
}

export interface WorkflowPattern {
  id: string;
  name: string;
  keywords: string[];
  category: string;
  systems: string[];
  automationLevel: 'high' | 'medium' | 'low';
  estimatedTime: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

// Comprehensive task patterns based on real job descriptions
export const TASK_PATTERNS: TaskPattern[] = [
  // Customer Service Patterns (based on real job descriptions)
  {
    id: 'customer-service',
    name: 'Kundenservice und Beratung',
    keywords: ['kundenservice', 'customer service', 'telefonische beratung', 'phone consultation', 'kundenanfrage', 'customer inquiry', 'email anfragen', 'email inquiries', 'reklamation', 'complaint', 'produktberatung', 'product consulting', 'terminvereinbarung', 'appointment scheduling'],
    domain: 'customer-service',
    category: 'communication',
    automationPotential: 0.70,
    relatedWorkflows: ['customer-support-automation', 'ticket-management', 'appointment-scheduling'],
    relatedSystems: ['CRM', 'Phone System', 'Email', 'Appointment Calendar'],
    subtasks: [
      {
        id: 'phone-consultation',
        title: 'Telefonische Beratung von Kunden',
        systems: ['Phone System', 'CRM', 'Knowledge Base'],
        manualHoursShare: 0.35,
        automationPotential: 0.60,
        risks: ['Lange Wartezeiten', 'Unzufriedene Kunden'],
        assumptions: ['Verfügbare Berater', 'Aktuelle Produktinfos']
      },
      {
        id: 'email-processing',
        title: 'Bearbeitung von E-Mail-Anfragen',
        systems: ['Email System', 'CRM', 'Auto-Response'],
        manualHoursShare: 0.25,
        automationPotential: 0.85,
        risks: ['Verzögerte Antworten'],
        assumptions: ['Strukturierte Anfragen']
      },
      {
        id: 'complaint-handling',
        title: 'Reklamationsbearbeitung',
        systems: ['CRM', 'Case Management', 'Email'],
        manualHoursShare: 0.30,
        automationPotential: 0.75,
        risks: ['Eskalation von Problemen'],
        assumptions: ['Klare Prozesse']
      },
      {
        id: 'appointment-scheduling',
        title: 'Terminvereinbarung für Außendienst',
        systems: ['Calendar System', 'CRM', 'Email'],
        manualHoursShare: 0.10,
        automationPotential: 0.95,
        risks: ['Termin-Konflikte'],
        assumptions: ['Verfügbare Termine']
      }
    ]
  },

  // Data Science Patterns (based on real job descriptions)
  {
    id: 'data-science',
    name: 'Data Science und Analytics',
    keywords: ['data scientist', 'datensammlung', 'data collection', 'statistische analysen', 'statistical analysis', 'machine learning', 'algorithmen', 'algorithms', 'dashboards', 'datenvisualisierung', 'data visualization', 'a/b testing', 'experimente', 'experiments'],
    domain: 'data-science',
    category: 'analytics',
    automationPotential: 0.80,
    relatedWorkflows: ['data-pipeline', 'ml-model-training', 'automated-reporting'],
    relatedSystems: ['Python', 'R', 'SQL', 'Jupyter', 'ML Platforms'],
    subtasks: [
      {
        id: 'data-collection-preparation',
        title: 'Datensammlung und -aufbereitung',
        systems: ['Database', 'API', 'ETL Tools', 'Python'],
        manualHoursShare: 0.20,
        automationPotential: 0.90,
        risks: ['Datenqualitätsprobleme'],
        assumptions: ['Verfügbare Datenquellen']
      },
      {
        id: 'statistical-modeling',
        title: 'Statistische Analysen und Modellierung',
        systems: ['Python', 'R', 'Statistical Software'],
        manualHoursShare: 0.30,
        automationPotential: 0.75,
        risks: ['Falsche Modellannahmen'],
        assumptions: ['Qualitätsdaten']
      },
      {
        id: 'ml-development',
        title: 'Entwicklung von Machine Learning Algorithmen',
        systems: ['ML Platforms', 'Python', 'TensorFlow', 'Scikit-learn'],
        manualHoursShare: 0.35,
        automationPotential: 0.70,
        risks: ['Overfitting', 'Schlechte Performance'],
        assumptions: ['Ausreichende Datenmenge']
      },
      {
        id: 'dashboard-reporting',
        title: 'Erstellung von Dashboards und Berichten',
        systems: ['Power BI', 'Tableau', 'Streamlit', 'Plotly'],
        manualHoursShare: 0.15,
        automationPotential: 0.85,
        risks: ['Falsche Darstellung'],
        assumptions: ['Klare Anforderungen']
      }
    ]
  },

  // Marketing Patterns (based on real job descriptions)
  {
    id: 'marketing-management',
    name: 'Marketing Management',
    keywords: ['marketing manager', 'marketingstrategien', 'marketing strategies', 'werbekampagnen', 'advertising campaigns', 'markttrends', 'market trends', 'kundenverhalten', 'customer behavior', 'social media kanäle', 'social media channels', 'events', 'messen', 'trade shows', 'präsentationen', 'presentations', 'reports'],
    domain: 'marketing',
    category: 'strategy',
    automationPotential: 0.65,
    relatedWorkflows: ['campaign-automation', 'social-media-management', 'performance-tracking'],
    relatedSystems: ['Marketing Platform', 'Social Media', 'Analytics', 'Event Management'],
    subtasks: [
      {
        id: 'strategy-development',
        title: 'Entwicklung und Umsetzung von Marketingstrategien',
        systems: ['Strategy Tools', 'Analytics', 'Market Research'],
        manualHoursShare: 0.30,
        automationPotential: 0.50,
        risks: ['Falsche Markteinschätzung'],
        assumptions: ['Marktkenntnis']
      },
      {
        id: 'campaign-coordination',
        title: 'Koordination von Werbekampagnen',
        systems: ['Campaign Management', 'Ad Platforms', 'Analytics'],
        manualHoursShare: 0.25,
        automationPotential: 0.80,
        risks: ['Budgetüberschreitung'],
        assumptions: ['Klare Kampagnenziele']
      },
      {
        id: 'social-media-management',
        title: 'Betreuung von Social Media Kanälen',
        systems: ['Social Media Platforms', 'Content Management', 'Analytics'],
        manualHoursShare: 0.20,
        automationPotential: 0.85,
        risks: ['Reputationsschäden'],
        assumptions: ['Content-Strategie']
      },
      {
        id: 'event-organization',
        title: 'Organisation von Events und Messen',
        systems: ['Event Management', 'Calendar', 'Communication'],
        manualHoursShare: 0.25,
        automationPotential: 0.70,
        risks: ['Logistische Probleme'],
        assumptions: ['Event-Planung']
      }
    ]
  },

  // Sales Patterns
  {
    id: 'sales-process',
    name: 'Vertriebsprozess verwalten',
    keywords: ['vertrieb', 'sales', 'akquise', 'lead generation', 'pipeline', 'deal', 'kundengewinnung', 'prospekt'],
    domain: 'sales',
    category: 'lead-management',
    automationPotential: 0.80,
    relatedWorkflows: ['lead-scoring', 'sales-automation', 'pipeline-management'],
    relatedSystems: ['CRM', 'Sales Platform', 'LinkedIn', 'Email'],
    subtasks: [
      {
        id: 'lead-generation',
        title: 'Leads generieren und qualifizieren',
        systems: ['CRM', 'Lead Generation Tools', 'LinkedIn'],
        manualHoursShare: 0.20,
        automationPotential: 0.85,
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
        automationPotential: 0.80,
        risks: ['Deal-Stagnation'],
        assumptions: ['Pipeline-Prozess']
      },
      {
        id: 'sales-reporting',
        title: 'Vertriebsberichte erstellen',
        systems: ['CRM', 'Analytics', 'Reporting Tools'],
        manualHoursShare: 0.25,
        automationPotential: 0.90,
        risks: ['Falsche Daten'],
        assumptions: ['Datenqualität']
      }
    ]
  },

  // HR Management Patterns (based on real job descriptions)
  {
    id: 'hr-management',
    name: 'HR Management und Personalwesen',
    keywords: ['hr manager', 'personalplanung', 'human resource planning', 'recruiting', 'bewerbermanagement', 'applicant management', 'mitarbeitergespräche', 'employee interviews', 'arbeitsverträge', 'employment contracts', 'gehaltsabrechnung', 'payroll processing', 'konfliktlösung', 'conflict resolution', 'schulungsplanung', 'training planning', 'compliance', 'arbeitsrecht', 'labor law'],
    domain: 'hr-management',
    category: 'people-management',
    automationPotential: 0.60,
    relatedWorkflows: ['applicant-tracking', 'payroll-automation', 'training-management'],
    relatedSystems: ['HR System', 'ATS', 'Payroll Software', 'Learning Platform'],
    subtasks: [
      {
        id: 'hr-planning',
        title: 'Personalplanung und -entwicklung',
        systems: ['HR Analytics', 'Planning Tools', 'Succession Planning'],
        manualHoursShare: 0.35,
        automationPotential: 0.55,
        risks: ['Falsche Planung'],
        assumptions: ['Strategische Ziele']
      },
      {
        id: 'recruiting-management',
        title: 'Recruiting und Bewerbermanagement',
        systems: ['ATS', 'Job Boards', 'CRM', 'Email'],
        manualHoursShare: 0.25,
        automationPotential: 0.80,
        risks: ['Schlechte Kandidaten'],
        assumptions: ['Klare Anforderungen']
      },
      {
        id: 'employee-interviews',
        title: 'Führung von Mitarbeitergesprächen',
        systems: ['HR System', 'Calendar', 'Documentation'],
        manualHoursShare: 0.40,
        automationPotential: 0.30,
        risks: ['Konflikte'],
        assumptions: ['Vorbereitung']
      },
      {
        id: 'contract-management',
        title: 'Erstellung von Arbeitsverträgen',
        systems: ['Contract Management', 'Templates', 'Digital Signing'],
        manualHoursShare: 0.20,
        automationPotential: 0.85,
        risks: ['Rechtliche Fehler'],
        assumptions: ['Vorlagen']
      }
    ]
  },

  // Accounting Patterns (based on real job descriptions)
  {
    id: 'accounting',
    name: 'Buchhaltung und Finanzwesen',
    keywords: ['buchhalter', 'accountant', 'finanzbuchhaltung', 'financial accounting', 'monatsabschlüsse', 'monthly statements', 'jahresabschlüsse', 'annual statements', 'kontierung', 'accounting', 'umsatzsteuervoranmeldungen', 'vat returns', 'mahnwesen', 'dunning', 'zahlungsverkehr', 'payment processing', 'abstimmung', 'reconciliation', 'steuerberater', 'tax consultants', 'budgetplanung', 'budget planning', 'controlling'],
    domain: 'accounting',
    category: 'financial-management',
    automationPotential: 0.85,
    relatedWorkflows: ['invoice-processing', 'payment-automation', 'financial-reporting'],
    relatedSystems: ['DATEV', 'Accounting Software', 'Banking System', 'Excel'],
    subtasks: [
      {
        id: 'financial-accounting',
        title: 'Führung der Finanzbuchhaltung',
        systems: ['DATEV', 'Accounting Software', 'Document Management'],
        manualHoursShare: 0.20,
        automationPotential: 0.90,
        risks: ['Buchungsfehler'],
        assumptions: ['Digitale Belege']
      },
      {
        id: 'financial-statements',
        title: 'Erstellung von Monats- und Jahresabschlüssen',
        systems: ['Accounting Software', 'Reporting Tools', 'Excel'],
        manualHoursShare: 0.25,
        automationPotential: 0.85,
        risks: ['Falsche Abschlüsse'],
        assumptions: ['Vollständige Daten']
      },
      {
        id: 'document-processing',
        title: 'Kontierung von Belegen',
        systems: ['OCR', 'Accounting Software', 'Workflow'],
        manualHoursShare: 0.15,
        automationPotential: 0.95,
        risks: ['OCR-Fehler'],
        assumptions: ['Qualitätsbelege']
      },
      {
        id: 'tax-compliance',
        title: 'Umsatzsteuervoranmeldungen',
        systems: ['Tax Software', 'Accounting', 'ELSTER'],
        manualHoursShare: 0.20,
        automationPotential: 0.90,
        risks: ['Steuerfehler'],
        assumptions: ['Aktuelle Gesetze']
      }
    ]
  },

  // Software Development Patterns (based on real job descriptions)
  {
    id: 'software-development',
    name: 'Softwareentwicklung',
    keywords: ['software entwickler', 'software developer', 'webanwendungen', 'web applications', 'react', 'node.js', 'code reviews', 'testing', 'datenbankdesign', 'database design', 'api entwicklung', 'api development', 'debugging', 'fehlerbehebung', 'troubleshooting', 'dokumentation', 'documentation', 'agile', 'entwicklungsteam', 'development team'],
    domain: 'software-development',
    category: 'technical',
    automationPotential: 0.75,
    relatedWorkflows: ['ci-cd-pipeline', 'code-review-automation', 'testing-automation'],
    relatedSystems: ['IDE', 'Git', 'CI/CD', 'Testing Tools'],
    subtasks: [
      {
        id: 'web-development',
        title: 'Entwicklung von Webanwendungen mit React und Node.js',
        systems: ['IDE', 'React', 'Node.js', 'Package Manager'],
        manualHoursShare: 0.40,
        automationPotential: 0.60,
        risks: ['Bugs', 'Performance-Probleme'],
        assumptions: ['Klare Anforderungen']
      },
      {
        id: 'code-quality',
        title: 'Code-Reviews und Testing',
        systems: ['Git', 'Code Review Tools', 'Testing Framework'],
        manualHoursShare: 0.25,
        automationPotential: 0.80,
        risks: ['Qualitätsverlust'],
        assumptions: ['Testing-Strategie']
      },
      {
        id: 'database-design',
        title: 'Datenbankdesign und -optimierung',
        systems: ['Database Tools', 'SQL', 'ORM'],
        manualHoursShare: 0.30,
        automationPotential: 0.70,
        risks: ['Performance-Probleme'],
        assumptions: ['Datenmodell']
      },
      {
        id: 'api-integration',
        title: 'API-Entwicklung und Integration',
        systems: ['API Tools', 'Postman', 'Swagger'],
        manualHoursShare: 0.35,
        automationPotential: 0.65,
        risks: ['Kompatibilitätsprobleme'],
        assumptions: ['API-Spezifikation']
      }
    ]
  }
];

// Workflow patterns based on real job tasks
export const WORKFLOW_PATTERNS: WorkflowPattern[] = [
  // Customer Service Workflows
  {
    id: 'customer-support-automation',
    name: 'Customer Support Automation',
    keywords: ['customer', 'support', 'inquiry', 'response', 'automation', 'telefonische beratung', 'phone consultation'],
    category: 'customer-service',
    systems: ['CRM', 'Phone System', 'Email', 'Knowledge Base'],
    automationLevel: 'high',
    estimatedTime: '5-10 minutes',
    complexity: 'moderate'
  },
  {
    id: 'appointment-scheduling',
    name: 'Appointment Scheduling Automation',
    keywords: ['appointment', 'scheduling', 'terminvereinbarung', 'calendar', 'automation'],
    category: 'customer-service',
    systems: ['Calendar System', 'CRM', 'Email', 'SMS'],
    automationLevel: 'high',
    estimatedTime: '2-5 minutes',
    complexity: 'simple'
  },
  {
    id: 'complaint-handling',
    name: 'Complaint Handling Workflow',
    keywords: ['complaint', 'reklamation', 'issue', 'resolution', 'escalation'],
    category: 'customer-service',
    systems: ['CRM', 'Case Management', 'Email', 'Slack'],
    automationLevel: 'high',
    estimatedTime: '10-20 minutes',
    complexity: 'moderate'
  },

  // Data Science Workflows
  {
    id: 'data-pipeline',
    name: 'Data Pipeline Automation',
    keywords: ['data', 'pipeline', 'etl', 'datensammlung', 'data collection', 'aufbereitung', 'preparation'],
    category: 'data-science',
    systems: ['Database', 'API', 'ETL Tools', 'Cloud Storage'],
    automationLevel: 'high',
    estimatedTime: '15-30 minutes',
    complexity: 'complex'
  },
  {
    id: 'ml-model-training',
    name: 'Machine Learning Model Training',
    keywords: ['machine learning', 'algorithmen', 'algorithms', 'model training', 'ml'],
    category: 'data-science',
    systems: ['ML Platforms', 'Python', 'GPU Clusters', 'Model Registry'],
    automationLevel: 'high',
    estimatedTime: '30-60 minutes',
    complexity: 'complex'
  },
  {
    id: 'automated-reporting',
    name: 'Automated Reporting System',
    keywords: ['report', 'dashboard', 'analytics', 'automated', 'dashboards', 'reports'],
    category: 'data-science',
    systems: ['BI Tools', 'Database', 'Email', 'Cloud Storage'],
    automationLevel: 'high',
    estimatedTime: '10-20 minutes',
    complexity: 'moderate'
  },

  // Marketing Workflows
  {
    id: 'campaign-automation',
    name: 'Marketing Campaign Automation',
    keywords: ['campaign', 'marketing', 'automation', 'werbekampagnen', 'advertising campaigns'],
    category: 'marketing',
    systems: ['Marketing Platform', 'Ad Platforms', 'Analytics', 'Email Marketing'],
    automationLevel: 'high',
    estimatedTime: '20-40 minutes',
    complexity: 'moderate'
  },
  {
    id: 'social-media-management',
    name: 'Social Media Management',
    keywords: ['social media', 'content', 'schedule', 'publish', 'social media kanäle'],
    category: 'marketing',
    systems: ['Social Media Platforms', 'Content Management', 'Analytics', 'Calendar'],
    automationLevel: 'high',
    estimatedTime: '5-15 minutes',
    complexity: 'simple'
  },
  {
    id: 'performance-tracking',
    name: 'Marketing Performance Tracking',
    keywords: ['performance', 'analytics', 'tracking', 'markttrends', 'market trends'],
    category: 'marketing',
    systems: ['Analytics', 'Reporting Tools', 'Dashboard', 'Email'],
    automationLevel: 'high',
    estimatedTime: '10-20 minutes',
    complexity: 'moderate'
  },

  // HR Management Workflows
  {
    id: 'applicant-tracking',
    name: 'Applicant Tracking System',
    keywords: ['applicant', 'recruiting', 'bewerbermanagement', 'candidate', 'tracking'],
    category: 'hr-management',
    systems: ['ATS', 'Email', 'Calendar', 'CRM'],
    automationLevel: 'high',
    estimatedTime: '5-10 minutes',
    complexity: 'moderate'
  },
  {
    id: 'payroll-automation',
    name: 'Payroll Processing Automation',
    keywords: ['payroll', 'gehaltsabrechnung', 'salary', 'processing', 'automation'],
    category: 'hr-management',
    systems: ['Payroll Software', 'HR System', 'Banking', 'Tax Software'],
    automationLevel: 'high',
    estimatedTime: '15-30 minutes',
    complexity: 'moderate'
  },
  {
    id: 'training-management',
    name: 'Training Management System',
    keywords: ['training', 'schulungsplanung', 'learning', 'education', 'management'],
    category: 'hr-management',
    systems: ['Learning Platform', 'HR System', 'Calendar', 'Email'],
    automationLevel: 'high',
    estimatedTime: '10-20 minutes',
    complexity: 'moderate'
  },

  // Accounting Workflows
  {
    id: 'invoice-processing',
    name: 'Invoice Processing Automation',
    keywords: ['invoice', 'rechnung', 'processing', 'ocr', 'automation'],
    category: 'accounting',
    systems: ['OCR', 'Accounting Software', 'Email', 'Workflow'],
    automationLevel: 'high',
    estimatedTime: '2-5 minutes',
    complexity: 'simple'
  },
  {
    id: 'payment-automation',
    name: 'Payment Processing Automation',
    keywords: ['payment', 'zahlungsverkehr', 'processing', 'banking', 'automation'],
    category: 'accounting',
    systems: ['Banking System', 'Accounting', 'CRM', 'Workflow'],
    automationLevel: 'high',
    estimatedTime: '5-10 minutes',
    complexity: 'moderate'
  },
  {
    id: 'financial-reporting',
    name: 'Financial Reporting Automation',
    keywords: ['financial', 'reporting', 'monatsabschlüsse', 'monthly statements', 'jahresabschlüsse', 'annual statements'],
    category: 'accounting',
    systems: ['Accounting Software', 'Reporting Tools', 'Excel', 'Email'],
    automationLevel: 'high',
    estimatedTime: '15-30 minutes',
    complexity: 'moderate'
  },

  // Software Development Workflows
  {
    id: 'ci-cd-pipeline',
    name: 'CI/CD Pipeline Automation',
    keywords: ['ci/cd', 'pipeline', 'deployment', 'automation', 'code reviews', 'testing'],
    category: 'software-development',
    systems: ['Git', 'CI/CD Platform', 'Testing Tools', 'Deployment'],
    automationLevel: 'high',
    estimatedTime: '10-20 minutes',
    complexity: 'moderate'
  },
  {
    id: 'code-review-automation',
    name: 'Automated Code Review',
    keywords: ['code review', 'quality', 'automation', 'testing', 'quality assurance'],
    category: 'software-development',
    systems: ['Git', 'Code Review Tools', 'Testing Framework', 'Quality Gates'],
    automationLevel: 'high',
    estimatedTime: '5-10 minutes',
    complexity: 'simple'
  },
  {
    id: 'testing-automation',
    name: 'Automated Testing Pipeline',
    keywords: ['testing', 'automation', 'test', 'quality', 'debugging'],
    category: 'software-development',
    systems: ['Testing Framework', 'CI/CD', 'Test Environment', 'Reporting'],
    automationLevel: 'high',
    estimatedTime: '10-30 minutes',
    complexity: 'moderate'
  }
];

// Pattern Analysis Engine
export class PatternAnalyzer {
  
  // Analyze task and find best matching pattern
  static analyzeTask(taskText: string, jobContext?: string): TaskPattern | null {
    const fullText = `${taskText} ${jobContext || ''}`.toLowerCase();
    
    let bestMatch: TaskPattern | null = null;
    let bestScore = 0;

    for (const pattern of TASK_PATTERNS) {
      const score = this.calculatePatternScore(pattern, fullText);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    // Only return match if score is above threshold
    return bestScore >= 0.3 ? bestMatch : null;
  }

  // Calculate similarity score between task and pattern
  private static calculatePatternScore(pattern: TaskPattern, taskText: string): number {
    const keywordMatches = pattern.keywords.filter(keyword => 
      taskText.includes(keyword.toLowerCase())
    ).length;
    
    const keywordScore = keywordMatches / pattern.keywords.length;
    
    // Bonus for multiple keyword matches
    const bonus = keywordMatches > 1 ? 0.2 : 0;
    
    return Math.min(1, keywordScore + bonus);
  }

  // Find relevant workflows for a task
  static findRelevantWorkflows(taskText: string, domain?: string): WorkflowPattern[] {
    const fullText = taskText.toLowerCase();
    const relevantWorkflows: WorkflowPattern[] = [];

    for (const workflow of WORKFLOW_PATTERNS) {
      // Check if workflow matches domain
      if (domain && workflow.category !== domain) continue;
      
      const score = this.calculateWorkflowScore(workflow, fullText);
      if (score >= 0.3) {
        relevantWorkflows.push(workflow);
      }
    }

    // Sort by relevance score
    return relevantWorkflows.sort((a, b) => {
      const scoreA = this.calculateWorkflowScore(a, fullText);
      const scoreB = this.calculateWorkflowScore(b, fullText);
      return scoreB - scoreA;
    });
  }

  // Calculate workflow relevance score
  private static calculateWorkflowScore(workflow: WorkflowPattern, taskText: string): number {
    const keywordMatches = workflow.keywords.filter(keyword => 
      taskText.includes(keyword.toLowerCase())
    ).length;
    
    return keywordMatches / workflow.keywords.length;
  }

  // Get subtasks for a specific pattern
  static getSubtasksForPattern(patternId: string): SubtaskPattern[] {
    const pattern = TASK_PATTERNS.find(p => p.id === patternId);
    return pattern ? pattern.subtasks : [];
  }

  // Get all patterns for a domain
  static getPatternsByDomain(domain: string): TaskPattern[] {
    return TASK_PATTERNS.filter(pattern => pattern.domain === domain);
  }

  // Get automation potential for a task
  static getAutomationPotential(taskText: string): number {
    const pattern = this.analyzeTask(taskText);
    return pattern ? pattern.automationPotential : 0.5;
  }
}
