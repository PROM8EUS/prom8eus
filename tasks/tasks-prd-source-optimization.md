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


