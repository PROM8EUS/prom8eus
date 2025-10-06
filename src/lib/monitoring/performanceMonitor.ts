/**
 * Performance Monitoring System
 * 
 * Comprehensive monitoring for refactored paths covering analysis and marketplace flows
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface PerformanceEvent {
  id: string;
  type: 'start' | 'end' | 'error' | 'custom';
  name: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

export interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number; // 0.0 to 1.0
  maxEvents: number;
  flushInterval: number; // milliseconds
  endpoint?: string;
  debug: boolean;
}

export class PerformanceMonitor {
  private config: MonitoringConfig;
  private events: PerformanceEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private isFlushing = false;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      maxEvents: 1000,
      flushInterval: 30000, // 30 seconds
      debug: false,
      ...config
    };

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string, tags?: Record<string, string>): void {
    if (!this.shouldSample()) return;

    const timerId = this.generateTimerId(name, tags);
    this.timers.set(timerId, performance.now());
    
    this.addEvent({
      id: crypto.randomUUID(),
      type: 'start',
      name,
      timestamp: Date.now(),
      tags
    });
  }

  /**
   * End timing an operation
   */
  endTimer(name: string, tags?: Record<string, string>, metadata?: Record<string, any>): void {
    if (!this.shouldSample()) return;

    const timerId = this.generateTimerId(name, tags);
    const startTime = this.timers.get(timerId);
    
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.timers.delete(timerId);
      
      this.addEvent({
        id: crypto.randomUUID(),
        type: 'end',
        name,
        timestamp: Date.now(),
        duration,
        tags,
        metadata
      });

      // Add performance metric
      this.addMetric({
        name: `${name}_duration`,
        value: duration,
        unit: 'milliseconds',
        timestamp: Date.now(),
        tags,
        metadata
      });
    }
  }

  /**
   * Record a custom event
   */
  recordEvent(name: string, metadata?: Record<string, any>, tags?: Record<string, string>): void {
    if (!this.shouldSample()) return;

    this.addEvent({
      id: crypto.randomUUID(),
      type: 'custom',
      name,
      timestamp: Date.now(),
      metadata,
      tags
    });
  }

  /**
   * Record an error event
   */
  recordError(name: string, error: Error, metadata?: Record<string, any>, tags?: Record<string, string>): void {
    if (!this.shouldSample()) return;

    this.addEvent({
      id: crypto.randomUUID(),
      type: 'error',
      name,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      },
      tags
    });

    // Add error metric
    this.addMetric({
      name: `${name}_error`,
      value: 1,
      unit: 'count',
      timestamp: Date.now(),
      tags,
      metadata
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.shouldSample()) return;

    this.addMetric({
      ...metric,
      timestamp: Date.now()
    });
  }

  /**
   * Get current performance statistics
   */
  getStats(): {
    totalEvents: number;
    totalMetrics: number;
    activeTimers: number;
    memoryUsage: number;
  } {
    return {
      totalEvents: this.events.length,
      totalMetrics: this.metrics.length,
      activeTimers: this.timers.size,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get events by type
   */
  getEvents(type?: string, limit?: number): PerformanceEvent[] {
    let filteredEvents = this.events;
    
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }
    
    if (limit) {
      filteredEvents = filteredEvents.slice(-limit);
    }
    
    return filteredEvents;
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string, limit?: number): PerformanceMetric[] {
    let filteredMetrics = this.metrics;
    
    if (name) {
      filteredMetrics = filteredMetrics.filter(metric => metric.name === name);
    }
    
    if (limit) {
      filteredMetrics = filteredMetrics.slice(-limit);
    }
    
    return filteredMetrics;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.events = [];
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Flush data to external service
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.events.length === 0) return;

    this.isFlushing = true;

    try {
      const payload = {
        events: this.events,
        metrics: this.metrics,
        timestamp: Date.now(),
        sessionId: this.getSessionId()
      };

      if (this.config.endpoint) {
        await this.sendToEndpoint(payload);
      } else {
        // Log to console in development
        if (this.config.debug) {
          console.log('Performance Monitor Data:', payload);
        }
      }

      // Clear sent data
      this.events = [];
      this.metrics = [];
    } catch (error) {
      console.error('Failed to flush performance data:', error);
    } finally {
      this.isFlushing = false;
    }
  }

  private addEvent(event: PerformanceEvent): void {
    this.events.push(event);
    
    // Keep only the most recent events
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.config.maxEvents) {
      this.metrics = this.metrics.slice(-this.config.maxEvents);
    }
  }

  private shouldSample(): boolean {
    return this.config.enabled && Math.random() < this.config.sampleRate;
  }

  private generateTimerId(name: string, tags?: Record<string, string>): string {
    const tagString = tags ? JSON.stringify(tags) : '';
    return `${name}:${tagString}`;
  }

  private startFlushTimer(): void {
    setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }

  private async sendToEndpoint(payload: any): Promise<void> {
    const response = await fetch(this.config.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to send monitoring data: ${response.status}`);
    }
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor({
  enabled: import.meta.env.PROD || import.meta.env.VITE_ENABLE_MONITORING === 'true',
  sampleRate: import.meta.env.VITE_MONITORING_SAMPLE_RATE ? parseFloat(import.meta.env.VITE_MONITORING_SAMPLE_RATE) : 1.0,
  debug: import.meta.env.DEV,
  endpoint: import.meta.env.VITE_MONITORING_ENDPOINT
});

// Convenience functions
export const startTimer = (name: string, tags?: Record<string, string>) => 
  performanceMonitor.startTimer(name, tags);

export const endTimer = (name: string, tags?: Record<string, string>, metadata?: Record<string, any>) => 
  performanceMonitor.endTimer(name, tags, metadata);

export const recordEvent = (name: string, metadata?: Record<string, any>, tags?: Record<string, string>) => 
  performanceMonitor.recordEvent(name, metadata, tags);

export const recordError = (name: string, error: Error, metadata?: Record<string, any>, tags?: Record<string, string>) => 
  performanceMonitor.recordError(name, error, metadata, tags);

export const recordMetric = (metric: Omit<PerformanceMetric, 'timestamp'>) => 
  performanceMonitor.recordMetric(metric);
