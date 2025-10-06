# Environment Variables Documentation

This document provides a comprehensive guide to all environment variables used in the Prom8eus application.

## Overview

The application uses environment variables for configuration, with a clear separation between client-side (VITE_*) and server-side (Deno.env) variables. All feature toggles are enabled by default but can be disabled by setting the corresponding environment variable to `false`.

## Client-Side Environment Variables (VITE_*)

### Required Variables

#### Supabase Configuration
```bash
# Supabase project URL
VITE_SUPABASE_URL=https://your-project.supabase.co

# Supabase anonymous key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optional Variables

#### GitHub Integration
```bash
# GitHub personal access token (for enhanced GitHub API access)
VITE_GITHUB_TOKEN=ghp_your_token_here
```

#### Logo.dev API
```bash
# Logo.dev API key for AI tool logo fallbacks
VITE_LOGO_DEV_API_KEY=your_logo_dev_api_key_here
```

#### Application Environment
```bash
# Application environment (development, staging, production)
VITE_APP_ENV=development
```

## Feature Toggles

### Unified Workflow Schema Toggles

```bash
# Enable unified workflow schema (main toggle)
VITE_UNIFIED_WORKFLOW_SCHEMA=true

# Enable unified workflow reading
VITE_UNIFIED_WORKFLOW_READ=true

# Enable unified workflow writing
VITE_UNIFIED_WORKFLOW_WRITE=true

# Enable unified workflow search
VITE_UNIFIED_WORKFLOW_SEARCH=true

# Enable AI workflow generation
VITE_UNIFIED_WORKFLOW_AI_GENERATION=true

# Enable workflow migration features (experimental)
VITE_UNIFIED_WORKFLOW_MIGRATION=false

# Enable unified workflow frontend
VITE_UNIFIED_WORKFLOW_FRONTEND=true

# Enable workflow analytics (experimental)
VITE_UNIFIED_WORKFLOW_ANALYTICS=false
```

### General Feature Toggles

```bash
# Enable AI analysis features
VITE_ENABLE_AI_ANALYSIS=true

# Enable workflow search functionality
VITE_ENABLE_WORKFLOW_SEARCH=true

# Enable AI agent recommendations
VITE_ENABLE_AGENT_RECOMMENDATIONS=true
```

### Recommendations System Toggles

```bash
# Enable LLM-powered recommendations
VITE_RECOMMENDATIONS_ENABLE_LLM=true

# Enable recommendation caching
VITE_RECOMMENDATIONS_ENABLE_CACHE=true

# Number of top recommendations to return
VITE_RECOMMENDATIONS_TOP_K=6

# LLM timeout in milliseconds
VITE_RECOMMENDATIONS_LLM_TIMEOUT_MS=3000

# Cache TTL in minutes
VITE_RECOMMENDATIONS_CACHE_TTL_MINUTES=60
```

## Server-Side Environment Variables (Deno.env)

These variables are used by Supabase Edge Functions and should be set in the Supabase dashboard under Edge Functions environment variables.

### Unified Workflow Schema Toggles

```bash
# Enable unified workflow schema (main toggle)
UNIFIED_WORKFLOW_SCHEMA=true

# Enable unified workflow reading
UNIFIED_WORKFLOW_READ=true

# Enable unified workflow writing
UNIFIED_WORKFLOW_WRITE=true

# Enable unified workflow search
UNIFIED_WORKFLOW_SEARCH=true

# Enable AI workflow generation
UNIFIED_WORKFLOW_AI_GENERATION=true

# Enable workflow migration features (experimental)
UNIFIED_WORKFLOW_MIGRATION=false

# Enable unified workflow frontend
UNIFIED_WORKFLOW_FRONTEND=true

# Enable workflow analytics (experimental)
UNIFIED_WORKFLOW_ANALYTICS=false
```

## Boolean Environment Variable Format

The system supports various boolean formats for environment variables:

### Truthy Values
- `true`
- `1`
- `yes`
- `on`

### Falsy Values
- `false`
- `0`
- `no`
- `off`

### Examples

```bash
# All of these enable the feature
VITE_UNIFIED_WORKFLOW_SCHEMA=true
VITE_UNIFIED_WORKFLOW_SCHEMA=1
VITE_UNIFIED_WORKFLOW_SCHEMA=yes
VITE_UNIFIED_WORKFLOW_SCHEMA=on

# All of these disable the feature
VITE_UNIFIED_WORKFLOW_SCHEMA=false
VITE_UNIFIED_WORKFLOW_SCHEMA=0
VITE_UNIFIED_WORKFLOW_SCHEMA=no
VITE_UNIFIED_WORKFLOW_SCHEMA=off
```

## Feature Toggle Usage

### Client-Side Usage

```typescript
import { getFeatureToggleManager, isUnifiedWorkflowEnabled } from '@/lib/featureToggle';

// Using the manager
const manager = getFeatureToggleManager();
const isEnabled = manager.isEnabled('unified_workflow_schema');

// Using helper functions
const isEnabled = isUnifiedWorkflowEnabled();

// Getting all toggles
const allToggles = manager.getAllToggles();
const enabledToggles = manager.getEnabledToggles();
```

### Server-Side Usage (Supabase Edge Functions)

```typescript
import { checkFeatureToggle, isUnifiedWorkflowReadEnabled } from '../_shared/feature-toggles.ts';

// Using the main function
const isEnabled = checkFeatureToggle('unified_workflow_read');

// Using helper functions
const isEnabled = isUnifiedWorkflowReadEnabled();
```

## Environment Setup

### Development Setup

1. Copy the environment variables to your `.env` file:
```bash
# Create .env file
touch .env

# Add your environment variables
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" >> .env
echo "VITE_SUPABASE_ANON_KEY=your_anon_key_here" >> .env
# ... add other variables as needed
```

2. Restart your development server:
```bash
npm run dev
```

### Production Setup

1. Set environment variables in your deployment platform (Vercel, Netlify, etc.)
2. Deploy your application
3. Verify feature toggles work in production

### Supabase Edge Functions Setup

1. Go to your Supabase dashboard
2. Navigate to Edge Functions
3. Set environment variables for each function
4. Deploy your functions

## Feature Toggle Reference

| Toggle Name | Description | Default | Environment Variable | Client/Server |
|-------------|-------------|---------|---------------------|---------------|
| `unified_workflow_schema` | Enable unified workflow schema | `true` | `VITE_UNIFIED_WORKFLOW_SCHEMA` | Client |
| `unified_workflow_read` | Enable unified workflow reading | `true` | `VITE_UNIFIED_WORKFLOW_READ` | Client |
| `unified_workflow_write` | Enable unified workflow writing | `true` | `VITE_UNIFIED_WORKFLOW_WRITE` | Client |
| `unified_workflow_search` | Enable unified workflow search | `true` | `VITE_UNIFIED_WORKFLOW_SEARCH` | Client |
| `unified_workflow_ai_generation` | Enable AI workflow generation | `true` | `VITE_UNIFIED_WORKFLOW_AI_GENERATION` | Client |
| `unified_workflow_migration` | Enable workflow migration features | `false` | `VITE_UNIFIED_WORKFLOW_MIGRATION` | Client |
| `unified_workflow_frontend` | Enable unified workflow frontend | `true` | `VITE_UNIFIED_WORKFLOW_FRONTEND` | Client |
| `unified_workflow_analytics` | Enable workflow analytics | `false` | `VITE_UNIFIED_WORKFLOW_ANALYTICS` | Client |
| `unified_workflow_schema` | Enable unified workflow schema | `true` | `UNIFIED_WORKFLOW_SCHEMA` | Server |
| `unified_workflow_read` | Enable unified workflow reading | `true` | `UNIFIED_WORKFLOW_READ` | Server |
| `unified_workflow_write` | Enable unified workflow writing | `true` | `UNIFIED_WORKFLOW_WRITE` | Server |
| `unified_workflow_search` | Enable unified workflow search | `true` | `UNIFIED_WORKFLOW_SEARCH` | Server |
| `unified_workflow_ai_generation` | Enable AI workflow generation | `true` | `UNIFIED_WORKFLOW_AI_GENERATION` | Server |
| `unified_workflow_migration` | Enable workflow migration features | `false` | `UNIFIED_WORKFLOW_MIGRATION` | Server |
| `unified_workflow_frontend` | Enable unified workflow frontend | `true` | `UNIFIED_WORKFLOW_FRONTEND` | Server |
| `unified_workflow_analytics` | Enable workflow analytics | `false` | `UNIFIED_WORKFLOW_ANALYTICS` | Server |

## Troubleshooting

### Common Issues

1. **Feature Toggle Not Working**:
   - Check if environment variable is set correctly
   - Verify environment variable name matches exactly
   - Check if default value is appropriate
   - Restart development server after changes

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
console.log('Toggle status:', manager.getToggleStatus('unified_workflow_schema'));
```

```typescript
// Server-side debugging
import { checkFeatureToggle } from '../_shared/feature-toggles.ts';

console.log('Unified workflow enabled:', checkFeatureToggle('unified_workflow_schema'));
console.log('Environment variables:', Deno.env.toObject());
```

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use different values** for development and production
3. **Rotate API keys** regularly
4. **Monitor usage** of external APIs
5. **Validate environment variables** at startup

## Best Practices

1. **Use descriptive names** for environment variables
2. **Set appropriate defaults** for all feature toggles
3. **Document all variables** in this file
4. **Test with different configurations** in development
5. **Monitor feature toggle usage** in production
6. **Use feature toggles for gradual rollouts** of new features
7. **Clean up unused toggles** regularly

## Migration from Old System

If you're migrating from the old Supabase RPC-based feature flag system, see the [Feature Toggle Migration Guide](feature-toggle-migration.md) for detailed instructions.

## Related Documentation

- [Feature Toggles Documentation](feature-toggles.md)
- [Feature Toggle Migration Guide](feature-toggle-migration.md)
- [Configuration System Documentation](configuration-system.md)
- [README.md](../README.md) - Main project documentation
