/**
 * Notification Service
 * 
 * Dedicated service for managing notifications and alerts
 */

import { Notification } from '../schemas/common';

export interface NotificationConfig {
  enabled: boolean;
  channels: ('console' | 'browser' | 'email' | 'webhook')[];
  severityFilter: ('low' | 'medium' | 'high' | 'critical')[];
  cooldownMinutes: number;
  maxNotificationsPerHour: number;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'console' | 'browser' | 'email' | 'webhook';
  enabled: boolean;
  config: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  variables: string[];
  defaultSeverity: 'low' | 'medium' | 'high' | 'critical';
}

export class NotificationService {
  private static notifications: Map<string, Notification[]> = new Map();
  private static notificationHistory: Map<string, Date[]> = new Map();
  private static config: NotificationConfig = {
    enabled: true,
    channels: ['console', 'browser'],
    severityFilter: ['medium', 'high', 'critical'],
    cooldownMinutes: 5,
    maxNotificationsPerHour: 20
  };
  private static channels: Map<string, NotificationChannel> = new Map();
  private static templates: Map<string, NotificationTemplate> = new Map();

  /**
   * Initialize notification service
   */
  static initialize(): void {
    this.setupDefaultChannels();
    this.setupDefaultTemplates();
  }

  /**
   * Send notification
   */
  static async sendNotification(
    type: 'info' | 'warning' | 'error' | 'success',
    title: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Check severity filter
    if (!this.config.severityFilter.includes(severity)) {
      return;
    }

    // Check rate limiting
    if (!this.checkRateLimit(context || 'default')) {
      console.warn('Notification rate limit exceeded for context:', context);
      return;
    }

    // Check cooldown
    if (!this.checkCooldown(context || 'default')) {
      return;
    }

    const notification: Notification = {
      id: this.generateNotificationId(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: metadata?.actionUrl,
      actionText: metadata?.actionText
    };

    // Store notification
    this.storeNotification(notification, context || 'default');

    // Send to configured channels
    await this.sendToChannels(notification, severity, context, metadata);
  }

  /**
   * Send notification using template
   */
  static async sendTemplateNotification(
    templateId: string,
    variables: Record<string, any>,
    severity?: 'low' | 'medium' | 'high' | 'critical',
    context?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      console.error('Notification template not found:', templateId);
      return;
    }

    // Replace variables in template
    let title = template.title;
    let message = template.message;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    }

    await this.sendNotification(
      template.type,
      title,
      message,
      severity || template.defaultSeverity,
      context,
      metadata
    );
  }

  /**
   * Get notifications for context
   */
  static getNotifications(context: string = 'default'): Notification[] {
    return this.notifications.get(context) || [];
  }

  /**
   * Mark notification as read
   */
  static markAsRead(notificationId: string, context: string = 'default'): void {
    const notifications = this.notifications.get(context);
    if (notifications) {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }
  }

  /**
   * Mark all notifications as read
   */
  static markAllAsRead(context: string = 'default'): void {
    const notifications = this.notifications.get(context);
    if (notifications) {
      notifications.forEach(notification => {
        notification.read = true;
      });
    }
  }

  /**
   * Clear notifications
   */
  static clearNotifications(context: string = 'default'): void {
    this.notifications.set(context, []);
  }

  /**
   * Get notification statistics
   */
  static getNotificationStats(context: string = 'default'): {
    total: number;
    unread: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const notifications = this.notifications.get(context) || [];
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    };

    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Update notification configuration
   */
  static updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add notification channel
   */
  static addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
  }

  /**
   * Remove notification channel
   */
  static removeChannel(channelId: string): void {
    this.channels.delete(channelId);
  }

  /**
   * Add notification template
   */
  static addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Remove notification template
   */
  static removeTemplate(templateId: string): void {
    this.templates.delete(templateId);
  }

  /**
   * Setup default channels
   */
  private static setupDefaultChannels(): void {
    this.addChannel({
      id: 'console',
      name: 'Console',
      type: 'console',
      enabled: true,
      config: {}
    });

    this.addChannel({
      id: 'browser',
      name: 'Browser',
      type: 'browser',
      enabled: true,
      config: {}
    });
  }

  /**
   * Setup default templates
   */
  private static setupDefaultTemplates(): void {
    this.addTemplate({
      id: 'workflow_imported',
      name: 'Workflow Imported',
      type: 'success',
      title: 'Workflow Imported Successfully',
      message: 'Workflow "{{name}}" has been imported from {{source}}.',
      variables: ['name', 'source'],
      defaultSeverity: 'medium'
    });

    this.addTemplate({
      id: 'workflow_failed',
      name: 'Workflow Import Failed',
      type: 'error',
      title: 'Workflow Import Failed',
      message: 'Failed to import workflow "{{name}}" from {{source}}: {{error}}.',
      variables: ['name', 'source', 'error'],
      defaultSeverity: 'high'
    });

    this.addTemplate({
      id: 'cache_cleared',
      name: 'Cache Cleared',
      type: 'info',
      title: 'Cache Cleared',
      message: '{{cacheType}} cache has been cleared successfully.',
      variables: ['cacheType'],
      defaultSeverity: 'low'
    });

    this.addTemplate({
      id: 'api_rate_limit',
      name: 'API Rate Limit',
      type: 'warning',
      title: 'API Rate Limit Exceeded',
      message: 'Rate limit exceeded for {{service}}. Using fallback data.',
      variables: ['service'],
      defaultSeverity: 'medium'
    });
  }

  /**
   * Check rate limit
   */
  private static checkRateLimit(context: string): boolean {
    const history = this.notificationHistory.get(context) || [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Remove old entries
    const recentHistory = history.filter(date => date > oneHourAgo);
    this.notificationHistory.set(context, recentHistory);
    
    return recentHistory.length < this.config.maxNotificationsPerHour;
  }

  /**
   * Check cooldown
   */
  private static checkCooldown(context: string): boolean {
    const history = this.notificationHistory.get(context) || [];
    if (history.length === 0) {
      return true;
    }
    
    const lastNotification = history[history.length - 1];
    const now = new Date();
    const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
    
    return now.getTime() - lastNotification.getTime() > cooldownMs;
  }

  /**
   * Store notification
   */
  private static storeNotification(notification: Notification, context: string): void {
    if (!this.notifications.has(context)) {
      this.notifications.set(context, []);
    }
    
    const notifications = this.notifications.get(context)!;
    notifications.push(notification);
    
    // Keep only last 100 notifications per context
    if (notifications.length > 100) {
      notifications.splice(0, notifications.length - 100);
    }
    
    // Update history
    if (!this.notificationHistory.has(context)) {
      this.notificationHistory.set(context, []);
    }
    
    const history = this.notificationHistory.get(context)!;
    history.push(new Date());
  }

  /**
   * Send to configured channels
   */
  private static async sendToChannels(
    notification: Notification,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    for (const channelId of this.config.channels) {
      const channel = this.channels.get(channelId);
      if (channel && channel.enabled) {
        try {
          await this.sendToChannel(channel, notification, severity, context, metadata);
        } catch (error) {
          console.error(`Failed to send notification to channel ${channelId}:`, error);
        }
      }
    }
  }

  /**
   * Send to specific channel
   */
  private static async sendToChannel(
    channel: NotificationChannel,
    notification: Notification,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    switch (channel.type) {
      case 'console':
        this.sendToConsole(notification, severity);
        break;
      case 'browser':
        this.sendToBrowser(notification, severity);
        break;
      case 'email':
        await this.sendToEmail(channel, notification, severity);
        break;
      case 'webhook':
        await this.sendToWebhook(channel, notification, severity);
        break;
    }
  }

  /**
   * Send to console
   */
  private static sendToConsole(
    notification: Notification,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): void {
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅'
    }[notification.type];

    const severityEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    }[severity];

    console.log(
      `${emoji} ${severityEmoji} [${notification.type.toUpperCase()}] ${notification.title}: ${notification.message}`
    );
  }

  /**
   * Send to browser
   */
  private static sendToBrowser(
    notification: Notification,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): void {
    if (typeof window !== 'undefined') {
      // Dispatch custom event for browser notifications
      const event = new CustomEvent('notification', {
        detail: {
          ...notification,
          severity
        }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Send to email
   */
  private static async sendToEmail(
    channel: NotificationChannel,
    notification: Notification,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    // Email implementation would go here
    console.log('Email notification:', notification);
  }

  /**
   * Send to webhook
   */
  private static async sendToWebhook(
    channel: NotificationChannel,
    notification: Notification,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    const webhookUrl = channel.config.url;
    if (!webhookUrl) {
      console.error('Webhook URL not configured for channel:', channel.id);
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...notification,
          severity,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * Generate notification ID
   */
  private static generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize notification service
NotificationService.initialize();
