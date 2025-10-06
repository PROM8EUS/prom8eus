/**
 * Common Schema Definitions
 * 
 * Shared interfaces and types used across the application
 */

// Author information
export interface AuthorInfo {
  name: string;
  username: string;
  avatar?: string;
  verified: boolean;
  email?: string;
  bio?: string;
  website?: string;
  socialLinks?: Record<string, string>;
}

// Domain classification
export interface DomainClassification {
  primary: string;
  secondary: string[];
  confidence: number;
  origin: 'llm' | 'admin' | 'mixed';
  lastUpdated: string;
}

// Generation metadata
export interface GenerationMetadata {
  timestamp: number;
  model: string;
  language: 'de' | 'en';
  cacheKey: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  context?: string;
}