/**
 * Analysis Pipeline Monitoring
 * 
 * Specialized monitoring for the refactored analysis pipeline
 */

import { performanceMonitor, recordEvent, recordError, recordMetric, startTimer, endTimer } from './performanceMonitor';

export interface AnalysisMetrics {
  // Job Parsing Metrics
  jobParsingDuration: number;
  jobParsingSuccess: boolean;
  jobParsingErrors: number;
  extractedTasks: number;
  
  // Task Classification Metrics
  taskClassificationDuration: number;
  taskClassificationSuccess: boolean;
  taskClassificationErrors: number;
  classifiedTasks: number;
  industryDetectionAccuracy: number;
  
  // ROI Aggregation Metrics
  roiAggregationDuration: number;
  roiAggregationSuccess: boolean;
  roiAggregationErrors: number;
  aggregatedResults: number;
  
  // Overall Pipeline Metrics
  totalPipelineDuration: number;
  pipelineSuccess: boolean;
  pipelineErrors: number;
  totalTasks: number;
  totalSubtasks: number;
}

export interface AnalysisEvent {
  type: 'job_parsing' | 'task_classification' | 'roi_aggregation' | 'pipeline_complete' | 'pipeline_error';
  jobTitle?: string;
  industry?: string;
  taskCount?: number;
  subtaskCount?: number;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export class AnalysisMonitor {
  private static instance: AnalysisMonitor;
  private currentAnalysisId: string | null = null;
  private analysisStartTime: number | null = null;

  static getInstance(): AnalysisMonitor {
    if (!AnalysisMonitor.instance) {
      AnalysisMonitor.instance = new AnalysisMonitor();
    }
    return AnalysisMonitor.instance;
  }

  /**
   * Start monitoring a new analysis
   */
  startAnalysis(jobTitle: string, jobDescription: string): string {
    const analysisId = crypto.randomUUID();
    this.currentAnalysisId = analysisId;
    this.analysisStartTime = performance.now();

    startTimer('analysis_pipeline', {
      analysisId,
      jobTitle: jobTitle.substring(0, 50) // Truncate for privacy
    });

    recordEvent('analysis_started', {
      analysisId,
      jobTitle: jobTitle.substring(0, 50),
      jobDescriptionLength: jobDescription.length,
      timestamp: Date.now()
    }, {
      analysisId,
      type: 'analysis_start'
    });

    return analysisId;
  }

  /**
   * Monitor job parsing phase
   */
  monitorJobParsing(analysisId: string, jobDescription: string): void {
    startTimer('job_parsing', { analysisId });

    recordEvent('job_parsing_started', {
      analysisId,
      jobDescriptionLength: jobDescription.length
    }, {
      analysisId,
      type: 'job_parsing'
    });
  }

  /**
   * Complete job parsing monitoring
   */
  completeJobParsing(analysisId: string, extractedTasks: any[], success: boolean, error?: Error): void {
    endTimer('job_parsing', { analysisId }, {
      extractedTasks: extractedTasks.length,
      success
    });

    recordEvent('job_parsing_completed', {
      analysisId,
      extractedTasks: extractedTasks.length,
      success
    }, {
      analysisId,
      type: 'job_parsing'
    });

    recordMetric({
      name: 'job_parsing_duration',
      value: 0, // Will be calculated by timer
      unit: 'milliseconds',
      tags: { analysisId, success: success.toString() }
    });

    recordMetric({
      name: 'extracted_tasks_count',
      value: extractedTasks.length,
      unit: 'count',
      tags: { analysisId }
    });

    if (!success && error) {
      recordError('job_parsing_error', error, { analysisId });
    }
  }

  /**
   * Monitor task classification phase
   */
  monitorTaskClassification(analysisId: string, tasks: any[]): void {
    startTimer('task_classification', { analysisId });

    recordEvent('task_classification_started', {
      analysisId,
      taskCount: tasks.length
    }, {
      analysisId,
      type: 'task_classification'
    });
  }

  /**
   * Complete task classification monitoring
   */
  completeTaskClassification(
    analysisId: string, 
    classifiedTasks: any[], 
    industry: string, 
    success: boolean, 
    error?: Error
  ): void {
    endTimer('task_classification', { analysisId }, {
      classifiedTasks: classifiedTasks.length,
      industry,
      success
    });

    recordEvent('task_classification_completed', {
      analysisId,
      classifiedTasks: classifiedTasks.length,
      industry,
      success
    }, {
      analysisId,
      type: 'task_classification'
    });

    recordMetric({
      name: 'task_classification_duration',
      value: 0, // Will be calculated by timer
      unit: 'milliseconds',
      tags: { analysisId, success: success.toString(), industry }
    });

    recordMetric({
      name: 'classified_tasks_count',
      value: classifiedTasks.length,
      unit: 'count',
      tags: { analysisId, industry }
    });

    if (!success && error) {
      recordError('task_classification_error', error, { analysisId, industry });
    }
  }

  /**
   * Monitor ROI aggregation phase
   */
  monitorROIAggregation(analysisId: string, tasks: any[]): void {
    startTimer('roi_aggregation', { analysisId });

    recordEvent('roi_aggregation_started', {
      analysisId,
      taskCount: tasks.length
    }, {
      analysisId,
      type: 'roi_aggregation'
    });
  }

  /**
   * Complete ROI aggregation monitoring
   */
  completeROIAggregation(
    analysisId: string, 
    aggregatedResults: any, 
    success: boolean, 
    error?: Error
  ): void {
    endTimer('roi_aggregation', { analysisId }, {
      aggregatedResults: Object.keys(aggregatedResults).length,
      success
    });

    recordEvent('roi_aggregation_completed', {
      analysisId,
      aggregatedResults: Object.keys(aggregatedResults).length,
      success
    }, {
      analysisId,
      type: 'roi_aggregation'
    });

    recordMetric({
      name: 'roi_aggregation_duration',
      value: 0, // Will be calculated by timer
      unit: 'milliseconds',
      tags: { analysisId, success: success.toString() }
    });

    if (!success && error) {
      recordError('roi_aggregation_error', error, { analysisId });
    }
  }

  /**
   * Complete the entire analysis pipeline
   */
  completeAnalysis(
    analysisId: string, 
    results: any, 
    success: boolean, 
    error?: Error
  ): void {
    if (this.analysisStartTime) {
      const totalDuration = performance.now() - this.analysisStartTime;
      
      endTimer('analysis_pipeline', { analysisId }, {
        totalDuration,
        success,
        resultsCount: Object.keys(results).length
      });

      recordEvent('analysis_completed', {
        analysisId,
        totalDuration,
        success,
        resultsCount: Object.keys(results).length
      }, {
        analysisId,
        type: 'analysis_complete'
      });

      recordMetric({
        name: 'analysis_pipeline_duration',
        value: totalDuration,
        unit: 'milliseconds',
        tags: { analysisId, success: success.toString() }
      });

      recordMetric({
        name: 'analysis_success_rate',
        value: success ? 1 : 0,
        unit: 'percentage',
        tags: { analysisId }
      });
    }

    if (!success && error) {
      recordError('analysis_pipeline_error', error, { analysisId });
    }

    // Reset for next analysis
    this.currentAnalysisId = null;
    this.analysisStartTime = null;
  }

  /**
   * Monitor AI generation performance
   */
  monitorAIGeneration(analysisId: string, prompt: string, model: string): void {
    startTimer('ai_generation', { analysisId, model });

    recordEvent('ai_generation_started', {
      analysisId,
      model,
      promptLength: prompt.length
    }, {
      analysisId,
      type: 'ai_generation'
    });
  }

  /**
   * Complete AI generation monitoring
   */
  completeAIGeneration(
    analysisId: string, 
    model: string, 
    response: any, 
    success: boolean, 
    error?: Error
  ): void {
    endTimer('ai_generation', { analysisId, model }, {
      responseLength: JSON.stringify(response).length,
      success
    });

    recordEvent('ai_generation_completed', {
      analysisId,
      model,
      responseLength: JSON.stringify(response).length,
      success
    }, {
      analysisId,
      type: 'ai_generation'
    });

    recordMetric({
      name: 'ai_generation_duration',
      value: 0, // Will be calculated by timer
      unit: 'milliseconds',
      tags: { analysisId, model, success: success.toString() }
    });

    recordMetric({
      name: 'ai_generation_tokens',
      value: response?.usage?.total_tokens || 0,
      unit: 'count',
      tags: { analysisId, model }
    });

    if (!success && error) {
      recordError('ai_generation_error', error, { analysisId, model });
    }
  }

  /**
   * Monitor cache performance
   */
  monitorCacheOperation(operation: 'hit' | 'miss' | 'set', key: string, size?: number): void {
    recordEvent('cache_operation', {
      operation,
      key: key.substring(0, 50), // Truncate for privacy
      size
    }, {
      type: 'cache_operation',
      operation
    });

    recordMetric({
      name: 'cache_operation',
      value: 1,
      unit: 'count',
      tags: { operation }
    });

    if (size) {
      recordMetric({
        name: 'cache_size',
        value: size,
        unit: 'bytes',
        tags: { operation }
      });
    }
  }

  /**
   * Get current analysis metrics
   */
  getCurrentAnalysisMetrics(): Partial<AnalysisMetrics> | null {
    if (!this.currentAnalysisId) return null;

    // This would typically aggregate metrics from the performance monitor
    // For now, return basic info
    return {
      totalTasks: 0,
      totalSubtasks: 0,
      pipelineSuccess: true
    };
  }

  /**
   * Get analysis performance summary
   */
  getAnalysisSummary(analysisId: string): {
    duration: number;
    success: boolean;
    phases: string[];
    errors: string[];
  } {
    // This would typically query the performance monitor for specific analysis data
    return {
      duration: 0,
      success: true,
      phases: [],
      errors: []
    };
  }
}

// Export singleton instance
export const analysisMonitor = AnalysisMonitor.getInstance();

// Convenience functions
export const startAnalysisMonitoring = (jobTitle: string, jobDescription: string) => 
  analysisMonitor.startAnalysis(jobTitle, jobDescription);

export const monitorJobParsing = (analysisId: string, jobDescription: string) => 
  analysisMonitor.monitorJobParsing(analysisId, jobDescription);

export const completeJobParsing = (analysisId: string, extractedTasks: any[], success: boolean, error?: Error) => 
  analysisMonitor.completeJobParsing(analysisId, extractedTasks, success, error);

export const monitorTaskClassification = (analysisId: string, tasks: any[]) => 
  analysisMonitor.monitorTaskClassification(analysisId, tasks);

export const completeTaskClassification = (
  analysisId: string, 
  classifiedTasks: any[], 
  industry: string, 
  success: boolean, 
  error?: Error
) => analysisMonitor.completeTaskClassification(analysisId, classifiedTasks, industry, success, error);

export const monitorROIAggregation = (analysisId: string, tasks: any[]) => 
  analysisMonitor.monitorROIAggregation(analysisId, tasks);

export const completeROIAggregation = (
  analysisId: string, 
  aggregatedResults: any, 
  success: boolean, 
  error?: Error
) => analysisMonitor.completeROIAggregation(analysisId, aggregatedResults, success, error);

export const completeAnalysisMonitoring = (
  analysisId: string, 
  results: any, 
  success: boolean, 
  error?: Error
) => analysisMonitor.completeAnalysis(analysisId, results, success, error);

export const monitorAIGeneration = (analysisId: string, prompt: string, model: string) => 
  analysisMonitor.monitorAIGeneration(analysisId, prompt, model);

export const completeAIGeneration = (
  analysisId: string, 
  model: string, 
  response: any, 
  success: boolean, 
  error?: Error
) => analysisMonitor.completeAIGeneration(analysisId, model, response, success, error);

export const monitorCacheOperation = (operation: 'hit' | 'miss' | 'set', key: string, size?: number) => 
  analysisMonitor.monitorCacheOperation(operation, key, size);
