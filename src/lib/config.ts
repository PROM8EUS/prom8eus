/**
 * Application Configuration
 * Centralized configuration management for API keys and environment variables
 */

export interface AppConfig {
  openai: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
  };
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
 */
export const getConfig = (): AppConfig => {
  // Get API key from environment variables
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const githubToken = import.meta.env.VITE_GITHUB_TOKEN;

  return {
    openai: {
      apiKey: openaiApiKey,
      baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
    },
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
      llmTimeoutMs: parseInt(import.meta.env.VITE_RECOMMENDATIONS_LLM_TIMEOUT_MS || '5000'),
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

  // OpenAI API Key validation
  if (!config.openai.apiKey) {
    errors.push('OpenAI API key is required (VITE_OPENAI_API_KEY)');
  } else if (!config.openai.apiKey.startsWith('sk-')) {
    errors.push('OpenAI API key format appears invalid (should start with "sk-")');
  }

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
 * Get OpenAI configuration specifically
 */
export const getOpenAIConfig = () => {
  const config = getConfig();
  return config.openai;
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
 */
export const isAIEnabled = (): boolean => {
  const config = getConfig();
  return config.features.enableAiAnalysis && !!config.openai.apiKey;
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
