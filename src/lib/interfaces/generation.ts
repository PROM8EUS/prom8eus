/**
 * AI generation-related interfaces for the expanded task detail view
 */

// Generation Request Interface
export interface GenerationRequest {
  subtaskId: string;
  language: 'de' | 'en';
  timeout: number;
  model?: string;
  context?: string;
}

// Generation Response Interface
export interface GenerationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    timestamp: number;
    model: string;
    language: 'de' | 'en';
    cacheKey: string;
    generationTime: number;
  };
}

// Generation Queue Interface
export interface GenerationQueueItem {
  id: string;
  request: GenerationRequest;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

// Generation Statistics Interface
export interface GenerationStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageGenerationTime: number;
  cacheHitRate: number;
  lastUpdated: number;
}

// Generation Configuration Interface
export interface GenerationConfig {
  defaultTimeout: number;
  maxRetries: number;
  cacheTTL: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  models: {
    primary: string;
    fallback: string;
    budget: string;
  };
}
