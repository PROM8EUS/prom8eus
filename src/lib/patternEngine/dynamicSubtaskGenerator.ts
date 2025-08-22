import { PatternMatch } from './instantMatcher';
import { ContextAnalysis } from './contextAnalyzer';

export interface DynamicSubtask {
  id: string;
  title: string;
  description: string;
  automationPotential: number;
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'low' | 'medium' | 'high';
  systems: string[];
  dependencies: string[];
  risks: string[];
  opportunities: string[];
}

export class DynamicSubtaskGenerator {
  private taskVerbs = {
    'data-entry': [
      'daten sammeln', 'daten strukturieren', 'daten validieren', 'daten eingeben', 
      'daten formatieren', 'daten übertragen', 'daten archivieren', 'daten sichern'
    ],
    'reporting': [
      'daten sammeln', 'daten analysieren', 'berichte vorbereiten', 'berichte erstellen',
      'visualisierungen erstellen', 'berichte überprüfen', 'berichte freigeben', 'berichte verteilen'
    ],
    'communication': [
      'kontakte identifizieren', 'nachrichten vorbereiten', 'kommunikation durchführen',
      'antworten verarbeiten', 'follow-ups planen', 'kommunikation dokumentieren'
    ],
    'planning': [
      'anforderungen analysieren', 'ziele definieren', 'ressourcen planen',
      'zeitpläne erstellen', 'risiken bewerten', 'pläne kommunizieren'
    ],
    'analysis': [
      'daten sammeln', 'daten bereinigen', 'muster identifizieren', 'trends analysieren',
      'erkenntnisse bewerten', 'empfehlungen entwickeln', 'ergebnisse dokumentieren'
    ],
    'documentation': [
      'inhalt recherchieren', 'struktur planen', 'dokument erstellen',
      'inhalt überprüfen', 'feedback einarbeiten', 'dokument finalisieren'
    ],
    'quality-control': [
      'standards definieren', 'prozesse prüfen', 'ergebnisse bewerten',
      'fehler identifizieren', 'korrekturen durchführen', 'qualität freigeben'
    ],
    'creative': [
      'konzept entwickeln', 'ideen sammeln', 'design entwerfen',
      'feedback einholen', 'design überarbeiten', 'ergebnis finalisieren'
    ],
    'management': [
      'ziele definieren', 'ressourcen zuweisen', 'prozesse überwachen',
      'entscheidungen treffen', 'fortschritt bewerten', 'ergebnisse kommunizieren'
    ],
    'routine': [
      'aufgabe vorbereiten', 'prozess ausführen', 'ergebnis kontrollieren',
      'dokumentation erstellen', 'daten archivieren', 'prozess optimieren'
    ],
    // Neue Patterns für gängige Stellenanzeigen
    'recruitment': [
      'stellenanzeigen analysieren', 'kandidaten recherchieren', 'bewerbungen sichten',
      'interviews koordinieren', 'feedback sammeln', 'entscheidungen treffen', 'onboarding vorbereiten'
    ],
    'sales': [
      'leads generieren', 'kontakte qualifizieren', 'gespräche führen',
      'angebote erstellen', 'verhandlungen führen', 'verträge abschließen', 'kundenbeziehung pflegen'
    ],
    'marketing': [
      'zielgruppen analysieren', 'kampagnen konzipieren', 'content erstellen',
      'kanäle bespielen', 'performance messen', 'optimierungen durchführen', 'ergebnisse analysieren'
    ],
    'marketing-strategy': [
      'marktanalyse durchführen', 'zielgruppen definieren', 'positionierung entwickeln',
      'strategie konzipieren', 'budget planen', 'roadmap erstellen', 'kpis definieren'
    ],
    'marketing-campaign': [
      'kampagnenkonzept entwickeln', 'kanäle auswählen', 'content planen',
      'timeline erstellen', 'kampagne launchen', 'performance tracken', 'optimierungen durchführen'
    ],
    'content-marketing': [
      'content-strategie entwickeln', 'themen recherchieren', 'content erstellen',
      'redaktionsplan erstellen', 'content publizieren', 'engagement messen', 'content optimieren'
    ],
    'social-media': [
      'social media strategie entwickeln', 'content kalender erstellen', 'posts erstellen',
      'community managen', 'engagement tracken', 'hashtags optimieren', 'influencer koordinieren'
    ],
    'digital-marketing': [
      'digital strategie entwickeln', 'kanäle analysieren', 'ads konfigurieren',
      'landing pages optimieren', 'conversion tracking einrichten', 'remarketing kampagnen', 'roi optimieren'
    ],
    'brand-marketing': [
      'brand identity entwickeln', 'messaging definieren', 'brand guidelines erstellen',
      'brand awareness messen', 'brand positioning kommunizieren', 'brand experience gestalten', 'brand equity aufbauen'
    ],
    'performance-marketing': [
      'performance strategie entwickeln', 'attribution model einrichten', 'conversion tracking',
      'a/b tests durchführen', 'roi optimieren', 'budget allocation', 'performance reporting'
    ],
    // Finance & Accounting Patterns
    'finance': [
      'finanzdaten sammeln', 'buchungen kontieren', 'konten abstimmen',
      'berichte erstellen', 'steuern berechnen', 'budget überwachen', 'controlling durchführen'
    ],
    'accounting': [
      'belege erfassen', 'buchungen vornehmen', 'konten führen',
      'abschlüsse erstellen', 'steuererklärungen vorbereiten', 'prüfungen durchführen', 'dokumentation erstellen'
    ],
    'bookkeeping': [
      'belege sammeln und kategorisieren', 'buchungen vorbereiten und kontieren', 'konten führen und überwachen',
      'monatsabschlüsse vorbereiten und erstellen', 'jahresabschlüsse strukturieren und validieren', 'steuervoranmeldungen erstellen und einreichen', 'mahnwesen koordinieren und verfolgen'
    ],
    'financial-reporting': [
      'finanzdaten sammeln und validieren', 'berichte strukturieren und vorbereiten', 'abschlüsse erstellen und validieren',
      'finanzanalysen durchführen und interpretieren', 'berichte prüfen und freigeben', 'berichte freigeben und verteilen', 'berichte archivieren und dokumentieren'
    ],
    'tax-accounting': [
      'steuerrelevante daten sammeln und kategorisieren', 'steuerberechnungen durchführen und prüfen', 'steuererklärungen vorbereiten und strukturieren',
      'steuervoranmeldungen erstellen und einreichen', 'steuerberater koordinieren und abstimmen', 'steuerprüfungen vorbereiten und dokumentieren', 'steuerdokumentation erstellen und archivieren'
    ],
    'budget-control': [
      'budget planen und strukturieren', 'ausgaben überwachen und kontrollieren', 'abweichungen analysieren und bewerten',
      'forecasts erstellen und validieren', 'budget anpassungen koordinieren und umsetzen', 'controlling berichte erstellen und prüfen', 'budget kommunikation führen und dokumentieren'
    ],
    'payment-processing': [
      'zahlungseingänge überwachen und erfassen', 'zahlungsausgänge koordinieren und freigeben', 'mahnwesen automatisieren und verfolgen',
      'zahlungsabstimmungen durchführen und prüfen', 'zahlungsberichte erstellen und analysieren', 'zahlungsprozesse optimieren und dokumentieren', 'zahlungskommunikation führen und koordinieren'
    ],
    'account-reconciliation': [
      'kontenabstimmungen vorbereiten und strukturieren', 'abstimmungsdifferenzen analysieren und klären', 'kontenabstimmungen durchführen und validieren',
      'abstimmungsberichte erstellen und prüfen', 'abstimmungsprozesse optimieren und dokumentieren', 'abstimmungskommunikation führen und koordinieren', 'abstimmungsarchivierung sicherstellen'
    ],
    'customer-service': [
      'anfragen bearbeiten', 'probleme analysieren', 'lösungen entwickeln',
      'kommunikation führen', 'escalations handhaben', 'feedback sammeln', 'prozesse optimieren'
    ],
    'project-management': [
      'projektanforderungen definieren', 'ressourcen planen', 'zeitpläne erstellen',
      'teams koordinieren', 'fortschritt überwachen', 'risiken managen', 'projekt abschließen'
    ],
    'accounting': [
      'belege erfassen', 'buchungen vornehmen', 'konten abstimmen',
      'berichte erstellen', 'prüfungen durchführen', 'steuern berechnen', 'jahresabschluss vorbereiten'
    ],
    'hr': [
      'personalplanung durchführen', 'recruiting koordinieren', 'verträge verwalten',
      'entwicklung fördern', 'konflikte lösen', 'compliance sicherstellen', 'strategie entwickeln'
    ],
    'it-support': [
      'tickets bearbeiten', 'probleme diagnostizieren', 'lösungen implementieren',
      'systeme warten', 'updates durchführen', 'dokumentation erstellen', 'schulungen durchführen'
    ],
    'research': [
      'fragestellungen definieren', 'quellen recherchieren', 'daten sammeln',
      'analysen durchführen', 'ergebnisse interpretieren', 'berichte schreiben', 'präsentationen erstellen'
    ],
    'logistics': [
      'lieferungen planen', 'routen optimieren', 'lager verwalten',
      'transport koordinieren', 'qualität kontrollieren', 'kosten optimieren', 'prozesse verbessern'
    ]
  };

  private taskObjects = {
    'data-entry': ['Daten', 'Formulare', 'Listen', 'Tabellen', 'Datensätze', 'Eingabefelder', 'Validierungsregeln'],
    'reporting': ['Berichte', 'Dashboards', 'Präsentationen', 'Auswertungen', 'Statistiken', 'Visualisierungen', 'KPIs'],
    'communication': ['E-Mails', 'Meetings', 'Termine', 'Nachrichten', 'Gespräche', 'Präsentationen', 'Follow-ups'],
    'planning': ['Pläne', 'Terminkalender', 'Ressourcen', 'Budgets', 'Zeitpläne', 'Milestones', 'Abhängigkeiten'],
    'analysis': ['Daten', 'Trends', 'Muster', 'Erkenntnisse', 'Empfehlungen', 'Metriken', 'Benchmarks'],
    'documentation': ['Dokumente', 'Handbücher', 'Protokolle', 'Anleitungen', 'Spezifikationen', 'Templates', 'Versionen'],
    'quality-control': ['Standards', 'Prozesse', 'Ergebnisse', 'Qualitätskriterien', 'Tests', 'Audits', 'Compliance'],
    'creative': ['Konzepte', 'Designs', 'Inhalte', 'Kampagnen', 'Materialien', 'Mockups', 'Prototypen'],
    'management': ['Teams', 'Projekte', 'Strategien', 'Entscheidungen', 'Prozesse', 'Ressourcen', 'Stakeholder'],
    'routine': ['Arbeitsschritte', 'Checklisten', 'Standardprozesse', 'Routinen', 'Abläufe', 'Templates', 'Workflows'],
    // Neue Objekte für gängige Stellenanzeigen
    'recruitment': ['Stellenanzeigen', 'Bewerbungen', 'Kandidaten', 'Interviews', 'Feedback', 'Entscheidungen', 'Onboarding'],
    'sales': ['Leads', 'Kontakte', 'Gespräche', 'Angebote', 'Verträge', 'Kunden', 'Umsätze'],
    'marketing': ['Zielgruppen', 'Kampagnen', 'Content', 'Kanäle', 'Performance', 'ROI', 'Marken'],
    'marketing-strategy': ['Marktanalyse', 'Zielgruppen', 'Positionierung', 'Strategie', 'Budget', 'Roadmap', 'KPIs'],
    'marketing-campaign': ['Kampagnenkonzept', 'Kanäle', 'Content', 'Timeline', 'Launch', 'Performance', 'Optimierung'],
    'content-marketing': ['Content-Strategie', 'Themen', 'Content', 'Redaktionsplan', 'Publikation', 'Engagement', 'Optimierung'],
    'social-media': ['Social Media Strategie', 'Content Kalender', 'Posts', 'Community', 'Engagement', 'Hashtags', 'Influencer'],
    'digital-marketing': ['Digital Strategie', 'Kanäle', 'Ads', 'Landing Pages', 'Conversion Tracking', 'Remarketing', 'ROI'],
    'brand-marketing': ['Brand Identity', 'Messaging', 'Brand Guidelines', 'Brand Awareness', 'Positioning', 'Brand Experience', 'Brand Equity'],
    'performance-marketing': ['Performance Strategie', 'Attribution', 'Conversion', 'A/B Tests', 'ROI', 'Budget', 'Reporting'],
    // Finance & Accounting Objects
    'finance': ['Finanzdaten', 'Buchungen', 'Konten', 'Berichte', 'Steuern', 'Budget', 'Controlling'],
    'accounting': ['Belege', 'Buchungen', 'Konten', 'Abschlüsse', 'Steuererklärungen', 'Prüfungen', 'Dokumentation'],
    'bookkeeping': ['Belege', 'Buchungen', 'Konten', 'Monatsabschlüsse', 'Jahresabschlüsse', 'Steuervoranmeldungen', 'Mahnwesen'],
    'financial-reporting': ['Daten', 'Berichte', 'Abschlüsse', 'Analysen', 'Prüfungen', 'Freigaben', 'Verteilungen'],
    'tax-accounting': ['Steuerdaten', 'Steuerberechnungen', 'Steuererklärungen', 'Steuervoranmeldungen', 'Steuerberater', 'Steuerprüfungen', 'Steuerdokumentation'],
    'budget-control': ['Budget', 'Ausgaben', 'Abweichungen', 'Forecasts', 'Anpassungen', 'Controlling-Berichte', 'Kommunikation'],
    'payment-processing': ['Zahlungseingänge', 'Zahlungsausgänge', 'Mahnwesen', 'Zahlungsabstimmungen', 'Zahlungsberichte', 'Zahlungsprozesse', 'Zahlungskommunikation'],
    'customer-service': ['Anfragen', 'Tickets', 'Probleme', 'Lösungen', 'Kunden', 'Feedback', 'SLA'],
    'project-management': ['Projekte', 'Teams', 'Ressourcen', 'Zeitpläne', 'Milestones', 'Risiken', 'Deliverables'],
    'accounting': ['Belege', 'Buchungen', 'Konten', 'Berichte', 'Prüfungen', 'Steuern', 'Jahresabschluss'],
    'hr': ['Personal', 'Recruiting', 'Verträge', 'Entwicklung', 'Konflikte', 'Compliance', 'Strategie'],
    'it-support': ['Tickets', 'Systeme', 'Probleme', 'Lösungen', 'Updates', 'Dokumentation', 'Schulungen'],
    'research': ['Fragestellungen', 'Quellen', 'Daten', 'Analysen', 'Ergebnisse', 'Berichte', 'Präsentationen'],
    'logistics': ['Lieferungen', 'Routen', 'Lager', 'Transport', 'Qualität', 'Kosten', 'Prozesse']
  };

  private contextualModifiers = {
    'excel': ['in Excel', 'mit Formeln', 'automatisiert'],
    'crm': ['im CRM-System', 'kundenspezifisch', 'datengetrieben'],
    'email': ['per E-Mail', 'automatisch', 'termingesteuert'],
    'api': ['über Schnittstellen', 'automatisiert', 'in Echtzeit'],
    'cloud': ['in der Cloud', 'kollaborativ', 'synchronisiert']
  };

  generateSubtasks(
    taskText: string, 
    patternMatch: PatternMatch, 
    contextAnalysis: ContextAnalysis
  ): DynamicSubtask[] {
    const pattern = patternMatch.pattern;
    const systems = contextAnalysis.systems;
    
    // Extrahiere spezifische Begriffe aus dem Task-Text
    const extractedTerms = this.extractSpecificTerms(taskText);
    
    // Generiere 3-7 Subtasks basierend auf Pattern und Kontext
    const subtaskCount = this.calculateSubtaskCount(taskText, patternMatch.score);
    const subtasks: DynamicSubtask[] = [];
    
    // Verwende die spezifischen Verben und Objekte für das erkannte Pattern
    let verbs = this.taskVerbs[pattern];
    let objects = this.taskObjects[pattern];
    
    // Debug: Log das erkannte Pattern
    console.log('🔍 [generateSubtasks] Pattern erkannt:', pattern);
    console.log('🔍 [generateSubtasks] Task Text:', taskText.substring(0, 50) + '...');
    console.log('🔍 [generateSubtasks] Verfügbare Patterns:', Object.keys(this.taskVerbs));
    console.log('🔍 [generateSubtasks] Initial verbs:', verbs?.length, 'objects:', objects?.length);
    console.log('🔍 [generateSubtasks] Initial verbs array:', verbs);
    console.log('🔍 [generateSubtasks] Initial objects array:', objects);
    
    // Fallback für Finance-Patterns
    if ((pattern.startsWith('finance') || pattern.startsWith('accounting') || pattern.startsWith('bookkeeping') || pattern.startsWith('tax') || pattern.startsWith('budget') || pattern.startsWith('payment') || pattern.startsWith('account-reconciliation'))) {
      console.log('🔍 [generateSubtasks] Finance-Pattern erkannt:', pattern);
      // Verwende spezifische Finance-Patterns
      if (pattern === 'bookkeeping') {
        verbs = this.taskVerbs['bookkeeping'];
        objects = this.taskObjects['bookkeeping'];
        console.log('🔍 [generateSubtasks] Verwende bookkeeping Verben:', verbs?.length);
        console.log('🔍 [generateSubtasks] Bookkeeping verbs:', verbs);
      } else if (pattern === 'financial-reporting') {
        verbs = this.taskVerbs['financial-reporting'];
        objects = this.taskObjects['financial-reporting'];
        console.log('🔍 [generateSubtasks] Verwende financial-reporting Verben:', verbs?.length);
        console.log('🔍 [generateSubtasks] Financial-reporting verbs:', verbs);
      } else if (pattern === 'accounting') {
        verbs = this.taskVerbs['accounting'];
        objects = this.taskObjects['accounting'];
        console.log('🔍 [generateSubtasks] Verwende accounting Verben:', verbs?.length);
        console.log('🔍 [generateSubtasks] Accounting verbs:', verbs);
      } else if (pattern === 'tax-accounting') {
        verbs = this.taskVerbs['tax-accounting'];
        objects = this.taskObjects['tax-accounting'];
        console.log('🔍 [generateSubtasks] Verwende tax-accounting Verben:', verbs?.length);
        console.log('🔍 [generateSubtasks] Tax-accounting verbs:', verbs);
      } else if (pattern === 'budget-control') {
        verbs = this.taskVerbs['budget-control'];
        objects = this.taskObjects['budget-control'];
        console.log('🔍 [generateSubtasks] Verwende budget-control Verben:', verbs?.length);
        console.log('🔍 [generateSubtasks] Budget-control verbs:', verbs);
      } else if (pattern === 'payment-processing') {
        verbs = this.taskVerbs['payment-processing'];
        objects = this.taskObjects['payment-processing'];
        console.log('🔍 [generateSubtasks] Verwende payment-processing Verben:', verbs?.length);
        console.log('🔍 [generateSubtasks] Payment-processing verbs:', verbs);
      } else if (pattern === 'account-reconciliation') {
        verbs = this.taskVerbs['account-reconciliation'];
        objects = this.taskObjects['account-reconciliation'];
        console.log('🔍 [generateSubtasks] Verwende account-reconciliation Verben:', verbs?.length);
        console.log('🔍 [generateSubtasks] Account-reconciliation verbs:', verbs);
      } else {
        verbs = this.taskVerbs['finance'];
        objects = this.taskObjects['finance'];
        console.log('🔍 [generateSubtasks] Verwende generisches finance Verben:', verbs?.length);
        console.log('🔍 [generateSubtasks] Finance verbs:', verbs);
      }
    }
    
    // Fallback für Marketing-Patterns
    if (pattern.startsWith('marketing-')) {
      console.log('🔍 Marketing-Pattern erkannt:', pattern);
      // Verwende spezifische Marketing-Patterns
      if (pattern === 'marketing-strategy') {
        verbs = this.taskVerbs['marketing-strategy'];
        objects = this.taskObjects['marketing-strategy'];
        console.log('🔍 Verwende marketing-strategy Verben:', verbs?.length);
      } else if (pattern === 'marketing-campaign') {
        verbs = this.taskVerbs['marketing-campaign'];
        objects = this.taskObjects['marketing-campaign'];
        console.log('🔍 Verwende marketing-campaign Verben:', verbs?.length);
      } else if (pattern === 'content-marketing') {
        verbs = this.taskVerbs['content-marketing'];
        objects = this.taskObjects['content-marketing'];
        console.log('🔍 Verwende content-marketing Verben:', verbs?.length);
      } else if (pattern === 'social-media') {
        verbs = this.taskVerbs['social-media'];
        objects = this.taskObjects['social-media'];
        console.log('🔍 Verwende social-media Verben:', verbs?.length);
      } else if (pattern === 'digital-marketing') {
        verbs = this.taskVerbs['digital-marketing'];
        objects = this.taskObjects['digital-marketing'];
        console.log('🔍 Verwende digital-marketing Verben:', verbs?.length);
      } else if (pattern === 'brand-marketing') {
        verbs = this.taskVerbs['brand-marketing'];
        objects = this.taskObjects['brand-marketing'];
        console.log('🔍 Verwende brand-marketing Verben:', verbs?.length);
      } else if (pattern === 'performance-marketing') {
        verbs = this.taskVerbs['performance-marketing'];
        objects = this.taskObjects['performance-marketing'];
        console.log('🔍 Verwende performance-marketing Verben:', verbs?.length);
      } else {
        verbs = this.taskVerbs['marketing'];
        objects = this.taskObjects['marketing'];
        console.log('🔍 Verwende generisches marketing Verben:', verbs?.length);
      }
    }
    
    // Fallback für andere Patterns
    if (!verbs) {
      console.log('🔍 Verwende routine Verben als Fallback');
      verbs = this.taskVerbs['routine'];
      objects = this.taskObjects['routine'];
    }
    
    console.log('🔍 [generateSubtasks] Finale Verben:', verbs?.length, 'Objekte:', objects?.length);
    console.log('🔍 [generateSubtasks] Finale verbs array:', verbs);
    console.log('🔍 [generateSubtasks] Finale objects array:', objects);
    
    // Finale Sicherheitsprüfung
    if (!verbs || !Array.isArray(verbs) || verbs.length === 0) {
      console.error('❌ [generateSubtasks] Finale Sicherheitsprüfung: Verbs sind undefined, verwende routine');
      verbs = this.taskVerbs['routine'] || ['aufgabe ausführen'];
    }
    
    if (!objects || !Array.isArray(objects) || objects.length === 0) {
      console.error('❌ [generateSubtasks] Finale Sicherheitsprüfung: Objects sind undefined, verwende routine');
      objects = this.taskObjects['routine'] || ['Aufgabe'];
    }
    
    for (let i = 0; i < subtaskCount; i++) {
      const subtask = this.generateSpecificSubtask(
        i, 
        taskText, 
        extractedTerms, 
        verbs, 
        objects, 
        systems, 
        patternMatch, 
        contextAnalysis
      );
      subtasks.push(subtask);
    }
    
    return subtasks;
  }

  private extractSpecificTerms(taskText: string): string[] {
    const lowerText = taskText.toLowerCase();
    const terms: string[] = [];
    
    // Extrahiere spezifische Nomen und Verben
    const specificTerms = [
      // Daten-bezogene Begriffe
      'crm', 'excel', 'datenbank', 'csv', 'api', 'sql',
      // Prozess-Begriffe  
      'automatisierung', 'workflow', 'integration', 'migration',
      // Business-Begriffe
      'kunde', 'projekt', 'budget', 'termin', 'deadline',
      // System-Begriffe
      'software', 'tool', 'platform', 'system', 'dashboard',
      // Marketing-spezifische Begriffe
      'kampagne', 'campaign', 'content', 'social media', 'seo', 'sem', 'ppc',
      'google ads', 'facebook ads', 'linkedin ads', 'branding', 'positionierung',
      'zielgruppe', 'target audience', 'conversion', 'roi', 'ctr', 'cpc',
      'remarketing', 'attribution', 'landing page', 'email marketing', 'influencer',
      'hashtag', 'engagement', 'reach', 'impression', 'click', 'lead', 'qualification',
      'nurturing', 'funnel', 'pipeline', 'analytics', 'tracking', 'optimization',
      'a/b test', 'split test', 'performance', 'brand awareness', 'brand equity',
      'messaging', 'storytelling', 'visual', 'video', 'podcast', 'webinar',
      'whitepaper', 'ebook', 'case study', 'testimonial', 'referral', 'affiliate'
    ];
    
    for (const term of specificTerms) {
      if (lowerText.includes(term)) {
        terms.push(term);
      }
    }
    
    return [...new Set(terms)];
  }

  private calculateSubtaskCount(taskText: string, automationScore: number): number {
    let baseCount = 4;
    
    // Komplexitäts-basierte Aufsplittung
    if (taskText.length > 300) baseCount = 8; // Sehr komplexe Aufgaben
    else if (taskText.length > 200) baseCount = 7; // Komplexe Aufgaben
    else if (taskText.length > 150) baseCount = 6; // Mittlere Komplexität
    else if (taskText.length > 100) baseCount = 5; // Einfache Komplexität
    else baseCount = 4; // Minimale Komplexität
    
    // Automatisierungs-basierte Anpassung
    if (automationScore > 90) baseCount += 1; // Hohe Automatisierung = mehr Schritte
    else if (automationScore < 30) baseCount += 1; // Niedrige Automatisierung = mehr manuelle Schritte
    else if (automationScore < 20) baseCount += 2; // Sehr niedrige Automatisierung
    
    // Spezielle Pattern-Anpassungen
    if (taskText.toLowerCase().includes('integration') || taskText.toLowerCase().includes('api')) {
      baseCount += 1; // Integrationen brauchen mehr Schritte
    }
    if (taskText.toLowerCase().includes('workflow') || taskText.toLowerCase().includes('prozess')) {
      baseCount += 1; // Workflows sind komplexer
    }
    if (taskText.toLowerCase().includes('automatisierung') || taskText.toLowerCase().includes('automatisch')) {
      baseCount += 1; // Automatisierung braucht Setup-Schritte
    }
    
    return Math.max(3, Math.min(10, baseCount)); // Mindestens 3, maximal 10 Subtasks
  }

  private generateSpecificSubtask(
    index: number,
    taskText: string,
    extractedTerms: string[],
    verbs: string[],
    objects: string[],
    systems: string[],
    patternMatch: PatternMatch,
    contextAnalysis: ContextAnalysis
  ): DynamicSubtask {
    
    // Sicherheitsprüfung für undefined arrays
    if (!verbs || !Array.isArray(verbs) || verbs.length === 0) {
      console.error('❌ Verbs array ist undefined oder leer:', verbs);
      verbs = this.taskVerbs['routine'] || ['aufgabe ausführen'];
    }
    
    if (!objects || !Array.isArray(objects) || objects.length === 0) {
      console.error('❌ Objects array ist undefined oder leer:', objects);
      objects = this.taskObjects['routine'] || ['Aufgabe'];
    }
    
    const verb = verbs[index % verbs.length];
    const object = objects[index % objects.length];
    const modifier = systems.length > 0 ? 
      this.contextualModifiers[systems[0]]?.[index % 3] || '' : '';
    
    // Debug: Log die ausgewählten Verben und Objekte
    console.log(`🔍 [generateSpecificSubtask] Subtask ${index}: Verb='${verb}', Object='${object}'`);
    console.log(`🔍 [generateSpecificSubtask] Subtask ${index}: Verb index=${index % verbs.length}, Object index=${index % objects.length}`);
    
    // Generiere spezifischen Titel basierend auf extrahierten Begriffen
    const specificTerm = extractedTerms[index % extractedTerms.length] || '';
    const title = this.generateContextualTitle(verb, object, specificTerm, modifier, index);
    
    console.log(`🔍 [generateSpecificSubtask] Subtask ${index}: Generated title='${title}'`);
    
    // Berechne dynamische Werte
    const baseAutomation = patternMatch.score;
    const automationVariation = this.calculateAutomationVariation(index, verb, systems);
    const automationPotential = Math.max(10, Math.min(95, baseAutomation + automationVariation));
    
    const estimatedTime = this.calculateEstimatedTime(index, patternMatch.complexity, automationPotential);
    const priority = this.calculatePriority(index, automationPotential);
    const complexity = this.calculateComplexity(index, systems.length, patternMatch.complexity);
    
    return {
      id: `subtask-${Date.now()}-${index}`,
      title,
      description: this.generateDescription(title, specificTerm, systems),
      automationPotential: Math.round(automationPotential),
      estimatedTime,
      priority,
      complexity,
      systems: systems.slice(0, 2), // Maximal 2 Systeme pro Subtask
      dependencies: this.generateDependencies(index, this.calculateSubtaskCount(taskText, patternMatch.score), systems),
      risks: this.generateRisks(verb, systems, automationPotential),
      opportunities: this.generateOpportunities(verb, automationPotential, systems)
    };
  }

  private generateContextualTitle(
    verb: string,
    object: string,
    specificTerm: string,
    modifier: string,
    index: number
  ): string {
    // Marketing-spezifische Schritt-Definitionen
    const marketingSteps = [
      'Strategie & Planung',
      'Konzeption & Design', 
      'Umsetzung & Launch',
      'Performance & Optimierung',
      'Analyse & Reporting',
      'Optimierung & Iteration',
      'Skalierung & Expansion',
      'Monitoring & Maintenance',
      'Evaluation & Learnings',
      'Strategie-Anpassung'
    ];
    
    // Standard-Schritt-Definitionen für andere Bereiche
    const standardSteps = [
      'Analyse & Planung',
      'Datenaufbereitung', 
      'Hauptausführung',
      'Qualitätskontrolle',
      'Integration & Test',
      'Dokumentation',
      'Optimierung',
      'Freigabe & Deployment',
      'Monitoring',
      'Wartung'
    ];
    
    // Finance-spezifische Schritt-Definitionen
    const financeSteps = [
      'Datenaufbereitung & Eingabe',
      'Buchung & Kontierung',
      'Abstimmung & Prüfung',
      'Berichterstattung & Abschluss',
      'Steuer & Compliance',
      'Controlling & Analyse',
      'Dokumentation & Archivierung',
      'Freigabe & Kommunikation',
      'Monitoring & Überwachung',
      'Optimierung & Prozessverbesserung'
    ];
    
    // Verwende Marketing-Schritte für Marketing-Patterns
    const isMarketingPattern = verb.includes('kampagne') || verb.includes('content') || 
                              verb.includes('social') || verb.includes('brand') || 
                              verb.includes('performance') || verb.includes('strategie') ||
                              object.toLowerCase().includes('kampagne') || object.toLowerCase().includes('content');
    
    // Verwende Finance-Schritte für Finance-Patterns
    const isFinancePattern = verb.includes('buchung') || verb.includes('kontierung') || 
                            verb.includes('abschluss') || verb.includes('steuer') || 
                            verb.includes('budget') || verb.includes('controlling') ||
                            object.toLowerCase().includes('buchhaltung') || object.toLowerCase().includes('finanz') ||
                            object.toLowerCase().includes('beleg') || object.toLowerCase().includes('konto');
    
    let steps;
    if (isMarketingPattern) {
      steps = marketingSteps;
    } else if (isFinancePattern) {
      steps = financeSteps;
    } else {
      steps = standardSteps;
    }
    const stepPrefix = index < steps.length ? `${steps[index]}: ` : `Schritt ${index + 1}: `;
    
    // Spezifischere Titel-Generierung
    let title = '';
    
    if (specificTerm && modifier) {
      title = `${stepPrefix}${verb} von ${specificTerm}-${object} ${modifier}`;
    } else if (specificTerm) {
      title = `${stepPrefix}${verb} von ${specificTerm}-${object}`;
    } else if (modifier) {
      title = `${stepPrefix}${verb} von ${object} ${modifier}`;
    } else {
      title = `${stepPrefix}${verb} von ${object}`;
    }
    
    // Finance-spezifische Anpassungen
    if (isFinancePattern) {
      if (index === 0) {
        title = title.replace('belege sammeln', 'belege sammeln und kategorisieren');
        title = title.replace('buchungen kontieren', 'buchungen vorbereiten und kontieren');
        title = title.replace('finanzdaten sammeln', 'finanzdaten sammeln und validieren');
      } else if (index === 1) {
        title = title.replace('buchungen kontieren', 'buchungen kontieren und erfassen');
        title = title.replace('konten abstimmen', 'konten führen und überwachen');
        title = title.replace('belege erfassen', 'belege erfassen und buchen');
      } else if (index === 2) {
        title = title.replace('konten abstimmen', 'konten abstimmen und prüfen');
        title = title.replace('abschlüsse erstellen', 'abschlüsse vorbereiten und erstellen');
        title = title.replace('berichte erstellen', 'berichte erstellen und validieren');
      } else if (index === 3) {
        title = title.replace('abschlüsse erstellen', 'abschlüsse erstellen und freigeben');
        title = title.replace('berichte erstellen', 'berichte erstellen und verteilen');
        title = title.replace('steuern berechnen', 'steuern berechnen und prüfen');
      } else if (index === 4) {
        title = title.replace('steuern berechnen', 'steuererklärungen vorbereiten');
        title = title.replace('steuervoranmeldungen', 'steuervoranmeldungen erstellen und einreichen');
      }
    } else if (isMarketingPattern) {
      // Marketing-spezifische Anpassungen
      if (index === 0) {
        title = title.replace('zielgruppen analysieren', 'zielgruppen und markt analysieren');
        title = title.replace('kampagnen konzipieren', 'kampagnenstrategie entwickeln');
        title = title.replace('content erstellen', 'content-strategie entwickeln');
      } else if (index === 1) {
        title = title.replace('kampagnen konzipieren', 'kampagnenkonzept und design erstellen');
        title = title.replace('content erstellen', 'content konzipieren und designen');
      } else if (index === 2) {
        title = title.replace('kanäle bespielen', 'kampagne launchen und kanäle bespielen');
        title = title.replace('content erstellen', 'content produzieren und publizieren');
      } else if (index === 3) {
        title = title.replace('performance messen', 'performance tracken und optimieren');
        title = title.replace('optimierungen durchführen', 'kampagne optimieren und anpassen');
      }
    } else {
      // Standard-Anpassungen für andere Bereiche
      if (index === 0) {
        title = title.replace('daten sammeln', 'anforderungen analysieren und daten sammeln');
        title = title.replace('kontakte identifizieren', 'zielgruppe analysieren und kontakte identifizieren');
      } else if (index === 1) {
        title = title.replace('daten strukturieren', 'daten bereinigen und strukturieren');
        title = title.replace('daten analysieren', 'daten validieren und analysieren');
      } else if (index >= 3) {
        title = title.replace('daten übertragen', 'daten übertragen und synchronisieren');
        title = title.replace('berichte verteilen', 'berichte freigeben und verteilen');
      }
    }
    
    return title;
  }

  private generateDescription(title: string, specificTerm: string, systems: string[]): string {
    const systemText = systems.length > 0 ? ` mit ${systems.join(' und ')}` : '';
    const specificText = specificTerm ? ` für ${specificTerm}` : '';
    
    return `${title}${specificText}${systemText} - Detaillierte Bearbeitung mit spezifischen Anforderungen`;
  }

  private calculateAutomationVariation(index: number, verb: string, systems: string[]): number {
    let variation = 0;
    
    // Erste Subtasks haben oft höheres Automatisierungspotenzial
    if (index === 0) variation += 10;
    if (index === 1) variation += 5;
    if (index >= 4) variation -= 15; // Spätere Schritte oft manueller
    
    // Verb-basierte Variation
    const highAutomationVerbs = ['erfassen', 'eingeben', 'sammeln', 'übertragen', 'formatieren'];
    const lowAutomationVerbs = ['konzipieren', 'entscheiden', 'bewerten', 'gestalten'];
    
    if (highAutomationVerbs.some(v => verb.includes(v))) variation += 15;
    if (lowAutomationVerbs.some(v => verb.includes(v))) variation -= 20;
    
    // System-basierte Variation
    if (systems.includes('excel') || systems.includes('api')) variation += 10;
    if (systems.includes('email') || systems.includes('calendar')) variation += 5;
    
    return variation;
  }

  private calculateEstimatedTime(index: number, complexity: string, automationPotential: number): number {
    let baseTime = 60; // 1 Stunde
    
    // Komplexitäts-Faktor
    if (complexity === 'high') baseTime *= 2;
    if (complexity === 'low') baseTime *= 0.5;
    
    // Index-Faktor (mittlere Schritte dauern oft länger)
    if (index === 1 || index === 2) baseTime *= 1.5;
    
    // Automatisierungs-Faktor
    if (automationPotential > 80) baseTime *= 0.3;
    else if (automationPotential > 60) baseTime *= 0.6;
    else if (automationPotential < 30) baseTime *= 1.5;
    
    return Math.round(baseTime);
  }

  private calculatePriority(index: number, automationPotential: number): 'low' | 'medium' | 'high' | 'critical' {
    if (index === 0) return 'critical'; // Erster Schritt ist kritisch
    if (automationPotential > 80) return 'high'; // Hohe Automatisierung = hohe Priorität
    if (automationPotential < 30) return 'medium'; // Niedrige Automatisierung = mittlere Priorität
    return 'medium';
  }

  private calculateComplexity(index: number, systemCount: number, patternComplexity: string): 'low' | 'medium' | 'high' {
    let complexityScore = 0;
    
    if (patternComplexity === 'high') complexityScore += 2;
    if (patternComplexity === 'medium') complexityScore += 1;
    
    if (systemCount > 2) complexityScore += 2;
    if (systemCount > 0) complexityScore += 1;
    
    if (index > 3) complexityScore += 1; // Spätere Schritte oft komplexer
    
    if (complexityScore >= 4) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }

  private generateRisks(verb: string, systems: string[], automationPotential: number): string[] {
    const risks: string[] = [];
    
    // Verb-spezifische Risiken
    if (verb.includes('eingeben') || verb.includes('erfassen')) {
      risks.push('Eingabefehler', 'Datenqualität');
    }
    if (verb.includes('analysieren') || verb.includes('bewerten')) {
      risks.push('Fehlinterpretation', 'Unvollständige Daten');
    }
    
    // System-spezifische Risiken
    if (systems.includes('api')) risks.push('API-Ausfälle', 'Rate-Limits');
    if (systems.includes('excel')) risks.push('Formel-Fehler', 'Versionskonflikte');
    
    // Automatisierungs-spezifische Risiken
    if (automationPotential > 80) {
      risks.push('Überautomatisierung', 'Fehlende Kontrolle');
    } else if (automationPotential < 30) {
      risks.push('Manuelle Fehler', 'Zeitaufwand');
    }
    
    return risks.slice(0, 3); // Maximal 3 Risiken
  }

  private generateDependencies(index: number, totalSubtasks: number, systems: string[]): string[] {
    const dependencies: string[] = [];
    
    // Basis-Abhängigkeiten: Jeder Schritt hängt vom vorherigen ab
    if (index > 0) {
      dependencies.push(`subtask-${index - 1}`);
    }
    
    // Spezielle Abhängigkeiten basierend auf Systemen
    if (systems.includes('api') && index >= 2) {
      // API-Integrationen brauchen Setup-Schritte
      dependencies.push(`subtask-0`); // Setup-Abhängigkeit
    }
    
    if (systems.includes('excel') && index >= 3) {
      // Excel-Prozesse brauchen Datenaufbereitung
      dependencies.push(`subtask-1`); // Datenaufbereitung
    }
    
    if (systems.includes('crm') && index >= 4) {
      // CRM-Prozesse brauchen Kontaktaufbereitung
      dependencies.push(`subtask-1`); // Kontaktaufbereitung
    }
    
    // Parallele Abhängigkeiten für komplexe Workflows
    if (index >= 5 && totalSubtasks > 6) {
      // Späte Schritte können parallel zu frühen Schritten laufen
      if (index === 5) dependencies.push(`subtask-2`); // Hauptausführung
      if (index === 6) dependencies.push(`subtask-3`); // Qualitätskontrolle
    }
    
    return [...new Set(dependencies)]; // Entferne Duplikate
  }

  private generateOpportunities(verb: string, automationPotential: number, systems: string[]): string[] {
    const opportunities: string[] = [];
    
    if (automationPotential > 70) {
      opportunities.push('Vollautomatisierung möglich', 'Zeitersparnis von 80%+');
    }
    if (automationPotential > 50) {
      opportunities.push('Teilautomatisierung', 'Qualitätsverbesserung');
    }
    
    if (systems.includes('api')) {
      opportunities.push('Echtzeit-Integration', 'Skalierbarkeit');
    }
    if (systems.includes('excel')) {
      opportunities.push('Formel-Automatisierung', 'Template-Nutzung');
    }
    
    if (verb.includes('sammeln') || verb.includes('erfassen')) {
      opportunities.push('Batch-Verarbeitung', 'Datenvalidierung');
    }
    
    return opportunities.slice(0, 3); // Maximal 3 Opportunities
  }
}

// Export singleton instance
export const dynamicSubtaskGenerator = new DynamicSubtaskGenerator();
