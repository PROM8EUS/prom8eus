/**
 * Re-exports for all interface modules
 */

// Solution interfaces
export * from './solutions';

// Generation interfaces
export * from './generation';

// UI interfaces
export * from './ui';

// Re-export shared types for convenience
export {
  SolutionStatus,
  GenerationMetadata,
  WorkflowSolution,
  AgentSolution,
  LLMSolution,
  BadgeStatus,
  StatusBadgeProps,
  GenerationContext,
  CacheEntry,
  ErrorContext,
  DynamicSubtask,
  FastAnalysisResult
} from '../types';
