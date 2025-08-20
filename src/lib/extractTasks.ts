// lib/extractTasks.ts
export type RawTask = { text: string; source: "bullet" | "verbline" | "simple"; };

// Branchenspezifische Aufgaben-Überschriften
const BRANCH_SPECIFIC_SECTIONS = {
  // Technologie & IT
  tech: [
    'development tasks', 'coding responsibilities', 'technical duties', 'engineering tasks',
    'entwicklungsaufgaben', 'programmieraufgaben', 'technische aufgaben', 'engineering-aufgaben'
  ],
  // Gesundheitswesen
  healthcare: [
    'patient care duties', 'clinical responsibilities', 'medical tasks', 'nursing duties',
    'patientenpflege', 'klinische aufgaben', 'medizinische tätigkeiten', 'pflegeaufgaben'
  ],
  // Finanzwesen
  finance: [
    'financial duties', 'accounting tasks', 'bookkeeping responsibilities', 'tax duties',
    'finanzaufgaben', 'buchhaltungsaufgaben', 'steueraufgaben', 'rechnungswesen'
  ],
  // Marketing & Sales
  marketing: [
    'marketing tasks', 'sales duties', 'campaign responsibilities', 'lead generation',
    'marketingaufgaben', 'vertriebsaufgaben', 'kampagnenaufgaben', 'lead-generierung',
    'marketing manager', 'marketing verantwortlichkeiten', 'marketing responsibilities',
    'marketing duties', 'marketing role', 'marketing position', 'marketing function',
    'marketing manager aufgaben', 'marketing manager responsibilities',
    'marketing strategy', 'marketing strategie', 'brand management', 'brand management',
    'campaign management', 'kampagnenmanagement', 'digital marketing', 'digitales marketing',
    'content marketing', 'content marketing', 'social media', 'social media marketing',
    'marketing communications', 'marketing kommunikation', 'pr', 'public relations',
    'marketing analytics', 'marketing analytics', 'marketing reporting', 'marketing berichte'
  ],
  // HR & Personal
  hr: [
    'hr duties', 'recruitment tasks', 'personnel management', 'employee relations',
    'personalaufgaben', 'recruiting-aufgaben', 'mitarbeiterbetreuung', 'personalverwaltung'
  ],
  // Produktion & Logistik
  production: [
    'production tasks', 'manufacturing duties', 'logistics responsibilities', 'warehouse tasks',
    'produktionsaufgaben', 'fertigungsaufgaben', 'logistikaufgaben', 'lageraufgaben'
  ],
  // Bildung & Forschung
  education: [
    'teaching duties', 'research tasks', 'academic responsibilities', 'educational tasks',
    'lehraufgaben', 'forschungsaufgaben', 'akademische aufgaben', 'bildungsaufgaben'
  ],
  // Recht & Compliance
  legal: [
    'legal duties', 'compliance tasks', 'regulatory responsibilities', 'contract management',
    'rechtsaufgaben', 'compliance-aufgaben', 'regulatorische aufgaben', 'vertragsmanagement'
  ]
};

const SECTION_START = /aufgaben|responsibilities|duties|role/i;

const SECTION_END = /anforderungen|requirements|qualifikationen|qualifications/i;

// Bullet-Zeilen (erweitert) - auch für Pflegeaufgaben
const BULLET = /^\s*(?:[-–—*•●▪▫◦‣⁃]|[0-9]+\.|\([0-9]+\)|[a-z]\.|\([a-z]\))\s+(.+)$/i;

// Branchenspezifische Tätigkeitsverben
const BRANCH_VERBS = {
  // Technologie & IT
  tech: [
    'entwickeln', 'programmieren', 'codieren', 'debuggen', 'testen', 'deployen', 'maintainen',
    'develop', 'program', 'code', 'debug', 'test', 'deploy', 'maintain', 'implement',
    'architect', 'design', 'optimize', 'refactor', 'review', 'document', 'integrate'
  ],
  // Gesundheitswesen
  healthcare: [
    'pflegen', 'behandeln', 'diagnostizieren', 'überwachen', 'dokumentieren', 'beraten',
    'care', 'treat', 'diagnose', 'monitor', 'document', 'advise', 'assess', 'evaluate',
    'administer', 'assist', 'support', 'educate', 'counsel'
  ],
  // Finanzwesen
  finance: [
    'buchhalten', 'abrechnen', 'steuern', 'analysieren', 'berichten', 'prüfen', 'kontrollieren',
    'account', 'reconcile', 'tax', 'analyze', 'report', 'audit', 'review', 'process',
    'calculate', 'verify', 'validate', 'prepare', 'submit'
  ],
  // Marketing & Sales
  marketing: [
    'verkaufen', 'werben', 'kampagnen', 'analysieren', 'optimieren', 'generieren',
    'sell', 'market', 'campaign', 'analyze', 'optimize', 'generate', 'promote',
    'advertise', 'research', 'target', 'convert', 'engage', 'retain',
    // Marketing Manager spezifische Verben
    'entwickeln', 'planen', 'koordinieren', 'führen', 'leiten', 'verwalten', 'überwachen',
    'develop', 'plan', 'coordinate', 'lead', 'manage', 'oversee', 'supervise',
    'strategie', 'strategic', 'branding', 'brand', 'positioning', 'position',
    'content', 'social media', 'digital', 'online', 'offline', 'traditional',
    'budget', 'budgeting', 'roi', 'kpi', 'metrics', 'reporting', 'berichten',
    'team', 'teamführung', 'teamlead', 'teamleadership', 'coaching', 'mentoring',
    'kunden', 'customer', 'client', 'stakeholder', 'partner', 'agency', 'agentur',
    'kampagne', 'campaign', 'projekt', 'project', 'initiative', 'initiative',
    'messaging', 'kommunikation', 'communication', 'pr', 'public relations',
    'events', 'veranstaltungen', 'messen', 'trade shows', 'webinar', 'workshop',
    'analytics', 'daten', 'data', 'insights', 'erkenntnisse', 'trends', 'trends',
    'competitor', 'wettbewerb', 'competition', 'benchmark', 'benchmarking'
  ],
  // HR & Personal
  hr: [
    'rekrutieren', 'einstellen', 'betreuen', 'entwickeln', 'bewerten', 'beraten',
    'recruit', 'hire', 'support', 'develop', 'evaluate', 'advise', 'manage',
    'coach', 'train', 'mentor', 'assess', 'counsel', 'facilitate'
  ],
  // Produktion & Logistik
  production: [
    'produzieren', 'fertigen', 'lagern', 'transportieren', 'liefern', 'kontrollieren',
    'produce', 'manufacture', 'store', 'transport', 'deliver', 'control', 'assemble',
    'package', 'ship', 'receive', 'inventory', 'quality', 'maintain'
  ],
  // Bildung & Forschung
  education: [
    'lehren', 'unterrichten', 'forschen', 'entwickeln', 'bewerten', 'beraten',
    'teach', 'instruct', 'research', 'develop', 'assess', 'advise', 'mentor',
    'guide', 'facilitate', 'evaluate', 'supervise', 'coordinate', 'plan'
  ],
  // Recht & Compliance
  legal: [
    'beraten', 'prüfen', 'dokumentieren', 'analysieren', 'verhandeln', 'vertreten',
    'advise', 'review', 'document', 'analyze', 'negotiate', 'represent', 'comply',
    'regulate', 'enforce', 'investigate', 'litigate', 'mediate', 'draft'
  ]
};

// Tätigkeitsverben (DE/EN) - erweitert mit branchenspezifischen Verben
const VERB_LINE = new RegExp(
  [
    // DE (Infinitiv/Verb am Satzanfang oder nach Gedankenstrich)
    "^(?:[–—-]\\s*)?(?:du\\s+)?(" + 
    [
      // Allgemeine Verben
      'entwickelst|gestaltest|planst|koordinierst|analysierst|implementierst|pflegst|migrierst|übernimmst|führst|mentorst|betreust|optimierst|automatisierst|dokumentierst|überwachst|integrierst|erstellst|verwaltst|unterstützt|leitest|bearbeitest|durchführst|sicherstellst|verantwortest|schneidest|schneiden|bearbeitest|bearbeiten|verarbeitest|verarbeiten|sortierst|sortieren|packst|packen|lagerst|lagern|transportierst|transportieren|lieferst|liefern|kontrollierst|kontrollieren|prüfst|prüfen|testest|testen|reparierst|reparieren|wartest|warten|installierst|installieren|montierst|montieren|produzierst|produzieren|fertigst|fertigen|assemblierst|assemblieren|verpackst|verpacken|etikettierst|etikettieren|versendest|versenden|verschickst|verschicken|empfängst|empfangen|annahmst|annahme|annahmen|annahmst|annahme|annahmen|übernehmen|planen|evaluieren|arbeiten|sind|führen|koordinieren|dokumentieren|verwalten|betreuen|beraten|unterstützen|leiten|organisieren|kontrollieren|überwachen|sicherstellen|verantworten|gestalten|entwickeln|implementieren|optimieren|automatisieren|integrieren|erstellen|bearbeiten|durchführen|pflegen|migrieren|mentoren|betreuen|analysieren|testen|deployen|schneiden|verarbeiten|sortieren|packen|lagern|transportieren|liefern|kontrollieren|prüfen|reparieren|warten|installieren|montieren|produzieren|fertigen|assemblieren|verpacken|etikettieren|versenden|verschicken|empfangen|annahmen',
      // Branchenspezifische Verben
      ...Object.values(BRANCH_VERBS).flat()
    ].join('|') + ")\\b",
    // DE (Du-Form)
    "^du\\s+(" + [
      // Allgemeine Verben
      'entwickelst|gestaltest|planst|koordinierst|analysierst|implementierst|pflegst|migrierst|übernimmst|führst|mentorst|betreust|optimierst|automatisierst|dokumentierst|überwachst|integrierst|erstellst|verwaltst|unterstützt|leitest|bearbeitest|durchführst|sicherstellst|verantwortest|schneidest|schneiden|bearbeitest|bearbeiten|verarbeitest|verarbeiten|sortierst|sortieren|packst|packen|lagerst|lagern|transportierst|transportieren|lieferst|liefern|kontrollierst|kontrollieren|prüfst|prüfen|testest|testen|reparierst|reparieren|wartest|warten|installierst|installieren|montierst|montieren|produzierst|produzieren|fertigst|fertigen|assemblierst|assemblieren|verpackst|verpacken|etikettierst|etikettieren|versendest|versenden|verschickst|verschicken|empfängst|empfangen|annahmst|annahme|annahmen|annahmst|annahme|annahmen',
      // Branchenspezifische Verben
      ...Object.values(BRANCH_VERBS).flat()
    ].join('|') + ")",
    // DE (Sie-Form für formelle Stellenanzeigen)
    "^sie\\s+(" + [
      // Allgemeine Verben
      'übernehmen|planen|evaluieren|arbeiten|sind|übernehmen|führen|koordinieren|dokumentieren|verwalten|betreuen|beraten|unterstützen|leiten|organisieren|kontrollieren|überwachen|sicherstellen|verantworten|gestalten|entwickeln|implementieren|optimieren|automatisieren|integrieren|erstellen|bearbeiten|durchführen|pflegen|migrieren|mentoren|betreuen|analysieren|testen|deployen|schneiden|verarbeiten|sortieren|packen|lagern|transportieren|liefern|kontrollieren|prüfen|reparieren|warten|installieren|montieren|produzieren|fertigen|assemblieren|verpacken|etikettieren|versenden|verschicken|empfangen|annahmen',
      // Branchenspezifische Verben
      ...Object.values(BRANCH_VERBS).flat()
    ].join('|') + ")\\b",
    // EN (Imperativ/3rd Person)
    "^(?:[–—-]\\s*)?(" + [
      // Allgemeine Verben
      'develop|design|plan|coordinate|analy[sz]e|implement|maintain|migrate|lead|mentor|own|optimi[sz]e|automate|document|monitor|integrate|create|manage|support|handle|execute|ensure|oversee|build|test|deploy|cut|cutting|process|processing|sort|sorting|pack|packing|store|storing|transport|transporting|deliver|delivering|check|checking|inspect|inspecting|repair|repairing|maintain|maintaining|install|installing|assemble|assembling|produce|producing|manufacture|manufacturing|package|packaging|label|labeling|ship|shipping|receive|receiving|handle|handling',
      // Branchenspezifische Verben
      ...Object.values(BRANCH_VERBS).flat()
    ].join('|') + ")\\b",
  ].join("|"),
  "i"
);

const MAX_TASK_LEN = 200; // Erhöht von 140 auf 200

// Floskeln und überflüssige Begriffe
const FLUFF_PATTERNS = [
  /\b(hard facts|details|benefits|profil|qualifikationen|anforderungen|requirement|qualification|benefit|perk|nice to have|plus|bonus)\b/i,
  /^\s*(?:weitere|additional|other|more)\s+/i, // "Weitere Aufgaben", "Additional duties"
  /^\s*(?:sonstige|miscellaneous|various)\s+/i,
  /\b(?:etc\.?|usw\.?|and more|and similar)\s*$/i
];

// Branchenspezifische Qualifikations-Keywords die keine Aufgaben sind
const BRANCH_QUALIFICATIONS = {
  // Technologie & IT
  tech: [
    'programming languages', 'frameworks', 'databases', 'cloud platforms', 'devops tools',
    'programmiersprachen', 'frameworks', 'datenbanken', 'cloud-plattformen', 'devops-tools',
    'agile', 'scrum', 'kanban', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp'
  ],
  // Gesundheitswesen
  healthcare: [
    'nursing license', 'medical degree', 'clinical experience', 'patient care experience',
    'pflegelizenz', 'medizinstudium', 'klinische erfahrung', 'patientenerfahrung',
    'bachelor of nursing', 'registered nurse', 'licensed practical nurse'
  ],
  // Finanzwesen
  finance: [
    'accounting degree', 'cpa', 'tax certification', 'financial analysis experience',
    'buchhalterabschluss', 'steuerberater', 'steuerfachangestellte', 'finanzanalyse-erfahrung',
    'chartered accountant', 'certified public accountant', 'tax advisor'
  ],
  // Marketing & Sales
  marketing: [
    'marketing degree', 'sales experience', 'digital marketing skills', 'crm experience',
    'marketingabschluss', 'vertriebserfahrung', 'digital marketing-kenntnisse', 'crm-erfahrung',
    'google ads', 'facebook ads', 'seo', 'sem', 'social media marketing',
    'abgeschlossenes studium', 'berufserfahrung', 'kommunikationsfähigkeiten', 'ms office'
  ],
  // HR & Personal
  hr: [
    'hr degree', 'recruitment experience', 'employee relations experience', 'hr certification',
    'personalabschluss', 'recruiting-erfahrung', 'mitarbeiterbetreuung-erfahrung', 'hr-zertifizierung',
    'shrm', 'pihr', 'sphr', 'human resources management'
  ],
  // Produktion & Logistik
  production: [
    'manufacturing experience', 'logistics certification', 'warehouse management experience',
    'fertigungserfahrung', 'logistik-zertifizierung', 'lagermanagement-erfahrung',
    'lean manufacturing', 'six sigma', 'supply chain management', 'inventory management'
  ],
  // Bildung & Forschung
  education: [
    'teaching degree', 'phd', 'research experience', 'academic background',
    'lehramtsstudium', 'doktortitel', 'forschungserfahrung', 'akademischer hintergrund',
    'master of education', 'doctorate', 'postdoctoral experience'
  ],
  // Recht & Compliance
  legal: [
    'law degree', 'bar admission', 'legal experience', 'compliance certification',
    'jurastudium', 'anwaltszulassung', 'rechtserfahrung', 'compliance-zertifizierung',
    'juris doctor', 'attorney', 'paralegal', 'legal assistant'
  ]
};

// Qualifikations-Keywords die keine Aufgaben sind
const QUALIFICATION_PATTERNS = [
  // Bildung & Abschlüsse
  /\b(ausbildung|studium|abschluss|degree|education|background|certified|certification)\b/i,
  /\b(steuerfachangestellte|buchhalter|accountant|tax specialist|steuerberatung)\b/i,
  
  // Erfahrung & Zeit
  /\b(erfahrung|experience|jahre|years|berufserfahrung|work experience)\b/i,
  /\b(mehrjährig|langjährig|long-term|several years)\b/i,
  
  // Kenntnisse & Fähigkeiten (erweitert) - aber nicht Pflege-spezifische
  /\b(kenntnisse|knowledge|skills|fähigkeiten|fertigkeiten|competence|proficiency|vertraut|familiar)\b/i,
  /\b(datev|sap|software kenntnisse|tool kenntnisse|system kenntnisse|application knowledge)\b/i,
  /\b(pc-kenntnisse|computer skills|it-kenntnisse|software skills|ms office)\b/i,
  /\b(sprachkenntnisse|language|englisch|deutsch|english|german|französisch|french)\b/i,
  
  // Eigenschaften & Soft Skills (erweitert) - aber nicht Pflege-spezifische
  /\b(genauigkeit|zuverlässigkeit|accuracy|reliability|sorgfalt|precision)\b/i,
  /\b(kommunikationsstärke|communication skills|soft skills|social skills)\b/i,
  /\b(teamfähigkeit|team player|leadership skills|führungskompetenz)\b/i,
  /\b(belastbarkeit|stress resistance|flexibilität|flexibility)\b/i,
  /\b(geduld|patience|empathie|empathy|freundlich|friendly|höflich|polite)\b/i,
  /\b(professionell|professional)\s+(auftreten|demeanor|erscheinung|behavior)\b/i,
  
  // Rechtliche & fachliche Kenntnisse
  /\b(steuerrechtlich|tax law|rechtlich|legal|compliance|regulatory)\b/i,
  /\b(bilanzierung|accounting standards|gaap|ifrs|hgb)\b/i,
  
  // Voraussetzungen
  /\b(voraussetzung|requirement|must have|should have|preferred|wünschenswert|nice to have)\b/i,
  /\b(berechtigung|lizenz|license|permit|authorization|zertifikat|certificate)\b/i,
  /^\s*(?:mindestens|minimum|at least)\s+\d+/i, // "Mindestens 3 Jahre"
  
  // Bildungsabschlüsse
  /\b(?:bachelor|master|diplom|phd|dr\.|mba|fachhochschule|universität|university)\b/i,
  /\b(?:kaufmännisch|commercial|business|wirtschafts|betriebswirt)\b/i,
  
  // Pflege-spezifische Qualifikationen (aber nicht Aufgaben)
  /\b(?:gesundheits- und krankenpfleger|altenpflegefachkraft|gesundheits- und kinder krankenpfleger|pflegefachkraft|pflegehelfer)\b/i,
  /\b(?:führerschein|führerschein der klasse)\b/i,
  
  // Branchenspezifische Qualifikationen
  ...Object.values(BRANCH_QUALIFICATIONS).flat().map(q => new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'))
];

function clean(s: string): string {
  return s
    .replace(/[*_`#>]+/g, " ")        // Markdown-Reste
    .replace(/\s{2,}/g, " ")
    .replace(/\s+[,;.\-–—]*\s*$/, "") // Satzzeichen am Ende
    .replace(/^[,;.\-–—\s]+/, "")     // Satzzeichen am Anfang
    .trim();
}

function shorten(s: string, n = MAX_TASK_LEN): string {
  if (s.length <= n) return s;
  
  // Versuche bei Satzende zu kürzen
  const sentences = s.split(/[.!?]/);
  if (sentences[0] && sentences[0].length <= n) {
    return sentences[0].trim();
  }
  
  // Kürze bei Wortgrenze
  const shortened = s.slice(0, n);
  const lastSpace = shortened.lastIndexOf(' ');
  return lastSpace > n * 0.8 ? shortened.slice(0, lastSpace) + "…" : shortened + "…";
}

function isFluff(text: string): boolean {
  return FLUFF_PATTERNS.some(pattern => pattern.test(text));
}

function isQualification(text: string): boolean {
  // Wenn der Text ein Verb am Anfang hat, ist es wahrscheinlich eine Aufgabe, keine Qualifikation
  const taskVerbs = [
    'entwicklung', 'koordination', 'analyse', 'betreuung', 'organisation', 'zusammenarbeit', 'erstellung',
    'planung', 'kontrolle', 'verwaltung', 'führung', 'leitung', 'optimierung', 'implementierung',
    'budgetplanung', 'budget', 'budgeting', 'finanzplanung', 'finanzplanung',
    'development', 'coordination', 'analysis', 'support', 'organization', 'collaboration', 'creation',
    'planning', 'control', 'management', 'leadership', 'optimization', 'implementation'
  ];
  
  const lowerText = text.toLowerCase();
  if (taskVerbs.some(verb => lowerText.startsWith(verb))) {
    return false; // Das ist eine Aufgabe, keine Qualifikation
  }
  
  const result = QUALIFICATION_PATTERNS.some(pattern => pattern.test(text));
  return result;
}

function isHeadingOrIntro(text: string): boolean {
  const headingPatterns = [
    /^(?:aufgaben|deine aufgaben|responsibilities|duties|role|tasks):?\s*$/i,
    /^(?:zu|in|for|as)\s+(?:dieser|your|this|the)\s+(?:stelle|position|role)/i,
    /^(?:als|as)\s+(?:unser|our)/i
  ];
  return headingPatterns.some(pattern => pattern.test(text));
}

// Branchenspezifische Aufgaben-Erkennung
export function detectIndustry(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Technologie & IT
  if (lowerText.includes('software') || lowerText.includes('programming') || lowerText.includes('development') || 
      lowerText.includes('coding') || lowerText.includes('api') || lowerText.includes('database') ||
      lowerText.includes('entwicklung') || lowerText.includes('programmierung') || lowerText.includes('coding') ||
      lowerText.includes('datenbank') || lowerText.includes('system') || lowerText.includes('technisch')) {
    return 'tech';
  }
  
  // Gesundheitswesen
  if (lowerText.includes('patient') || lowerText.includes('medical') || lowerText.includes('nursing') ||
      lowerText.includes('clinical') || lowerText.includes('healthcare') || lowerText.includes('care') ||
      lowerText.includes('patient') || lowerText.includes('medizinisch') || lowerText.includes('pflege') ||
      lowerText.includes('klinisch') || lowerText.includes('gesundheit') || lowerText.includes('behandlung')) {
    return 'healthcare';
  }
  
  // Finanzwesen
  if (lowerText.includes('accounting') || lowerText.includes('finance') || lowerText.includes('tax') ||
      lowerText.includes('bookkeeping') || lowerText.includes('financial') || lowerText.includes('audit') ||
      lowerText.includes('buchhaltung') || lowerText.includes('finanzen') || lowerText.includes('steuer') ||
      lowerText.includes('buchführung') || lowerText.includes('finanziell') || lowerText.includes('prüfung') ||
      lowerText.includes('buchhalter') || lowerText.includes('controller') || lowerText.includes('rechnungswesen') ||
      lowerText.includes('bilanz') || lowerText.includes('abrechnung') || lowerText.includes('kassenbuch')) {
    return 'finance';
  }
  
  // Marketing & Sales
  if (lowerText.includes('marketing') || lowerText.includes('sales') || lowerText.includes('campaign') ||
      lowerText.includes('advertising') || lowerText.includes('promotion') || lowerText.includes('lead') ||
      lowerText.includes('marketing') || lowerText.includes('vertrieb') || lowerText.includes('kampagne') ||
      lowerText.includes('werbung') || lowerText.includes('promotion') || lowerText.includes('lead')) {
    return 'marketing';
  }
  
  // HR & Personal
  if (lowerText.includes('hr') || lowerText.includes('human resources') || lowerText.includes('recruitment') ||
      lowerText.includes('personnel') || lowerText.includes('employee') || lowerText.includes('hiring') ||
      lowerText.includes('personal') || lowerText.includes('rekrutierung') || lowerText.includes('mitarbeiter') ||
      lowerText.includes('einstellung') || lowerText.includes('personalwesen')) {
    return 'hr';
  }
  
  // Produktion & Logistik
  if (lowerText.includes('production') || lowerText.includes('manufacturing') || lowerText.includes('logistics') ||
      lowerText.includes('warehouse') || lowerText.includes('supply chain') || lowerText.includes('inventory') ||
      lowerText.includes('produktion') || lowerText.includes('fertigung') || lowerText.includes('logistik') ||
      lowerText.includes('lager') || lowerText.includes('lieferkette') || lowerText.includes('bestand')) {
    return 'production';
  }
  
  // Bildung & Forschung
  if (lowerText.includes('teaching') || lowerText.includes('education') || lowerText.includes('research') ||
      lowerText.includes('academic') || lowerText.includes('university') || lowerText.includes('school') ||
      lowerText.includes('lehre') || lowerText.includes('bildung') || lowerText.includes('forschung') ||
      lowerText.includes('akademisch') || lowerText.includes('universität') || lowerText.includes('schule')) {
    return 'education';
  }
  
  // Recht & Compliance
  if (lowerText.includes('legal') || lowerText.includes('law') || lowerText.includes('compliance') ||
      lowerText.includes('regulatory') || lowerText.includes('contract') || lowerText.includes('attorney') ||
      lowerText.includes('recht') || lowerText.includes('gesetz') || lowerText.includes('compliance') ||
      lowerText.includes('regulatorisch') || lowerText.includes('vertrag') || lowerText.includes('anwalt')) {
    return 'legal';
  }
  
  return 'general';
}

// Moderne AI-Tools für Aufgabenautomatisierung
const AI_TOOLS_BY_INDUSTRY = {
  tech: {
    'ChatGPT': 'Allgemeine Programmierunterstützung, Code-Erklärungen, Debugging-Hilfe',
    'Claude': 'Detaillierte Code-Analysen, Sicherheitsprüfungen, Architektur-Beratung',
    'GitHub Copilot': 'Code-Vervollständigung, automatische Funktionen, Tests',
    'CodeWhisperer': 'AWS-spezifische Entwicklung, Cloud-Integration',
    'Tabnine': 'Lokale Code-Vervollständigung, Offline-Entwicklung',
    'Replit Ghost': 'Online-IDE mit AI-Unterstützung, Kollaboration',
    'Codeium': 'Code-Vervollständigung, Multi-Language Support',
    'Blackbox AI': 'Code-Suche, Erklärungen, Best Practices'
  },
  healthcare: {
    'ChatGPT': 'Medizinische Dokumentation, Patientenkommunikation, Protokollierung',
    'Claude': 'Klinische Entscheidungsunterstützung, Forschung, Compliance',
    'Notion AI': 'Patientendaten-Management, Dokumentation, Workflows',
    'Obsidian AI': 'Medizinisches Knowledge Management, Fallstudien',
    'Microsoft Copilot': 'Office-Integration für medizinische Berichte',
    'Perplexity': 'Medizinische Recherche, aktuelle Studien, Guidelines'
  },
  finance: {
    'ChatGPT': 'Finanzberichte, Datenanalyse, Dokumentation',
    'Claude': 'Risikoanalyse, Compliance-Prüfungen, Auditing',
    'Excel AI': 'Automatische Datenverarbeitung, Berichte, Dashboards',
    'Power BI AI': 'Finanzdashboards, Trendanalyse, Visualisierung',
    'Google Sheets AI': 'Kollaborative Finanzanalyse, Automatisierung',
    'Airtable AI': 'Finanzdaten-Management, Workflows, Automatisierung'
  },
  marketing: {
    'ChatGPT': 'Content-Erstellung, Kampagnen-Planung, Copywriting',
    'Claude': 'Strategische Analyse, Marktforschung, Zielgruppenanalyse',
    'Jasper': 'Marketing-Content, Werbetexte, Social Media',
    'Copy.ai': 'Conversion-optimierte Texte, A/B-Testing',
    'Writesonic': 'E-Commerce-Content, Produktbeschreibungen',
    'Canva AI': 'Design-Templates, Visual Content, Branding'
  },
  hr: {
    'ChatGPT': 'Recruiting-Unterstützung, Bewerbungsanalyse, Kommunikation',
    'Claude': 'Personalstrategie, Compliance, Mitarbeiterentwicklung',
    'Notion AI': 'HR-Dokumentation, Onboarding, Prozesse',
    'Microsoft Copilot': 'Office-Integration für HR-Aufgaben',
    'Airtable AI': 'Bewerber-Management, Workflows, Automatisierung'
  },
  production: {
    'ChatGPT': 'Produktionsplanung, Qualitätskontrolle, Dokumentation',
    'Claude': 'Prozessoptimierung, Sicherheitsanalysen, Compliance',
    'Excel AI': 'Produktionsdaten, Bestandsverwaltung, Berichte',
    'Power BI AI': 'Produktionsdashboards, Performance-Monitoring',
    'Airtable AI': 'Lagerverwaltung, Lieferketten-Management'
  },
  education: {
    'ChatGPT': 'Unterrichtsvorbereitung, Materialerstellung, Bewertung',
    'Claude': 'Forschungsanalyse, Akademische Texte, Methodik',
    'Notion AI': 'Kurs-Management, Studentendaten, Dokumentation',
    'Obsidian AI': 'Forschungsnotizen, Knowledge Management',
    'Perplexity': 'Aktuelle Forschung, Literaturrecherche'
  },
  legal: {
    'ChatGPT': 'Vertragsentwürfe, Dokumentation, Recherche',
    'Claude': 'Rechtsanalyse, Compliance-Prüfungen, Risikobewertung',
    'Notion AI': 'Fall-Management, Dokumentation, Workflows',
    'Perplexity': 'Rechtsrecherche, aktuelle Gesetze, Präzedenzfälle'
  },
  general: {
    'ChatGPT': 'Allgemeine Aufgaben, Textverarbeitung, Kommunikation',
    'Claude': 'Detaillierte Analysen, Strategie, Qualitätssicherung',
    'Grok': 'Echtzeit-Informationen, Innovation, Trendanalyse',
    'Gemini': 'Multimodal, Google-Integration, Recherche',
    'Perplexity': 'Recherche-basiert, Quellenangaben, Faktenprüfung',
    'Microsoft Copilot': 'Office-Integration, Business-Tasks',
    'Notion AI': 'Dokumentation, Knowledge Management, Workflows'
  }
};

// Hauptfunktion für Aufgaben-Extraktion
export function extractTasks(text: string): RawTask[] {
  // NICHT die gesamten Zeilen cleanen - das zerstört die Bullet-Points!
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Branchenerkennung
  const detectedIndustry = detectIndustry(text);
  console.log(`Task extraction - Detected industry: ${detectedIndustry}`);

  // 1) Relevanten Abschnitt finden: ab "Aufgaben/Responsibilities" 
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (SECTION_START.test(lines[i])) { 
      startIdx = i; 
      break; 
    }
  }
  
  // Falls kein expliziter Aufgaben-Abschnitt gefunden, nehme den ganzen Text
  let scoped = startIdx >= 0 ? lines.slice(startIdx + 1) : lines;

  // 2) Bis zur nächsten irrelevanten Section
  const stopAt = scoped.findIndex(l => SECTION_END.test(l));
  if (stopAt >= 0) {
    scoped = scoped.slice(0, stopAt);
  }

  // 3) Bullets einsammeln
  const bullets: RawTask[] = [];
  
  for (const l of scoped) {
    const m = l.match(BULLET);
    if (m && m[1] && m[1].length >= 10) {
      const cleanText = clean(m[1]);
      
      // Nur einfache Qualifikations-Prüfung
      if (!isQualification(cleanText)) {
        const txt = shorten(cleanText);
        if (txt.length >= 10) {
          bullets.push({ text: txt, source: "bullet" });
        }
      }
    }
  }

  return bullets;
}

