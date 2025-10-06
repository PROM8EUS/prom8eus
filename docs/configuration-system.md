# Configuration System Documentation

## Overview

The application uses a centralized configuration system that manages environment variables, API keys, and feature toggles. The system has been improved to provide better boolean handling, validation, and testing capabilities.

## Architecture

### Core Components

- **`src/lib/config.ts`**: Main configuration system
- **`src/lib/featureToggle.ts`**: Feature toggle system (integrated with config)
- **Environment Variables**: Control application behavior via `VITE_*` variables

### Key Improvements

1. **Fixed Boolean Handling**: No more `=== 'true' || true` anti-patterns
2. **Proper Default Values**: Clear, predictable default values
3. **Comprehensive Validation**: Robust configuration validation
4. **Better Testing**: Comprehensive test coverage for core functionality

## Configuration Structure

### AppConfig Interface

```typescript
interface AppConfig {
  supabase: {
    url?: string;
    anonKey?: string;
  };
  github: {
    token?: string;
    baseUrl?: string;
  };
  app: {
    env: string;
    version: string;
  };
  api: {
    baseUrl: string;
    n8nUrl: string;
  };
  features: {
    enableAiAnalysis: boolean;
    enableWorkflowSearch: boolean;
    enableAgentRecommendations: boolean;
  };
  recommendations: {
    enableLLM: boolean;
    topK: number;
    llmTimeoutMs: number;
    enableCache: boolean;
    cacheTTLMinutes: number;
  };
}
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_GITHUB_TOKEN` | - | GitHub personal access token |
| `VITE_APP_ENV` | `development` | Application environment |
| `VITE_APP_VERSION` | `1.0.0` | Application version |
| `VITE_API_BASE_URL` | `http://localhost:3000` | API base URL |
| `VITE_N8N_API_URL` | `https://api.github.com` | N8N API URL |

### Feature Toggle Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ENABLE_AI_ANALYSIS` | `true` | Enable AI analysis features |
| `VITE_ENABLE_WORKFLOW_SEARCH` | `true` | Enable workflow search |
| `VITE_ENABLE_AGENT_RECOMMENDATIONS` | `true` | Enable agent recommendations |
| `VITE_RECOMMENDATIONS_ENABLE_LLM` | `true` | Enable LLM recommendations |
| `VITE_RECOMMENDATIONS_ENABLE_CACHE` | `true` | Enable caching |
| `VITE_RECOMMENDATIONS_TOP_K` | `6` | Number of top recommendations |
| `VITE_RECOMMENDATIONS_LLM_TIMEOUT_MS` | `3000` | LLM timeout in milliseconds |
| `VITE_RECOMMENDATIONS_CACHE_TTL_MINUTES` | `60` | Cache TTL in minutes |

## Boolean Environment Variable Handling

### Supported Formats

The system supports various boolean formats for better flexibility:

#### Truthy Values
- `'true'`
- `'1'`
- `'yes'`
- `'on'`

#### Falsy Values
- `'false'`
- `'0'`
- `'no'`
- `'off'`

### Implementation

```typescript
function getBooleanEnv(envVar: string, defaultValue: boolean): boolean {
  const value = import.meta.env[envVar];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  // Handle various truthy values
  if (value === 'true' || value === '1' || value === 'yes' || value === 'on') {
    return true;
  }
  
  if (value === 'false' || value === '0' || value === 'no' || value === 'off') {
    return false;
  }
  
  // Default to the provided default value for unrecognized values
  return defaultValue;
}
```

### Examples

```bash
# All of these will be interpreted as true
VITE_ENABLE_AI_ANALYSIS=true
VITE_ENABLE_AI_ANALYSIS=1
VITE_ENABLE_AI_ANALYSIS=yes
VITE_ENABLE_AI_ANALYSIS=on

# All of these will be interpreted as false
VITE_ENABLE_AI_ANALYSIS=false
VITE_ENABLE_AI_ANALYSIS=0
VITE_ENABLE_AI_ANALYSIS=no
VITE_ENABLE_AI_ANALYSIS=off

# Invalid values will use the default
VITE_ENABLE_AI_ANALYSIS=invalid  # Uses default value
VITE_ENABLE_AI_ANALYSIS=         # Uses default value
```

## Usage

### Basic Usage

```typescript
import { getConfig, validateConfig, isAIEnabled } from '@/lib/config';

// Get full configuration
const config = getConfig();

// Validate configuration
const validation = validateConfig(config);
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}

// Check specific features
if (isAIEnabled()) {
  // Use AI features
}
```

### Helper Functions

```typescript
import { 
  getGitHubConfig, 
  getRecommendationsConfig,
  isAIEnabled 
} from '@/lib/config';

// Get GitHub configuration
const githubConfig = getGitHubConfig();
console.log('GitHub token:', githubConfig.token);

// Get recommendations configuration
const recommendationsConfig = getRecommendationsConfig();
console.log('Top K:', recommendationsConfig.topK);

// Check if AI is enabled
if (isAIEnabled()) {
  console.log('AI features are enabled');
}
```

## Validation

### Configuration Validation

The system provides comprehensive validation for:

1. **Supabase Configuration**
   - URL format validation (must contain "supabase.co")
   - Anonymous key format validation (must be JWT token)

2. **GitHub Token Validation**
   - Format validation (must start with "ghp_" or "github_pat_")
   - Optional field (not required for basic functionality)

3. **Security Checks**
   - Default admin password detection in production
   - Environment-specific validation

### Validation Examples

```typescript
import { getConfig, validateConfig } from '@/lib/config';

const config = getConfig();
const validation = validateConfig(config);

if (!validation.isValid) {
  console.error('Configuration errors:');
  validation.errors.forEach(error => console.error(`- ${error}`));
}
```

### Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Supabase URL is required` | Missing `VITE_SUPABASE_URL` | Set the environment variable |
| `Supabase URL format appears invalid` | URL doesn't contain "supabase.co" | Use correct Supabase URL format |
| `Supabase anon key is required` | Missing `VITE_SUPABASE_ANON_KEY` | Set the environment variable |
| `Supabase anon key format appears invalid` | Key doesn't start with "eyJ" | Use correct JWT token format |
| `GitHub token format appears invalid` | Token doesn't start with "ghp_" or "github_pat_" | Use correct GitHub token format |
| `Default admin password detected in production` | Using "admin123" in production | Set a secure password |

## Testing

### Test Coverage

The configuration system includes comprehensive tests covering:

1. **Boolean Environment Variable Handling**
   - Undefined values
   - Truthy values (`'true'`, `'1'`, `'yes'`, `'on'`)
   - Falsy values (`'false'`, `'0'`, `'no'`, `'off'`)
   - Invalid values (fallback to defaults)
   - Case sensitivity

2. **Configuration Structure**
   - Interface compliance
   - Type validation
   - Required properties

3. **Validation Logic**
   - Correct configuration validation
   - Missing required fields
   - Invalid format detection
   - Optional field handling

4. **Numeric Parsing**
   - Valid number parsing
   - Invalid input handling
   - Default value fallback

### Running Tests

```bash
# Run configuration tests
npm test -- test/lib/config.simple.test.ts

# Run all tests
npm test
```

### Test Examples

```typescript
describe('Boolean Environment Variable Helper', () => {
  it('should handle truthy values', () => {
    expect(getBooleanEnv('true', false)).toBe(true);
    expect(getBooleanEnv('1', false)).toBe(true);
    expect(getBooleanEnv('yes', false)).toBe(true);
    expect(getBooleanEnv('on', false)).toBe(true);
  });

  it('should handle falsy values', () => {
    expect(getBooleanEnv('false', true)).toBe(false);
    expect(getBooleanEnv('0', true)).toBe(false);
    expect(getBooleanEnv('no', true)).toBe(false);
    expect(getBooleanEnv('off', true)).toBe(false);
  });
});
```

## Environment Setup

### Development

Create a `.env.local` file in your project root:

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional
VITE_GITHUB_TOKEN=ghp_your_token_here
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0

# Feature toggles
VITE_ENABLE_AI_ANALYSIS=true
VITE_ENABLE_WORKFLOW_SEARCH=true
VITE_ENABLE_AGENT_RECOMMENDATIONS=true
VITE_RECOMMENDATIONS_ENABLE_LLM=true
VITE_RECOMMENDATIONS_ENABLE_CACHE=true
VITE_RECOMMENDATIONS_TOP_K=6
VITE_RECOMMENDATIONS_LLM_TIMEOUT_MS=3000
VITE_RECOMMENDATIONS_CACHE_TTL_MINUTES=60
```

### Production

Set environment variables in your deployment platform:

```bash
# Vercel
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GITHUB_TOKEN
# ... etc

# Netlify
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# ... etc
```

## Migration from Old System

### Before (Problematic)

```typescript
// Old problematic pattern
enableAiAnalysis: import.meta.env.VITE_ENABLE_AI_ANALYSIS === 'true' || true,
```

### After (Fixed)

```typescript
// New proper pattern
enableAiAnalysis: getBooleanEnv('VITE_ENABLE_AI_ANALYSIS', true),
```

### Key Changes

1. **No More `|| true` Anti-patterns**: All boolean environment variables now use proper parsing
2. **Consistent Default Values**: Clear, predictable default values
3. **Better Error Handling**: Invalid values fall back to defaults instead of causing issues
4. **Comprehensive Testing**: Full test coverage for all configuration logic

## Troubleshooting

### Common Issues

1. **Configuration not loading**: Check if environment variables are properly set
2. **Boolean values not working**: Ensure you're using supported formats (`'true'`, `'false'`, etc.)
3. **Validation errors**: Check the error messages and fix the corresponding environment variables
4. **Default values not working**: Verify that the environment variable is not set to an invalid value

### Debug Mode

```typescript
import { getConfig, validateConfig } from '@/lib/config';

// Debug configuration
const config = getConfig();
console.log('Configuration:', config);

// Debug validation
const validation = validateConfig(config);
console.log('Validation:', validation);
```

## Performance Considerations

- **Lazy Loading**: Configuration is loaded only when needed
- **Caching**: Configuration is cached after first load
- **Minimal Dependencies**: No external dependencies for configuration
- **Fast Validation**: Validation is performed synchronously

## Security Considerations

- **Client-Side Variables**: All `VITE_*` variables are visible to clients
- **Sensitive Data**: Don't put sensitive data in `VITE_*` variables
- **Production Validation**: Additional security checks for production environment
- **Token Validation**: Format validation for API tokens

## Future Enhancements

1. **Runtime Configuration**: Support for runtime configuration changes
2. **Configuration Profiles**: Different configurations for different environments
3. **Configuration UI**: Web interface for managing configuration
4. **Configuration Validation**: More sophisticated validation rules
5. **Configuration Monitoring**: Track configuration usage and performance
