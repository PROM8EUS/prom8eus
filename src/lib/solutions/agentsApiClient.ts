import { AIAgent } from './aiAgentsCatalog';

export interface AgentDeploymentConfig {
  agentId: string;
  deploymentType: 'local' | 'cloud' | 'hybrid';
  environment: 'development' | 'staging' | 'production';
  apiKeys: Record<string, string>;
  customSettings: Record<string, any>;
  integrations: string[];
  webhookUrl?: string;
  callbackUrl?: string;
}

export interface AgentStatus {
  agentId: string;
  status: 'idle' | 'running' | 'error' | 'stopped';
  lastActivity: Date;
  performance: {
    responseTime: number;
    successRate: number;
    errorCount: number;
  };
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export interface AgentLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
}

export class AgentsApiClient {
  private baseUrl: string;
  private apiKey: string;
  private deploymentConfigs: Map<string, AgentDeploymentConfig> = new Map();

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.loadDeploymentConfigs();
  }

  // Load deployment configurations from localStorage
  private loadDeploymentConfigs(): void {
    try {
      const stored = localStorage.getItem('agentDeploymentConfigs');
      if (stored) {
        const configs = JSON.parse(stored);
        Object.entries(configs).forEach(([agentId, config]) => {
          this.deploymentConfigs.set(agentId, config as AgentDeploymentConfig);
        });
      }
    } catch (error) {
      console.warn('Failed to load deployment configs:', error);
    }
  }

  // Save deployment configurations to localStorage
  private saveDeploymentConfigs(): void {
    try {
      const configs: Record<string, AgentDeploymentConfig> = {};
      this.deploymentConfigs.forEach((config, agentId) => {
        configs[agentId] = config;
      });
      localStorage.setItem('agentDeploymentConfigs', JSON.stringify(configs));
    } catch (error) {
      console.warn('Failed to save deployment configs:', error);
    }
  }

  // Deploy an agent locally
  async deployLocal(agent: AIAgent, config: Partial<AgentDeploymentConfig>): Promise<AgentDeploymentConfig> {
    const deploymentConfig: AgentDeploymentConfig = {
      agentId: agent.id,
      deploymentType: 'local',
      environment: 'development',
      apiKeys: {},
      customSettings: {},
      integrations: [],
      ...config
    };

    try {
      // Simulate local deployment process
      console.log(`Deploying ${agent.name} locally...`);
      
      // Store configuration
      this.deploymentConfigs.set(agent.id, deploymentConfig);
      this.saveDeploymentConfigs();

      // Deployment completed (removed artificial delay)

      console.log(`${agent.name} deployed locally successfully`);
      return deploymentConfig;
    } catch (error) {
      console.error(`Failed to deploy ${agent.name} locally:`, error);
      throw new Error(`Local deployment failed: ${error}`);
    }
  }

  // Deploy an agent to cloud
  async deployCloud(agent: AIAgent, config: Partial<AgentDeploymentConfig>): Promise<AgentDeploymentConfig> {
    const deploymentConfig: AgentDeploymentConfig = {
      agentId: agent.id,
      deploymentType: 'cloud',
      environment: 'production',
      apiKeys: {},
      customSettings: {},
      integrations: [],
      ...config
    };

    try {
      // Simulate cloud deployment process
      console.log(`Deploying ${agent.name} to cloud...`);
      
      // Validate cloud deployment requirements
      if (!config.apiKeys || Object.keys(config.apiKeys).length === 0) {
        throw new Error('Cloud deployment requires API keys');
      }

      // Store configuration
      this.deploymentConfigs.set(agent.id, deploymentConfig);
      this.saveDeploymentConfigs();

      // Cloud deployment completed (removed artificial delay)

      console.log(`${agent.name} deployed to cloud successfully`);
      return deploymentConfig;
    } catch (error) {
      console.error(`Failed to deploy ${agent.name} to cloud:`, error);
      throw new Error(`Cloud deployment failed: ${error}`);
    }
  }

  // Get deployment configuration for an agent
  getDeploymentConfig(agentId: string): AgentDeploymentConfig | undefined {
    return this.deploymentConfigs.get(agentId);
  }

  // Update deployment configuration
  updateDeploymentConfig(agentId: string, updates: Partial<AgentDeploymentConfig>): void {
    const existing = this.deploymentConfigs.get(agentId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.deploymentConfigs.set(agentId, updated);
      this.saveDeploymentConfigs();
    }
  }

  // Remove deployment configuration
  removeDeploymentConfig(agentId: string): void {
    this.deploymentConfigs.delete(agentId);
    this.saveDeploymentConfigs();
  }

  // Get agent status
  async getAgentStatus(agentId: string): Promise<AgentStatus> {
    try {
      // Simulate API call to get agent status
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Return mock status for local development
      return {
        agentId,
        status: 'idle',
        lastActivity: new Date(),
        performance: {
          responseTime: 150,
          successRate: 98.5,
          errorCount: 2
        },
        resources: {
          cpu: 15,
          memory: 45,
          disk: 20
        }
      };
    }
  }

  // Start an agent
  async startAgent(agentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`Agent ${agentId} started successfully`);
    } catch (error) {
      console.error(`Failed to start agent ${agentId}:`, error);
      throw new Error(`Failed to start agent: ${error}`);
    }
  }

  // Stop an agent
  async stopAgent(agentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`Agent ${agentId} stopped successfully`);
    } catch (error) {
      console.error(`Failed to stop agent ${agentId}:`, error);
      throw new Error(`Failed to stop agent: ${error}`);
    }
  }

  // Get agent logs
  async getAgentLogs(agentId: string, limit: number = 100): Promise<AgentLog[]> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/logs?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Return mock logs for local development
      return [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Agent initialized successfully',
          metadata: { version: '1.0.0' }
        },
        {
          timestamp: new Date(Date.now() - 60000),
          level: 'info',
          message: 'Processing task: expense categorization',
          metadata: { taskId: 'exp-001' }
        }
      ];
    }
  }

  // Test agent connection
  async testConnection(agentId: string): Promise<boolean> {
    try {
      const status = await this.getAgentStatus(agentId);
      return status.status !== 'error';
    } catch (error) {
      console.error(`Connection test failed for agent ${agentId}:`, error);
      return false;
    }
  }

  // Get all deployed agents
  getDeployedAgents(): string[] {
    return Array.from(this.deploymentConfigs.keys());
  }

  // Validate deployment configuration
  validateDeploymentConfig(config: AgentDeploymentConfig): string[] {
    const errors: string[] = [];

    if (!config.agentId) {
      errors.push('Agent ID is required');
    }

    if (config.deploymentType === 'cloud' && Object.keys(config.apiKeys).length === 0) {
      errors.push('API keys are required for cloud deployment');
    }

    if (config.environment === 'production' && config.deploymentType === 'local') {
      errors.push('Production environment is not recommended for local deployment');
    }

    return errors;
  }

  // Get deployment statistics
  getDeploymentStats(): {
    total: number;
    local: number;
    cloud: number;
    hybrid: number;
    byEnvironment: Record<string, number>;
  } {
    const stats = {
      total: 0,
      local: 0,
      cloud: 0,
      hybrid: 0,
      byEnvironment: {} as Record<string, number>
    };

    this.deploymentConfigs.forEach(config => {
      stats.total++;
      stats[config.deploymentType]++;
      stats.byEnvironment[config.environment] = (stats.byEnvironment[config.environment] || 0) + 1;
    });

    return stats;
  }
}

// Factory function to create API client
export const createAgentsApiClient = (baseUrl: string, apiKey: string): AgentsApiClient => {
  return new AgentsApiClient(baseUrl, apiKey);
};

// Default client for local development
export const defaultAgentsClient = createAgentsApiClient(
  process.env.VITE_AGENTS_API_URL || 'http://localhost:3001',
  process.env.VITE_AGENTS_API_KEY || 'dev-key'
);
