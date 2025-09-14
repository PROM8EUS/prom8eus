/**
 * Security Utilities
 * Functions for password validation, hashing, and security checks
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-100
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 20;
  } else {
    score += 10;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 15;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 15;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 15;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 15;
  }

  // Common password check
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'admin123', 'root', 'toor', 'guest', 'user', 'test'
  ];
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password contains common words or patterns');
    score -= 20;
  }

  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
    score -= 10;
  }

  // Sequential numbers/letters check
  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    errors.push('Password should not contain sequential characters');
    score -= 10;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.max(0, Math.min(100, score))
  };
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Hash password using Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Check if password meets admin requirements
 */
export function validateAdminPassword(password: string): PasswordValidationResult {
  const result = validatePasswordStrength(password);
  
  // Additional admin-specific requirements
  if (password.length < 12) {
    result.errors.push('Admin password must be at least 12 characters long');
    result.isValid = false;
  }
  
  if (result.score < 80) {
    result.errors.push('Admin password must have a strength score of at least 80/100');
    result.isValid = false;
  }
  
  return result;
}

/**
 * Rate limiting for login attempts
 */
export class LoginRateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;
  private lockoutMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000, lockoutMs: number = 30 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs; // 15 minutes
    this.lockoutMs = lockoutMs; // 30 minutes
  }

  isBlocked(identifier: string): boolean {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return false;

    const now = Date.now();
    
    // Check if still in lockout period
    if (now - attempt.lastAttempt < this.lockoutMs) {
      return true;
    }
    
    // Reset if window has passed
    if (now - attempt.lastAttempt > this.windowMs) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return attempt.count >= this.maxAttempts;
  }

  recordAttempt(identifier: string): void {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (attempt) {
      // Reset if window has passed
      if (now - attempt.lastAttempt > this.windowMs) {
        this.attempts.set(identifier, { count: 1, lastAttempt: now });
      } else {
        this.attempts.set(identifier, { count: attempt.count + 1, lastAttempt: now });
      }
    } else {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
    }
  }

  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return this.maxAttempts;
    
    const now = Date.now();
    if (now - attempt.lastAttempt > this.windowMs) {
      return this.maxAttempts;
    }
    
    return Math.max(0, this.maxAttempts - attempt.count);
  }

  getLockoutTimeRemaining(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return 0;
    
    const now = Date.now();
    const timeSinceLastAttempt = now - attempt.lastAttempt;
    
    if (timeSinceLastAttempt < this.lockoutMs) {
      return this.lockoutMs - timeSinceLastAttempt;
    }
    
    return 0;
  }
}

/**
 * Session management utilities
 */
export class SessionManager {
  private static readonly SESSION_KEY = 'admin_session';
  private static readonly SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

  static createSession(): string {
    const sessionId = crypto.randomUUID();
    const sessionData = {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    return sessionId;
  }

  static isValidSession(): boolean {
    const sessionData = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return false;
    
    try {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      // Check if session has expired
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.clearSession();
        return false;
      }
      
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  static updateActivity(): void {
    const sessionData = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return;
    
    try {
      const session = JSON.parse(sessionData);
      session.lastActivity = Date.now();
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch {
      this.clearSession();
    }
  }

  static clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_login_time');
  }

  static getSessionInfo(): { id: string; createdAt: number; lastActivity: number } | null {
    const sessionData = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return null;
    
    try {
      return JSON.parse(sessionData);
    } catch {
      return null;
    }
  }
}
