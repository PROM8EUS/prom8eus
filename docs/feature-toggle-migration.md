# Feature Toggle Migration Documentation

## Overview

This document describes the migration from the old Supabase RPC-based feature flag system to the new environment variable-based feature toggle system. The migration affects both client-side and server-side code.

## Migration Summary

### What Was Changed

1. **Client-Side Migration**:
   - Replaced `src/lib/featureFlags.ts` with `src/lib/featureToggle.ts`
   - Updated all imports from `featureFlags` to `featureToggle`
   - Changed from async RPC calls to synchronous environment variable checks

2. **Server-Side Migration**:
   - Created `supabase/functions/_shared/feature-toggles.ts` for shared utilities
   - Updated all Supabase Edge Functions to use environment variables instead of database queries
   - Removed dependency on `feature_flags` table

3. **Configuration Migration**:
   - Fixed boolean environment variable handling in `src/lib/config.ts`
   - Removed problematic `=== 'true' || true` anti-patterns

### Files Modified

#### Client-Side Files
- `src/lib/featureFlags.ts` - **DELETED** (replaced by `featureToggle.ts`)
- `src/lib/featureToggle.ts` - **NEW** (lightweight feature toggle system)
- `src/lib/config.ts` - **UPDATED** (fixed boolean handling)
- `src/lib/workflowGeneratorUnified.ts` - **UPDATED** (migrated to new toggles)
- `src/lib/workflowIndexerUnified.ts` - **UPDATED** (migrated to new toggles)
- `src/lib/n8nApiUnified.ts` - **UPDATED** (migrated to new toggles)
- `src/lib/workflowGenerator.ts` - **UPDATED** (migrated to new toggles)

#### Server-Side Files
- `supabase/functions/_shared/feature-toggles.ts` - **NEW** (shared utilities)
- `supabase/functions/fetch-github-workflows-unified/index.ts` - **UPDATED**
- `supabase/functions/recommend-workflows/index.ts` - **UPDATED**
- `supabase/functions/get-workflow-cache/index.ts` - **UPDATED**
- `supabase/functions/index-workflows-unified/index.ts` - **UPDATED**

#### Test Files
- `test/lib/featureToggle.test.ts` - **NEW** (comprehensive test suite)
- `test/lib/config.simple.test.ts` - **NEW** (simplified config tests)

#### Documentation
- `docs/feature-toggles.md` - **NEW** (feature toggle documentation)
- `docs/configuration-system.md` - **NEW** (configuration system documentation)
- `docs/feature-toggle-migration.md` - **NEW** (this migration guide)

## Migration Details

### Client-Side Migration

#### Before (Old System)
```typescript
import { getFeatureFlagManager, isUnifiedWorkflowEnabled } from './featureFlags';

// Async RPC calls
const manager = getFeatureFlagManager();
const isEnabled = await manager.isEnabled('unified_workflow_schema');

// Or using helper functions
const isEnabled = await isUnifiedWorkflowEnabled();
```

#### After (New System)
```typescript
import { getFeatureToggleManager, isUnifiedWorkflowEnabled } from './featureToggle';

// Synchronous environment variable checks
const manager = getFeatureToggleManager();
const isEnabled = manager.isEnabled('unified_workflow_schema');

// Or using helper functions
const isEnabled = isUnifiedWorkflowEnabled();
```

### Server-Side Migration

#### Before (Old System)
```typescript
async function checkFeatureFlag(flagName: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('name', flagName)
      .eq('environment', 'production')
      .single();

    if (error || !data) return false;
    return data.enabled;
  } catch (error) {
    console.warn(`Failed to check feature flag ${flagName}:`, error);
    return false;
  }
}
```

#### After (New System)
```typescript
import { checkFeatureToggle } from '../_shared/feature-toggles.ts';

function checkFeatureToggle(toggleName: string): boolean {
  const envVarMap: Record<string, string> = {
    'unified_workflow_read': 'UNIFIED_WORKFLOW_READ',
    'unified_workflow_write': 'UNIFIED_WORKFLOW_WRITE',
    // ... etc
  };

  const envVar = envVarMap[toggleName];
  const value = Deno.env.get(envVar);
  
  // Handle various boolean formats
  if (value === 'true' || value === '1' || value === 'yes' || value === 'on') {
    return true;
  }
  
  if (value === 'false' || value === '0' || value === 'no' || value === 'off') {
    return false;
  }
  
  // Use default values
  return defaults[toggleName] || false;
}
```

### Configuration Migration

#### Before (Problematic)
```typescript
// Anti-pattern: Always true, regardless of environment variable
enableAiAnalysis: import.meta.env.VITE_ENABLE_AI_ANALYSIS === 'true' || true,
```

#### After (Fixed)
```typescript
// Proper boolean parsing with fallback
enableAiAnalysis: getBooleanEnv('VITE_ENABLE_AI_ANALYSIS', true),
```

## Environment Variables

### Client-Side Variables (VITE_*)
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

### Server-Side Variables (Deno.env)
```bash
# Unified Workflow Schema
UNIFIED_WORKFLOW_SCHEMA=true
UNIFIED_WORKFLOW_READ=true
UNIFIED_WORKFLOW_WRITE=true
UNIFIED_WORKFLOW_SEARCH=true
UNIFIED_WORKFLOW_AI_GENERATION=true
UNIFIED_WORKFLOW_MIGRATION=false
UNIFIED_WORKFLOW_FRONTEND=true
UNIFIED_WORKFLOW_ANALYTICS=false
```

## Benefits of Migration

### Performance Improvements
1. **Synchronous Operation**: No more `await` calls for feature checks
2. **No Network Calls**: All toggles resolved locally via environment variables
3. **Instant Resolution**: Immediate feedback for feature status
4. **Reduced Latency**: No database queries for feature flag checks

### Reliability Improvements
1. **No External Dependencies**: No dependency on Supabase RPC functions
2. **No Network Failures**: Local environment variable resolution
3. **No Timeout Issues**: Synchronous operation eliminates timeout risks
4. **Better Error Handling**: Graceful fallback to default values

### Maintainability Improvements
1. **Simplified Configuration**: Environment variable-based configuration
2. **Consistent API**: Same interface across client and server
3. **Better Testing**: Easy to mock environment variables
4. **Clear Documentation**: Comprehensive documentation and examples

### Security Improvements
1. **No Database Queries**: Reduced attack surface
2. **Environment-Based**: Configuration through deployment environment
3. **No Sensitive Data**: Feature toggles are not security-sensitive
4. **Audit Trail**: Environment variable changes are tracked in deployment logs

## Testing

### Client-Side Tests
```bash
# Run feature toggle tests
npm test -- test/lib/featureToggle.test.ts

# Run configuration tests
npm test -- test/lib/config.simple.test.ts
```

### Test Coverage
- **Feature Toggle Tests**: 19/19 tests passing
- **Configuration Tests**: 16/16 tests passing
- **Build Tests**: Project compiles successfully
- **Integration Tests**: All components work with new system

## Deployment

### Development
1. Set environment variables in `.env.local`
2. Restart development server
3. Verify feature toggles work as expected

### Production
1. Set environment variables in deployment platform
2. Deploy application
3. Verify feature toggles work in production

### Supabase Edge Functions
1. Set environment variables in Supabase dashboard
2. Deploy edge functions
3. Verify server-side feature toggles work

## Rollback Plan

If issues arise, the migration can be rolled back by:

1. **Restore Old Files**: Restore `src/lib/featureFlags.ts` from git history
2. **Update Imports**: Change imports back to `featureFlags`
3. **Restore Database**: Ensure `feature_flags` table exists and is populated
4. **Update Supabase Functions**: Restore old feature flag logic in edge functions

## Monitoring

### Client-Side Monitoring
- Monitor console logs for feature toggle warnings
- Check browser developer tools for environment variable values
- Verify feature toggles work in different environments

### Server-Side Monitoring
- Monitor Supabase Edge Function logs
- Check environment variable values in deployment platform
- Verify feature toggles work in production

## Future Enhancements

1. **Runtime Toggles**: Support for runtime toggle changes
2. **User-Specific Toggles**: Support for user-based feature toggles
3. **A/B Testing**: Integration with A/B testing frameworks
4. **Analytics**: Track feature toggle usage and performance
5. **Admin Interface**: Web interface for managing feature toggles

## Troubleshooting

### Common Issues

1. **Feature Toggle Not Working**:
   - Check if environment variable is set correctly
   - Verify environment variable name matches exactly
   - Check if default value is appropriate

2. **Build Failures**:
   - Ensure all imports are updated to use `featureToggle`
   - Check for any remaining references to `featureFlags`
   - Verify TypeScript types are correct

3. **Runtime Errors**:
   - Check console logs for feature toggle warnings
   - Verify environment variables are accessible
   - Check if fallback values are working

### Debug Mode

```typescript
// Client-side debugging
import { getFeatureToggleManager } from '@/lib/featureToggle';

const manager = getFeatureToggleManager();
console.log('All toggles:', manager.getAllToggles());
console.log('Enabled toggles:', manager.getEnabledToggles());
```

```typescript
// Server-side debugging
import { checkFeatureToggle } from '../_shared/feature-toggles.ts';

console.log('Unified workflow enabled:', checkFeatureToggle('unified_workflow_schema'));
console.log('Environment variables:', Deno.env.toObject());
```

## Conclusion

The migration from Supabase RPC-based feature flags to environment variable-based feature toggles has been successfully completed. The new system provides better performance, reliability, and maintainability while maintaining the same functionality. All tests are passing, and the application builds successfully.

The migration affects both client-side and server-side code, with comprehensive documentation and testing to ensure smooth operation. The new system is ready for production use and provides a solid foundation for future feature toggle enhancements.
