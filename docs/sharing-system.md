# Cross-User Sharing System

## Overview

The PROM8EUS application now supports cross-user sharing of analyses. Users can share their automation analysis results with others via URLs that work across different devices and browsers.

## How It Works

### 1. Server-Side Storage
- Analysis data is stored in a Supabase database table (`shared_analyses`)
- Each shared analysis gets a unique ID that's included in the share URL
- Data includes the complete original text (no 500 character truncation)
- Analyses expire after 30 days and are automatically cleaned up

### 2. Share URL Format
```
https://prom8eus.com/results?share=analysis_1234567890_abc123&lang=de
```

### 3. Fallback System
- Primary: Server-side storage via Supabase
- Fallback: localStorage (for offline scenarios or server issues)
- Session-based: sessionStorage (for temporary sharing within the same browser session)

## Database Schema

### `shared_analyses` Table
```sql
CREATE TABLE public.shared_analyses (
  id UUID PRIMARY KEY,
  share_id TEXT UNIQUE,
  analysis_data JSONB,
  original_text TEXT,
  job_title TEXT,
  total_score INTEGER,
  task_count INTEGER,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  views INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true
);
```

## API Endpoints

### Supabase Edge Function: `shared-analysis`

#### Store Analysis
```javascript
POST /functions/v1/shared-analysis
{
  "action": "store",
  "shareId": "analysis_1234567890_abc123",
  "analysisData": { /* full analysis result */ },
  "originalText": "Complete original input text...",
  "jobTitle": "Buchhalter (m/w/d)",
  "totalScore": 75,
  "taskCount": 5
}
```

#### Retrieve Analysis
```javascript
POST /functions/v1/shared-analysis
{
  "action": "get",
  "shareId": "analysis_1234567890_abc123"
}
```

## Client-Side Implementation

### SharedAnalysisService
```typescript
import { SharedAnalysisService } from '@/lib/sharedAnalysis';

// Generate share URL
const shareUrl = await SharedAnalysisService.storeAnalysis({
  shareId: 'analysis_1234567890_abc123',
  analysisData: analysisResult,
  originalText: 'Complete original text...',
  jobTitle: 'Job Title',
  totalScore: 75,
  taskCount: 5
});

// Retrieve shared analysis
const result = await SharedAnalysisService.getAnalysis(shareId);
```

## Key Features

### ✅ Cross-User Sharing
- Share URLs work across different devices and browsers
- No dependency on localStorage or sessionStorage
- Works for users who don't have the analysis locally

### ✅ Full Text Preservation
- Complete original input text is preserved (no 500 character limit)
- All analysis data is stored in full detail
- Job titles and metadata are extracted and stored

### ✅ Automatic Cleanup
- Analyses expire after 30 days
- Automatic cleanup of expired entries
- View count tracking for analytics

### ✅ Error Handling
- Graceful fallback to localStorage if server is unavailable
- Clear error messages when shared analysis is not found
- Automatic redirect to home page for expired/invalid links

### ✅ Security
- Row Level Security (RLS) enabled
- Public read access for shared analyses
- No sensitive data exposure

## Usage Examples

### Sharing an Analysis
1. User performs analysis
2. Clicks "Share" button
3. System generates unique share ID
4. Analysis data is stored on server
5. Share URL is generated and copied to clipboard

### Opening a Shared Analysis
1. User clicks shared URL
2. System attempts to load from server
3. If found, displays complete analysis with full original text
4. If not found, shows error message and redirects to home

## Migration from Local Storage

The system maintains backward compatibility:
- Old localStorage-based shares still work
- New shares use server-side storage
- Automatic fallback ensures no data loss

## Deployment

### Database Migration
```bash
npx supabase db push
```

### Edge Function Deployment
```bash
npx supabase functions deploy shared-analysis
```

## Monitoring

### View Counts
- Each time a shared analysis is viewed, the view count increments
- Useful for analytics and identifying popular analyses

### Expiration
- Analyses automatically expire after 30 days
- Cleanup function removes expired entries
- Users see clear message when analysis has expired

## Future Enhancements

- [ ] Public analysis gallery
- [ ] Social sharing buttons
- [ ] Analysis comments/feedback
- [ ] Custom expiration dates
- [ ] Private sharing with passwords
- [ ] Analytics dashboard for shared analyses
