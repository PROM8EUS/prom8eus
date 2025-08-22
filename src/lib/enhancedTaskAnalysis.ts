// Enhanced Task Analysis System with Learning Capabilities
// Provides precise task breakdown, subtask generation, and intelligent workflow/agent recommendations

export interface EnhancedTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  complexity: 'low' | 'medium' | 'high';
  automationPotential: number; // 0-100
  estimatedHours: number;
  systems: string[];
  industry: string;
  tags: string[];
  confidence: number; // 0-100
}

export interface EnhancedSubtask {
  id: string;
  title: string;
  description: string;
  parentTaskId: string;
  systems: string[];
  manualHoursShare: number;
  automationPotential: number;
  complexity: 'low' | 'medium' | 'high';
  risks: string[];
  assumptions: string[];
  kpis: string[];
  qualityGates: string[];
  dependencies: string[]; // IDs of other subtasks
  estimatedTime: number; // minutes
  priority: 'low' | 'medium' | 'high' | 'critical';
  learningData?: {
    successRate: number;
    averageTime: number;
    commonIssues: string[];
    optimizationSuggestions: string[];
  };
}

export interface WorkflowRecommendation {
  id: string;
  title: string;
  description: string;
  subtaskMatches: string[]; // Subtask IDs
  systems: string[];
  automationLevel: 'manual' | 'semi-automated' | 'fully-automated';
  estimatedTimeSavings: number; // hours
  estimatedCostSavings: number; // EUR
  complexity: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  steps: WorkflowStep[];
  learningScore: number; // 0-100 based on historical success
  confidence: number; // 0-100
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  tool: string;
  automationLevel: 'manual' | 'semi-automated' | 'fully-automated';
  estimatedTime: number; // minutes
  instructions: string[];
  tips: string[];
  config: Record<string, any>;
}

export interface AgentRecommendation {
  id: string;
  title: string;
  description: string;
  subtaskMatches: string[]; // Subtask IDs
  capabilities: string[];
  deployment: 'SaaS' | 'On-Prem' | 'Hybrid';
  pricing: {
    type: 'free' | 'subscription' | 'usage' | 'one-time';
    amount?: number;
    unit?: string;
  };
  learningScore: number; // 0-100 based on historical success
  confidence: number; // 0-100
  integrationComplexity: 'easy' | 'medium' | 'hard';
}

export interface AnalysisResult {
  task: EnhancedTask;
  subtasks: EnhancedSubtask[];
  workflowRecommendations: WorkflowRecommendation[];
  agentRecommendations: AgentRecommendation[];
  summary: {
    totalAutomationPotential: number;
    estimatedTimeSavings: number;
    estimatedCostSavings: number;
    complexityBreakdown: Record<string, number>;
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
  };
  learningInsights: {
    similarTasks: string[];
    commonPatterns: string[];
    optimizationOpportunities: string[];
    successFactors: string[];
  };
}

export class EnhancedTaskAnalyzer {
  private static learningDatabase: Map<string, any> = new Map();
  private static patternDatabase: Map<string, any> = new Map();

  // Enhanced task patterns with learning capabilities
  private static taskPatterns = {
    'data-processing': {
      keywords: [
        'daten', 'data', 'verarbeitung', 'processing', 'export', 'import', 'synchronisation',
        'migration', 'transformation', 'cleaning', 'validation', 'consolidation'
      ],
      complexityFactors: {
        dataVolume: { low: '<1GB', medium: '1-10GB', high: '>10GB' },
        dataSources: { low: '1-2', medium: '3-5', high: '>5' },
        transformationComplexity: { low: 'simple mapping', medium: 'conditional logic', high: 'complex algorithms' }
      },
      subtaskTemplates: [
        {
          id: 'data-extraction',
          title: 'Daten aus Quellsystemen extrahieren',
          baseAutomationPotential: 0.85,
          complexity: 'medium',
          systems: ['API', 'Database', 'File System', 'ETL Tools'],
          risks: ['API-Limits', 'Datenzugriff verweigert', 'Format-Inkompatibilität'],
          assumptions: ['API-Zugang verfügbar', 'Datenformate bekannt', 'Berechtigungen vorhanden']
        },
        {
          id: 'data-validation',
          title: 'Datenqualität prüfen und validieren',
          baseAutomationPotential: 0.90,
          complexity: 'medium',
          systems: ['Validation Tools', 'Quality Checks', 'Error Handling'],
          risks: ['Falsche Validierungsregeln', 'Datenverlust', 'Performance-Probleme'],
          assumptions: ['Validierungsregeln definiert', 'Referenzdaten verfügbar']
        },
        {
          id: 'data-transformation',
          title: 'Daten transformieren und bereinigen',
          baseAutomationPotential: 0.80,
          complexity: 'high',
          systems: ['ETL Tools', 'Scripting', 'Data Processing'],
          risks: ['Transformationsfehler', 'Datenverlust', 'Performance-Issues'],
          assumptions: ['Transformationslogik definiert', 'Testdaten verfügbar']
        },
        {
          id: 'data-loading',
          title: 'Daten in Zielsysteme laden',
          baseAutomationPotential: 0.95,
          complexity: 'low',
          systems: ['Database', 'API', 'File System'],
          risks: ['Lade-Fehler', 'Duplikate', 'Constraint-Violations'],
          assumptions: ['Zielsystem verfügbar', 'Schema definiert']
        }
      ]
    },
    'reporting-analytics': {
      keywords: [
        'reporting', 'analytics', 'dashboard', 'kpi', 'metrics', 'statistics',
        'visualisierung', 'auswertung', 'berichte', 'kennzahlen', 'trends'
      ],
      complexityFactors: {
        reportFrequency: { low: 'monthly', medium: 'weekly', high: 'daily' },
        dataSources: { low: '1-2', medium: '3-5', high: '>5' },
        visualizationComplexity: { low: 'simple charts', medium: 'interactive dashboards', high: 'complex analytics' }
      },
      subtaskTemplates: [
        {
          id: 'data-aggregation',
          title: 'Daten aggregieren und berechnen',
          baseAutomationPotential: 0.95,
          complexity: 'medium',
          systems: ['SQL', 'Analytics Tools', 'Data Warehouse'],
          risks: ['Falsche Berechnungen', 'Performance-Probleme', 'Dateninkonsistenz'],
          assumptions: ['Berechnungsregeln definiert', 'Datenquellen verfügbar']
        },
        {
          id: 'report-generation',
          title: 'Berichte automatisch generieren',
          baseAutomationPotential: 0.90,
          complexity: 'low',
          systems: ['Reporting Tools', 'Templates', 'Scheduling'],
          risks: ['Template-Fehler', 'Format-Probleme', 'Delivery-Fehler'],
          assumptions: ['Report-Templates erstellt', 'Delivery-Kanäle konfiguriert']
        },
        {
          id: 'dashboard-update',
          title: 'Dashboards aktualisieren',
          baseAutomationPotential: 0.85,
          complexity: 'medium',
          systems: ['BI Tools', 'Real-time Data', 'Visualization'],
          risks: ['Performance-Issues', 'Visualisierungsfehler', 'Datenverzögerung'],
          assumptions: ['Dashboard-Design final', 'Daten-Pipeline funktioniert']
        },
        {
          id: 'insight-delivery',
          title: 'Insights und Alerts versenden',
          baseAutomationPotential: 0.80,
          complexity: 'low',
          systems: ['Email', 'Slack', 'Notification System'],
          risks: ['Spam-Filter', 'Falsche Empfänger', 'Überflutung'],
          assumptions: ['Empfänger-Liste aktuell', 'Alert-Regeln definiert']
        }
      ]
    },
    'communication-coordination': {
      keywords: [
        'kommunikation', 'coordination', 'meeting', 'email', 'notification',
        'follow-up', 'scheduling', 'calendar', 'messaging', 'collaboration'
      ],
      complexityFactors: {
        participantCount: { low: '1-5', medium: '6-20', high: '>20' },
        frequency: { low: 'monthly', medium: 'weekly', high: 'daily' },
        coordinationComplexity: { low: 'simple scheduling', medium: 'multi-timezone', high: 'complex dependencies' }
      },
      subtaskTemplates: [
        {
          id: 'meeting-scheduling',
          title: 'Termine koordinieren und planen',
          baseAutomationPotential: 0.90,
          complexity: 'medium',
          systems: ['Calendar', 'Scheduling Tools', 'Email'],
          risks: ['Termin-Konflikte', 'Zeitzonen-Probleme', 'Teilnehmer-Änderungen'],
          assumptions: ['Kalender-Integration', 'Verfügbarkeiten bekannt']
        },
        {
          id: 'communication-automation',
          title: 'Kommunikation automatisieren',
          baseAutomationPotential: 0.85,
          complexity: 'low',
          systems: ['Email', 'Slack', 'Messaging', 'Templates'],
          risks: ['Spam-Filter', 'Falsche Empfänger', 'Kontext-Fehler'],
          assumptions: ['Template-Bibliothek', 'Empfänger-Listen']
        },
        {
          id: 'follow-up-tracking',
          title: 'Follow-ups verfolgen und eskalieren',
          baseAutomationPotential: 0.75,
          complexity: 'medium',
          systems: ['CRM', 'Task Management', 'Escalation System'],
          risks: ['Verlorene Follow-ups', 'Eskalationsverzögerung', 'Falsche Prioritäten'],
          assumptions: ['Follow-up-Regeln definiert', 'Eskalationsprozess klar']
        },
        {
          id: 'collaboration-facilitation',
          title: 'Kollaboration unterstützen',
          baseAutomationPotential: 0.70,
          complexity: 'medium',
          systems: ['Collaboration Tools', 'Documentation', 'Workflow'],
          risks: ['Tool-Überflutung', 'Informationsverlust', 'Prozess-Verwirrung'],
          assumptions: ['Tool-Integration', 'Prozess-Dokumentation']
        }
      ]
    },
    'process-automation': {
      keywords: [
        'prozess', 'process', 'workflow', 'automation', 'optimization',
        'efficiency', 'streamlining', 'standardization', 'rpa', 'bot'
      ],
      complexityFactors: {
        processSteps: { low: '1-5', medium: '6-15', high: '>15' },
        decisionPoints: { low: '0-2', medium: '3-8', high: '>8' },
        systemIntegrations: { low: '1-2', medium: '3-5', high: '>5' }
      },
      subtaskTemplates: [
        {
          id: 'process-mapping',
          title: 'Prozess analysieren und mappen',
          baseAutomationPotential: 0.60,
          complexity: 'high',
          systems: ['Process Mining', 'Documentation', 'Mapping Tools'],
          risks: ['Unvollständige Analyse', 'Falsche Annahmen', 'Stakeholder-Widerstand'],
          assumptions: ['Prozess-Zugang', 'Stakeholder-Buy-in', 'Dokumentation verfügbar']
        },
        {
          id: 'automation-design',
          title: 'Automatisierung konzipieren',
          baseAutomationPotential: 0.70,
          complexity: 'high',
          systems: ['Design Tools', 'Architecture', 'Planning'],
          risks: ['Über-Engineering', 'Technische Schulden', 'Skalierbarkeitsprobleme'],
          assumptions: ['Technische Expertise', 'Architektur-Richtlinien']
        },
        {
          id: 'implementation',
          title: 'Automatisierung implementieren',
          baseAutomationPotential: 0.85,
          complexity: 'medium',
          systems: ['RPA Tools', 'Workflow Engine', 'Integration Platform'],
          risks: ['Implementierungsfehler', 'Performance-Probleme', 'Stabilitätsprobleme'],
          assumptions: ['Technische Infrastruktur', 'Test-Umgebung']
        },
        {
          id: 'monitoring-optimization',
          title: 'Performance überwachen und optimieren',
          baseAutomationPotential: 0.90,
          complexity: 'medium',
          systems: ['Monitoring', 'Analytics', 'Optimization Tools'],
          risks: ['Späte Erkennung', 'Falsche Optimierungen', 'Performance-Degradation'],
          assumptions: ['Monitoring-Setup', 'Performance-Baseline', 'Optimierungsregeln']
        }
      ]
    }
  };

  // Main analysis method
  public static async analyzeTask(taskInput: string, context?: any): Promise<AnalysisResult> {
    console.log('🔍 Starting Enhanced Task Analysis:', { taskInput, context });

    // Step 1: Analyze and classify the task
    const enhancedTask = this.analyzeAndClassifyTask(taskInput, context);

    // Step 2: Generate intelligent subtasks
    const subtasks = this.generateSubtasks(enhancedTask);

    // Step 3: Find matching workflows
    const workflowRecommendations = await this.findWorkflowRecommendations(subtasks, enhancedTask);

    // Step 4: Find matching agents
    const agentRecommendations = await this.findAgentRecommendations(subtasks, enhancedTask);

    // Step 5: Generate summary and insights
    const summary = this.generateSummary(enhancedTask, subtasks, workflowRecommendations, agentRecommendations);
    const learningInsights = this.generateLearningInsights(enhancedTask, subtasks);

    // Step 6: Update learning database
    this.updateLearningDatabase(enhancedTask, subtasks, workflowRecommendations, agentRecommendations);

    return {
      task: enhancedTask,
      subtasks,
      workflowRecommendations,
      agentRecommendations,
      summary,
      learningInsights
    };
  }

  private static analyzeAndClassifyTask(taskInput: string, context?: any): EnhancedTask {
    const taskText = taskInput.toLowerCase();
    
    // Find best matching pattern
    let bestPattern = 'general';
    let bestScore = 0;
    
    Object.entries(this.taskPatterns).forEach(([pattern, config]) => {
      const score = config.keywords.reduce((acc, keyword) => {
        return acc + (taskText.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestPattern = pattern;
      }
    });

    // Analyze complexity factors
    const complexity = this.analyzeComplexity(taskText, bestPattern);
    
    // Calculate automation potential
    const automationPotential = this.calculateAutomationPotential(taskText, bestPattern, complexity);
    
    // Estimate hours based on complexity and pattern
    const estimatedHours = this.estimateHours(complexity, bestPattern);
    
    // Extract systems and industry
    const systems = this.extractSystems(taskText);
    const industry = this.detectIndustry(taskText);
    
    // Generate tags
    const tags = this.generateTags(taskText, bestPattern, systems, industry);
    
    // Calculate confidence based on pattern match and data quality
    const confidence = this.calculateConfidence(bestScore, taskInput.length, systems.length);

    return {
      id: this.generateTaskId(taskInput),
      title: this.extractTitle(taskInput),
      description: taskInput,
      category: bestPattern,
      complexity,
      automationPotential,
      estimatedHours,
      systems,
      industry,
      tags,
      confidence
    };
  }

  private static generateSubtasks(task: EnhancedTask): EnhancedSubtask[] {
    const pattern = this.taskPatterns[task.category as keyof typeof this.taskPatterns];
    
    if (!pattern) {
      return this.generateFallbackSubtasks(task);
    }

    // Generate subtasks from pattern templates
    const subtasks = pattern.subtaskTemplates.map((template, index) => {
      // Customize automation potential based on task context
      const customizedAutomationPotential = this.customizeAutomationPotential(
        template.baseAutomationPotential,
        task.systems,
        template.systems
      );

      // Calculate time distribution
      const timeShare = this.calculateTimeShare(index, pattern.subtaskTemplates.length, task.complexity);

      return {
        id: `${task.id}-${template.id}`,
        title: template.title,
        description: this.generateSubtaskDescription(template, task),
        parentTaskId: task.id,
        systems: this.mergeSystems(template.systems, task.systems),
        manualHoursShare: timeShare,
        automationPotential: customizedAutomationPotential,
        complexity: template.complexity,
        risks: template.risks,
        assumptions: template.assumptions,
        kpis: this.generateKPIs(template, task),
        qualityGates: this.generateQualityGates(template, task),
        dependencies: this.generateDependencies(index, pattern.subtaskTemplates.length),
        estimatedTime: this.estimateSubtaskTime(template, task),
        priority: this.calculatePriority(index, task.complexity),
        learningData: this.getLearningData(template.id, task.category)
      };
    });

    return subtasks;
  }

  private static async findWorkflowRecommendations(subtasks: EnhancedSubtask[], task: EnhancedTask): Promise<WorkflowRecommendation[]> {
    // This would integrate with the existing workflow system
    // For now, return intelligent mock recommendations
    const recommendations: WorkflowRecommendation[] = [];

    // Find workflows that match subtask systems and patterns
    subtasks.forEach(subtask => {
      const matchingWorkflows = this.findMatchingWorkflows(subtask, task);
      recommendations.push(...matchingWorkflows);
    });

    // Remove duplicates and sort by relevance
    const uniqueRecommendations = this.deduplicateAndSortWorkflows(recommendations);
    
    return uniqueRecommendations.slice(0, 5); // Return top 5
  }

  private static async findAgentRecommendations(subtasks: EnhancedSubtask[], task: EnhancedTask): Promise<AgentRecommendation[]> {
    // This would integrate with the existing agent system
    // For now, return intelligent mock recommendations
    const recommendations: AgentRecommendation[] = [];

    // Find agents that match subtask capabilities
    subtasks.forEach(subtask => {
      const matchingAgents = this.findMatchingAgents(subtask, task);
      recommendations.push(...matchingAgents);
    });

    // Remove duplicates and sort by relevance
    const uniqueRecommendations = this.deduplicateAndSortAgents(recommendations);
    
    return uniqueRecommendations.slice(0, 5); // Return top 5
  }

  private static generateSummary(
    task: EnhancedTask, 
    subtasks: EnhancedSubtask[], 
    workflows: WorkflowRecommendation[], 
    agents: AgentRecommendation[]
  ) {
    const totalAutomationPotential = subtasks.reduce((acc, subtask) => 
      acc + (subtask.automationPotential * subtask.manualHoursShare), 0) / subtasks.reduce((acc, subtask) => acc + subtask.manualHoursShare, 0);

    const estimatedTimeSavings = task.estimatedHours * totalAutomationPotential;
    const estimatedCostSavings = estimatedTimeSavings * 60; // Assuming 60 EUR/hour

    const complexityBreakdown = {
      low: subtasks.filter(s => s.complexity === 'low').length,
      medium: subtasks.filter(s => s.complexity === 'medium').length,
      high: subtasks.filter(s => s.complexity === 'high').length
    };

    const riskLevel = this.calculateRiskLevel(subtasks, workflows, agents);
    const confidence = this.calculateOverallConfidence(task, subtasks, workflows, agents);

    return {
      totalAutomationPotential: Math.round(totalAutomationPotential * 100),
      estimatedTimeSavings: Math.round(estimatedTimeSavings * 10) / 10,
      estimatedCostSavings: Math.round(estimatedCostSavings),
      complexityBreakdown,
      riskLevel,
      confidence
    };
  }

  private static generateLearningInsights(task: EnhancedTask, subtasks: EnhancedSubtask[]) {
    // Generate insights based on learning database
    const similarTasks = this.findSimilarTasks(task);
    const commonPatterns = this.identifyCommonPatterns(subtasks);
    const optimizationOpportunities = this.identifyOptimizationOpportunities(task, subtasks);
    const successFactors = this.identifySuccessFactors(task, subtasks);

    return {
      similarTasks,
      commonPatterns,
      optimizationOpportunities,
      successFactors
    };
  }

  // Helper methods
  private static analyzeComplexity(taskText: string, pattern: string): 'low' | 'medium' | 'high' {
    const complexityIndicators = {
      low: ['simple', 'basic', 'routine', 'standard', 'einfach', 'grundlegend', 'routine'],
      medium: ['moderate', 'intermediate', 'complex', 'advanced', 'mittel', 'fortgeschritten'],
      high: ['complex', 'advanced', 'sophisticated', 'expert', 'komplex', 'experte', 'spezialisiert']
    };

    let complexityScore = { low: 0, medium: 0, high: 0 };

    Object.entries(complexityIndicators).forEach(([level, indicators]) => {
      indicators.forEach(indicator => {
        if (taskText.includes(indicator)) {
          complexityScore[level as keyof typeof complexityScore]++;
        }
      });
    });

    if (complexityScore.high > 0) return 'high';
    if (complexityScore.medium > 0) return 'medium';
    return 'low';
  }

  private static calculateAutomationPotential(taskText: string, pattern: string, complexity: string): number {
    let basePotential = 0.7; // Default automation potential

    // Adjust based on pattern
    const patternPotentials = {
      'data-processing': 0.85,
      'reporting-analytics': 0.80,
      'communication-coordination': 0.75,
      'process-automation': 0.90
    };
    basePotential = patternPotentials[pattern as keyof typeof patternPotentials] || basePotential;

    // Adjust based on complexity
    const complexityMultipliers = { low: 1.1, medium: 1.0, high: 0.9 };
    basePotential *= complexityMultipliers[complexity];

    // Adjust based on automation keywords
    const automationKeywords = ['automatisch', 'automatic', 'workflow', 'api', 'integration', 'sync'];
    const automationMatches = automationKeywords.filter(keyword => taskText.includes(keyword)).length;
    basePotential += automationMatches * 0.05;

    return Math.min(0.95, Math.max(0.2, basePotential));
  }

  private static estimateHours(complexity: string, pattern: string): number {
    const baseHours = { low: 4, medium: 8, high: 16 };
    const patternMultipliers = {
      'data-processing': 1.2,
      'reporting-analytics': 1.0,
      'communication-coordination': 0.8,
      'process-automation': 1.5
    };

    return Math.round(baseHours[complexity as keyof typeof baseHours] * 
      (patternMultipliers[pattern as keyof typeof patternMultipliers] || 1.0));
  }

  private static extractSystems(taskText: string): string[] {
    const systemKeywords = [
      'api', 'database', 'excel', 'sheets', 'crm', 'erp', 'slack', 'email', 'calendar',
      'power bi', 'tableau', 'python', 'r', 'sql', 'etl', 'rpa', 'workflow'
    ];

    return systemKeywords.filter(keyword => taskText.includes(keyword));
  }

  private static detectIndustry(taskText: string): string {
    const industryPatterns = {
      'finance': ['finance', 'accounting', 'buchhaltung', 'rechnung', 'zahlung'],
      'marketing': ['marketing', 'campaign', 'werbung', 'social media'],
      'sales': ['sales', 'vertrieb', 'akquise', 'pipeline'],
      'hr': ['hr', 'recruitment', 'recruiting', 'einstellung'],
      'operations': ['operations', 'prozess', 'workflow', 'efficiency']
    };

    for (const [industry, keywords] of Object.entries(industryPatterns)) {
      if (keywords.some(keyword => taskText.includes(keyword))) {
        return industry;
      }
    }

    return 'general';
  }

  private static generateTags(taskText: string, pattern: string, systems: string[], industry: string): string[] {
    const tags = [pattern, industry, ...systems];
    
    // Add complexity and automation tags
    if (taskText.includes('automatisch') || taskText.includes('automatic')) {
      tags.push('automation');
    }
    if (taskText.includes('workflow') || taskText.includes('prozess')) {
      tags.push('workflow');
    }
    if (taskText.includes('api') || taskText.includes('integration')) {
      tags.push('integration');
    }

    return [...new Set(tags)].slice(0, 10); // Remove duplicates and limit
  }

  private static calculateConfidence(patternScore: number, inputLength: number, systemsCount: number): number {
    let confidence = 50; // Base confidence

    // Adjust based on pattern match
    confidence += patternScore * 10;

    // Adjust based on input quality
    if (inputLength > 100) confidence += 20;
    if (inputLength > 500) confidence += 10;

    // Adjust based on system identification
    confidence += systemsCount * 5;

    return Math.min(100, Math.max(0, confidence));
  }

  private static generateTaskId(taskInput: string): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static extractTitle(taskInput: string): string {
    // Extract first sentence or first 50 characters as title
    const firstSentence = taskInput.split(/[.!?]/)[0];
    return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence;
  }

  // Additional helper methods would be implemented here...
  private static generateFallbackSubtasks(task: EnhancedTask): EnhancedSubtask[] {
    return [
      {
        id: `${task.id}-planning`,
        title: 'Aufgabe planen und strukturieren',
        description: 'Planung und Strukturierung der Aufgabe',
        parentTaskId: task.id,
        systems: ['Planning Tools', 'Documentation'],
        manualHoursShare: 0.2,
        automationPotential: 0.6,
        complexity: 'medium',
        risks: ['Unvollständige Planung'],
        assumptions: ['Klare Anforderungen'],
        kpis: ['Planungsqualität', 'Zeitplan-Einhaltung'],
        qualityGates: ['Plan genehmigt', 'Ressourcen zugewiesen'],
        dependencies: [],
        estimatedTime: 60,
        priority: 'high'
      },
      {
        id: `${task.id}-execution`,
        title: 'Aufgabe ausführen',
        description: 'Ausführung der Hauptaufgabe',
        parentTaskId: task.id,
        systems: ['Execution Tools', 'Workflow'],
        manualHoursShare: 0.5,
        automationPotential: 0.8,
        complexity: task.complexity,
        risks: ['Ausführungsfehler', 'Qualitätsprobleme'],
        assumptions: ['Verfügbare Tools', 'Klare Anweisungen'],
        kpis: ['Ausführungsqualität', 'Zeitplan-Einhaltung'],
        qualityGates: ['Ergebnis validiert', 'Qualitätskriterien erfüllt'],
        dependencies: [`${task.id}-planning`],
        estimatedTime: 240,
        priority: 'critical'
      },
      {
        id: `${task.id}-evaluation`,
        title: 'Ergebnisse evaluieren',
        description: 'Evaluation und Dokumentation der Ergebnisse',
        parentTaskId: task.id,
        systems: ['Analytics', 'Documentation'],
        manualHoursShare: 0.3,
        automationPotential: 0.7,
        complexity: 'medium',
        risks: ['Fehlende Dokumentation', 'Unvollständige Evaluation'],
        assumptions: ['Performance-Daten verfügbar'],
        kpis: ['Dokumentationsqualität', 'Evaluation-Vollständigkeit'],
        qualityGates: ['Dokumentation erstellt', 'Ergebnisse validiert'],
        dependencies: [`${task.id}-execution`],
        estimatedTime: 90,
        priority: 'medium'
      }
    ];
  }

  private static customizeAutomationPotential(basePotential: number, taskSystems: string[], templateSystems: string[]): number {
    let potential = basePotential;

    // Increase potential if task systems match template systems
    const systemOverlap = taskSystems.filter(system => templateSystems.includes(system)).length;
    potential += systemOverlap * 0.05;

    return Math.min(0.95, Math.max(0.2, potential));
  }

  private static calculateTimeShare(index: number, totalSubtasks: number, complexity: string): number {
    // Distribute time based on complexity and position
    const complexityMultipliers = { low: 0.8, medium: 1.0, high: 1.3 };
    const baseShare = 1 / totalSubtasks;
    
    return baseShare * complexityMultipliers[complexity as keyof typeof complexityMultipliers];
  }

  private static generateSubtaskDescription(template: any, task: EnhancedTask): string {
    return `${template.title} für ${task.title}`;
  }

  private static mergeSystems(templateSystems: string[], taskSystems: string[]): string[] {
    return [...new Set([...templateSystems, ...taskSystems])];
  }

  private static generateKPIs(template: any, task: EnhancedTask): string[] {
    return [
      'Zeitplan-Einhaltung',
      'Qualitätsstandards',
      'Automatisierungsgrad',
      'Fehlerrate'
    ];
  }

  private static generateQualityGates(template: any, task: EnhancedTask): string[] {
    return [
      'Ergebnis validiert',
      'Qualitätskriterien erfüllt',
      'Dokumentation erstellt'
    ];
  }

  private static generateDependencies(index: number, totalSubtasks: number): string[] {
    if (index === 0) return [];
    return [`subtask-${index - 1}`];
  }

  private static estimateSubtaskTime(template: any, task: EnhancedTask): number {
    const baseTime = { low: 30, medium: 60, high: 120 };
    return baseTime[template.complexity as keyof typeof baseTime];
  }

  private static calculatePriority(index: number, complexity: string): 'low' | 'medium' | 'high' | 'critical' {
    if (index === 0) return 'critical';
    if (complexity === 'high') return 'high';
    return 'medium';
  }

  private static getLearningData(templateId: string, category: string): any {
    // This would retrieve historical data from the learning database
    return {
      successRate: 0.85,
      averageTime: 45,
      commonIssues: ['API-Limits', 'Datenqualität'],
      optimizationSuggestions: ['Caching implementieren', 'Batch-Processing verwenden']
    };
  }

  private static findMatchingWorkflows(subtask: EnhancedSubtask, task: EnhancedTask): WorkflowRecommendation[] {
    // Mock implementation - would integrate with real workflow system
    return [
      {
        id: `workflow-${subtask.id}`,
        title: `Workflow für ${subtask.title}`,
        description: `Automatisierter Workflow für ${subtask.title}`,
        subtaskMatches: [subtask.id],
        systems: subtask.systems,
        automationLevel: 'fully-automated',
        estimatedTimeSavings: subtask.estimatedTime / 60 * subtask.automationPotential,
        estimatedCostSavings: subtask.estimatedTime / 60 * subtask.automationPotential * 60,
        complexity: 'medium',
        prerequisites: ['API-Zugang', 'System-Integration'],
        steps: [],
        learningScore: 85,
        confidence: 80
      }
    ];
  }

  private static findMatchingAgents(subtask: EnhancedSubtask, task: EnhancedTask): AgentRecommendation[] {
    // Mock implementation - would integrate with real agent system
    return [
      {
        id: `agent-${subtask.id}`,
        title: `AI Agent für ${subtask.title}`,
        description: `Intelligenter Agent für ${subtask.title}`,
        subtaskMatches: [subtask.id],
        capabilities: ['data-processing', 'automation', 'integration'],
        deployment: 'SaaS',
        pricing: { type: 'subscription', amount: 50, unit: 'monthly' },
        learningScore: 90,
        confidence: 85,
        integrationComplexity: 'medium'
      }
    ];
  }

  private static deduplicateAndSortWorkflows(workflows: WorkflowRecommendation[]): WorkflowRecommendation[] {
    const unique = new Map<string, WorkflowRecommendation>();
    workflows.forEach(workflow => {
      if (!unique.has(workflow.id)) {
        unique.set(workflow.id, workflow);
      }
    });
    
    return Array.from(unique.values()).sort((a, b) => b.learningScore - a.learningScore);
  }

  private static deduplicateAndSortAgents(agents: AgentRecommendation[]): AgentRecommendation[] {
    const unique = new Map<string, AgentRecommendation>();
    agents.forEach(agent => {
      if (!unique.has(agent.id)) {
        unique.set(agent.id, agent);
      }
    });
    
    return Array.from(unique.values()).sort((a, b) => b.learningScore - a.learningScore);
  }

  private static calculateRiskLevel(subtasks: EnhancedSubtask[], workflows: WorkflowRecommendation[], agents: AgentRecommendation[]): 'low' | 'medium' | 'high' {
    const highRiskSubtasks = subtasks.filter(s => s.complexity === 'high').length;
    const totalSubtasks = subtasks.length;
    
    if (highRiskSubtasks / totalSubtasks > 0.5) return 'high';
    if (highRiskSubtasks / totalSubtasks > 0.2) return 'medium';
    return 'low';
  }

  private static calculateOverallConfidence(task: EnhancedTask, subtasks: EnhancedSubtask[], workflows: WorkflowRecommendation[], agents: AgentRecommendation[]): number {
    const taskConfidence = task.confidence;
    const subtaskConfidence = subtasks.reduce((acc, s) => acc + (s.learningData?.successRate || 0.8) * 100, 0) / subtasks.length;
    const workflowConfidence = workflows.reduce((acc, w) => acc + w.confidence, 0) / Math.max(workflows.length, 1);
    const agentConfidence = agents.reduce((acc, a) => acc + a.confidence, 0) / Math.max(agents.length, 1);
    
    return Math.round((taskConfidence + subtaskConfidence + workflowConfidence + agentConfidence) / 4);
  }

  private static findSimilarTasks(task: EnhancedTask): string[] {
    // Mock implementation - would search learning database
    return [`Similar task 1 (${task.category})`, `Similar task 2 (${task.industry})`];
  }

  private static identifyCommonPatterns(subtasks: EnhancedSubtask[]): string[] {
    // Mock implementation - would analyze learning database
    return ['Data extraction pattern', 'Automation workflow pattern'];
  }

  private static identifyOptimizationOpportunities(task: EnhancedTask, subtasks: EnhancedSubtask[]): string[] {
    // Mock implementation - would analyze learning database
    return ['Batch processing', 'Parallel execution', 'Caching strategy'];
  }

  private static identifySuccessFactors(task: EnhancedTask, subtasks: EnhancedSubtask[]): string[] {
    // Mock implementation - would analyze learning database
    return ['Clear requirements', 'Proper testing', 'Stakeholder involvement'];
  }

  private static updateLearningDatabase(task: EnhancedTask, subtasks: EnhancedSubtask[], workflows: WorkflowRecommendation[], agents: AgentRecommendation[]) {
    // This would update the learning database with new insights
    const learningEntry = {
      taskId: task.id,
      category: task.category,
      complexity: task.complexity,
      automationPotential: task.automationPotential,
      subtasks: subtasks.map(s => ({ id: s.id, automationPotential: s.automationPotential })),
      workflows: workflows.map(w => ({ id: w.id, learningScore: w.learningScore })),
      agents: agents.map(a => ({ id: a.id, learningScore: a.learningScore })),
      timestamp: new Date().toISOString()
    };

    this.learningDatabase.set(task.id, learningEntry);
    console.log('📚 Learning database updated:', learningEntry);
  }
}

// Export singleton instance
export const enhancedTaskAnalysis = new EnhancedTaskAnalyzer();
