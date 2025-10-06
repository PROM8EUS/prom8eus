-- Feature flags for gradual unified workflow schema rollout

-- ============================================================================
-- 1. FEATURE FLAGS TABLE
-- ============================================================================

-- Create feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users TEXT[] DEFAULT '{}',
  target_roles TEXT[] DEFAULT '{}',
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for feature flags
CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX idx_feature_flags_rollout_percentage ON feature_flags(rollout_percentage);

-- ============================================================================
-- 2. FEATURE FLAG FUNCTIONS
-- ============================================================================

-- Function to check if a feature flag is enabled
CREATE OR REPLACE FUNCTION is_feature_enabled(
  flag_name TEXT,
  user_id TEXT DEFAULT NULL,
  user_role TEXT DEFAULT NULL,
  environment_name TEXT DEFAULT 'production'
)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
  user_hash INTEGER;
  is_enabled BOOLEAN := FALSE;
BEGIN
  -- Get feature flag
  SELECT * INTO flag_record
  FROM feature_flags
  WHERE name = flag_name
    AND environment = environment_name;
  
  -- If flag doesn't exist, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If flag is disabled, return false
  IF NOT flag_record.enabled THEN
    RETURN FALSE;
  END IF;
  
  -- If rollout is 100%, return true
  IF flag_record.rollout_percentage = 100 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is in target users list
  IF array_length(flag_record.target_users, 1) > 0 THEN
    IF user_id IS NOT NULL AND user_id = ANY(flag_record.target_users) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Check if user role is in target roles list
  IF array_length(flag_record.target_roles, 1) > 0 THEN
    IF user_role IS NOT NULL AND user_role = ANY(flag_record.target_roles) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- If no specific targeting, use percentage rollout
  IF user_id IS NOT NULL THEN
    -- Create deterministic hash from user_id
    user_hash := abs(hashtext(user_id)) % 100;
    
    -- Check if user falls within rollout percentage
    IF user_hash < flag_record.rollout_percentage THEN
      is_enabled := TRUE;
    END IF;
  END IF;
  
  RETURN is_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all enabled features for a user
CREATE OR REPLACE FUNCTION get_enabled_features(
  user_id TEXT DEFAULT NULL,
  user_role TEXT DEFAULT NULL,
  environment_name TEXT DEFAULT 'production'
)
RETURNS TABLE (
  name TEXT,
  description TEXT,
  rollout_percentage INTEGER,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ff.name,
    ff.description,
    ff.rollout_percentage,
    ff.metadata
  FROM feature_flags ff
  WHERE ff.environment = environment_name
    AND is_feature_enabled(ff.name, user_id, user_role, environment_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update a feature flag
CREATE OR REPLACE FUNCTION upsert_feature_flag(
  flag_name TEXT,
  flag_description TEXT DEFAULT NULL,
  flag_enabled BOOLEAN DEFAULT FALSE,
  flag_rollout_percentage INTEGER DEFAULT 0,
  flag_target_users TEXT[] DEFAULT '{}',
  flag_target_roles TEXT[] DEFAULT '{}',
  flag_environment TEXT DEFAULT 'production',
  flag_metadata JSONB DEFAULT '{}',
  created_by_user TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  flag_id INTEGER;
BEGIN
  INSERT INTO feature_flags (
    name, description, enabled, rollout_percentage, 
    target_users, target_roles, environment, metadata, created_by
  ) VALUES (
    flag_name, flag_description, flag_enabled, flag_rollout_percentage,
    flag_target_users, flag_target_roles, flag_environment, flag_metadata, created_by_user
  )
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    enabled = EXCLUDED.enabled,
    rollout_percentage = EXCLUDED.rollout_percentage,
    target_users = EXCLUDED.target_users,
    target_roles = EXCLUDED.target_roles,
    environment = EXCLUDED.environment,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO flag_id;
  
  RETURN flag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. UNIFIED WORKFLOW SCHEMA FEATURE FLAGS
-- ============================================================================

-- Insert unified workflow schema feature flags
INSERT INTO feature_flags (name, description, enabled, rollout_percentage, environment, metadata) VALUES
('unified_workflow_schema', 'Enable unified workflow schema migration', FALSE, 0, 'production', '{"component": "database", "risk_level": "high"}'),
('unified_workflow_read', 'Enable reading from unified_workflows table', FALSE, 0, 'production', '{"component": "frontend", "risk_level": "medium"}'),
('unified_workflow_write', 'Enable writing to unified_workflows table', FALSE, 0, 'production', '{"component": "backend", "risk_level": "high"}'),
('unified_workflow_search', 'Enable unified workflow search functions', FALSE, 0, 'production', '{"component": "search", "risk_level": "medium"}'),
('unified_workflow_ai_generation', 'Enable AI workflow generation to unified schema', FALSE, 0, 'production', '{"component": "ai", "risk_level": "low"}'),
('unified_workflow_migration', 'Enable automatic data migration to unified schema', FALSE, 0, 'production', '{"component": "migration", "risk_level": "high"}'),
('unified_workflow_frontend', 'Enable unified workflow display in frontend', FALSE, 0, 'production', '{"component": "frontend", "risk_level": "low"}'),
('unified_workflow_analytics', 'Enable unified workflow analytics and statistics', FALSE, 0, 'production', '{"component": "analytics", "risk_level": "low"}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 4. WORKFLOW OPERATION FUNCTIONS WITH FEATURE FLAGS
-- ============================================================================

-- Enhanced search function with feature flag support
CREATE OR REPLACE FUNCTION search_workflows_with_flags(
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
  sort_order TEXT DEFAULT 'desc',
  user_id TEXT DEFAULT NULL,
  user_role TEXT DEFAULT NULL
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
  rank REAL,
  data_source TEXT
) AS $$
DECLARE
  use_unified_schema BOOLEAN;
  use_unified_search BOOLEAN;
BEGIN
  -- Check feature flags
  use_unified_schema := is_feature_enabled('unified_workflow_read', user_id, user_role);
  use_unified_search := is_feature_enabled('unified_workflow_search', user_id, user_role);
  
  -- If unified schema is enabled, use it
  IF use_unified_schema AND use_unified_search THEN
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
          to_tsvector('english', search_query)
        )
        ELSE 0::REAL
      END as rank,
      'unified_workflows'::TEXT as data_source
    FROM unified_workflows uw
    WHERE 
      (search_query = '' OR to_tsvector('english', 
        COALESCE(uw.title, '') || ' ' || 
        COALESCE(uw.description, '') || ' ' || 
        COALESCE(uw.summary, '') || ' ' || 
        COALESCE(uw.category, '') || ' ' || 
        COALESCE(array_to_string(uw.tags, ' '), '') || ' ' ||
        COALESCE(array_to_string(uw.integrations, ' '), '')
      ) @@ to_tsvector('english', search_query))
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
          to_tsvector('english', search_query)
        )
        WHEN sort_by = 'rating' THEN uw.rating
        WHEN sort_by = 'downloads' THEN uw.downloads
        WHEN sort_by = 'popularity' THEN uw.popularity
        WHEN sort_by = 'created_at' THEN uw.created_at
        WHEN sort_by = 'complexity' THEN uw.complexity
        ELSE uw.popularity
      END DESC
    LIMIT limit_count
    OFFSET offset_count;
  ELSE
    -- Fallback to legacy workflow_cache (simplified for demo)
    RETURN QUERY
    SELECT 
      'legacy-' || (wc.id)::TEXT as id,
      'Legacy Workflow'::TEXT as title,
      'Legacy workflow from cache'::TEXT as description,
      'Legacy summary'::TEXT as summary,
      'manual'::source_type as source,
      NULL::TEXT as source_url,
      'Legacy'::TEXT as category,
      '{}'::TEXT[] as tags,
      'Medium'::complexity_type as complexity,
      'Manual'::trigger_type as trigger_type,
      '{}'::TEXT[] as integrations,
      FALSE as is_ai_generated,
      FALSE as verified,
      0.0::DECIMAL(3,2) as rating,
      0 as downloads,
      0 as popularity,
      NULL::DECIMAL(10,2) as setup_cost,
      NULL::TEXT as estimated_time,
      NULL::TEXT as domain_primary,
      '{}'::TEXT[] as domain_secondary,
      NULL::DECIMAL(5,2) as score_overall,
      NULL::DECIMAL(5,2) as match_score,
      NOW() as created_at,
      NOW() as updated_at,
      0.0::REAL as rank,
      'workflow_cache'::TEXT as data_source
    FROM workflow_cache wc
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FEATURE FLAG MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to gradually roll out a feature
CREATE OR REPLACE FUNCTION roll_out_feature(
  flag_name TEXT,
  target_percentage INTEGER,
  environment_name TEXT DEFAULT 'production'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE feature_flags
  SET rollout_percentage = target_percentage,
      updated_at = NOW()
  WHERE name = flag_name
    AND environment = environment_name;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable feature for specific users
CREATE OR REPLACE FUNCTION enable_feature_for_users(
  flag_name TEXT,
  user_ids TEXT[],
  environment_name TEXT DEFAULT 'production'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE feature_flags
  SET target_users = user_ids,
      updated_at = NOW()
  WHERE name = flag_name
    AND environment = environment_name;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feature flag status
CREATE OR REPLACE FUNCTION get_feature_status(
  flag_name TEXT,
  environment_name TEXT DEFAULT 'production'
)
RETURNS TABLE (
  name TEXT,
  enabled BOOLEAN,
  rollout_percentage INTEGER,
  target_users TEXT[],
  target_roles TEXT[],
  environment TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ff.name,
    ff.enabled,
    ff.rollout_percentage,
    ff.target_users,
    ff.target_roles,
    ff.environment,
    ff.created_at,
    ff.updated_at
  FROM feature_flags ff
  WHERE ff.name = flag_name
    AND ff.environment = environment_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. RLS POLICIES FOR FEATURE FLAGS
-- ============================================================================

-- Enable RLS on feature_flags table
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage feature flags
CREATE POLICY "Admins can manage feature flags"
ON feature_flags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy: Service role can read feature flags
CREATE POLICY "Service role can read feature flags"
ON feature_flags FOR SELECT
USING (auth.role() = 'service_role');

-- Policy: Authenticated users can read feature flags
CREATE POLICY "Authenticated users can read feature flags"
ON feature_flags FOR SELECT
USING (auth.role() = 'authenticated');

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_feature_enabled TO authenticated;
GRANT EXECUTE ON FUNCTION is_feature_enabled TO anon;
GRANT EXECUTE ON FUNCTION is_feature_enabled TO service_role;

GRANT EXECUTE ON FUNCTION get_enabled_features TO authenticated;
GRANT EXECUTE ON FUNCTION get_enabled_features TO anon;

GRANT EXECUTE ON FUNCTION search_workflows_with_flags TO authenticated;
GRANT EXECUTE ON FUNCTION search_workflows_with_flags TO anon;

GRANT EXECUTE ON FUNCTION roll_out_feature TO service_role;
GRANT EXECUTE ON FUNCTION enable_feature_for_users TO service_role;
GRANT EXECUTE ON FUNCTION get_feature_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_feature_status TO anon;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollout of new features';
COMMENT ON FUNCTION is_feature_enabled IS 'Check if a feature flag is enabled for a user';
COMMENT ON FUNCTION get_enabled_features IS 'Get all enabled features for a user';
COMMENT ON FUNCTION search_workflows_with_flags IS 'Search workflows with feature flag support';
COMMENT ON FUNCTION roll_out_feature IS 'Gradually roll out a feature to a percentage of users';
COMMENT ON FUNCTION enable_feature_for_users IS 'Enable feature for specific users';
COMMENT ON FUNCTION get_feature_status IS 'Get current status of a feature flag';
