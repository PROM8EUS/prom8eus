/**
 * Source Security and Compliance System
 * 
 * This module provides comprehensive security features including authentication,
 * authorization, encryption, audit trails, and compliance monitoring for all sources.
 */

import { performanceMetrics } from './performanceMetrics';

export interface SecurityConfig {
  enableAuthentication: boolean;
  enableAuthorization: boolean;
  enableEncryption: boolean;
  enableAuditLogging: boolean;
  enableRateLimiting: boolean;
  enableDDoSProtection: boolean;
  enableVulnerabilityScanning: boolean;
  enableComplianceMonitoring: boolean;
  encryptionAlgorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';
  keyRotationInterval: number; // days
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  auditRetentionDays: number;
  complianceStandards: string[];
}

export interface AuthenticationResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  user?: AuthenticatedUser;
  error?: string;
  requiresMFA?: boolean;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  lastLogin: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
  userPermissions?: string[];
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  eventType: 'login' | 'logout' | 'access_denied' | 'permission_granted' | 'permission_denied' | 'data_access' | 'data_modification' | 'security_violation';
  userId?: string;
  sourceId?: string;
  resource?: string;
  action?: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EncryptionKey {
  id: string;
  algorithm: string;
  keyData: string; // encrypted
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  version: number;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  sourceId?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'error';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface ComplianceReport {
  id: string;
  standard: string;
  timestamp: Date;
  status: 'compliant' | 'non_compliant' | 'partial';
  score: number; // 0-100
  findings: ComplianceFinding[];
  recommendations: string[];
  nextReviewDate: Date;
}

export interface ComplianceFinding {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  dueDate?: Date;
}

export interface RateLimitConfig {
  sourceId: string;
  maxRequests: number;
  windowMs: number;
  blockDuration: number; // ms
  enabled: boolean;
}

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: 'suspicious_activity' | 'failed_login' | 'rate_limit_exceeded' | 'unauthorized_access' | 'data_breach' | 'vulnerability_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceId?: string;
  userId?: string;
  description: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Security and Compliance Manager
 */
export class SecurityComplianceManager {
  private config: SecurityConfig;
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private activeSessions: Map<string, { user: AuthenticatedUser; expiresAt: Date }> = new Map();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private auditLogs: AuditLog[] = [];
  private complianceReports: ComplianceReport[] = [];
  private securityAlerts: SecurityAlert[] = [];
  private failedLoginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enableAuthentication: true,
      enableAuthorization: true,
      enableEncryption: true,
      enableAuditLogging: true,
      enableRateLimiting: true,
      enableDDoSProtection: true,
      enableVulnerabilityScanning: true,
      enableComplianceMonitoring: true,
      encryptionAlgorithm: 'AES-256-GCM',
      keyRotationInterval: 90,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      auditRetentionDays: 2555, // 7 years
      complianceStandards: ['GDPR', 'CCPA', 'SOC2', 'ISO27001'],
      ...config
    };

    this.initializeEncryptionKeys();
    this.startSecurityMonitoring();
  }

  /**
   * Authenticate user
   */
  async authenticate(credentials: { username: string; password: string; sourceId?: string }): Promise<AuthenticationResult> {
    const { username, password, sourceId } = credentials;
    
    // Check rate limiting
    if (this.isRateLimited(username)) {
      this.logSecurityEvent({
        eventType: 'access_denied',
        userId: username,
        sourceId,
        success: false,
        severity: 'medium',
        details: { reason: 'rate_limited' }
      });
      return { success: false, error: 'Too many login attempts. Please try again later.' };
    }

    // Check for account lockout
    if (this.isAccountLocked(username)) {
      this.logSecurityEvent({
        eventType: 'access_denied',
        userId: username,
        sourceId,
        success: false,
        severity: 'high',
        details: { reason: 'account_locked' }
      });
      return { success: false, error: 'Account is temporarily locked due to multiple failed login attempts.' };
    }

    try {
      // Validate credentials (in a real implementation, this would check against a secure user store)
      const user = await this.validateCredentials(username, password);
      
      if (user) {
        // Generate tokens
        const token = this.generateToken(user);
        const refreshToken = this.generateRefreshToken(user);
        const expiresAt = new Date(Date.now() + this.config.sessionTimeout * 60 * 1000);

        // Store session
        this.activeSessions.set(token, { user, expiresAt });

        // Reset failed login attempts
        this.failedLoginAttempts.delete(username);

        // Log successful authentication
        this.logSecurityEvent({
          eventType: 'login',
          userId: user.id,
          sourceId,
          success: true,
          severity: 'low',
          details: { username: user.username }
        });

        return {
          success: true,
          token,
          refreshToken,
          expiresAt,
          user
        };
      } else {
        // Record failed login attempt
        this.recordFailedLogin(username);
        
        this.logSecurityEvent({
          eventType: 'access_denied',
          userId: username,
          sourceId,
          success: false,
          severity: 'medium',
          details: { reason: 'invalid_credentials' }
        });

        return { success: false, error: 'Invalid username or password.' };
      }
    } catch (error) {
      this.logSecurityEvent({
        eventType: 'security_violation',
        userId: username,
        sourceId,
        success: false,
        severity: 'high',
        details: { error: (error as Error).message }
      });

      return { success: false, error: 'Authentication failed due to system error.' };
    }
  }

  /**
   * Authorize user action
   */
  async authorize(userId: string, action: string, resource: string, sourceId?: string): Promise<AuthorizationResult> {
    if (!this.config.enableAuthorization) {
      return { allowed: true };
    }

    try {
      const user = await this.getUserById(userId);
      if (!user) {
        this.logSecurityEvent({
          eventType: 'permission_denied',
          userId,
          sourceId,
          success: false,
          severity: 'medium',
          details: { reason: 'user_not_found', action, resource }
        });
        return { allowed: false, reason: 'User not found' };
      }

      const hasPermission = this.checkPermission(user, action, resource);
      
      if (hasPermission) {
        this.logSecurityEvent({
          eventType: 'permission_granted',
          userId,
          sourceId,
          success: true,
          severity: 'low',
          details: { action, resource }
        });
        return { allowed: true };
      } else {
        this.logSecurityEvent({
          eventType: 'permission_denied',
          userId,
          sourceId,
          success: false,
          severity: 'medium',
          details: { action, resource, userPermissions: user.permissions }
        });
        return { 
          allowed: false, 
          reason: 'Insufficient permissions',
          requiredPermissions: this.getRequiredPermissions(action, resource),
          userPermissions: user.permissions
        };
      }
    } catch (error) {
      this.logSecurityEvent({
        eventType: 'security_violation',
        userId,
        sourceId,
        success: false,
        severity: 'high',
        details: { error: (error as Error).message, action, resource }
      });
      return { allowed: false, reason: 'Authorization check failed' };
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string, sourceId?: string): Promise<string> {
    if (!this.config.enableEncryption) {
      return data;
    }

    try {
      const key = this.getActiveEncryptionKey();
      const encrypted = await this.performEncryption(data, key);
      
      this.logAuditEvent({
        action: 'encrypt_data',
        resource: 'sensitive_data',
        result: 'success',
        details: { sourceId, algorithm: this.config.encryptionAlgorithm }
      });

      return encrypted;
    } catch (error) {
      this.logAuditEvent({
        action: 'encrypt_data',
        resource: 'sensitive_data',
        result: 'error',
        details: { sourceId, error: (error as Error).message }
      });
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string, sourceId?: string): Promise<string> {
    if (!this.config.enableEncryption) {
      return encryptedData;
    }

    try {
      const key = this.getActiveEncryptionKey();
      const decrypted = await this.performDecryption(encryptedData, key);
      
      this.logAuditEvent({
        action: 'decrypt_data',
        resource: 'sensitive_data',
        result: 'success',
        details: { sourceId, algorithm: this.config.encryptionAlgorithm }
      });

      return decrypted;
    } catch (error) {
      this.logAuditEvent({
        action: 'decrypt_data',
        resource: 'sensitive_data',
        result: 'error',
        details: { sourceId, error: (error as Error).message }
      });
      throw error;
    }
  }

  /**
   * Check rate limiting
   */
  isRateLimited(identifier: string): boolean {
    if (!this.config.enableRateLimiting) {
      return false;
    }

    const now = Date.now();
    const limit = this.rateLimits.get(identifier);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(identifier, { count: 1, resetTime: now + 60000 }); // 1 minute window
      return false;
    }

    if (limit.count >= 10) { // 10 requests per minute
      return true;
    }

    limit.count++;
    return false;
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    this.securityEvents.push(securityEvent);

    // Check for security alerts
    this.checkSecurityAlerts(securityEvent);

    // Cleanup old events
    this.cleanupOldSecurityEvents();
  }

  /**
   * Log audit event
   */
  logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): void {
    if (!this.config.enableAuditLogging) {
      return;
    }

    const auditLog: AuditLog = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    this.auditLogs.push(auditLog);

    // Cleanup old audit logs
    this.cleanupOldAuditLogs();
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(standard: string): Promise<ComplianceReport> {
    const findings: ComplianceFinding[] = [];
    let score = 100;

    // Check authentication compliance
    if (!this.config.enableAuthentication) {
      findings.push({
        id: this.generateEventId(),
        category: 'Authentication',
        severity: 'critical',
        description: 'Authentication is disabled',
        recommendation: 'Enable authentication for all sources',
        status: 'open'
      });
      score -= 30;
    }

    // Check encryption compliance
    if (!this.config.enableEncryption) {
      findings.push({
        id: this.generateEventId(),
        category: 'Data Protection',
        severity: 'high',
        description: 'Data encryption is disabled',
        recommendation: 'Enable encryption for sensitive data',
        status: 'open'
      });
      score -= 25;
    }

    // Check audit logging compliance
    if (!this.config.enableAuditLogging) {
      findings.push({
        id: this.generateEventId(),
        category: 'Audit Trail',
        severity: 'high',
        description: 'Audit logging is disabled',
        recommendation: 'Enable comprehensive audit logging',
        status: 'open'
      });
      score -= 20;
    }

    // Check rate limiting compliance
    if (!this.config.enableRateLimiting) {
      findings.push({
        id: this.generateEventId(),
        category: 'Rate Limiting',
        severity: 'medium',
        description: 'Rate limiting is disabled',
        recommendation: 'Enable rate limiting to prevent abuse',
        status: 'open'
      });
      score -= 15;
    }

    // Check for security vulnerabilities
    const vulnerabilities = await this.scanForVulnerabilities();
    findings.push(...vulnerabilities);
    score -= vulnerabilities.length * 5;

    const report: ComplianceReport = {
      id: this.generateEventId(),
      standard,
      timestamp: new Date(),
      status: score >= 90 ? 'compliant' : score >= 70 ? 'partial' : 'non_compliant',
      score: Math.max(0, score),
      findings,
      recommendations: this.generateComplianceRecommendations(findings),
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    this.complianceReports.push(report);
    return report;
  }

  /**
   * Get security alerts
   */
  getSecurityAlerts(resolved?: boolean): SecurityAlert[] {
    if (resolved === undefined) {
      return this.securityAlerts;
    }
    return this.securityAlerts.filter(alert => alert.resolved === resolved);
  }

  /**
   * Resolve security alert
   */
  resolveSecurityAlert(alertId: string, resolvedBy: string): void {
    const alert = this.securityAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;
    }
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filters?: {
    userId?: string;
    sourceId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.sourceId) {
        logs = logs.filter(log => log.sourceId === filters.sourceId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        logs = logs.slice(-filters.limit);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.logAuditEvent({
      action: 'update_security_config',
      resource: 'security_configuration',
      result: 'success',
      details: { changes: newConfig }
    });
  }

  /**
   * Get current security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Private helper methods
   */
  private async validateCredentials(username: string, password: string): Promise<AuthenticatedUser | null> {
    // In a real implementation, this would validate against a secure user store
    // For demo purposes, we'll use a simple validation
    if (username === 'admin' && password === 'admin123') {
      return {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: ['*'],
        lastLogin: new Date(),
        isActive: true
      };
    }
    return null;
  }

  private generateToken(user: AuthenticatedUser): string {
    // In a real implementation, this would generate a JWT or similar secure token
    return `token_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRefreshToken(user: AuthenticatedUser): string {
    return `refresh_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getUserById(userId: string): Promise<AuthenticatedUser | null> {
    // In a real implementation, this would fetch from a user store
    for (const session of this.activeSessions.values()) {
      if (session.user.id === userId) {
        return session.user;
      }
    }
    return null;
  }

  private checkPermission(user: AuthenticatedUser, action: string, resource: string): boolean {
    // Simple permission check - in a real implementation, this would be more sophisticated
    if (user.permissions.includes('*')) {
      return true;
    }
    
    const requiredPermission = `${action}:${resource}`;
    return user.permissions.includes(requiredPermission);
  }

  private getRequiredPermissions(action: string, resource: string): string[] {
    return [`${action}:${resource}`];
  }

  private isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(identifier);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(identifier, { count: 1, resetTime: now + 60000 });
      return false;
    }

    if (limit.count >= 10) {
      return true;
    }

    limit.count++;
    return false;
  }

  private isAccountLocked(username: string): boolean {
    const attempts = this.failedLoginAttempts.get(username);
    if (!attempts) {
      return false;
    }

    if (attempts.count >= this.config.maxLoginAttempts) {
      const lockoutExpiry = new Date(attempts.lastAttempt.getTime() + this.config.lockoutDuration * 60 * 1000);
      return new Date() < lockoutExpiry;
    }

    return false;
  }

  private recordFailedLogin(username: string): void {
    const attempts = this.failedLoginAttempts.get(username) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();
    this.failedLoginAttempts.set(username, attempts);
  }

  private async performEncryption(data: string, key: EncryptionKey): Promise<string> {
    // In a real implementation, this would use proper encryption
    // For demo purposes, we'll use base64 encoding
    return Buffer.from(data).toString('base64');
  }

  private async performDecryption(encryptedData: string, key: EncryptionKey): Promise<string> {
    // In a real implementation, this would use proper decryption
    // For demo purposes, we'll use base64 decoding
    return Buffer.from(encryptedData, 'base64').toString();
  }

  private getActiveEncryptionKey(): EncryptionKey {
    for (const key of this.encryptionKeys.values()) {
      if (key.isActive) {
        return key;
      }
    }
    throw new Error('No active encryption key found');
  }

  private initializeEncryptionKeys(): void {
    const key: EncryptionKey = {
      id: this.generateEventId(),
      algorithm: this.config.encryptionAlgorithm,
      keyData: 'demo_key_data',
      createdAt: new Date(),
      isActive: true,
      version: 1
    };
    this.encryptionKeys.set(key.id, key);
  }

  private checkSecurityAlerts(event: SecurityEvent): void {
    // Check for suspicious patterns
    if (event.eventType === 'access_denied' && event.severity === 'high') {
      this.createSecurityAlert({
        type: 'unauthorized_access',
        severity: 'high',
        sourceId: event.sourceId,
        userId: event.userId,
        description: 'Multiple unauthorized access attempts detected',
        details: { event }
      });
    }

    if (event.eventType === 'security_violation') {
      this.createSecurityAlert({
        type: 'suspicious_activity',
        severity: event.severity,
        sourceId: event.sourceId,
        userId: event.userId,
        description: 'Security violation detected',
        details: { event }
      });
    }
  }

  private createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const securityAlert: SecurityAlert = {
      id: this.generateEventId(),
      timestamp: new Date(),
      resolved: false,
      ...alert
    };

    this.securityAlerts.push(securityAlert);
  }

  private async scanForVulnerabilities(): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Check for weak encryption
    if (this.config.encryptionAlgorithm === 'AES-256-CBC') {
      findings.push({
        id: this.generateEventId(),
        category: 'Encryption',
        severity: 'medium',
        description: 'Using CBC mode encryption which is less secure than GCM',
        recommendation: 'Switch to AES-256-GCM for better security',
        status: 'open'
      });
    }

    // Check for weak session timeout
    if (this.config.sessionTimeout > 120) {
      findings.push({
        id: this.generateEventId(),
        category: 'Session Management',
        severity: 'medium',
        description: 'Session timeout is too long',
        recommendation: 'Reduce session timeout to 60 minutes or less',
        status: 'open'
      });
    }

    return findings;
  }

  private generateComplianceRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations: string[] = [];

    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');

    if (criticalFindings.length > 0) {
      recommendations.push('Address all critical security findings immediately');
    }

    if (highFindings.length > 0) {
      recommendations.push('Prioritize resolution of high-severity security issues');
    }

    if (findings.length > 0) {
      recommendations.push('Implement regular security assessments and monitoring');
      recommendations.push('Establish incident response procedures');
    }

    return recommendations;
  }

  private cleanupOldSecurityEvents(): void {
    const cutoffDate = new Date(Date.now() - this.config.auditRetentionDays * 24 * 60 * 60 * 1000);
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > cutoffDate);
  }

  private cleanupOldAuditLogs(): void {
    const cutoffDate = new Date(Date.now() - this.config.auditRetentionDays * 24 * 60 * 60 * 1000);
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoffDate);
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startSecurityMonitoring(): void {
    // Start background security monitoring
    setInterval(() => {
      this.performSecurityChecks();
    }, 60000); // Check every minute
  }

  private performSecurityChecks(): void {
    // Check for expired sessions
    const now = new Date();
    for (const [token, session] of this.activeSessions) {
      if (now > session.expiresAt) {
        this.activeSessions.delete(token);
        this.logSecurityEvent({
          eventType: 'logout',
          userId: session.user.id,
          success: true,
          severity: 'low',
          details: { reason: 'session_expired' }
        });
      }
    }

    // Check for rate limit resets
    const rateLimitResetTime = Date.now();
    for (const [identifier, limit] of this.rateLimits) {
      if (rateLimitResetTime > limit.resetTime) {
        this.rateLimits.delete(identifier);
      }
    }
  }
}

// Export singleton instance
export const securityCompliance = new SecurityComplianceManager();
