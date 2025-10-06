## Relevant Files

- `src/lib/runAnalysis.ts` - Current monolithic LLM analysis pipeline; split into focused modules.
- `src/lib/analysis/` (new) - Houses `jobParser.ts`, `taskClassifier.ts`, `subtaskAssembler.ts`, `analysisAggregator.ts` for a testable analysis flow.
- `src/lib/aiAnalysis.ts` - Duplicate analysis path; consolidate or remove in favor of the new pipeline.
- `src/components/TaskPanel.tsx` - Overloaded UI with client-side AI logic; slim down and rely on server-provided data.
- `src/components/TaskList.tsx` - Tightly coupled to TaskPanel; adapt to the new task data contracts.
- `src/lib/workflowGenerator.ts`, `src/lib/workflowGeneratorUnified.ts` - Over-engineered blueprint generation; simplify or make optional.
- `src/lib/workflowIndexerUnified.ts`, `src/lib/workflowCacheManager.ts` - Complex caching/feature-flag handling; reduce or disable.
- `supabase/functions/index-workflows-unified/index.ts` & `supabase/functions/fetch-github-workflows-unified/index.ts` - Server-side counterparts of the unified stack; assess necessity and trim if unused.
- `src/lib/featureFlags.ts` - Depends on non-existent Supabase RPCs; replace with a lightweight local configuration.
- `src/lib/config.ts` - Feature flags always resolve to `true`; fix defaults and align documentation.
- `package.json` & `scripts/` - Large set of training/test scripts; clean up and document what remains.
- `docs/unified-workflow-schema.md`, `tasks/tasks-unified-workflow-schema.md` - Unified stack documentation; update after refactoring decisions.

### Notes

- Cover each new analysis module with Vitest specs (`src/lib/analysis/__tests__`).
- Implement a lightweight feature-toggle helper (e.g., `src/lib/featureToggle.ts`) driven by `import.meta.env`.
- When removing scripts/dependencies, adjust CI workflows and the README accordingly.
- Keep the unified stack only if tied to concrete product goals; otherwise archive under `tasks/archived/`.
- Refactor incrementally: add tests, split modules, then retire legacy paths.

## Tasks

- [ ] 1.0 Modularise the analysis pipeline
  - [ ] 1.1 Break `runAnalysis.ts` into dedicated services (`analysis/jobParser`, `taskClassifier`, `roiAggregator`).
  - [ ] 1.2 Centralise shared types in `src/lib/types.ts` or a new `analysis/types.ts`.
  - [ ] 1.3 Remove or extract legacy fallback/logging blocks; add structured error handling.
  - [ ] 1.4 Create a Vitest suite for the pipeline (mock the LLM client).

- [ ] 2.0 Simplify the task detail UI
  - [ ] 2.1 Remove AI generation/matching logic from `TaskPanel.tsx`; fetch from server/edge layers instead.
  - [ ] 2.2 Revisit client-side subtask caching; persist through analysis results where needed.
  - [ ] 2.3 Clarify component responsibilities (`TaskPanel`, `SubtaskSidebar`, `ExpandedSolutionTabs`).
  - [ ] 2.4 Add UI tests/snapshots for the streamlined layout.

- [ ] 3.0 Clean up feature flags and configuration
  - [ ] 3.1 Drop Supabase RPC dependencies from `featureFlags.ts`; introduce local toggles/env flags.
  - [ ] 3.2 Fix `config.ts` defaults (no more `=== 'true' || true`) and back them with tests.
  - [ ] 3.3 Migrate consumers (e.g., workflow generators) to the new toggle helper.
  - [ ] 3.4 Update documentation for available flags (`docs/`, README).

- [ ] 4.0 Evaluate and slim down the unified workflow stack
  - [ ] 4.1 Audit usage of `workflowGenerator*`, `workflowIndexer*`, and related Supabase functions.
  - [ ] 4.2 Archive or gate unused modules behind feature toggles.
  - [ ] 4.3 Define clear interfaces and minimal caching for the pieces we keep.
  - [ ] 4.4 Refresh tests and docs (`docs/unified-workflow-schema.md`) to match the new scope.

- [ ] 5.0 Prune tooling and scripts
  - [ ] 5.1 Review `package.json` scripts; remove unused training/test commands or document them under `tasks/archived`.
  - [ ] 5.2 Consolidate dependency lists (especially overlapping OpenAI/n8n packages) and run security/bundle checks.
  - [ ] 5.3 Align CI/dev documentation (`README`, `WORKFLOW_EXAMPLES.md`) with the leaner setup.

- [ ] 6.0 Change management and communication
  - [ ] 6.1 Publish a migration guide for the team (short memo in `docs/` or `tasks/archived/`).
  - [ ] 6.2 Define the rollout plan for refactors (feature toggles, dark launch steps).
  - [ ] 6.3 Enable monitoring for refactored paths (logs/metrics covering analysis and marketplace flows).
