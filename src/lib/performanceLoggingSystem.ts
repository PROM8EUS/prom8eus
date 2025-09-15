/**
 * Source Performance Logging and Analysis System
 * 
 * This module provides comprehensive performance logging and analysis for all
 * source operations including detailed logging, performance analysis, trend
 * analysis, and optimization recommendations.
 */

export interface PerformanceLog {
  id: string;
  timestamp: Date;
  sourceId: string;
  operation: string;
  duration: number; // milliseconds
  success: boolean;
  errorMessage?: string;
  requestSize: number; // bytes
  responseSize: number; // bytes
  metadata: Record<string, any>;
  tags: string[];
  userId?: string;
  sessionId?: string;
}

export interface PerformanceAnalysis {
  sourceId: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    medianDuration: number;
    p95Duration: number;
    p99Duration: number;
    totalDataTransferred: number;
    averageRequestSize: number;
    averageResponseSize: number;
  };
  trends: {
    duration: TrendData[];
    successRate: TrendData[];
    throughput: TrendData[];
    errorRate: TrendData[];
  };
  bottlenecks: BottleneckAnalysis[];
  recommendations: PerformanceRecommendation[];
}

export interface TrendData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface BottleneckAnalysis {
  type: 'cpu' | 'memory' | 'network' | 'database' | 'cache' | 'external_api';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number; // percentage
  frequency: number; // occurrences per hour
  recommendations: string[];
  metrics: {
    duration: number;
    occurrences: number;
    affectedOperations: string[];
  };
}

export interface PerformanceRecommendation {
  id: string;
  type: 'optimization' | 'scaling' | 'caching' | 'configuration' | 'architecture';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImprovement: number; // percentage
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
  metrics: {
    currentValue: number;
    targetValue: number;
    unit: string;
  };
}

export interface PerformanceReport {
  id: string;
  title: string;
  period: {
    start: Date;
    end: Date;
  };
  generated: Date;
  sources: string[];
  analysis: PerformanceAnalysis[];
  summary: {
    totalSources: number;
    averagePerformance: number;
    criticalIssues: number;
    recommendations: number;
  };
  insights: string[];
  actionItems: string[];
}

export interface LoggingConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  retentionPeriod: number; // days
  maxLogSize: number; // bytes
  compressionEnabled: boolean;
  samplingRate: number; // 0-1
  sensitiveDataMasking: boolean;
  realTimeAnalysis: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
}

/**
 * Performance Logging and Analysis Manager
 */
export class PerformanceLoggingManager {
  private config: LoggingConfig;
  private logs: PerformanceLog[] = [];
  private analysisCache: Map<string, PerformanceAnalysis> = new Map();
  private reports: PerformanceReport[] = [];
  private flushInterval?: NodeJS.Timeout;
  private analysisInterval?: NodeJS.Timeout;

  constructor(config?: Partial<LoggingConfig>) {
    this.config = {
      enabled: true,
      logLevel: 'info',
      retentionPeriod: 30,
      maxLogSize: 100 * 1024 * 1024, // 100MB
      compressionEnabled: true,
      samplingRate: 1.0,
      sensitiveDataMasking: true,
      realTimeAnalysis: true,
      batchSize: 1000,
      flushInterval: 5000, // 5 seconds
      ...config
    };

    if (this.config.enabled) {
      this.startLogging();
    }
  }

  /**
   * Log performance event
   */
  logPerformance(event: Omit<PerformanceLog, 'id' | 'timestamp'>): void {
    if (!this.config.enabled) return;

    // Apply sampling
    if (Math.random() > this.config.samplingRate) return;

    const log: PerformanceLog = {
      id: this.generateId(),
      timestamp: new Date(),
      ...event
    };

    // Mask sensitive data if enabled
    if (this.config.sensitiveDataMasking) {
      log.metadata = this.maskSensitiveData(log.metadata);
    }

    this.logs.push(log);

    // Check if we need to flush
    if (this.logs.length >= this.config.batchSize) {
      this.flushLogs();
    }
  }

  /**
   * Analyze performance for a source
   */
  analyzePerformance(sourceId: string, period: { start: Date; end: Date }): PerformanceAnalysis {
    const cacheKey = `${sourceId}_${period.start.getTime()}_${period.end.getTime()}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const sourceLogs = this.logs.filter(log => 
      log.sourceId === sourceId &&
      log.timestamp >= period.start &&
      log.timestamp <= period.end
    );

    const analysis = this.performAnalysis(sourceId, period, sourceLogs);
    this.analysisCache.set(cacheKey, analysis);

    return analysis;
  }

  /**
   * Generate performance report
   */
  generateReport(sources: string[], period: { start: Date; end: Date }): PerformanceReport {
    const analysis: PerformanceAnalysis[] = [];
    
    for (const sourceId of sources) {
      analysis.push(this.analyzePerformance(sourceId, period));
    }

    const report: PerformanceReport = {
      id: this.generateId(),
      title: `Performance Report - ${period.start.toISOString().split('T')[0]} to ${period.end.toISOString().split('T')[0]}`,
      period,
      generated: new Date(),
      sources,
      analysis,
      summary: this.generateReportSummary(analysis),
      insights: this.generateInsights(analysis),
      actionItems: this.generateActionItems(analysis)
    };

    this.reports.push(report);
    return report;
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(sourceId: string, metric: 'duration' | 'success_rate' | 'throughput' | 'error_rate', period: { start: Date; end: Date }): TrendData[] {
    const sourceLogs = this.logs.filter(log => 
      log.sourceId === sourceId &&
      log.timestamp >= period.start &&
      log.timestamp <= period.end
    );

    return this.calculateTrends(sourceLogs, metric, period);
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(sourceId: string, period: { start: Date; end: Date }): PerformanceRecommendation[] {
    const analysis = this.analyzePerformance(sourceId, period);
    return analysis.recommendations;
  }

  /**
   * Get bottleneck analysis
   */
  getBottleneckAnalysis(sourceId: string, period: { start: Date; end: Date }): BottleneckAnalysis[] {
    const analysis = this.analyzePerformance(sourceId, period);
    return analysis.bottlenecks;
  }

  /**
   * Get performance logs
   */
  getLogs(filters?: {
    sourceId?: string;
    operation?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): PerformanceLog[] {
    let logs = [...this.logs];

    if (filters) {
      if (filters.sourceId) {
        logs = logs.filter(log => log.sourceId === filters.sourceId);
      }
      if (filters.operation) {
        logs = logs.filter(log => log.operation === filters.operation);
      }
      if (filters.success !== undefined) {
        logs = logs.filter(log => log.success === filters.success);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        logs = logs.slice(-filters.limit);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get performance reports
   */
  getReports(filters?: {
    sources?: string[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): PerformanceReport[] {
    let reports = [...this.reports];

    if (filters) {
      if (filters.sources) {
        reports = reports.filter(report => 
          filters.sources!.some(source => report.sources.includes(source))
        );
      }
      if (filters.startDate) {
        reports = reports.filter(report => report.period.start >= filters.startDate!);
      }
      if (filters.endDate) {
        reports = reports.filter(report => report.period.end <= filters.endDate!);
      }
      if (filters.limit) {
        reports = reports.slice(-filters.limit);
      }
    }

    return reports.sort((a, b) => b.generated.getTime() - a.generated.getTime());
  }

  /**
   * Update logging configuration
   */
  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled) {
      this.startLogging();
    } else {
      this.stopLogging();
    }
  }

  /**
   * Export performance data
   */
  exportData(format: 'json' | 'csv' | 'excel', filters?: {
    sourceId?: string;
    startDate?: Date;
    endDate?: Date;
  }): string {
    let logs = this.getLogs(filters);

    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      case 'csv':
        return this.convertToCSV(logs);
      case 'excel':
        return this.convertToExcel(logs);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Private helper methods
   */
  private startLogging(): void {
    if (this.config.flushInterval > 0) {
      this.flushInterval = setInterval(() => {
        this.flushLogs();
      }, this.config.flushInterval);
    }

    if (this.config.realTimeAnalysis) {
      this.analysisInterval = setInterval(() => {
        this.performRealTimeAnalysis();
      }, 60000); // Every minute
    }
  }

  private stopLogging(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = undefined;
    }

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = undefined;
    }
  }

  private flushLogs(): void {
    if (this.logs.length === 0) return;

    // In a real implementation, this would flush logs to persistent storage
    console.log(`Flushing ${this.logs.length} performance logs`);
    
    // Clear logs after flushing
    this.logs = [];
  }

  private performRealTimeAnalysis(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Analyze performance for all sources in the last hour
    const sources = [...new Set(this.logs.map(log => log.sourceId))];
    
    for (const sourceId of sources) {
      const analysis = this.analyzePerformance(sourceId, { start: oneHourAgo, end: now });
      
      // Check for critical issues
      const criticalBottlenecks = analysis.bottlenecks.filter(b => b.severity === 'critical');
      if (criticalBottlenecks.length > 0) {
        console.warn(`Critical performance issues detected for source ${sourceId}:`, criticalBottlenecks);
      }
    }
  }

  private performAnalysis(sourceId: string, period: { start: Date; end: Date }, logs: PerformanceLog[]): PerformanceAnalysis {
    const durations = logs.map(log => log.duration).sort((a, b) => a - b);
    const successfulLogs = logs.filter(log => log.success);
    const failedLogs = logs.filter(log => !log.success);

    const summary = {
      totalOperations: logs.length,
      successfulOperations: successfulLogs.length,
      failedOperations: failedLogs.length,
      averageDuration: durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
      medianDuration: durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0,
      p95Duration: durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0,
      p99Duration: durations.length > 0 ? durations[Math.floor(durations.length * 0.99)] : 0,
      totalDataTransferred: logs.reduce((sum, log) => sum + log.requestSize + log.responseSize, 0),
      averageRequestSize: logs.length > 0 ? logs.reduce((sum, log) => sum + log.requestSize, 0) / logs.length : 0,
      averageResponseSize: logs.length > 0 ? logs.reduce((sum, log) => sum + log.responseSize, 0) / logs.length : 0
    };

    const trends = {
      duration: this.calculateTrends(logs, 'duration', period),
      successRate: this.calculateTrends(logs, 'success_rate', period),
      throughput: this.calculateTrends(logs, 'throughput', period),
      errorRate: this.calculateTrends(logs, 'error_rate', period)
    };

    const bottlenecks = this.identifyBottlenecks(logs);
    const recommendations = this.generateRecommendations(summary, bottlenecks, logs);

    return {
      sourceId,
      period,
      summary,
      trends,
      bottlenecks,
      recommendations
    };
  }

  private calculateTrends(logs: PerformanceLog[], metric: string, period: { start: Date; end: Date }): TrendData[] {
    const interval = 5 * 60 * 1000; // 5 minutes
    const trends: TrendData[] = [];
    
    for (let time = period.start.getTime(); time < period.end.getTime(); time += interval) {
      const intervalStart = new Date(time);
      const intervalEnd = new Date(time + interval);
      
      const intervalLogs = logs.filter(log => 
        log.timestamp >= intervalStart && log.timestamp < intervalEnd
      );

      let value = 0;
      switch (metric) {
        case 'duration':
          value = intervalLogs.length > 0 ? 
            intervalLogs.reduce((sum, log) => sum + log.duration, 0) / intervalLogs.length : 0;
          break;
        case 'success_rate':
          value = intervalLogs.length > 0 ? 
            (intervalLogs.filter(log => log.success).length / intervalLogs.length) * 100 : 100;
          break;
        case 'throughput':
          value = intervalLogs.length / (interval / 1000); // operations per second
          break;
        case 'error_rate':
          value = intervalLogs.length > 0 ? 
            (intervalLogs.filter(log => !log.success).length / intervalLogs.length) * 100 : 0;
          break;
      }

      trends.push({
        timestamp: intervalStart,
        value,
        metadata: { count: intervalLogs.length }
      });
    }

    return trends;
  }

  private identifyBottlenecks(logs: PerformanceLog[]): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];

    // Analyze duration patterns
    const slowLogs = logs.filter(log => log.duration > 5000); // > 5 seconds
    if (slowLogs.length > 0) {
      bottlenecks.push({
        type: 'external_api',
        severity: slowLogs.length > logs.length * 0.1 ? 'high' : 'medium',
        description: 'Slow external API responses detected',
        impact: (slowLogs.length / logs.length) * 100,
        frequency: slowLogs.length / (logs.length / 60), // per hour
        recommendations: [
          'Implement request timeout',
          'Add retry mechanism with exponential backoff',
          'Consider caching frequently requested data'
        ],
        metrics: {
          duration: slowLogs.reduce((sum, log) => sum + log.duration, 0) / slowLogs.length,
          occurrences: slowLogs.length,
          affectedOperations: [...new Set(slowLogs.map(log => log.operation))]
        }
      });
    }

    // Analyze error patterns
    const errorLogs = logs.filter(log => !log.success);
    if (errorLogs.length > 0) {
      bottlenecks.push({
        type: 'network',
        severity: errorLogs.length > logs.length * 0.05 ? 'high' : 'medium',
        description: 'High error rate detected',
        impact: (errorLogs.length / logs.length) * 100,
        frequency: errorLogs.length / (logs.length / 60), // per hour
        recommendations: [
          'Implement circuit breaker pattern',
          'Add fallback mechanisms',
          'Improve error handling and retry logic'
        ],
        metrics: {
          duration: errorLogs.reduce((sum, log) => sum + log.duration, 0) / errorLogs.length,
          occurrences: errorLogs.length,
          affectedOperations: [...new Set(errorLogs.map(log => log.operation))]
        }
      });
    }

    // Analyze data transfer patterns
    const largeRequests = logs.filter(log => log.requestSize > 1024 * 1024); // > 1MB
    if (largeRequests.length > 0) {
      bottlenecks.push({
        type: 'network',
        severity: 'medium',
        description: 'Large request sizes detected',
        impact: (largeRequests.length / logs.length) * 100,
        frequency: largeRequests.length / (logs.length / 60), // per hour
        recommendations: [
          'Implement request compression',
          'Optimize data serialization',
          'Consider pagination for large datasets'
        ],
        metrics: {
          duration: largeRequests.reduce((sum, log) => sum + log.duration, 0) / largeRequests.length,
          occurrences: largeRequests.length,
          affectedOperations: [...new Set(largeRequests.map(log => log.operation))]
        }
      });
    }

    return bottlenecks;
  }

  private generateRecommendations(summary: any, bottlenecks: BottleneckAnalysis[], logs: PerformanceLog[]): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Response time recommendations
    if (summary.p95Duration > 2000) {
      recommendations.push({
        id: this.generateId(),
        type: 'optimization',
        priority: 'high',
        title: 'Optimize Response Times',
        description: '95th percentile response time is above 2 seconds',
        expectedImprovement: 30,
        effort: 'medium',
        implementation: [
          'Implement caching for frequently accessed data',
          'Optimize database queries',
          'Add request compression'
        ],
        metrics: {
          currentValue: summary.p95Duration,
          targetValue: 1000,
          unit: 'ms'
        }
      });
    }

    // Error rate recommendations
    const errorRate = (summary.failedOperations / summary.totalOperations) * 100;
    if (errorRate > 5) {
      recommendations.push({
        id: this.generateId(),
        type: 'configuration',
        priority: 'high',
        title: 'Reduce Error Rate',
        description: 'Error rate is above 5%',
        expectedImprovement: 50,
        effort: 'medium',
        implementation: [
          'Implement retry mechanisms',
          'Add circuit breaker pattern',
          'Improve error handling'
        ],
        metrics: {
          currentValue: errorRate,
          targetValue: 2,
          unit: '%'
        }
      });
    }

    // Throughput recommendations
    const throughput = summary.totalOperations / (logs.length > 0 ? 
      (logs[logs.length - 1].timestamp.getTime() - logs[0].timestamp.getTime()) / 1000 : 1);
    if (throughput < 10) {
      recommendations.push({
        id: this.generateId(),
        type: 'scaling',
        priority: 'medium',
        title: 'Improve Throughput',
        description: 'Throughput is below 10 operations per second',
        expectedImprovement: 100,
        effort: 'high',
        implementation: [
          'Implement connection pooling',
          'Add load balancing',
          'Consider horizontal scaling'
        ],
        metrics: {
          currentValue: throughput,
          targetValue: 50,
          unit: 'ops/sec'
        }
      });
    }

    return recommendations;
  }

  private generateReportSummary(analysis: PerformanceAnalysis[]): any {
    const totalSources = analysis.length;
    const averagePerformance = analysis.reduce((sum, a) => sum + a.summary.averageDuration, 0) / totalSources;
    const criticalIssues = analysis.reduce((sum, a) => 
      sum + a.bottlenecks.filter(b => b.severity === 'critical').length, 0);
    const recommendations = analysis.reduce((sum, a) => sum + a.recommendations.length, 0);

    return {
      totalSources,
      averagePerformance,
      criticalIssues,
      recommendations
    };
  }

  private generateInsights(analysis: PerformanceAnalysis[]): string[] {
    const insights: string[] = [];

    // Performance insights
    const slowestSource = analysis.reduce((slowest, current) => 
      current.summary.averageDuration > slowest.summary.averageDuration ? current : slowest);
    
    if (slowestSource.summary.averageDuration > 1000) {
      insights.push(`${slowestSource.sourceId} has the highest average response time (${slowestSource.summary.averageDuration.toFixed(0)}ms)`);
    }

    // Error rate insights
    const highestErrorRate = analysis.reduce((highest, current) => {
      const currentErrorRate = (current.summary.failedOperations / current.summary.totalOperations) * 100;
      const highestErrorRate = (highest.summary.failedOperations / highest.summary.totalOperations) * 100;
      return currentErrorRate > highestErrorRate ? current : highest;
    });

    const errorRate = (highestErrorRate.summary.failedOperations / highestErrorRate.summary.totalOperations) * 100;
    if (errorRate > 5) {
      insights.push(`${highestErrorRate.sourceId} has the highest error rate (${errorRate.toFixed(1)}%)`);
    }

    // Bottleneck insights
    const criticalBottlenecks = analysis.flatMap(a => a.bottlenecks.filter(b => b.severity === 'critical'));
    if (criticalBottlenecks.length > 0) {
      insights.push(`${criticalBottlenecks.length} critical performance bottlenecks identified across ${analysis.length} sources`);
    }

    return insights;
  }

  private generateActionItems(analysis: PerformanceAnalysis[]): string[] {
    const actionItems: string[] = [];

    // High priority recommendations
    const highPriorityRecommendations = analysis.flatMap(a => 
      a.recommendations.filter(r => r.priority === 'high' || r.priority === 'critical'));
    
    if (highPriorityRecommendations.length > 0) {
      actionItems.push(`Address ${highPriorityRecommendations.length} high-priority performance recommendations`);
    }

    // Critical bottlenecks
    const criticalBottlenecks = analysis.flatMap(a => a.bottlenecks.filter(b => b.severity === 'critical'));
    if (criticalBottlenecks.length > 0) {
      actionItems.push(`Resolve ${criticalBottlenecks.length} critical performance bottlenecks`);
    }

    // Monitoring improvements
    actionItems.push('Implement continuous performance monitoring');
    actionItems.push('Set up automated alerts for performance degradation');

    return actionItems;
  }

  private maskSensitiveData(metadata: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credential'];
    const masked = { ...metadata };

    for (const key in masked) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        masked[key] = '***MASKED***';
      }
    }

    return masked;
  }

  private convertToCSV(logs: PerformanceLog[]): string {
    if (logs.length === 0) return '';

    const headers = ['timestamp', 'sourceId', 'operation', 'duration', 'success', 'requestSize', 'responseSize'];
    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        log.timestamp.toISOString(),
        log.sourceId,
        log.operation,
        log.duration,
        log.success,
        log.requestSize,
        log.responseSize
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  private convertToExcel(logs: PerformanceLog[]): string {
    // In a real implementation, this would generate an Excel file
    // For now, return CSV format
    return this.convertToCSV(logs);
  }

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const performanceLoggingManager = new PerformanceLoggingManager();
