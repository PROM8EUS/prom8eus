-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create workflow_features table (if not exists)
CREATE TABLE IF NOT EXISTS public.workflow_features (
  workflow_id TEXT NOT NULL,
  source TEXT NOT NULL,
  integrations_norm TEXT[] NOT NULL DEFAULT '{}',
  triggers_norm TEXT[] NOT NULL DEFAULT '{}',
  complexity_band TEXT CHECK (complexity_band IN ('low','medium','high')),
  author_verified BOOLEAN NOT NULL DEFAULT false,
  rating DOUBLE PRECISION,
  quality_prior DOUBLE PRECISION NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workflow_features_pkey PRIMARY KEY (source, workflow_id)
);

-- Create workflow_embeddings table (if not exists)
CREATE TABLE IF NOT EXISTS public.workflow_embeddings (
  workflow_id TEXT NOT NULL,
  source TEXT NOT NULL,
  embedding vector(3072) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workflow_embeddings_pkey PRIMARY KEY (source, workflow_id)
);

-- Create recommendation_cache table (if not exists)
CREATE TABLE IF NOT EXISTS public.recommendation_cache (
  request_hash TEXT PRIMARY KEY,
  profile JSONB NOT NULL,
  results JSONB NOT NULL,
  ttl TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for workflow_features
CREATE INDEX IF NOT EXISTS idx_workflow_features_integrations ON public.workflow_features USING GIN (integrations_norm);
CREATE INDEX IF NOT EXISTS idx_workflow_features_triggers ON public.workflow_features USING GIN (triggers_norm);
CREATE INDEX IF NOT EXISTS idx_workflow_features_complexity ON public.workflow_features (complexity_band);
CREATE INDEX IF NOT EXISTS idx_workflow_features_quality ON public.workflow_features (quality_prior);

-- Create indexes for workflow_embeddings
CREATE INDEX IF NOT EXISTS idx_workflow_embeddings_source ON public.workflow_embeddings (source);

-- Create indexes for recommendation_cache
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_ttl ON public.recommendation_cache (ttl);

-- Enable Row Level Security
ALTER TABLE public.workflow_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workflow_features
DROP POLICY IF EXISTS "Allow read access to workflow features" ON public.workflow_features;
CREATE POLICY "Allow read access to workflow features" ON public.workflow_features
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage workflow features" ON public.workflow_features;
CREATE POLICY "Allow authenticated users to manage workflow features" ON public.workflow_features
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for workflow_embeddings
DROP POLICY IF EXISTS "Allow read access to workflow embeddings" ON public.workflow_embeddings;
CREATE POLICY "Allow read access to workflow embeddings" ON public.workflow_embeddings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage workflow embeddings" ON public.workflow_embeddings;
CREATE POLICY "Allow authenticated users to manage workflow embeddings" ON public.workflow_embeddings
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for recommendation_cache
DROP POLICY IF EXISTS "Allow read access to recommendation cache" ON public.recommendation_cache;
CREATE POLICY "Allow read access to recommendation cache" ON public.recommendation_cache
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage recommendation cache" ON public.recommendation_cache;
CREATE POLICY "Allow authenticated users to manage recommendation cache" ON public.recommendation_cache
  FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for workflow_features
DROP TRIGGER IF EXISTS update_workflow_features_updated_at ON public.workflow_features;
CREATE TRIGGER update_workflow_features_updated_at 
  BEFORE UPDATE ON public.workflow_features 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for workflow_embeddings
DROP TRIGGER IF EXISTS update_workflow_embeddings_updated_at ON public.workflow_embeddings;
CREATE TRIGGER update_workflow_embeddings_updated_at 
  BEFORE UPDATE ON public.workflow_embeddings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();


