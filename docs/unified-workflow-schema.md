# Unified Workflow Schema Documentation

## Overview

The Unified Workflow Schema is a **simplified, streamlined** data model that consolidates all workflow types (GitHub, n8n.io, AI-generated) into a single, consistent structure. This schema eliminates data inconsistencies, reduces conversion overhead, and provides **clear, minimal interfaces** for workflow management.

> **Note**: This documentation has been updated to reflect the new simplified architecture with clear interfaces and minimal caching as part of the over-engineering remediation effort.

## Schema Architecture

### Core Tables

#### `unified_workflows`
The main table storing all workflow data with a comprehensive schema:

```sql
CREATE TABLE unified_workflows (
  -- Core identification
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  summary TEXT,
  
  -- Source and metadata
  source source_type NOT NULL,
  source_url TEXT,
  source_metadata JSONB,
  
  -- Workflow specifications
  category TEXT,
  tags TEXT[],
  complexity complexity_type,
  trigger_type trigger_type,
  integrations TEXT[],
  
  -- Technical details
  n8n_workflow JSONB,
  github_workflow JSONB,
  ai_prompt TEXT,
  ai_context JSONB,
  
  -- Author and creation
  author JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status and validation
  status workflow_status DEFAULT 'active',
  active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  validation_errors TEXT[],
  
  -- Business metrics
  rating DECIMAL(3,2),
  downloads INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  setup_cost DECIMAL(10,2),
  estimated_time TEXT,
  
  -- Domain classification
  domain_primary TEXT,
  domain_secondary TEXT[],
  domain_confidence DECIMAL(3,2),
  
  -- Scoring and matching
  score_overall DECIMAL(5,2),
  match_score DECIMAL(5,2),
  time_savings INTEGER,
  
  -- UI and display
  display_order INTEGER,
  featured BOOLEAN DEFAULT false,
  showcase BOOLEAN DEFAULT false,
  
  -- Caching and optimization
  cache_key TEXT,
  cache_version TEXT,
  last_accessed TIMESTAMPTZ,
  
  -- AI-specific fields
  is_ai_generated BOOLEAN DEFAULT false,
  generation_metadata JSONB,
  ai_model TEXT,
  generation_context JSONB
);
```

#### `feature_flags`
Manages feature flags for gradual rollout:

```sql
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  environment TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, environment)
);
```

### Enums

```sql
-- Source types
CREATE TYPE source_type AS ENUM (
  'github',
  'n8n.io', 
  'ai-generated',
  'manual',
  'imported'
);

-- Complexity levels
CREATE TYPE complexity_type AS ENUM (
  'Low',
  'Medium', 
  'High'
);

-- Trigger types
CREATE TYPE trigger_type AS ENUM (
  'Manual',
  'Webhook',
  'Scheduled',
  'Event',
  'Complex'
);

-- Workflow status
CREATE TYPE workflow_status AS ENUM (
  'active',
  'inactive',
  'draft',
  'archived',
  'generated',
  'verified',
  'failed'
);
```

## Database Functions

### Search Functions

#### `search_unified_workflows`
Comprehensive search with multiple filters:

```sql
SELECT * FROM search_unified_workflows(
  search_query := 'email marketing',
  source_filter := ARRAY['ai-generated'],
  category_filter := ARRAY['Marketing & Sales'],
  complexity_filter := ARRAY['Low', 'Medium'],
  is_ai_generated_filter := true,
  limit_count := 20
);
```

#### `get_ai_generated_workflows`
Get AI-generated workflows with filtering:

```sql
SELECT * FROM get_ai_generated_workflows(
  category_filter := ARRAY['Marketing & Sales'],
  complexity_filter := ARRAY['Medium'],
  limit_count := 10
);
```

### Statistics Functions

#### `get_workflow_statistics`
Get comprehensive workflow statistics:

```sql
SELECT * FROM get_workflow_statistics(
  source_filter := ARRAY['ai-generated']
);
```

### Utility Functions

#### `update_workflow_popularity`
Update workflow popularity score:

```sql
SELECT update_workflow_popularity(
  workflow_id := 'workflow-123',
  popularity_score := 85
);
```

## API Integration

### Frontend Components

#### WorkflowTab
The main component for displaying workflows:

```typescript
import { WorkflowTab } from '@/components/tabs/WorkflowTab';

<WorkflowTab
  subtask={subtask}
  lang="en"
  onWorkflowSelect={handleWorkflowSelect}
  onDownloadRequest={handleDownloadRequest}
  onSetupRequest={handleSetupRequest}
/>
```

#### UnifiedSolutionCard
Displays workflow solutions with unified data:

```typescript
import { UnifiedSolutionCard } from '@/components/UnifiedSolutionCard';

<UnifiedSolutionCard
  solution={unifiedWorkflow}
  lang="en"
  onSelect={handleSelect}
  onSetupClick={handleSetup}
  onConfigClick={handleConfig}
  onShareClick={handleShare}
  onDownloadClick={handleDownload}
/>
```

### Service Classes

#### SimplifiedWorkflowIndexer
**New simplified service** for workflow management with clear interfaces:

```typescript
import { simplifiedWorkflowIndexer } from '@/lib/workflowIndexerSimplified';

// Search workflows with clear parameters
const result = await simplifiedWorkflowIndexer.search({
  q: 'email marketing',
  source: ['ai-generated', 'github'],
  complexity: ['medium', 'high'],
  limit: 20,
  sort_by: 'relevance'
});

// Get statistics
const stats = await simplifiedWorkflowIndexer.getStats();
console.log(`Total workflows: ${stats.totalWorkflows}`);
console.log(`Cache hit rate: ${(stats.cacheStats.hitRate * 100).toFixed(1)}%`);

// Refresh workflows
const refreshResult = await simplifiedWorkflowIndexer.refresh({
  sourceId: 'github',
  force: true,
  incremental: false
});
```

#### SimplifiedWorkflowGenerator
**New simplified service** for AI workflow generation with clear interfaces:

```typescript
import { generateWorkflow, generateMultipleWorkflows } from '@/lib/workflowGeneratorSimplified';

// Generate single workflow
const result = await generateWorkflow({
  subtask: {
    id: 'task-1',
    title: 'Email Marketing',
    description: 'Automated email campaigns',
    automationPotential: 85
  },
  lang: 'en',
  timeoutMs: 10000
}, {
  useCache: true,
  useFallback: true,
  maxRetries: 3
});

// Generate multiple workflows
const multipleResult = await generateMultipleWorkflows({
  subtask: subtask,
  count: 3,
  lang: 'en',
  timeoutMs: 15000
});

console.log(`Generated ${multipleResult.workflows.length} workflows`);
console.log(`Errors: ${multipleResult.errors.length}`);
```

#### SimpleCache
**New lightweight caching system** with clear statistics:

```typescript
import { workflowCache, searchCache, statsCache } from '@/lib/services/simpleCache';

// Basic cache operations
workflowCache.set('key1', workflowData, 60000); // 1 minute TTL
const data = workflowCache.get('key1');

// Cache statistics
const stats = workflowCache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Total requests: ${stats.totalRequests}`);

// Cache management
workflowCache.clearPattern('task-.*'); // Clear by pattern
workflowCache.clear(); // Clear all
```

## Feature Flags

### Available Flags

- `unified_workflow_read`: Enable reading from unified_workflows table
- `unified_workflow_write`: Enable writing to unified_workflows table  
- `unified_workflow_ai_generation`: Enable AI workflow generation

### Usage

```typescript
import { getFeatureToggleManager } from '@/lib/featureToggle';

const manager = getFeatureToggleManager();

// Check if unified workflow generation is enabled
if (manager.isEnabled('unified_workflow_ai_generation')) {
  // Use simplified generator
  const result = await generateWorkflow({
    subtask: subtask,
    lang: 'en',
    timeoutMs: 10000
  });
} else {
  // Use fallback generation
  const result = await generateSimpleWorkflow({
    subtask: subtask,
    lang: 'en'
  });
}

// Check if unified workflow reading is enabled
if (manager.isEnabled('unified_workflow_read')) {
  // Use simplified indexer
  const result = await simplifiedWorkflowIndexer.search({
    q: 'email marketing',
    limit: 20
  });
} else {
  // Use legacy indexer
  const result = await legacyWorkflowIndexer.searchWorkflows({
    query: 'email marketing',
    limit: 20
  });
}
```

## Migration Strategy

### Phase 1: Schema Creation
- Create `unified_workflows` table
- Set up indexes and constraints
- Create database functions

### Phase 2: Feature Flags
- Implement feature flag system
- Enable gradual rollout
- Monitor performance

### Phase 3: Data Migration
- Migrate existing workflow_cache data
- Validate data integrity
- Test functionality

### Phase 4: Frontend Updates
- Update components to use unified schema
- Implement source filtering
- Add AI workflow generation

### Phase 5: Cleanup
- Remove deprecated code
- Drop old tables
- Update documentation

## Performance Optimizations

### Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_unified_workflows_source_active_ai 
ON unified_workflows (source, active, is_ai_generated) 
WHERE active = true;

-- AI-generated workflows index
CREATE INDEX idx_unified_workflows_ai_generated 
ON unified_workflows (is_ai_generated, created_at DESC) 
WHERE is_ai_generated = true AND active = true;

-- Full-text search index
CREATE INDEX idx_unified_workflows_search 
ON unified_workflows USING GIN (
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(summary, '') || ' ' || 
    COALESCE(category, '') || ' ' || 
    COALESCE(array_to_string(tags, ' '), '')
  )
);
```

### Query Optimization

- Use prepared statements for common queries
- Implement connection pooling
- Cache frequently accessed data
- Use database functions for complex operations

## Security

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE unified_workflows ENABLE ROW LEVEL SECURITY;

-- Public read access to active workflows
CREATE POLICY "Public read access to active workflows" 
ON unified_workflows FOR SELECT 
USING (active = true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert workflows" 
ON unified_workflows FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Admins have full access
CREATE POLICY "Admins have full access" 
ON unified_workflows 
TO service_role 
USING (true) 
WITH CHECK (true);
```

## Monitoring

### Performance Metrics

- Query execution times
- Index usage statistics
- Cache hit rates
- Error rates

### Health Checks

- Database connectivity
- Feature flag status
- Migration completeness
- Data integrity

## Testing

### Unit Tests

```typescript
// Test simplified workflow generator
describe('SimplifiedWorkflowGenerator', () => {
  it('should generate workflow successfully', async () => {
    const result = await generateWorkflow({
      subtask: mockSubtask,
      lang: 'en',
      timeoutMs: 10000
    }, {
      useCache: true,
      useFallback: true
    });
    
    expect(result.workflow).toBeDefined();
    expect(result.metadata?.source).toBe('ai');
    expect(result.metadata?.processingTimeMs).toBeGreaterThan(0);
  });

  it('should handle generation errors gracefully', async () => {
    const result = await generateWorkflow({
      subtask: invalidSubtask,
      lang: 'en'
    });
    
    expect(result.error).toBeDefined();
    expect(result.workflow).toBeUndefined();
    expect(result.metadata?.source).toBe('fallback');
  });
});

// Test simplified workflow indexer
describe('SimplifiedWorkflowIndexer', () => {
  it('should search workflows with filters', async () => {
    const result = await simplifiedWorkflowIndexer.search({
      q: 'email marketing',
      source: ['ai-generated'],
      complexity: ['medium'],
      limit: 10
    });
    
    expect(result.workflows).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.page).toBe(1);
    expect(result.hasMore).toBeDefined();
  });

  it('should provide cache statistics', async () => {
    const stats = await simplifiedWorkflowIndexer.getStats();
    
    expect(stats.totalWorkflows).toBeGreaterThanOrEqual(0);
    expect(stats.cacheStats.hitRate).toBeGreaterThanOrEqual(0);
    expect(stats.cacheStats.totalRequests).toBeGreaterThanOrEqual(0);
  });
});

// Test simple cache system
describe('SimpleCache', () => {
  it('should store and retrieve data', () => {
    const cache = new SimpleCache<string>();
    
    cache.set('key1', 'value1', 60000);
    const value = cache.get('key1');
    
    expect(value).toBe('value1');
  });

  it('should handle TTL expiration', () => {
    const cache = new SimpleCache<string>();
    
    cache.set('key1', 'value1', 1); // 1ms TTL
    setTimeout(() => {
      const value = cache.get('key1');
      expect(value).toBeNull();
    }, 10);
  });

  it('should provide statistics', () => {
    const cache = new SimpleCache<string>();
    
    cache.set('key1', 'value1');
    cache.get('key1'); // Hit
    cache.get('key2'); // Miss
    
    const stats = cache.getStats();
    expect(stats.totalRequests).toBe(2);
    expect(stats.totalHits).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });
});
```

### Integration Tests

```typescript
// Test end-to-end workflow generation with simplified interfaces
describe('Simplified Workflow Generation Integration', () => {
  it('should generate and cache workflows', async () => {
    const result = await generateWorkflow({
      subtask: mockSubtask,
      lang: 'en',
      timeoutMs: 10000
    }, {
      useCache: true
    });
    
    expect(result.workflow).toBeDefined();
    expect(result.metadata?.source).toBe('ai');
    
    // Test cache hit
    const cachedResult = await generateWorkflow({
      subtask: mockSubtask,
      lang: 'en'
    }, {
      useCache: true
    });
    
    expect(cachedResult.metadata?.source).toBe('cache');
  });

  it('should handle multiple workflow generation', async () => {
    const result = await generateMultipleWorkflows({
      subtask: mockSubtask,
      count: 3,
      lang: 'en'
    });
    
    expect(result.workflows.length).toBeGreaterThan(0);
    expect(result.metadata?.successCount).toBeGreaterThan(0);
    expect(result.metadata?.totalProcessingTimeMs).toBeGreaterThan(0);
  });
});

// Test workflow indexer integration
describe('Simplified Workflow Indexer Integration', () => {
  it('should search and refresh workflows', async () => {
    // Search workflows
    const searchResult = await simplifiedWorkflowIndexer.search({
      q: 'test',
      limit: 5
    });
    
    expect(searchResult.workflows).toBeDefined();
    
    // Refresh workflows
    const refreshResult = await simplifiedWorkflowIndexer.refresh({
      force: true
    });
    
    expect(refreshResult.success).toBeDefined();
    expect(refreshResult.processingTimeMs).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all imports use the new schema paths
2. **Feature Flag Issues**: Check feature flag configuration
3. **Performance Issues**: Monitor query execution times
4. **Data Inconsistencies**: Run data validation checks

### Debug Commands

```sql
-- Check feature flags
SELECT * FROM feature_flags WHERE name LIKE 'unified_workflow%';

-- Verify migration
SELECT * FROM verify_workflow_cleanup();

-- Check workflow counts
SELECT source, COUNT(*) FROM unified_workflows GROUP BY source;
```

## Future Enhancements

- Real-time workflow updates
- Advanced AI workflow customization
- Workflow versioning
- Collaborative editing
- Workflow marketplace
- Performance analytics dashboard

## Support

For issues or questions regarding the Unified Workflow Schema:

1. Check the troubleshooting section
2. Review the test cases
3. Consult the API documentation
4. Contact the development team
