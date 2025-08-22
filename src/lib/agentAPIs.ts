// Agent APIs Integration
// LangChain Hub: https://api.smith.langchain.com/
// Hugging Face Agents: https://huggingface.co/docs/huggingface_hub/guides/agents

export interface AgentAPI {
  id: string;
  name: string;
  description: string;
  provider: 'langchain' | 'huggingface' | 'openai' | 'anthropic';
  capabilities: string[];
  pricing?: {
    type: 'free' | 'per-token' | 'subscription';
    cost?: number;
    unit?: string;
  };
  source: string;
  tags: string[];
  lastUpdated: string;
  usage: number;
  rating?: number;
}

export interface LangChainAgent {
  id: string;
  name: string;
  description: string;
  tags: string[];
  owner: string;
  created_at: string;
  updated_at: string;
  likes: number;
  downloads: number;
}

export interface HuggingFaceAgent {
  id: string;
  name: string;
  description: string;
  tags: string[];
  author: string;
  last_modified: string;
  downloads: number;
  likes: number;
}

// LangChain Hub API
export const fetchLangChainAgents = async (): Promise<AgentAPI[]> => {
  try {
    // LangChain Hub API endpoint
    const response = await fetch('https://api.smith.langchain.com/repos?limit=50&sort=downloads');
    
    if (!response.ok) {
      throw new Error(`LangChain API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.repos
      .filter((repo: any) => repo.tags?.some((tag: string) => 
        tag.toLowerCase().includes('agent') || 
        tag.toLowerCase().includes('assistant') ||
        tag.toLowerCase().includes('automation')
      ))
      .map((repo: LangChainAgent): AgentAPI => ({
        id: `langchain-${repo.id}`,
        name: repo.name,
        description: repo.description || 'LangChain Agent',
        provider: 'langchain',
        capabilities: repo.tags || [],
        pricing: { type: 'free' },
        source: `https://smith.langchain.com/hub/${repo.owner}/${repo.name}`,
        tags: repo.tags || [],
        lastUpdated: repo.updated_at,
        usage: repo.downloads,
        rating: repo.likes > 0 ? (repo.likes / repo.downloads) * 5 : undefined
      }));
  } catch (error) {
    console.error('Error fetching LangChain agents:', error);
    return [];
  }
};

// Hugging Face Agents API
export const fetchHuggingFaceAgents = async (): Promise<AgentAPI[]> => {
  try {
    // Hugging Face API for agents
    const response = await fetch('https://huggingface.co/api/models?search=agent&sort=downloads&direction=-1&limit=50');
    
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data
      .filter((model: any) => 
        model.tags?.some((tag: string) => 
          tag.toLowerCase().includes('agent') || 
          tag.toLowerCase().includes('assistant') ||
          tag.toLowerCase().includes('automation')
        )
      )
      .map((model: HuggingFaceAgent): AgentAPI => ({
        id: `huggingface-${model.id}`,
        name: model.name,
        description: model.description || 'Hugging Face Agent',
        provider: 'huggingface',
        capabilities: model.tags || [],
        pricing: { type: 'free' },
        source: `https://huggingface.co/${model.author}/${model.name}`,
        tags: model.tags || [],
        lastUpdated: model.last_modified,
        usage: model.downloads,
        rating: model.likes > 0 ? (model.likes / model.downloads) * 5 : undefined
      }));
  } catch (error) {
    console.error('Error fetching Hugging Face agents:', error);
    return [];
  }
};

// OpenAI GPTs (limited - no public API for listing)
export const fetchOpenAIGPTs = async (): Promise<AgentAPI[]> => {
  // Note: OpenAI doesn't provide public API to list all GPTs
  // This would require manual curation or user-provided GPT IDs
  return [
    {
      id: 'openai-gpt-4',
      name: 'GPT-4 Assistant',
      description: 'Advanced AI assistant for complex tasks',
      provider: 'openai',
      capabilities: ['text-generation', 'code-analysis', 'problem-solving'],
      pricing: { type: 'per-token', cost: 0.03, unit: 'per 1K tokens' },
      source: 'https://platform.openai.com/docs/models/gpt-4',
      tags: ['text-generation', 'code', 'analysis'],
      lastUpdated: new Date().toISOString(),
      usage: 1000000,
      rating: 4.8
    },
    {
      id: 'openai-gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient AI assistant',
      provider: 'openai',
      capabilities: ['text-generation', 'conversation'],
      pricing: { type: 'per-token', cost: 0.002, unit: 'per 1K tokens' },
      source: 'https://platform.openai.com/docs/models/gpt-3-5-turbo',
      tags: ['text-generation', 'conversation'],
      lastUpdated: new Date().toISOString(),
      usage: 5000000,
      rating: 4.5
    }
  ];
};

// Anthropic Claude (limited - no public API)
export const fetchAnthropicAgents = async (): Promise<AgentAPI[]> => {
  return [
    {
      id: 'anthropic-claude-3-opus',
      name: 'Claude 3 Opus',
      description: 'Most capable Claude model for complex tasks',
      provider: 'anthropic',
      capabilities: ['text-generation', 'analysis', 'reasoning'],
      pricing: { type: 'per-token', cost: 0.015, unit: 'per 1K tokens' },
      source: 'https://docs.anthropic.com/en/docs/models-overview',
      tags: ['text-generation', 'analysis', 'reasoning'],
      lastUpdated: new Date().toISOString(),
      usage: 800000,
      rating: 4.9
    },
    {
      id: 'anthropic-claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance and speed',
      provider: 'anthropic',
      capabilities: ['text-generation', 'analysis'],
      pricing: { type: 'per-token', cost: 0.003, unit: 'per 1K tokens' },
      source: 'https://docs.anthropic.com/en/docs/models-overview',
      tags: ['text-generation', 'analysis'],
      lastUpdated: new Date().toISOString(),
      usage: 1200000,
      rating: 4.7
    }
  ];
};

// Main function to fetch all available agents
export const fetchAllAgents = async (): Promise<AgentAPI[]> => {
  try {
    const [langChainAgents, huggingFaceAgents, openAIAgents, anthropicAgents] = await Promise.allSettled([
      fetchLangChainAgents(),
      fetchHuggingFaceAgents(),
      fetchOpenAIGPTs(),
      fetchAnthropicAgents()
    ]);

    const allAgents: AgentAPI[] = [];

    if (langChainAgents.status === 'fulfilled') {
      allAgents.push(...langChainAgents.value);
    }

    if (huggingFaceAgents.status === 'fulfilled') {
      allAgents.push(...huggingFaceAgents.value);
    }

    if (openAIAgents.status === 'fulfilled') {
      allAgents.push(...openAIAgents.value);
    }

    if (anthropicAgents.status === 'fulfilled') {
      allAgents.push(...anthropicAgents.value);
    }

    // Sort by usage/rating
    return allAgents.sort((a, b) => (b.usage || 0) - (a.usage || 0));
  } catch (error) {
    console.error('Error fetching all agents:', error);
    return [];
  }
};

// Filter agents by capabilities
export const filterAgentsByCapabilities = (agents: AgentAPI[], capabilities: string[]): AgentAPI[] => {
  return agents.filter(agent => 
    capabilities.some(cap => 
      agent.capabilities.some(agentCap => 
        agentCap.toLowerCase().includes(cap.toLowerCase())
      )
    )
  );
};

// Search agents by name or description
export const searchAgents = (agents: AgentAPI[], query: string): AgentAPI[] => {
  const lowerQuery = query.toLowerCase();
  return agents.filter(agent => 
    agent.name.toLowerCase().includes(lowerQuery) ||
    agent.description.toLowerCase().includes(lowerQuery) ||
    agent.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// Get agent statistics
export const getAgentStats = (agents: AgentAPI[]) => {
  const stats = {
    total: agents.length,
    byProvider: {} as Record<string, number>,
    byPricing: {} as Record<string, number>,
    topRated: agents.filter(a => a.rating && a.rating > 4.5).length,
    mostUsed: agents.filter(a => a.usage && a.usage > 10000).length
  };

  agents.forEach(agent => {
    stats.byProvider[agent.provider] = (stats.byProvider[agent.provider] || 0) + 1;
    const pricingType = agent.pricing?.type || 'unknown';
    stats.byPricing[pricingType] = (stats.byPricing[pricingType] || 0) + 1;
  });

  return stats;
};
