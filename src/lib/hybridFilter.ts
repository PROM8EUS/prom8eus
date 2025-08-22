import { SemanticSearch, extractWorkflowText, SemanticResult } from './semanticSearch';

export interface HybridFilterConfig {
  domainThreshold: number;
  semanticThreshold: number;
  maxResults: number;
  domainWeight: number;
  semanticWeight: number;
}

export interface HybridResult {
  id: string;
  domainScore: number;
  semanticScore: number;
  combinedScore: number;
  isRelevant: boolean;
}

export class HybridFilter {
  private static defaultConfig: HybridFilterConfig = {
    domainThreshold: 0.3,
    semanticThreshold: 0.3,
    maxResults: 5,
    domainWeight: 0.4,
    semanticWeight: 0.6
  };

  // Step 1: Domain-based filtering
  private static domainFilter(
    taskContext: { primaryDomain: string; confidence: number },
    workflows: any[],
    config: HybridFilterConfig
  ): any[] {
    const { primaryDomain, confidence } = taskContext;
    
    // If domain confidence is low, return all workflows
    if (confidence < config.domainThreshold) {
      return workflows;
    }

    // Domain-specific filtering rules
    const domainRules = {
      'customer-service': {
        keywords: ['customer', 'support', 'service', 'help', 'assist', 'ticket', 'inquiry'],
        excludeKeywords: ['video', 'youtube', 'tiktok', 'instagram', 'seo', 'keyword', 'ranking']
      },
      'content-creation': {
        keywords: ['content', 'create', 'generate', 'publish', 'media', 'video', 'social'],
        excludeKeywords: ['invoice', 'payment', 'finance', 'hr', 'recruitment']
      },
      'seo-marketing': {
        keywords: ['seo', 'marketing', 'optimize', 'rank', 'traffic', 'keyword'],
        excludeKeywords: ['video', 'content creation', 'finance', 'hr']
      },
      'data-analysis': {
        keywords: ['data', 'analyze', 'report', 'insights', 'metrics', 'dashboard'],
        excludeKeywords: ['video', 'content creation', 'seo']
      },
      'crm-sales': {
        keywords: ['crm', 'sales', 'lead', 'customer', 'pipeline', 'deal'],
        excludeKeywords: ['video', 'content creation', 'seo', 'finance']
      },
      'finance': {
        keywords: ['finance', 'invoice', 'payment', 'billing', 'accounting'],
        excludeKeywords: ['video', 'content creation', 'seo', 'hr']
      },
      'hr-recruitment': {
        keywords: ['hr', 'recruit', 'hiring', 'employee', 'candidate'],
        excludeKeywords: ['video', 'content creation', 'seo', 'finance']
      },
      'project-management': {
        keywords: ['project', 'manage', 'task', 'plan', 'timeline'],
        excludeKeywords: ['video', 'content creation', 'seo', 'finance']
      },
      'ecommerce': {
        keywords: ['ecommerce', 'shop', 'store', 'product', 'order'],
        excludeKeywords: ['video', 'content creation', 'seo', 'hr']
      }
    };

    const rules = domainRules[primaryDomain as keyof typeof domainRules];
    if (!rules) return workflows;

    return workflows.filter(workflow => {
      const workflowText = extractWorkflowText(workflow).toLowerCase();
      
      // Check for relevant keywords
      const hasRelevantKeywords = rules.keywords.some(keyword => 
        workflowText.includes(keyword)
      );
      
      // Check for excluded keywords
      const hasExcludedKeywords = rules.excludeKeywords.some(keyword => 
        workflowText.includes(keyword)
      );
      
      return hasRelevantKeywords && !hasExcludedKeywords;
    });
  }

  // Step 2: Semantic search on domain-filtered results
  private static async semanticFilter(
    taskDescription: string,
    domain: string,
    workflows: any[],
    config: HybridFilterConfig
  ): Promise<SemanticResult[]> {
    const documents = workflows.map(workflow => ({
      id: workflow.id || workflow.name,
      text: extractWorkflowText(workflow)
    }));

    return SemanticSearch.searchWithContext(
      taskDescription,
      domain,
      documents,
      config.semanticThreshold
    );
  }

  // Step 3: Combine domain and semantic scores
  private static combineScores(
    domainFiltered: any[],
    semanticResults: SemanticResult[],
    config: HybridFilterConfig
  ): HybridResult[] {
    const semanticMap = new Map(semanticResults.map(r => [r.id, r.similarity]));
    
    return domainFiltered.map(workflow => {
      const workflowId = workflow.id || workflow.name;
      const semanticScore = semanticMap.get(workflowId) || 0;
      
      // Domain score based on keyword matches
      const workflowText = extractWorkflowText(workflow).toLowerCase();
      const domainKeywords = ['customer', 'support', 'service', 'workflow', 'automation'];
      const domainMatches = domainKeywords.filter(keyword => 
        workflowText.includes(keyword)
      ).length;
      const domainScore = Math.min(domainMatches / domainKeywords.length, 1);
      
      // Combined score
      const combinedScore = (domainScore * config.domainWeight) + 
                           (semanticScore * config.semanticWeight);
      
      return {
        id: workflowId,
        domainScore,
        semanticScore,
        combinedScore,
        isRelevant: combinedScore >= config.domainThreshold
      };
    });
  }

  // Main hybrid filtering method
  public static async filterWorkflows(
    taskTitles: string[],
    taskSystems: string[],
    workflows: any[],
    config: Partial<HybridFilterConfig> = {}
  ): Promise<{ workflows: any[]; scores: HybridResult[] }> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Create task description
    const taskDescription = [...taskTitles, ...taskSystems].join(' ');
    
    // Step 1: Analyze task context
    const taskContext = this.analyzeTaskContext(taskTitles, taskSystems);
    
    console.log('🔍 Hybrid Filter Analysis:', {
      taskDescription,
      primaryDomain: taskContext.primaryDomain,
      confidence: taskContext.confidence,
      totalWorkflows: workflows.length
    });
    
    // Step 2: Domain filtering
    const domainFiltered = this.domainFilter(taskContext, workflows, finalConfig);
    
    console.log('📊 Domain Filter Results:', {
      domainFiltered: domainFiltered.length,
      filteredOut: workflows.length - domainFiltered.length
    });
    
    // Step 3: Semantic search
    const semanticResults = await this.semanticFilter(
      taskDescription,
      taskContext.primaryDomain,
      domainFiltered,
      finalConfig
    );
    
    console.log('🧠 Semantic Search Results:', {
      semanticResults: semanticResults.length,
      topSimilarity: semanticResults[0]?.similarity || 0
    });
    
    // Step 4: Combine scores
    const scores = this.combineScores(domainFiltered, semanticResults, finalConfig);
    
    // Step 5: Sort and limit results
    const sortedScores = scores
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, finalConfig.maxResults);
    
    const resultWorkflows = sortedScores
      .map(score => workflows.find(w => (w.id || w.name) === score.id))
      .filter(Boolean);
    
    console.log('🎯 Final Hybrid Results:', {
      finalResults: resultWorkflows.length,
      topScore: sortedScores[0]?.combinedScore || 0
    });
    
    return {
      workflows: resultWorkflows,
      scores: sortedScores
    };
  }

  // Task context analysis (reused from existing logic)
  private static analyzeTaskContext(taskTitles: string[], taskSystems: string[]) {
    const allText = [...taskTitles, ...taskSystems].join(' ').toLowerCase();
    
    const domainPatterns = {
      'email': ['email', 'mail', 'gmail', 'outlook', 'inbox', 'message', 'notification'],
      'customer-service': ['customer', 'support', 'ticket', 'inquiry', 'request', 'response', 'helpdesk', 'beratung', 'telefon', 'phone', 'call', 'hotline'],
      'data-analysis': ['data', 'analysis', 'report', 'reporting', 'analytics', 'dashboard', 'visualization'],
      'crm-sales': ['crm', 'erp', 'sales', 'hubspot', 'salesforce', 'customer', 'lead'],
      'content-creation': ['content', 'video', 'youtube', 'tiktok', 'instagram', 'social', 'media'],
      'seo-marketing': ['seo', 'keyword', 'ranking', 'marketing', 'google', 'search'],
      'finance': ['invoice', 'payment', 'finance', 'accounting', 'billing', 'expense'],
      'hr-recruitment': ['hr', 'recruitment', 'hiring', 'employee', 'candidate', 'interview'],
      'project-management': ['project', 'task', 'management', 'planning', 'timeline', 'milestone'],
      'ecommerce': ['shop', 'store', 'product', 'order', 'inventory', 'ecommerce']
    };
    
    let maxScore = 0;
    let primaryDomain = 'general';
    
    Object.entries(domainPatterns).forEach(([domain, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (allText.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        primaryDomain = domain;
      }
    });
    
    return { primaryDomain, confidence: maxScore / Math.max(...Object.values(domainPatterns).map(k => k.length)) };
  }
}
