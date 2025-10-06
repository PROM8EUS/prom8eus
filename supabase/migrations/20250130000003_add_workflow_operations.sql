-- Database functions for unified_workflows operations

-- ============================================================================
-- 1. SEARCH FUNCTIONS
-- ============================================================================

-- Full-text search function
CREATE OR REPLACE FUNCTION search_unified_workflows(
  search_query TEXT DEFAULT '',
  source_filter source_type[] DEFAULT NULL,
  category_filter TEXT[] DEFAULT NULL,
  complexity_filter complexity_type[] DEFAULT NULL,
  trigger_filter trigger_type[] DEFAULT NULL,
  integration_filter TEXT[] DEFAULT NULL,
  is_ai_generated_filter BOOLEAN DEFAULT NULL,
  verified_filter BOOLEAN DEFAULT NULL,
  active_filter BOOLEAN DEFAULT TRUE,
  min_rating DECIMAL(3,2) DEFAULT NULL,
  max_setup_cost DECIMAL(10,2) DEFAULT NULL,
  domain_filter TEXT[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0,
  sort_by TEXT DEFAULT 'relevance',
  sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  summary TEXT,
  source source_type,
  source_url TEXT,
  category TEXT,
  tags TEXT[],
  complexity complexity_type,
  trigger_type trigger_type,
  integrations TEXT[],
  is_ai_generated BOOLEAN,
  verified BOOLEAN,
  rating DECIMAL(3,2),
  downloads INTEGER,
  popularity INTEGER,
  setup_cost DECIMAL(10,2),
  estimated_time TEXT,
  domain_primary TEXT,
  domain_secondary TEXT[],
  score_overall DECIMAL(5,2),
  match_score DECIMAL(5,2),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL
) AS $$
DECLARE
  search_vector tsvector;
BEGIN
  -- Build search vector if query provided
  IF search_query != '' THEN
    search_vector := to_tsvector('english', search_query);
  END IF;

  RETURN QUERY
  SELECT 
    uw.id,
    uw.title,
    uw.description,
    uw.summary,
    uw.source,
    uw.source_url,
    uw.category,
    uw.tags,
    uw.complexity,
    uw.trigger_type,
    uw.integrations,
    uw.is_ai_generated,
    uw.verified,
    uw.rating,
    uw.downloads,
    uw.popularity,
    uw.setup_cost,
    uw.estimated_time,
    uw.domain_primary,
    uw.domain_secondary,
    uw.score_overall,
    uw.match_score,
    uw.created_at,
    uw.updated_at,
    CASE 
      WHEN search_query != '' THEN ts_rank(
        to_tsvector('english', 
          COALESCE(uw.title, '') || ' ' || 
          COALESCE(uw.description, '') || ' ' || 
          COALESCE(uw.summary, '') || ' ' || 
          COALESCE(uw.category, '') || ' ' || 
          COALESCE(array_to_string(uw.tags, ' '), '') || ' ' ||
          COALESCE(array_to_string(uw.integrations, ' '), '')
        ),
        search_vector
      )
      ELSE 0::REAL
    END as rank
  FROM unified_workflows uw
  WHERE 
    (search_query = '' OR to_tsvector('english', 
      COALESCE(uw.title, '') || ' ' || 
      COALESCE(uw.description, '') || ' ' || 
      COALESCE(uw.summary, '') || ' ' || 
      COALESCE(uw.category, '') || ' ' || 
      COALESCE(array_to_string(uw.tags, ' '), '') || ' ' ||
      COALESCE(array_to_string(uw.integrations, ' '), '')
    ) @@ search_vector)
    AND (source_filter IS NULL OR uw.source = ANY(source_filter))
    AND (category_filter IS NULL OR uw.category = ANY(category_filter))
    AND (complexity_filter IS NULL OR uw.complexity = ANY(complexity_filter))
    AND (trigger_filter IS NULL OR uw.trigger_type = ANY(trigger_filter))
    AND (integration_filter IS NULL OR uw.integrations && integration_filter)
    AND (is_ai_generated_filter IS NULL OR uw.is_ai_generated = is_ai_generated_filter)
    AND (verified_filter IS NULL OR uw.verified = verified_filter)
    AND (active_filter IS NULL OR uw.active = active_filter)
    AND (min_rating IS NULL OR uw.rating >= min_rating)
    AND (max_setup_cost IS NULL OR uw.setup_cost <= max_setup_cost)
    AND (domain_filter IS NULL OR uw.domain_primary = ANY(domain_filter) OR uw.domain_secondary && domain_filter)
  ORDER BY 
    CASE 
      WHEN sort_by = 'relevance' AND search_query != '' THEN ts_rank(
        to_tsvector('english', 
          COALESCE(uw.title, '') || ' ' || 
          COALESCE(uw.description, '') || ' ' || 
          COALESCE(uw.summary, '') || ' ' || 
          COALESCE(uw.category, '') || ' ' || 
          COALESCE(array_to_string(uw.tags, ' '), '') || ' ' ||
          COALESCE(array_to_string(uw.integrations, ' '), '')
        ),
        search_vector
      )
      WHEN sort_by = 'rating' THEN uw.rating
      WHEN sort_by = 'downloads' THEN uw.downloads
      WHEN sort_by = 'popularity' THEN uw.popularity
      WHEN sort_by = 'created_at' THEN uw.created_at
      WHEN sort_by = 'complexity' THEN uw.complexity
      ELSE uw.popularity
    END DESC,
    CASE 
      WHEN sort_by = 'relevance' AND search_query != '' THEN ts_rank(
        to_tsvector('english', 
          COALESCE(uw.title, '') || ' ' || 
          COALESCE(uw.description, '') || ' ' || 
          COALESCE(uw.summary, '') || ' ' || 
          COALESCE(uw.category, '') || ' ' || 
          COALESCE(array_to_string(uw.tags, ' '), '') || ' ' ||
          COALESCE(array_to_string(uw.integrations, ' '), '')
        ),
        search_vector
      )
      WHEN sort_by = 'rating' THEN uw.rating
      WHEN sort_by = 'downloads' THEN uw.downloads
      WHEN sort_by = 'popularity' THEN uw.popularity
      WHEN sort_by = 'created_at' THEN uw.created_at
      WHEN sort_by = 'complexity' THEN uw.complexity
      ELSE uw.popularity
    END ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. FILTER FUNCTIONS
-- ============================================================================

-- Get workflows by source
CREATE OR REPLACE FUNCTION get_workflows_by_source(
  source_name source_type,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  complexity complexity_type,
  trigger_type trigger_type,
  is_ai_generated BOOLEAN,
  verified BOOLEAN,
  rating DECIMAL(3,2),
  downloads INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uw.id,
    uw.title,
    uw.description,
    uw.category,
    uw.complexity,
    uw.trigger_type,
    uw.is_ai_generated,
    uw.verified,
    uw.rating,
    uw.downloads,
    uw.created_at
  FROM unified_workflows uw
  WHERE uw.source = source_name
    AND uw.active = TRUE
  ORDER BY uw.popularity DESC, uw.downloads DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get AI-generated workflows
CREATE OR REPLACE FUNCTION get_ai_generated_workflows(
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  complexity complexity_type,
  generation_model TEXT,
  generation_language TEXT,
  validation_status validation_status,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uw.id,
    uw.title,
    uw.description,
    uw.category,
    uw.complexity,
    uw.generation_model,
    uw.generation_language,
    uw.validation_status,
    uw.created_at
  FROM unified_workflows uw
  WHERE uw.is_ai_generated = TRUE
    AND uw.active = TRUE
  ORDER BY uw.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get workflows by domain
CREATE OR REPLACE FUNCTION get_workflows_by_domain(
  domain_name TEXT,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  complexity complexity_type,
  domain_primary TEXT,
  domain_secondary TEXT[],
  domain_confidences DECIMAL(3,2)[],
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uw.id,
    uw.title,
    uw.description,
    uw.category,
    uw.complexity,
    uw.domain_primary,
    uw.domain_secondary,
    uw.domain_confidences,
    uw.created_at
  FROM unified_workflows uw
  WHERE (uw.domain_primary = domain_name OR domain_name = ANY(uw.domain_secondary))
    AND uw.active = TRUE
  ORDER BY uw.popularity DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. STATISTICS FUNCTIONS
-- ============================================================================

-- Get workflow statistics
CREATE OR REPLACE FUNCTION get_workflow_statistics()
RETURNS TABLE (
  total_workflows BIGINT,
  active_workflows BIGINT,
  ai_generated_workflows BIGINT,
  verified_workflows BIGINT,
  total_downloads BIGINT,
  average_rating DECIMAL(3,2),
  average_popularity DECIMAL(5,2),
  by_source JSONB,
  by_complexity JSONB,
  by_trigger_type JSONB,
  top_categories JSONB,
  top_integrations JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM unified_workflows)::BIGINT as total_workflows,
    (SELECT COUNT(*) FROM unified_workflows WHERE active = TRUE)::BIGINT as active_workflows,
    (SELECT COUNT(*) FROM unified_workflows WHERE is_ai_generated = TRUE)::BIGINT as ai_generated_workflows,
    (SELECT COUNT(*) FROM unified_workflows WHERE verified = TRUE)::BIGINT as verified_workflows,
    (SELECT COALESCE(SUM(downloads), 0) FROM unified_workflows)::BIGINT as total_downloads,
    (SELECT COALESCE(AVG(rating), 0) FROM unified_workflows WHERE rating IS NOT NULL)::DECIMAL(3,2) as average_rating,
    (SELECT COALESCE(AVG(popularity), 0) FROM unified_workflows)::DECIMAL(5,2) as average_popularity,
    (SELECT jsonb_object_agg(source, count) FROM (
      SELECT source, COUNT(*) as count 
      FROM unified_workflows 
      GROUP BY source
    ) t) as by_source,
    (SELECT jsonb_object_agg(complexity, count) FROM (
      SELECT complexity, COUNT(*) as count 
      FROM unified_workflows 
      GROUP BY complexity
    ) t) as by_complexity,
    (SELECT jsonb_object_agg(trigger_type, count) FROM (
      SELECT trigger_type, COUNT(*) as count 
      FROM unified_workflows 
      GROUP BY trigger_type
    ) t) as by_trigger_type,
    (SELECT jsonb_object_agg(category, count) FROM (
      SELECT category, COUNT(*) as count 
      FROM unified_workflows 
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 10
    ) t) as top_categories,
    (SELECT jsonb_object_agg(integration, count) FROM (
      SELECT integration, COUNT(*) as count 
      FROM unified_workflows, 
           LATERAL unnest(integrations) as integration
      GROUP BY integration 
      ORDER BY count DESC 
      LIMIT 10
    ) t) as top_integrations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. RECOMMENDATION FUNCTIONS
-- ============================================================================

-- Get similar workflows
CREATE OR REPLACE FUNCTION get_similar_workflows(
  workflow_id TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  complexity complexity_type,
  similarity_score DECIMAL(5,2),
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uw.id,
    uw.title,
    uw.description,
    uw.category,
    uw.complexity,
    CASE 
      WHEN uw.category = base.category THEN 80.0
      WHEN uw.complexity = base.complexity THEN 60.0
      WHEN uw.integrations && base.integrations THEN 70.0
      ELSE 30.0
    END as similarity_score,
    CASE 
      WHEN uw.category = base.category AND uw.complexity = base.complexity THEN 'Same category and complexity'
      WHEN uw.category = base.category THEN 'Same category'
      WHEN uw.complexity = base.complexity THEN 'Same complexity'
      WHEN uw.integrations && base.integrations THEN 'Shared integrations'
      ELSE 'General similarity'
    END as reason
  FROM unified_workflows uw
  CROSS JOIN (
    SELECT category, complexity, integrations 
    FROM unified_workflows 
    WHERE id = workflow_id
  ) base
  WHERE uw.id != workflow_id
    AND uw.active = TRUE
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. UTILITY FUNCTIONS
-- ============================================================================

-- Update workflow popularity
CREATE OR REPLACE FUNCTION update_workflow_popularity(workflow_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE unified_workflows 
  SET popularity = LEAST(100, GREATEST(0, 
    (COALESCE(downloads, 0) / 10.0) + (COALESCE(rating, 0) * 20.0)
  ))
  WHERE id = workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment download count
CREATE OR REPLACE FUNCTION increment_workflow_downloads(workflow_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE unified_workflows 
  SET downloads = COALESCE(downloads, 0) + 1,
      last_accessed = NOW()
  WHERE id = workflow_id;
  
  -- Update popularity score
  PERFORM update_workflow_popularity(workflow_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_unified_workflows TO authenticated;
GRANT EXECUTE ON FUNCTION get_workflows_by_source TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_generated_workflows TO authenticated;
GRANT EXECUTE ON FUNCTION get_workflows_by_domain TO authenticated;
GRANT EXECUTE ON FUNCTION get_workflow_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_similar_workflows TO authenticated;
GRANT EXECUTE ON FUNCTION update_workflow_popularity TO authenticated;
GRANT EXECUTE ON FUNCTION increment_workflow_downloads TO authenticated;

-- Grant execute permissions to anonymous users (for public access)
GRANT EXECUTE ON FUNCTION search_unified_workflows TO anon;
GRANT EXECUTE ON FUNCTION get_workflows_by_source TO anon;
GRANT EXECUTE ON FUNCTION get_ai_generated_workflows TO anon;
GRANT EXECUTE ON FUNCTION get_workflows_by_domain TO anon;
GRANT EXECUTE ON FUNCTION get_workflow_statistics TO anon;
GRANT EXECUTE ON FUNCTION get_similar_workflows TO anon;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION search_unified_workflows IS 'Comprehensive search function with filtering and sorting';
COMMENT ON FUNCTION get_workflows_by_source IS 'Get workflows filtered by source type';
COMMENT ON FUNCTION get_ai_generated_workflows IS 'Get AI-generated workflows';
COMMENT ON FUNCTION get_workflows_by_domain IS 'Get workflows by domain classification';
COMMENT ON FUNCTION get_workflow_statistics IS 'Get comprehensive workflow statistics';
COMMENT ON FUNCTION get_similar_workflows IS 'Get similar workflows based on category, complexity, and integrations';
COMMENT ON FUNCTION update_workflow_popularity IS 'Update workflow popularity score';
COMMENT ON FUNCTION increment_workflow_downloads IS 'Increment download count and update popularity';
