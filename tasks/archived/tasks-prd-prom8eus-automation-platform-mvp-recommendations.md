## Relevant Files

- `supabase/functions/recommend-workflows/index.ts` — Edge Function: build profile → retrieve → rerank → diversify. Returns 6 results with reasons.
- `supabase/functions/index-workflows/index.ts` — Edge Function: normalize fields and compute embeddings in batches.
- `supabase/migrations/*_recommendations.sql` — Tables: `workflow_features`, `workflow_embeddings`, optional `recommendation_cache`.
- `src/lib/recommendations/client.ts` — Client wrapper to call `recommend-workflows`.
- `src/types/recommendations.ts` — Types for ProblemProfile, Candidate, Recommendation, Reason.
- `src/lib/recommendations/normalize.ts` — Normalize integration/trigger names with synonyms.
- `src/components/SolutionsTab.tsx` — Call Edge Function and render reasons; remove ad‑hoc filtering.
- `src/components/SolutionDetailModal.tsx` — Show reason badges.
- `docs/recommendations-mvp.md` — Design, API, and tuning notes.

### Notes

- Server-side by default (Edge Functions) for secure keys, consistent quality, and caching. Heuristic fallback remains if LLM unavailable.

## Tasks

- [x] 1.0 Database & schema
  - [x] 1.1 Create `workflow_features` (workflow_id, source, integrations_norm text[], triggers_norm text[], complexity_band text, author_verified bool, rating float, quality_prior float, updated_at timestamptz)
  - [x] 1.2 Create `workflow_embeddings` (workflow_id, source, embedding vector(1536|3072), updated_at)
  - [x] 1.3 (Optional) `recommendation_cache` (request_hash text pk, profile jsonb, results jsonb, ttl timestamptz)

- [x] 2.0 Edge Function: index-workflows
  - [x] 2.1 Read per-source caches from `workflow_cache` (handle shards)
  - [x] 2.2 Normalize integrations/triggers/complexity; compute `quality_prior`
  - [x] 2.3 Generate OpenAI embeddings for `name + description + tags` (batch ≤ 100); upsert features + embeddings (≤ 1.5k rows per upsert)
  - [x] 2.4 Idempotent; can be run on demand from admin

- [x] 3.0 Edge Function: recommend-workflows
  - [x] 3.1 Build `ProblemProfile` from task, subtasks, selected apps using `gpt-4o-mini` JSON (timeout + deterministic fallback)
  - [x] 3.2 Hybrid retrieval: SQL filters (must-have integrations/trigger) + pgvector similarity (top 800)
  - [x] 3.3 Heuristic scoring: 0.5 integrationOverlap (must-have×2) + 0.2 triggerMatch + 0.15 semantic + 0.1 complexityFit + 0.05 qualityPrior
  - [x] 3.4 (Toggle) LLM rerank of top 40 → merge scores
  - [x] 3.5 Coverage-first + MMR diversification → final 6; include compact reasons
  - [x] 3.6 Cache by request hash in `recommendation_cache` (TTL 30–120 min)

- [x] 4.0 Client integration
  - [x] 4.1 `src/lib/recommendations/client.ts` to call function; expose `recommendWorkflows(input)`
  - [x] 4.2 Replace `SolutionsTab` logic with single call; display short reasons on cards and in details
  - [x] 4.3 Config flags in `src/lib/config.ts`: enableLLM, topK, llmTimeoutMs

- [x] 5.0 Observability & resilience
  - [x] 5.1 Structured logs (duration, candidate counts, cache hit) in Edge Functions
  - [x] 5.2 Graceful fallbacks when LLM/pgvector unavailable (return heuristic top 6)

- [x] 6.0 Docs & admin
  - [x] 6.1 `docs/recommendations-mvp.md` covering API, scoring, and tuning
  - [x] 6.2 Admin button to trigger `index-workflows` and show counts per source

### Acceptance Criteria

- For any task with subtasks, the system returns up to 6 workflows with clear reasons in <1.5s (warm cache).
- Results reflect required integrations/trigger and cover multiple subtasks.
- Works with LLM disabled (heuristic only) and with LLM enabled (slightly better ordering).


