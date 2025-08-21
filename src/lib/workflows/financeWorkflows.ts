// Finance & Accounting Workflow Templates
import { WorkflowTemplate, WorkflowStep } from './marketingWorkflows';

export const FINANCE_WORKFLOWS: WorkflowTemplate[] = [
  {
    id: 'monthly-financial-reporting',
    title: 'Monatliche Finanzberichte automatisieren',
    description: 'Automatisierte Erstellung und Verteilung von monatlichen Finanzberichten',
    category: 'intermediate',
    estimatedTimeSavings: 15, // 15 hours per week
    estimatedCostSavings: 3000, // EUR 3000/month
    tools: ['excel-ai', 'power-bi-ai', 'airtable-ai', 'notion-ai'],
    difficulty: 'medium',
    industry: ['finance'],
    tags: ['reporting', 'automation', 'compliance'],
    prerequisites: [
      'Accounting Software (Sage, DATEV, QuickBooks)',
      'Bank Accounts Access',
      'Chart of Accounts'
    ],
    steps: [
      {
        id: 'data-collection',
        title: 'Daten automatisch sammeln',
        description: 'Automatisierte Datensammlung aus verschiedenen Quellen',
        tool: 'excel-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 30,
        instructions: [
          'Excel AI für automatische Datenimporte konfigurieren',
          'Bank-Statements automatisch herunterladen',
          'Accounting Software Daten exportieren',
          'CSV-Dateien automatisch verarbeiten'
        ],
        tips: [
          'Verwende Power Query für Datenimporte',
          'Erstelle Datenvalidierung-Regeln',
          'Backup der Rohdaten erstellen'
        ]
      },
      {
        id: 'data-reconciliation',
        title: 'Bankabstimmung automatisieren',
        description: 'Automatische Abstimmung von Bank- und Buchhaltungsdaten',
        tool: 'excel-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 45,
        instructions: [
          'Excel AI für automatische Bankabstimmung konfigurieren',
          'Matching-Algorithmen für Transaktionen erstellen',
          'Unstimmigkeiten automatisch markieren',
          'Reconciliation-Reports generieren'
        ],
        tips: [
          'Verwende Fuzzy Matching für ähnliche Transaktionen',
          'Erstelle Exception-Reports für manuelle Prüfung',
          'Audit-Trail für alle Änderungen'
        ]
      },
      {
        id: 'report-generation',
        title: 'Berichte automatisch erstellen',
        description: 'Automatisierte Generierung von Finanzberichten',
        tool: 'power-bi-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 60,
        instructions: [
          'Power BI AI für automatische Berichtserstellung konfigurieren',
          'P&L, Balance Sheet und Cash Flow automatisch generieren',
          'KPI-Dashboards erstellen',
          'Variance Analysis automatisch durchführen'
        ],
        tips: [
          'Erstelle Template-basierte Berichte',
          'Implementiere Drill-Down-Funktionen',
          'Automatische Kommentare für Abweichungen'
        ]
      },
      {
        id: 'report-distribution',
        title: 'Berichte automatisch verteilen',
        description: 'Automatisierte Verteilung an Stakeholder',
        tool: 'notion-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 15,
        instructions: [
          'Notion AI für automatische Berichtsverteilung konfigurieren',
          'E-Mail-Versand an definierte Empfänger',
          'PDF-Export und -Versand automatisieren',
          'Delivery-Confirmation tracken'
        ],
        tips: [
          'Erstelle verschiedene Berichtsformate',
          'Implementiere Zugriffskontrollen',
          'Tracking für Berichtsöffnungen'
        ]
      }
    ]
  },
  {
    id: 'accounts-payable-automation',
    title: 'Accounts Payable Automation',
    description: 'Automatisierte Rechnungsverarbeitung und Zahlungsabwicklung',
    category: 'advanced',
    estimatedTimeSavings: 18,
    estimatedCostSavings: 3600,
    tools: ['excel-ai', 'airtable-ai', 'notion-ai', 'microsoft-copilot'],
    difficulty: 'hard',
    industry: ['finance'],
    tags: ['accounts-payable', 'automation', 'invoice-processing'],
    prerequisites: [
      'Invoice Management System',
      'Approval Workflow',
      'Banking Integration'
    ],
    steps: [
      {
        id: 'invoice-capture',
        title: 'Rechnungen automatisch erfassen',
        description: 'OCR-basierte Rechnungserkennung und -verarbeitung',
        tool: 'microsoft-copilot',
        automationLevel: 'fully-automated',
        estimatedTime: 20,
        instructions: [
          'Microsoft Copilot für OCR-Konfiguration nutzen',
          'Automatische Rechnungserkennung einrichten',
          'Daten-Extraktion (Betrag, Datum, Lieferant)',
          'Datenvalidierung und -bereinigung'
        ],
        tips: [
          'Trainiere OCR für verschiedene Rechnungsformate',
          'Implementiere Duplicate-Detection',
          'Erstelle Exception-Handling für unklare Rechnungen'
        ]
      },
      {
        id: 'approval-workflow',
        title: 'Genehmigungsworkflow automatisieren',
        description: 'Automatisierte Routing und Genehmigung von Rechnungen',
        tool: 'airtable-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 30,
        instructions: [
          'Airtable AI für Approval-Workflows konfigurieren',
          'Betrag-basierte Routing-Regeln erstellen',
          'Automatische Benachrichtigungen an Approver',
          'Escalation-Regeln für überfällige Genehmigungen'
        ],
        tips: [
          'Definiere klare Approval-Hierarchien',
          'Implementiere Mobile-Approval',
          'Erstelle Audit-Trail für alle Genehmigungen'
        ]
      },
      {
        id: 'payment-processing',
        title: 'Zahlungsabwicklung automatisieren',
        description: 'Automatisierte Zahlungsplanung und -ausführung',
        tool: 'excel-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 45,
        instructions: [
          'Excel AI für Zahlungsplanung konfigurieren',
          'Cash Flow-basierte Zahlungsplanung',
          'Automatische Zahlungsdateien erstellen',
          'Bank-Integration für Zahlungsausführung'
        ],
        tips: [
          'Optimiere Zahlungstermine für Cash Flow',
          'Implementiere Early Payment Discounts',
          'Erstelle Payment-Reconciliation'
        ]
      },
      {
        id: 'vendor-management',
        title: 'Lieferanten-Management automatisieren',
        description: 'Automatisierte Lieferantenpflege und -kommunikation',
        tool: 'notion-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 30,
        instructions: [
          'Notion AI für Vendor-Database konfigurieren',
          'Automatische Vendor-Performance-Tracking',
          'Communication-Templates für Lieferanten',
          'Vendor-Scorecard automatisch generieren'
        ],
        tips: [
          'Tracke Payment-Performance',
          'Implementiere Vendor-Portal',
          'Erstelle automatische Follow-ups'
        ]
      }
    ]
  },
  {
    id: 'budget-variance-analysis',
    title: 'Budget-Variance Analysis Automation',
    description: 'Automatisierte Budgetüberwachung und Abweichungsanalyse',
    category: 'advanced',
    estimatedTimeSavings: 12,
    estimatedCostSavings: 2400,
    tools: ['excel-ai', 'power-bi-ai', 'airtable-ai', 'notion-ai'],
    difficulty: 'medium',
    industry: ['finance'],
    tags: ['budgeting', 'analysis', 'automation'],
    prerequisites: [
      'Budget Planning System',
      'Actual vs. Budget Data',
      'Department Structure'
    ],
    steps: [
      {
        id: 'budget-monitoring',
        title: 'Budget-Überwachung automatisieren',
        description: 'Echtzeit-Überwachung von Budget-Abweichungen',
        tool: 'power-bi-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 30,
        instructions: [
          'Power BI AI für Budget-Monitoring konfigurieren',
          'Echtzeit-Vergleich Actual vs. Budget',
          'Threshold-Alerts für Abweichungen',
          'Department-wise Budget-Tracking'
        ],
        tips: [
          'Setze realistische Threshold-Werte',
          'Implementiere Rolling Forecasts',
          'Erstelle Trend-Analysen'
        ]
      },
      {
        id: 'variance-analysis',
        title: 'Abweichungsanalyse automatisieren',
        description: 'Automatische Analyse und Erklärung von Budget-Abweichungen',
        tool: 'excel-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 60,
        instructions: [
          'Excel AI für Variance-Analysis konfigurieren',
          'Automatische Abweichungsberechnung',
          'Root Cause Analysis für Abweichungen',
          'Variance-Explanation Reports generieren'
        ],
        tips: [
          'Kategorisiere Abweichungen nach Ursache',
          'Implementiere Trend-Analysis',
          'Erstelle Action-Items für Abweichungen'
        ]
      },
      {
        id: 'forecasting',
        title: 'Forecasting automatisieren',
        description: 'Automatisierte Budget-Forecasts basierend auf Trends',
        tool: 'power-bi-ai',
        automationLevel: 'semi-automated',
        estimatedTime: 90,
        instructions: [
          'Power BI AI für Forecasting-Modelle konfigurieren',
          'Trend-basierte Forecasts erstellen',
          'Seasonality-Analysis implementieren',
          'Scenario-Planning automatisieren'
        ],
        tips: [
          'Verwende verschiedene Forecasting-Methoden',
          'Implementiere Confidence-Intervals',
          'Erstelle What-If-Szenarien'
        ]
      },
      {
        id: 'reporting-insights',
        title: 'Insights und Reporting automatisieren',
        description: 'Automatisierte Generierung von Budget-Insights',
        tool: 'notion-ai',
        automationLevel: 'fully-automated',
        estimatedTime: 30,
        instructions: [
          'Notion AI für Insight-Generierung konfigurieren',
          'Automatische Executive-Summaries erstellen',
          'Key Findings automatisch identifizieren',
          'Recommendation-Reports generieren'
        ],
        tips: [
          'Fokussiere auf actionable Insights',
          'Erstelle Executive-Dashboards',
          'Implementiere Automated-Alerts'
        ]
      }
    ]
  }
];

// Helper functions
export function getFinanceWorkflowById(id: string): WorkflowTemplate | undefined {
  return FINANCE_WORKFLOWS.find(workflow => workflow.id === id);
}

export function getFinanceWorkflowsByCategory(category: 'basic' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return FINANCE_WORKFLOWS.filter(workflow => workflow.category === category);
}

export function calculateFinanceROI(workflow: WorkflowTemplate): number {
  const monthlyTimeSavings = workflow.estimatedTimeSavings * 4;
  const hourlyRate = 80; // Higher rate for finance professionals
  const monthlyCostSavings = monthlyTimeSavings * hourlyRate;
  return monthlyCostSavings + workflow.estimatedCostSavings;
}
