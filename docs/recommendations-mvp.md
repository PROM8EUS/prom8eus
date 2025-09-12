# Recommendations MVP - Design & Implementation

## Overview

The recommendations system provides intelligent workflow suggestions based on user tasks and subtasks. It uses a hybrid approach combining metadata filtering, semantic search, and LLM-powered reranking to deliver relevant, diverse results.

## Architecture

### Core Components

1. **Database Schema** (`workflow_features`, `workflow_embeddings`, `recommendation_cache`)
2. **Edge Functions**:
   - `index-workflows`: Normalizes and indexes workflow data with embeddings
   - `recommend-workflows`: Core recommendation engine
3. **Client Integration**: `src/lib/recommendations/client.ts`
4. **Configuration**: `src/lib/config.ts` with environment variables

### Data Flow

```
User Task + Subtasks → ProblemProfile → Hybrid Retrieval → Scoring → Diversification → Final Results
```

## API Reference

### `recommend-workflows` Edge Function

**Endpoint**: `POST /functions/v1/recommend-workflows`

**Input**:
```typescript
{
  taskText?: string;
  subtasks?: Array<{
    id?: string;
    name: string;
    keywords?: string[];
  }>;
  selectedApplications?: string[];
  flags?: {
    enableLLM?: boolean;
    topK?: number;
    llmTimeoutMs?: number;
  };
}
```

**Output**:
```typescript
{
  solutions: Array<{
    id: string;
    name: string;
    description: string;
    integrations: string[];
    authorName: string;
    authorAvatarUrl?: string;
    authorVerified: boolean;
    reason: string;
  }>;
  usedCache: boolean;
  latencyMs: number;
}
```

### `index-workflows` Edge Function

**Endpoint**: `POST /functions/v1/index-workflows`

**Input**:
```typescript
{
  sources?: string[]; // ["github", "n8n.io", "ai-enhanced"]
  batchSize?: number; // default: 800
}
```

**Output**:
```typescript
{
  updated: number; // features created/updated
  embedded: number; // embeddings generated
}
```

## Scoring Algorithm

### Heuristic Scoring (Primary)

```typescript
score = integrationOverlap * 0.5 + 
        niceToHaveOverlap * 0.2 + 
        triggerMatch * 0.2 + 
        lexicalMatch * 0.6 + 
        complexityFit * 0.2 + 
        qualityPrior * 0.1
```

**Components**:
- **Integration Overlap**: Must-have integrations (2x weight) + nice-to-have (1x weight)
- **Trigger Match**: Required trigger type alignment
- **Lexical Match**: Keyword overlap in name/description/tags
- **Complexity Fit**: Alignment with user's complexity preference
- **Quality Prior**: Author verification + official source indicators

### LLM Reranking (Optional)

When `enableLLM: true`:
1. Top 40 candidates sent to `gpt-4o-mini`
2. JSON response with scores 0-100
3. Scores merged with heuristic scores
4. Timeout fallback to heuristic-only

## Diversification Strategy

### Coverage-First + MMR (Maximal Marginal Relevance)

1. **Coverage**: Prioritize workflows covering different subtasks
2. **MMR**: Balance relevance with diversity
3. **Integration Diversity**: Downweight workflows sharing many integrations
4. **Final Selection**: Top 6 diverse, relevant workflows

## Configuration

### Environment Variables

```bash
# LLM Features
VITE_RECOMMENDATIONS_ENABLE_LLM=true
VITE_RECOMMENDATIONS_LLM_TIMEOUT_MS=5000

# Result Configuration
VITE_RECOMMENDATIONS_TOP_K=6

# Caching
VITE_RECOMMENDATIONS_ENABLE_CACHE=true
VITE_RECOMMENDATIONS_CACHE_TTL_MINUTES=60
```

### Client Configuration

```typescript
import { getRecommendationsConfig } from '@/lib/config';

const config = getRecommendationsConfig();
// { enableLLM: true, topK: 6, llmTimeoutMs: 5000, enableCache: true, cacheTTLMinutes: 60 }
```

## Performance & Observability

### Structured Logging

**`recommend-workflows`**:
```
[recommend-workflows] duration=245ms candidates=156 cache=true results=6
```

**`index-workflows`**:
```
[index-workflows] duration=1200ms workflows=2056 features=2056 embeddings=2056
```

### Performance Targets

- **Response Time**: <1.5s (warm cache)
- **Candidate Pool**: ≤600 workflows
- **Final Results**: 6 diverse workflows
- **Cache Hit Rate**: >80% for repeated queries

## Error Handling & Fallbacks

### Graceful Degradation

1. **No Workflows Found**: Return empty results with timing
2. **LLM Timeout**: Fall back to heuristic scoring
3. **Embedding Failure**: Continue without semantic search
4. **Database Errors**: Return cached results if available

### Error Response Format

```typescript
{
  error: string;
  // ... timing and context preserved
}
```

## Usage Examples

### Basic Recommendation

```typescript
import { recommendWorkflows } from '@/lib/recommendations/client';

const result = await recommendWorkflows({
  taskText: "Automate customer support",
  subtasks: [
    { name: "Process support tickets", keywords: ["ticket", "support"] },
    { name: "Send email notifications", keywords: ["email", "notification"] }
  ],
  selectedApplications: ["gmail", "slack"]
});
```

### Admin Indexing

```typescript
// Trigger workflow indexing
const response = await fetch('/functions/v1/index-workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sources: ["github", "n8n.io"] })
});
```

## Tuning Guidelines

### Improving Relevance

1. **Integration Mapping**: Update `normalizeIntegration()` synonyms
2. **Keyword Extraction**: Enhance `derivePreferredIntegrationsFromSubtasks()`
3. **Scoring Weights**: Adjust heuristic scoring coefficients
4. **LLM Prompts**: Refine reranking prompts for better alignment

### Improving Performance

1. **Batch Sizes**: Adjust `batchSize` for embedding generation
2. **Cache TTL**: Balance freshness vs. performance
3. **Candidate Pool**: Reduce from 600 if response time too high
4. **LLM Timeout**: Increase if reranking frequently times out

### Monitoring

1. **Log Analysis**: Monitor duration and candidate counts
2. **Cache Hit Rates**: Track recommendation cache effectiveness
3. **Error Rates**: Monitor LLM timeouts and database errors
4. **User Feedback**: Track which recommendations are actually used

## Future Enhancements

1. **A/B Testing**: Compare heuristic vs. LLM performance
2. **User Feedback Loop**: Learn from user selections
3. **Real-time Indexing**: Update embeddings as workflows change
4. **Multi-language Support**: Extend to non-English workflows
5. **Advanced Diversification**: Topic modeling for better coverage
