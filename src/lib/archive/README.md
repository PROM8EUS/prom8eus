# Archived Workflow Files

This directory contains workflow generator and indexer files that have been consolidated as part of the codebase stabilization effort.

## Archived Workflow Generator Files

- `workflowGenerator.ts.archived` - Original over-engineered generator (1,277 lines)
- `workflowGeneratorUnified.ts.archived` - Duplicate unified generator (473 lines)

### Replacement
Both files have been consolidated into:
- `../workflowGeneratorSimplified.ts` (379 lines including legacy compatibility)

### Key Features Preserved
- ✅ `generateWorkflowFast()` - Backward compatible wrapper
- ✅ `generateUnifiedWorkflow()` - Backward compatible wrapper  
- ✅ `generateMultipleUnifiedWorkflows()` - Backward compatible wrapper
- ✅ `clearAllWorkflowCaches()` - Enhanced localStorage clearing

### Code Reduction
- **Before**: 1,750 lines (1,277 + 473)
- **After**: 379 lines (238 + 141 legacy wrappers)
- **Reduction**: 78% code reduction (~1,371 lines removed)

## Archived Workflow Indexer Files

- `workflowIndexerUnified.ts.archived` - Over-engineered unified indexer (608 lines)

### Replacement
Consolidated into:
- `../workflowIndexerSimplified.ts` (420 lines with all features)

### Key Features Preserved
- ✅ `search()` - Workflow search with caching
- ✅ `refresh()` - Workflow data refresh
- ✅ `getStats()` - Indexer statistics
- ✅ `getWorkflowById()` - Fetch individual workflows
- ✅ `createAIGeneratedWorkflow()` - AI workflow creation

### Code Reduction
- **Before**: 608 lines
- **After**: 420 lines
- **Reduction**: 31% code reduction (~188 lines removed)

## Total Code Reduction

- **Workflow Generators**: 1,371 lines removed (78% reduction)
- **Workflow Indexers**: 188 lines removed (31% reduction)
- **Total**: 1,559 lines removed (66% overall reduction)

## Migration Dates

- Workflow Generators: January 2025 (Task 2.7)
- Workflow Indexers: January 2025 (Task 3.7)

## References

- Task List: `../../tasks/tasks-prd-codebase-stabilization-cleanup.md`
- PRD: `../../tasks/prd-codebase-stabilization-cleanup.md`
- Audit Report: `../../docs/workflow-generator-audit.md`
