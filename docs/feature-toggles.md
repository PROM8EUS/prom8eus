# Feature Toggles Documentation

## Overview

The application now uses a lightweight feature toggle system based on environment variables instead of the previous Supabase RPC-based feature flag system. This provides better performance, reliability, and simplicity.

## Architecture

### Core Components

- **`src/lib/featureToggle.ts`**: Main feature toggle implementation
- **`src/lib/config.ts`**: Configuration system with improved boolean handling
- **Environment Variables**: Control feature toggles via `VITE_*` variables

### Key Benefits

1. **No External Dependencies**: No longer depends on Supabase RPC functions
2. **Better Performance**: Synchronous operation, no network calls
3. **Simplified Configuration**: Environment variable-based configuration
4. **Improved Reliability**: No network failures or timeout issues
5. **Better Testing**: Easy to mock and test

## Available Feature Toggles

### Unified Workflow Schema Toggles

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `VITE_UNIFIED_WORKFLOW_SCHEMA` | `true` | Enable unified workflow schema |
| `VITE_UNIFIED_WORKFLOW_READ` | `true` | Enable unified workflow read operations |
| `VITE_UNIFIED_WORKFLOW_WRITE` | `true` | Enable unified workflow write operations |
| `VITE_UNIFIED_WORKFLOW_SEARCH` | `true` | Enable unified workflow search |
| `VITE_UNIFIED_WORKFLOW_AI_GENERATION` | `true` | Enable unified workflow AI generation |
| `VITE_UNIFIED_WORKFLOW_MIGRATION` | `false` | Enable unified workflow migration |
| `VITE_UNIFIED_WORKFLOW_FRONTEND` | `true` | Enable unified workflow frontend features |
| `VITE_UNIFIED_WORKFLOW_ANALYTICS` | `false` | Enable unified workflow analytics |

### General Feature Toggles

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `VITE_ENABLE_AI_ANALYSIS` | `true` | Enable AI analysis features |
| `VITE_ENABLE_WORKFLOW_SEARCH` | `true` | Enable workflow search features |
| `VITE_ENABLE_AGENT_RECOMMENDATIONS` | `true` | Enable agent recommendations |
| `VITE_RECOMMENDATIONS_ENABLE_LLM` | `true` | Enable LLM recommendations |
| `VITE_RECOMMENDATIONS_ENABLE_CACHE` | `true` | Enable caching features |

## Usage

### Basic Usage

```typescript
import { 
  isUnifiedWorkflowEnabled,
  isAIAnalysisEnabled,
  getFeatureToggleManager 
} from '@/lib/featureToggle';

// Check if a feature is enabled
if (isUnifiedWorkflowEnabled()) {
  // Use unified workflow features
}

if (isAIAnalysisEnabled()) {
  // Use AI analysis features
}
```

### Advanced Usage

```typescript
import { getFeatureToggleManager } from '@/lib/featureToggle';

const manager = getFeatureToggleManager();

// Check specific toggle
const isEnabled = manager.isEnabled('unified_workflow_schema');

// Get all enabled toggles
const enabledToggles = manager.getEnabledToggles();

// Get toggle status
const status = manager.getToggleStatus('unified_workflow_schema');

// Override toggle (useful for testing)
manager.overrideToggle('unified_workflow_schema', false);

// Reset overrides
manager.resetOverrides();
```

### React Hooks

```typescript
import { useFeatureToggle, useUnifiedWorkflowToggles } from '@/lib/featureToggle';

function MyComponent() {
  const { enabled, loading, error } = useFeatureToggle('unified_workflow_schema');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {enabled ? 'Feature is enabled' : 'Feature is disabled'}
    </div>
  );
}

function WorkflowComponent() {
  const { schema, read, write, search, aiGeneration, frontend } = useUnifiedWorkflowToggles();
  
  return (
    <div>
      {schema.enabled && <SchemaFeatures />}
      {read.enabled && <ReadFeatures />}
      {write.enabled && <WriteFeatures />}
      {search.enabled && <SearchFeatures />}
      {aiGeneration.enabled && <AIGenerationFeatures />}
      {frontend.enabled && <FrontendFeatures />}
    </div>
  );
}
```

## Environment Variable Values

The system supports various boolean formats:

### Truthy Values
- `'true'`
- `'1'`
- `'yes'`
- `'on'`

### Falsy Values
- `'false'`
- `'0'`
- `'no'`
- `'off'`

### Default Behavior
- If the environment variable is not set, the default value is used
- If the environment variable has an unrecognized value, the default value is used

## Configuration

### Environment Setup

Create a `.env.local` file in your project root:

```bash
# Unified Workflow Schema
VITE_UNIFIED_WORKFLOW_SCHEMA=true
VITE_UNIFIED_WORKFLOW_READ=true
VITE_UNIFIED_WORKFLOW_WRITE=true
VITE_UNIFIED_WORKFLOW_SEARCH=true
VITE_UNIFIED_WORKFLOW_AI_GENERATION=true
VITE_UNIFIED_WORKFLOW_MIGRATION=false
VITE_UNIFIED_WORKFLOW_FRONTEND=true
VITE_UNIFIED_WORKFLOW_ANALYTICS=false

# General Features
VITE_ENABLE_AI_ANALYSIS=true
VITE_ENABLE_WORKFLOW_SEARCH=true
VITE_ENABLE_AGENT_RECOMMENDATIONS=true
VITE_RECOMMENDATIONS_ENABLE_LLM=true
VITE_RECOMMENDATIONS_ENABLE_CACHE=true
```

### Production Configuration

For production, set these variables in your deployment environment:

```bash
# Example for Vercel
vercel env add VITE_UNIFIED_WORKFLOW_SCHEMA
vercel env add VITE_ENABLE_AI_ANALYSIS
# ... etc
```

## Migration from Old System

### Before (Supabase RPC-based)

```typescript
import { getFeatureFlagManager } from './featureFlags';

const manager = getFeatureFlagManager();
const isEnabled = await manager.isEnabled('unified_workflow_schema');
```

### After (Environment Variable-based)

```typescript
import { getFeatureToggleManager } from './featureToggle';

const manager = getFeatureToggleManager();
const isEnabled = manager.isEnabled('unified_workflow_schema');
```

### Key Changes

1. **Synchronous**: No more `await` needed
2. **No Network Calls**: All toggles are resolved locally
3. **Environment Variables**: Configure via `VITE_*` variables
4. **Better Performance**: Instant resolution
5. **Simplified API**: Cleaner, more predictable interface

## Testing

### Unit Tests

```typescript
import { FeatureToggleManager } from '@/lib/featureToggle';

describe('FeatureToggleManager', () => {
  let manager: FeatureToggleManager;

  beforeEach(() => {
    manager = new FeatureToggleManager();
  });

  it('should check feature toggles', () => {
    expect(manager.isEnabled('unified_workflow_schema')).toBe(true);
  });

  it('should override toggles', () => {
    manager.overrideToggle('unified_workflow_schema', false);
    expect(manager.isEnabled('unified_workflow_schema')).toBe(false);
  });
});
```

### Integration Tests

```typescript
import { isUnifiedWorkflowEnabled } from '@/lib/featureToggle';

describe('Feature Toggle Integration', () => {
  it('should work with components', () => {
    const enabled = isUnifiedWorkflowEnabled();
    expect(typeof enabled).toBe('boolean');
  });
});
```

## Troubleshooting

### Common Issues

1. **Toggle not working**: Check if the environment variable is set correctly
2. **Default values**: Ensure the environment variable name matches exactly
3. **Boolean values**: Use supported formats (`'true'`, `'false'`, `'1'`, `'0'`, etc.)

### Debug Mode

```typescript
import { getFeatureToggleManager } from '@/lib/featureToggle';

const manager = getFeatureToggleManager();
console.log('All toggles:', manager.getAllToggles());
console.log('Enabled toggles:', manager.getEnabledToggles());
```

## Performance Considerations

- **Instant Resolution**: All toggles are resolved synchronously
- **No Network Calls**: No external dependencies
- **Memory Efficient**: Minimal memory footprint
- **Cache Friendly**: No caching needed due to synchronous operation

## Security Considerations

- **Client-Side**: Feature toggles are visible to clients
- **Environment Variables**: Use `VITE_*` prefix for client-side variables
- **Sensitive Features**: Don't use feature toggles for security-sensitive features
- **Production**: Ensure proper environment variable configuration in production

## Future Enhancements

1. **Runtime Toggles**: Support for runtime toggle changes
2. **User-Specific Toggles**: Support for user-based feature toggles
3. **A/B Testing**: Integration with A/B testing frameworks
4. **Analytics**: Track feature toggle usage and performance
5. **Admin Interface**: Web interface for managing feature toggles
