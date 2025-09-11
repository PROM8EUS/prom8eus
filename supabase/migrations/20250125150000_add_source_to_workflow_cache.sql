-- Add source column to workflow_cache table for per-source caching
ALTER TABLE workflow_cache ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'all';

-- Create index on source for fast lookups
CREATE INDEX IF NOT EXISTS idx_workflow_cache_source ON workflow_cache(source);

-- Update existing records to have 'all' as source
UPDATE workflow_cache SET source = 'all' WHERE source IS NULL;
