## Relevant Files

- `src/lib/workflowIndexer.ts` - Zentrale Logik für Laden/Filtern/Statistiken der Workflows; wird für Ingest-Status, Caching und Suche erweitert.
- `supabase/functions/fetch-github-workflows/index.ts` - Edge Function für GitHub-Repository-Ingest (Tree-Listing, Dateifilter); Ergänzungen für Resilienz/Rate-Limits.
- `src/components/WorkflowBrowser.tsx` - Admin- und Nutzeransicht für das Browsen von Workflows; Filter/Sortierung/Pagination.
- `src/components/SourcesManagement.tsx` - Admin UI für Quellen; Indexierung, Cache-Verwaltung, Health-Status.
- `src/lib/dataValidationSystem.ts` - Validierungspipeline (Schema, Pflichtfelder, Normalisierung); wird für Ingest integriert.
- `src/lib/troubleshootingGuides.ts` - Fehlerleitfäden und Diagnose; wird mit Ingest-Fehlercodes verknüpft.
- `supabase/migrations/*` - Tabellen/Indizes für `workflow_cache`, Fehler-Logs und Metadaten.
- `scripts/generate-job-task-catalog.ts` - Hilfsskripte zur Kategorisierung/Normalisierung (optional für Backfill).

### Notes

- Unit-Tests (wo sinnvoll) direkt neben den Dateien ablegen: `*.test.ts(x)`.
- Für Edge Functions: lokale Tests mit `supabase functions serve` und Produktivtest via Preview-Deploy.

## Tasks

- [ ] 1.0 Ingest & Normalisierung (Core)
  - [ ] 1.1 GitHub-Collector (Community n8n)
    - [ ] 1.1.1 Tree-API nutzen, nur `workflows/**/*.json` berücksichtigen
    - [ ] 1.1.2 Heuristik: Erkennen von n8n-Workflows (Nodes, Connections, Trigger)
    - [ ] 1.1.3 Rate-Limit/Retry (403/404/timeout) + Backoff
    - [ ] 1.1.4 Ergebnis in ein einheitliches Schema mappen (siehe 1.4)
  - [ ] 1.2 n8n.io Template-Gallery Fetcher
    - [ ] 1.2.1 Public API/HTML-Liste robust abfragen (CORS via Edge Function)
    - [ ] 1.2.2 Felder extrahieren: Titel, Beschreibung, Services/Apps, Trigger, Tags
    - [ ] 1.2.3 Mapping ins einheitliche Schema
  - [ ] 1.3 Speichern in Server-Cache (Supabase `workflow_cache`)
    - [ ] 1.3.1 Upsert pro `version`+`source`
    - [ ] 1.3.2 Sharding unterstützen (`source like 'n8n.io#%'`) für große Datenmengen
    - [ ] 1.3.3 Indizes/Migrationen prüfen (Created/Updated, last_fetch_time)
  - [ ] 1.4 Einheitliches Workflow-Schema definieren
    - [ ] 1.4.1 Pflichtfelder: `id`, `source`, `name`, `description`
    - [ ] 1.4.2 Metadaten: `integrations`, `triggerType`, `complexity`, `nodes`, `tags`
    - [ ] 1.4.3 Qualitäts-Signale: `reliability`, `lastUpdated`, `license`, `author*`
    - [ ] 1.4.4 Validator im `dataValidationSystem` integrieren

- [ ] 2.0 Extraktion & Scoring
  - [ ] 2.1 Feature-Extraktion
    - [ ] 2.1.1 Services/Integrations (Alias-Lexikon: z. B. `gsheet`→`google_sheets`)
    - [ ] 2.1.2 Trigger-/Action-Verben
    - [ ] 2.1.3 Komplexitäts-Signale (Nodes, Branches, Auths)
  - [ ] 2.2 Matching-Logik
    - [ ] 2.2.1 Kategorie-Overlap
    - [ ] 2.2.2 Services-Overlap (Jaccard)
    - [ ] 2.2.3 Trigger/Action-Ähnlichkeit (Token/Embedding – optional)
    - [ ] 2.2.4 Setup-Aufwand (Benutzer-/API-Keys, OAuth, Steps)
  - [ ] 2.3 Score-Formel
    - [ ] 2.3.1 Gewichtete Faktoren (Qualität×Relevanz×Aufwand)
    - [ ] 2.3.2 Konfidenz-Bins: High (≥75), Medium (50–74), Low (<50)
  - [ ] 2.4 Deduplizierung
    - [ ] 2.4.1 MinHash/Shingling über (Titel+Services+Actions)
    - [ ] 2.4.2 Near-duplicate Merging, bevorzugte Quelle behalten

- [ ] 3.0 UI – Browse & Admin
  - [ ] 3.1 Trefferliste (Best Fit / Alternativen / Low Effort)
    - [ ] 3.1.1 Tabs + Pagination + Skeleton-States
    - [ ] 3.1.2 Sortierung: Score, Letztes Update, Aufwand
    - [ ] 3.1.3 Filter: Trigger, Integration, Kategorie, Aktiv
  - [ ] 3.2 Workflow-Detail
    - [ ] 3.2.1 Summary (Beschreibung, Integrationen, Trigger/Actions)
    - [ ] 3.2.2 Setup-Effort, Reliability-Badges, Lizenz
    - [ ] 3.2.3 Direktlink zur Quelle (GitHub/n8n.io)
  - [ ] 3.3 Implementierungs-CTA (Overlay)
    - [ ] 3.3.1 Auswahl: Tools, Budget, Timeline
    - [ ] 3.3.2 Übergabe an Empfehlung/Export
  - [ ] 3.4 Transparenz-Badges
    - [ ] 3.4.1 Maintained/Unmaintained (Heuristik: lastUpdated + Repo-Signale)
    - [ ] 3.4.2 License Known/Unknown
    - [ ] 3.4.3 Estimated Effort (niedrig/mittel/hoch)

- [ ] 4.0 Admin/Monitoring
  - [ ] 4.1 Ingest Dashboard
    - [ ] 4.1.1 Kennzahlen: total, neu, Fehler, letzte Läufe
    - [ ] 4.1.2 Re-Run Extraction (pro Quelle)
    - [ ] 4.1.3 Export CSV
  - [ ] 4.2 Error Handling & Guides
    - [ ] 4.2.1 Fehlercodes + Troubleshooting-Guides verknüpfen
    - [ ] 4.2.2 Alerting/Logs (Supabase Log-Channel)

- [ ] 5.0 Qualität & DX
  - [ ] 5.1 Datenvalidierung (laufzeitnah)
    - [ ] 5.1.1 Schema-Validation bei Ingest + UI-Schutz gegen `undefined`
    - [ ] 5.1.2 „Quarantäne“-Bucket für invalide Einträge
  - [ ] 5.2 Performance
    - [ ] 5.2.1 Caching-Strategie: `workflow_cache` + Memory-Cache im Indexer
    - [ ] 5.2.2 Batch-Saves, Page-Size, Shards
  - [ ] 5.3 Tests
    - [ ] 5.3.1 Unit-Tests für Parser/Mapper
    - [ ] 5.3.2 Snapshot-Tests für Beispiel-Workflows
    - [ ] 5.3.3 Edge-Function Smoke-Tests

### Optional / Stretch

- [ ] S1.0 Weitere Quellen (nur wenn gewünscht)
  - [ ] S1.1 Zapier Templates Scraper (App-Paare, Kategorien) – Edge Function
  - [ ] S1.2 Make (Integromat) Templates – Rate-Limits & Mapping
- [ ] S2.0 Reddit/Awesome-Listen Backfill
- [ ] S3.0 Auto-Smoke-Test: n8n-JSON (Schema-Check + Minimal-Run)
- [ ] S4.0 User-Feedback als Relevanzsignal (Ranking-Feintuning)



