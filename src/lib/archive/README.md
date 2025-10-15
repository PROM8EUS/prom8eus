# Archived Workflow Generator Files

This directory contains workflow generator files that have been consolidated as part of the codebase stabilization effort.

## Archived Files

- `workflowGenerator.ts.archived` - Original over-engineered generator (1,277 lines)
- `workflowGeneratorUnified.ts.archived` - Duplicate unified generator (473 lines)

## Replacement

Both files have been consolidated into:
- `../workflowGeneratorSimplified.ts` (238 lines + legacy compatibility functions)

## Key Features Preserved

- ✅ `generateWorkflowFast()` - Backward compatible wrapper
- ✅ `generateUnifiedWorkflow()` - Backward compatible wrapper  
- ✅ `generateMultipleUnifiedWorkflows()` - Backward compatible wrapper
- ✅ `clearAllWorkflowCaches()` - Enhanced localStorage clearing

## Migration Date

Archived: January 2025 (Codebase Stabilization Task 2.7)

## Code Reduction

- **Before**: 1,750 lines (1,277 + 473)
- **After**: 379 lines (238 + 141 legacy wrappers)
- **Reduction**: 78% code reduction (~1,371 lines removed)

## References

- Task List: `../../tasks/tasks-prd-codebase-stabilization-cleanup.md`
- PRD: `../../tasks/prd-codebase-stabilization-cleanup.md`
- Audit Report: `../../docs/workflow-generator-audit.md`
