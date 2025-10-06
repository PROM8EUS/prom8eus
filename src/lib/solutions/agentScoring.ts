import { AgentIndex } from '../schemas/agentIndex';

export type AgentTier = 'Generalist' | 'Specialist' | 'Experimental';

export interface AgentScore {
  agentId: string;
  tier: AgentTier;
  capabilityScore: number; // 0-100
  domainScore: number; // 0-100
  overallScore: number; // 0-100
  scoreBreakdown: AgentScoreBreakdown;
  reasoning: string[];
  confidence: number; // 0-100
  disclaimer: string;
}

export interface AgentScoreBreakdown {
  capabilityCoverage: number;
  domainAlignment: number;
  capabilityDepth: number;
  domainBreadth: number;
  dataQuality: number;
  modelQuality: number;
  providerReliability: number;
  capabilitySpecialization: number;
}

export interface AgentScoringContext {
  userQuery?: string;
  businessDomain?: string;
  requiredCapabilities?: string[];
  preferredDomains?: string[];
  complexityPreference?: 'Low' | 'Medium' | 'High';
  reliabilityPreference?: 'High' | 'Medium' | 'Low';
}

export interface AgentScoringCriteria {
  tierThresholds: {
    generalist: number; // Score threshold for Generalist tier
    specialist: number; // Score threshold for Specialist tier
    experimental: number; // Score threshold for Experimental tier
  };
  weights: {
    capabilityCoverage: number;
    domainAlignment: number;
    capabilityDepth: number;
    domainBreadth: number;
    dataQuality: number;
    modelQuality: number;
    providerReliability: number;
  };
  boostFactors: {
    coreCapabilities: number;
    multipleDomains: number;
    highQualityModel: number;
    reliableProvider: number;
    comprehensiveData: number;
  };
}

export class AgentScoring {
  private defaultCriteria: AgentScoringCriteria = {
    tierThresholds: {
      generalist: 85, // Very high capability + domain coverage
      specialist: 70, // Good capability + domain coverage
      experimental: 50 // Lower capability + domain coverage
    },
    weights: {
      capabilityCoverage: 0.25,
      domainAlignment: 0.20,
      capabilityDepth: 0.15,
      domainBreadth: 0.10,
      dataQuality: 0.15,
      modelQuality: 0.10,
      providerReliability: 0.05
    },
    boostFactors: {
      coreCapabilities: 1.2,
      multipleDomains: 1.15,
      highQualityModel: 1.1,
      reliableProvider: 1.1,
      comprehensiveData: 1.05
    }
  };

  // Core capabilities that indicate high-quality agents
  private coreCapabilities = ['web_search', 'data_analysis', 'file_io', 'email_send'];
  
  // High-quality models
  private highQualityModels = ['gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet', 'gemini-pro'];
  
  // Reliable providers
  private reliableProviders = ['openai', 'anthropic', 'google', 'microsoft'];

  constructor(private customCriteria?: Partial<AgentScoringCriteria>) {
    if (customCriteria) {
      this.defaultCriteria = { ...this.defaultCriteria, ...customCriteria };
    }
  }

  /**
   * Calculate comprehensive score and tier for an agent
   */
  calculateAgentScore(
    agent: AgentIndex,
    context: AgentScoringContext = {}
  ): AgentScore {
    const breakdown = this.calculateScoreBreakdown(agent, context);
    
    // Calculate individual component scores
    const capabilityScore = this.calculateCapabilityScore(agent, context);
    const domainScore = this.calculateDomainScore(agent, context);

    // Calculate weighted overall score
    const weights = this.defaultCriteria.weights;
    const overallScore = Math.round(
      capabilityScore * weights.capabilityCoverage +
      domainScore * weights.domainAlignment +
      breakdown.capabilityDepth * weights.capabilityDepth +
      breakdown.domainBreadth * weights.domainBreadth +
      breakdown.dataQuality * weights.dataQuality +
      breakdown.modelQuality * weights.modelQuality +
      breakdown.providerReliability * weights.providerReliability
    );

    // Apply boost factors
    const boostedScore = this.applyBoostFactors(agent, overallScore, breakdown);

    // Determine tier based on score
    const tier = this.determineTier(boostedScore);

    // Generate reasoning
    const reasoning = this.generateReasoning(agent, context, {
      capabilityScore,
      domainScore,
      overallScore: boostedScore,
      tier
    });

    // Calculate confidence
    const confidence = this.calculateConfidence(agent, breakdown);

    // Generate disclaimer
    const disclaimer = this.generateDisclaimer(tier, agent);

    return {
      agentId: agent.id,
      tier,
      capabilityScore,
      domainScore,
      overallScore: boostedScore,
      scoreBreakdown: breakdown,
      reasoning,
      confidence,
      disclaimer
    };
  }

  /**
   * Calculate detailed score breakdown
   */
  private calculateScoreBreakdown(
    agent: AgentIndex,
    context: AgentScoringContext
  ): AgentScoreBreakdown {
    return {
      capabilityCoverage: this.calculateCapabilityCoverageScore(agent, context),
      domainAlignment: this.calculateDomainAlignmentScore(agent, context),
      capabilityDepth: this.calculateCapabilityDepthScore(agent),
      domainBreadth: this.calculateDomainBreadthScore(agent),
      dataQuality: this.calculateDataQualityScore(agent),
      modelQuality: this.calculateModelQualityScore(agent),
      providerReliability: this.calculateProviderReliabilityScore(agent),
      capabilitySpecialization: this.calculateCapabilitySpecializationScore(agent)
    };
  }

  /**
   * Calculate capability matching score
   */
  private calculateCapabilityScore(
    agent: AgentIndex,
    context: AgentScoringContext
  ): number {
    if (!context.requiredCapabilities && !context.userQuery) {
      return 75; // Default score when no context
    }

    const capabilities = agent.capabilities || [];
    let score = 0;

    // Required capabilities matching
    if (context.requiredCapabilities && context.requiredCapabilities.length > 0) {
      const required = context.requiredCapabilities.map(c => c.toLowerCase());
      const matching = capabilities.filter(capability => 
        required.some(req => 
          capability.toLowerCase().includes(req) || 
          req.includes(capability.toLowerCase())
        )
      );
      score += (matching.length / required.length) * 60;
    }

    // User query capability matching
    if (context.userQuery) {
      const query = context.userQuery.toLowerCase();
      const queryWords = query.split(/\s+/).filter(word => word.length > 2);
      
      const capabilityMatches = capabilities.filter(capability => 
        queryWords.some(qWord => 
          capability.toLowerCase().includes(qWord) || 
          qWord.includes(capability.toLowerCase())
        )
      );
      
      if (capabilities.length > 0) {
        score += (capabilityMatches.length / capabilities.length) * 40;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate domain matching score
   */
  private calculateDomainScore(
    agent: AgentIndex,
    context: AgentScoringContext
  ): number {
    if (!context.businessDomain && !context.preferredDomains) {
      return 75; // Default score when no context
    }

    const domains = agent.domains || ['Other'];
    let score = 0;

    // Business domain matching
    if (context.businessDomain) {
      const domain = context.businessDomain.toLowerCase();
      const matching = domains.filter(d => 
        d.toLowerCase().includes(domain) || 
        domain.includes(d.toLowerCase())
      );
      if (matching.length > 0) {
        score += 50;
      } else {
        // Check for related domains
        const relatedDomains = this.getRelatedDomains(domain);
        const relatedMatches = domains.filter(d => 
          relatedDomains.some(rel => 
            d.toLowerCase().includes(rel) || rel.includes(d.toLowerCase())
          )
        );
        if (relatedMatches.length > 0) {
          score += 30;
        }
      }
    }

    // Preferred domains matching
    if (context.preferredDomains && context.preferredDomains.length > 0) {
      const preferred = context.preferredDomains.map(d => d.toLowerCase());
      const matching = domains.filter(domain => 
        preferred.some(pref => 
          domain.toLowerCase().includes(pref) || 
          pref.includes(domain.toLowerCase())
        )
      );
      score += (matching.length / preferred.length) * 50;
    }

    return Math.min(score, 100);
  }

  /**
   * Determine agent tier based on overall score
   */
  private determineTier(score: number): AgentTier {
    const thresholds = this.defaultCriteria.tierThresholds;
    
    if (score >= thresholds.generalist) {
      return 'Generalist';
    } else if (score >= thresholds.specialist) {
      return 'Specialist';
    } else {
      return 'Experimental';
    }
  }

  /**
   * Apply boost factors to the overall score
   */
  private applyBoostFactors(
    agent: AgentIndex,
    baseScore: number,
    breakdown: AgentScoreBreakdown
  ): number {
    let boostMultiplier = 1.0;
    const boostFactors = this.defaultCriteria.boostFactors;

    // Core capabilities boost
    const coreCapCount = (agent.capabilities || []).filter(cap => 
      this.coreCapabilities.includes(cap)
    ).length;
    if (coreCapCount >= 2) {
      boostMultiplier *= boostFactors.coreCapabilities;
    }

    // Multiple domains boost
    if ((agent.domains || []).length >= 2) {
      boostMultiplier *= boostFactors.multipleDomains;
    }

    // High-quality model boost
    if (agent.model && this.highQualityModels.includes(agent.model.toLowerCase())) {
      boostMultiplier *= boostFactors.highQualityModel;
    }

    // Reliable provider boost
    if (agent.provider && this.reliableProviders.includes(agent.provider.toLowerCase())) {
      boostMultiplier *= boostFactors.reliableProvider;
    }

    // Comprehensive data boost
    if (breakdown.dataQuality >= 80) {
      boostMultiplier *= boostFactors.comprehensiveData;
    }

    return Math.min(Math.round(baseScore * boostMultiplier), 100);
  }

  /**
   * Generate reasoning for the score and tier
   */
  private generateReasoning(
    agent: AgentIndex,
    context: AgentScoringContext,
    scores: {
      capabilityScore: number;
      domainScore: number;
      overallScore: number;
      tier: AgentTier;
    }
  ): string[] {
    const reasoning: string[] = [];

    // Tier reasoning
    if (scores.tier === 'Generalist') {
      reasoning.push(`Generalist agent (${scores.overallScore}/100) - broad capabilities across multiple domains`);
    } else if (scores.tier === 'Specialist') {
      reasoning.push(`Specialist agent (${scores.overallScore}/100) - focused capabilities in specific domains`);
    } else {
      reasoning.push(`Experimental agent (${scores.overallScore}/100) - emerging capabilities with potential`);
    }

    // Capability reasoning
    if (scores.capabilityScore >= 80) {
      reasoning.push(`Excellent capability match: ${(agent.capabilities || []).slice(0, 3).join(', ')}`);
    } else if (scores.capabilityScore >= 60) {
      reasoning.push(`Good capability coverage: ${(agent.capabilities || []).slice(0, 2).join(', ')}`);
    }

    // Domain reasoning
    if (scores.domainScore >= 80) {
      reasoning.push(`Strong domain alignment: ${(agent.domains || []).slice(0, 2).join(', ')}`);
    } else if (scores.domainScore >= 60) {
      reasoning.push(`Good domain coverage: ${(agent.domains || [])[0] || 'Other'}`);
    }

    // Model and provider reasoning
    if (agent.model && this.highQualityModels.includes(agent.model.toLowerCase())) {
      reasoning.push(`High-quality model: ${agent.model}`);
    }
    if (agent.provider && this.reliableProviders.includes(agent.provider.toLowerCase())) {
      reasoning.push(`Reliable provider: ${agent.provider}`);
    }

    // Core capabilities reasoning
    const coreCaps = (agent.capabilities || []).filter(cap => this.coreCapabilities.includes(cap));
    if (coreCaps.length >= 2) {
      reasoning.push(`Core capabilities present: ${coreCaps.join(', ')}`);
    }

    return reasoning;
  }

  /**
   * Generate disclaimer based on tier
   */
  private generateDisclaimer(tier: AgentTier, agent: AgentIndex): string {
    const baseDisclaimer = "Adaptive – outcomes may vary";
    
    if (tier === 'Experimental') {
      return `${baseDisclaimer} • Experimental capabilities`;
    } else if (tier === 'Specialist') {
      return `${baseDisclaimer} • Specialized use cases`;
    } else {
      return baseDisclaimer;
    }
  }

  /**
   * Calculate confidence in the score
   */
  private calculateConfidence(
    agent: AgentIndex,
    breakdown: AgentScoreBreakdown
  ): number {
    let confidence = 50; // Base confidence

    // Higher confidence for complete data
    if (agent.title && agent.summary) confidence += 20;
    if (agent.capabilities && agent.capabilities.length > 0) confidence += 15;
    if (agent.domains && agent.domains.length > 0) confidence += 10;
    if (agent.model) confidence += 10;
    if (agent.provider) confidence += 5;

    // Higher confidence for high-quality data
    if (breakdown.dataQuality >= 80) confidence += 10;
    if (breakdown.modelQuality >= 80) confidence += 10;
    if (breakdown.providerReliability >= 80) confidence += 5;

    return Math.max(0, Math.min(100, confidence));
  }

  // Helper methods for score calculations
  private calculateCapabilityCoverageScore(agent: AgentIndex, context: AgentScoringContext): number {
    return this.calculateCapabilityScore(agent, context);
  }

  private calculateDomainAlignmentScore(agent: AgentIndex, context: AgentScoringContext): number {
    return this.calculateDomainScore(agent, context);
  }

  private calculateCapabilityDepthScore(agent: AgentIndex): number {
    const capabilities = agent.capabilities || [];
    if (capabilities.length === 0) return 20;
    
    let score = 40; // Base score for having capabilities
    
    // Bonus for multiple capabilities (generalist indicator)
    if (capabilities.length >= 6) score += 30; // Generalist
    else if (capabilities.length >= 4) score += 20; // Good coverage
    else if (capabilities.length >= 2) score += 10; // Basic coverage

    // Bonus for core capabilities
    const coreCaps = capabilities.filter(cap => this.coreCapabilities.includes(cap));
    if (coreCaps.length >= 4) score += 20; // Generalist
    else if (coreCaps.length >= 2) score += 15; // Good core coverage
    else if (coreCaps.length >= 1) score += 10; // Some core capabilities

    // Penalty for too few capabilities (specialist indicator)
    if (capabilities.length <= 3) score -= 10;

    return Math.min(score, 100);
  }

  private calculateDomainBreadthScore(agent: AgentIndex): number {
    const domains = agent.domains || ['Other'];
    if (domains.length === 0) return 20;
    
    let score = 30; // Base score for having domains
    
    // Bonus for multiple domains (generalist indicator)
    if (domains.length >= 3) score += 40; // Generalist
    else if (domains.length >= 2) score += 25; // Good breadth
    else if (domains.length >= 1) score += 15; // Basic coverage

    // Penalty for "Other" domain only
    if (domains.length === 1 && domains[0] === 'Other') score -= 15;

    // Bonus for diverse domain coverage
    const nonOtherDomains = domains.filter(d => d !== 'Other');
    if (nonOtherDomains.length >= 2) score += 15;

    return Math.min(score, 100);
  }

  private calculateDataQualityScore(agent: AgentIndex): number {
    let score = 0;
    let factors = 0;

    if (agent.title && agent.title.length > 10) {
      score += 20;
      factors++;
    }
    if (agent.summary && agent.summary.length > 20) {
      score += 20;
      factors++;
    }
    if (agent.capabilities && agent.capabilities.length > 0) {
      score += 15;
      factors++;
    }
    if (agent.domains && agent.domains.length > 0) {
      score += 15;
      factors++;
    }
    if (agent.model) {
      score += 10;
      factors++;
    }
    if (agent.provider) {
      score += 10;
      factors++;
    }
    if (agent.link && agent.link !== '#') {
      score += 10;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors * 5) : 50;
  }

  private calculateModelQualityScore(agent: AgentIndex): number {
    if (!agent.model) return 50;
    
    const model = agent.model.toLowerCase();
    if (this.highQualityModels.some(hq => model.includes(hq))) {
      return 90;
    } else if (model.includes('gpt-3.5') || model.includes('claude-3-haiku') || model.includes('gemini-nano')) {
      return 70;
    } else {
      return 60;
    }
  }

  private calculateProviderReliabilityScore(agent: AgentIndex): number {
    if (!agent.provider) return 50;
    
    const provider = agent.provider.toLowerCase();
    if (this.reliableProviders.includes(provider)) {
      return 90;
    } else if (provider.includes('openai') || provider.includes('anthropic') || provider.includes('google')) {
      return 80;
    } else {
      return 60;
    }
  }

  private calculateCapabilitySpecializationScore(agent: AgentIndex): number {
    const capabilities = agent.capabilities || [];
    if (capabilities.length === 0) return 30;
    
    // Check for specialized capability combinations
    const specializedCombinations = [
      ['web_search', 'data_analysis'], // Research & Analysis
      ['file_io', 'data_processing'], // Data Processing
      ['email_send', 'notification_sending'], // Communication
      ['code_generation', 'testing'], // Development
      ['workflow_automation', 'task_scheduling'] // Automation
    ];
    
    for (const combination of specializedCombinations) {
      if (combination.every(cap => capabilities.includes(cap))) {
        return 90; // High specialization score
      }
    }
    
    // Check for single specialized capabilities
    const specializedCaps = ['security_analysis', 'blockchain_interaction', 'iot_management', 'voice_processing'];
    if (specializedCaps.some(cap => capabilities.includes(cap))) {
      return 80;
    }
    
    return 60; // General capabilities
  }

  private getRelatedDomains(domain: string): string[] {
    const domainMap: Record<string, string[]> = {
      'marketing': ['Marketing & Advertising', 'Sales & CRM'],
      'sales': ['Sales & CRM', 'Marketing & Advertising'],
      'hr': ['Human Resources & Recruiting', 'Customer Support & Service'],
      'finance': ['Finance & Accounting'],
      'development': ['IT & Software Development', 'DevOps & Cloud'],
      'analytics': ['Research & Data Science', 'Data Analysis'],
      'support': ['Customer Support & Service', 'Human Resources & Recruiting'],
      'operations': ['Logistics & Supply Chain', 'Manufacturing & Engineering']
    };

    return domainMap[domain] || [];
  }
}

// Factory function to create agent scorer
export const createAgentScoring = (criteria?: Partial<AgentScoringCriteria>): AgentScoring => {
  return new AgentScoring(criteria);
};

// Default scorer instance
export const defaultAgentScoring = createAgentScoring();
