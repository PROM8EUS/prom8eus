/**
 * Security Hook
 * Provides security-related functionality for admin authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { SessionManager } from '@/lib/securityUtils';

export interface SecurityState {
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionInfo: { id: string; createdAt: number; lastActivity: number } | null;
}

export function useSecurity() {
  const [securityState, setSecurityState] = useState<SecurityState>({
    isAuthenticated: false,
    isLoading: true,
    sessionInfo: null
  });

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
      const sessionValid = SessionManager.isValidSession();
      const sessionInfo = SessionManager.getSessionInfo();
      
      setSecurityState({
        isAuthenticated: isAuth && sessionValid,
        isLoading: false,
        sessionInfo
      });
    };

    checkAuth();
    
    // Check session validity every minute
    const interval = setInterval(() => {
      const sessionValid = SessionManager.isValidSession();
      if (!sessionValid && securityState.isAuthenticated) {
        // Session expired, logout
        handleLogout();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [securityState.isAuthenticated]);

  // Update activity on user interaction
  useEffect(() => {
    const updateActivity = () => {
      if (securityState.isAuthenticated) {
        SessionManager.updateActivity();
      }
    };

    // Update activity on user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [securityState.isAuthenticated]);

  const handleLogout = useCallback(() => {
    // Clear all session data
    SessionManager.clearSession();
    
    // Clear any other admin-related data
    sessionStorage.removeItem('admin_dashboard_data');
    sessionStorage.removeItem('admin_preferences');
    
    // Log logout event
    console.log('Admin logout:', {
      timestamp: new Date().toISOString(),
      sessionId: securityState.sessionInfo?.id
    });
    
    setSecurityState({
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    });
    
    // Redirect to login or home page
    window.location.href = '/';
  }, [securityState.sessionInfo?.id]);

  const refreshSession = useCallback(() => {
    if (securityState.isAuthenticated) {
      SessionManager.updateActivity();
      const sessionInfo = SessionManager.getSessionInfo();
      setSecurityState(prev => ({
        ...prev,
        sessionInfo
      }));
    }
  }, [securityState.isAuthenticated]);

  const getSessionTimeRemaining = useCallback(() => {
    if (!securityState.sessionInfo) return 0;
    
    const now = Date.now();
    const lastActivity = securityState.sessionInfo.lastActivity;
    const sessionTimeout = 2 * 60 * 60 * 1000; // 2 hours
    
    return Math.max(0, sessionTimeout - (now - lastActivity));
  }, [securityState.sessionInfo]);

  const formatTimeRemaining = useCallback((milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }, []);

  return {
    ...securityState,
    logout: handleLogout,
    refreshSession,
    getSessionTimeRemaining,
    formatTimeRemaining
  };
}

/**
 * Admin Activity Logger
 * Logs admin activities for security monitoring
 */
export class AdminActivityLogger {
  private static readonly ACTIVITY_KEY = 'admin_activities';
  private static readonly MAX_ACTIVITIES = 100;

  static logActivity(activity: string, details?: Record<string, unknown>) {
    const activities = this.getActivities();
    const newActivity = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      activity,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    activities.unshift(newActivity);
    
    // Keep only the most recent activities
    if (activities.length > this.MAX_ACTIVITIES) {
      activities.splice(this.MAX_ACTIVITIES);
    }

    sessionStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(activities));
    
    // Also log to console for development
    console.log('Admin Activity:', newActivity);
  }

  static getActivities() {
    try {
      const activities = sessionStorage.getItem(this.ACTIVITY_KEY);
      return activities ? JSON.parse(activities) : [];
    } catch {
      return [];
    }
  }

  static clearActivities() {
    sessionStorage.removeItem(this.ACTIVITY_KEY);
  }

  static getRecentActivities(limit: number = 10) {
    const activities = this.getActivities();
    return activities.slice(0, limit);
  }
}

/**
 * Security Event Types
 */
export const SecurityEvents = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  SESSION_EXPIRED: 'session_expired',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  ADMIN_ACTION: 'admin_action',
  CONFIGURATION_CHANGE: 'configuration_change',
  DATA_EXPORT: 'data_export',
  DATA_IMPORT: 'data_import'
} as const;

export type SecurityEventType = typeof SecurityEvents[keyof typeof SecurityEvents];
