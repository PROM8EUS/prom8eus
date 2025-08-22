import { instantMatcher, PatternMatch } from './instantMatcher';
import { contextAnalyzer, ContextAnalysis } from './contextAnalyzer';
import { dynamicSubtaskGenerator, DynamicSubtask } from './dynamicSubtaskGenerator';

export interface FastAnalysisResult {
  text: string;
  automationPotential: number;
  confidence: number;
  pattern: string;
  category: string;
  complexity: 'low' | 'medium' | 'high';
  trend: 'increasing' | 'stable' | 'decreasing';
  systems: string[];
  label: 'Automatisierbar' | 'Teilweise Automatisierbar' | 'Mensch';
  reasoning: string;
  analysisTime: number;
  subtasks?: DynamicSubtask[];
}

export class FastAnalysisEngine {
  analyzeTask(taskText: string, jobContext?: string): FastAnalysisResult {
    const startTime = Date.now();
    
    // Step 1: Instant Pattern Matching (0-50ms)
    const patternMatch = instantMatcher.match(taskText);
    
    // Step 2: Context Analysis (50-200ms)
    const contextAnalysis = contextAnalyzer.analyzeContext(taskText, jobContext);
    
    // Step 3: Generate dynamic subtasks
    const subtasks = dynamicSubtaskGenerator.generateSubtasks(taskText, patternMatch, contextAnalysis);
    
    // Debug: Log subtask generation
    console.log('🔍 [fastAnalysisEngine] analyzeTask for:', taskText.substring(0, 50) + '...');
    console.log('🔍 [fastAnalysisEngine] Pattern match:', patternMatch.pattern);
    console.log('🔍 [fastAnalysisEngine] Subtasks generated:', subtasks?.length || 0);
    console.log('🔍 [fastAnalysisEngine] Subtasks data:', subtasks);
    
    // Step 4: Combine results with weighted scoring
    const finalScore = this.combineScores(patternMatch, contextAnalysis);
    const confidence = this.calculateConfidence(patternMatch, contextAnalysis);
    const label = this.determineLabel(finalScore);
    const reasoning = this.generateReasoning(patternMatch, contextAnalysis);
    
    return {
      text: taskText,
      automationPotential: Math.round(finalScore),
      confidence: Math.round(confidence * 100),
      pattern: patternMatch.pattern,
      category: patternMatch.category,
      complexity: contextAnalysis.complexity,
      trend: contextAnalysis.trend,
      systems: contextAnalysis.systems,
      label,
      reasoning,
      analysisTime: Date.now() - startTime,
      subtasks
    };
  }

  private combineScores(patternMatch: PatternMatch, contextAnalysis: ContextAnalysis): number {
    // Weight pattern matching more heavily (60%) than context analysis (40%)
    const patternWeight = 0.6;
    const contextWeight = 0.4;
    
    const weightedScore = (patternMatch.score * patternWeight) + (contextAnalysis.finalScore * contextWeight);
    
    return Math.max(0, Math.min(100, weightedScore));
  }

  private calculateConfidence(patternMatch: PatternMatch, contextAnalysis: ContextAnalysis): number {
    // Combine confidence from both sources
    const patternConfidence = patternMatch.confidence;
    const contextConfidence = this.calculateContextConfidence(contextAnalysis);
    
    // Weight pattern confidence more heavily
    return (patternConfidence * 0.7) + (contextConfidence * 0.3);
  }

  private calculateContextConfidence(contextAnalysis: ContextAnalysis): number {
    // Higher confidence if we have more automation signals
    const signalStrength = Object.values(contextAnalysis.automationSignals)
      .reduce((sum, signal) => sum + signal, 0) / 6; // Average of all signals
    
    const systemConfidence = contextAnalysis.systems.length > 0 ? 0.8 : 0.5;
    
    return Math.min(1, (signalStrength / 100) * 0.6 + systemConfidence * 0.4);
  }

  private determineLabel(score: number): 'Automatisierbar' | 'Teilweise Automatisierbar' | 'Mensch' {
    if (score >= 70) return 'Automatisierbar';
    if (score >= 30) return 'Teilweise Automatisierbar';
    return 'Mensch';
  }

  private generateReasoning(patternMatch: PatternMatch, contextAnalysis: ContextAnalysis): string {
    const patternDetails = instantMatcher.getPatternDetails(patternMatch.pattern);
    const patternName = patternDetails?.name || patternMatch.pattern;
    
    const signals = contextAnalysis.automationSignals;
    const strongSignals = Object.entries(signals)
      .filter(([_, value]) => value > 50)
      .map(([key, value]) => `${key}: ${value}%`)
      .join(', ');
    
    let reasoning = `Pattern: ${patternName} (${patternMatch.score}%)`;
    
    if (strongSignals) {
      reasoning += ` | Strong signals: ${strongSignals}`;
    }
    
    if (contextAnalysis.systems.length > 0) {
      reasoning += ` | Systems: ${contextAnalysis.systems.join(', ')}`;
    }
    
    return reasoning;
  }

  // Batch analysis for multiple tasks
  analyzeTasks(tasks: string[], jobContext?: string): FastAnalysisResult[] {
    return tasks.map(taskText => this.analyzeTask(taskText, jobContext));
  }

  // Get analysis statistics
  getAnalysisStats(results: FastAnalysisResult[]) {
    const totalTasks = results.length;
    const automatisierbar = results.filter(r => r.label === 'Automatisierbar').length;
    const teilweise = results.filter(r => r.label === 'Teilweise Automatisierbar').length;
    const mensch = results.filter(r => r.label === 'Mensch').length;
    
    const avgAutomationPotential = results.reduce((sum, r) => sum + r.automationPotential, 0) / totalTasks;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTasks;
    const avgAnalysisTime = results.reduce((sum, r) => sum + r.analysisTime, 0) / totalTasks;
    
    return {
      totalTasks,
      distribution: {
        automatisierbar: Math.round((automatisierbar / totalTasks) * 100),
        teilweise: Math.round((teilweise / totalTasks) * 100),
        mensch: Math.round((mensch / totalTasks) * 100)
      },
      averages: {
        automationPotential: Math.round(avgAutomationPotential),
        confidence: Math.round(avgConfidence),
        analysisTime: Math.round(avgAnalysisTime)
      }
    };
  }
}

// Export singleton instance
export const fastAnalysisEngine = new FastAnalysisEngine();
