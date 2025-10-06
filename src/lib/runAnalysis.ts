import { AnalysisPipeline } from './analysis/analysisPipeline';
import { AnalysisResult, ROIAggregator } from './analysis/roiAggregator';
import { TaskClassifier } from './analysis/taskClassifier';

// Re-export types for backward compatibility
export type { AnalysisResult } from './analysis/roiAggregator';
export type { Task } from './analysis/taskClassifier';

// Create instances for backward compatibility
const taskClassifier = new TaskClassifier();
const roiAggregator = new ROIAggregator();

/**
 * Main analysis function - now uses the modular pipeline
 */
export async function runAnalysis(jobText: string, lang: 'de' | 'en' = 'de'): Promise<AnalysisResult> {
  const pipeline = new AnalysisPipeline();
  return pipeline.runAnalysis(jobText, lang);
}

/**
 * Detect industry from text - backward compatibility
 */
export function detectIndustry(text: string): string {
  return taskClassifier.detectIndustry(text);
}

/**
 * Generate summary - backward compatibility
 */
export function generateSummary(totalScore: number, ratio: { automatisierbar: number; mensch: number }, taskCount: number, lang: 'de' | 'en' = 'de'): string {
  return roiAggregator.generateSummary(totalScore, taskCount, lang);
}