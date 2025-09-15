/**
 * Source Usage Analytics System
 * 
 * This module provides comprehensive usage analytics, value scoring,
 * cost-benefit analysis, and optimization recommendations for all sources.
 */

import { performanceMetrics } from './performanceMetrics';
import { dataValidationEngine } from './dataValidationSystem';

export interface UsageEvent {
  id: string;
  sourceId: string;
  userId?: string;
  sessionId?: string;
  eventType: 'view' | 'search' | 'download' | 'execute' | 'favorite' | 'share' | 'rate';
  timestamp: Date;
  metadata: {
    itemId?: string;
    itemType?: string;
    query?: string;
    filters?: Record<string, any>;
    duration?: number; // milliseconds
    success?: boolean;
    errorMessage?: string;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
  };
}

export interface UsageMetrics {
  sourceId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  eventBreakdown: Record<string, number>;
  userEngagement: {
    averageSessionDuration: number;
    averageEventsPerSession: number;
    returnUserRate: number;
    bounceRate: number;
  };
  performance: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    throughput: number; // events per hour
  };
  trends: {
    usageTrend: 'increasing' | 'stable' | 'decreasing';
    userTrend: 'growing' | 'stable' | 'declining';
    performanceTrend: 'improving' | 'stable' | 'degrading';
  };
}

export interface SourceValueScore {
  sourceId: string;
  overallScore: number; // 0-100
  components: {
    usage: number; // 0-100
    performance: number; // 0-100
    quality: number; // 0-100
    cost: number; // 0-100 (higher = better value)
    userSatisfaction: number; // 0-100
    businessImpact: number; // 0-100
  };
  weights: {
    usage: number;
    performance: number;
    quality: number;
    cost: number;
    userSatisfaction: number;
    businessImpact: number;
  };
  timestamp: Date;
  recommendations: string[];
}

export interface CostBenefitAnalysis {
  sourceId: string;
  period: {
    start: Date;
    end: Date;
  };
  costs: {
    infrastructure: number;
    api: number;
    maintenance: number;
    support: number;
    total: number;
  };
  benefits: {
    timeSaved: number; // hours
    productivityGain: number; // percentage
    userSatisfaction: number; // 0-100
    businessValue: number; // estimated monetary value
    total: number;
  };
  roi: {
    percentage: number;
    paybackPeriod: number; // months
    netPresentValue: number;
  };
  recommendations: string[];
}

export interface UsageRecommendation {
  id: string;
  type: 'optimization' | 'scaling' | 'cost_reduction' | 'quality_improvement' | 'user_experience';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sourceId: string;
  title: string;
  description: string;
  impact: {
    estimated: 'low' | 'medium' | 'high';
    confidence: number; // 0-100
    metrics: string[];
  };
  effort: {
    estimated: 'low' | 'medium' | 'high';
    timeRequired: string;
    resources: string[];
  };
  actions: string[];
  expectedOutcome: string;
  timestamp: Date;
}

export interface UsageForecast {
  sourceId: string;
  forecastPeriod: {
    start: Date;
    end: Date;
  };
  predictions: {
    usage: {
      current: number;
      predicted: number;
      confidence: number;
      trend: 'increasing' | 'stable' | 'decreasing';
    };
    users: {
      current: number;
      predicted: number;
      confidence: number;
      trend: 'growing' | 'stable' | 'declining';
    };
    performance: {
      current: number;
      predicted: number;
      confidence: number;
      trend: 'improving' | 'stable' | 'degrading';
    };
  };
  recommendations: string[];
  risks: string[];
}

export interface UsageAnalyticsConfig {
  trackingEnabled: boolean;
  dataRetentionDays: number;
  aggregationInterval: number; // minutes
  forecastingPeriods: number[]; // days
  valueScoreWeights: {
    usage: number;
    performance: number;
    quality: number;
    cost: number;
    userSatisfaction: number;
    businessImpact: number;
  };
  alertThresholds: {
    usageDrop: number; // percentage
    performanceDegradation: number; // percentage
    costIncrease: number; // percentage
  };
  enablePersonalization: boolean;
  enableRecommendations: boolean;
}

/**
 * Usage Analytics Engine
 */
export class UsageAnalyticsEngine {
  private usageEvents: UsageEvent[] = [];
  private config: UsageAnalyticsConfig;
  private valueScores: Map<string, SourceValueScore> = new Map();
  private costAnalyses: Map<string, CostBenefitAnalysis> = new Map();
  private recommendations: Map<string, UsageRecommendation[]> = new Map();
  private forecasts: Map<string, UsageForecast> = new Map();
  private analyticsCache: Map<string, { data: any; timestamp: Date }> = new Map();

  constructor(config?: Partial<UsageAnalyticsConfig>) {
    this.config = {
      trackingEnabled: true,
      dataRetentionDays: 90,
      aggregationInterval: 60, // 1 hour
      forecastingPeriods: [7, 30, 90], // 1 week, 1 month, 3 months
      valueScoreWeights: {
        usage: 0.25,
        performance: 0.20,
        quality: 0.20,
        cost: 0.15,
        userSatisfaction: 0.10,
        businessImpact: 0.10
      },
      alertThresholds: {
        usageDrop: 20,
        performanceDegradation: 15,
        costIncrease: 25
      },
      enablePersonalization: true,
      enableRecommendations: true,
      ...config
    };

    this.startAnalyticsProcessing();
  }

  /**
   * Track a usage event
   */
  trackEvent(event: Omit<UsageEvent, 'id' | 'timestamp'>): void {
    if (!this.config.trackingEnabled) return;

    const usageEvent: UsageEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    this.usageEvents.push(usageEvent);
    this.cleanupOldEvents();
  }

  /**
   * Get usage metrics for a source
   */
  getUsageMetrics(sourceId: string, period?: { start: Date; end: Date }): UsageMetrics {
    const cacheKey = `metrics_${sourceId}_${period?.start?.getTime()}_${period?.end?.getTime()}`;
    const cached = this.analyticsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.config.aggregationInterval * 60 * 1000) {
      return cached.data;
    }

    const timeWindow = period || this.getDefaultTimeWindow();
    const events = this.getEventsInTimeWindow(sourceId, timeWindow);
    
    const metrics = this.calculateUsageMetrics(sourceId, events, timeWindow);
    this.analyticsCache.set(cacheKey, { data: metrics, timestamp: new Date() });

    return metrics;
  }

  /**
   * Get source value score
   */
  getSourceValueScore(sourceId: string): SourceValueScore {
    const cached = this.valueScores.get(sourceId);
    if (cached && (Date.now() - cached.timestamp.getTime()) < 24 * 60 * 60 * 1000) { // 24 hours
      return cached;
    }

    const score = this.calculateSourceValueScore(sourceId);
    this.valueScores.set(sourceId, score);
    return score;
  }

  /**
   * Get cost-benefit analysis
   */
  getCostBenefitAnalysis(sourceId: string, period?: { start: Date; end: Date }): CostBenefitAnalysis {
    const cacheKey = `cba_${sourceId}_${period?.start?.getTime()}_${period?.end?.getTime()}`;
    const cached = this.costAnalyses.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000) { // 7 days
      return cached;
    }

    const analysis = this.calculateCostBenefitAnalysis(sourceId, period);
    this.costAnalyses.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Get usage recommendations
   */
  getUsageRecommendations(sourceId: string): UsageRecommendation[] {
    const cached = this.recommendations.get(sourceId);
    if (cached && cached.length > 0 && (Date.now() - cached[0].timestamp.getTime()) < 24 * 60 * 60 * 1000) {
      return cached;
    }

    const recommendations = this.generateUsageRecommendations(sourceId);
    this.recommendations.set(sourceId, recommendations);
    return recommendations;
  }

  /**
   * Get usage forecast
   */
  getUsageForecast(sourceId: string, days: number = 30): UsageForecast {
    const cacheKey = `forecast_${sourceId}_${days}`;
    const cached = this.forecasts.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp.getTime()) < 6 * 60 * 60 * 1000) { // 6 hours
      return cached;
    }

    const forecast = this.calculateUsageForecast(sourceId, days);
    this.forecasts.set(cacheKey, forecast);
    return forecast;
  }

  /**
   * Get top performing sources
   */
  getTopPerformingSources(limit: number = 10, criteria: 'usage' | 'value' | 'performance' = 'value'): Array<{
    sourceId: string;
    score: number;
    rank: number;
  }> {
    const sourceIds = [...new Set(this.usageEvents.map(e => e.sourceId))];
    const scores: Array<{ sourceId: string; score: number }> = [];

    for (const sourceId of sourceIds) {
      let score: number;
      
      switch (criteria) {
        case 'usage':
          const usageMetrics = this.getUsageMetrics(sourceId);
          score = usageMetrics.totalEvents;
          break;
        case 'value':
          const valueScore = this.getSourceValueScore(sourceId);
          score = valueScore.overallScore;
          break;
        case 'performance':
          const performanceStats = performanceMetrics.getSourceStats(sourceId);
          score = performanceStats.successRate;
          break;
        default:
          score = 0;
      }

      scores.push({ sourceId, score });
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  /**
   * Get usage analytics dashboard data
   */
  getAnalyticsDashboard(): {
    overview: {
      totalSources: number;
      activeSources: number;
      totalEvents: number;
      uniqueUsers: number;
      averageValueScore: number;
    };
    topSources: Array<{
      sourceId: string;
      valueScore: number;
      usage: number;
      performance: number;
    }>;
    trends: {
      usageTrend: 'increasing' | 'stable' | 'decreasing';
      userTrend: 'growing' | 'stable' | 'declining';
      performanceTrend: 'improving' | 'stable' | 'degrading';
    };
    recommendations: UsageRecommendation[];
  } {
    const sourceIds = [...new Set(this.usageEvents.map(e => e.sourceId))];
    const totalEvents = this.usageEvents.length;
    const uniqueUsers = new Set(this.usageEvents.map(e => e.userId).filter(Boolean)).size;
    
    const valueScores = sourceIds.map(id => this.getSourceValueScore(id));
    const averageValueScore = valueScores.reduce((sum, s) => sum + s.overallScore, 0) / valueScores.length;

    const topSources = sourceIds
      .map(sourceId => {
        const valueScore = this.getSourceValueScore(sourceId);
        const usage = this.getUsageMetrics(sourceId);
        const performance = performanceMetrics.getSourceStats(sourceId);
        
        return {
          sourceId,
          valueScore: valueScore.overallScore,
          usage: usage.totalEvents,
          performance: performance.successRate
        };
      })
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 10);

    const allRecommendations = sourceIds.flatMap(id => this.getUsageRecommendations(id));
    const topRecommendations = allRecommendations
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
      .slice(0, 20);

    return {
      overview: {
        totalSources: sourceIds.length,
        activeSources: sourceIds.filter(id => this.getUsageMetrics(id).totalEvents > 0).length,
        totalEvents,
        uniqueUsers,
        averageValueScore: Math.round(averageValueScore)
      },
      topSources,
      trends: this.calculateOverallTrends(),
      recommendations: topRecommendations
    };
  }

  /**
   * Update analytics configuration
   */
  updateConfig(newConfig: Partial<UsageAnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.analyticsCache.clear(); // Clear cache when config changes
  }

  /**
   * Get current configuration
   */
  getConfig(): UsageAnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Export usage data
   */
  exportUsageData(format: 'json' | 'csv' = 'json', sourceId?: string): string {
    const events = sourceId 
      ? this.usageEvents.filter(e => e.sourceId === sourceId)
      : this.usageEvents;

    if (format === 'csv') {
      return this.exportToCSV(events);
    }
    
    return JSON.stringify(events, null, 2);
  }

  /**
   * Clear usage data
   */
  clearUsageData(sourceId?: string): void {
    if (sourceId) {
      this.usageEvents = this.usageEvents.filter(e => e.sourceId !== sourceId);
      this.valueScores.delete(sourceId);
      this.costAnalyses.delete(sourceId);
      this.recommendations.delete(sourceId);
      this.forecasts.delete(sourceId);
    } else {
      this.usageEvents = [];
      this.valueScores.clear();
      this.costAnalyses.clear();
      this.recommendations.clear();
      this.forecasts.clear();
    }
    
    this.analyticsCache.clear();
  }

  /**
   * Calculate usage metrics
   */
  private calculateUsageMetrics(sourceId: string, events: UsageEvent[], period: { start: Date; end: Date }): UsageMetrics {
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const uniqueSessions = new Set(events.map(e => e.sessionId).filter(Boolean)).size;
    
    const eventBreakdown: Record<string, number> = {};
    events.forEach(event => {
      eventBreakdown[event.eventType] = (eventBreakdown[event.eventType] || 0) + 1;
    });

    const sessionDurations = this.calculateSessionDurations(events);
    const averageSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length 
      : 0;

    const averageEventsPerSession = uniqueSessions > 0 ? events.length / uniqueSessions : 0;
    const returnUserRate = this.calculateReturnUserRate(events);
    const bounceRate = this.calculateBounceRate(events);

    const performanceStats = performanceMetrics.getSourceStats(sourceId, period);
    const throughput = this.calculateThroughput(events, period);

    const trends = this.calculateUsageTrends(sourceId, period);

    return {
      sourceId,
      period,
      totalEvents: events.length,
      uniqueUsers,
      uniqueSessions,
      eventBreakdown,
      userEngagement: {
        averageSessionDuration: Math.round(averageSessionDuration),
        averageEventsPerSession: Math.round(averageEventsPerSession * 100) / 100,
        returnUserRate: Math.round(returnUserRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100
      },
      performance: {
        averageResponseTime: performanceStats.averageResponseTime,
        successRate: performanceStats.successRate,
        errorRate: performanceStats.errorRate,
        throughput: Math.round(throughput * 100) / 100
      },
      trends
    };
  }

  /**
   * Calculate source value score
   */
  private calculateSourceValueScore(sourceId: string): SourceValueScore {
    const usageMetrics = this.getUsageMetrics(sourceId);
    const performanceStats = performanceMetrics.getSourceStats(sourceId);
    const qualityReport = dataValidationEngine.getValidationHistory(sourceId, 1)[0];
    const costAnalysis = this.getCostBenefitAnalysis(sourceId);

    // Calculate component scores
    const usageScore = this.calculateUsageScore(usageMetrics);
    const performanceScore = performanceStats.successRate;
    const qualityScore = qualityReport?.qualityScore.overall || 0;
    const costScore = this.calculateCostScore(costAnalysis);
    const userSatisfactionScore = this.calculateUserSatisfactionScore(usageMetrics);
    const businessImpactScore = this.calculateBusinessImpactScore(usageMetrics, costAnalysis);

    // Calculate weighted overall score
    const weights = this.config.valueScoreWeights;
    const overallScore = 
      usageScore * weights.usage +
      performanceScore * weights.performance +
      qualityScore * weights.quality +
      costScore * weights.cost +
      userSatisfactionScore * weights.userSatisfaction +
      businessImpactScore * weights.businessImpact;

    const recommendations = this.generateValueScoreRecommendations({
      usage: usageScore,
      performance: performanceScore,
      quality: qualityScore,
      cost: costScore,
      userSatisfaction: userSatisfactionScore,
      businessImpact: businessImpactScore
    });

    return {
      sourceId,
      overallScore: Math.round(overallScore),
      components: {
        usage: Math.round(usageScore),
        performance: Math.round(performanceScore),
        quality: Math.round(qualityScore),
        cost: Math.round(costScore),
        userSatisfaction: Math.round(userSatisfactionScore),
        businessImpact: Math.round(businessImpactScore)
      },
      weights,
      timestamp: new Date(),
      recommendations
    };
  }

  /**
   * Calculate cost-benefit analysis
   */
  private calculateCostBenefitAnalysis(sourceId: string, period?: { start: Date; end: Date }): CostBenefitAnalysis {
    const timeWindow = period || this.getDefaultTimeWindow();
    const usageMetrics = this.getUsageMetrics(sourceId, timeWindow);
    const performanceStats = performanceMetrics.getSourceStats(sourceId, timeWindow);

    // Estimate costs (in a real implementation, these would come from actual cost data)
    const costs = {
      infrastructure: this.estimateInfrastructureCost(usageMetrics),
      api: this.estimateApiCost(usageMetrics),
      maintenance: this.estimateMaintenanceCost(usageMetrics),
      support: this.estimateSupportCost(usageMetrics),
      total: 0
    };
    costs.total = costs.infrastructure + costs.api + costs.maintenance + costs.support;

    // Calculate benefits
    const benefits = {
      timeSaved: this.calculateTimeSaved(usageMetrics),
      productivityGain: this.calculateProductivityGain(usageMetrics),
      userSatisfaction: this.calculateUserSatisfactionScore(usageMetrics),
      businessValue: this.calculateBusinessValue(usageMetrics, performanceStats),
      total: 0
    };
    benefits.total = benefits.businessValue;

    // Calculate ROI
    const roi = {
      percentage: costs.total > 0 ? ((benefits.total - costs.total) / costs.total) * 100 : 0,
      paybackPeriod: this.calculatePaybackPeriod(costs.total, benefits.total),
      netPresentValue: benefits.total - costs.total
    };

    const recommendations = this.generateCostBenefitRecommendations(costs, benefits, roi);

    return {
      sourceId,
      period: timeWindow,
      costs,
      benefits,
      roi,
      recommendations
    };
  }

  /**
   * Generate usage recommendations
   */
  private generateUsageRecommendations(sourceId: string): UsageRecommendation[] {
    const recommendations: UsageRecommendation[] = [];
    const usageMetrics = this.getUsageMetrics(sourceId);
    const performanceStats = performanceMetrics.getSourceStats(sourceId);
    const valueScore = this.getSourceValueScore(sourceId);

    // Usage-based recommendations
    if (usageMetrics.totalEvents < 100) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: 'optimization',
        priority: 'medium',
        sourceId,
        title: 'Increase Source Usage',
        description: 'This source has low usage. Consider promoting it or improving discoverability.',
        impact: { estimated: 'medium', confidence: 80, metrics: ['usage', 'engagement'] },
        effort: { estimated: 'low', timeRequired: '1-2 weeks', resources: ['marketing', 'UX'] },
        actions: ['Add to featured sources', 'Improve search ranking', 'Add usage examples'],
        expectedOutcome: '20-30% increase in usage',
        timestamp: new Date()
      });
    }

    // Performance-based recommendations
    if (performanceStats.successRate < 95) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: 'quality_improvement',
        priority: 'high',
        sourceId,
        title: 'Improve Source Reliability',
        description: 'Source has reliability issues affecting user experience.',
        impact: { estimated: 'high', confidence: 90, metrics: ['performance', 'user_satisfaction'] },
        effort: { estimated: 'medium', timeRequired: '2-4 weeks', resources: ['engineering', 'ops'] },
        actions: ['Investigate error causes', 'Implement better error handling', 'Add monitoring'],
        expectedOutcome: '95%+ success rate',
        timestamp: new Date()
      });
    }

    // Cost-based recommendations
    const costAnalysis = this.getCostBenefitAnalysis(sourceId);
    if (costAnalysis.roi.percentage < 100) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: 'cost_reduction',
        priority: 'medium',
        sourceId,
        title: 'Optimize Source Costs',
        description: 'Source ROI is below 100%. Consider cost optimization strategies.',
        impact: { estimated: 'medium', confidence: 75, metrics: ['cost', 'roi'] },
        effort: { estimated: 'medium', timeRequired: '3-6 weeks', resources: ['engineering', 'finance'] },
        actions: ['Review API usage', 'Optimize data transfer', 'Implement caching'],
        expectedOutcome: '50%+ improvement in ROI',
        timestamp: new Date()
      });
    }

    return recommendations;
  }

  /**
   * Calculate usage forecast
   */
  private calculateUsageForecast(sourceId: string, days: number): UsageForecast {
    const historicalData = this.getUsageMetrics(sourceId);
    const historicalEvents = this.getEventsInTimeWindow(sourceId, this.getDefaultTimeWindow());
    
    // Simple linear regression for forecasting (in a real implementation, use more sophisticated models)
    const usageTrend = this.calculateTrend(historicalEvents.map(e => e.timestamp.getTime()));
    const userTrend = this.calculateUserTrend(historicalEvents);
    const performanceTrend = this.calculatePerformanceTrend(sourceId);

    const currentUsage = historicalData.totalEvents;
    const currentUsers = historicalData.uniqueUsers;
    const currentPerformance = historicalData.performance.successRate;

    const predictedUsage = Math.max(0, currentUsage + (usageTrend * days));
    const predictedUsers = Math.max(0, currentUsers + (userTrend * days));
    const predictedPerformance = Math.max(0, Math.min(100, currentPerformance + (performanceTrend * days)));

    const recommendations = this.generateForecastRecommendations(predictedUsage, predictedUsers, predictedPerformance);
    const risks = this.identifyForecastRisks(predictedUsage, predictedUsers, predictedPerformance);

    return {
      sourceId,
      forecastPeriod: {
        start: new Date(),
        end: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      },
      predictions: {
        usage: {
          current: currentUsage,
          predicted: Math.round(predictedUsage),
          confidence: 75, // Would be calculated based on historical accuracy
          trend: usageTrend > 0 ? 'increasing' : usageTrend < 0 ? 'decreasing' : 'stable'
        },
        users: {
          current: currentUsers,
          predicted: Math.round(predictedUsers),
          confidence: 70,
          trend: userTrend > 0 ? 'growing' : userTrend < 0 ? 'declining' : 'stable'
        },
        performance: {
          current: currentPerformance,
          predicted: Math.round(predictedPerformance),
          confidence: 80,
          trend: performanceTrend > 0 ? 'improving' : performanceTrend < 0 ? 'degrading' : 'stable'
        }
      },
      recommendations,
      risks
    };
  }

  /**
   * Helper methods
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultTimeWindow(): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
    return { start, end };
  }

  private getEventsInTimeWindow(sourceId: string, timeWindow: { start: Date; end: Date }): UsageEvent[] {
    return this.usageEvents.filter(event => 
      event.sourceId === sourceId &&
      event.timestamp >= timeWindow.start &&
      event.timestamp <= timeWindow.end
    );
  }

  private calculateSessionDurations(events: UsageEvent[]): number[] {
    const sessions = new Map<string, UsageEvent[]>();
    events.forEach(event => {
      if (event.sessionId) {
        if (!sessions.has(event.sessionId)) {
          sessions.set(event.sessionId, []);
        }
        sessions.get(event.sessionId)!.push(event);
      }
    });

    return Array.from(sessions.values()).map(sessionEvents => {
      if (sessionEvents.length < 2) return 0;
      const start = Math.min(...sessionEvents.map(e => e.timestamp.getTime()));
      const end = Math.max(...sessionEvents.map(e => e.timestamp.getTime()));
      return end - start;
    });
  }

  private calculateReturnUserRate(events: UsageEvent[]): number {
    const userSessions = new Map<string, Set<string>>();
    events.forEach(event => {
      if (event.userId && event.sessionId) {
        if (!userSessions.has(event.userId)) {
          userSessions.set(event.userId, new Set());
        }
        userSessions.get(event.userId)!.add(event.sessionId);
      }
    });

    const returnUsers = Array.from(userSessions.values()).filter(sessions => sessions.size > 1).length;
    const totalUsers = userSessions.size;
    
    return totalUsers > 0 ? (returnUsers / totalUsers) * 100 : 0;
  }

  private calculateBounceRate(events: UsageEvent[]): number {
    const sessions = new Map<string, UsageEvent[]>();
    events.forEach(event => {
      if (event.sessionId) {
        if (!sessions.has(event.sessionId)) {
          sessions.set(event.sessionId, []);
        }
        sessions.get(event.sessionId)!.push(event);
      }
    });

    const singleEventSessions = Array.from(sessions.values()).filter(sessionEvents => sessionEvents.length === 1).length;
    const totalSessions = sessions.size;
    
    return totalSessions > 0 ? (singleEventSessions / totalSessions) * 100 : 0;
  }

  private calculateThroughput(events: UsageEvent[], period: { start: Date; end: Date }): number {
    const durationHours = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60);
    return durationHours > 0 ? events.length / durationHours : 0;
  }

  private calculateUsageTrends(sourceId: string, period: { start: Date; end: Date }): UsageMetrics['trends'] {
    // Simplified trend calculation
    const currentMetrics = this.getUsageMetrics(sourceId, period);
    const previousPeriod = {
      start: new Date(period.start.getTime() - (period.end.getTime() - period.start.getTime())),
      end: period.start
    };
    const previousMetrics = this.getUsageMetrics(sourceId, previousPeriod);

    const usageTrend = this.calculateTrendValue(currentMetrics.totalEvents, previousMetrics.totalEvents);
    const userTrend = this.calculateTrendValue(currentMetrics.uniqueUsers, previousMetrics.uniqueUsers);
    const performanceTrend = this.calculateTrendValue(currentMetrics.performance.successRate, previousMetrics.performance.successRate);

    return {
      usageTrend: usageTrend > 0.1 ? 'increasing' : usageTrend < -0.1 ? 'decreasing' : 'stable',
      userTrend: userTrend > 0.1 ? 'growing' : userTrend < -0.1 ? 'declining' : 'stable',
      performanceTrend: performanceTrend > 0.1 ? 'improving' : performanceTrend < -0.1 ? 'degrading' : 'stable'
    };
  }

  private calculateTrendValue(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 1 : 0;
    return (current - previous) / previous;
  }

  private calculateUsageScore(metrics: UsageMetrics): number {
    // Normalize usage metrics to 0-100 scale
    const eventScore = Math.min(100, (metrics.totalEvents / 1000) * 100);
    const userScore = Math.min(100, (metrics.uniqueUsers / 100) * 100);
    const engagementScore = Math.min(100, (metrics.userEngagement.averageSessionDuration / 300000) * 100); // 5 minutes = 100%
    
    return (eventScore + userScore + engagementScore) / 3;
  }

  private calculateCostScore(analysis: CostBenefitAnalysis): number {
    if (analysis.roi.percentage <= 0) return 0;
    if (analysis.roi.percentage >= 200) return 100;
    return Math.min(100, (analysis.roi.percentage / 200) * 100);
  }

  private calculateUserSatisfactionScore(metrics: UsageMetrics): number {
    const bounceRateScore = Math.max(0, 100 - metrics.userEngagement.bounceRate);
    const returnRateScore = metrics.userEngagement.returnUserRate;
    const sessionDurationScore = Math.min(100, (metrics.userEngagement.averageSessionDuration / 300000) * 100);
    
    return (bounceRateScore + returnRateScore + sessionDurationScore) / 3;
  }

  private calculateBusinessImpactScore(metrics: UsageMetrics, analysis: CostBenefitAnalysis): number {
    const usageImpact = Math.min(100, (metrics.totalEvents / 1000) * 100);
    const roiImpact = Math.min(100, Math.max(0, analysis.roi.percentage));
    const productivityImpact = Math.min(100, analysis.benefits.productivityGain);
    
    return (usageImpact + roiImpact + productivityImpact) / 3;
  }

  private generateValueScoreRecommendations(components: SourceValueScore['components']): string[] {
    const recommendations: string[] = [];
    
    if (components.usage < 50) {
      recommendations.push('Focus on increasing source usage through better discoverability and user engagement');
    }
    if (components.performance < 90) {
      recommendations.push('Improve source reliability and performance to enhance user experience');
    }
    if (components.quality < 80) {
      recommendations.push('Address data quality issues to improve source value');
    }
    if (components.cost < 50) {
      recommendations.push('Optimize costs to improve ROI and value proposition');
    }
    if (components.userSatisfaction < 70) {
      recommendations.push('Enhance user experience to increase satisfaction and retention');
    }
    if (components.businessImpact < 60) {
      recommendations.push('Focus on demonstrating and improving business value');
    }
    
    return recommendations;
  }

  private estimateInfrastructureCost(metrics: UsageMetrics): number {
    // Simplified cost estimation
    return metrics.totalEvents * 0.001; // $0.001 per event
  }

  private estimateApiCost(metrics: UsageMetrics): number {
    return metrics.totalEvents * 0.005; // $0.005 per API call
  }

  private estimateMaintenanceCost(metrics: UsageMetrics): number {
    return metrics.totalEvents * 0.0005; // $0.0005 per event for maintenance
  }

  private estimateSupportCost(metrics: UsageMetrics): number {
    return metrics.uniqueUsers * 0.1; // $0.10 per user for support
  }

  private calculateTimeSaved(metrics: UsageMetrics): number {
    // Estimate time saved per event (in hours)
    return metrics.totalEvents * 0.1; // 6 minutes saved per event
  }

  private calculateProductivityGain(metrics: UsageMetrics): number {
    // Estimate productivity gain percentage
    return Math.min(50, (metrics.totalEvents / 100) * 5); // Up to 50% gain
  }

  private calculateBusinessValue(metrics: UsageMetrics, performance: any): number {
    // Estimate business value based on usage and performance
    const baseValue = metrics.totalEvents * 0.1; // $0.10 per event
    const performanceMultiplier = performance.successRate / 100;
    return baseValue * performanceMultiplier;
  }

  private calculatePaybackPeriod(cost: number, benefit: number): number {
    if (benefit <= 0) return Infinity;
    return (cost / benefit) * 12; // months
  }

  private generateCostBenefitRecommendations(costs: any, benefits: any, roi: any): string[] {
    const recommendations: string[] = [];
    
    if (roi.percentage < 100) {
      recommendations.push('Focus on increasing benefits or reducing costs to improve ROI');
    }
    if (costs.api > costs.infrastructure) {
      recommendations.push('Consider optimizing API usage to reduce costs');
    }
    if (benefits.timeSaved < 100) {
      recommendations.push('Look for opportunities to increase time savings');
    }
    
    return recommendations;
  }

  private calculateTrend(timestamps: number[]): number {
    if (timestamps.length < 2) return 0;
    
    const n = timestamps.length;
    const x = timestamps.map((_, i) => i);
    const y = timestamps;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private calculateUserTrend(events: UsageEvent[]): number {
    const dailyUsers = new Map<string, Set<string>>();
    events.forEach(event => {
      if (event.userId) {
        const day = event.timestamp.toISOString().split('T')[0];
        if (!dailyUsers.has(day)) {
          dailyUsers.set(day, new Set());
        }
        dailyUsers.get(day)!.add(event.userId);
      }
    });
    
    const userCounts = Array.from(dailyUsers.values()).map(users => users.size);
    return this.calculateTrend(userCounts);
  }

  private calculatePerformanceTrend(sourceId: string): number {
    const history = performanceMetrics.getSourceStats(sourceId);
    // Simplified - would use historical data
    return 0;
  }

  private generateForecastRecommendations(usage: number, users: number, performance: number): string[] {
    const recommendations: string[] = [];
    
    if (usage > 10000) {
      recommendations.push('Prepare for high usage - consider scaling infrastructure');
    }
    if (users > 1000) {
      recommendations.push('High user growth expected - plan for user support and onboarding');
    }
    if (performance < 90) {
      recommendations.push('Performance may degrade - implement monitoring and optimization');
    }
    
    return recommendations;
  }

  private identifyForecastRisks(usage: number, users: number, performance: number): string[] {
    const risks: string[] = [];
    
    if (usage > 50000) {
      risks.push('Very high usage may cause system overload');
    }
    if (users > 5000) {
      risks.push('Large user base may require additional support resources');
    }
    if (performance < 80) {
      risks.push('Low performance may impact user experience');
    }
    
    return risks;
  }

  private calculateOverallTrends(): {
    usageTrend: 'increasing' | 'stable' | 'decreasing';
    userTrend: 'growing' | 'stable' | 'declining';
    performanceTrend: 'improving' | 'stable' | 'degrading';
  } {
    // Simplified overall trend calculation
    return {
      usageTrend: 'stable',
      userTrend: 'stable',
      performanceTrend: 'stable'
    };
  }

  private getPriorityWeight(priority: UsageRecommendation['priority']): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private exportToCSV(events: UsageEvent[]): string {
    if (events.length === 0) return '';
    
    const headers = Object.keys(events[0]).join(',');
    const rows = events.map(event => 
      Object.values(event).map(value => 
        typeof value === 'string' ? `"${value}"` : 
        typeof value === 'object' ? `"${JSON.stringify(value)}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  private cleanupOldEvents(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.dataRetentionDays);
    
    this.usageEvents = this.usageEvents.filter(event => event.timestamp > cutoffDate);
  }

  private startAnalyticsProcessing(): void {
    // Start background processing for analytics
    setInterval(() => {
      this.processAnalytics();
    }, this.config.aggregationInterval * 60 * 1000);
  }

  private processAnalytics(): void {
    // Background processing of analytics data
    // This would include calculating trends, generating recommendations, etc.
    console.log('Processing usage analytics...');
  }
}

// Export singleton instance
export const usageAnalytics = new UsageAnalyticsEngine();
