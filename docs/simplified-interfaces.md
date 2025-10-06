# Simplified Interfaces Documentation

## Overview

This document describes the new simplified interfaces and minimal caching system for the workflow generator and indexer modules. These interfaces provide clear, minimal APIs that reduce complexity while maintaining functionality.

## Architecture

### Core Principles

1. **Clear Interfaces**: Well-defined, minimal interfaces for all operations
2. **Simple Caching**: Lightweight, efficient caching with clear statistics
3. **Feature Toggle Integration**: All functionality gated behind feature toggles
4. **Error Handling**: Consistent error handling and fallback mechanisms
5. **Performance**: Optimized for speed and memory usage

## Workflow Generator Interfaces

### Core Interfaces

#### `WorkflowGenerationRequest`
```typescript
interface WorkflowGenerationRequest {
  subtask: DynamicSubtask;
  lang?: 'de' | 'en';
  timeoutMs?: number;
  context?: WorkflowCreationContext;
}
```

#### `WorkflowGenerationResult`
```typescript
interface WorkflowGenerationResult {
  workflow?: UnifiedWorkflow;
  error?: string;
  metadata?: {
    generatedAt: string;
    source: 'ai' | 'cache' | 'fallback';
    processingTimeMs: number;
  };
}
```

#### `MultipleWorkflowGenerationRequest`
```typescript
interface MultipleWorkflowGenerationRequest {
  subtask: DynamicSubtask;
  count: number;
  lang?: 'de' | 'en';
  timeoutMs?: number;
  context?: WorkflowCreationContext;
}
```

#### `MultipleWorkflowGenerationResult`
```typescript
interface MultipleWorkflowGenerationResult {
  workflows: UnifiedWorkflow[];
  errors: string[];
  metadata?: {
    generatedAt: string;
    totalProcessingTimeMs: number;
    successCount: number;
    errorCount: number;
  };
}
```

### Usage Examples

#### Single Workflow Generation
```typescript
import { generateWorkflow } from '@/lib/workflowGeneratorSimplified';

const result = await generateWorkflow({
  subtask: {
    id: 'task-1',
    title: 'Data Processing',
    description: 'Process incoming data',
    automationPotential: 85
  },
  lang: 'en',
  timeoutMs: 10000
}, {
  useCache: true,
  useFallback: true,
  maxRetries: 3
});

if (result.workflow) {
  console.log('Generated workflow:', result.workflow.title);
} else {
  console.error('Generation failed:', result.error);
}
```

#### Multiple Workflow Generation
```typescript
import { generateMultipleWorkflows } from '@/lib/workflowGeneratorSimplified';

const result = await generateMultipleWorkflows({
  subtask: {
    id: 'task-1',
    title: 'Data Processing',
    description: 'Process incoming data',
    automationPotential: 85
  },
  count: 3,
  lang: 'en'
});

console.log(`Generated ${result.workflows.length} workflows`);
console.log(`Errors: ${result.errors.length}`);
```

## Workflow Indexer Interfaces

### Core Interfaces

#### `WorkflowSearchParams`
```typescript
interface WorkflowSearchParams {
  q?: string;
  source?: string | string[];
  category?: string | string[];
  complexity?: 'low' | 'medium' | 'high' | string[];
  trigger_type?: string | string[];
  limit?: number;
  offset?: number;
  sort_by?: 'relevance' | 'created_at' | 'downloads' | 'rating';
  sort_order?: 'asc' | 'desc';
}
```

#### `WorkflowSearchResult`
```typescript
interface WorkflowSearchResult {
  workflows: UnifiedWorkflow[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  metadata?: {
    searchTimeMs: number;
    cacheHit: boolean;
    filters: Record<string, any>;
  };
}
```

#### `WorkflowIndexerStats`
```typescript
interface WorkflowIndexerStats {
  totalWorkflows: number;
  activeWorkflows: number;
  sources: WorkflowSource[];
  cacheStats: {
    size: number;
    hitRate: number;
    totalRequests: number;
  };
  lastUpdated: string;
}
```

### Usage Examples

#### Search Workflows
```typescript
import { simplifiedWorkflowIndexer } from '@/lib/workflowIndexerSimplified';

const result = await simplifiedWorkflowIndexer.search({
  q: 'data processing',
  source: ['github', 'n8n.io'],
  complexity: ['medium', 'high'],
  limit: 20,
  sort_by: 'relevance'
});

console.log(`Found ${result.total} workflows`);
console.log(`Page ${result.page} of ${Math.ceil(result.total / result.pageSize)}`);
```

#### Get Statistics
```typescript
import { simplifiedWorkflowIndexer } from '@/lib/workflowIndexerSimplified';

const stats = await simplifiedWorkflowIndexer.getStats();
console.log(`Total workflows: ${stats.totalWorkflows}`);
console.log(`Active workflows: ${stats.activeWorkflows}`);
console.log(`Cache hit rate: ${(stats.cacheStats.hitRate * 100).toFixed(1)}%`);
```

#### Refresh Workflows
```typescript
import { simplifiedWorkflowIndexer } from '@/lib/workflowIndexerSimplified';

const result = await simplifiedWorkflowIndexer.refresh({
  sourceId: 'github',
  force: true,
  incremental: false
});

console.log(`Added: ${result.workflowsAdded}`);
console.log(`Updated: ${result.workflowsUpdated}`);
console.log(`Removed: ${result.workflowsRemoved}`);
```

## Simple Cache System

### Core Features

- **Lightweight**: Minimal memory footprint
- **TTL Support**: Configurable time-to-live for entries
- **LRU Eviction**: Automatic cleanup when cache is full
- **Statistics**: Built-in hit rate and performance metrics
- **Pattern Clearing**: Clear entries matching patterns

### Usage Examples

#### Basic Cache Operations
```typescript
import { workflowCache } from '@/lib/services/simpleCache';

// Set data
workflowCache.set('key1', { id: '1', title: 'Workflow 1' }, 60000); // 1 minute TTL

// Get data
const data = workflowCache.get('key1');
if (data) {
  console.log('Cache hit:', data.title);
} else {
  console.log('Cache miss');
}

// Check if exists
if (workflowCache.has('key1')) {
  console.log('Key exists');
}

// Get statistics
const stats = workflowCache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Total requests: ${stats.totalRequests}`);
```

#### Cache Management
```typescript
import { workflowCache } from '@/lib/services/simpleCache';

// Clear all
workflowCache.clear();

// Clear by pattern
workflowCache.clearPattern('task-.*');

// Get all keys
const keys = workflowCache.keys();
console.log('Cache keys:', keys);

// Get cache size
const size = workflowCache.size();
console.log(`Cache size: ${size} entries`);
```

## Configuration

### Workflow Generator Configuration
```typescript
interface WorkflowGenerationOptions {
  useCache?: boolean;        // Enable/disable caching
  useFallback?: boolean;     // Enable/disable fallback generation
  maxRetries?: number;       // Maximum retry attempts
  timeoutMs?: number;        // Request timeout
}
```

### Workflow Indexer Configuration
```typescript
interface WorkflowIndexerConfig {
  cacheEnabled: boolean;     // Enable/disable caching
  cacheTTLMs: number;        // Cache time-to-live
  maxCacheSize: number;      // Maximum cache entries
  refreshIntervalMs: number; // Auto-refresh interval
  batchSize: number;         // Batch processing size
  retryAttempts: number;     // Retry attempts
  timeoutMs: number;         // Request timeout
}
```

## Feature Toggle Integration

All functionality is gated behind feature toggles:

### Workflow Generation
- `unified_workflow_read`: Enable workflow reading
- `unified_workflow_ai_generation`: Enable AI generation
- `unified_workflow_generator`: Enable unified generator (experimental)

### Workflow Indexing
- `unified_workflow_read`: Enable workflow reading
- `unified_workflow_write`: Enable workflow writing
- `unified_workflow_search`: Enable workflow search

### Example
```typescript
import { getFeatureToggleManager } from '@/lib/featureToggle';

const manager = getFeatureToggleManager();
if (manager.isEnabled('unified_workflow_ai_generation')) {
  // AI generation is enabled
  const result = await generateWorkflow(request);
} else {
  // AI generation is disabled, use fallback
  const result = await generateSimpleWorkflow(request);
}
```

## Migration Guide

### From Old Interfaces

#### Old Workflow Generator
```typescript
// Old way
const blueprint = await generateWorkflowFast(subtask, lang);

// New way
const result = await generateWorkflow({
  subtask,
  lang,
  timeoutMs: 10000
}, {
  useCache: true,
  useFallback: true
});
```

#### Old Workflow Indexer
```typescript
// Old way
const workflows = await unifiedWorkflowIndexer.searchWorkflows(params);

// New way
const result = await simplifiedWorkflowIndexer.search(params);
```

### Benefits of Migration

1. **Clearer APIs**: Well-defined interfaces with consistent error handling
2. **Better Performance**: Optimized caching and reduced complexity
3. **Feature Toggle Integration**: All functionality can be controlled via toggles
4. **Easier Testing**: Simple interfaces are easier to mock and test
5. **Better Documentation**: Clear interfaces serve as documentation

## Performance Considerations

### Caching Strategy
- **Workflow Cache**: 10-minute TTL, 50 entries max
- **Search Cache**: 5-minute TTL, 100 entries max
- **Stats Cache**: 2-minute TTL, 20 entries max

### Memory Usage
- **Simple Cache**: ~1KB per entry
- **Total Memory**: ~200KB for all caches combined
- **Automatic Cleanup**: LRU eviction when limits reached

### Network Optimization
- **Batch Operations**: Multiple workflows in single request
- **Incremental Updates**: Only fetch changed data
- **Smart Caching**: Cache frequently accessed data

## Error Handling

### Consistent Error Format
```typescript
interface ErrorResult {
  error: string;
  metadata?: {
    generatedAt: string;
    source: 'ai' | 'cache' | 'fallback';
    processingTimeMs: number;
  };
}
```

### Fallback Mechanisms
1. **Cache Miss**: Try AI generation
2. **AI Failure**: Use simple generation
3. **Simple Failure**: Return error with metadata
4. **Network Error**: Use cached data if available

## Testing

### Unit Tests
```typescript
import { generateWorkflow } from '@/lib/workflowGeneratorSimplified';

describe('Workflow Generator', () => {
  it('should generate workflow successfully', async () => {
    const result = await generateWorkflow({
      subtask: mockSubtask,
      lang: 'en'
    });
    
    expect(result.workflow).toBeDefined();
    expect(result.metadata?.source).toBe('ai');
  });
});
```

### Integration Tests
```typescript
import { simplifiedWorkflowIndexer } from '@/lib/workflowIndexerSimplified';

describe('Workflow Indexer', () => {
  it('should search workflows', async () => {
    const result = await simplifiedWorkflowIndexer.search({
      q: 'test',
      limit: 10
    });
    
    expect(result.workflows).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});
```

## Conclusion

The simplified interfaces provide a clean, efficient foundation for workflow generation and indexing. They reduce complexity while maintaining functionality, making the system easier to understand, test, and maintain.

Key benefits:
- **Reduced Complexity**: Clear, minimal interfaces
- **Better Performance**: Optimized caching and operations
- **Feature Toggle Integration**: Full control over functionality
- **Consistent Error Handling**: Predictable error responses
- **Easy Testing**: Simple interfaces for unit and integration tests
