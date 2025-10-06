/**
 * Marketplace Monitoring System
 * 
 * Specialized monitoring for marketplace flows and solution interactions
 */

import { performanceMonitor, recordEvent, recordError, recordMetric, startTimer, endTimer } from './performanceMonitor';

export interface MarketplaceMetrics {
  // Solution Loading Metrics
  solutionLoadDuration: number;
  solutionLoadSuccess: boolean;
  solutionLoadErrors: number;
  solutionsLoaded: number;
  
  // Search Metrics
  searchDuration: number;
  searchSuccess: boolean;
  searchErrors: number;
  searchResults: number;
  searchQueries: number;
  
  // User Interaction Metrics
  solutionViews: number;
  solutionDownloads: number;
  solutionShares: number;
  userEngagement: number;
  
  // Performance Metrics
  averageLoadTime: number;
  cacheHitRate: number;
  errorRate: number;
  userSatisfaction: number;
}

export interface MarketplaceEvent {
  type: 'solution_load' | 'search' | 'solution_view' | 'solution_download' | 'solution_share' | 'user_interaction';
  solutionId?: string;
  solutionType?: 'workflow' | 'agent' | 'llm';
  searchQuery?: string;
  userId?: string;
  duration?: number;
  success?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class MarketplaceMonitor {
  private static instance: MarketplaceMonitor;
  private userSessionId: string;
  private sessionStartTime: number;

  constructor() {
    this.userSessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
  }

  static getInstance(): MarketplaceMonitor {
    if (!MarketplaceMonitor.instance) {
      MarketplaceMonitor.instance = new MarketplaceMonitor();
    }
    return MarketplaceMonitor.instance;
  }

  /**
   * Monitor solution loading
   */
  monitorSolutionLoad(solutionType: 'workflow' | 'agent' | 'llm', solutionId: string): void {
    startTimer('solution_load', { solutionType, solutionId });

    recordEvent('solution_load_started', {
      solutionType,
      solutionId,
      sessionId: this.userSessionId
    }, {
      solutionType,
      solutionId,
      type: 'solution_load'
    });
  }

  /**
   * Complete solution loading monitoring
   */
  completeSolutionLoad(
    solutionType: 'workflow' | 'agent' | 'llm', 
    solutionId: string, 
    success: boolean, 
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    endTimer('solution_load', { solutionType, solutionId }, {
      success,
      ...metadata
    });

    recordEvent('solution_load_completed', {
      solutionType,
      solutionId,
      success,
      sessionId: this.userSessionId,
      ...metadata
    }, {
      solutionType,
      solutionId,
      type: 'solution_load'
    });

    recordMetric({
      name: 'solution_load_duration',
      value: 0, // Will be calculated by timer
      unit: 'milliseconds',
      tags: { solutionType, success: success.toString() }
    });

    recordMetric({
      name: 'solution_load_count',
      value: 1,
      unit: 'count',
      tags: { solutionType, success: success.toString() }
    });

    if (!success && error) {
      recordError('solution_load_error', error, { solutionType, solutionId });
    }
  }

  /**
   * Monitor search operations
   */
  monitorSearch(query: string, filters?: Record<string, any>): void {
    startTimer('search', { query: query.substring(0, 50) });

    recordEvent('search_started', {
      query: query.substring(0, 50),
      filters,
      sessionId: this.userSessionId
    }, {
      type: 'search'
    });
  }

  /**
   * Complete search monitoring
   */
  completeSearch(
    query: string, 
    results: any[], 
    success: boolean, 
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    endTimer('search', { query: query.substring(0, 50) }, {
      resultCount: results.length,
      success,
      ...metadata
    });

    recordEvent('search_completed', {
      query: query.substring(0, 50),
      resultCount: results.length,
      success,
      sessionId: this.userSessionId,
      ...metadata
    }, {
      type: 'search'
    });

    recordMetric({
      name: 'search_duration',
      value: 0, // Will be calculated by timer
      unit: 'milliseconds',
      tags: { success: success.toString() }
    });

    recordMetric({
      name: 'search_results_count',
      value: results.length,
      unit: 'count',
      tags: { success: success.toString() }
    });

    recordMetric({
      name: 'search_queries_count',
      value: 1,
      unit: 'count',
      tags: { success: success.toString() }
    });

    if (!success && error) {
      recordError('search_error', error, { query: query.substring(0, 50) });
    }
  }

  /**
   * Monitor solution views
   */
  monitorSolutionView(
    solutionType: 'workflow' | 'agent' | 'llm', 
    solutionId: string, 
    viewType: 'detail' | 'preview' | 'modal'
  ): void {
    recordEvent('solution_viewed', {
      solutionType,
      solutionId,
      viewType,
      sessionId: this.userSessionId,
      timestamp: Date.now()
    }, {
      solutionType,
      solutionId,
      type: 'solution_view'
    });

    recordMetric({
      name: 'solution_views',
      value: 1,
      unit: 'count',
      tags: { solutionType, viewType }
    });
  }

  /**
   * Monitor solution downloads
   */
  monitorSolutionDownload(
    solutionType: 'workflow' | 'agent' | 'llm', 
    solutionId: string,
    format?: string
  ): void {
    recordEvent('solution_downloaded', {
      solutionType,
      solutionId,
      format,
      sessionId: this.userSessionId,
      timestamp: Date.now()
    }, {
      solutionType,
      solutionId,
      type: 'solution_download'
    });

    recordMetric({
      name: 'solution_downloads',
      value: 1,
      unit: 'count',
      tags: { solutionType, format: format || 'unknown' }
    });
  }

  /**
   * Monitor solution shares
   */
  monitorSolutionShare(
    solutionType: 'workflow' | 'agent' | 'llm', 
    solutionId: string,
    shareMethod: 'link' | 'email' | 'social'
  ): void {
    recordEvent('solution_shared', {
      solutionType,
      solutionId,
      shareMethod,
      sessionId: this.userSessionId,
      timestamp: Date.now()
    }, {
      solutionType,
      solutionId,
      type: 'solution_share'
    });

    recordMetric({
      name: 'solution_shares',
      value: 1,
      unit: 'count',
      tags: { solutionType, shareMethod }
    });
  }

  /**
   * Monitor user interactions
   */
  monitorUserInteraction(
    interactionType: 'click' | 'hover' | 'scroll' | 'focus',
    element: string,
    metadata?: Record<string, any>
  ): void {
    recordEvent('user_interaction', {
      interactionType,
      element,
      sessionId: this.userSessionId,
      timestamp: Date.now(),
      ...metadata
    }, {
      interactionType,
      type: 'user_interaction'
    });

    recordMetric({
      name: 'user_interactions',
      value: 1,
      unit: 'count',
      tags: { interactionType, element }
    });
  }

  /**
   * Monitor cache performance
   */
  monitorCachePerformance(
    operation: 'hit' | 'miss' | 'set' | 'clear',
    cacheType: 'solutions' | 'search' | 'workflows' | 'agents' | 'llms',
    key?: string,
    size?: number
  ): void {
    recordEvent('cache_operation', {
      operation,
      cacheType,
      key: key ? key.substring(0, 50) : undefined,
      size,
      sessionId: this.userSessionId
    }, {
      operation,
      cacheType,
      type: 'cache_operation'
    });

    recordMetric({
      name: 'cache_operation',
      value: 1,
      unit: 'count',
      tags: { operation, cacheType }
    });

    if (size) {
      recordMetric({
        name: 'cache_size',
        value: size,
        unit: 'bytes',
        tags: { cacheType }
      });
    }
  }

  /**
   * Monitor feature toggle usage
   */
  monitorFeatureToggleUsage(
    toggleName: string,
    enabled: boolean,
    context?: string
  ): void {
    recordEvent('feature_toggle_used', {
      toggleName,
      enabled,
      context,
      sessionId: this.userSessionId
    }, {
      toggleName,
      type: 'feature_toggle'
    });

    recordMetric({
      name: 'feature_toggle_usage',
      value: 1,
      unit: 'count',
      tags: { toggleName, enabled: enabled.toString() }
    });
  }

  /**
   * Monitor API performance
   */
  monitorAPICall(
    endpoint: string,
    method: string,
    success: boolean,
    duration: number,
    statusCode?: number,
    error?: Error
  ): void {
    recordEvent('api_call', {
      endpoint,
      method,
      success,
      duration,
      statusCode,
      sessionId: this.userSessionId
    }, {
      endpoint,
      method,
      type: 'api_call'
    });

    recordMetric({
      name: 'api_call_duration',
      value: duration,
      unit: 'milliseconds',
      tags: { endpoint, method, success: success.toString() }
    });

    recordMetric({
      name: 'api_call_count',
      value: 1,
      unit: 'count',
      tags: { endpoint, method, success: success.toString() }
    });

    if (!success && error) {
      recordError('api_call_error', error, { endpoint, method, statusCode });
    }
  }

  /**
   * Get current session metrics
   */
  getSessionMetrics(): {
    sessionId: string;
    sessionDuration: number;
    solutionViews: number;
    searches: number;
    downloads: number;
    shares: number;
  } {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    // This would typically aggregate metrics from the performance monitor
    return {
      sessionId: this.userSessionId,
      sessionDuration,
      solutionViews: 0,
      searches: 0,
      downloads: 0,
      shares: 0
    };
  }

  /**
   * Get marketplace performance summary
   */
  getMarketplaceSummary(): {
    totalSolutions: number;
    averageLoadTime: number;
    cacheHitRate: number;
    errorRate: number;
    userEngagement: number;
  } {
    // This would typically query the performance monitor for marketplace-specific data
    return {
      totalSolutions: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      userEngagement: 0
    };
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('marketplace_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('marketplace_session_id', sessionId);
    }
    return sessionId;
  }
}

// Export singleton instance
export const marketplaceMonitor = MarketplaceMonitor.getInstance();

// Convenience functions
export const monitorSolutionLoad = (solutionType: 'workflow' | 'agent' | 'llm', solutionId: string) => 
  marketplaceMonitor.monitorSolutionLoad(solutionType, solutionId);

export const completeSolutionLoad = (
  solutionType: 'workflow' | 'agent' | 'llm', 
  solutionId: string, 
  success: boolean, 
  error?: Error,
  metadata?: Record<string, any>
) => marketplaceMonitor.completeSolutionLoad(solutionType, solutionId, success, error, metadata);

export const monitorSearch = (query: string, filters?: Record<string, any>) => 
  marketplaceMonitor.monitorSearch(query, filters);

export const completeSearch = (
  query: string, 
  results: any[], 
  success: boolean, 
  error?: Error,
  metadata?: Record<string, any>
) => marketplaceMonitor.completeSearch(query, results, success, error, metadata);

export const monitorSolutionView = (
  solutionType: 'workflow' | 'agent' | 'llm', 
  solutionId: string, 
  viewType: 'detail' | 'preview' | 'modal'
) => marketplaceMonitor.monitorSolutionView(solutionType, solutionId, viewType);

export const monitorSolutionDownload = (
  solutionType: 'workflow' | 'agent' | 'llm', 
  solutionId: string,
  format?: string
) => marketplaceMonitor.monitorSolutionDownload(solutionType, solutionId, format);

export const monitorSolutionShare = (
  solutionType: 'workflow' | 'agent' | 'llm', 
  solutionId: string,
  shareMethod: 'link' | 'email' | 'social'
) => marketplaceMonitor.monitorSolutionShare(solutionType, solutionId, shareMethod);

export const monitorUserInteraction = (
  interactionType: 'click' | 'hover' | 'scroll' | 'focus',
  element: string,
  metadata?: Record<string, any>
) => marketplaceMonitor.monitorUserInteraction(interactionType, element, metadata);

export const monitorCachePerformance = (
  operation: 'hit' | 'miss' | 'set' | 'clear',
  cacheType: 'solutions' | 'search' | 'workflows' | 'agents' | 'llms',
  key?: string,
  size?: number
) => marketplaceMonitor.monitorCachePerformance(operation, cacheType, key, size);

export const monitorFeatureToggleUsage = (
  toggleName: string,
  enabled: boolean,
  context?: string
) => marketplaceMonitor.monitorFeatureToggleUsage(toggleName, enabled, context);

export const monitorAPICall = (
  endpoint: string,
  method: string,
  success: boolean,
  duration: number,
  statusCode?: number,
  error?: Error
) => marketplaceMonitor.monitorAPICall(endpoint, method, success, duration, statusCode, error);
