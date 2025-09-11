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
}

/**
 * Get configuration from environment variables with fallbacks
 */
export const getConfig = (): AppConfig => {
  // Get API key from environment variables
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const githubToken = import.meta.env.VITE_GITHUB_TOKEN || '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';

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
  };
};

/**
 * Validate that required configuration is present
 */
export const validateConfig = (config: AppConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.openai.apiKey) {
    errors.push('OpenAI API key is required');
  }

  if (config.openai.apiKey && !config.openai.apiKey.startsWith('sk-')) {
    errors.push('OpenAI API key format appears invalid');
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


// Export the configuration instance
export const config = getConfig();
export const isConfigValid = validateConfig(config);
