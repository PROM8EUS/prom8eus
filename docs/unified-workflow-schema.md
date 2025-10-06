# Unified Workflow Schema Documentation

## Overview

The Unified Workflow Schema is a comprehensive data model that consolidates all workflow types (GitHub, n8n.io, AI-generated) into a single, consistent structure. This schema eliminates data inconsistencies, reduces conversion overhead, and provides a unified interface for workflow management.

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

#### UnifiedWorkflowIndexer
Main service for workflow management:

```typescript
import { unifiedWorkflowIndexer } from '@/lib/workflowIndexerUnified';

// Load workflows
const workflows = await unifiedWorkflowIndexer.loadWorkflows();

// Get AI-generated workflows
const aiWorkflows = await unifiedWorkflowIndexer.getAIGeneratedWorkflows();

// Search workflows
const results = await unifiedWorkflowIndexer.searchWorkflows({
  query: 'email marketing',
  source: 'ai-generated',
  limit: 20
});
```

#### UnifiedWorkflowGenerator
AI workflow generation service:

```typescript
import { UnifiedWorkflowGenerator } from '@/lib/workflowGeneratorUnified';

const generator = new UnifiedWorkflowGenerator();

// Generate workflow for subtask
const result = await generator.generateWorkflowForSubtask({
  subtask: subtask,
  lang: 'en',
  timeoutMs: 5000
});

// Generate multiple workflows
const workflows = await generator.generateWorkflowsForSubtasks({
  subtasks: subtasks,
  lang: 'en',
  timeoutMs: 10000
});
```

## Feature Flags

### Available Flags

- `unified_workflow_read`: Enable reading from unified_workflows table
- `unified_workflow_write`: Enable writing to unified_workflows table  
- `unified_workflow_ai_generation`: Enable AI workflow generation

### Usage

```typescript
import { useFeatureFlag } from '@/lib/featureFlags';

const { isEnabled: isUnifiedEnabled } = useFeatureFlag('unified_workflow_read');

if (isUnifiedEnabled) {
  // Use unified schema
  const workflows = await unifiedWorkflowIndexer.loadWorkflows();
} else {
  // Fallback to legacy
  const workflows = await legacyWorkflowIndexer.loadWorkflows();
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
// Test database functions
describe('Database Functions', () => {
  it('should search workflows by text query', async () => {
    const result = await mockDatabaseFunctions.search_unified_workflows({
      search_query: 'email marketing',
      limit_count: 10
    });
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Test end-to-end workflow generation
describe('AI Workflow Generation', () => {
  it('should generate workflow for subtask', async () => {
    const result = await workflowGenerator.generateWorkflowForSubtask({
      subtask: mockSubtask,
      lang: 'en',
      timeoutMs: 5000
    });
    
    expect(result.workflow).toBeDefined();
    expect(result.workflow.source).toBe('ai-generated');
    expect(result.workflow.isAIGenerated).toBe(true);
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
