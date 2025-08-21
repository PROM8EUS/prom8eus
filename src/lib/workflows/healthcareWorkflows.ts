// Healthcare Workflow Templates
import { WorkflowTemplate, WorkflowStep } from './marketingWorkflows';

export const HEALTHCARE_WORKFLOWS: WorkflowTemplate[] = [
  {
    id: 'patient-documentation-automation',
    title: 'Patientendokumentation automatisieren',
    description: 'Automatisierte Erfassung und Verwaltung von Patientendaten mit DSGVO-Compliance',
    category: 'intermediate',
    estimatedTimeSavings: 14, // 14 hours per week
    estimatedCostSavings: 2800, // EUR 2800/month
    tools: ['notion-ai', 'microsoft-copilot', 'obsidian-ai', 'airtable-ai'],
    difficulty: 'medium',
    industry: ['healthcare'],
    tags: ['patient-data', 'documentation', 'compliance'],
    prerequisites: [
      'Patient Management System',
      'DSGVO-Compliance Framework',
      'Secure Data Storage'
    ],
    steps: [
      {
        id: 'patient-intake',
        title: 'Patientenaufnahme automatisieren',
        description: 'Automatisierte Erfassung von Patientendaten bei der Aufnahme',
        tool: 'notion-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 20,
        instructions: [
          'Notion AI für strukturierte Patientenaufnahme konfigurieren',
          'Standardisierte Aufnahmeformulare erstellen',
          'Automatische Datenvalidierung implementieren',
          'DSGVO-Einverständniserklärungen digital verwalten'
        ],
        tips: [
          'Verwende Template-basierte Formulare',
          'Implementiere Datenvalidierung',
          'Erstelle Audit-Trail für alle Änderungen'
        ]
      },
      {
        id: 'medical-records',
        title: 'Medizinische Aufzeichnungen verwalten',
        description: 'Strukturierte Verwaltung von medizinischen Aufzeichnungen',
        tool: 'obsidian-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 30,
        instructions: [
          'Obsidian AI für medizinische Notizen konfigurieren',
          'Strukturierte Templates für verschiedene Fachbereiche',
          'Automatische Verknüpfung verwandter Aufzeichnungen',
          'Knowledge Graph für Patientengeschichte erstellen'
        ],
        tips: [
          'Verwende konsistente Terminologie',
          'Erstelle Fachbereich-spezifische Templates',
          'Implementiere Versionierung für Aufzeichnungen'
        ]
      },
      {
        id: 'appointment-scheduling',
        title: 'Terminplanung automatisieren',
        description: 'Intelligente Terminplanung mit automatischen Follow-ups',
        tool: 'airtable-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 15,
        instructions: [
          'Airtable AI für Terminplanung konfigurieren',
          'Automatische Terminvergabe basierend auf Verfügbarkeit',
          'Follow-up-Erinnerungen automatisch senden',
          'Warteliste-Management implementieren'
        ],
        tips: [
          'Berücksichtige Behandlungsdauer bei der Planung',
          'Implementiere Priorisierung für dringende Fälle',
          'Erstelle automatische Follow-up-Termine'
        ]
      },
      {
        id: 'compliance-reporting',
        title: 'Compliance-Reporting automatisieren',
        description: 'Automatisierte DSGVO-Compliance und Berichterstattung',
        tool: 'microsoft-copilot',
        automationLevel: 'fully-automated',
        estimatedTime: 25,
        instructions: [
          'Microsoft Copilot für Compliance-Monitoring konfigurieren',
          'Automatische DSGVO-Compliance-Checks',
          'Data Retention Policy Enforcement',
          'Compliance-Reports automatisch generieren'
        ],
        tips: [
          'Implementiere automatische Datenlöschung',
          'Erstelle Consent-Management-System',
          'Tracke alle Datenzugriffe'
        ]
      }
    ]
  },
  {
    id: 'medical-report-generation',
    title: 'Medizinische Berichte automatisieren',
    description: 'Automatisierte Erstellung von medizinischen Berichten und Befunden',
    category: 'advanced',
    estimatedTimeSavings: 16,
    estimatedCostSavings: 3200,
    tools: ['microsoft-copilot', 'notion-ai', 'obsidian-ai', 'perplexity'],
    difficulty: 'hard',
    industry: ['healthcare'],
    tags: ['medical-reports', 'automation', 'documentation'],
    prerequisites: [
      'Medical Report Templates',
      'Clinical Guidelines',
      'Digital Signature System'
    ],
    steps: [
      {
        id: 'data-collection',
        title: 'Klinische Daten sammeln',
        description: 'Automatisierte Sammlung klinischer Daten aus verschiedenen Quellen',
        tool: 'notion-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 40,
        instructions: [
          'Notion AI für strukturierte Datensammlung konfigurieren',
          'Integration mit Labor- und Bildgebungssystemen',
          'Automatische Datenvalidierung und -bereinigung',
          'Strukturierte Datenspeicherung implementieren'
        ],
        tips: [
          'Verwende standardisierte Datenformate',
          'Implementiere Datenqualitätskontrollen',
          'Erstelle Backup-Systeme'
        ]
      },
      {
        id: 'report-templates',
        title: 'Berichtstemplates erstellen',
        description: 'Fachbereich-spezifische Berichtstemplates mit AI-Unterstützung',
        tool: 'microsoft-copilot',
        automationLevel: 'semi-automated',
        estimatedTime: 60,
        instructions: [
          'Microsoft Copilot für Template-Erstellung konfigurieren',
          'Fachbereich-spezifische Templates entwickeln',
          'Automatische Inhaltsgenerierung implementieren',
          'Quality Assurance für Templates'
        ],
        tips: [
          'Verwende evidenzbasierte Guidelines',
          'Implementiere Peer-Review-Prozesse',
          'Erstelle Template-Versionierung'
        ]
      },
      {
        id: 'report-generation',
        title: 'Berichte automatisch generieren',
        description: 'Automatisierte Berichtserstellung basierend auf klinischen Daten',
        tool: 'obsidian-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 45,
        instructions: [
          'Obsidian AI für Berichtserstellung konfigurieren',
          'Template-basierte Berichtgenerierung',
          'Automatische Inhaltsfüllung aus klinischen Daten',
          'Quality-Check-Automation implementieren'
        ],
        tips: [
          'Implementiere automatisierte Plausibilitätsprüfungen',
          'Erstelle Review-Workflows',
          'Verwende konsistente Terminologie'
        ]
      },
      {
        id: 'quality-assurance',
        title: 'Qualitätssicherung automatisieren',
        description: 'Automatisierte Qualitätskontrolle und -sicherung',
        tool: 'perplexity',
        automationLevel: 'semi-automated',
        estimatedTime: 30,
        instructions: [
          'Perplexity für Quality Assurance konfigurieren',
          'Automatische Plausibilitätsprüfungen',
          'Guideline-Compliance-Checks',
          'Peer-Review-Workflows automatisieren'
        ],
        tips: [
          'Implementiere automatisierte Flagging-Systeme',
          'Erstelle Quality-Metrics-Dashboards',
          'Verwende Machine Learning für Pattern-Erkennung'
        ]
      }
    ]
  },
  {
    id: 'patient-communication-automation',
    title: 'Patientenkommunikation automatisieren',
    description: 'Automatisierte und personalisierte Patientenkommunikation',
    category: 'intermediate',
    estimatedTimeSavings: 10,
    estimatedCostSavings: 2000,
    tools: ['notion-ai', 'microsoft-copilot', 'airtable-ai', 'perplexity'],
    difficulty: 'medium',
    industry: ['healthcare'],
    tags: ['patient-communication', 'automation', 'personalization'],
    prerequisites: [
      'Patient Communication Platform',
      'Consent Management System',
      'Multi-language Support'
    ],
    steps: [
      {
        id: 'communication-templates',
        title: 'Kommunikationstemplates erstellen',
        description: 'Personalisierte Kommunikationstemplates für verschiedene Szenarien',
        tool: 'microsoft-copilot',
        automationLevel: 'semi-automated',
        estimatedTime: 50,
        instructions: [
          'Microsoft Copilot für Template-Erstellung konfigurieren',
          'Szenario-spezifische Templates entwickeln',
          'Personalization-Variablen implementieren',
          'Multi-language Support einrichten'
        ],
        tips: [
          'Verwende einfache, verständliche Sprache',
          'Implementiere kulturelle Sensitivität',
          'Erstelle Accessibility-konforme Templates'
        ]
      },
      {
        id: 'appointment-reminders',
        title: 'Terminerinnerungen automatisieren',
        description: 'Automatisierte Terminerinnerungen und Follow-ups',
        tool: 'airtable-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 20,
        instructions: [
          'Airtable AI für Reminder-System konfigurieren',
          'Zeitgesteuerte Erinnerungen einrichten',
          'Multi-channel Kommunikation (SMS, E-Mail, App)',
          'Confirmation-Tracking implementieren'
        ],
        tips: [
          'Respektiere Patientenpräferenzen',
          'Implementiere Opt-out-Mechanismen',
          'Tracke Response-Rates'
        ]
      },
      {
        id: 'health-education',
        title: 'Gesundheitsaufklärung automatisieren',
        description: 'Automatisierte Bereitstellung von Gesundheitsinformationen',
        tool: 'notion-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 40,
        instructions: [
          'Notion AI für Health Education konfigurieren',
          'Diagnose-spezifische Informationspakete erstellen',
          'Personalized Learning Paths entwickeln',
          'Progress-Tracking implementieren'
        ],
        tips: [
          'Verwende evidenzbasierte Informationen',
          'Implementiere Interaktivität',
          'Erstelle Feedback-Mechanismen'
        ]
      },
      {
        id: 'feedback-collection',
        title: 'Patientenfeedback sammeln',
        description: 'Automatisierte Sammlung und Analyse von Patientenfeedback',
        tool: 'perplexity',
        automationLevel: 'fully-automated',
        estimatedTime: 25,
        instructions: [
          'Perplexity für Feedback-Analysis konfigurieren',
          'Automatisierte Umfragen nach Behandlungen',
          'Sentiment Analysis implementieren',
          'Actionable Insights generieren'
        ],
        tips: [
          'Verwende kurze, fokussierte Umfragen',
          'Implementiere Anonymisierung',
          'Erstelle Feedback-Action-Workflows'
        ]
      }
    ]
  }
];

// Helper functions
export function getHealthcareWorkflowById(id: string): WorkflowTemplate | undefined {
  return HEALTHCARE_WORKFLOWS.find(workflow => workflow.id === id);
}

export function getHealthcareWorkflowsByCategory(category: 'basic' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return HEALTHCARE_WORKFLOWS.filter(workflow => workflow.category === category);
}

export function calculateHealthcareROI(workflow: WorkflowTemplate): number {
  const monthlyTimeSavings = workflow.estimatedTimeSavings * 4;
  const hourlyRate = 70; // Healthcare professional rate
  const monthlyCostSavings = monthlyTimeSavings * hourlyRate;
  return monthlyCostSavings + workflow.estimatedCostSavings;
}
