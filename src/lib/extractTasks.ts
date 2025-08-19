// lib/extractTasks.ts
export type RawTask = { text: string; source: "bullet" | "verbline" | "simple"; };

const SECTION_START = new RegExp(
  [
    // DE - erweiterte Aufgaben-Überschriften
    "\\b(aufgaben|deine aufgaben|ihre aufgaben|zur rolle|rolle|verantwortlichkeiten|zuständigkeiten|tätigkeiten|das machst du|du machst|du übernimmst|hauptaufgaben)\\b",
    // EN - erweiterte Responsibility-Überschriften  
    "\\b(responsibilities|duties|role|your role|tasks|what you will do|what you'll do|job duties|key responsibilities|main responsibilities|primary responsibilities)\\b",
  ].join("|"),
  "i"
);

const SECTION_END = new RegExp(
  [
    // DE - Abschnitte die Aufgaben beenden
    "\\b(profil|dein profil|ihr profil|anforderungen|qualifikationen|voraussetzungen|hard facts|details zum jobangebot|benefits|leistungen|wir bieten|das bieten wir|kontakt|über uns|unternehmen|standort|arbeitsplatz)\\b",
    // EN - Abschnitte die Aufgaben beenden
    "\\b(profile|about you|requirements|qualifications|prerequisites|skills|experience|benefits|perks|what we offer|we offer|contact|about us|company|location|workplace|nice to have)\\b",
  ].join("|"),
  "i"
);

// Bullet-Zeilen (erweitert)
const BULLET = /^\s*(?:[-–—*•●▪▫◦‣⁃]|[0-9]+\.|\([0-9]+\)|[a-z]\.|\([a-z]\))\s+(.+)$/i;

// Tätigkeitsverben (DE/EN) - erweitert
const VERB_LINE = new RegExp(
  [
    // DE (Infinitiv/Verb am Satzanfang oder nach Gedankenstrich)
    "^(?:[–—-]\\s*)?(?:du\\s+)?(?:entwickelst|gestaltest|planst|koordinierst|analysierst|implementierst|pflegst|migrierst|übernimmst|führst|mentorst|betreust|optimierst|automatisierst|dokumentierst|überwachst|integrierst|erstellst|verwaltst|unterstützt|leitest|bearbeitest|durchführst|sicherstellst|verantwortest|schneidest|schneiden|bearbeitest|bearbeiten|verarbeitest|verarbeiten|sortierst|sortieren|packst|packen|lagerst|lagern|transportierst|transportieren|lieferst|liefern|kontrollierst|kontrollieren|prüfst|prüfen|testest|testen|reparierst|reparieren|wartest|warten|installierst|installieren|montierst|montieren|produzierst|produzieren|fertigst|fertigen|assemblierst|assemblieren|verpackst|verpacken|etikettierst|etikettieren|versendest|versenden|verschickst|verschicken|empfängst|empfangen|annahmst|annahme|annahmen|annahmst|annahme|annahmen)\\b",
    // DE (Du-Form)
    "^du\\s+(?:entwickelst|gestaltest|planst|koordinierst|analysierst|implementierst|pflegst|migrierst|übernimmst|führst|mentorst|betreust|optimierst|automatisierst|dokumentierst|überwachst|integrierst|erstellst|verwaltst|unterstützt|leitest|bearbeitest|durchführst|sicherstellst|verantwortest|schneidest|schneiden|bearbeitest|bearbeiten|verarbeitest|verarbeiten|sortierst|sortieren|packst|packen|lagerst|lagern|transportierst|transportieren|lieferst|liefern|kontrollierst|kontrollieren|prüfst|prüfen|testest|testen|reparierst|reparieren|wartest|warten|installierst|installieren|montierst|montieren|produzierst|produzieren|fertigst|fertigen|assemblierst|assemblieren|verpackst|verpacken|etikettierst|etikettieren|versendest|versenden|verschickst|verschicken|empfängst|empfangen|annahmst|annahme|annahmen|annahmst|annahme|annahmen)",
    // DE (Sie-Form für formelle Stellenanzeigen)
    "^sie\\s+(?:übernehmen|planen|evaluieren|arbeiten|sind|übernehmen|führen|koordinieren|dokumentieren|verwalten|betreuen|beraten|unterstützen|leiten|organisieren|kontrollieren|überwachen|sicherstellen|verantworten|gestalten|entwickeln|implementieren|optimieren|automatisieren|integrieren|erstellen|bearbeiten|durchführen|pflegen|migrieren|mentoren|betreuen|analysieren|testen|deployen|schneiden|verarbeiten|sortieren|packen|lagern|transportieren|liefern|kontrollieren|prüfen|reparieren|warten|installieren|montieren|produzieren|fertigen|assemblieren|verpacken|etikettieren|versenden|verschicken|empfangen|annahmen)\\b",
    // EN (Imperativ/3rd Person)
    "^(?:[–—-]\\s*)?(?:develop|design|plan|coordinate|analy[sz]e|implement|maintain|migrate|lead|mentor|own|optimi[sz]e|automate|document|monitor|integrate|create|manage|support|handle|execute|ensure|oversee|build|test|deploy|cut|cutting|process|processing|sort|sorting|pack|packing|store|storing|transport|transporting|deliver|delivering|check|checking|inspect|inspecting|repair|repairing|maintain|maintaining|install|installing|assemble|assembling|produce|producing|manufacture|manufacturing|package|packaging|label|labeling|ship|shipping|receive|receiving|handle|handling)\\b",
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

// Qualifikations-Keywords die keine Aufgaben sind
const QUALIFICATION_PATTERNS = [
  // Bildung & Abschlüsse
  /\b(ausbildung|studium|abschluss|degree|education|background|certified|certification)\b/i,
  /\b(steuerfachangestellte|buchhalter|accountant|tax specialist|steuerberatung)\b/i,
  
  // Erfahrung & Zeit
  /\b(erfahrung|experience|jahre|years|berufserfahrung|work experience)\b/i,
  /\b(mehrjährig|langjährig|long-term|several years)\b/i,
  
  // Kenntnisse & Fähigkeiten (erweitert)
  /\b(kenntnisse|knowledge|skills|fähigkeiten|fertigkeiten|competence|proficiency|vertraut|familiar)\b/i,
  /\b(datev|sap|software kenntnisse|tool kenntnisse|system kenntnisse|application knowledge)\b/i,
  /\b(pc-kenntnisse|computer skills|it-kenntnisse|software skills|ms office)\b/i,
  /\b(sprachkenntnisse|language|englisch|deutsch|english|german|französisch|french)\b/i,
  
  // Eigenschaften & Soft Skills (erweitert)
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
  /\b(?:kaufmännisch|commercial|business|wirtschafts|betriebswirt)\b/i
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
  const result = QUALIFICATION_PATTERNS.some(pattern => pattern.test(text));
  if (result) {
    console.log(`QUALIFICATION DETECTED: "${text}"`);
  } else {
    console.log(`NOT QUALIFICATION: "${text}"`);
  }
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

// Nimmt den gesamten reinen Text der Anzeige
export function extractTasks(text: string): RawTask[] {
  const lines = text.split(/\r?\n/).map(l => clean(l)).filter(Boolean);

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
  if (stopAt >= 0) scoped = scoped.slice(0, stopAt);

  // 3) Bullets einsammeln (priorisiert)
  const bullets: RawTask[] = [];
  for (const l of scoped) {
    if (isHeadingOrIntro(l) || isFluff(l) || isQualification(l)) continue;
    
    const m = l.match(BULLET);
    if (m && m[1] && m[1].length >= 10) { // Mindestlänge für sinnvolle Tasks
      const cleanText = clean(m[1]);
      if (!isQualification(cleanText)) { // Doppelte Prüfung nach dem Cleaning
        const txt = shorten(cleanText);
        if (txt.length >= 10) bullets.push({ text: txt, source: "bullet" });
      }
    }
  }

  // 4) Fallback: Verb-Linien und einfache Aktivitäten
  const verbLines: RawTask[] = bullets.length >= 3 
    ? []
    : scoped
        .filter(l => !isHeadingOrIntro(l) && !isFluff(l) && !isQualification(l) && VERB_LINE.test(l))
        .map(l => ({ text: shorten(clean(l)), source: "verbline" as const }))
        .filter(t => t.text.length >= 10 && !isQualification(t.text));

  // 5) Fallback für einfache Aktivitäten (wenn keine anderen Tasks gefunden)
  const simpleActivities: RawTask[] = [];
  if (bullets.length === 0 && verbLines.length === 0) {
    for (const l of scoped) {
      if (!isHeadingOrIntro(l) && !isFluff(l) && !isQualification(l) && l.length >= 5 && l.length <= 100) {
        // Erkenne einfache Aktivitäten wie "Papier schneiden", "Kisten packen", etc.
        const simpleActivityPatterns = [
          /\b(?:papier|karton|kiste|material|ware|produkt|teil|komponente|dokument|brief|formular|etikett|verpackung|box|container|item|product|material|document|label|package)\s+(?:schneiden|schneidet|schneidest|packen|packt|packst|sortieren|sortiert|sortierst|bearbeiten|bearbeitet|bearbeitest|verarbeiten|verarbeitet|verarbeitest|kontrollieren|kontrolliert|kontrollierst|prüfen|prüft|prüfst|lagerst|lagerst|lagert|transportieren|transportiert|transportierst|liefern|liefert|lieferst|versenden|versendet|versendest|verpacken|verpackt|verpackst|etikettieren|etikettiert|etikettierst|montieren|montiert|montierst|assemblieren|assembliert|assemblierst|produzieren|produziert|produzierst|fertigen|fertigt|fertigst|reparieren|repariert|reparierst|installieren|installiert|installierst|wartet|wartest|wartet|testen|testet|testest)\b/i,
          /\b(?:cut|cutting|pack|packing|sort|sorting|process|processing|check|checking|inspect|inspecting|store|storing|transport|transporting|deliver|delivering|ship|shipping|package|packaging|label|labeling|assemble|assembling|produce|producing|manufacture|manufacturing|repair|repairing|install|installing|maintain|maintaining|test|testing)\s+(?:paper|cardboard|box|material|ware|product|part|component|document|letter|form|label|package|container|item)\b/i
        ];
        
        if (simpleActivityPatterns.some(pattern => pattern.test(l))) {
          const cleanText = clean(l);
          if (cleanText.length >= 5) {
            simpleActivities.push({ text: shorten(cleanText), source: "simple" as const });
          }
        }
      }
    }
  }

  // 6) Kombinieren + deduplizieren
  const dedup = new Map<string, RawTask>();
  for (const t of [...bullets, ...verbLines, ...simpleActivities]) {
    const key = t.text.toLowerCase().replace(/[^\w\s]/g, ''); // Normalisiert für Duplikatserkennung
    if (!dedup.has(key) && !isFluff(t.text) && !isQualification(t.text)) {
      dedup.set(key, t);
    }
  }

  // 6) Begrenzen und sortieren (längere Tasks zuerst, da sie meist detaillierter sind)
  const result = Array.from(dedup.values())
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 20); // Max 20 Tasks

  return result;
}