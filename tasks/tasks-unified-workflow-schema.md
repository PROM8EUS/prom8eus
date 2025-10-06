# Task List: Unified Workflow Schema Migration

## Relevant Files

- `supabase/migrations/20250130000000_create_unified_workflows_table.sql` - New unified workflows table migration
- `supabase/migrations/20250130000001_migrate_existing_workflows.sql` - Migration script to convert existing data
- `src/lib/schemas/unifiedWorkflow.ts` - Updated UnifiedWorkflow schema definition
- `src/lib/workflowIndexer.ts` - Updated to use UnifiedWorkflow instead of WorkflowIndex (currently 6,183 lines - needs refactoring per global.mdc)
- `src/lib/n8nApi.ts` - Updated to return UnifiedWorkflow format (currently 1,409 lines - needs refactoring per global.mdc)
- `src/components/tabs/WorkflowTab.tsx` - Remove conversion logic, use UnifiedWorkflow directly, filter for AI-generated only (currently 392 lines - within limits)
- `src/components/UnifiedSolutionCard.tsx` - Update to accept UnifiedWorkflow directly
- `src/lib/types.ts` - Remove deprecated WorkflowSolution interface
- `supabase/functions/fetch-github-workflows/index.ts` - Update to use UnifiedWorkflow
- `supabase/functions/index-workflows/index.ts` - Update to work with new schema
- `src/lib/workflowIndexer.test.ts` - Unit tests for updated WorkflowIndexer
- `src/lib/schemas/unifiedWorkflow.test.ts` - Unit tests for UnifiedWorkflow schema
- `src/components/tabs/WorkflowTab.test.tsx` - Unit tests for updated WorkflowTab

### Notes

- **File Size Compliance:** `workflowIndexer.ts` (6,183 lines) and `n8nApi.ts` (1,409 lines) exceed global.mdc limits (500 lines max). These need refactoring into smaller modules.
- **Root Cause Fix:** This migration addresses the root cause of unnecessary conversions rather than adding workarounds.
- **Iterative Approach:** Modify existing working code rather than rewriting from scratch.
- **Testing First:** Write tests before implementing changes (TDD mindset).
- **AI Workflow Focus:** WorkflowTab should only display AI-generated workflows, not GitHub/n8n.io workflows.
- **Existing Infrastructure:** Leverage existing AI services (`aiAnalysis.ts`, `aiRerank.ts`, `runAnalysis.ts`) and workflow templates (`marketingWorkflows.ts`, `healthcareWorkflows.ts`).
- **No UI Changes:** Keep existing frontend components unchanged, only update data flow.
- Unit tests should be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests
- Migration will be done in stages with feature flags for gradual rollout
- Data loss is acceptable per requirements - focus on system stability over data preservation

## Tasks

- [ ] 1.0 Refactor Large Files (Per global.mdc compliance)
  - [ ] 1.1 Split `WorkflowIndexer` (6,183 lines) into smaller modules: `WorkflowIndexer`, `WorkflowCacheManager`, `WorkflowDataProcessor`
  - [ ] 1.2 Split `n8nApi.ts` (1,409 lines) into smaller modules: `N8nApi`, `N8nWorkflowParser`, `N8nDataMapper`
  - [ ] 1.3 Extract shared interfaces to `src/lib/schemas/` directory
  - [ ] 1.4 Create dedicated service classes for each concern (Single Responsibility Principle)
  - [ ] 1.5 Add dependency injection for better testability and modularity

- [ ] 2.0 Create Unified Workflow Database Schema
  - [ ] 2.1 Create new `unified_workflows` table with all UnifiedWorkflow fields
  - [ ] 2.2 Add proper indexes for performance (source, complexity, integrations, etc.)
  - [ ] 2.3 Set up Row Level Security (RLS) policies for the new table
  - [ ] 2.4 Add database functions for workflow operations (search, filter, etc.)
  - [ ] 2.5 Implement feature flags for gradual schema rollout

- [ ] 3.0 Update Workflow Import Pipeline
  - [ ] 3.1 Modify refactored `WorkflowIndexer` to use UnifiedWorkflow instead of WorkflowIndex
  - [ ] 3.2 Update GitHub workflow import to create UnifiedWorkflow objects directly
  - [ ] 3.3 Update n8n.io API integration to return UnifiedWorkflow format
  - [ ] 3.4 Update AI workflow generation to use UnifiedWorkflow schema
  - [ ] 3.5 Update Supabase Edge Functions to work with new schema
  - [ ] 3.6 Implement AI workflow generation based on context (replace mock data)
  - [ ] 3.7 Add workflow source filtering (AI-generated only for WorkflowTab)

- [ ] 4.0 Refactor Frontend Components
  - [ ] 4.1 Remove `convertToUnifiedSolution` function from WorkflowTab (root cause fix)
  - [ ] 4.2 Update UnifiedSolutionCard to accept UnifiedWorkflow directly
  - [ ] 4.3 Remove deprecated WorkflowSolution interface from types.ts
  - [ ] 4.4 Update all workflow-related components to use UnifiedWorkflow
  - [ ] 4.5 Remove unnecessary conversion logic throughout the codebase
  - [ ] 4.6 Implement workflow source filtering in WorkflowTab (AI-generated only)

- [ ] 5.0 Data Migration and Testing (TDD Approach)
  - [ ] 5.1 Write tests for data migration script before implementation
  - [ ] 5.2 Create migration script to convert existing `workflow_cache` data to new format
  - [ ] 5.3 Test migration with sample data (data loss acceptable per requirements)
  - [ ] 5.4 Update all unit tests to work with new schema
  - [ ] 5.5 Test workflow import pipeline with new schema
  - [ ] 5.6 Verify UI components work correctly with UnifiedWorkflow
  - [ ] 5.7 Test AI workflow generation and context-based filtering
  - [ ] 5.8 Test workflow source filtering functionality
  - [ ] 5.9 Verify WorkflowTab only displays AI-generated workflows

- [ ] 6.0 Performance Optimization and Cleanup
  - [ ] 6.1 Optimize database queries for the new schema
  - [ ] 6.2 Remove old workflow_cache table after successful migration
  - [ ] 6.3 Clean up deprecated code and interfaces
  - [ ] 6.4 Update documentation to reflect new unified schema
  - [ ] 6.5 Add monitoring for the new workflow system
  - [ ] 6.6 Clean up mock data generation (replace with real AI generation)

- [ ] 7.0 Rollback Strategy
  - [ ] 7.1 Create rollback procedures for each migration step
  - [ ] 7.2 Implement feature flag toggles for quick system reversion
  - [ ] 7.3 Document emergency rollback procedures
  - [ ] 7.4 Test rollback scenarios to ensure system stability
