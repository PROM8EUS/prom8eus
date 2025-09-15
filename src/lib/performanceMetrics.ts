/**
 * Source Performance Metrics System
 * 
 * This module provides comprehensive performance tracking and analytics
 * for all source operations including response time, success rate, and data quality.
 */

export interface PerformanceMetric {
  id: string;
  sourceId: string;
  operation: string;
  timestamp: Date;
  responseTime: number; // milliseconds
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  dataSize?: number; // bytes
  cacheHit?: boolean;
  retryCount?: number;
  metadata?: Record<string, any>;
}

export interface SourcePerformanceStats {
  sourceId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number; // percentage
  errorRate: number; // percentage
  totalDataTransferred: number; // bytes
  averageDataSize: number; // bytes
  cacheHitRate: number; // percentage
  averageRetryCount: number;
  uptime: number; // percentage
  lastUpdated: Date;
  timeWindow: {
    start: Date;
    end: Date;
  };
}

export interface PerformanceAlert {
  id: string;
  sourceId: string;
  type: 'response_time' | 'success_rate' | 'error_rate' | 'data_quality' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceConfig {
  responseTimeThresholds: {
    warning: number; // ms
    critical: number; // ms
  };
  successRateThresholds: {
    warning: number; // percentage
    critical: number; // percentage
  };
  errorRateThresholds: {
    warning: number; // percentage
    critical: number; // percentage
  };
  dataQualityThresholds: {
    warning: number; // percentage
    critical: number; // percentage
  };
  alertCooldown: number; // minutes
  retentionPeriod: number; // days
  aggregationInterval: number; // minutes
  enableRealTimeAlerts: boolean;
  enablePerformanceOptimization: boolean;
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  sources: SourcePerformanceStats[];
  overallStats: {
    totalRequests: number;
    averageResponseTime: number;
    overallSuccessRate: number;
    totalDataTransferred: number;
    topPerformingSources: string[];
    worstPerformingSources: string[];
  };
  alerts: PerformanceAlert[];
  recommendations: string[];
  trends: {
    responseTimeTrend: 'improving' | 'stable' | 'degrading';
    successRateTrend: 'improving' | 'stable' | 'degrading';
    dataQualityTrend: 'improving' | 'stable' | 'degrading';
  };
}

/**
 * Performance Metrics Collector
 */
export class PerformanceMetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private config: PerformanceConfig;
  private alerts: PerformanceAlert[] = [];
  private statsCache: Map<string, SourcePerformanceStats> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      responseTimeThresholds: {
        warning: 2000, // 2 seconds
        critical: 5000 // 5 seconds
      },
      successRateThresholds: {
        warning: 95, // 95%
        critical: 90 // 90%
      },
      errorRateThresholds: {
        warning: 5, // 5%
        critical: 10 // 10%
      },
      dataQualityThresholds: {
        warning: 85, // 85%
        critical: 75 // 75%
      },
      alertCooldown: 15, // 15 minutes
      retentionPeriod: 30, // 30 days
      aggregationInterval: 5, // 5 minutes
      enableRealTimeAlerts: true,
      enablePerformanceOptimization: true,
      ...config
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      id: this.generateMetricId(),
      timestamp: new Date(),
      ...metric
    };

    this.metrics.push(fullMetric);
    this.invalidateStatsCache(metric.sourceId);

    // Check for alerts
    if (this.config.enableRealTimeAlerts) {
      this.checkForAlerts(fullMetric);
    }

    // Cleanup old metrics if needed
    this.cleanupOldMetrics();
  }

  /**
   * Record a successful operation
   */
  recordSuccess(
    sourceId: string,
    operation: string,
    responseTime: number,
    dataSize?: number,
    cacheHit?: boolean,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric({
      sourceId,
      operation,
      responseTime,
      success: true,
      dataSize,
      cacheHit,
      metadata
    });
  }

  /**
   * Record a failed operation
   */
  recordFailure(
    sourceId: string,
    operation: string,
    responseTime: number,
    errorCode: string,
    errorMessage: string,
    retryCount?: number,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric({
      sourceId,
      operation,
      responseTime,
      success: false,
      errorCode,
      errorMessage,
      retryCount,
      metadata
    });
  }

  /**
   * Get performance statistics for a source
   */
  getSourceStats(sourceId: string, timeWindow?: { start: Date; end: Date }): SourcePerformanceStats {
    const cacheKey = `${sourceId}_${timeWindow?.start?.getTime()}_${timeWindow?.end?.getTime()}`;
    
    if (this.statsCache.has(cacheKey)) {
      return this.statsCache.get(cacheKey)!;
    }

    const filteredMetrics = this.filterMetricsByTimeWindow(
      this.metrics.filter(m => m.sourceId === sourceId),
      timeWindow
    );

    const stats = this.calculateSourceStats(sourceId, filteredMetrics, timeWindow);
    this.statsCache.set(cacheKey, stats);

    return stats;
  }

  /**
   * Get performance statistics for all sources
   */
  getAllSourcesStats(timeWindow?: { start: Date; end: Date }): SourcePerformanceStats[] {
    const sourceIds = [...new Set(this.metrics.map(m => m.sourceId))];
    return sourceIds.map(sourceId => this.getSourceStats(sourceId, timeWindow));
  }

  /**
   * Get performance report for a time period
   */
  getPerformanceReport(start: Date, end: Date): PerformanceReport {
    const timeWindow = { start, end };
    const allStats = this.getAllSourcesStats(timeWindow);
    const alerts = this.getAlertsInTimeWindow(start, end);

    const overallStats = this.calculateOverallStats(allStats);
    const recommendations = this.generateRecommendations(allStats, alerts);
    const trends = this.calculateTrends(allStats);

    return {
      period: timeWindow,
      sources: allStats,
      overallStats,
      alerts,
      recommendations,
      trends
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
  }

  /**
   * Update performance configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.statsCache.clear(); // Clear cache when config changes
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Clear all metrics (for testing or reset)
   */
  clearMetrics(): void {
    this.metrics = [];
    this.alerts = [];
    this.statsCache.clear();
    this.lastAlertTime.clear();
  }

  /**
   * Export metrics data
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCSV();
    }
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Import metrics data
   */
  importMetrics(data: string, format: 'json' | 'csv' = 'json'): void {
    if (format === 'csv') {
      this.importFromCSV(data);
    } else {
      const metrics = JSON.parse(data);
      this.metrics.push(...metrics);
      this.statsCache.clear();
    }
  }

  /**
   * Calculate source statistics
   */
  private calculateSourceStats(
    sourceId: string,
    metrics: PerformanceMetric[],
    timeWindow?: { start: Date; end: Date }
  ): SourcePerformanceStats {
    if (metrics.length === 0) {
      return this.createEmptyStats(sourceId, timeWindow);
    }

    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const successfulMetrics = metrics.filter(m => m.success);
    const failedMetrics = metrics.filter(m => !m.success);
    const cacheHits = metrics.filter(m => m.cacheHit === true);

    const totalRequests = metrics.length;
    const successfulRequests = successfulMetrics.length;
    const failedRequests = failedMetrics.length;
    const successRate = (successfulRequests / totalRequests) * 100;
    const errorRate = (failedRequests / totalRequests) * 100;

    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const medianResponseTime = this.calculatePercentile(responseTimes, 50);
    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(responseTimes, 99);

    const totalDataTransferred = metrics.reduce((sum, m) => sum + (m.dataSize || 0), 0);
    const averageDataSize = totalDataTransferred / totalRequests;

    const cacheHitRate = (cacheHits.length / totalRequests) * 100;
    const averageRetryCount = metrics.reduce((sum, m) => sum + (m.retryCount || 0), 0) / totalRequests;

    // Calculate uptime (simplified - based on success rate)
    const uptime = successRate;

    return {
      sourceId,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      medianResponseTime: Math.round(medianResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      totalDataTransferred,
      averageDataSize: Math.round(averageDataSize),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      averageRetryCount: Math.round(averageRetryCount * 100) / 100,
      uptime: Math.round(uptime * 100) / 100,
      lastUpdated: new Date(),
      timeWindow: timeWindow || {
        start: new Date(Math.min(...metrics.map(m => m.timestamp.getTime()))),
        end: new Date(Math.max(...metrics.map(m => m.timestamp.getTime())))
      }
    };
  }

  /**
   * Calculate overall statistics
   */
  private calculateOverallStats(stats: SourcePerformanceStats[]): PerformanceReport['overallStats'] {
    const totalRequests = stats.reduce((sum, s) => sum + s.totalRequests, 0);
    const totalSuccessful = stats.reduce((sum, s) => sum + s.successfulRequests, 0);
    const totalDataTransferred = stats.reduce((sum, s) => sum + s.totalDataTransferred, 0);

    const averageResponseTime = stats.reduce((sum, s) => sum + (s.averageResponseTime * s.totalRequests), 0) / totalRequests;
    const overallSuccessRate = (totalSuccessful / totalRequests) * 100;

    // Sort sources by performance
    const sortedByResponseTime = [...stats].sort((a, b) => a.averageResponseTime - b.averageResponseTime);
    const sortedBySuccessRate = [...stats].sort((a, b) => b.successRate - a.successRate);

    const topPerformingSources = sortedByResponseTime.slice(0, 3).map(s => s.sourceId);
    const worstPerformingSources = sortedByResponseTime.slice(-3).map(s => s.sourceId);

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
      totalDataTransferred,
      topPerformingSources,
      worstPerformingSources
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(stats: SourcePerformanceStats[], alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = [];

    // Response time recommendations
    const slowSources = stats.filter(s => s.averageResponseTime > this.config.responseTimeThresholds.warning);
    if (slowSources.length > 0) {
      recommendations.push(`Consider optimizing ${slowSources.map(s => s.sourceId).join(', ')} - average response time exceeds ${this.config.responseTimeThresholds.warning}ms`);
    }

    // Success rate recommendations
    const lowSuccessSources = stats.filter(s => s.successRate < this.config.successRateThresholds.warning);
    if (lowSuccessSources.length > 0) {
      recommendations.push(`Investigate reliability issues with ${lowSuccessSources.map(s => s.sourceId).join(', ')} - success rate below ${this.config.successRateThresholds.warning}%`);
    }

    // Cache recommendations
    const lowCacheSources = stats.filter(s => s.cacheHitRate < 50);
    if (lowCacheSources.length > 0) {
      recommendations.push(`Improve caching for ${lowCacheSources.map(s => s.sourceId).join(', ')} - cache hit rate below 50%`);
    }

    // Data transfer recommendations
    const highDataSources = stats.filter(s => s.averageDataSize > 1024 * 1024); // > 1MB
    if (highDataSources.length > 0) {
      recommendations.push(`Consider data compression for ${highDataSources.map(s => s.sourceId).join(', ')} - average data size exceeds 1MB`);
    }

    return recommendations;
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(stats: SourcePerformanceStats[]): PerformanceReport['trends'] {
    // Simplified trend calculation - in a real implementation, you'd compare with historical data
    const avgResponseTime = stats.reduce((sum, s) => sum + s.averageResponseTime, 0) / stats.length;
    const avgSuccessRate = stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length;

    return {
      responseTimeTrend: avgResponseTime < 1000 ? 'improving' : avgResponseTime < 2000 ? 'stable' : 'degrading',
      successRateTrend: avgSuccessRate > 98 ? 'improving' : avgSuccessRate > 95 ? 'stable' : 'degrading',
      dataQualityTrend: 'stable' // Would need data quality metrics to calculate
    };
  }

  /**
   * Check for performance alerts
   */
  private checkForAlerts(metric: PerformanceMetric): void {
    const sourceId = metric.sourceId;
    const alertKey = `${sourceId}_${metric.operation}`;
    const now = new Date();
    const lastAlert = this.lastAlertTime.get(alertKey);

    // Check cooldown period
    if (lastAlert && (now.getTime() - lastAlert.getTime()) < this.config.alertCooldown * 60 * 1000) {
      return;
    }

    // Check response time
    if (metric.responseTime > this.config.responseTimeThresholds.critical) {
      this.createAlert(sourceId, 'response_time', 'critical', 
        `Response time ${metric.responseTime}ms exceeds critical threshold ${this.config.responseTimeThresholds.critical}ms`,
        this.config.responseTimeThresholds.critical, metric.responseTime, metric);
    } else if (metric.responseTime > this.config.responseTimeThresholds.warning) {
      this.createAlert(sourceId, 'response_time', 'high',
        `Response time ${metric.responseTime}ms exceeds warning threshold ${this.config.responseTimeThresholds.warning}ms`,
        this.config.responseTimeThresholds.warning, metric.responseTime, metric);
    }

    // Check for failures
    if (!metric.success) {
      this.createAlert(sourceId, 'error_rate', 'high',
        `Operation failed: ${metric.errorMessage}`,
        0, 100, metric);
    }

    this.lastAlertTime.set(alertKey, now);
  }

  /**
   * Create a performance alert
   */
  private createAlert(
    sourceId: string,
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    threshold: number,
    currentValue: number,
    metric: PerformanceMetric
  ): void {
    const alert: PerformanceAlert = {
      id: this.generateAlertId(),
      sourceId,
      type,
      severity,
      message,
      threshold,
      currentValue,
      timestamp: new Date(),
      resolved: false,
      metadata: {
        operation: metric.operation,
        errorCode: metric.errorCode,
        responseTime: metric.responseTime
      }
    };

    this.alerts.push(alert);
  }

  /**
   * Helper methods
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private filterMetricsByTimeWindow(metrics: PerformanceMetric[], timeWindow?: { start: Date; end: Date }): PerformanceMetric[] {
    if (!timeWindow) return metrics;
    return metrics.filter(m => m.timestamp >= timeWindow.start && m.timestamp <= timeWindow.end);
  }

  private getAlertsInTimeWindow(start: Date, end: Date): PerformanceAlert[] {
    return this.alerts.filter(alert => alert.timestamp >= start && alert.timestamp <= end);
  }

  private createEmptyStats(sourceId: string, timeWindow?: { start: Date; end: Date }): SourcePerformanceStats {
    return {
      sourceId,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      medianResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      successRate: 0,
      errorRate: 0,
      totalDataTransferred: 0,
      averageDataSize: 0,
      cacheHitRate: 0,
      averageRetryCount: 0,
      uptime: 0,
      lastUpdated: new Date(),
      timeWindow: timeWindow || { start: new Date(), end: new Date() }
    };
  }

  private invalidateStatsCache(sourceId: string): void {
    for (const key of this.statsCache.keys()) {
      if (key.startsWith(sourceId)) {
        this.statsCache.delete(key);
      }
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000); // Run every hour
  }

  private cleanupOldMetrics(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);

    const initialLength = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffDate);
    
    if (this.metrics.length !== initialLength) {
      this.statsCache.clear(); // Clear cache when metrics are cleaned up
    }
  }

  private exportToCSV(): string {
    if (this.metrics.length === 0) return '';
    
    const headers = Object.keys(this.metrics[0]).join(',');
    const rows = this.metrics.map(metric => 
      Object.values(metric).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  private importFromCSV(csvData: string): void {
    const lines = csvData.split('\n');
    if (lines.length < 2) return;
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const metrics = lines.slice(1).map(line => {
      const values = line.split(',');
      const metric: any = {};
      headers.forEach((header, index) => {
        let value = values[index]?.replace(/"/g, '');
        if (header === 'timestamp') {
          value = new Date(value);
        } else if (header === 'responseTime' || header === 'dataSize' || header === 'retryCount') {
          value = parseInt(value) || 0;
        } else if (header === 'success' || header === 'cacheHit') {
          value = value === 'true';
        }
        metric[header] = value;
      });
      return metric as PerformanceMetric;
    });
    
    this.metrics.push(...metrics);
    this.statsCache.clear();
  }
}

// Export singleton instance
export const performanceMetrics = new PerformanceMetricsCollector();
