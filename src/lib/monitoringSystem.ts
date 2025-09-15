/**
 * Source Monitoring and Alerting System
 * 
 * This module provides comprehensive monitoring and alerting for all source
 * management operations including performance monitoring, health checks,
 * alerting, and incident management.
 */

import { performanceMetrics } from './performanceMetrics';
import { securityCompliance } from './securityCompliance';

export interface MonitoringConfig {
  healthCheckInterval: number; // milliseconds
  performanceCheckInterval: number; // milliseconds
  alertThresholds: AlertThresholds;
  notificationChannels: NotificationChannel[];
  retentionPeriod: number; // days
  enableRealTimeMonitoring: boolean;
  enableHistoricalAnalysis: boolean;
}

export interface AlertThresholds {
  responseTime: {
    warning: number; // milliseconds
    critical: number; // milliseconds
  };
  errorRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
  availability: {
    warning: number; // percentage
    critical: number; // percentage
  };
  dataQuality: {
    warning: number; // score 0-100
    critical: number; // score 0-100
  };
  security: {
    failedLogins: number; // count per hour
    suspiciousActivity: number; // count per hour
  };
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  name: string;
  config: any;
  enabled: boolean;
  severity: ('low' | 'medium' | 'high' | 'critical')[];
}

export interface MonitoringEvent {
  id: string;
  timestamp: Date;
  sourceId: string;
  eventType: 'health_check' | 'performance_metric' | 'error' | 'alert' | 'recovery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface HealthCheckResult {
  sourceId: string;
  timestamp: Date;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  responseTime: number;
  errorRate: number;
  availability: number;
  dataQuality: number;
  details: Record<string, any>;
}

export interface PerformanceMetric {
  sourceId: string;
  timestamp: Date;
  metric: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
}

export interface Alert {
  id: string;
  timestamp: Date;
  sourceId: string;
  type: 'performance' | 'health' | 'security' | 'data_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  channelId: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  error?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  sourceId: string;
  alerts: string[];
  created: Date;
  updated: Date;
  resolved?: Date;
  assignedTo?: string;
  timeline: IncidentEvent[];
}

export interface IncidentEvent {
  timestamp: Date;
  type: 'created' | 'updated' | 'resolved' | 'escalated';
  message: string;
  user?: string;
  details?: Record<string, any>;
}

export interface MonitoringDashboard {
  overview: {
    totalSources: number;
    healthySources: number;
    warningSources: number;
    criticalSources: number;
    activeAlerts: number;
    resolvedIncidents: number;
  };
  performance: {
    averageResponseTime: number;
    totalRequests: number;
    successRate: number;
    errorRate: number;
  };
  trends: {
    responseTime: TimeSeriesData[];
    errorRate: TimeSeriesData[];
    availability: TimeSeriesData[];
  };
  recentEvents: MonitoringEvent[];
  activeAlerts: Alert[];
  openIncidents: Incident[];
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  sourceId?: string;
}

/**
 * Monitoring and Alerting Manager
 */
export class MonitoringManager {
  private config: MonitoringConfig;
  private events: MonitoringEvent[] = [];
  private alerts: Alert[] = [];
  private incidents: Incident[] = [];
  private healthChecks: HealthCheckResult[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private alertingInterval?: NodeJS.Timeout;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      healthCheckInterval: 60000, // 1 minute
      performanceCheckInterval: 30000, // 30 seconds
      alertThresholds: {
        responseTime: { warning: 1000, critical: 5000 },
        errorRate: { warning: 5, critical: 10 },
        availability: { warning: 95, critical: 90 },
        dataQuality: { warning: 80, critical: 70 },
        security: { failedLogins: 10, suspiciousActivity: 5 }
      },
      notificationChannels: [],
      retentionPeriod: 30,
      enableRealTimeMonitoring: true,
      enableHistoricalAnalysis: true,
      ...config
    };

    this.startMonitoring();
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    if (this.config.enableRealTimeMonitoring) {
      this.monitoringInterval = setInterval(() => {
        this.performHealthChecks();
        this.collectPerformanceMetrics();
      }, this.config.healthCheckInterval);

      this.alertingInterval = setInterval(() => {
        this.checkAlertConditions();
        this.processNotifications();
      }, this.config.performanceCheckInterval);
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.alertingInterval) {
      clearInterval(this.alertingInterval);
      this.alertingInterval = undefined;
    }
  }

  /**
   * Perform health checks
   */
  async performHealthChecks(): Promise<void> {
    // Get all sources (in a real implementation, this would fetch from source manager)
    const sources = ['github', 'n8n', 'zapier', 'make', 'openai'];

    for (const sourceId of sources) {
      try {
        const healthCheck = await this.performHealthCheck(sourceId);
        this.healthChecks.push(healthCheck);

        // Log monitoring event
        this.logEvent({
          sourceId,
          eventType: 'health_check',
          severity: healthCheck.status === 'healthy' ? 'low' : 
                   healthCheck.status === 'warning' ? 'medium' : 'high',
          message: `Health check completed: ${healthCheck.status}`,
          details: healthCheck
        });

        // Check for health issues
        if (healthCheck.status !== 'healthy') {
          await this.createHealthAlert(healthCheck);
        }
      } catch (error) {
        this.logEvent({
          sourceId,
          eventType: 'error',
          severity: 'high',
          message: `Health check failed: ${(error as Error).message}`,
          details: { error: (error as Error).message }
        });
      }
    }

    // Cleanup old health checks
    this.cleanupOldData();
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics(): Promise<void> {
    const sources = ['github', 'n8n', 'zapier', 'make', 'openai'];

    for (const sourceId of sources) {
      try {
        const metrics = await this.collectSourceMetrics(sourceId);
        this.performanceMetrics.push(...metrics);

        // Log monitoring event
        this.logEvent({
          sourceId,
          eventType: 'performance_metric',
          severity: 'low',
          message: 'Performance metrics collected',
          details: { metrics: metrics.length }
        });
      } catch (error) {
        this.logEvent({
          sourceId,
          eventType: 'error',
          severity: 'medium',
          message: `Failed to collect metrics: ${(error as Error).message}`,
          details: { error: (error as Error).message }
        });
      }
    }
  }

  /**
   * Check alert conditions
   */
  async checkAlertConditions(): Promise<void> {
    const sources = ['github', 'n8n', 'zapier', 'make', 'openai'];

    for (const sourceId of sources) {
      // Check response time
      const avgResponseTime = this.getAverageResponseTime(sourceId);
      if (avgResponseTime > this.config.alertThresholds.responseTime.critical) {
        await this.createAlert({
          sourceId,
          type: 'performance',
          severity: 'critical',
          title: 'High Response Time',
          message: `Average response time is ${avgResponseTime}ms, exceeding critical threshold`,
          details: { responseTime: avgResponseTime, threshold: this.config.alertThresholds.responseTime.critical }
        });
      } else if (avgResponseTime > this.config.alertThresholds.responseTime.warning) {
        await this.createAlert({
          sourceId,
          type: 'performance',
          severity: 'medium',
          title: 'Elevated Response Time',
          message: `Average response time is ${avgResponseTime}ms, exceeding warning threshold`,
          details: { responseTime: avgResponseTime, threshold: this.config.alertThresholds.responseTime.warning }
        });
      }

      // Check error rate
      const errorRate = this.getErrorRate(sourceId);
      if (errorRate > this.config.alertThresholds.errorRate.critical) {
        await this.createAlert({
          sourceId,
          type: 'performance',
          severity: 'critical',
          title: 'High Error Rate',
          message: `Error rate is ${errorRate}%, exceeding critical threshold`,
          details: { errorRate, threshold: this.config.alertThresholds.errorRate.critical }
        });
      } else if (errorRate > this.config.alertThresholds.errorRate.warning) {
        await this.createAlert({
          sourceId,
          type: 'performance',
          severity: 'medium',
          title: 'Elevated Error Rate',
          message: `Error rate is ${errorRate}%, exceeding warning threshold`,
          details: { errorRate, threshold: this.config.alertThresholds.errorRate.warning }
        });
      }

      // Check availability
      const availability = this.getAvailability(sourceId);
      if (availability < this.config.alertThresholds.availability.critical) {
        await this.createAlert({
          sourceId,
          type: 'health',
          severity: 'critical',
          title: 'Low Availability',
          message: `Availability is ${availability}%, below critical threshold`,
          details: { availability, threshold: this.config.alertThresholds.availability.critical }
        });
      } else if (availability < this.config.alertThresholds.availability.warning) {
        await this.createAlert({
          sourceId,
          type: 'health',
          severity: 'medium',
          title: 'Reduced Availability',
          message: `Availability is ${availability}%, below warning threshold`,
          details: { availability, threshold: this.config.alertThresholds.availability.warning }
        });
      }
    }
  }

  /**
   * Create alert
   */
  async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'status' | 'notifications'>): Promise<Alert> {
    const alert: Alert = {
      id: this.generateId(),
      timestamp: new Date(),
      status: 'active',
      notifications: [],
      ...alertData
    };

    this.alerts.push(alert);

    // Log monitoring event
    this.logEvent({
      sourceId: alert.sourceId,
      eventType: 'alert',
      severity: alert.severity,
      message: `Alert created: ${alert.title}`,
      details: { alertId: alert.id, type: alert.type }
    });

    // Send notifications
    await this.sendNotifications(alert);

    return alert;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;

      this.logEvent({
        sourceId: alert.sourceId,
        eventType: 'alert',
        severity: 'low',
        message: `Alert acknowledged by ${acknowledgedBy}`,
        details: { alertId, acknowledgedBy }
      });
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolvedBy: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;

      this.logEvent({
        sourceId: alert.sourceId,
        eventType: 'alert',
        severity: 'low',
        message: `Alert resolved by ${resolvedBy}`,
        details: { alertId, resolvedBy }
      });
    }
  }

  /**
   * Create incident
   */
  createIncident(incidentData: Omit<Incident, 'id' | 'created' | 'updated' | 'timeline'>): Incident {
    const incident: Incident = {
      id: this.generateId(),
      created: new Date(),
      updated: new Date(),
      timeline: [{
        timestamp: new Date(),
        type: 'created',
        message: 'Incident created',
        details: incidentData
      }],
      ...incidentData
    };

    this.incidents.push(incident);

    this.logEvent({
      sourceId: incident.sourceId,
      eventType: 'alert',
      severity: incident.severity,
      message: `Incident created: ${incident.title}`,
      details: { incidentId: incident.id, alerts: incident.alerts }
    });

    return incident;
  }

  /**
   * Update incident
   */
  updateIncident(incidentId: string, updates: Partial<Incident>, user?: string): void {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (incident) {
      Object.assign(incident, updates);
      incident.updated = new Date();
      incident.timeline.push({
        timestamp: new Date(),
        type: 'updated',
        message: 'Incident updated',
        user,
        details: updates
      });

      this.logEvent({
        sourceId: incident.sourceId,
        eventType: 'alert',
        severity: 'low',
        message: `Incident updated: ${incident.title}`,
        details: { incidentId, updates, user }
      });
    }
  }

  /**
   * Get monitoring dashboard
   */
  getDashboard(): MonitoringDashboard {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentHealthChecks = this.healthChecks.filter(h => h.timestamp > oneHourAgo);
    const recentMetrics = this.performanceMetrics.filter(m => m.timestamp > oneHourAgo);

    const healthySources = recentHealthChecks.filter(h => h.status === 'healthy').length;
    const warningSources = recentHealthChecks.filter(h => h.status === 'warning').length;
    const criticalSources = recentHealthChecks.filter(h => h.status === 'critical').length;

    const activeAlerts = this.alerts.filter(a => a.status === 'active');
    const openIncidents = this.incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed');

    const responseTimeMetrics = recentMetrics.filter(m => m.metric === 'response_time');
    const errorMetrics = recentMetrics.filter(m => m.metric === 'error_rate');

    return {
      overview: {
        totalSources: recentHealthChecks.length,
        healthySources,
        warningSources,
        criticalSources,
        activeAlerts: activeAlerts.length,
        resolvedIncidents: this.incidents.filter(i => i.status === 'resolved').length
      },
      performance: {
        averageResponseTime: responseTimeMetrics.length > 0 ? 
          responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length : 0,
        totalRequests: recentMetrics.filter(m => m.metric === 'requests').reduce((sum, m) => sum + m.value, 0),
        successRate: this.calculateSuccessRate(recentMetrics),
        errorRate: errorMetrics.length > 0 ? 
          errorMetrics.reduce((sum, m) => sum + m.value, 0) / errorMetrics.length : 0
      },
      trends: {
        responseTime: this.generateTimeSeriesData(responseTimeMetrics),
        errorRate: this.generateTimeSeriesData(errorMetrics),
        availability: this.generateAvailabilityTrends(recentHealthChecks)
      },
      recentEvents: this.events.slice(-10).reverse(),
      activeAlerts: activeAlerts.slice(-5),
      openIncidents: openIncidents.slice(-5)
    };
  }

  /**
   * Get monitoring events
   */
  getEvents(filters?: {
    sourceId?: string;
    eventType?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): MonitoringEvent[] {
    let events = [...this.events];

    if (filters) {
      if (filters.sourceId) {
        events = events.filter(e => e.sourceId === filters.sourceId);
      }
      if (filters.eventType) {
        events = events.filter(e => e.eventType === filters.eventType);
      }
      if (filters.severity) {
        events = events.filter(e => e.severity === filters.severity);
      }
      if (filters.startDate) {
        events = events.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(e => e.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        events = events.slice(-filters.limit);
      }
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get alerts
   */
  getAlerts(filters?: {
    sourceId?: string;
    type?: string;
    severity?: string;
    status?: string;
    limit?: number;
  }): Alert[] {
    let alerts = [...this.alerts];

    if (filters) {
      if (filters.sourceId) {
        alerts = alerts.filter(a => a.sourceId === filters.sourceId);
      }
      if (filters.type) {
        alerts = alerts.filter(a => a.type === filters.type);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters.status) {
        alerts = alerts.filter(a => a.status === filters.status);
      }
      if (filters.limit) {
        alerts = alerts.slice(-filters.limit);
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get incidents
   */
  getIncidents(filters?: {
    sourceId?: string;
    severity?: string;
    status?: string;
    limit?: number;
  }): Incident[] {
    let incidents = [...this.incidents];

    if (filters) {
      if (filters.sourceId) {
        incidents = incidents.filter(i => i.sourceId === filters.sourceId);
      }
      if (filters.severity) {
        incidents = incidents.filter(i => i.severity === filters.severity);
      }
      if (filters.status) {
        incidents = incidents.filter(i => i.status === filters.status);
      }
      if (filters.limit) {
        incidents = incidents.slice(-filters.limit);
      }
    }

    return incidents.sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring with new configuration
    this.stopMonitoring();
    this.startMonitoring();
  }

  /**
   * Private helper methods
   */
  private async performHealthCheck(sourceId: string): Promise<HealthCheckResult> {
    // Simulate health check (in real implementation, this would check actual source)
    const responseTime = Math.random() * 2000; // 0-2000ms
    const errorRate = Math.random() * 10; // 0-10%
    const availability = 100 - errorRate;
    const dataQuality = 70 + Math.random() * 30; // 70-100

    let status: 'healthy' | 'warning' | 'critical' | 'unknown' = 'healthy';
    if (responseTime > 1000 || errorRate > 5 || availability < 95) {
      status = 'warning';
    }
    if (responseTime > 5000 || errorRate > 10 || availability < 90) {
      status = 'critical';
    }

    return {
      sourceId,
      timestamp: new Date(),
      status,
      responseTime,
      errorRate,
      availability,
      dataQuality,
      details: {
        endpoint: `https://${sourceId}.example.com/health`,
        lastChecked: new Date()
      }
    };
  }

  private async collectSourceMetrics(sourceId: string): Promise<PerformanceMetric[]> {
    const now = new Date();
    const metrics: PerformanceMetric[] = [];

    // Simulate collecting various metrics
    metrics.push({
      sourceId,
      timestamp: now,
      metric: 'response_time',
      value: Math.random() * 1000,
      unit: 'ms',
      tags: { source: sourceId }
    });

    metrics.push({
      sourceId,
      timestamp: now,
      metric: 'requests',
      value: Math.floor(Math.random() * 100),
      unit: 'count',
      tags: { source: sourceId }
    });

    metrics.push({
      sourceId,
      timestamp: now,
      metric: 'error_rate',
      value: Math.random() * 5,
      unit: 'percent',
      tags: { source: sourceId }
    });

    return metrics;
  }

  private async createHealthAlert(healthCheck: HealthCheckResult): Promise<void> {
    const severity = healthCheck.status === 'critical' ? 'critical' : 'medium';
    
    await this.createAlert({
      sourceId: healthCheck.sourceId,
      type: 'health',
      severity,
      title: `Source Health Issue: ${healthCheck.sourceId}`,
      message: `Source ${healthCheck.sourceId} is in ${healthCheck.status} state`,
      details: healthCheck
    });
  }

  private getAverageResponseTime(sourceId: string): number {
    const recentMetrics = this.performanceMetrics.filter(m => 
      m.sourceId === sourceId && 
      m.metric === 'response_time' &&
      m.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    if (recentMetrics.length === 0) return 0;
    return recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
  }

  private getErrorRate(sourceId: string): number {
    const recentMetrics = this.performanceMetrics.filter(m => 
      m.sourceId === sourceId && 
      m.metric === 'error_rate' &&
      m.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    if (recentMetrics.length === 0) return 0;
    return recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
  }

  private getAvailability(sourceId: string): number {
    const recentHealthChecks = this.healthChecks.filter(h => 
      h.sourceId === sourceId &&
      h.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    if (recentHealthChecks.length === 0) return 100;
    return recentHealthChecks.reduce((sum, h) => sum + h.availability, 0) / recentHealthChecks.length;
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    for (const channel of this.config.notificationChannels) {
      if (channel.enabled && channel.severity.includes(alert.severity)) {
        const notification: Notification = {
          id: this.generateId(),
          channelId: channel.id,
          timestamp: new Date(),
          status: 'pending',
          retryCount: 0
        };

        alert.notifications.push(notification);

        try {
          await this.sendNotification(channel, alert);
          notification.status = 'sent';
        } catch (error) {
          notification.status = 'failed';
          notification.error = (error as Error).message;
        }
      }
    }
  }

  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // Simulate sending notification (in real implementation, this would send actual notifications)
    console.log(`Sending ${channel.type} notification to ${channel.name}: ${alert.title}`);
  }

  private async processNotifications(): Promise<void> {
    // Process failed notifications for retry
    for (const alert of this.alerts) {
      for (const notification of alert.notifications) {
        if (notification.status === 'failed' && notification.retryCount < 3) {
          notification.retryCount++;
          notification.status = 'pending';
          
          const channel = this.config.notificationChannels.find(c => c.id === notification.channelId);
          if (channel) {
            try {
              await this.sendNotification(channel, alert);
              notification.status = 'sent';
            } catch (error) {
              notification.status = 'failed';
              notification.error = (error as Error).message;
            }
          }
        }
      }
    }
  }

  private logEvent(event: Omit<MonitoringEvent, 'id' | 'timestamp' | 'resolved'>): void {
    const monitoringEvent: MonitoringEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      resolved: false,
      ...event
    };

    this.events.push(monitoringEvent);
  }

  private cleanupOldData(): void {
    const cutoffDate = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);
    
    this.events = this.events.filter(e => e.timestamp > cutoffDate);
    this.healthChecks = this.healthChecks.filter(h => h.timestamp > cutoffDate);
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoffDate);
  }

  private generateId(): string {
    return `monitoring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateSuccessRate(metrics: PerformanceMetric[]): number {
    const totalRequests = metrics.filter(m => m.metric === 'requests').reduce((sum, m) => sum + m.value, 0);
    const errors = metrics.filter(m => m.metric === 'error_rate').reduce((sum, m) => sum + m.value, 0);
    
    if (totalRequests === 0) return 100;
    return Math.max(0, 100 - (errors / totalRequests) * 100);
  }

  private generateTimeSeriesData(metrics: PerformanceMetric[]): TimeSeriesData[] {
    return metrics.map(m => ({
      timestamp: m.timestamp,
      value: m.value,
      sourceId: m.sourceId
    }));
  }

  private generateAvailabilityTrends(healthChecks: HealthCheckResult[]): TimeSeriesData[] {
    return healthChecks.map(h => ({
      timestamp: h.timestamp,
      value: h.availability,
      sourceId: h.sourceId
    }));
  }
}

// Export singleton instance
export const monitoringManager = new MonitoringManager();
