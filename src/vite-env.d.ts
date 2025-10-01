/// <reference types="vite/client" />

// Global debouncing state for AI calls
declare global {
  interface Window {
    subtaskGenerationInProgress?: Set<string>;
    businessCaseGenerationInProgress?: Set<string>;
    sharedAnalysisInProgress?: Set<string>;
  }
}
