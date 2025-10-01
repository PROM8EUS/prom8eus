# Task List: Fix OpenAI Client Consolidation

## Relevant Files

- `src/lib/openai.ts` - Main OpenAI client that needs to be replaced with secure implementation
- `src/lib/openai-secure.ts` - ~~Temporary secure client to be removed after merging~~ ✅ REMOVED
- `src/components/BusinessCase.tsx` - Uses openaiClient for business case calculations
- `src/lib/runAnalysis.ts` - Uses openaiClient for job analysis
- `src/lib/aiAnalysis.ts` - Uses openaiClient for AI analysis functions
- `src/lib/workflowIndexer.ts` - Uses openaiClient for workflow indexing
- `src/lib/solutions/stepExtraction.ts` - Uses openaiClient for step extraction
- `src/lib/solutions/enrichmentService.ts` - Uses openaiClient for enrichment
- `src/components/TaskPanel.tsx` - Uses isOpenAIAvailable function
- `src/components/TaskList.tsx` - Uses isOpenAIAvailable function
- `src/components/AITestModal.tsx` - Uses isOpenAIAvailable function
- `src/lib/workflow-test.ts` - Uses openaiClient for testing
- `src/lib/workflow-examples.ts` - Uses openaiClient for examples

### Notes

- All OpenAI API calls should go through the secure backend Edge Function
- Maintain the same interface and exports to avoid breaking existing code
- Follow cursor rules: iterate on existing code, avoid duplication
- Unit tests should be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests

## Tasks

- [x] 1.0 Replace existing openai.ts with secure backend implementation
  - [x] 1.1 Copy secure implementation from openai-secure.ts to openai.ts
  - [x] 1.2 Maintain same exports (OpenAIClient, openaiClient, isOpenAIAvailable, testOpenAIConnection)
  - [x] 1.3 Ensure all methods work with secure backend proxy
  - [x] 1.4 Remove placeholder 'secure-backend' value and constructor error
  - [x] 1.5 Update class name from SecureOpenAIClient to OpenAIClient
  - [x] 1.6 Ensure all existing method signatures remain compatible

- [x] 2.0 Update all import statements to use single openai.ts
  - [x] 2.1 Update BusinessCase.tsx import to use openai instead of openai-secure
  - [x] 2.2 Update runAnalysis.ts import to use openai instead of openai-secure
  - [x] 2.3 Update aiAnalysis.ts import to use openai instead of openai-secure
  - [x] 2.4 Verify all other files already use correct openai import
  - [x] 2.5 Check for any remaining references to 'openai-secure' in imports

- [x] 3.0 Remove duplicate openai-secure.ts file
  - [x] 3.1 Delete openai-secure.ts file completely
  - [x] 3.2 Verify no remaining references to openai-secure anywhere
  - [x] 3.3 Clean up any temporary files or backup files

- [x] 4.0 Test and verify functionality
  - [x] 4.1 Build application successfully without errors
  - [x] 4.2 Test Business Case calculation works with real API key
  - [x] 4.3 Test AI analysis features work correctly
  - [x] 4.4 Test isOpenAIAvailable function returns correct status
  - [x] 4.5 Verify no API key exposure in production build
  - [x] 4.6 Test all components that import from openai.ts

- [x] 5.0 Verify security compliance
  - [x] 5.1 Confirm no hardcoded API keys in openai.ts
  - [x] 5.2 Verify all API calls go through secure backend proxy
  - [x] 5.3 Check that Edge Function has correct API key configuration
  - [x] 5.4 Validate that frontend cannot access API key directly
