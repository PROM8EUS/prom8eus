// Enhanced Analysis Client - Connects frontend with enhanced analysis system

export interface EnhancedAnalysisRequest {
  taskInput: string;
  context?: {
    industry?: string;
    systems?: string[];
    complexity?: string;
    priority?: string;
  };
}

export interface EnhancedAnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Client function to call the enhanced analysis API
export async function callEnhancedAnalysis(request: EnhancedAnalysisRequest): Promise<EnhancedAnalysisResponse> {
  try {
    // Use import.meta.env for Vite or fallback to empty string
    const apiKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
    
    const response = await fetch('/functions/v1/enhanced-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling enhanced analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Local analysis using the new pattern engine
export async function analyzeTaskLocally(taskInput: string, context?: any): Promise<any> {
  try {
    // Import the new fast analysis engine
    const { fastAnalysisEngine } = await import('./patternEngine/fastAnalysisEngine');
    
    console.log('🚀 Starting local pattern analysis for:', taskInput.substring(0, 50) + '...');
    
    // Use the new fast analysis engine
    const result = fastAnalysisEngine.analyzeTask(taskInput, context);
    
    console.log('✅ Local pattern analysis completed:', {
      pattern: result.pattern,
      automationPotential: result.automationPotential,
      subtasks: result.subtasks?.length || 0
    });
    
    // Convert to the expected format
    const enhancedResult = {
      task: {
        text: result.text,
        automationPotential: result.automationPotential / 100,
        estimatedHours: 8, // Default estimate
        confidence: result.confidence / 100,
        complexity: result.complexity,
        category: result.category
      },
      subtasks: result.subtasks || [],
      summary: {
        totalAutomationPotential: result.automationPotential,
        estimatedTimeSavings: 6, // Default estimate
        estimatedCostSavings: 720, // Default estimate
        confidence: result.confidence,
        complexityBreakdown: {
          low: result.complexity === 'low' ? 1 : 0,
          medium: result.complexity === 'medium' ? 1 : 0,
          high: result.complexity === 'high' ? 1 : 0
        }
      },
      pattern: result.pattern,
      systems: result.systems,
      reasoning: result.reasoning
    };
    
    return {
      success: true,
      data: enhancedResult
    };
  } catch (error) {
    console.error('Error in local analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Local analysis failed'
    };
  }
}

// Main function to get enhanced analysis (uses local analysis directly)
export async function getEnhancedAnalysis(taskInput: string, context?: any): Promise<EnhancedAnalysisResponse> {
  // Use local analysis directly since API is not available
  console.log('🔍 Using local enhanced analysis for:', taskInput.substring(0, 50) + '...');
  return await analyzeTaskLocally(taskInput, context);
}

// Utility function to format analysis results for display
export function formatAnalysisResults(result: any) {
  if (!result || !result.data) {
    return null;
  }

  const { task, subtasks, workflowRecommendations, agentRecommendations, summary, learningInsights } = result.data;

  return {
    task: {
      ...task,
      automationPotentialPercent: Math.round(task.automationPotential * 100),
      estimatedHoursFormatted: `${task.estimatedHours}h`,
      confidenceFormatted: `${task.confidence}%`
    },
    subtasks: subtasks.map((subtask: any) => ({
      ...subtask,
      automationPotentialPercent: Math.round(subtask.automationPotential * 100),
      estimatedTimeFormatted: `${subtask.estimatedTime} Min`,
      manualHoursFormatted: `${(subtask.manualHoursShare * 100).toFixed(0)}%`
    })),
    workflowRecommendations: workflowRecommendations.map((workflow: any) => ({
      ...workflow,
      estimatedTimeSavingsFormatted: `${workflow.estimatedTimeSavings.toFixed(1)}h`,
      estimatedCostSavingsFormatted: `€${workflow.estimatedCostSavings}`,
      learningScoreFormatted: `${workflow.learningScore}%`,
      confidenceFormatted: `${workflow.confidence}%`
    })),
    agentRecommendations: agentRecommendations.map((agent: any) => ({
      ...agent,
      learningScoreFormatted: `${agent.learningScore}%`,
      confidenceFormatted: `${agent.confidence}%`,
      pricingFormatted: formatPricing(agent.pricing)
    })),
    summary: {
      ...summary,
      totalAutomationPotentialFormatted: `${summary.totalAutomationPotential}%`,
      estimatedTimeSavingsFormatted: `${summary.estimatedTimeSavings}h`,
      estimatedCostSavingsFormatted: `€${summary.estimatedCostSavings}`,
      confidenceFormatted: `${summary.confidence}%`
    },
    learningInsights
  };
}

// Helper function to format pricing information
function formatPricing(pricing: any): string {
  if (!pricing) return 'N/A';
  
  switch (pricing.type) {
    case 'free':
      return 'Kostenlos';
    case 'subscription':
      return pricing.amount ? `€${pricing.amount}/${pricing.unit || 'Monat'}` : 'Abonnement';
    case 'usage':
      return pricing.amount ? `€${pricing.amount}/${pricing.unit || 'Nutzung'}` : 'Nutzungsbasiert';
    case 'one-time':
      return pricing.amount ? `€${pricing.amount} einmalig` : 'Einmalzahlung';
    default:
      return 'Preis auf Anfrage';
  }
}

// Function to validate task input
export function validateTaskInput(taskInput: string): { isValid: boolean; error?: string } {
  if (!taskInput || taskInput.trim().length === 0) {
    return { isValid: false, error: 'Bitte geben Sie eine Aufgabe ein.' };
  }
  
  if (taskInput.trim().length < 10) {
    return { isValid: false, error: 'Die Aufgabe sollte mindestens 10 Zeichen lang sein.' };
  }
  
  if (taskInput.trim().length > 2000) {
    return { isValid: false, error: 'Die Aufgabe sollte maximal 2000 Zeichen lang sein.' };
  }
  
  return { isValid: true };
}

// Function to extract context from task input
export function extractContextFromInput(taskInput: string): any {
  const context: any = {};
  const lowerInput = taskInput.toLowerCase();
  
  // Detect industry
  const industryKeywords = {
    'finance': ['finance', 'accounting', 'buchhaltung', 'rechnung', 'zahlung', 'finanzen'],
    'marketing': ['marketing', 'campaign', 'werbung', 'social media', 'kampagne'],
    'sales': ['sales', 'vertrieb', 'akquise', 'pipeline', 'kundengewinnung'],
    'hr': ['hr', 'recruitment', 'recruiting', 'einstellung', 'personal'],
    'operations': ['operations', 'prozess', 'workflow', 'efficiency', 'betrieb']
  };
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => lowerInput.includes(keyword))) {
      context.industry = industry;
      break;
    }
  }
  
  // Detect systems
  const systemKeywords = [
    'api', 'database', 'excel', 'sheets', 'crm', 'erp', 'slack', 'email', 'calendar',
    'power bi', 'tableau', 'python', 'r', 'sql', 'etl', 'rpa', 'workflow'
  ];
  
  const detectedSystems = systemKeywords.filter(keyword => lowerInput.includes(keyword));
  if (detectedSystems.length > 0) {
    context.systems = detectedSystems;
  }
  
  // Detect complexity
  const complexityKeywords = {
    'low': ['simple', 'basic', 'routine', 'standard', 'einfach', 'grundlegend'],
    'medium': ['moderate', 'intermediate', 'complex', 'advanced', 'mittel', 'fortgeschritten'],
    'high': ['complex', 'advanced', 'sophisticated', 'expert', 'komplex', 'experte', 'spezialisiert']
  };
  
  for (const [complexity, keywords] of Object.entries(complexityKeywords)) {
    if (keywords.some(keyword => lowerInput.includes(keyword))) {
      context.complexity = complexity;
      break;
    }
  }
  
  // Detect priority
  const priorityKeywords = {
    'high': ['urgent', 'critical', 'important', 'dringend', 'wichtig', 'kritisch'],
    'medium': ['normal', 'standard', 'regular', 'normal', 'standard'],
    'low': ['low', 'minor', 'optional', 'niedrig', 'gering', 'optional']
  };
  
  for (const [priority, keywords] of Object.entries(priorityKeywords)) {
    if (keywords.some(keyword => lowerInput.includes(keyword))) {
      context.priority = priority;
      break;
    }
  }
  
  return context;
}

// Function to get analysis progress updates
export function getAnalysisProgress(): string[] {
  return [
    '🔍 Analysiere Aufgabenkomplexität und Automatisierungspotenzial',
    '📋 Generiere intelligente Teilaufgaben',
    '🤖 Finde passende Workflows und AI-Agents',
    '📚 Lerne aus historischen Daten',
    '✅ Analyse abgeschlossen'
  ];
}

// Function to cache analysis results
const analysisCache = new Map<string, any>();

export function cacheAnalysisResult(taskInput: string, result: any): void {
  const cacheKey = taskInput.trim().toLowerCase();
  analysisCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
}

export function getCachedAnalysisResult(taskInput: string): any | null {
  const cacheKey = taskInput.trim().toLowerCase();
  const cached = analysisCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
    return cached.result;
  }
  
  return null;
}

// Function to clear old cache entries
export function clearOldCacheEntries(): void {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  
  for (const [key, value] of analysisCache.entries()) {
    if (now - value.timestamp > maxAge) {
      analysisCache.delete(key);
    }
  }
}

// Main enhanced analysis function with caching
export async function performEnhancedAnalysis(taskInput: string): Promise<EnhancedAnalysisResponse> {
  // Validate input
  const validation = validateTaskInput(taskInput);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error
    };
  }
  
  // Check cache first
  const cachedResult = getCachedAnalysisResult(taskInput);
  if (cachedResult) {
    console.log('Using cached analysis result');
    return cachedResult;
  }
  
  // Extract context from input
  const context = extractContextFromInput(taskInput);
  
  // Perform analysis
  const result = await getEnhancedAnalysis(taskInput, context);
  
  // Cache successful results
  if (result.success) {
    cacheAnalysisResult(taskInput, result);
  }
  
  // Clear old cache entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean cache
    clearOldCacheEntries();
  }
  
  return result;
}
