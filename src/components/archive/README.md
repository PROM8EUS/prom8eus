# Archived Components

This directory contains components that have been replaced with simplified versions as part of the codebase stabilization effort.

## Archived Files

- `TaskPanel.tsx.archived` - Original TaskPanel component (814 lines, over-engineered)
- `SubtaskSidebar.tsx.archived` - Original SubtaskSidebar component
- `ExpandedSolutionTabs.tsx.archived` - Original ExpandedSolutionTabs component

## Replacements

These components have been replaced by simplified versions:

- `TaskPanel.tsx` → `TaskPanelSimplified.tsx` (280 lines, simplified)
- `SubtaskSidebar.tsx` → `SubtaskSidebarSimplified.tsx` 
- `ExpandedSolutionTabs.tsx` → `ExpandedSolutionTabsSimplified.tsx`

## Migration Date

Archived: January 2025 (Codebase Stabilization Task 1.5)

## Why Archived

- Over-engineered components with mixed responsibilities
- Client-side AI generation logic (moved to server-side)
- Complex caching mechanisms (simplified)
- No longer used in production after migration to simplified versions

## References

- Task List: `tasks/tasks-prd-codebase-stabilization-cleanup.md`
- PRD: `tasks/prd-codebase-stabilization-cleanup.md`
- Migration Guide: `docs/overengineering-remediation-migration-guide.md`
