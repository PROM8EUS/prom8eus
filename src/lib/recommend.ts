export interface AnalyzedTask {
  text: string;
  score: number;
  label: "Automatisierbar" | "Mensch";
  category: string;
  confidence: number;
}

export interface Recommendation {
  title: string;
  reason: string;
  blueprintHint?: string;
}

interface CategoryMapping {
  keywords: string[];
  title: string;
  reason: string;
  blueprintHint?: string;
}

const CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    keywords: ['daten', 'data', 'excel', 'tabelle', 'spreadsheet', 'csv', 'crm', 'eingabe', 'erfassung', 'input', 'entry', 'processing'],
    title: 'Automatisierte Dateneingabe & -bereinigung per n8n',
    reason: 'Wiederkehrende CSV/CRM-Signale',
    blueprintHint: 'n8n Workflow für CSV-Import und CRM-Synchronisation'
  },
  {
    keywords: ['reporting', 'report', 'dashboard', 'kpi', 'statistik', 'auswertung', 'analytics', 'metrics'],
    title: 'Geplante Report-Generierung & Versand',
    reason: 'KPI/Report/Dashboard erwähnt',
    blueprintHint: 'Automatische Report-Erstellung mit Scheduler'
  },
  {
    keywords: ['termin', 'kalender', 'meeting', 'email', 'e-mail', 'nachricht', 'benachrichtigung', 'scheduling', 'calendar', 'notification', 'follow-up'],
    title: 'Kalender-/E-Mail-Follow-ups automatisieren',
    reason: 'Termin/Meeting/Follow-up Signale',
    blueprintHint: 'Zapier/n8n Integration für Kalender und E-Mail-Automation'
  },
  {
    keywords: ['ci/cd', 'pipeline', 'deployment', 'deploy', 'kubernetes', 'k8s', 'docker', 'git', 'build', 'release'],
    title: 'CI/CD-Pipeline mit Gates & Tests',
    reason: 'CI/CD/K8s/Deploy erkannt',
    blueprintHint: 'GitHub Actions oder GitLab CI Pipeline Setup'
  },
  {
    keywords: ['api', 'integration', 'webhook', 'rest', 'microservice', 'service', 'orchestr', 'queue'],
    title: 'API-Orchestrierung mit Webhooks/Queues',
    reason: 'API/Integration/Webhook erkannt',
    blueprintHint: 'Event-driven Architecture mit Message Queues'
  },
  {
    keywords: ['security', 'sicherheit', 'lint', 'code', 'review', 'quality', 'test', 'dependency', 'vulnerabilit'],
    title: 'Static Code Analysis & Dependency-Bot',
    reason: 'Security/Lint/Dependency Signale',
    blueprintHint: 'SonarQube + Dependabot Integration'
  },
  {
    keywords: ['dokumentation', 'documentation', 'confluence', 'jira', 'wiki', 'notes', 'protokoll', 'meeting-notes'],
    title: 'Release Notes & Meeting-Notes automatisch erzeugen',
    reason: 'Confluence/Jira/PRs erwähnt',
    blueprintHint: 'Automatische Dokumentation aus Git-Commits und Jira-Tickets'
  }
];

export function recommend(tasks: AnalyzedTask[]): Recommendation[] {
  const categoryScores = new Map<string, { count: number; mapping: CategoryMapping }>();
  
  // Analysiere alle Tasks und sammle Kategorie-Matches
  for (const task of tasks) {
    const lowerText = task.text.toLowerCase();
    
    for (const mapping of CATEGORY_MAPPINGS) {
      const matches = mapping.keywords.filter(keyword => lowerText.includes(keyword));
      
      if (matches.length > 0) {
        const key = mapping.title;
        const current = categoryScores.get(key) || { count: 0, mapping };
        current.count += matches.length;
        categoryScores.set(key, current);
      }
    }
  }
  
  // Sortiere nach Anzahl der Matches (Score) und nimm Top 5
  const recommendations = Array.from(categoryScores.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ mapping }) => ({
      title: mapping.title,
      reason: mapping.reason,
      blueprintHint: mapping.blueprintHint
    }));
  
  return recommendations;
}