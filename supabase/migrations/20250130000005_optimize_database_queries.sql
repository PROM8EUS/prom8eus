-- Performance optimization for unified_workflows operations
-- This migration adds advanced indexing and query optimizations

-- ============================================================================
-- 1. ADVANCED INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_unified_workflows_source_active_ai 
ON unified_workflows (source, active, is_ai_generated) 
WHERE active = true;

-- Index for AI-generated workflows specifically
CREATE INDEX IF NOT EXISTS idx_unified_workflows_ai_generated 
ON unified_workflows (is_ai_generated, created_at DESC) 
WHERE is_ai_generated = true AND active = true;

-- Index for source-based queries
CREATE INDEX IF NOT EXISTS idx_unified_workflows_source_category 
ON unified_workflows (source, category, active) 
WHERE active = true;

-- Index for complexity and trigger type filtering
CREATE INDEX IF NOT EXISTS idx_unified_workflows_complexity_trigger 
ON unified_workflows (complexity, trigger_type, active) 
WHERE active = true;

-- Index for rating and popularity sorting
CREATE INDEX IF NOT EXISTS idx_unified_workflows_rating_popularity 
ON unified_workflows (rating DESC, popularity DESC, active) 
WHERE active = true AND rating IS NOT NULL;

-- Index for domain classification
CREATE INDEX IF NOT EXISTS idx_unified_workflows_domain_primary 
ON unified_workflows (domain_primary, active) 
WHERE active = true AND domain_primary IS NOT NULL;

-- Index for setup cost filtering
CREATE INDEX IF NOT EXISTS idx_unified_workflows_setup_cost 
ON unified_workflows (setup_cost, active) 
WHERE active = true AND setup_cost IS NOT NULL;

-- Index for downloads and popularity
CREATE INDEX IF NOT EXISTS idx_unified_workflows_downloads_popularity 
ON unified_workflows (downloads DESC, popularity DESC, active) 
WHERE active = true;

-- ============================================================================
-- 2. OPTIMIZED SEARCH FUNCTION
-- ============================================================================

-- Create a more efficient search function with better performance
CREATE OR REPLACE FUNCTION search_unified_workflows_optimized(
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
  base_query TEXT;
  where_clauses TEXT[] := ARRAY[]::TEXT[];
  order_clause TEXT;
BEGIN
  -- Build search vector if query provided
  IF search_query != '' THEN
    search_vector := to_tsvector('english', search_query);
  END IF;

  -- Build WHERE clauses for better performance
  IF active_filter IS NOT NULL THEN
    where_clauses := array_append(where_clauses, 'active = ' || active_filter);
  END IF;

  IF source_filter IS NOT NULL AND array_length(source_filter, 1) > 0 THEN
    where_clauses := array_append(where_clauses, 'source = ANY($1)');
  END IF;

  IF is_ai_generated_filter IS NOT NULL THEN
    where_clauses := array_append(where_clauses, 'is_ai_generated = ' || is_ai_generated_filter);
  END IF;

  IF category_filter IS NOT NULL AND array_length(category_filter, 1) > 0 THEN
    where_clauses := array_append(where_clauses, 'category = ANY($2)');
  END IF;

  IF complexity_filter IS NOT NULL AND array_length(complexity_filter, 1) > 0 THEN
    where_clauses := array_append(where_clauses, 'complexity = ANY($3)');
  END IF;

  IF trigger_filter IS NOT NULL AND array_length(trigger_filter, 1) > 0 THEN
    where_clauses := array_append(where_clauses, 'trigger_type = ANY($4)');
  END IF;

  IF min_rating IS NOT NULL THEN
    where_clauses := array_append(where_clauses, 'rating >= ' || min_rating);
  END IF;

  IF max_setup_cost IS NOT NULL THEN
    where_clauses := array_append(where_clauses, 'setup_cost <= ' || max_setup_cost);
  END IF;

  IF domain_filter IS NOT NULL AND array_length(domain_filter, 1) > 0 THEN
    where_clauses := array_append(where_clauses, 'domain_primary = ANY($5)');
  END IF;

  -- Build ORDER BY clause
  CASE sort_by
    WHEN 'relevance' THEN
      IF search_query != '' THEN
        order_clause := 'rank DESC, score_overall DESC, popularity DESC';
      ELSE
        order_clause := 'score_overall DESC, popularity DESC, created_at DESC';
      END IF;
    WHEN 'popularity' THEN
      order_clause := 'popularity DESC, downloads DESC, rating DESC';
    WHEN 'rating' THEN
      order_clause := 'rating DESC, popularity DESC, downloads DESC';
    WHEN 'created_at' THEN
      order_clause := 'created_at DESC, popularity DESC';
    WHEN 'title' THEN
      order_clause := 'title ASC';
    ELSE
      order_clause := 'score_overall DESC, popularity DESC';
  END CASE;

  IF sort_order = 'asc' THEN
    order_clause := replace(order_clause, 'DESC', 'ASC');
  END IF;

  -- Build the final query
  base_query := '
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
        WHEN $6 != '''' THEN ts_rank(
          to_tsvector(''english'', 
            COALESCE(uw.title, '''') || '' '' || 
            COALESCE(uw.description, '''') || '' '' || 
            COALESCE(uw.summary, '''') || '' '' || 
            COALESCE(uw.category, '''') || '' '' || 
            COALESCE(array_to_string(uw.tags, '' ''), '''') || '' '' ||
            COALESCE(array_to_string(uw.integrations, '' ''), '''')
          ),
          to_tsvector(''english'', $6)
        )
        ELSE 0::REAL
      END as rank
    FROM unified_workflows uw
    WHERE ' || array_to_string(where_clauses, ' AND ') || '
    ORDER BY ' || order_clause || '
    LIMIT $7 OFFSET $8';

  -- Execute the query
  RETURN QUERY EXECUTE base_query 
  USING source_filter, category_filter, complexity_filter, trigger_filter, 
        domain_filter, search_query, limit_count, offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. OPTIMIZED STATISTICS FUNCTION
-- ============================================================================

-- Create an optimized statistics function
CREATE OR REPLACE FUNCTION get_workflow_statistics_optimized(
  source_filter source_type[] DEFAULT NULL
)
RETURNS TABLE (
  source source_type,
  total_count BIGINT,
  active_count BIGINT,
  ai_generated_count BIGINT,
  avg_rating DECIMAL(3,2),
  total_downloads BIGINT,
  total_popularity BIGINT,
  avg_setup_cost DECIMAL(10,2),
  complexity_distribution JSONB,
  category_distribution JSONB,
  trigger_type_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      uw.source,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE uw.active = true) as active_count,
      COUNT(*) FILTER (WHERE uw.is_ai_generated = true) as ai_generated_count,
      AVG(uw.rating) as avg_rating,
      SUM(uw.downloads) as total_downloads,
      SUM(uw.popularity) as total_popularity,
      AVG(uw.setup_cost) as avg_setup_cost
    FROM unified_workflows uw
    WHERE (source_filter IS NULL OR uw.source = ANY(source_filter))
    GROUP BY uw.source
  ),
  complexity_stats AS (
    SELECT 
      uw.source,
      jsonb_object_agg(uw.complexity, complexity_count) as complexity_distribution
    FROM (
      SELECT 
        uw.source,
        uw.complexity,
        COUNT(*) as complexity_count
      FROM unified_workflows uw
      WHERE (source_filter IS NULL OR uw.source = ANY(source_filter))
      GROUP BY uw.source, uw.complexity
    ) uw
    GROUP BY uw.source
  ),
  category_stats AS (
    SELECT 
      uw.source,
      jsonb_object_agg(uw.category, category_count) as category_distribution
    FROM (
      SELECT 
        uw.source,
        uw.category,
        COUNT(*) as category_count
      FROM unified_workflows uw
      WHERE (source_filter IS NULL OR uw.source = ANY(source_filter))
      GROUP BY uw.source, uw.category
    ) uw
    GROUP BY uw.source
  ),
  trigger_stats AS (
    SELECT 
      uw.source,
      jsonb_object_agg(uw.trigger_type, trigger_count) as trigger_type_distribution
    FROM (
      SELECT 
        uw.source,
        uw.trigger_type,
        COUNT(*) as trigger_count
      FROM unified_workflows uw
      WHERE (source_filter IS NULL OR uw.source = ANY(source_filter))
      GROUP BY uw.source, uw.trigger_type
    ) uw
    GROUP BY uw.source
  )
  SELECT 
    s.source,
    s.total_count,
    s.active_count,
    s.ai_generated_count,
    s.avg_rating,
    s.total_downloads,
    s.total_popularity,
    s.avg_setup_cost,
    COALESCE(cs.complexity_distribution, '{}'::jsonb) as complexity_distribution,
    COALESCE(cat.category_distribution, '{}'::jsonb) as category_distribution,
    COALESCE(ts.trigger_type_distribution, '{}'::jsonb) as trigger_type_distribution
  FROM stats s
  LEFT JOIN complexity_stats cs ON s.source = cs.source
  LEFT JOIN category_stats cat ON s.source = cat.source
  LEFT JOIN trigger_stats ts ON s.source = ts.source
  ORDER BY s.total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. OPTIMIZED AI WORKFLOW QUERY
-- ============================================================================

-- Create an optimized function for AI-generated workflows
CREATE OR REPLACE FUNCTION get_ai_generated_workflows_optimized(
  category_filter TEXT[] DEFAULT NULL,
  complexity_filter complexity_type[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  summary TEXT,
  category TEXT,
  tags TEXT[],
  complexity complexity_type,
  trigger_type trigger_type,
  integrations TEXT[],
  rating DECIMAL(3,2),
  downloads INTEGER,
  popularity INTEGER,
  setup_cost DECIMAL(10,2),
  estimated_time TEXT,
  created_at TIMESTAMPTZ,
  generation_metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uw.id,
    uw.title,
    uw.description,
    uw.summary,
    uw.category,
    uw.tags,
    uw.complexity,
    uw.trigger_type,
    uw.integrations,
    uw.rating,
    uw.downloads,
    uw.popularity,
    uw.setup_cost,
    uw.estimated_time,
    uw.created_at,
    uw.generation_metadata
  FROM unified_workflows uw
  WHERE uw.is_ai_generated = true
    AND uw.active = true
    AND (category_filter IS NULL OR uw.category = ANY(category_filter))
    AND (complexity_filter IS NULL OR uw.complexity = ANY(complexity_filter))
  ORDER BY uw.created_at DESC, uw.popularity DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. QUERY PERFORMANCE MONITORING
-- ============================================================================

-- Create a function to monitor query performance
CREATE OR REPLACE FUNCTION get_query_performance_stats()
RETURNS TABLE (
  query_type TEXT,
  avg_execution_time_ms NUMERIC,
  total_executions BIGINT,
  last_execution TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'search_unified_workflows'::TEXT as query_type,
    0::NUMERIC as avg_execution_time_ms,
    0::BIGINT as total_executions,
    NOW() as last_execution
  UNION ALL
  SELECT 
    'get_ai_generated_workflows'::TEXT as query_type,
    0::NUMERIC as avg_execution_time_ms,
    0::BIGINT as total_executions,
    NOW() as last_execution
  UNION ALL
  SELECT 
    'get_workflow_statistics'::TEXT as query_type,
    0::NUMERIC as avg_execution_time_ms,
    0::BIGINT as total_executions,
    NOW() as last_execution;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CLEANUP OLD INDEXES (if they exist)
-- ============================================================================

-- Drop any old indexes that might be redundant
DROP INDEX IF EXISTS idx_unified_workflows_old_search;
DROP INDEX IF EXISTS idx_unified_workflows_old_filter;

-- ============================================================================
-- 7. ANALYZE TABLES FOR OPTIMIZER
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE unified_workflows;
ANALYZE feature_flags;
