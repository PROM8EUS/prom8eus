// lib/composeJobText.ts
// Formt extrahiertes Material (z. B. aus URL-Parser) zu einem Analyse-String.

export type ExtractedJob = {
  title?: string;
  description?: string;
  responsibilities?: string;
  qualifications?: string;
  fulltext?: string;
  source?: string;
};

export function composeJobText(j: ExtractedJob): string {
  const parts: string[] = [];
  if (j.title) parts.push(j.title.trim());

  const pushBlock = (label: string, body?: string) => {
    const clean = (body ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (clean) parts.push(`${label}:\n${clean}`);
  };

  // Versuche deutsch/englisch automatisch zu labeln
  const text = [j.responsibilities, j.qualifications, j.description, j.fulltext].join(" ");
  const de = /aufgaben|anforderungen|verantwortlichkeiten|qualifikationen/i.test(text);

  pushBlock(de ? "AUFGABEN" : "RESPONSIBILITIES", j.responsibilities);
  pushBlock(de ? "ANFORDERUNGEN" : "QUALIFICATIONS", j.qualifications);
  pushBlock(de ? "BESCHREIBUNG" : "DESCRIPTION", j.description || j.fulltext);

  if (j.source) parts.push(`\nQuelle: ${j.source}`);

  return parts.join("\n\n").trim();
}