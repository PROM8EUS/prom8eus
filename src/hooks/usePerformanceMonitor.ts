/**
 * Performance Monitoring Hook
 * Tracks component performance metrics and provides optimization insights
 */

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  mountTime: number;
  updateCount: number;
  lastUpdate: number;
  memoryUsage?: number;
}

interface PerformanceMonitorOptions {
  componentName: string;
  trackMemory?: boolean;
  logMetrics?: boolean;
  threshold?: number; // Warning threshold in ms
}

export function usePerformanceMonitor({
  componentName,
  trackMemory = false,
  logMetrics = false,
  threshold = 16 // 60fps threshold
}: PerformanceMonitorOptions) {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    mountTime: 0,
    updateCount: 0,
    lastUpdate: 0
  });

  const startTimeRef = useRef<number>(0);
  const mountTimeRef = useRef<number>(0);

  // Track component mount
  useEffect(() => {
    mountTimeRef.current = performance.now();
    metricsRef.current.mountTime = mountTimeRef.current;
    
    if (logMetrics) {
      console.log(`🚀 [Performance] ${componentName} mounted`);
    }

    return () => {
      const totalTime = performance.now() - mountTimeRef.current;
      if (logMetrics) {
        console.log(`🏁 [Performance] ${componentName} unmounted after ${totalTime.toFixed(2)}ms`);
      }
    };
  }, [componentName, logMetrics]);

  // Track render performance
  const trackRender = useCallback(() => {
    const now = performance.now();
    const renderTime = now - startTimeRef.current;
    
    metricsRef.current.renderTime = renderTime;
    metricsRef.current.updateCount += 1;
    metricsRef.current.lastUpdate = now;

    if (trackMemory && 'memory' in performance) {
      const memory = (performance as any).memory;
      metricsRef.current.memoryUsage = memory.usedJSHeapSize;
    }

    if (logMetrics) {
      const status = renderTime > threshold ? '⚠️' : '✅';
      console.log(`${status} [Performance] ${componentName} render: ${renderTime.toFixed(2)}ms (${metricsRef.current.updateCount} updates)`);
      
      if (trackMemory && metricsRef.current.memoryUsage) {
        console.log(`📊 [Memory] ${componentName}: ${(metricsRef.current.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }
    }

    if (renderTime > threshold) {
      console.warn(`🐌 [Performance Warning] ${componentName} render took ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
  }, [componentName, logMetrics, trackMemory, threshold]);

  // Start timing before render
  const startTiming = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderTime: 0,
      mountTime: 0,
      updateCount: 0,
      lastUpdate: 0
    };
  }, []);

  return {
    trackRender,
    startTiming,
    getMetrics,
    resetMetrics,
    metrics: metricsRef.current
  };
}

// Hook for tracking expensive operations
export function useOperationTimer(operationName: string, logResults = false) {
  const startTime = useRef<number>(0);

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    const duration = performance.now() - startTime.current;
    
    if (logResults) {
      console.log(`⏱️ [Operation] ${operationName}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }, [operationName, logResults]);

  return { start, end };
}

// Hook for debouncing expensive operations
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay, ...deps]
  );
}

// Hook for throttling expensive operations
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const lastCallRef = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delay, ...deps]
  );
}
