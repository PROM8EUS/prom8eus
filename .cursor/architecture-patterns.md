# Architecture Patterns - Prom8eus

**Date**: January 2025  
**Purpose**: Document architectural patterns and decisions for AI assistant guidance

## 🏛️ Current Architecture

### Component Architecture

**Simplified Component Pattern** (Active Standard)
- TaskPanelSimplified - Main container
- SubtaskSidebarSimplified - Navigation
- ExpandedSolutionTabsSimplified - Content display

**Characteristics**:
- Function-based components
- Service layer for data fetching
- Clear separation of concerns
- Under 400 lines per component

### Service Layer Architecture

**Pattern**: Singleton service instances
```typescript
class ServiceName {
  async method(): Promise<Result> { /* ... */ }
}
export const serviceName = new ServiceName();
```

**Active Services**:
- `taskDataService` - Task and subtask data
- `analysisCacheService` - Analysis caching
- `workflowCache`, `searchCache`, `statsCache` - Specialized caches

### Generator/Indexer Architecture

**Pattern**: Function-based with legacy compatibility
```typescript
// Modern interface
export async function generateWorkflow(request, options): Promise<Result>

// Legacy compatibility wrapper
export async function generateWorkflowFast(subtask, lang, variation): Promise<any>
```

**Active Implementations**:
- `workflowGeneratorSimplified.ts` - Single canonical generator
- `workflowIndexerSimplified.ts` - Single canonical indexer

## 📂 File Structure Conventions

### Component Files
```
src/components/
  ComponentName.tsx          # Main component
  ComponentNameSimplified.tsx # Simplified version (current standard)
  archive/                   # Archived old versions
    ComponentName.tsx.archived
```

### Library Files
```
src/lib/
  serviceNameSimplified.ts   # Current canonical implementations
  interfaces/                # Shared type definitions
    serviceName.ts
  archive/                   # Archived old implementations
    serviceName.ts.archived
```

## 🔄 Migration Pattern

When refactoring over-engineered code:
1. Create simplified version alongside existing
2. Add comprehensive tests to simplified version
3. Update production code to use simplified version
4. Archive old implementation (don't delete)
5. Document in archive README.md
6. Update imports throughout codebase
7. Update build configuration
8. Commit with detailed message

## 🎯 Design Decisions

### Prefer Simplification Over Abstraction
- Functions over classes (unless classes add clear value)
- Direct implementations over abstract factories
- Simple caching over complex cache strategies

### Prefer Backward Compatibility
- Add legacy wrapper functions when consolidating
- Maintain same function signatures when possible
- Allow gradual migration with feature toggles

### Prefer Explicit Over Implicit
- Explicit types over inference
- Explicit error handling over silent failures
- Explicit dependencies over global state

## 📝 Conventions Established

### Archived File Naming
- Original: `workflowGenerator.ts`
- Archived: `workflowGenerator.ts.archived`
- Location: `archive/` subdirectory
- Documentation: `archive/README.md` with metrics

### Feature Toggle Usage
```typescript
const featureToggleManager = getFeatureToggleManager();
if (featureToggleManager.isEnabled('feature_name')) {
  // New implementation
} else {
  // Fallback or disabled state
}
```

### Cache Key Patterns
- Format: `${domain}_${id}_${context}`
- Example: `workflows_${subtaskId}_de`
- Use base64 encoding for complex keys

## 🔧 Build Configuration

### Vite Manual Chunks
Organize by feature area:
```javascript
'workflow-features': [/* workflow related */],
'agent-features': [/* agent related */],
'cache-services': [/* caching utilities */]
```

Update when consolidating files:
- Change path to simplified version
- Remove references to archived files

## 🧹 Code Cleanup Pattern

### When Finding Duplicate Code
1. Audit all versions (document line counts)
2. Choose simplest as canonical
3. Port missing critical features
4. Update all imports (search codebase)
5. Test thoroughly
6. Archive old versions
7. Document reduction metrics

### Archive Documentation Template
```markdown
# Archived [Type] Files

## Archived Files
- `fileName.ts.archived` - Description (X lines)

## Replacement
- `../fileNameSimplified.ts` (Y lines)

## Code Reduction
- Before: X lines
- After: Y lines
- Reduction: Z% (X-Y lines removed)
```

## 🎯 Decision-Making Framework

### When to Simplify
- File exceeds 500 lines
- Duplicate functionality exists
- Class-based when functions would suffice
- Complex abstractions without clear benefits

### When to Keep as-Is
- Code is clean and under 400 lines
- Single responsibility is clear
- Well-tested and stable
- No duplicate implementations

### When to Refactor
- Multiple versions coexist
- Mixed concerns in single file
- Unclear responsibility
- Difficult to test

## 📊 Metrics to Track

### Code Quality Metrics
- Lines of code per file (target: < 300, max: 500)
- Number of responsibilities per component (target: 1-2)
- Test coverage (target: > 70% for critical paths)
- TypeScript errors (target: 0)
- ESLint warnings (target: 0)

### Architecture Metrics
- Number of duplicate implementations (target: 0)
- Circular dependencies (target: 0)
- Component complexity (target: simple)
- Service layer clarity (target: clear)

## 🔗 References

- **Coding Standards**: `.cursor/coding-standards.md`
- **Task List**: `../tasks/tasks-prd-codebase-stabilization-cleanup.md`
- **ADR-001**: `../docs/adr-001-codebase-stabilization-2025.md`
- **Migration Guide**: `../docs/overengineering-remediation-migration-guide.md`

---

**Maintained By**: Development Team  
**Last Updated**: January 2025

