/**
 * Workflow System Monitoring
 * 
 * Comprehensive monitoring for the unified workflow system including:
 * - Performance metrics
 * - Health checks
 * - Error tracking
 * - Usage analytics
 */

import { supabase } from '../supabase';

export interface WorkflowMetrics {
  totalWorkflows: number;
  aiGeneratedWorkflows: number;
  githubWorkflows: number;
  n8nWorkflows: number;
  activeWorkflows: number;
  averageRating: number;
  totalDownloads: number;
  lastUpdated: Date;
}

export interface PerformanceMetrics {
  queryExecutionTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface HealthStatus {
  database: 'healthy' | 'degraded' | 'unhealthy';
  aiGeneration: 'healthy' | 'degraded' | 'unhealthy';
  featureFlags: 'healthy' | 'degraded' | 'unhealthy';
  overall: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: Date;
  issues: string[];
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: string;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export class WorkflowMonitoring {
  private static instance: WorkflowMonitoring;
  private metrics: WorkflowMetrics | null = null;
  private performanceMetrics: PerformanceMetrics | null = null;
  private healthStatus: HealthStatus | null = null;
  private errors: ErrorReport[] = [];
  private lastUpdate: Date | null = null;

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): WorkflowMonitoring {
    if (!WorkflowMonitoring.instance) {
      WorkflowMonitoring.instance = new WorkflowMonitoring();
    }
    return WorkflowMonitoring.instance;
  }

  /**
   * Initialize monitoring system
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      await this.updateMetrics();
      await this.checkHealth();
      this.startPeriodicUpdates();
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    }
  }

  /**
   * Update workflow metrics
   */
  public async updateMetrics(): Promise<WorkflowMetrics> {
    try {
      const startTime = Date.now();

      // Get total workflows
      const { data: totalData, error: totalError } = await supabase
        .from('unified_workflows')
        .select('id', { count: 'exact' });

      if (totalError) throw totalError;

      // Get AI-generated workflows
      const { data: aiData, error: aiError } = await supabase
        .from('unified_workflows')
        .select('id', { count: 'exact' })
        .eq('is_ai_generated', true);

      if (aiError) throw aiError;

      // Get GitHub workflows
      const { data: githubData, error: githubError } = await supabase
        .from('unified_workflows')
        .select('id', { count: 'exact' })
        .eq('source', 'github');

      if (githubError) throw githubError;

      // Get n8n workflows
      const { data: n8nData, error: n8nError } = await supabase
        .from('unified_workflows')
        .select('id', { count: 'exact' })
        .eq('source', 'n8n.io');

      if (n8nError) throw n8nError;

      // Get active workflows
      const { data: activeData, error: activeError } = await supabase
        .from('unified_workflows')
        .select('id', { count: 'exact' })
        .eq('active', true);

      if (activeError) throw activeError;

      // Get average rating
      const { data: ratingData, error: ratingError } = await supabase
        .from('unified_workflows')
        .select('rating')
        .not('rating', 'is', null);

      if (ratingError) throw ratingError;

      // Get total downloads
      const { data: downloadsData, error: downloadsError } = await supabase
        .from('unified_workflows')
        .select('downloads');

      if (downloadsError) throw downloadsError;

      const executionTime = Date.now() - startTime;

      this.metrics = {
        totalWorkflows: totalData?.length || 0,
        aiGeneratedWorkflows: aiData?.length || 0,
        githubWorkflows: githubData?.length || 0,
        n8nWorkflows: n8nData?.length || 0,
        activeWorkflows: activeData?.length || 0,
        averageRating: ratingData?.reduce((sum, item) => sum + (item.rating || 0), 0) / (ratingData?.length || 1),
        totalDownloads: downloadsData?.reduce((sum, item) => sum + (item.downloads || 0), 0) || 0,
        lastUpdated: new Date()
      };

      // Update performance metrics
      this.performanceMetrics = {
        queryExecutionTime: executionTime,
        cacheHitRate: 0.85, // Placeholder - would be calculated from actual cache stats
        errorRate: 0.02, // Placeholder - would be calculated from actual error stats
        throughput: 100, // Placeholder - requests per minute
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: 0.15 // Placeholder - would be calculated from actual CPU stats
      };

      this.lastUpdate = new Date();
      return this.metrics;

    } catch (error) {
      this.logError('Failed to update metrics', error, 'high');
      throw error;
    }
  }

  /**
   * Check system health
   */
  public async checkHealth(): Promise<HealthStatus> {
    const issues: string[] = [];
    let databaseStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let aiGenerationStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let featureFlagsStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      // Check database connectivity
      const { data, error } = await supabase
        .from('unified_workflows')
        .select('id')
        .limit(1);

      if (error) {
        databaseStatus = 'unhealthy';
        issues.push(`Database error: ${error.message}`);
      } else if (!data || data.length === 0) {
        databaseStatus = 'degraded';
        issues.push('No workflows found in database');
      }

      // Check feature flags
      const { data: flagsData, error: flagsError } = await supabase
        .from('feature_flags')
        .select('name, enabled')
        .in('name', ['unified_workflow_read', 'unified_workflow_ai_generation']);

      if (flagsError) {
        featureFlagsStatus = 'unhealthy';
        issues.push(`Feature flags error: ${flagsError.message}`);
      } else if (!flagsData || flagsData.length === 0) {
        featureFlagsStatus = 'degraded';
        issues.push('Feature flags not configured');
      }

      // Check AI generation (placeholder - would check actual AI service)
      // For now, assume healthy if no specific errors
      aiGenerationStatus = 'healthy';

    } catch (error) {
      databaseStatus = 'unhealthy';
      issues.push(`Health check failed: ${error}`);
    }

    const overallStatus = this.calculateOverallHealth(
      databaseStatus,
      aiGenerationStatus,
      featureFlagsStatus
    );

    this.healthStatus = {
      database: databaseStatus,
      aiGeneration: aiGenerationStatus,
      featureFlags: featureFlagsStatus,
      overall: overallStatus,
      lastChecked: new Date(),
      issues
    };

    return this.healthStatus;
  }

  /**
   * Calculate overall health status
   */
  private calculateOverallHealth(
    database: 'healthy' | 'degraded' | 'unhealthy',
    aiGeneration: 'healthy' | 'degraded' | 'unhealthy',
    featureFlags: 'healthy' | 'degraded' | 'unhealthy'
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (database === 'unhealthy' || aiGeneration === 'unhealthy' || featureFlags === 'unhealthy') {
      return 'unhealthy';
    }
    if (database === 'degraded' || aiGeneration === 'degraded' || featureFlags === 'degraded') {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Log error
   */
  public logError(
    message: string,
    error: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      error: message,
      context: {
        error: error?.message || error,
        stack: error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      severity,
      resolved: false
    };

    this.errors.push(errorReport);

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    // Log to console based on severity
    switch (severity) {
      case 'critical':
        console.error('🚨 CRITICAL:', message, error);
        break;
      case 'high':
        console.error('🔴 HIGH:', message, error);
        break;
      case 'medium':
        console.warn('🟡 MEDIUM:', message, error);
        break;
      case 'low':
        console.info('🔵 LOW:', message, error);
        break;
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): WorkflowMetrics | null {
    return this.metrics;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics | null {
    return this.performanceMetrics;
  }

  /**
   * Get health status
   */
  public getHealthStatus(): HealthStatus | null {
    return this.healthStatus;
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): {
    total: number;
    bySeverity: Record<string, number>;
    unresolved: number;
  } {
    const bySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errors.length,
      bySeverity,
      unresolved: this.errors.filter(e => !e.resolved).length
    };
  }

  /**
   * Start periodic updates
   */
  private startPeriodicUpdates(): void {
    // Update metrics every 5 minutes
    setInterval(async () => {
      try {
        await this.updateMetrics();
      } catch (error) {
        this.logError('Failed to update metrics in periodic update', error, 'medium');
      }
    }, 5 * 60 * 1000);

    // Check health every 2 minutes
    setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        this.logError('Failed to check health in periodic update', error, 'medium');
      }
    }, 2 * 60 * 1000);
  }

  /**
   * Generate monitoring report
   */
  public generateReport(): {
    timestamp: Date;
    metrics: WorkflowMetrics | null;
    performance: PerformanceMetrics | null;
    health: HealthStatus | null;
    errors: {
      recent: ErrorReport[];
      statistics: ReturnType<typeof this.getErrorStatistics>;
    };
  } {
    return {
      timestamp: new Date(),
      metrics: this.metrics,
      performance: this.performanceMetrics,
      health: this.healthStatus,
      errors: {
        recent: this.getRecentErrors(5),
        statistics: this.getErrorStatistics()
      }
    };
  }

  /**
   * Export monitoring data
   */
  public exportData(): string {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  }
}

// Export singleton instance
export const workflowMonitoring = WorkflowMonitoring.getInstance();
