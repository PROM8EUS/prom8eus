-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create workflow_features table
CREATE TABLE IF NOT EXISTS public.workflow_features (
    source TEXT NOT NULL,
    workflow_id TEXT NOT NULL,
    integrations_norm TEXT[],
    triggers_norm TEXT[],
    complexity_band TEXT,
    author_verified BOOLEAN DEFAULT FALSE,
    rating FLOAT,
    quality_prior FLOAT DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (source, workflow_id)
);

-- Create workflow_embeddings table
CREATE TABLE IF NOT EXISTS public.workflow_embeddings (
    source TEXT NOT NULL,
    workflow_id TEXT NOT NULL,
    embedding vector(3072), -- text-embedding-3-large dimension
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (source, workflow_id)
);

-- Create recommendation_cache table
CREATE TABLE IF NOT EXISTS public.recommendation_cache (
    request_hash TEXT PRIMARY KEY,
    profile JSONB,
    results JSONB,
    ttl TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_features_integrations ON public.workflow_features USING GIN (integrations_norm);
CREATE INDEX IF NOT EXISTS idx_workflow_features_triggers ON public.workflow_features USING GIN (triggers_norm);
CREATE INDEX IF NOT EXISTS idx_workflow_features_complexity ON public.workflow_features (complexity_band);
CREATE INDEX IF NOT EXISTS idx_workflow_features_quality ON public.workflow_features (quality_prior);
CREATE INDEX IF NOT EXISTS idx_workflow_embeddings_source ON public.workflow_embeddings (source);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_ttl ON public.recommendation_cache (ttl);

-- Grant permissions
GRANT ALL ON public.workflow_features TO authenticated;
GRANT ALL ON public.workflow_embeddings TO authenticated;
GRANT ALL ON public.recommendation_cache TO authenticated;
GRANT ALL ON public.workflow_features TO anon;
GRANT ALL ON public.workflow_embeddings TO anon;
GRANT ALL ON public.recommendation_cache TO anon;


