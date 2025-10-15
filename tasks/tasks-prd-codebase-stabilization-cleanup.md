# Tasks: Codebase Stabilization and Cleanup

**Source**: `tasks/prd-codebase-stabilization-cleanup.md`  
**Status**: In Progress  
**Created**: January 2025

## Relevant Files

### Component Migration
- `src/components/TaskPanel.tsx` - Current production component (814 lines, to be replaced)
- `src/components/TaskPanelSimplified.tsx` - New simplified component (280 lines, to be activated)
- `src/components/TaskList.tsx` - Uses TaskPanel, needs update to use TaskPanelSimplified
- `src/components/SubtaskSidebar.tsx` - Old sidebar component
- `src/components/SubtaskSidebarSimplified.tsx` - New simplified sidebar
- `src/components/ExpandedSolutionTabs.tsx` - Old tabs component
- `src/components/ExpandedSolutionTabsSimplified.tsx` - New simplified tabs
- `test/components/TaskPanelSimplified.test.tsx` - Tests for simplified component
- `test/components/TaskPanelIntegration.test.tsx` - Integration tests

### Workflow Generator/Indexer Files
- `src/lib/workflowGenerator.ts` - Main generator (1,277 lines, over-engineered)
- `src/lib/workflowGeneratorUnified.ts` - Unified generator (473 lines, duplicate)
- `src/lib/workflowGeneratorSimplified.ts` - Simplified generator (238 lines, target)
- `src/lib/workflowIndexerUnified.ts` - Unified indexer (608 lines)
- `src/lib/workflowIndexerSimplified.ts` - Simplified indexer (target)
- `src/lib/interfaces/workflowGenerator.ts` - Interface definitions
- `src/lib/interfaces/workflowIndexer.ts` - Interface definitions
- `src/lib/__tests__/workflowGeneratorSimplified.test.ts` - Tests
- `src/lib/__tests__/workflowIndexerSimplified.test.ts` - Tests

### Files Using Workflow Generators
- `src/components/tabs/WorkflowTab.tsx` - Imports `clearAllWorkflowCaches`
- `src/components/TopSubtasksSection.tsx` - Imports `generateWorkflowFast`
- `src/components/TaskPanel.tsx` - Imports multiple functions

### Files Using Workflow Indexers
- `src/components/SolutionsTab.tsx` - Uses unified indexer
- `src/components/EnhancedSourcesManagement.tsx` - Uses unified indexer
- `vite.config.ts` - Build configuration with manual chunks

### TypeScript Configuration
- `tsconfig.json` - Root TypeScript config (weak settings to fix)
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node-specific TypeScript config

### Linting and Code Quality
- `eslint.config.js` - ESLint configuration (has disabled rules)
- `.gitignore` - Ignore patterns
- `package.json` - Dependencies and scripts

### Files with Technical Debt Markers
- `src/lib/services/taskDataService.ts` - 6 TODO/FIXME markers
- `src/components/ui/StatusBadge.tsx` - 3 markers
- `src/components/tabs/LLMTab.tsx` - 3 markers
- `src/components/tabs/AgentTab.tsx` - 3 markers
- `src/components/SolutionCard.tsx` - 2 markers
- `src/components/ExpandedSolutionTabsSimplified.tsx` - 2 markers
- `src/lib/n8nApi.ts` - 2 markers
- `src/lib/workflowDataProcessor.ts` - 1 marker
- `src/lib/workflowCacheManager.ts` - 1 marker
- `src/lib/types.ts` - 1 marker
- `src/types/solutions.ts` - 1 marker
- `src/pages/Results.tsx` - 1 marker
- `src/components/DomainBadge.tsx` - 1 marker

### Documentation Files
- `docs/overengineering-remediation-migration-guide.md` - Previous cleanup effort
- `docs/workflow-generator-audit.md` - Workflow code analysis
- `docs/team-memo-overengineering-remediation.md` - Team communication
- `docs/README.md` - Documentation index
- `README.md` - Main project README
- `.cursor/generate-tasks.md` - Task generation guidelines

### Test Files
- `test/lib/config.test.ts` - Config tests
- `test/lib/featureToggle.test.ts` - Feature toggle tests
- `test/setup.ts` - Test setup
- `vitest.config.ts` - Vitest configuration

### Notes

- This is a comprehensive codebase stabilization effort building on previous cleanup work
- Previous cleanup (documented in overengineering-remediation-migration-guide.md) was incomplete
- Simplified components exist but are not used in production
- Multiple duplicate implementations of workflow generators/indexers coexist
- TypeScript strict mode is disabled, reducing type safety
- 27 TODO/FIXME/DEPRECATED comments need resolution
- No breaking changes to user-facing functionality are allowed

## Tasks

- [x] 1.0 Complete Simplified Component Migration
  - [x] 1.1 Update TaskList.tsx to import TaskPanelSimplified instead of TaskPanel
  - [x] 1.2 Test TaskPanelSimplified integration in Results page
  - [x] 1.3 Verify all simplified component functionality works in production scenario
  - [x] 1.4 Update any other imports of old TaskPanel components
  - [x] 1.5 Archive or delete old TaskPanel.tsx, SubtaskSidebar.tsx, ExpandedSolutionTabs.tsx
  - [x] 1.6 Update component documentation to reflect active components
- [x] 2.0 Consolidate Workflow Generator Implementations
  - [x] 2.1 Audit features in workflowGenerator.ts, workflowGeneratorUnified.ts, workflowGeneratorSimplified.ts
  - [x] 2.2 Choose workflowGeneratorSimplified.ts as the canonical implementation
  - [x] 2.3 Port missing critical features from other generators to simplified version
  - [x] 2.4 Update all imports in components (TopSubtasksSection.tsx, WorkflowTab.tsx)
  - [x] 2.5 Update vite.config.ts build chunks to reference new consolidated file
  - [x] 2.6 Run comprehensive tests to ensure no functionality is lost
  - [x] 2.7 Archive old workflowGenerator.ts and workflowGeneratorUnified.ts files
- [x] 3.0 Consolidate Workflow Indexer Implementations
  - [x] 3.1 Audit features in workflowIndexerUnified.ts and workflowIndexerSimplified.ts
  - [x] 3.2 Choose canonical implementation (workflowIndexerSimplified.ts)
  - [x] 3.3 Port missing features to chosen implementation
  - [x] 3.4 Update imports in SolutionsTab.tsx, EnhancedSourcesManagement.tsx
  - [x] 3.5 Update vite.config.ts build configuration
  - [x] 3.6 Test all workflow indexing functionality
  - [x] 3.7 Archive old implementation files
- [ ] 4.0 Enable TypeScript Strict Mode
  - [ ] 4.1 Enable "noImplicitAny": true and fix all resulting errors
  - [ ] 4.2 Enable "strictNullChecks": true and fix null/undefined errors
  - [ ] 4.3 Enable "noUnusedLocals": true and remove unused variables
  - [ ] 4.4 Enable "noUnusedParameters": true and fix unused parameters
  - [ ] 4.5 Enable "strict": true and fix any remaining strict mode errors
  - [ ] 4.6 Run all tests to ensure no runtime regressions
- [ ] 5.0 Fix ESLint Configuration and Warnings
  - [ ] 5.1 Enable "@typescript-eslint/no-unused-vars": "warn" in eslint.config.js
  - [ ] 5.2 Fix all unused import warnings across the codebase
  - [ ] 5.3 Remove unused variables and parameters
  - [ ] 5.4 Configure additional helpful ESLint rules for code quality
  - [ ] 5.5 Update CI/CD to fail on linting errors (if applicable)
- [ ] 6.0 Resolve All Technical Debt Markers
  - [ ] 6.1 Audit all 27 TODO/FIXME/DEPRECATED comments in identified files
  - [ ] 6.2 Resolve issues in src/lib/services/taskDataService.ts (6 markers)
  - [ ] 6.3 Resolve issues in src/components/ui/StatusBadge.tsx (3 markers)
  - [ ] 6.4 Resolve issues in src/components/tabs/LLMTab.tsx (3 markers)
  - [ ] 6.5 Resolve issues in src/components/tabs/AgentTab.tsx (3 markers)
  - [ ] 6.6 Resolve remaining markers in other 9 files
  - [ ] 6.7 Create GitHub issues for any deferred items with proper tracking
- [ ] 7.0 Clean Up Deprecated Files and Code
  - [ ] 7.1 Verify src/lib/interfaces/workflowIndexer.ts is safe to remove
  - [ ] 7.2 Remove or properly archive deprecated interface files
  - [ ] 7.3 Update any remaining imports that reference removed files
  - [ ] 7.4 Remove any other deprecated code marked in audit
  - [ ] 7.5 Update import statements throughout codebase
- [ ] 8.0 Optimize Dependencies and Build Configuration
  - [ ] 8.1 Run dependency analysis to identify unused packages
  - [ ] 8.2 Remove unused dependencies from package.json
  - [ ] 8.3 Update vite.config.ts manual chunks after consolidation
  - [ ] 8.4 Test build process works correctly after changes
  - [ ] 8.5 Document bundle size improvements
- [ ] 9.0 Update Documentation
  - [ ] 9.1 Update README.md to reflect current architecture state
  - [ ] 9.2 Mark overengineering-remediation-migration-guide.md as fully complete
  - [ ] 9.3 Update workflow-generator-audit.md with final consolidated state
  - [ ] 9.4 Create architecture decision records (ADRs) for key consolidation choices
  - [ ] 9.5 Update component documentation in docs/
- [ ] 10.0 Establish Coding Standards and Patterns
  - [ ] 10.1 Document naming conventions for components and utilities
  - [ ] 10.2 Document file organization patterns
  - [ ] 10.3 Document component architecture patterns (simplified components)
  - [ ] 10.4 Document error handling and logging patterns
  - [ ] 10.5 Create .cursor/ documentation for AI assistant guidance
  - [ ] 10.6 Document testing patterns and requirements

