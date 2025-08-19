// lib/extractTasks.ts
export type RawTask = { text: string; source: "bullet" | "verbline"; };

const SECTION_START = new RegExp(
  [
    // DE
    "\\b(aufgaben|verantwortlichkeiten|zuständigkeiten|tätigkeiten|zur rolle|rolle|deine aufgaben)\\b",
    // EN
    "\\b(responsibilities|duties|what you will do|role|your role|tasks)\\b",
  ].join("|"),
  "i"
);

const SECTION_IGNORE = new RegExp(
  [
    // DE
    "\\b(hard facts|details zum jobangebot|benefits|leistungen|profil|dein profil|anforderungen|qualifikationen|kontakt)\\b",
    // EN
    "\\b(benefits|perks|about you|requirements|qualifications|contact|about us|company)\\b",
  ].join("|"),
  "i"
);

// Bullet-Zeilen
const BULLET = /^\s*(?:[-–*•●▪]|[0-9]+\.)\s+(.+)$/i;

// Tätigkeitsverben (DE/EN)
const VERB_LINE = new RegExp(
  [
    // DE (Infinitiv/Verb am Satzanfang oder nach Gedankenstrich)
    "^(?:[–—-]\\s*)?(?:entwickeln|gestalten|planen|koordinieren|analysieren|implementieren|pflegen|migrieren|übernehmen|führen|mentoren|betreuen|optimieren|automatisieren|dokumentieren|überwachen|integrieren)\\b",
    // EN
    "^(?:[–—-]\\s*)?(?:develop|design|plan|coordinate|analy[sz]e|implement|maintain|migrate|lead|mentor|own|optimi[sz]e|automate|document|monitor|integrate)\\b",
  ].join("|"),
  "i"
);

const MAX_TASK_LEN = 140;

function clean(s: string): string {
  return s
    .replace(/[*_`#>]+/g, " ")        // Markdown-Reste
    .replace(/\s{2,}/g, " ")
    .replace(/\s+[,;]$/, "")
    .trim();
}

function shorten(s: string, n = MAX_TASK_LEN) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

// Nimmt den gesamten reinen Text der Anzeige
export function extractTasks(text: string): RawTask[] {
  const lines = text.split(/\r?\n/).map(l => clean(l)).filter(Boolean);

  // 1) Relevanten Abschnitt finden: ab "Aufgaben/Responsibilities" bis VOR nächster Ignore-Section
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (SECTION_START.test(lines[i])) { startIdx = i; break; }
  }
  let scoped = startIdx >= 0 ? lines.slice(startIdx + 1) : lines;

  const stopAt = scoped.findIndex(l => SECTION_IGNORE.test(l));
  if (stopAt >= 0) scoped = scoped.slice(0, stopAt);

  // 2) Bullets einsammeln
  const bullets: RawTask[] = [];
  for (const l of scoped) {
    const m = l.match(BULLET);
    if (m && m[1]) {
      const txt = shorten(clean(m[1]));
      if (txt.length >= 6) bullets.push({ text: txt, source: "bullet" });
    }
  }

  // 3) Fallback: Verb-Linien (falls keine Bullets gefunden)
  const verbLines: RawTask[] = bullets.length
    ? []
    : scoped
        .filter(l => VERB_LINE.test(l))
        .map(l => ({ text: shorten(clean(l)), source: "verbline" }));

  // 4) Kombinieren + deduplizieren
  const dedup = new Map<string, RawTask>();
  for (const t of [...bullets, ...verbLines]) {
    const key = t.text.toLowerCase();
    if (!dedup.has(key)) dedup.set(key, t);
  }

  // 5) Offensichtlichen Noise eliminieren
  const NOISE = /\b(hard facts|details|benefits|profil|qualifikationen|anforderungen|requirement|qualification|benefit|perk)\b/i;
  const result = Array.from(dedup.values())
    .filter(t => !NOISE.test(t.text))
    .slice(0, 30); // Safety-Limit

  return result;
}