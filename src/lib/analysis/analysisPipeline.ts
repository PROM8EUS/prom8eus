import { JobParser } from './jobParser';
import { TaskClassifier } from './taskClassifier';
import { ROIAggregator, AnalysisResult } from './roiAggregator';
import { FastAnalysisResult } from './types';
import { 
  startAnalysisMonitoring, 
  monitorJobParsing, 
  completeJobParsing,
  monitorTaskClassification,
  completeTaskClassification,
  monitorROIAggregation,
  completeROIAggregation,
  completeAnalysisMonitoring
} from '../monitoring/analysisMonitor';

/**
 * Main Analysis Pipeline
 * Orchestrates the modular analysis services
 */
export class AnalysisPipeline {
  private jobParser: JobParser;
  private taskClassifier: TaskClassifier;
  private roiAggregator: ROIAggregator;

  constructor() {
    this.jobParser = new JobParser();
    this.taskClassifier = new TaskClassifier();
    this.roiAggregator = new ROIAggregator();
  }

  /**
   * Run complete analysis pipeline
   */
  async runAnalysis(jobText: string, lang: 'de' | 'en' = 'de'): Promise<AnalysisResult> {
    console.log('DEBUG runAnalysis: lang =', lang);
    
    // Start monitoring
    const analysisId = startAnalysisMonitoring('Job Analysis', jobText);
    
    // Step 1: AI-First approach - no fallback, clear error handling
    console.log('🤖 Starting AI-first analysis...');
    
    try {
      // Step 1: Parse job description and extract tasks
      console.log('📋 Step 1: Parsing job description...');
      monitorJobParsing(analysisId, jobText);
      const fastResults = await this.jobParser.parseJobDescription(jobText, lang);
      completeJobParsing(analysisId, fastResults.tasks || [], true);
      
      // Step 2: Convert FastAnalysisResult to Task format with subtasks
      console.log('🔄 Step 2: Converting to task format...');
      monitorTaskClassification(analysisId, fastResults.tasks || []);
      const analyzedTasks = await this.convertToTasks(fastResults);
      completeTaskClassification(analysisId, analyzedTasks, fastResults.industry || 'unknown', true);
      
      // Step 3: Aggregate results and generate summary/recommendations
      console.log('📊 Step 3: Aggregating results...');
      monitorROIAggregation(analysisId, analyzedTasks);
      const result = this.roiAggregator.aggregateResults(analyzedTasks, jobText);
      completeROIAggregation(analysisId, result, true);
      
      console.log('✅ Analysis pipeline completed successfully');
      completeAnalysisMonitoring(analysisId, result, true);
      return result;
      
    } catch (error) {
      console.error('❌ Analysis pipeline failed:', error);
      
      // Record error in monitoring
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      completeAnalysisMonitoring(analysisId, {}, false, error instanceof Error ? error : new Error(errorMessage));
      
      throw new Error(`AI-Analyse fehlgeschlagen: ${errorMessage}. Bitte überprüfen Sie:
      1. OpenAI API-Key ist korrekt konfiguriert
      2. Internetverbindung ist verfügbar
      3. OpenAI API ist erreichbar
      4. Stellenbeschreibung enthält ausreichend Inhalt`);
    }
  }

  /**
   * Convert FastAnalysisResult to Task format
   */
  private async convertToTasks(fastResults: FastAnalysisResult[]): Promise<any[]> {
    const { getToolsByIndustry } = await import('../catalog/aiTools');
    
    return fastResults.map(result => {
      console.log('🔍 [AnalysisPipeline] Task result:', {
        text: result.text,
        subtasks: result.subtasks?.length || 0,
        subtasksData: result.subtasks
      });
      
      return {
        text: result.text,
        score: result.automationPotential,
        label: result.label || (result.automationPotential >= 70 ? "Automatisierbar" : 
               result.automationPotential >= 30 ? "Teilweise Automatisierbar" : "Mensch"),
        signals: [result.reasoning ?? ''],
        aiTools: getToolsByIndustry(result.category).map(tool => tool.id),
        industry: result.category,
        category: result.category,
        confidence: result.confidence,
        automationRatio: result.automationPotential,
        humanRatio: 100 - result.automationPotential,
        complexity: result.complexity || 'medium',
        automationTrend: result.trend || 'stable' as const,
        subtasks: result.subtasks || [],
        businessCase: result.businessCase,
        solutions: result.solutions
      };
    });
  }
}
