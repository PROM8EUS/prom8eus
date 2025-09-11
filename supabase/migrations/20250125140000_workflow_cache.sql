-- Create workflow_cache table for storing indexed n8n workflows
CREATE TABLE IF NOT EXISTS workflow_cache (
  id SERIAL PRIMARY KEY,
  version VARCHAR(10) NOT NULL UNIQUE,
  workflows JSONB NOT NULL,
  stats JSONB,
  last_fetch_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on version for fast lookups
CREATE INDEX IF NOT EXISTS idx_workflow_cache_version ON workflow_cache(version);

-- Create index on last_fetch_time for cache expiration checks
CREATE INDEX IF NOT EXISTS idx_workflow_cache_last_fetch ON workflow_cache(last_fetch_time);

-- Add RLS (Row Level Security) policies
ALTER TABLE workflow_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow read access to workflow cache" ON workflow_cache
  FOR SELECT USING (true);

-- Allow insert/update access to authenticated users (for cache refresh)
CREATE POLICY "Allow authenticated users to manage workflow cache" ON workflow_cache
  FOR ALL USING (auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflow_cache_updated_at 
  BEFORE UPDATE ON workflow_cache 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();




