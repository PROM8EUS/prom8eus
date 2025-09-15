/**
 * Intelligent Source Fallback System
 * 
 * This module provides automatic failover, load balancing, and graceful degradation
 * for source operations to ensure high availability and reliability.
 */

import { performanceMetrics, PerformanceMetric } from './performanceMetrics';

export interface SourceConfig {
  id: string;
  name: string;
  type: 'primary' | 'backup' | 'fallback';
  priority: number; // Lower number = higher priority
  endpoint: string;
  credentials?: Record<string, any>;
  healthCheckUrl?: string;
  timeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  circuitBreakerThreshold: number; // failures before circuit opens
  circuitBreakerTimeout: number; // milliseconds
  loadBalancingWeight: number; // 1-100
  isEnabled: boolean;
  metadata?: Record<string, any>;
}

export interface FallbackGroup {
  id: string;
  name: string;
  sources: SourceConfig[];
  primarySource: string;
  backupSources: string[];
  fallbackStrategy: 'failover' | 'load_balance' | 'hybrid';
  healthCheckInterval: number; // milliseconds
  lastHealthCheck: Date;
  isHealthy: boolean;
  metadata?: Record<string, any>;
}

export interface CircuitBreakerState {
  sourceId: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  successCount: number;
  totalRequests: number;
}

export interface LoadBalancingStats {
  sourceId: string;
  activeConnections: number;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastUsed: Date;
  weight: number;
  isHealthy: boolean;
}

export interface FallbackResult<T = any> {
  success: boolean;
  data?: T;
  sourceId: string;
  sourceType: 'primary' | 'backup' | 'fallback';
  responseTime: number;
  attempts: number;
  errors: string[];
  fallbackReason?: string;
  metadata?: Record<string, any>;
}

export interface FallbackConfig {
  enableAutomaticFailover: boolean;
  enableLoadBalancing: boolean;
  enableCircuitBreaker: boolean;
  enableGracefulDegradation: boolean;
  healthCheckInterval: number; // milliseconds
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number; // milliseconds
  maxRetryAttempts: number;
  retryDelay: number; // milliseconds
  loadBalancingStrategy: 'round_robin' | 'weighted' | 'least_connections' | 'response_time';
  fallbackTimeout: number; // milliseconds
  enableFallbackAnalytics: boolean;
}

/**
 * Intelligent Source Fallback Engine
 */
export class FallbackEngine {
  private fallbackGroups: Map<string, FallbackGroup> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private loadBalancingStats: Map<string, LoadBalancingStats> = new Map();
  private config: FallbackConfig;
  private healthCheckInterval?: NodeJS.Timeout;
  private fallbackHistory: Array<{
    timestamp: Date;
    groupId: string;
    sourceId: string;
    reason: string;
    success: boolean;
  }> = [];

  constructor(config?: Partial<FallbackConfig>) {
    this.config = {
      enableAutomaticFailover: true,
      enableLoadBalancing: true,
      enableCircuitBreaker: true,
      enableGracefulDegradation: true,
      healthCheckInterval: 30000, // 30 seconds
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minute
      maxRetryAttempts: 3,
      retryDelay: 1000, // 1 second
      loadBalancingStrategy: 'weighted',
      fallbackTimeout: 10000, // 10 seconds
      enableFallbackAnalytics: true,
      ...config
    };

    this.startHealthCheckInterval();
  }

  /**
   * Register a fallback group
   */
  registerFallbackGroup(group: FallbackGroup): void {
    this.fallbackGroups.set(group.id, group);
    
    // Initialize circuit breakers for all sources
    group.sources.forEach(source => {
      this.circuitBreakers.set(source.id, {
        sourceId: source.id,
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        totalRequests: 0
      });

      this.loadBalancingStats.set(source.id, {
        sourceId: source.id,
        activeConnections: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        lastUsed: new Date(),
        weight: source.loadBalancingWeight,
        isHealthy: true
      });
    });
  }

  /**
   * Execute operation with fallback
   */
  async executeWithFallback<T>(
    groupId: string,
    operation: (source: SourceConfig) => Promise<T>,
    options?: {
      timeout?: number;
      retryAttempts?: number;
      enableCircuitBreaker?: boolean;
      enableLoadBalancing?: boolean;
    }
  ): Promise<FallbackResult<T>> {
    const group = this.fallbackGroups.get(groupId);
    if (!group) {
      throw new Error(`Fallback group ${groupId} not found`);
    }

    const startTime = Date.now();
    const errors: string[] = [];
    let attempts = 0;
    let lastError: Error | null = null;

    // Get source selection strategy
    const sources = this.selectSources(group, options);
    
    for (const source of sources) {
      attempts++;
      
      try {
        // Check circuit breaker
        if (this.config.enableCircuitBreaker && !this.canExecute(source.id)) {
          errors.push(`Circuit breaker open for source ${source.id}`);
          continue;
        }

        // Execute operation with timeout
        const result = await this.executeWithTimeout(
          () => operation(source),
          options?.timeout || source.timeout
        );

        const responseTime = Date.now() - startTime;

        // Record success
        this.recordSuccess(source.id, responseTime);
        performanceMetrics.recordSuccess(
          source.id,
          'fallback_operation',
          responseTime,
          undefined,
          false,
          { groupId, sourceType: source.type }
        );

        return {
          success: true,
          data: result,
          sourceId: source.id,
          sourceType: source.type,
          responseTime,
          attempts,
          errors,
          metadata: { groupId, sourceType: source.type }
        };

      } catch (error) {
        lastError = error as Error;
        const responseTime = Date.now() - startTime;
        
        // Record failure
        this.recordFailure(source.id, error as Error, responseTime);
        performanceMetrics.recordFailure(
          source.id,
          'fallback_operation',
          responseTime,
          'FALLBACK_ERROR',
          (error as Error).message,
          attempts - 1,
          { groupId, sourceType: source.type, error: (error as Error).message }
        );

        errors.push(`Source ${source.id}: ${(error as Error).message}`);

        // Check if we should continue to next source
        if (attempts >= (options?.retryAttempts || this.config.maxRetryAttempts)) {
          break;
        }

        // Wait before retry
        if (attempts < sources.length) {
          await this.delay(options?.retryAttempts ? this.config.retryDelay : source.retryDelay);
        }
      }
    }

    // All sources failed
    const totalResponseTime = Date.now() - startTime;
    
    return {
      success: false,
      sourceId: sources[sources.length - 1]?.id || 'unknown',
      sourceType: 'fallback',
      responseTime: totalResponseTime,
      attempts,
      errors,
      fallbackReason: 'All sources failed',
      metadata: { groupId, lastError: lastError?.message }
    };
  }

  /**
   * Select sources based on strategy
   */
  private selectSources(group: FallbackGroup, options?: any): SourceConfig[] {
    const enabledSources = group.sources.filter(s => s.isEnabled);
    
    if (!this.config.enableLoadBalancing || options?.enableLoadBalancing === false) {
      // Simple failover strategy
      return enabledSources.sort((a, b) => a.priority - b.priority);
    }

    // Load balancing strategy
    switch (this.config.loadBalancingStrategy) {
      case 'round_robin':
        return this.selectRoundRobin(enabledSources);
      case 'weighted':
        return this.selectWeighted(enabledSources);
      case 'least_connections':
        return this.selectLeastConnections(enabledSources);
      case 'response_time':
        return this.selectByResponseTime(enabledSources);
      default:
        return enabledSources.sort((a, b) => a.priority - b.priority);
    }
  }

  /**
   * Round robin source selection
   */
  private selectRoundRobin(sources: SourceConfig[]): SourceConfig[] {
    // Simple round robin - could be enhanced with state tracking
    return sources.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Weighted source selection
   */
  private selectWeighted(sources: SourceConfig[]): SourceConfig[] {
    return sources.sort((a, b) => {
      const statsA = this.loadBalancingStats.get(a.id);
      const statsB = this.loadBalancingStats.get(b.id);
      
      // Consider weight and health
      const scoreA = (statsA?.weight || a.loadBalancingWeight) * (statsA?.isHealthy ? 1 : 0.1);
      const scoreB = (statsB?.weight || b.loadBalancingWeight) * (statsB?.isHealthy ? 1 : 0.1);
      
      return scoreB - scoreA;
    });
  }

  /**
   * Least connections source selection
   */
  private selectLeastConnections(sources: SourceConfig[]): SourceConfig[] {
    return sources.sort((a, b) => {
      const statsA = this.loadBalancingStats.get(a.id);
      const statsB = this.loadBalancingStats.get(b.id);
      
      return (statsA?.activeConnections || 0) - (statsB?.activeConnections || 0);
    });
  }

  /**
   * Response time based source selection
   */
  private selectByResponseTime(sources: SourceConfig[]): SourceConfig[] {
    return sources.sort((a, b) => {
      const statsA = this.loadBalancingStats.get(a.id);
      const statsB = this.loadBalancingStats.get(b.id);
      
      return (statsA?.averageResponseTime || 0) - (statsB?.averageResponseTime || 0);
    });
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeout);
      })
    ]);
  }

  /**
   * Check if source can execute (circuit breaker)
   */
  private canExecute(sourceId: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(sourceId);
    if (!circuitBreaker) return true;

    switch (circuitBreaker.state) {
      case 'closed':
        return true;
      case 'open':
        if (circuitBreaker.nextAttemptTime && new Date() >= circuitBreaker.nextAttemptTime) {
          circuitBreaker.state = 'half_open';
          return true;
        }
        return false;
      case 'half_open':
        return true;
      default:
        return true;
    }
  }

  /**
   * Record successful operation
   */
  private recordSuccess(sourceId: string, responseTime: number): void {
    const circuitBreaker = this.circuitBreakers.get(sourceId);
    const loadStats = this.loadBalancingStats.get(sourceId);

    if (circuitBreaker) {
      circuitBreaker.successCount++;
      circuitBreaker.totalRequests++;
      
      if (circuitBreaker.state === 'half_open') {
        circuitBreaker.state = 'closed';
        circuitBreaker.failureCount = 0;
      }
    }

    if (loadStats) {
      loadStats.totalRequests++;
      loadStats.averageResponseTime = 
        (loadStats.averageResponseTime * (loadStats.totalRequests - 1) + responseTime) / 
        loadStats.totalRequests;
      loadStats.lastUsed = new Date();
      loadStats.isHealthy = true;
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(sourceId: string, error: Error, responseTime: number): void {
    const circuitBreaker = this.circuitBreakers.get(sourceId);
    const loadStats = this.loadBalancingStats.get(sourceId);

    if (circuitBreaker) {
      circuitBreaker.failureCount++;
      circuitBreaker.totalRequests++;
      circuitBreaker.lastFailureTime = new Date();

      if (circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
        circuitBreaker.state = 'open';
        circuitBreaker.nextAttemptTime = new Date(
          Date.now() + this.config.circuitBreakerTimeout
        );
      }
    }

    if (loadStats) {
      loadStats.totalRequests++;
      loadStats.errorRate = (loadStats.errorRate * (loadStats.totalRequests - 1) + 1) / 
        loadStats.totalRequests;
      loadStats.isHealthy = false;
    }
  }

  /**
   * Start health check interval
   */
  private startHealthCheckInterval(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all sources
   */
  private async performHealthChecks(): Promise<void> {
    for (const [groupId, group] of this.fallbackGroups) {
      for (const source of group.sources) {
        if (source.healthCheckUrl) {
          try {
            const response = await fetch(source.healthCheckUrl, {
              method: 'GET',
              timeout: source.timeout
            });
            
            const isHealthy = response.ok;
            this.updateSourceHealth(source.id, isHealthy);
            
          } catch (error) {
            this.updateSourceHealth(source.id, false);
          }
        }
      }
    }
  }

  /**
   * Update source health status
   */
  private updateSourceHealth(sourceId: string, isHealthy: boolean): void {
    const loadStats = this.loadBalancingStats.get(sourceId);
    if (loadStats) {
      loadStats.isHealthy = isHealthy;
    }

    // Update group health
    for (const [groupId, group] of this.fallbackGroups) {
      if (group.sources.some(s => s.id === sourceId)) {
        group.isHealthy = group.sources.every(s => {
          const stats = this.loadBalancingStats.get(s.id);
          return stats?.isHealthy !== false;
        });
        group.lastHealthCheck = new Date();
      }
    }
  }

  /**
   * Get fallback group status
   */
  getGroupStatus(groupId: string): {
    group: FallbackGroup;
    circuitBreakers: CircuitBreakerState[];
    loadBalancingStats: LoadBalancingStats[];
    isHealthy: boolean;
  } | null {
    const group = this.fallbackGroups.get(groupId);
    if (!group) return null;

    const circuitBreakers = group.sources.map(s => 
      this.circuitBreakers.get(s.id)!
    );
    
    const loadBalancingStats = group.sources.map(s => 
      this.loadBalancingStats.get(s.id)!
    );

    return {
      group,
      circuitBreakers,
      loadBalancingStats,
      isHealthy: group.isHealthy
    };
  }

  /**
   * Get all fallback groups
   */
  getAllGroups(): FallbackGroup[] {
    return Array.from(this.fallbackGroups.values());
  }

  /**
   * Get fallback analytics
   */
  getFallbackAnalytics(timeWindow?: { start: Date; end: Date }): {
    totalFallbacks: number;
    successfulFallbacks: number;
    failedFallbacks: number;
    averageResponseTime: number;
    mostUsedSources: Array<{ sourceId: string; count: number }>;
    fallbackReasons: Array<{ reason: string; count: number }>;
  } {
    const filteredHistory = timeWindow 
      ? this.fallbackHistory.filter(h => h.timestamp >= timeWindow.start && h.timestamp <= timeWindow.end)
      : this.fallbackHistory;

    const totalFallbacks = filteredHistory.length;
    const successfulFallbacks = filteredHistory.filter(h => h.success).length;
    const failedFallbacks = totalFallbacks - successfulFallbacks;

    const sourceUsage = new Map<string, number>();
    const reasonCounts = new Map<string, number>();

    filteredHistory.forEach(entry => {
      sourceUsage.set(entry.sourceId, (sourceUsage.get(entry.sourceId) || 0) + 1);
      reasonCounts.set(entry.reason, (reasonCounts.get(entry.reason) || 0) + 1);
    });

    return {
      totalFallbacks,
      successfulFallbacks,
      failedFallbacks,
      averageResponseTime: 0, // Would need to track this separately
      mostUsedSources: Array.from(sourceUsage.entries())
        .map(([sourceId, count]) => ({ sourceId, count }))
        .sort((a, b) => b.count - a.count),
      fallbackReasons: Array.from(reasonCounts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
    };
  }

  /**
   * Update fallback configuration
   */
  updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart health check interval if interval changed
    if (newConfig.healthCheckInterval) {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      this.startHealthCheckInterval();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): FallbackConfig {
    return { ...this.config };
  }

  /**
   * Reset circuit breaker for a source
   */
  resetCircuitBreaker(sourceId: string): void {
    const circuitBreaker = this.circuitBreakers.get(sourceId);
    if (circuitBreaker) {
      circuitBreaker.state = 'closed';
      circuitBreaker.failureCount = 0;
      circuitBreaker.successCount = 0;
      circuitBreaker.totalRequests = 0;
      circuitBreaker.lastFailureTime = undefined;
      circuitBreaker.nextAttemptTime = undefined;
    }
  }

  /**
   * Remove fallback group
   */
  removeFallbackGroup(groupId: string): void {
    const group = this.fallbackGroups.get(groupId);
    if (group) {
      // Clean up circuit breakers and load balancing stats
      group.sources.forEach(source => {
        this.circuitBreakers.delete(source.id);
        this.loadBalancingStats.delete(source.id);
      });
      
      this.fallbackGroups.delete(groupId);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.fallbackGroups.clear();
    this.circuitBreakers.clear();
    this.loadBalancingStats.clear();
    this.fallbackHistory = [];
  }

  /**
   * Utility method for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const fallbackEngine = new FallbackEngine();
