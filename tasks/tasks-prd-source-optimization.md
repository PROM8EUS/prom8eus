## Relevant Files

- `src/lib/workflowIndexer.ts` - Ingestion, caching, normalization, health, unions (updated with unified schema)
- `supabase/functions/fetch-github-workflows/index.ts` - Edge ingest (GitHub, n8n.io)
- `supabase/functions/fetch-agent-catalogs/index.ts` - Edge ingest (CrewAI, HF Spaces)
- `supabase/functions/index-workflows/index.ts` - Feature/embedding pipeline (optional)
- `src/components/SourcesManagement.tsx` - Admin sources, refresh, analytics
- `src/components/WorkflowBrowser.tsx` - Browse solutions (filters, pagination)
- `src/types/solutions.ts` - Unified solution schema (workflow/agent)
- `src/components/SolutionCard.tsx` - Card UI (type badges, metadata)
- `src/components/SolutionDetailModal.tsx` - Detail view (prereqs, links)
- `src/components/CreatorBadge.tsx` - Avatar/Gravatar handling
- `src/lib/runAnalysis.ts`, `src/lib/aiAnalysis.ts` - LLM analysis/enrichment hooks
- `docs/stand-implementierung-loesungen-vorschlaege.md` - Implementation status
- `tasks/prd-source-optimization.md` - Source Optimization PRD (authoritative)
- `supabase/functions/fetch-agent-catalogs/index.test.js` - Quality filter unit tests

### Notes

- Co-locate unit tests where relevant (e.g., `*.test.ts[x]`).
- Edge functions can be tested with `supabase functions serve` and preview deploys.
- Keep enrichment idempotent and cache results; admin refresh may re-run selectively.

## Tasks

- [ ] 0.0 Analyze current implementation (sources, indexer, UI, Edge)
  - [x] 0.1 Inventory current sources and overrides (Admin UI/localStorage) and document
  - [x] 0.2 Trace ingestion paths in `workflowIndexer.ts` (n8n.io, GitHub, new agent sources)
  - [x] 0.3 Review server cache logic (union `all`, shards, versioning) and timeouts
  - [x] 0.4 Verify normalization vs `src/types/solutions.ts` for workflows and agents
  - [x] 0.5 Identify experimental or redundant code paths and debug logs to remove
  - [x] 0.6 Capture counts, health, and performance baselines; list gaps and quick fixes
  - [x] 0.7 Produce analysis notes in `docs/stand-implementierung-loesungen-vorschlaege.md`

- [ ] 1.0 Implement MVP agent ingestion (CrewAI examples, filtered HuggingFace Spaces)
  - [x] 1.1 Add agent source entries (CrewAI examples, HF Spaces) to Admin sources
  - [x] 1.2 Extend Edge ingest to fetch HF Spaces by tags (`agents`, `autonomous`, `crew`) with pagination
  - [x] 1.3 Parse README/metadata into minimal `AgentSolution` (id, source, title, summary, link)
  - [x] 1.4 Cache results in `workflow_cache` under `agent-<source>` namespace
  - [x] 1.5 Add health checks for agent sources (HEAD/GET, sanity size)

- [x] 2.0 Add quality filters for agent sources (stars, recency, forks/issues, contributors)
  - [x] 2.1 Implement filter: ≥5 stars OR updated ≤12 months OR ≥1 fork/open issue
  - [x] 2.2 Prefer projects with ≥2 contributors and activity signals (downloads/clones)
  - [x] 2.3 Unit tests for filter logic (edge cases, missing fields)

- [ ] 3.0 Unify solution schema with mandatory fields and license extraction
  - [x] 3.1 Ensure mandatory core fields: `id`, `source`, `title`, `summary`, `link`
  - [x] 3.2 Workflows: `category`, `integrations`, `complexity`; Agents: `model/provider`, `capabilities`
  - [x] 3.3 License extraction (GitHub API/README heuristics) with fallback `Unknown`
  - [x] 3.4 Add schema guards and normalize unknowns

- [ ] 4.0 Implement domain ontology mapping (20 domains) with LLM enrichment
  - [x] 4.1 Create `ontology_domains` table and seed 20 domains (+ fallback Other)
  - [x] 4.2 LLM prompt: return up to 3 domains with confidences, strict label set
  - [x] 4.3 Store `domains`, `domain_confidences`, `domain_origin`
  - [x] 4.4 Admin override UI and persistence; cache by (title+summary+source_id)

- [ ] 5.0 Standardize agent capability tags (web_search, data_analysis, file_io, email_send)
  - [x] 5.1 Define allowed capability tag set and mapping heuristics
  - [x] 5.2 Normalize during ingest/enrichment; display as chips

- [ ] 6.0 Update matching: workflows numeric score; agents tiered (Generalist/Specialist/Experimental)
  - [x] 6.1 Workflows: compute numeric score (category/service/trigger)
  - [x] 6.2 Agents: map to tier by capability+domain coverage with disclaimers
  - [x] 6.3 Expose reasoning chips in UI

- [ ] 7.0 Update UI cards: type badges, disclaimers, domain badges, tooltips
  - [x] 7.1 Add clear type badges (Workflow | Agent) with reliability/adaptive labels
  - [x] 7.2 Show top domain badge; others via tooltip/popover
  - [x] 7.3 Add disclaimer chip for agents ("Adaptive – outcomes may vary")

- [ ] 8.0 Expand detail modal: prerequisites, source link, trigger, setup effort
  - [x] 8.1 Ensure mandatory fields are present and localized
  - [x] 8.2 Optional: LLM step extraction (3–5 steps); admin validation workflow
  - [x] 8.3 Fallback when extraction fails (show mandatory fields only)

- [x] 9.0 Add implementation request funnel (form, email, DB logging in Supabase)
  - [x] 9.1 Create `implementation_requests` table (schema per PRD)
  - [x] 9.2 Build form (Name, Email, Company, tools, timeline, budget)
  - [x] 9.3 Attach task context + selected solution IDs to submission payload
  - [x] 9.4 Send email to service@prom8.eus and store in DB; auto-reply to user

- [x] 10.0 Extend Admin: per-type sources, minimal cache analytics, validation workflow
  - [x] 10.1 Show per-type counts, last updated, errors; refresh button
  - [x] 10.2 Admin validation queue for setup steps; domain override UI
  - [x] 10.3 Pilot feedback capture UI and storage

- [x] 11.0 Add pilot feedback capture in Admin for generated setup steps
  - [x] 11.1 Feedback model, storage, and linking to solution/version
  - [x] 11.2 Display in Admin for iteration decisions

- [x] 12.0 DB migrations: `ontology_domains`, `implementation_requests`, cache/version adjustments
  - [x] 12.1 Migration files with indexes; seed ontology
  - [x] 12.2 Update cache versioning where needed

- [x] 13.0 Enrichment pipeline: mandatory summary/categories; optional capabilities; caching
  - [x] 13.1 Trigger enrichment on first import and admin refresh
  - [x] 13.2 Cache by content hash; skip unchanged
  - [x] 13.3 Observability logs for enrichment results

- [x] 14.0 Health checks for agent sources and incremental update scheduling
  - [x] 14.1 Implement HEAD/GET health pings and data-size sanity checks
  - [x] 14.2 Schedule periodic checks; recovery with backoff

- [x] 15.0 Documentation: update status doc and README with dual-type model
  - [x] 15.1 Update `docs/stand-implementierung-loesungen-vorschlaege.md`
  - [x] 15.2 README additions for dual solutions & admin workflows

- [x] 16.0 Cleanup & consolidation
  - [x] 16.1 Remove deprecated/experimental code paths and dead feature flags
  - [x] 16.2 Delete excessive debug logs; unify naming and source keys
  - [x] 16.3 Migrate remaining TODOs into tasks; ensure lints/tests/build pass
  - [x] 16.4 Update docs to reflect final structure; archive obsolete notes
  - [x] 16.5 Final verification: sources load, matching works, UI labels consistent

## Remaining Work (Post-MVP)

- [ ] Create/verify `pilot_feedback` tables (+ RLS, indexes, grants)
- [ ] Implement real `get_pilot_feedback_analytics` (use sessions for completion rate)
- [ ] Align step extraction RPCs to accept JSONB; add grants
- [ ] Apply missing DB migrations in prod; verify schemas/functions
- [ ] Add error boundaries to Admin pages/components
- [ ] Add “Force-generate steps” button to seed validation queue
- [ ] Standardize TypeBadge/Badge variants and brand colors across views
- [ ] Reduce WorkflowIndexer console noise; add debug toggle
- [ ] Unit tests: analytics RPC + Select sentinel handling
- [ ] Docs/PRD sync: mark items done, document new RPCs



## Generated Task Plan (Phase 1 – Parent Tasks)

### Relevant Files

- `supabase/migrations/` – Database schema, RLS, indexes, function definitions.
- `supabase/functions/` – Edge/SQL functions for ingestion and analytics.
- `src/lib/solutions/pilotFeedbackService.ts` – Client for pilot feedback RPCs/queries.
- `src/components/PilotFeedbackManagement.tsx` – Admin UI to view analytics and feedback.
- `src/lib/solutions/stepExtractionService.ts` – Step extraction storage/RPC usage (JSONB alignment).
- `src/components/EnhancedSourcesManagement.tsx` – Admin sources view (controls/refresh).
- `src/components/ui/badge.tsx`, `src/components/TypeBadge.tsx` – Badge/TypeBadge standardization.
- `src/lib/workflowIndexer.ts` – Logging/noise reduction and debug toggle.
- `src/components/ui/select.tsx` – Select sentinel behavior validation.
- `docs/stand-implementierung-loesungen-vorschlaege.md` – Status documentation updates.

### Notes

- Follow security best practices (RLS + minimal grants) on new tables/functions.
- Keep migrations idempotent and safe for repeated application.
- Add unit tests alongside updated services/components where applicable.

## Tasks

- [ ] 1.0 Database: Pilot feedback schema and security
  - [x] 1.1 Create `pilot_feedback` table (columns per `PilotFeedback` interface; PK id UUID default, timestamps)
  - [x] 1.2 Create `pilot_feedback_sessions` table (session_id unique, started_at/completed_at, overall_rating, notes)
  - [x] 1.3 Indexes: `pilot_feedback(solution_id)`, `(created_at)`, `(feedback_type)`, `(rating)`; sessions `(solution_id)`, `(session_id unique)`
  - [x] 1.4 Enable RLS and add policies (read listing for admin app; insert from app; restrict updates/deletes)
  - [x] 1.5 Grants: `select/insert` for `authenticated`, restricted `select` for `anon` if needed; function execute for both
  - [ ] 1.6 Optional dev seed: insert a few sample rows guarded by environment

- [x] 2.0 Database: Pilot feedback analytics RPC (completion rate via sessions)
  - [x] 2.1 Implement `get_pilot_feedback_analytics(p_period text, p_solution_id text)` returning aggregated metrics
  - [x] 2.2 Compute `completion_rate` from `pilot_feedback_sessions` (completed/started per solution_id)
  - [x] 2.3 Support filters (solution_id optional) and sensible defaults when no data
  - [x] 2.4 Mark `stable`, set `security definer` if necessary, and add grants to `anon, authenticated`
  - [x] 2.5 Add idempotent migration; handle missing tables gracefully without errors

- [x] 3.0 Database: Step extraction RPC signatures (JSONB), grants
  - [x] 3.1 Update `store_implementation_steps(p_steps jsonb)` to iterate JSON array and persist rows
  - [x] 3.2 Update `get_or_create_step_extraction_cache(p_extracted_steps jsonb, p_extraction_metadata jsonb)`
  - [x] 3.3 Verify client calls send native JSON (no pre-stringify); adjust typings if needed
  - [x] 3.4 Grants for updated functions; regression test from browser path

- [ ] 4.0 Database: Apply missing migrations; verify schemas/functions across envs
  - [x] 4.1 Consolidate new migrations with idempotent guards (IF NOT EXISTS)
  - [x] 4.2 Apply locally; sanity queries for tables/functions and simple selects
  - [x] 4.3 Apply to production; verify RPC availability via Supabase logs/RPC calls
  - [x] 4.4 Document migration versions and rollback notes

- [ ] 5.0 Admin UI: Add error boundaries around Admin pages/components
  - [x] 5.1 Create `components/common/ErrorBoundary.tsx` with fallback UI + retry
  - [x] 5.2 Wrap `Admin`, `AdminLayout`, `EnhancedSourcesManagement`, `AdminValidationQueue`, `PilotFeedbackManagement`
  - [x] 5.3 Add minimal error logging hook to console and future sink

- [ ] 6.0 Admin UI: Add "Force‑generate steps" control to seed validation queue
  - [x] 6.1 Add button in `AdminValidationQueue` to trigger extraction for selected solution(s)
  - [x] 6.2 Call `StepExtractionDatabaseService.extractAndStoreSteps` with proper context
  - [x] 6.3 Show toast progress and refresh queue upon completion; debounce/rate-limit

- [ ] 7.0 UI: Standardize Badge/TypeBadge variants and brand colors across views
  - [x] 7.1 Audit `SolutionCard`, `SolutionsTab`, `TypeBadge`, `DomainBadge` for variant/color inconsistencies
  - [x] 7.2 Apply brand color usage consistently (avoid default blue per preference)
  - [x] 7.3 Ensure “Community” tag and outline styles are consistent

- [ ] 8.0 Indexer: Reduce WorkflowIndexer console noise; add debug toggle
  - [x] 8.1 Introduce `INDEXER_DEBUG` (env/localStorage) gate for verbose logs
  - [x] 8.2 Remove or gate noisy `console.log` lines; keep warnings/errors
  - [x] 8.3 Expose debug state in Admin sources header for quick toggle

- [ ] 9.0 Tests: Pilot analytics RPC + Select sentinel handling
  - [x] 9.1 Unit test `get_pilot_feedback_analytics` (grouping, zero-data behavior)
  - [x] 9.2 UI test for Select sentinel `__ALL__` to avoid empty value crash
  - [x] 9.3 Validate step extraction JSONB functions accept arrays from client
  - [x] 9.4 ErrorBoundary renders fallback on thrown child component

- [ ] 10.0 Docs: Sync PRD/Tasks; document new RPCs and policies
  - [x] 10.1 Update PRD to mark completed items and reference new DB objects
  - [x] 10.2 Add DB function/table docs (params, returns, policies)
  - [x] 10.3 Refresh `Relevant Files` and deploy steps
