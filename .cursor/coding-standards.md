# Coding Standards and Patterns

**Date**: January 2025  
**Status**: Active  
**Applies To**: All Prom8eus codebase development

## 🎯 Core Principles

1. **Simplicity Over Cleverness**: Choose simple, maintainable solutions
2. **Function Over Class**: Prefer functions unless classes provide clear benefits
3. **Explicit Over Implicit**: Clear, typed code over clever inference
4. **Tested Code**: All new features must have tests
5. **Documentation**: Complex logic must be documented

## 📁 File Organization Patterns

### Directory Structure
```
src/
  ├── components/          # React components
  │   ├── ui/             # Shadcn UI components  
  │   ├── tabs/           # Tab-specific components
  │   ├── archive/        # Archived components (not for use)
  │   └── __tests__/      # Component tests
  ├── lib/                # Business logic and utilities
  │   ├── analysis/       # Analysis pipeline modules
  │   ├── services/       # Service layer
  │   ├── schemas/        # Type definitions and schemas
  │   ├── interfaces/     # Shared interfaces
  │   ├── monitoring/     # Monitoring utilities
  │   ├── archive/        # Archived implementations (not for use)
  │   └── __tests__/      # Library tests
  ├── pages/              # Route pages
  ├── hooks/              # Custom React hooks
  └── types/              # Global type definitions
```

### File Naming Conventions

**Components**: 
- `PascalCase.tsx` for components
- Descriptive names: `TaskPanelSimplified.tsx` not `TaskPanel2.tsx`
- Append `Simplified` for simplified versions

**Libraries/Utils**:
- `camelCase.ts` for utilities
- `PascalCaseService.ts` for services  
- Descriptive names: `workflowGeneratorSimplified.ts` not `wfGen.ts`

**Tests**:
- `ComponentName.test.tsx` for component tests
- `fileName.test.ts` for library tests
- Co-locate tests with code when possible

**Interfaces**:
- Place shared interfaces in `lib/interfaces/`
- One interface file per domain (e.g., `workflowGenerator.ts`, `workflowIndexer.ts`)

## 🏗️ Component Architecture Patterns

### Use Simplified Components (Current Standard)

**✅ DO:**
```tsx
// Clean, focused component with clear responsibilities
export default function TaskPanelSimplified({ task, lang, isVisible }: Props) {
  // State management
  const [data, setData] = useState<Data | null>(null);
  
  // Data fetching via service layer
  useEffect(() => {
    taskDataService.fetchTaskData(task.id).then(setData);
  }, [task.id]);
  
  // Render
  return <div>{/* ... */}</div>;
}
```

**❌ DON'T:**
```tsx
// Avoid: Mixed concerns, client-side AI generation, complex caching
export default function OverEngineeredPanel({ task, lang }: Props) {
  const [data, setData] = useState(null);
  const [aiData, setAiData] = useState(null);
  
  // DON'T: Generate AI data in components
  useEffect(() => {
    generateWithAI(task).then(setAiData); // Move to server/service
  }, [task]);
  
  // DON'T: Complex caching logic in components
  localStorage.setItem('cache_' + task.id, JSON.stringify(data));
  
  return <div>{/* ... */}</div>;
}
```

### Component Responsibility Guidelines

**Components Should:**
- ✅ Manage local UI state
- ✅ Fetch data via service layer
- ✅ Handle user interactions
- ✅ Coordinate child components
- ✅ Be under 400 lines

**Components Should NOT:**
- ❌ Generate AI content directly
- ❌ Contain complex business logic
- ❌ Manage complex caching
- ❌ Mix multiple concerns
- ❌ Exceed 500 lines

## 🔧 Service Layer Patterns

### Use Service Classes for Complex Operations

**✅ DO:**
```typescript
// Clean service with single responsibility
class TaskDataService {
  async fetchTaskData(taskId: string): Promise<TaskData> {
    // Service logic here
  }
}

export const taskDataService = new TaskDataService();
```

**❌ DON'T:**
```typescript
// Avoid: Scattered utility functions without organization
export async function fetchTask1() { /* ... */ }
export async function fetchTask2() { /* ... */ }
export async function cacheTask() { /* ... */ }
export async function validateTask() { /* ... */ }
```

### Service Guidelines

- ✅ One service per domain (TaskDataService, WorkflowGenerator, etc.)
- ✅ Clear method names (`fetchTaskData` not `getData`)
- ✅ Proper error handling with try/catch
- ✅ Cache via dedicated cache services
- ✅ Feature toggle checks when appropriate

## 📝 Naming Conventions

### Components
- `TaskPanel` - Main component
- `TaskPanelSimplified` - Simplified version
- `SubtaskCard` - Reusable card component
- `UnifiedSolutionCard` - Domain-specific card

### Functions
- `generateWorkflow()` - Action/verb
- `getWorkflowById()` - Getter
- `clearWorkflowCache()` - Action
- `isWorkflowActive()` - Boolean check

### Variables
- `selectedSubtaskId` - Descriptive camelCase
- `isLoading` - Boolean with `is/has/should` prefix
- `workflowCount` - Clear, descriptive
- Avoid: `data`, `temp`, `x`, `i` (except in obvious loops)

### Constants
- `UPPERCASE_WITH_UNDERSCORES` for true constants
- `camelCase` for configuration objects
- Example: `DEFAULT_CONFIG`, `cacheManager`

## 🔍 TypeScript Patterns

### Always Use Explicit Types

**✅ DO:**
```typescript
interface TaskData {
  id: string;
  title: string;
  score: number;
}

async function fetchTask(id: string): Promise<TaskData> {
  // Implementation
}
```

**❌ DON'T:**
```typescript
// Avoid: Implicit any, unclear return types
async function fetchTask(id) {
  // What does this return? Unknown!
}
```

### TypeScript Configuration

**Current Standards** (enforced in tsconfig.json):
- ✅ `"strict": true` - Full strict mode enabled
- ✅ `"noImplicitAny": true` - No implicit any allowed
- ✅ `"strictNullChecks": true` - Null safety required
- ✅ `"noUnusedLocals": true` - No unused variables
- ✅ `"noUnusedParameters": true` - No unused parameters

### Type Safety Guidelines

- ✅ Explicitly type all function parameters
- ✅ Explicitly type all function return values
- ✅ Use interfaces for object shapes
- ✅ Use type guards for runtime checks
- ✅ Avoid `any` - use `unknown` if truly dynamic

## ⚠️ Error Handling Patterns

### Always Handle Errors Gracefully

**✅ DO:**
```typescript
try {
  const data = await fetchData();
  return { success: true, data };
} catch (error) {
  console.error('[ServiceName] Error description:', error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  };
}
```

**❌ DON'T:**
```typescript
// Avoid: Silent failures, uncaught errors
const data = await fetchData(); // Might throw!
```

### Error Logging Format

- Prefix with component/service: `[TaskDataService]`
- Include emoji for visibility: `❌`, `⚠️`, `✅`
- Include context: operation, parameters, error details

## 🧪 Testing Patterns

### Test File Organization
- Place tests in `__tests__/` subdirectories
- Name: `ComponentName.test.tsx` or `fileName.test.ts`
- Group related tests with `describe` blocks

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly with props', () => {
    // Arrange
    const props = { /* ... */ };
    
    // Act
    render(<Component {...props} />);
    
    // Assert
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

### Testing Requirements
- ✅ All new components must have tests
- ✅ All new services must have tests
- ✅ Test happy path and error cases
- ✅ Mock external dependencies

## 📦 Import Patterns

### Import Order
```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// 2. Internal libraries
import { taskDataService } from '@/lib/services/taskDataService';
import { DynamicSubtask } from '@/lib/types';

// 3. Relative imports
import SubtaskCard from './SubtaskCard';
```

### Use Aliases
- ✅ Use `@/` alias for src imports
- ✅ Example: `import { X } from '@/lib/utils'`
- ❌ Avoid: `import { X } from '../../../lib/utils'`

## 🎨 Code Style Patterns

### Prefer Function Components
```typescript
// ✅ DO: Function component
export default function MyComponent({ prop }: Props) {
  return <div>{prop}</div>;
}

// ❌ DON'T: Class component (unless needed)
export default class MyComponent extends React.Component {
  render() { return <div>{this.props.prop}</div>; }
}
```

### Prefer Functions Over Classes
```typescript
// ✅ DO: Simple functions
export async function generateWorkflow(request: Request): Promise<Result> {
  // Implementation
}

// ❌ DON'T: Unnecessary classes
export class WorkflowGenerator {
  async generate(request: Request): Promise<Result> {
    // Adds complexity without benefits
  }
}
```

### Keep Files Small
- **Target**: < 300 lines
- **Maximum**: 500 lines
- **If exceeding**: Split into multiple files with clear responsibilities

## 🔄 Feature Toggle Patterns

### Always Check Feature Toggles for New Features
```typescript
import { getFeatureToggleManager } from '@/lib/featureToggle';

const featureToggleManager = getFeatureToggleManager();
if (featureToggleManager.isEnabled('feature_name')) {
  // Feature logic
}
```

### Feature Toggle Guidelines
- ✅ Use for gradual rollouts
- ✅ Use for risky changes
- ✅ Document in environment-variables.md
- ❌ Don't use for permanent flags

## 💾 Caching Patterns

### Use Dedicated Cache Services

**✅ DO:**
```typescript
import { workflowCache } from '@/lib/services/simpleCache';

const cached = workflowCache.get(key);
if (cached) return cached;

const data = await fetchData();
workflowCache.set(key, data);
```

**❌ DON'T:**
```typescript
// Avoid: localStorage directly in components
const cached = localStorage.getItem('my_cache_key');
if (cached) return JSON.parse(cached);
```

### Caching Guidelines
- ✅ Use `simpleCache` service for client-side caching
- ✅ Use `analysisCacheService` for analysis data
- ✅ Set appropriate TTL values
- ✅ Clear caches on updates

## 📚 Documentation Patterns

### Inline Comments
```typescript
// ✅ DO: Explain WHY, not WHAT
// Use fallback if AI generation fails (timeout or error)
const result = aiResult || fallbackResult;

// ❌ DON'T: State the obvious
// Set result to aiResult or fallbackResult
const result = aiResult || fallbackResult;
```

### JSDoc for Public APIs
```typescript
/**
 * Generate workflow for a subtask
 * @param request - Workflow generation parameters
 * @param options - Optional configuration
 * @returns Promise resolving to workflow or error
 */
export async function generateWorkflow(
  request: WorkflowGenerationRequest,
  options?: WorkflowGenerationOptions
): Promise<WorkflowGenerationResult> {
  // Implementation
}
```

## 🚫 Anti-Patterns to Avoid

### Avoid Over-Engineering
- ❌ Don't create frameworks for single-use cases
- ❌ Don't add abstraction layers "for future flexibility"
- ❌ Don't use design patterns just because they exist
- ✅ Keep it simple, add complexity only when needed

### Avoid Premature Optimization
- ❌ Don't optimize before measuring
- ❌ Don't add caching without evidence it's needed
- ✅ Profile first, optimize second

### Avoid Code Duplication
- ❌ Don't copy-paste code blocks
- ✅ Extract common logic to shared utilities
- ✅ Use composition over duplication

## ✅ Code Review Checklist

Before submitting code, verify:
- [ ] TypeScript strict mode passes (zero errors)
- [ ] ESLint passes (zero warnings)
- [ ] All tests pass
- [ ] File is under 500 lines
- [ ] No TODO/FIXME without tracking issue
- [ ] Proper error handling
- [ ] Clear variable/function names
- [ ] Imports organized correctly
- [ ] Comments explain WHY, not WHAT
- [ ] Changes documented if needed

## 🔗 Related Documentation

- **TypeScript Config**: See `tsconfig.json` and `tsconfig.app.json`
- **ESLint Config**: See `eslint.config.js`
- **Feature Toggles**: See `docs/feature-toggles.md`
- **Testing**: See `vitest.config.ts`
- **Environment**: See `docs/environment-variables.md`
- **ADRs**: See `docs/adr-*.md` for architectural decisions

## 📋 Quick Reference

### Creating a New Component
1. Create file in `src/components/`
2. Use TypeScript with explicit types
3. Keep under 400 lines
4. Create test file `ComponentName.test.tsx`
5. Export as default

### Creating a New Service
1. Create file in `src/lib/services/`
2. Use class or functions based on complexity
3. Export singleton instance
4. Add comprehensive error handling
5. Create test file

### Creating a New Utility
1. Create file in `src/lib/`
2. Use pure functions when possible
3. Explicit types for all parameters/returns
4. Add JSDoc for public functions
5. Create test file

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: Development Team

