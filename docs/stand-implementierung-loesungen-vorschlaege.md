## Prom8eus – Aktueller Stand: Dual-Type Solution Model (Workflows & AI Agents)

Dieser Statusbericht fasst die aktuelle Implementierung für das Laden, Normalisieren, Anzeigen und Bewerten von **Workflows** und **AI Agents** („Lösungen") sowie die Generierung von KI-gestützten Vorschlägen zusammen. Das System unterstützt nun ein einheitliches **SolutionIndex**-Modell für beide Lösungstypen mit typspezifischen Feldern und gemeinsamen Kernfunktionen. Er dient als Kontextdokument für ChatGPT (z. B. zur Ableitung von Verbesserungen, Prompts oder Testfällen).

### 1) Quellen & Ingest

- Sources Inventory (Dual-Type Model)
  
  **Workflow Sources:**
  - github (n8n Community Workflows)
    - type: github, solution_type: workflow
    - url: https://github.com/Zie619/n8n-workflows
    - default status: active, default count: ~2056
  - awesome-n8n-templates (curated community)
    - type: github, solution_type: workflow
    - url: https://github.com/enescingoz/awesome-n8n-templates
    - default status: active, default count: unknown (0 until ingest)
  - n8n.io (official templates)
    - type: api, solution_type: workflow
    - url: https://n8n.io/workflows/
    - default status: active, default count: ~5496
  - ai-enhanced (n8n free templates, AI-augmented)
    - type: github, solution_type: workflow
    - url: https://github.com/wassupjay/n8n-free-templates
    - default status: active, default count: ~150

  **AI Agent Sources:**
  - crewai (CrewAI Examples)
    - type: github, solution_type: agent
    - url: https://github.com/joaomdmoura/crewAI-examples
    - default status: active, default count: ~50
  - hf-spaces (HuggingFace Spaces)
    - type: api, solution_type: agent
    - url: https://huggingface.co/spaces
    - default status: active, default count: ~200
  - github-agents (GitHub Agent Repositories)
    - type: github, solution_type: agent
    - url: https://api.github.com/search/repositories?q=AI+agent
    - default status: active, default count: ~100

  Admin overrides
  - Persisted in localStorage under key `workflow_source_overrides`
  - Shape per source id: `{ name, type, url, description, category }`
  - Applied on top of base sources in `SourcesManagement.tsx`

- Quellen (Stand jetzt):
  - `github` – n8n Community Workflows (Repo: Zie619/n8n-workflows)
  - `awesome-n8n-templates` – Kuratierte Community-Templates (Repo: enescingoz/awesome-n8n-templates)
  - `n8n.io` – Offizielle n8n Template-Gallery (Public API)
  - `ai-enhanced` – AI-unterstützte, freie Templates (Repo: wassupjay/n8n-free-templates)

Ingestion-Pfade (Code-Orientierung)
- `src/lib/workflowIndexer.ts`
  - `normalizeSourceKey(source)`: Normalisiert Anzeigenamen → Schlüssel (`github`, `awesome-n8n-templates`, `n8n.io`, `ai-enhanced`).
  - `searchWorkflows(params)`: Orchestriert Cache-Laden, Filterung, evtl. Live-Laden (Edge) je Quelle.
  - `loadFromServerCache(source)`: Lädt per-Source-Caches inkl. Union `all` (LIKE-Shards unterstützt).
  - `loadAllFromServerCacheUnion()`: Union-Build aus per-Source-Rows für `all`.
  - `loadRealWorkflows(params)`:
    - `n8n.io`: Client-Fetch mit Bulk (`/api/templates/workflows?page=1&perPage=6000`) + Fallback-Paginierung; Speichern in Cache (serverseitig, wenn SSR).
    - `github` | `awesome-n8n-templates` | `ai-enhanced`: Edge-Function `fetch-github-workflows` (POST { source }) – serverseitiges Listing/Mapping; Ergebnis wird normalisiert und in Cache persistiert.
  - Health/Recovery:
    - `getSourceHealthStatus(source)`: Quelle-spezifische Checks (GitHub Repo HEAD/GET, n8n.io HEAD) + Generic.
    - `startHealthMonitoring()` / `scheduleRecoveryForUnhealthySources()`: periodische Checks; Backoff-Recovery.
  - Incrementals:
    - `startIncrementalUpdates()` / `performIncrementalUpdates()`: sequentielle Updates über Sources-Liste (enthält `awesome-n8n-templates`).

- `supabase/functions/fetch-github-workflows/index.ts`
  - Router `normalizeSource(source)` erkennt u. a. `ai-enhanced` und `awesome-n8n-templates`.
  - `loadGithubWorkflows(repoUrl)`: Scannt Ordner `workflows|templates|examples` (Contents API), mappt `.json`-Dateien → WorkflowIndex-ähnliche Struktur (synthetische Werte, Integrations-Heuristik).
  - `loadN8nOfficialTemplatesPaged/…`: n8n.io API (Bulk + Paginierung) → Mapping + Fallback Mock.

- `supabase/functions/index-workflows/index.ts`
  - Liest `workflow_cache` per Source (LIKE-Shards), erzeugt Feature-Zeilen; optional Embeddings.
  - Default-`sources` enthält `awesome-n8n-templates`.

Hinweise/Cleanup-Kandidaten
- In `workflowIndexer.ts` existiert ein deaktivierter GitHub-Client-Fetch-Pfad (`normalized === 'github' && false`) – kann nach finaler Edge-Nutzung entfernt werden.
- Sicherstellen, dass alle Quellen-Arrays (health, recovery, incrementals, unions) synchron `awesome-n8n-templates` enthalten.
- Debug-Logs (`console.log/warn`) im n8n.io-Pfad ggf. reduzieren, sobald Stabilität verifiziert ist.

### 2) Server-Cache-Logik, Union & Timeouts (0.3)

- Tabelle: `workflow_cache`
  - Schlüssel: `version` + `source` (Shards via `LIKE source%` möglich, z. B. `n8n.io#1`).
  - `workflows` (JSON[]), `last_fetch_time` (timestamp)
- Lesen:
  - Für `all`: Union wird clientseitig durch Iteration fester Quellenliste + LIKE-Abfragen gebildet.
  - Für konkrete Quellen: `eq('source', normalized)` oder `like('source', normalized + '%')` für Shards.
- Timeouts/Fehler (historisch):
  - Browser-seitige DB-Zugriffe können zu 500/57014 (statement timeout) führen.
  - Gegenmaßnahme umgesetzt: Kein initiales Cache-Laden im Browser-Konstruktor; bevorzugt Edge für Ingest.
- Empfehlungen (Quick Fixes):
  - Für Browser: Reads strikter drosseln (z. B. nur nach UI-Interaktion), paginate `workflows` im Edge (Chunking 1–2k) – optional.
  - Für Server: `maybeSingle()` nur bei exaktem `eq('source', s)` verwenden; bei `LIKE` immer Arrays behandeln.
  - Indexe prüfen: `(version, source)` bereits genutzt; optional partieller Index auf `version='v1.5.0'`.

### 3) Normalisierung vs `src/types/solutions.ts` (0.4)

- WorkflowIndex → `WorkflowSolution` Mapping: vorhanden über Browser/Detail-Adapter.
- AgentSolution: Typen vorhanden; Ingest für Agenten in Arbeit (CrewAI/HF). Sicherstellen:
  - Pflichtfelder (id, source, title, summary, link) gesetzt.
  - Workflows: `category`, `integrations`, `complexity` gefüllt (Fallbacks vorhanden).
  - Agents: `agentMetadata` (model/provider optional), `capabilities` standardisiert.
- Lizenz: per GitHub API/README heuristisch extrahieren, im Modal anzeigen; sonst „Unknown“.

### 4) Redundante/experimentelle Pfade (0.5)

- Deaktivierter GitHub-Client-Fetch in `workflowIndexer.ts` (`normalized === 'github' && false`) – entfernen.
- Mehrfache Quellenlisten (health, recovery, incrementals, unions): konsolidieren in eine zentrale Konstante.
- Exzessive `console.*`-Logs in n8n.io Bulk/Paginierung – nach Stabilisierung reduzieren.
- Verwaiste Recovery-/Health-Hilfsfunktionen prüfen und ggf. vereinheitlichen.

### 5) Baselines & Gaps (0.6)

- Counts (Stand zuletzt aus Logs):
  - n8n.io ~5.5k, github ~2.0k, ai-enhanced ~150, awesome-n8n-templates (TBD)
- Health: GitHub/n8n.io reachable; 403 bei GitHub Client-Tree-Fetch → Edge-only beibehalten.
- Performance: n8n.io Bulk ~1–1.3s; Edge GitHub ingest ok. Browser timeouts beim DB-Write vermieden durch Guards.
- Gaps / Quick Fixes:
  - Zentrale Quellenliste exportieren und überall verwenden.
  - LLM-Domänenzuordnung implementieren (Ontology-Table + Cache), UI-Badge anzeigen.
  - Agent-Capability-Tags definieren und normalisieren.
  - Admin-Validierung (Setup-Steps, Domains) implementieren.

### 6) Ergebnis/Notizen (0.7)

- Ingest-Pfade dokumentiert; Server-Cache-Union & Shards verifiziert.
- Cleanup-Liste erstellt; Quick-Fixes priorisiert (zentralisierte Quellenliste, Logging reduzieren, Edge-only GitHub beibehalten).
- Nächste Schritte: Agent-MVP-Quellen anbinden, Ontology/Capabilities einführen, Admin-Validierung und Funnel.

- Edge Function `fetch-github-workflows` (Supabase):
  - POST { source }
  - Für GitHub-Quellen wird das jeweilige Repo via GitHub Contents API gescannt (Verzeichnisse: `workflows`, `templates`, `examples`), `.json`-Dateien werden als Workflows normalisiert.
  - `n8n.io` wird serverseitig (CORS-sicher) in Bulk oder paginiert geladen, anschließend in ein einheitliches Schema gemappt.

- Caching (Supabase Tabelle `workflow_cache`):
  - Pro `version` und `source` wird ein Cache-Eintrag persistiert. Union-View `all` wird zur Laufzeit aus per-Source-Caches gebildet.
  - Der Client lädt bevorzugt aus dem Server-Cache; in der UI werden Counts und Filter auf Basis der In-Memory-Liste konsistent angezeigt.

### 2) Dual-Type Solution Model & Normalisierung

- **Einheitliches SolutionIndex-Modell** für Workflows und AI Agents:

```typescript
interface SolutionIndex {
  // Gemeinsame Kernfelder (Pflichtfelder)
  id: string;
  source: string;
  title: string;
  summary: string;
  link: string;
  type: 'workflow' | 'agent';
  
  // Workflow-spezifische Felder
  category?: string;
  integrations?: string[];
  complexity?: 'Low' | 'Medium' | 'High';
  triggerType?: 'Webhook' | 'Manual' | 'Scheduled' | 'Complex';
  nodeCount?: number;
  
  // Agent-spezifische Felder
  model?: string;
  provider?: string;
  capabilities?: string[];
  
  // Gemeinsame optionale Felder
  tags?: string[];
  domains?: string[];
  domain_confidences?: number[];
  domain_origin?: 'llm' | 'admin' | 'heuristic';
  license?: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  authorVerified?: boolean;
  fileHash?: string;
  analyzedAt?: string;
}
```

- **WorkflowIndex** (Legacy) wird zu **SolutionIndex** migriert
- **AgentIndex** wird als Teil von **SolutionIndex** integriert
- **Type Guards**: `isWorkflowIndex()`, `isAgentIndex()` für typspezifische Verarbeitung
- **Normalisierung**: Zentral im `WorkflowIndexer` mit typspezifischen Fallbacks

### 3) Dual-Type UI & Interaktion

- `EnhancedSourcesManagement.tsx` (Admin):
  - **Per-Type Source Management**: Separate Anzeige für Workflow- und Agent-Quellen
  - **Health Monitoring**: Real-time Health-Status für alle Quellen
  - **Cache Analytics**: Detaillierte Cache-Metriken und Performance-Übersicht
  - **Refresh Controls**: Manuelle Aktualisierung pro Quelle mit Status-Tracking
  - **Error Reporting**: Detaillierte Fehlerberichte und Recovery-Status

- `SolutionBrowser.tsx` (Admin + Nutzer):
  - **Unified Solution Display**: Einheitliche Anzeige für Workflows und AI Agents
  - **Type Filtering**: Filter nach Solution-Typ (Workflow/Agent)
  - **Advanced Search**: Suche über beide Solution-Typen hinweg
  - **Solution Cards**: `SolutionCard` mit Type-Badges und spezifischen Metadaten
  - **Detail Modal**: `SolutionDetailModal` mit typspezifischen Informationen

- `TypeBadge.tsx`/`SolutionCard.tsx`:
  - **Type Indicators**: Visuelle Unterscheidung zwischen Workflows und Agents
  - **Capability Chips**: Standardisierte Capability-Anzeige für AI Agents
  - **Domain Badges**: Business-Domain-Klassifikation für beide Typen
  - **Scoring Display**: Workflow-Scores und Agent-Tiers mit detaillierten Breakdowns

### 4) Enrichment Pipeline & LLM Integration

- **EnrichmentService** (LLM-Powered Data Enhancement):
  - **Summary Enrichment**: GPT-4o-mini powered summary enhancement für bessere Klarheit
  - **Categories Enrichment**: Intelligente Kategorisierung mit standardisierten Tags
  - **Capabilities Enrichment**: Agent-Capability-Normalisierung und -Enhancement
  - **Domains Enrichment**: Business-Domain-Klassifikation mit Confidence-Scores
  - **Caching**: Content-Hash-basiertes Caching zur Kostenoptimierung
  - **Observability**: Umfassende Logs und Performance-Metriken

- **EnrichmentTriggerService** (Automatic Processing):
  - **First Import**: Automatische Enrichment bei neuen Solutions
  - **Admin Refresh**: Manuelle Enrichment-Trigger durch Administratoren
  - **Scheduled**: Periodische Enrichment für Datenfrische
  - **Error Handling**: Robuste Retry-Logik mit Exponential Backoff
  - **Queue Management**: Priority-basierte Verarbeitung mit Status-Tracking

### 5) Admin Workflows & Validation

- **AdminValidationQueue** (Unified Validation Interface):
  - **Setup Steps Validation**: LLM-extrahierte Implementierungsschritte validieren
  - **Domain Overrides**: Manuelle Domain-Klassifikation durch Administratoren
  - **Batch Operations**: Bulk-Validierung und -Approval von Enrichment-Ergebnissen
  - **Audit Trail**: Vollständige Nachverfolgung aller Admin-Aktionen

- **PilotFeedbackManagement** (User Feedback System):
  - **Feedback Capture**: Detaillierte Benutzer-Feedback zu generierten Setup-Steps
  - **Analytics Dashboard**: Aggregierte Feedback-Statistiken und Trends
  - **Session Tracking**: Benutzer-Session-Management für Feedback-Kontinuität
  - **Quality Metrics**: Feedback-basierte Qualitätsbewertung der Enrichment-Pipeline

### 6) Health Monitoring & Incremental Updates

- **AgentSourceHealthService** (Comprehensive Health Monitoring):
  - **HEAD/GET Health Pings**: Intelligente Health-Checks mit Fallback-Logik
  - **Data Size Validation**: Konfigurierbare Min/Max-Datenmengen-Validierung
  - **Response Analysis**: HTTP-Status-Codes, Response-Zeiten und Header-Analyse
  - **Retry Logic**: Exponential Backoff mit konfigurierbaren Retry-Versuchen

- **IncrementalUpdateScheduler** (Intelligent Update Management):
  - **Health-Based Scheduling**: Updates basierend auf Source-Health-Status
  - **Schedule Types**: Periodic, On-Demand und Health-Based Scheduling
  - **Concurrent Processing**: Parallele Update-Verarbeitung mit Limits
  - **Performance Tracking**: Detaillierte Performance-Metriken und Optimierung

### 7) Scoring & Recommendation Systems

- **Workflow Scoring System** (Numeric 0-100 Scores):
  - **Category Scoring**: Bewertung basierend auf Workflow-Kategorie und Relevanz
  - **Service Integration**: Scoring für verfügbare Service-Integrationen
  - **Trigger Analysis**: Bewertung der Trigger-Typen und -Komplexität
  - **Complexity Assessment**: Komplexitäts-basierte Scoring mit Anpassungen
  - **Data Quality**: Bewertung der Datenqualität und Vollständigkeit
  - **Popularity Metrics**: Popularitäts-basierte Scoring (Stars, Forks, Issues)
  - **Recency Factor**: Zeit-basierte Scoring für aktuelle Workflows

- **Agent Scoring System** (Tiered: Generalist | Specialist | Experimental):
  - **Capability Coverage**: Bewertung der Capability-Abdeckung
  - **Domain Alignment**: Domain-spezifische Bewertung und Ausrichtung
  - **Capability Depth**: Tiefe der verfügbaren Capabilities
  - **Domain Breadth**: Breite der unterstützten Business-Domains
  - **Data Quality**: Qualität der Agent-Metadaten und Beschreibungen
  - **Model Quality**: Bewertung des verwendeten AI-Modells
  - **Provider Reliability**: Bewertung der Provider-Zuverlässigkeit

- **Unified Recommendation Engine**:
  - **Context-Aware Scoring**: Scoring basierend auf User-Query und Business-Domain
  - **Hybrid Recommendations**: Kombinierte Workflow- und Agent-Empfehlungen
  - **Explainable Scores**: Detaillierte Score-Breakdowns mit Begründungen
  - **CTA Generation**: Intelligente Call-to-Action-Generierung basierend auf Scores

### 8) Database Schema & Migrations

- **Enhanced Cache Schema** (`workflow_cache`):
  - **Cache Versioning**: `admin_system_version` und `cache_type` für bessere Verwaltung
  - **Dual-Type Support**: Unterstützung für Workflow- und Agent-Caches
  - **Health Monitoring**: Cache-Health-Monitoring und -Optimierung
  - **Cleanup Functions**: Automatische Cleanup-Funktionen für alte Cache-Einträge

- **Enrichment Pipeline Tables**:
  - **`enrichment_cache`**: LLM-Enrichment-Ergebnisse mit Content-Hashing
  - **`enrichment_logs`**: Umfassende Enrichment-Aktivitäts-Logs
  - **`enrichment_triggers`**: Enrichment-Trigger-Queue und -Management
  - **Performance Indexes**: Optimierte Indizes für schnelle Abfragen

- **Admin System Tables**:
  - **`ontology_domains`**: Business-Domain-Ontologie mit 20 vordefinierten Domains
  - **`implementation_requests`**: User-Request-Funnel mit E-Mail-Integration
  - **`pilot_feedback`**: User-Feedback zu Implementierungsschritten (RLS aktiviert)
  - **`pilot_feedback_sessions`**: Session-Tracking (RLS aktiviert)
  - **`pilot_feedback`**: Umfassendes User-Feedback-System
  - **`pilot_feedback_sessions`**: Session-Management für Feedback-Kontinuität

- **Health Monitoring Tables**:
  - **`agent_sources`**: Agent-Source-Konfiguration und Health-Status
  - **`agent_source_health_checks`**: Detaillierte Health-Check-Ergebnisse
  - **`agent_source_update_schedule`**: Incremental-Update-Scheduling und -Tracking

### 9) Performance & Caching

- **Multi-Layer Caching**:
  - **Server-Cache**: Bevorzugte Cache-Ebene mit Versionierung
  - **Content-Hash Caching**: LLM-Enrichment-Ergebnisse mit Hash-basiertem Caching
  - **Health-Check Caching**: Cached Health-Check-Ergebnisse für Performance
  - **In-Memory Cache**: Schnelle Filter und Counts im Indexer

- **Optimized Data Flow**:
  - **Edge Functions**: CORS-sichere API-Calls für GitHub und n8n.io
  - **Bulk Operations**: Optimierte Bulk-Fetch-Operationen mit Fallback-Paginierung
  - **Concurrent Processing**: Parallele Verarbeitung mit konfigurierbaren Limits
  - **Timeout Management**: Intelligente Timeout-Behandlung und Recovery

### 10) Bekannte Einschränkungen / Offene Punkte

- **GitHub Rate Limits**: Token wird genutzt (Edge). Bei 403/Secondary Rate Limits ggf. Backoff erweitern.
- **LLM Cost Optimization**: Enrichment-Pipeline optimiert für Kosten-Effizienz mit Caching.
- **Health Monitoring**: Comprehensive Health-Checks implementiert mit automatischer Recovery.
- **Admin Workflows**: Vollständige Admin-Validierung und Feedback-Systeme implementiert.
- **Dual-Type Model**: Einheitliches SolutionIndex-Modell für Workflows und AI Agents.

### 11) Was ChatGPT mit diesem Kontext tun soll (Beispiele)

- **Enrichment Optimization**: Prompt-Vorschläge zur Verbesserung der LLM-Enrichment-Qualität.
- **Scoring Enhancement**: Verbesserung der Workflow- und Agent-Scoring-Algorithmen.
- **Health Monitoring**: Erweiterte Health-Check-Strategien und Recovery-Mechanismen.
- **Admin UX**: UI-Verbesserungen für Admin-Workflows und Validation-Interfaces.
- **Performance Optimization**: Caching-Strategien und Performance-Optimierungen.
- **Test Coverage**: Comprehensive Test-Pläne für alle neuen Features und Services.

### 12) Relevante Dateien (Dual-Type Model)

**Core Services:**
- `src/lib/workflowIndexer.ts` – Unified Solution Loading/Cache/Filter/Health/Union-Logic
- `src/lib/solutions/enrichmentService.ts` – LLM-Powered Data Enrichment Pipeline
- `src/lib/solutions/enrichmentTriggerService.ts` – Automatic Enrichment Trigger Management
- `src/lib/solutions/agentSourceHealthService.ts` – Comprehensive Health Monitoring
- `src/lib/solutions/incrementalUpdateScheduler.ts` – Intelligent Update Scheduling

**Admin Components:**
- `src/components/EnhancedSourcesManagement.tsx` – Per-Type Source Management
- `src/components/AdminValidationQueue.tsx` – Unified Validation Interface
- `src/components/PilotFeedbackManagement.tsx` – User Feedback System
- `src/components/ImplementationStepsManagement.tsx` – Setup Steps Management

**UI Components:**
- `src/components/TypeBadge.tsx` – Solution Type Indicators
- `src/components/CapabilityChips.tsx` – Agent Capability Display
- `src/components/DomainBadge.tsx` – Business Domain Classification
- `src/components/WorkflowScoreDisplay.tsx` – Workflow Scoring Visualization
- `src/components/AgentTierDisplay.tsx` – Agent Tier Visualization

**Database Migrations:**
- `supabase/migrations/20250128000007_consolidated_admin_system.sql` – Admin System Schema
- `supabase/migrations/20250128000008_update_cache_versioning.sql` – Enhanced Cache Versioning
- `supabase/migrations/20250128000009_enrichment_pipeline.sql` – Enrichment Pipeline Schema
- `supabase/migrations/20250128000010_agent_source_health_checks.sql` – Health Monitoring Schema

### 13) Quickstart für Dual-Type Model Tests

**Workflow Testing:**
1. Admin > Enhanced Sources > Workflow Sources öffnen
2. „Awesome n8n Templates" auswählen und „Refresh Source" klicken
3. `SolutionBrowser` mit `typeFilter=workflow` aufrufen
4. Workflow-Scoring und -Kategorisierung testen

**AI Agent Testing:**
1. Admin > Enhanced Sources > Agent Sources öffnen
2. „HuggingFace Spaces" auswählen und Health-Status prüfen
3. `SolutionBrowser` mit `typeFilter=agent` aufrufen
4. Agent-Tier-Bewertung und Capability-Chips testen

**Enrichment Pipeline Testing:**
1. Admin > Validation Queue öffnen
2. LLM-extrahierte Setup-Steps validieren
3. Domain-Overrides für Solutions testen
4. Enrichment-Statistiken und Performance-Metriken prüfen

**Health Monitoring Testing:**
1. Admin > Enhanced Sources > Health Status prüfen
2. Incremental Updates überwachen
3. Error-Recovery und Backoff-Mechanismen testen
4. Performance-Metriken und Cost-Analysis analysieren

---

## 🎉 Dual-Type Solution Model - Status Update

**Vollständig implementiert:**
- ✅ **Unified SolutionIndex Model** für Workflows und AI Agents
- ✅ **LLM-Powered Enrichment Pipeline** mit Caching und Observability
- ✅ **Comprehensive Health Monitoring** mit automatischer Recovery
- ✅ **Admin Validation Workflows** mit Feedback-Systemen
- ✅ **Advanced Scoring Systems** für Workflows und Agents
- ✅ **Enhanced Database Schema** mit Versionierung und Performance-Optimierung

**Neue Quellen hinzugefügt:**
- **Workflows**: `awesome-n8n-templates`, `ai-enhanced`
- **AI Agents**: `crewai`, `hf-spaces`, `github-agents`

**Referenzen:**
- Awesome n8n Templates: `https://github.com/enescingoz/awesome-n8n-templates`
- CrewAI Examples: `https://github.com/joaomdmoura/crewAI-examples`
- HuggingFace Spaces: `https://huggingface.co/spaces`


