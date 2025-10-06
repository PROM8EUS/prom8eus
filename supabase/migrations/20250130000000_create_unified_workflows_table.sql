-- Create unified_workflows table
-- This table stores all workflow types in a unified schema

-- Create enum types for better type safety
CREATE TYPE complexity_type AS ENUM ('Low', 'Medium', 'High', 'Easy', 'Hard');
CREATE TYPE trigger_type AS ENUM ('Manual', 'Webhook', 'Scheduled', 'Complex');
CREATE TYPE solution_status AS ENUM ('generated', 'verified', 'fallback', 'loading');
CREATE TYPE source_type AS ENUM ('github', 'n8n.io', 'ai-generated', 'manual', 'api');
CREATE TYPE validation_status AS ENUM ('valid', 'invalid', 'pending');
CREATE TYPE domain_origin AS ENUM ('llm', 'admin', 'mixed');

-- Create the main unified_workflows table
CREATE TABLE unified_workflows (
  -- Core identification
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  summary TEXT,
  
  -- Source & metadata
  source source_type NOT NULL,
  source_url TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  license TEXT DEFAULT 'Unknown',
  
  -- Workflow specifications
  complexity complexity_type NOT NULL,
  trigger_type trigger_type NOT NULL,
  integrations TEXT[] DEFAULT '{}',
  node_count INTEGER,
  connection_count INTEGER,
  
  -- Technical details
  n8n_workflow JSONB,
  json_url TEXT,
  workflow_data JSONB,
  
  -- Author & creation
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  author_verified BOOLEAN DEFAULT FALSE,
  author_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version TEXT DEFAULT '1.0.0',
  
  -- Status & validation
  status solution_status NOT NULL DEFAULT 'generated',
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  generation_timestamp BIGINT,
  generation_model TEXT,
  generation_language TEXT CHECK (generation_language IN ('de', 'en')),
  generation_cache_key TEXT,
  generation_version TEXT,
  validation_status validation_status,
  
  -- Business metrics
  setup_cost DECIMAL(10,2),
  estimated_time TEXT,
  estimated_cost TEXT,
  time_savings INTEGER, -- hours per month
  
  -- Popularity & ratings
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  popularity INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  
  -- Domain classification
  domain_primary TEXT,
  domain_secondary TEXT[] DEFAULT '{}',
  domain_confidences DECIMAL(3,2)[] DEFAULT '{}',
  domain_origin domain_origin,
  domain_last_updated TIMESTAMPTZ,
  
  -- Scoring & matching
  score_overall DECIMAL(5,2),
  score_category DECIMAL(5,2),
  score_service DECIMAL(5,2),
  score_trigger DECIMAL(5,2),
  score_complexity DECIMAL(5,2),
  score_integration DECIMAL(5,2),
  score_confidence DECIMAL(5,2),
  score_reasoning TEXT[] DEFAULT '{}',
  match_score DECIMAL(5,2),
  match_reasons TEXT[] DEFAULT '{}',
  match_relevant_integrations TEXT[] DEFAULT '{}',
  match_estimated_time_savings INTEGER,
  
  -- UI & display
  download_url TEXT,
  preview_url TEXT,
  thumbnail_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  
  -- Caching & optimization
  file_hash TEXT,
  analyzed_at TIMESTAMPTZ,
  last_accessed TIMESTAMPTZ,
  cache_key TEXT
);

-- Create indexes for performance
CREATE INDEX idx_unified_workflows_source ON unified_workflows(source);
CREATE INDEX idx_unified_workflows_category ON unified_workflows(category);
CREATE INDEX idx_unified_workflows_complexity ON unified_workflows(complexity);
CREATE INDEX idx_unified_workflows_trigger_type ON unified_workflows(trigger_type);
CREATE INDEX idx_unified_workflows_status ON unified_workflows(status);
CREATE INDEX idx_unified_workflows_is_ai_generated ON unified_workflows(is_ai_generated);
CREATE INDEX idx_unified_workflows_verified ON unified_workflows(verified);
CREATE INDEX idx_unified_workflows_active ON unified_workflows(active);
CREATE INDEX idx_unified_workflows_created_at ON unified_workflows(created_at);
CREATE INDEX idx_unified_workflows_updated_at ON unified_workflows(updated_at);
CREATE INDEX idx_unified_workflows_rating ON unified_workflows(rating);
CREATE INDEX idx_unified_workflows_downloads ON unified_workflows(downloads);
CREATE INDEX idx_unified_workflows_popularity ON unified_workflows(popularity);
CREATE INDEX idx_unified_workflows_domain_primary ON unified_workflows(domain_primary);
CREATE INDEX idx_unified_workflows_score_overall ON unified_workflows(score_overall);
CREATE INDEX idx_unified_workflows_match_score ON unified_workflows(match_score);

-- Create GIN indexes for array fields
CREATE INDEX idx_unified_workflows_tags_gin ON unified_workflows USING GIN(tags);
CREATE INDEX idx_unified_workflows_integrations_gin ON unified_workflows USING GIN(integrations);
CREATE INDEX idx_unified_workflows_domain_secondary_gin ON unified_workflows USING GIN(domain_secondary);
CREATE INDEX idx_unified_workflows_score_reasoning_gin ON unified_workflows USING GIN(score_reasoning);
CREATE INDEX idx_unified_workflows_match_reasons_gin ON unified_workflows USING GIN(match_reasons);
CREATE INDEX idx_unified_workflows_match_relevant_integrations_gin ON unified_workflows USING GIN(match_relevant_integrations);

-- Create GIN index for JSONB fields
CREATE INDEX idx_unified_workflows_n8n_workflow_gin ON unified_workflows USING GIN(n8n_workflow);
CREATE INDEX idx_unified_workflows_workflow_data_gin ON unified_workflows USING GIN(workflow_data);

-- Create composite indexes for common queries
CREATE INDEX idx_unified_workflows_source_category ON unified_workflows(source, category);
CREATE INDEX idx_unified_workflows_source_complexity ON unified_workflows(source, complexity);
CREATE INDEX idx_unified_workflows_category_complexity ON unified_workflows(category, complexity);
CREATE INDEX idx_unified_workflows_status_active ON unified_workflows(status, active);
CREATE INDEX idx_unified_workflows_is_ai_generated_status ON unified_workflows(is_ai_generated, status);
CREATE INDEX idx_unified_workflows_verified_rating ON unified_workflows(verified, rating);
CREATE INDEX idx_unified_workflows_created_at_status ON unified_workflows(created_at, status);

-- Create full-text search index
CREATE INDEX idx_unified_workflows_search ON unified_workflows USING GIN(
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(summary, '') || ' ' || 
    COALESCE(category, '') || ' ' || 
    COALESCE(array_to_string(tags, ' '), '') || ' ' ||
    COALESCE(array_to_string(integrations, ' '), '')
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_unified_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_unified_workflows_updated_at
  BEFORE UPDATE ON unified_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_unified_workflows_updated_at();

-- Create function to update last_accessed timestamp
CREATE OR REPLACE FUNCTION update_unified_workflows_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_accessed on SELECT
CREATE TRIGGER trigger_update_unified_workflows_last_accessed
  BEFORE UPDATE ON unified_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_unified_workflows_last_accessed();

-- Create function to validate domain confidences
CREATE OR REPLACE FUNCTION validate_domain_confidences()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if domain_confidences array length matches domain_secondary array length
  IF array_length(NEW.domain_secondary, 1) IS NOT NULL AND 
     array_length(NEW.domain_confidences, 1) IS NOT NULL AND
     array_length(NEW.domain_secondary, 1) != array_length(NEW.domain_confidences, 1) THEN
    RAISE EXCEPTION 'domain_secondary and domain_confidences arrays must have the same length';
  END IF;
  
  -- Check if all confidences are between 0 and 1
  IF NEW.domain_confidences IS NOT NULL THEN
    FOR i IN 1..array_length(NEW.domain_confidences, 1) LOOP
      IF NEW.domain_confidences[i] < 0 OR NEW.domain_confidences[i] > 1 THEN
        RAISE EXCEPTION 'domain_confidences must be between 0 and 1';
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate domain confidences
CREATE TRIGGER trigger_validate_domain_confidences
  BEFORE INSERT OR UPDATE ON unified_workflows
  FOR EACH ROW
  EXECUTE FUNCTION validate_domain_confidences();

-- Create function to calculate popularity score
CREATE OR REPLACE FUNCTION calculate_popularity_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate popularity based on downloads and rating
  IF NEW.downloads IS NOT NULL AND NEW.rating IS NOT NULL THEN
    NEW.popularity = LEAST(100, GREATEST(0, 
      (NEW.downloads / 10.0) + (NEW.rating * 20.0)
    ));
  ELSIF NEW.downloads IS NOT NULL THEN
    NEW.popularity = LEAST(100, GREATEST(0, NEW.downloads / 10.0));
  ELSIF NEW.rating IS NOT NULL THEN
    NEW.popularity = LEAST(100, GREATEST(0, NEW.rating * 20.0));
  ELSE
    NEW.popularity = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate popularity score
CREATE TRIGGER trigger_calculate_popularity_score
  BEFORE INSERT OR UPDATE ON unified_workflows
  FOR EACH ROW
  EXECUTE FUNCTION calculate_popularity_score();

-- Create view for workflow statistics
CREATE VIEW unified_workflows_stats AS
SELECT 
  COUNT(*) as total_workflows,
  COUNT(*) FILTER (WHERE active = TRUE) as active_workflows,
  COUNT(*) FILTER (WHERE active = FALSE) as inactive_workflows,
  COUNT(*) FILTER (WHERE is_ai_generated = TRUE) as ai_generated_workflows,
  COUNT(*) FILTER (WHERE verified = TRUE) as verified_workflows,
  COUNT(*) FILTER (WHERE complexity = 'Low') as low_complexity,
  COUNT(*) FILTER (WHERE complexity = 'Medium') as medium_complexity,
  COUNT(*) FILTER (WHERE complexity = 'High') as high_complexity,
  COUNT(*) FILTER (WHERE complexity = 'Easy') as easy_complexity,
  COUNT(*) FILTER (WHERE complexity = 'Hard') as hard_complexity,
  COUNT(*) FILTER (WHERE trigger_type = 'Manual') as manual_triggers,
  COUNT(*) FILTER (WHERE trigger_type = 'Webhook') as webhook_triggers,
  COUNT(*) FILTER (WHERE trigger_type = 'Scheduled') as scheduled_triggers,
  COUNT(*) FILTER (WHERE trigger_type = 'Complex') as complex_triggers,
  COUNT(*) FILTER (WHERE source = 'github') as github_workflows,
  COUNT(*) FILTER (WHERE source = 'n8n.io') as n8n_workflows,
  COUNT(*) FILTER (WHERE source = 'ai-generated') as ai_generated,
  COUNT(*) FILTER (WHERE source = 'manual') as manual_workflows,
  COUNT(*) FILTER (WHERE source = 'api') as api_workflows,
  COALESCE(SUM(downloads), 0) as total_downloads,
  COALESCE(AVG(rating), 0) as average_rating,
  COALESCE(AVG(popularity), 0) as average_popularity
FROM unified_workflows;

-- Create view for top categories
CREATE VIEW unified_workflows_top_categories AS
SELECT 
  category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM unified_workflows
WHERE active = TRUE
GROUP BY category
ORDER BY count DESC;

-- Create view for top integrations
CREATE VIEW unified_workflows_top_integrations AS
SELECT 
  integration,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM unified_workflows,
  LATERAL unnest(integrations) as integration
WHERE active = TRUE
GROUP BY integration
ORDER BY count DESC;

-- Create view for recent workflows
CREATE VIEW unified_workflows_recent AS
SELECT 
  id,
  title,
  description,
  source,
  category,
  complexity,
  trigger_type,
  is_ai_generated,
  verified,
  created_at,
  updated_at
FROM unified_workflows
WHERE active = TRUE
ORDER BY created_at DESC
LIMIT 100;

-- Create view for popular workflows
CREATE VIEW unified_workflows_popular AS
SELECT 
  id,
  title,
  description,
  source,
  category,
  complexity,
  trigger_type,
  is_ai_generated,
  verified,
  downloads,
  rating,
  popularity,
  created_at
FROM unified_workflows
WHERE active = TRUE
ORDER BY popularity DESC, downloads DESC
LIMIT 100;

-- Create view for AI-generated workflows
CREATE VIEW unified_workflows_ai_generated AS
SELECT 
  id,
  title,
  description,
  source,
  category,
  complexity,
  trigger_type,
  generation_model,
  generation_language,
  validation_status,
  created_at,
  updated_at
FROM unified_workflows
WHERE is_ai_generated = TRUE
ORDER BY created_at DESC;

-- Add comments for documentation
COMMENT ON TABLE unified_workflows IS 'Unified table for all workflow types (GitHub, n8n.io, AI-generated)';
COMMENT ON COLUMN unified_workflows.id IS 'Unique identifier for the workflow';
COMMENT ON COLUMN unified_workflows.title IS 'Workflow title/name';
COMMENT ON COLUMN unified_workflows.description IS 'Detailed workflow description';
COMMENT ON COLUMN unified_workflows.summary IS 'Short summary of the workflow';
COMMENT ON COLUMN unified_workflows.source IS 'Source of the workflow (github, n8n.io, ai-generated, etc.)';
COMMENT ON COLUMN unified_workflows.source_url IS 'URL to the original workflow source';
COMMENT ON COLUMN unified_workflows.category IS 'Workflow category';
COMMENT ON COLUMN unified_workflows.tags IS 'Array of tags for the workflow';
COMMENT ON COLUMN unified_workflows.license IS 'License information';
COMMENT ON COLUMN unified_workflows.complexity IS 'Workflow complexity level';
COMMENT ON COLUMN unified_workflows.trigger_type IS 'Type of workflow trigger';
COMMENT ON COLUMN unified_workflows.integrations IS 'Array of integrations used in the workflow';
COMMENT ON COLUMN unified_workflows.node_count IS 'Number of nodes in the workflow';
COMMENT ON COLUMN unified_workflows.connection_count IS 'Number of connections in the workflow';
COMMENT ON COLUMN unified_workflows.n8n_workflow IS 'Full n8n workflow data (JSONB)';
COMMENT ON COLUMN unified_workflows.json_url IS 'URL to the n8n JSON file';
COMMENT ON COLUMN unified_workflows.workflow_data IS 'Raw workflow data (JSONB)';
COMMENT ON COLUMN unified_workflows.author_name IS 'Author name';
COMMENT ON COLUMN unified_workflows.author_username IS 'Author username';
COMMENT ON COLUMN unified_workflows.author_avatar IS 'Author avatar URL';
COMMENT ON COLUMN unified_workflows.author_verified IS 'Whether the author is verified';
COMMENT ON COLUMN unified_workflows.author_email IS 'Author email';
COMMENT ON COLUMN unified_workflows.created_at IS 'Creation timestamp';
COMMENT ON COLUMN unified_workflows.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN unified_workflows.version IS 'Workflow version';
COMMENT ON COLUMN unified_workflows.status IS 'Workflow status';
COMMENT ON COLUMN unified_workflows.is_ai_generated IS 'Whether the workflow was AI-generated';
COMMENT ON COLUMN unified_workflows.generation_timestamp IS 'AI generation timestamp';
COMMENT ON COLUMN unified_workflows.generation_model IS 'AI model used for generation';
COMMENT ON COLUMN unified_workflows.generation_language IS 'Language used for generation';
COMMENT ON COLUMN unified_workflows.generation_cache_key IS 'Cache key for generation';
COMMENT ON COLUMN unified_workflows.generation_version IS 'Generation version';
COMMENT ON COLUMN unified_workflows.validation_status IS 'Validation status';
COMMENT ON COLUMN unified_workflows.setup_cost IS 'Setup cost in currency units';
COMMENT ON COLUMN unified_workflows.estimated_time IS 'Estimated setup time';
COMMENT ON COLUMN unified_workflows.estimated_cost IS 'Estimated cost';
COMMENT ON COLUMN unified_workflows.time_savings IS 'Time savings in hours per month';
COMMENT ON COLUMN unified_workflows.downloads IS 'Number of downloads';
COMMENT ON COLUMN unified_workflows.rating IS 'User rating (0-5)';
COMMENT ON COLUMN unified_workflows.popularity IS 'Calculated popularity score';
COMMENT ON COLUMN unified_workflows.verified IS 'Whether the workflow is verified';
COMMENT ON COLUMN unified_workflows.domain_primary IS 'Primary domain classification';
COMMENT ON COLUMN unified_workflows.domain_secondary IS 'Secondary domain classifications';
COMMENT ON COLUMN unified_workflows.domain_confidences IS 'Confidence scores for domain classifications';
COMMENT ON COLUMN unified_workflows.domain_origin IS 'Origin of domain classification';
COMMENT ON COLUMN unified_workflows.domain_last_updated IS 'Last domain classification update';
COMMENT ON COLUMN unified_workflows.score_overall IS 'Overall workflow score';
COMMENT ON COLUMN unified_workflows.score_category IS 'Category score';
COMMENT ON COLUMN unified_workflows.score_service IS 'Service score';
COMMENT ON COLUMN unified_workflows.score_trigger IS 'Trigger score';
COMMENT ON COLUMN unified_workflows.score_complexity IS 'Complexity score';
COMMENT ON COLUMN unified_workflows.score_integration IS 'Integration score';
COMMENT ON COLUMN unified_workflows.score_confidence IS 'Confidence score';
COMMENT ON COLUMN unified_workflows.score_reasoning IS 'Array of reasoning for scores';
COMMENT ON COLUMN unified_workflows.match_score IS 'Match score';
COMMENT ON COLUMN unified_workflows.match_reasons IS 'Array of match reasons';
COMMENT ON COLUMN unified_workflows.match_relevant_integrations IS 'Array of relevant integrations';
COMMENT ON COLUMN unified_workflows.match_estimated_time_savings IS 'Estimated time savings from matching';
COMMENT ON COLUMN unified_workflows.download_url IS 'Download URL';
COMMENT ON COLUMN unified_workflows.preview_url IS 'Preview URL';
COMMENT ON COLUMN unified_workflows.thumbnail_url IS 'Thumbnail URL';
COMMENT ON COLUMN unified_workflows.active IS 'Whether the workflow is active';
COMMENT ON COLUMN unified_workflows.file_hash IS 'File hash for caching';
COMMENT ON COLUMN unified_workflows.analyzed_at IS 'Last analysis timestamp';
COMMENT ON COLUMN unified_workflows.last_accessed IS 'Last access timestamp';
COMMENT ON COLUMN unified_workflows.cache_key IS 'Cache key';
