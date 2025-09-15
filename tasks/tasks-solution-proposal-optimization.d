# Prom8eus – Workflow Ingest & Matching Tasks

## Sprint 1 – Ingest & Normalize
- [ ] GitHub-Collector implementieren (Workflows anhand Dateisignaturen suchen: `workflow.json`, `nodes: []`)
- [ ] n8n Template-Gallery Scraper aufsetzen (Titel, Beschreibung, Nodes, Services)
- [ ] Zapier Template-Katalog scrapen (App-Paare, Kategorien)
- [ ] Make (Integromat) Templates scrapen (App-Namen, Trigger/Aktionen)
- [ ] Einheitliches Workflow-Schema (JSON) definieren:
  - [ ] id, source, title, summary
  - [ ] services, category, triggers, actions
  - [ ] inputs/outputs, complexity, prereqs
  - [ ] reliability_signals, license, link
- [ ] Alias-Lexikon für Services erstellen (z. B. „gsheet“ → google_sheets)
- [ ] Rohdaten in Supabase/Postgres speichern

## Sprint 2 – Matching & Scoring
- [ ] LLM/Regex-Pipeline zur Extraktion von:
  - [ ] Services
  - [ ] Trigger/Action-Verben
  - [ ] Komplexität (steps, branches, auths)
- [ ] Matching-Logik implementieren:
  - [ ] Kategorie-Overlap
  - [ ] Services-Overlap
  - [ ] Trigger/Action-Ähnlichkeit
  - [ ] Setup-Effort
- [ ] Score-Formel implementieren (0–100, gewichtete Faktoren)
- [ ] Konfidenz-Bins: High (≥75), Medium (50–74), Low (<50)
- [ ] Deduping via MinHash/Shingling (Titel + Services + Actions)

## Sprint 3 – UI & User Flow
- [ ] Trefferliste (Karten) mit Tabs: Best Fit / Alternativen / Low Effort
- [ ] Workflow-Detailansicht:
  - [ ] Summary, Services, Trigger/Actions
  - [ ] Setup-Effort, Reliability-Badges
  - [ ] Lizenz-Info + Source-Link
- [ ] Implementierungs-CTA (Overlay-Form):
  - [ ] Tools
  - [ ] Budget
  - [ ] Timeline
- [ ] Transparenz-Badges:
  - [ ] Maintained / Not Maintained
  - [ ] License Known / Unknown
  - [ ] Estimated Effort

## Sprint 4 – Admin/Monitoring
- [ ] Ingest Dashboard (Stats: total, new, errors)
- [ ] Re-Run Extraction Button
- [ ] Export CSV
- [ ] Error Handling & Logs

## Optional / Stretch Goals
- [ ] Reddit & Awesome-Listen Scraper
- [ ] Auto-Smoke-Test für n8n-JSON (Schema-Validation)
- [ ] Feedback-Rating pro Workflow (User-Signale ins Ranking)