## Prom8eus – Aktueller Stand: Handhabung von Lösungen (Workflows) und Vorschlägen

Dieser Statusbericht fasst die aktuelle Implementierung für das Laden, Normalisieren, Anzeigen und Bewerten von Workflows („Lösungen“) sowie die Generierung von KI-gestützten Vorschlägen zusammen. Er dient als Kontextdokument für ChatGPT (z. B. zur Ableitung von Verbesserungen, Prompts oder Testfällen).

### 1) Quellen & Ingest

- Quellen (Stand jetzt):
  - `github` – n8n Community Workflows (Repo: Zie619/n8n-workflows)
  - `awesome-n8n-templates` – Kuratierte Community-Templates (Repo: enescingoz/awesome-n8n-templates)
  - `n8n.io` – Offizielle n8n Template-Gallery (Public API)
  - `ai-enhanced` – AI-unterstützte, freie Templates (Repo: wassupjay/n8n-free-templates)

- Edge Function `fetch-github-workflows` (Supabase):
  - POST { source }
  - Für GitHub-Quellen wird das jeweilige Repo via GitHub Contents API gescannt (Verzeichnisse: `workflows`, `templates`, `examples`), `.json`-Dateien werden als Workflows normalisiert.
  - `n8n.io` wird serverseitig (CORS-sicher) in Bulk oder paginiert geladen, anschließend in ein einheitliches Schema gemappt.

- Caching (Supabase Tabelle `workflow_cache`):
  - Pro `version` und `source` wird ein Cache-Eintrag persistiert. Union-View `all` wird zur Laufzeit aus per-Source-Caches gebildet.
  - Der Client lädt bevorzugt aus dem Server-Cache; in der UI werden Counts und Filter auf Basis der In-Memory-Liste konsistent angezeigt.

### 2) Datenmodell & Normalisierung

- Einheitliches Laufzeitmodell `WorkflowIndex` (Kernauszug):

```json
{
  "id": 123,
  "filename": "*.json",
  "name": "Human Readable Title",
  "active": true,
  "triggerType": "Webhook|Manual|Scheduled|Complex",
  "complexity": "Low|Medium|High",
  "nodeCount": 7,
  "integrations": ["Slack", "HTTP Request"],
  "description": "...",
  "category": "communication|database|ai_ml|...",
  "tags": ["webhook", "automation"],
  "fileHash": "...",
  "analyzedAt": "ISO-TS",
  "authorName?": "...",
  "authorUsername?": "...",
  "authorAvatar?": "...",
  "authorVerified?": false
}
```

- Normalisierung findet zentral im Indexer statt (`normalizeWorkflowShape`). Für `n8n.io` werden Autorinfos übernommen, für GitHub ggf. aus Dateinamen heuristisch abgeleitet.

### 3) Anzeige & Interaktion (UI)

- `SourcesManagement.tsx` (Admin):
  - Listet Quellen mit Status, Counts (aus In-Memory/Cache), Health-Indikatoren.
  - „Manage“-Dialog mit `WorkflowRefreshControls` (manuelles Refresh per Quelle).
  - „Index Workflows“ stößt Edge Function `index-workflows` an (Feature/Embedding-Pipeline).

- `WorkflowBrowser.tsx` (Admin + Nutzer):
  - Lädt Workflows über `workflowIndexer.searchWorkflows({ source, q, ... })`.
  - Zeigt Karten (`SolutionCard`) und Detail-Modal (`SolutionDetailModal`).
  - Pagination, Filter (Trigger, Complexity, Category), Suche.
  - Kategorie-Badge rechts wurde entfernt; Komplexitäts-Badge bleibt.

- `CreatorBadge.tsx`/`SolutionCard.tsx`:
  - Gravatar-URLs korrekt via MD5 aus E-Mail (nur wenn valide); sonst Fallback.
  - `authorEmail` nur übergeben, wenn es wirklich eine E-Mail ist.

### 4) Qualitäts- & Health-Checks

- Health Monitoring (Indexer):
  - Quellen: `github`, `awesome-n8n-templates`, `n8n.io`, `ai-enhanced`.
  - GitHub-Checks via Repo-HEAD/GET; `n8n.io` via HEAD auf `https://n8n.io/`.
  - Recovery-Strategien mit Backoff-Scheduling, History und Alerting-Hooks.

- Datenvalidierung:
  - UI- und Analysepfade mit Null-Guards (z. B. `businessMetrics.reasoning ?? ''`).
  - Tolerante Normalisierung, um leere Felder robust darzustellen statt zu crashen.

### 5) KI-Analyse & Vorschläge

- `runAnalysis.ts` / `aiAnalysis.ts`:
  - Ableitung von `complexity`, `automationTrend`, `category` anhand Aufgabeninhalten und Automationspotential.
  - Branchen-/Domänen-Sensitivität (z. B. HR): Aufgaben, Subtasks, Tools domänenspezifisch.
  - Fast/Complete-Analysis: Null-Guards bei `reasoning`, konsistente Defaults (z. B. `medium`, `stable`).

- Darstellung:
  - `TaskList.tsx`: Komplexitäts-Badge immer sichtbar; Kategorie-Label unter Titel (kein zusätzliches blaues Badge rechts).
  - `BusinessCase.tsx`: Defensive Checks gegen `null`/`undefined` in Begründungen.

### 6) Indexierung & Embeddings (Edge)

- `index-workflows` (Supabase Edge):
  - Lädt aus `workflow_cache` (auch Shards via LIKE) für Sources: `github`, `awesome-n8n-templates`, `n8n.io`, `ai-enhanced`.
  - Normalisiert Feature-Zeilen (Integrationen, Trigger, Complexity-Band, Quality-Prior).
  - Optional: Embeddings mit `text-embedding-3-large`, Upsert in `workflow_embeddings`.

### 7) Performance & Caching

- Server-Cache bevorzugt; Browser vermeidet direkte Supabase-RPCs, die Timeouts verursachen könnten.
- `n8n.io`-Bulk-Fetch mit Fallback-Paginierung; GitHub via Edge Function (CORS, Rate-Limit-sicherer).
- In-Memory-Cache im Indexer für schnelle Filter/Counts.

### 8) Bekannte Einschränkungen / Offene Punkte

- GitHub-Rate-Limits: Token wird genutzt (Edge). Bei 403/Secondary Rate Limits ggf. Backoff erweitern.
- Kategorien/Trends kommen teils heuristisch; mehr domänenspezifische Mappings sinnvoll.
- README/Docs aus Repos werden noch nicht systematisch geparst (nur vorgesehen in Indexer-Kommentaren).
- Detail-Links in `WorkflowBrowser` zeigen aktuell auf das Community-Repo – für weitere Quellen sollte die URL dynamisch pro Quelle generiert werden.

### 9) Was ChatGPT mit diesem Kontext tun soll (Beispiele)

- Prompt-Vorschläge zur Verbesserung der Kategorie-/Trend-Ableitung je Domäne (z. B. HR, Finanzen, Marketing).
- Heuristiken/Regex/LLM-Prompts zur besseren Extraktion von Integrationen und Triggern aus Dateinamen/Inhalten.
- Vorschläge zur Deduplizierung ähnlicher Workflows (MinHash/Shingling) und zur Relevanzgewichtung.
- Ideen für UI-Verbesserungen (Transparenz-Badges, Setup-Effort, Lizenz-Infos) mit geringer Latenz.
- Testpläne: Smoke-Tests für neue Quellen, Stresstests (6–8k Workflows), Null-Guard-Coverage.

### 10) Relevante Dateien (Ausschnitt)

- `src/lib/workflowIndexer.ts` – Laden/Cache/Filter/Health/Union-Logik
- `src/components/SourcesManagement.tsx` – Admin-Quellenmanagement, Indexing-Trigger
- `src/components/WorkflowBrowser.tsx` – Browse-Ansicht, Suche/Filter/Pagination
- `src/components/TaskList.tsx` – Aufgabenanzeige (Komplexität/Kategorie)
- `src/components/CreatorBadge.tsx` – Avatar/Gravatar-Handling
- `src/lib/runAnalysis.ts`, `src/lib/aiAnalysis.ts` – Analyse & Vorschlagslogik
- `supabase/functions/fetch-github-workflows` – GitHub/n8n.io Ingest (serverseitig)
- `supabase/functions/index-workflows` – Feature/Embedding-Pipeline

### 11) Quickstart für Tests

1. Admin > Quellen öffnen, „Awesome n8n Templates“ auswählen
2. „Quelle aktualisieren“ (lädt Cache) oder „Workflows indizieren“ (Edge-Pipeline)
3. `WorkflowBrowser` mit `sourceFilter=awesome-n8n-templates` aufrufen
4. Suche/Filter ausprobieren; Karten öffnen; Komplexitäts-/Kategorieanzeige prüfen

---

Hinweis: Neue Quelle „Awesome n8n Templates“ hinzugefügt. Referenz: `https://github.com/enescingoz/awesome-n8n-templates`


