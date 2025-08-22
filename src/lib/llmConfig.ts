// LLM Configuration - Central control for LLM usage
export interface LLMConfig {
  enabled: boolean;
  provider: 'openai' | 'anthropic' | 'fallback';
  rateLimit: {
    enabled: boolean;
    delayMs: number;
    maxRequestsPerMinute: number;
  };
  fallback: {
    useSimulation: boolean;
    useRuleBasedAnalysis: boolean;
  };
  debug: boolean;
}

// Default configuration
const defaultConfig: LLMConfig = {
  enabled: false, // Disabled by default - use pattern-based analysis
  provider: 'openai',
  rateLimit: {
    enabled: true,
    delayMs: 2000, // 2 seconds between requests
    maxRequestsPerMinute: 3 // OpenAI free tier limit
  },
  fallback: {
    useSimulation: true, // Use simulated LLM response when API fails
    useRuleBasedAnalysis: true // Use original rule-based analysis as fallback
  },
  debug: true // Enable detailed logging
};

// Global LLM configuration
let currentConfig: LLMConfig = { ...defaultConfig };

// Configuration management
export const LLMConfigManager = {
  // Get current configuration
  getConfig(): LLMConfig {
    return { ...currentConfig };
  },

  // Update configuration
  updateConfig(newConfig: Partial<LLMConfig>): void {
    currentConfig = { ...currentConfig, ...newConfig };
    console.log('🔧 LLM Config updated:', currentConfig);
  },

  // Quick toggles
  enableLLM(): void {
    currentConfig.enabled = true;
    console.log('✅ LLM enabled');
  },

  disableLLM(): void {
    currentConfig.enabled = false;
    console.log('❌ LLM disabled - using fallback only');
  },

  enableRateLimit(): void {
    currentConfig.rateLimit.enabled = true;
    console.log('⏱️ Rate limiting enabled');
  },

  disableRateLimit(): void {
    currentConfig.rateLimit.enabled = false;
    console.log('🚀 Rate limiting disabled');
  },

  // Environment-based configuration
  configureForEnvironment(env: 'development' | 'production' | 'testing'): void {
    switch (env) {
      case 'development':
        this.updateConfig({
          enabled: true,
          rateLimit: {
            enabled: true,
            delayMs: 1000,
            maxRequestsPerMinute: 5
          },
          debug: true
        });
        break;
      case 'production':
        this.updateConfig({
          enabled: true,
          rateLimit: {
            enabled: true,
            delayMs: 500,
            maxRequestsPerMinute: 60
          },
          debug: false
        });
        break;
      case 'testing':
        this.updateConfig({
          enabled: false, // Disable LLM for faster tests
          fallback: {
            useSimulation: true,
            useRuleBasedAnalysis: true
          },
          debug: false
        });
        break;
    }
  },

  // Cost control
  enableCostSavingMode(): void {
    this.updateConfig({
      enabled: false, // Disable LLM to save costs
      fallback: {
        useSimulation: true,
        useRuleBasedAnalysis: true
      }
    });
    console.log('💰 Cost saving mode enabled - LLM disabled');
  }
};

// Rate limiting tracker
class RateLimiter {
  private requestTimes: number[] = [];

  canMakeRequest(): boolean {
    const config = LLMConfigManager.getConfig();
    if (!config.rateLimit.enabled) return true;

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove old requests
    this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
    
    return this.requestTimes.length < config.rateLimit.maxRequestsPerMinute;
  }

  recordRequest(): void {
    this.requestTimes.push(Date.now());
  }

  getDelayMs(): number {
    const config = LLMConfigManager.getConfig();
    return config.rateLimit.delayMs;
  }

  getTimeUntilNextRequest(): number {
    if (this.requestTimes.length === 0) return 0;
    
    const config = LLMConfigManager.getConfig();
    const lastRequest = Math.max(...this.requestTimes);
    const timeSinceLastRequest = Date.now() - lastRequest;
    
    return Math.max(0, config.rateLimit.delayMs - timeSinceLastRequest);
  }
}

export const rateLimiter = new RateLimiter();

// Browser console helpers (for debugging)
if (typeof window !== 'undefined') {
  (window as any).LLM = {
    enable: () => LLMConfigManager.enableLLM(),
    disable: () => LLMConfigManager.disableLLM(),
    config: () => LLMConfigManager.getConfig(),
    costSaving: () => LLMConfigManager.enableCostSavingMode(),
    development: () => LLMConfigManager.configureForEnvironment('development'),
    production: () => LLMConfigManager.configureForEnvironment('production'),
    testing: () => LLMConfigManager.configureForEnvironment('testing')
  };
  
  console.log('🛠️ LLM Console Commands available:');
  console.log('  LLM.enable()     - Enable LLM');
  console.log('  LLM.disable()    - Disable LLM');
  console.log('  LLM.config()     - Show current config');
  console.log('  LLM.costSaving() - Enable cost saving mode');
}
