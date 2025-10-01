/**
 * Application Configuration
 * Centralized configuration management for API keys and environment variables
 * NOTE: OpenAI API key is now stored securely on the backend only
 */

export interface AppConfig {
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

/**
 * Get configuration from environment variables with fallbacks
 * NOTE: OpenAI API key is now handled securely on the backend only
 */
export const getConfig = (): AppConfig => {
  const githubToken = import.meta.env.VITE_GITHUB_TOKEN;

  return {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    github: {
      token: githubToken,
      baseUrl: 'https://api.github.com',
    },
    app: {
      env: import.meta.env.VITE_APP_ENV || 'development',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    },
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
      n8nUrl: import.meta.env.VITE_N8N_API_URL || 'https://api.github.com',
    },
    features: {
      enableAiAnalysis: import.meta.env.VITE_ENABLE_AI_ANALYSIS === 'true' || true,
      enableWorkflowSearch: import.meta.env.VITE_ENABLE_WORKFLOW_SEARCH === 'true' || true,
      enableAgentRecommendations: import.meta.env.VITE_ENABLE_AGENT_RECOMMENDATIONS === 'true' || true,
    },
    recommendations: {
      enableLLM: import.meta.env.VITE_RECOMMENDATIONS_ENABLE_LLM === 'true' || true,
      topK: parseInt(import.meta.env.VITE_RECOMMENDATIONS_TOP_K || '6'),
      llmTimeoutMs: parseInt(import.meta.env.VITE_RECOMMENDATIONS_LLM_TIMEOUT_MS || '3000'),
      enableCache: import.meta.env.VITE_RECOMMENDATIONS_ENABLE_CACHE === 'true' || true,
      cacheTTLMinutes: parseInt(import.meta.env.VITE_RECOMMENDATIONS_CACHE_TTL_MINUTES || '60'),
    },
  };
};

/**
 * Validate that required configuration is present
 */
export const validateConfig = (config: AppConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // OpenAI is now handled securely on the backend - no client-side validation needed

  // Supabase configuration validation
  if (!config.supabase.url) {
    errors.push('Supabase URL is required (VITE_SUPABASE_URL)');
  } else if (!config.supabase.url.includes('supabase.co')) {
    errors.push('Supabase URL format appears invalid (should contain "supabase.co")');
  }

  if (!config.supabase.anonKey) {
    errors.push('Supabase anon key is required (VITE_SUPABASE_ANON_KEY)');
  } else if (!config.supabase.anonKey.startsWith('eyJ')) {
    errors.push('Supabase anon key format appears invalid (should be a JWT token)');
  }

  // GitHub token validation (optional but format check if provided)
  if (config.github.token && !config.github.token.startsWith('ghp_') && !config.github.token.startsWith('github_pat_')) {
    errors.push('GitHub token format appears invalid (should start with "ghp_" or "github_pat_")');
  }

  // Admin password validation (security check)
  if (config.app.env === 'production' && import.meta.env.VITE_ADMIN_PASSWORD === 'admin123') {
    errors.push('Default admin password detected in production environment - please set a secure password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get GitHub configuration specifically
 */
export const getGitHubConfig = () => {
  const config = getConfig();
  return config.github;
};

/**
 * Check if AI features are enabled
 * AI is always available through secure backend
 */
export const isAIEnabled = (): boolean => {
  const config = getConfig();
  return config.features.enableAiAnalysis;
};

/**
 * Get recommendations configuration specifically
 */
export const getRecommendationsConfig = () => {
  const config = getConfig();
  return config.recommendations;
};

// Export the configuration instance
export const config = getConfig();
export const isConfigValid = validateConfig(config);