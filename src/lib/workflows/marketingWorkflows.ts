// Marketing & Sales Workflow Templates
export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'intermediate' | 'advanced';
  estimatedTimeSavings: number; // hours per week
  estimatedCostSavings: number; // EUR per month
  tools: string[];
  steps: WorkflowStep[];
  prerequisites: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  industry: string[];
  tags: string[];
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  tool: string;
  automationLevel: 'manual' | 'semi-automated' | 'fully-automated';
  estimatedTime: number; // minutes
  instructions: string[];
  tips: string[];
}

export const MARKETING_WORKFLOWS: WorkflowTemplate[] = [
  {
    id: 'social-media-content-pipeline',
    title: 'Social Media Content Pipeline',
    description: 'Automatisierte Erstellung und Planung von Social Media Content mit AI-Unterstützung',
    category: 'intermediate',
    estimatedTimeSavings: 12, // 12 hours per week
    estimatedCostSavings: 2400, // EUR 2400/month (based on 60 EUR/hour)
    tools: ['jasper', 'canva-ai', 'notion-ai', 'airtable-ai'],
    difficulty: 'medium',
    industry: ['marketing'],
    tags: ['social-media', 'content-creation', 'automation'],
    prerequisites: [
      'Social Media Accounts (LinkedIn, Instagram, Twitter)',
      'Brand Guidelines',
      'Content Calendar'
    ],
    steps: [
      {
        id: 'content-ideation',
        title: 'Content-Ideen generieren',
        description: 'AI-gestützte Ideenfindung basierend auf Trends und Brand',
        tool: 'jasper',
        automationLevel: 'semi-automated',
        estimatedTime: 30,
        instructions: [
          'Jasper mit Brand-Voice und Zielgruppe konfigurieren',
          'Wöchentliche Content-Themen eingeben',
          'AI-generierte Ideen für Posts, Stories, Videos sammeln',
          'Top 10 Ideen in Notion AI dokumentieren'
        ],
        tips: [
          'Verwende spezifische Prompts für jede Plattform',
          'Kombiniere Trending Topics mit Brand-Messaging',
          'Erstelle Content-Cluster um Hauptthemen'
        ]
      },
      {
        id: 'content-creation',
        title: 'Content erstellen',
        description: 'Automatisierte Texterstellung und visuelle Elemente',
        tool: 'canva-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 45,
        instructions: [
          'Jasper für Post-Texte verwenden (LinkedIn, Instagram, Twitter)',
          'Canva AI für visuelle Templates nutzen',
          'Brand-Farben und -Schriften automatisch anwenden',
          'Content in Notion AI für Review speichern'
        ],
        tips: [
          'Erstelle Template-Bibliothek in Canva',
          'Verwende konsistente Hashtag-Strategien',
          'Optimiere für jede Plattform-Format'
        ]
      },
      {
        id: 'content-scheduling',
        title: 'Content planen und veröffentlichen',
        description: 'Automatisierte Planung und Veröffentlichung',
        tool: 'airtable-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 15,
        instructions: [
          'Content-Kalender in Airtable AI erstellen',
          'Optimal Posting Times automatisch berechnen',
          'Content für alle Plattformen planen',
          'Automatische Veröffentlichung einrichten'
        ],
        tips: [
          'Nutze A/B-Testing für Posting-Zeiten',
          'Erstelle Backup-Content für spontane Posts',
          'Überwache Performance-Metriken'
        ]
      },
      {
        id: 'performance-tracking',
        title: 'Performance analysieren',
        description: 'Automatisierte Analyse und Reporting',
        tool: 'notion-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 20,
        instructions: [
          'Wöchentliche Performance-Reports automatisch generieren',
          'Top-Performing Content identifizieren',
          'ROI pro Post berechnen',
          'Optimierungsvorschläge erstellen'
        ],
        tips: [
          'Fokussiere auf Engagement-Rate und Conversion',
          'Vergleiche Performance über Zeit',
          'Identifiziere erfolgreiche Content-Patterns'
        ]
      }
    ]
  },
  {
    id: 'email-marketing-automation',
    title: 'E-Mail Marketing Automation',
    description: 'Personalisierte E-Mail-Kampagnen mit AI-gestützter Segmentierung und Content-Erstellung',
    category: 'advanced',
    estimatedTimeSavings: 16,
    estimatedCostSavings: 3200,
    tools: ['jasper', 'copy-ai', 'airtable-ai', 'notion-ai'],
    difficulty: 'hard',
    industry: ['marketing'],
    tags: ['email-marketing', 'automation', 'personalization'],
    prerequisites: [
      'E-Mail Marketing Platform (Mailchimp, Klaviyo)',
      'Customer Database',
      'Email Templates'
    ],
    steps: [
      {
        id: 'audience-segmentation',
        title: 'Zielgruppen segmentieren',
        description: 'AI-gestützte Kundensegmentierung basierend auf Verhalten',
        tool: 'airtable-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 60,
        instructions: [
          'Kundendaten in Airtable AI importieren',
          'Automatische Segmentierung nach Kaufverhalten',
          'Engagement-Level und Interessen kategorisieren',
          'Personas für jede Segment erstellen'
        ],
        tips: [
          'Verwende RFM-Analyse (Recency, Frequency, Monetary)',
          'Segmentiere nach Customer Journey Stage',
          'Berücksichtige Demografie und Interessen'
        ]
      },
      {
        id: 'email-content-creation',
        title: 'Personalisierte E-Mail-Inhalte erstellen',
        description: 'AI-generierte personalisierte E-Mail-Inhalte',
        tool: 'copy-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 90,
        instructions: [
          'Copy.ai mit Segment-spezifischen Prompts konfigurieren',
          'Subject Lines für verschiedene Segmente generieren',
          'E-Mail-Body für jede Zielgruppe erstellen',
          'Call-to-Actions personalisieren'
        ],
        tips: [
          'Verwende A/B-Testing für Subject Lines',
          'Optimiere für verschiedene E-Mail-Clients',
          'Fokussiere auf Value-Providing Content'
        ]
      },
      {
        id: 'campaign-automation',
        title: 'Kampagnen automatisieren',
        description: 'Trigger-basierte E-Mail-Automation',
        tool: 'airtable-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 30,
        instructions: [
          'Trigger-Events in Airtable AI definieren',
          'Automation-Workflows für verschiedene Segmente erstellen',
          'Drip-Campaigns für Onboarding einrichten',
          'Re-Engagement-Kampagnen für inaktive Kunden'
        ],
        tips: [
          'Beginne mit Welcome-Series',
          'Implementiere Abandoned Cart Emails',
          'Erstelle Win-Back-Kampagnen'
        ]
      },
      {
        id: 'performance-optimization',
        title: 'Performance optimieren',
        description: 'Kontinuierliche Optimierung basierend auf Daten',
        tool: 'notion-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 45,
        instructions: [
          'Wöchentliche Performance-Analysen automatisch generieren',
          'Top-Performing Segmente identifizieren',
          'Subject Line Performance tracken',
          'Optimierungsvorschläge erstellen'
        ],
        tips: [
          'Fokussiere auf Open Rate und Click Rate',
          'Teste verschiedene Send-Zeiten',
          'Optimiere für Mobile-First Design'
        ]
      }
    ]
  },
  {
    id: 'lead-generation-automation',
    title: 'Lead Generation Automation',
    description: 'Automatisierte Lead-Generierung und -Qualifizierung mit AI',
    category: 'advanced',
    estimatedTimeSavings: 20,
    estimatedCostSavings: 4000,
    tools: ['perplexity', 'airtable-ai', 'notion-ai', 'copy-ai'],
    difficulty: 'hard',
    industry: ['marketing', 'sales'],
    tags: ['lead-generation', 'automation', 'qualification'],
    prerequisites: [
      'CRM System (HubSpot, Salesforce)',
      'Website mit Lead-Capture',
      'LinkedIn Sales Navigator'
    ],
    steps: [
      {
        id: 'prospect-research',
        title: 'Prospect Research automatisieren',
        description: 'AI-gestützte Recherche und Qualifizierung von Prospects',
        tool: 'perplexity',
        automationLevel: 'semi-automated',
        estimatedTime: 120,
        instructions: [
          'Perplexity für Company Research konfigurieren',
          'Automatische Firmenrecherche basierend auf Kriterien',
          'Decision Maker Identifikation',
          'Company Insights und Pain Points sammeln'
        ],
        tips: [
          'Fokussiere auf Firmen in Growth-Phase',
          'Identifiziere aktuelle Challenges',
          'Sammle Social Proof und Referenzen'
        ]
      },
      {
        id: 'lead-scoring',
        title: 'Lead Scoring automatisieren',
        description: 'Automatische Bewertung und Priorisierung von Leads',
        tool: 'airtable-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 30,
        instructions: [
          'Scoring-Kriterien in Airtable AI definieren',
          'Automatische Bewertung neuer Leads',
          'Priorisierung nach Score und Potenzial',
          'Follow-up-Aufgaben automatisch erstellen'
        ],
        tips: [
          'Verwende Firmengröße, Budget, Authority',
          'Berücksichtige Engagement-Level',
          'Scoring kontinuierlich optimieren'
        ]
      },
      {
        id: 'outreach-automation',
        title: 'Outreach automatisieren',
        description: 'Personalisierte Outreach-Kampagnen',
        tool: 'copy-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 90,
        instructions: [
          'Copy.ai für personalisierte Messages konfigurieren',
          'LinkedIn Connection Requests automatisch generieren',
          'Follow-up Sequences erstellen',
          'Value-Providing Content teilen'
        ],
        tips: [
          'Fokussiere auf Personalisierung',
          'Biete konkreten Mehrwert',
          'Verwende Multi-Channel-Approach'
        ]
      },
      {
        id: 'lead-nurturing',
        title: 'Lead Nurturing automatisieren',
        description: 'Automatisierte Lead-Pflege und Conversion',
        tool: 'notion-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 60,
        instructions: [
          'Nurturing-Sequenzen in Notion AI erstellen',
          'Content-Delivery automatisch planen',
          'Engagement-Tracking implementieren',
          'Sales-Handoff automatisieren'
        ],
        tips: [
          'Erstelle Educational Content',
          'Verwende Social Proof',
          'Timing der Sales-Handoffs optimieren'
        ]
      }
    ]
  }
];

// Helper functions
export function getWorkflowById(id: string): WorkflowTemplate | undefined {
  return MARKETING_WORKFLOWS.find(workflow => workflow.id === id);
}

export function getWorkflowsByCategory(category: 'basic' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return MARKETING_WORKFLOWS.filter(workflow => workflow.category === category);
}

export function getWorkflowsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): WorkflowTemplate[] {
  return MARKETING_WORKFLOWS.filter(workflow => workflow.difficulty === difficulty);
}

export function calculateTotalROI(workflow: WorkflowTemplate): number {
  const monthlyTimeSavings = workflow.estimatedTimeSavings * 4; // 4 weeks
  const hourlyRate = 60; // EUR 60/hour
  const monthlyCostSavings = monthlyTimeSavings * hourlyRate;
  return monthlyCostSavings - workflow.estimatedCostSavings;
}
