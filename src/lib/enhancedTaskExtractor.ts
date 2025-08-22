// Universal Enhanced Task Extractor
// Provides improved task recognition and categorization for all industries

import { enhancedTaskAnalysis } from './enhancedTaskAnalysis';

export interface ExtractedTask {
  id: string;
  text: string;
  category: string;
  industry: string;
  complexity: 'low' | 'medium' | 'high';
  automationPotential: number;
  confidence: number;
  systems: string[];
  tags: string[];
}

export class EnhancedTaskExtractor {
  
  // Universal task extraction with enhanced analysis
  async extractTasks(jobText: string, lang: 'de' | 'en' = 'de'): Promise<ExtractedTask[]> {
    console.log('🔍 Starting enhanced task extraction for:', jobText.substring(0, 50) + '...');
    
    try {
      // Use the enhanced task analysis for better task recognition
      const enhancedResult = await enhancedTaskAnalysis.analyzeTask(jobText, { lang });
      
      // Convert enhanced tasks to extracted tasks format
      const extractedTasks: ExtractedTask[] = enhancedResult.subtasks.map((subtask, index) => ({
        id: `task-${Date.now()}-${index}`,
        text: subtask.title,
        category: subtask.parentTaskId || 'general',
        industry: enhancedResult.task.industry,
        complexity: subtask.complexity,
        automationPotential: subtask.automationPotential,
        confidence: enhancedResult.summary.confidence,
        systems: subtask.systems,
        tags: enhancedResult.task.tags
      }));
      
      console.log('✅ Enhanced task extraction completed:', {
        tasks: extractedTasks.length,
        industries: [...new Set(extractedTasks.map(t => t.industry))],
        avgAutomationPotential: Math.round(extractedTasks.reduce((sum, t) => sum + t.automationPotential, 0) / extractedTasks.length)
      });
      
      return extractedTasks;
      
    } catch (error) {
      console.error('Error in enhanced task extraction:', error);
      
      // Fallback to basic extraction
      return this.fallbackExtraction(jobText);
    }
  }
  
  // Fallback extraction method
  private fallbackExtraction(jobText: string): ExtractedTask[] {
    const lines = jobText.split('\n').filter(line => line.trim().length > 10);
    
    return lines.map((line, index) => ({
      id: `fallback-task-${Date.now()}-${index}`,
      text: line.trim(),
      category: 'general',
      industry: 'general',
      complexity: 'medium' as const,
      automationPotential: 50,
      confidence: 60,
      systems: [],
      tags: []
    }));
  }
  
  // Detect industry from job text
  detectIndustry(jobText: string): string {
    const lowerText = jobText.toLowerCase();
    
    // Universal industry detection patterns
    const industryPatterns = {
      'tech': ['software', 'programming', 'development', 'coding', 'api', 'database', 'cloud', 'devops'],
      'marketing': ['marketing', 'campaign', 'content', 'social media', 'seo', 'ads', 'branding'],
      'sales': ['sales', 'customer', 'client', 'prospect', 'lead', 'deal', 'pipeline'],
      'finance': ['finance', 'accounting', 'bookkeeping', 'budget', 'financial', 'tax', 'audit'],
      'hr': ['hr', 'human resources', 'recruitment', 'hiring', 'employee', 'personnel', 'talent'],
      'operations': ['operations', 'logistics', 'supply chain', 'inventory', 'procurement'],
      'customer-service': ['customer service', 'support', 'helpdesk', 'client service'],
      'research': ['research', 'analysis', 'data', 'reporting', 'analytics', 'insights'],
      'project-management': ['project', 'management', 'planning', 'coordination', 'timeline'],
      'legal': ['legal', 'law', 'compliance', 'contract', 'regulation', 'litigation']
    };
    
    for (const [industry, keywords] of Object.entries(industryPatterns)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return industry;
      }
    }
    
    return 'general';
  }
}

// Export singleton instance
export const enhancedTaskExtractor = new EnhancedTaskExtractor();
