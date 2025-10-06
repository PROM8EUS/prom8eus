/**
 * Common Schema Definitions
 * 
 * Shared interfaces and types used across the application
 */

// Base metadata interface
export interface BaseMetadata {
  // Core identification
  id: string;
  name: string;
  description: string;
  version: string;
  
  // Source information
  source: string;
  sourceType: 'github' | 'n8n' | 'zapier' | 'make' | 'manual' | 'api' | 'ai-generated';
  sourceUrl: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastModified: string;
  
  // Status and availability
  status: 'active' | 'inactive' | 'deprecated' | 'draft';
  isPublic: boolean;
  isVerified: boolean;
  
  // Categorization
  category: string;
  subcategory?: string;
  tags: string[];
  
  // Quality metrics
  qualityScore: number; // 0-100
  completeness: number; // 0-100
  accuracy: number; // 0-100
  freshness: number; // 0-100
  
  // Usage statistics
  viewCount: number;
  downloadCount: number;
  usageCount: number;
  rating?: number; // 0-5
  
  // Schema versioning
  schemaVersion: string;
  metadataVersion: string;
}

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

// Workflow scoring
export interface WorkflowScore {
  overall: number;
  complexity: number;
  popularity: number;
  reliability: number;
  maintainability?: number;
  scalability?: number;
}

// Workflow matching
export interface WorkflowMatch {
  relevance: number;
  compatibility: number;
  effort: number;
  cost: number;
  timeToImplement?: number;
  riskLevel?: 'low' | 'medium' | 'high';
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

// Validation rules
export interface ValidationRule {
  field: string;
  type: 'required' | 'optional' | 'conditional';
  validator: string;
  message: string;
  condition?: string;
}

// Validation context
export interface ValidationContext {
  source: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  userRole?: string;
}

// Source configuration
export interface SourceConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  credentials?: Record<string, any>;
  settings?: Record<string, any>;
  lastUpdated: string;
  version: string;
}

// Source type definition
export interface SourceType {
  id: string;
  name: string;
  description: string;
  category: 'workflow' | 'ai_agent' | 'tool' | 'api' | 'database' | 'file';
  requiredFields: string[];
  optionalFields: string[];
  validationRules: ValidationRule[];
  defaultConfig: Partial<SourceConfig>;
  supportedOperations: string[];
  icon?: string;
  documentation?: string;
}

// Cache entry
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  compressed?: boolean;
  size: number;
}

// Cache configuration
export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  compressionEnabled: boolean;
  dynamicTTL: boolean;
  accessBasedTTL: boolean;
  sourceSpecificTTL: Record<string, number>;
}

// Cache statistics
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  averageAccessTime: number;
  compressionRatio: number;
  evictions: number;
  entryCount: number;
  totalEntries: number;
  totalSize: number;
  lastUpdated: Date | null;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
  version: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search parameters
export interface SearchParams {
  query?: string;
  category?: string;
  source?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  pagination?: PaginationParams;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

// File upload
export interface FileUpload {
  id: string;
  filename: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  metadata?: Record<string, any>;
}

// Analytics
export interface AnalyticsEvent {
  id: string;
  event: string;
  properties: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

// Health check
export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}
