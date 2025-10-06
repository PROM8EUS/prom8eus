-- Migrate existing workflows to unified_workflows table
-- This migration converts data from existing tables to the new unified schema

-- Create function to migrate workflow_cache data
CREATE OR REPLACE FUNCTION migrate_workflow_cache_to_unified()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
  workflow_record RECORD;
BEGIN
  -- Check if workflow_cache table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_cache') THEN
    RAISE NOTICE 'workflow_cache table does not exist, skipping migration';
    RETURN 0;
  END IF;

  -- Migrate each workflow from workflow_cache
  FOR workflow_record IN 
    SELECT * FROM workflow_cache 
    WHERE id IS NOT NULL 
    AND title IS NOT NULL 
    AND summary IS NOT NULL
  LOOP
    BEGIN
      INSERT INTO unified_workflows (
        id,
        title,
        description,
        summary,
        source,
        source_url,
        category,
        tags,
        license,
        complexity,
        trigger_type,
        integrations,
        node_count,
        connection_count,
        json_url,
        workflow_data,
        author_name,
        author_username,
        author_avatar,
        author_verified,
        author_email,
        created_at,
        updated_at,
        version,
        status,
        is_ai_generated,
        validation_status,
        setup_cost,
        estimated_time,
        estimated_cost,
        time_savings,
        downloads,
        rating,
        popularity,
        verified,
        domain_primary,
        domain_secondary,
        domain_confidences,
        domain_origin,
        domain_last_updated,
        score_overall,
        score_category,
        score_service,
        score_trigger,
        score_complexity,
        score_integration,
        score_confidence,
        score_reasoning,
        match_score,
        match_reasons,
        match_relevant_integrations,
        match_estimated_time_savings,
        download_url,
        preview_url,
        thumbnail_url,
        active,
        file_hash,
        analyzed_at,
        last_accessed,
        cache_key
      ) VALUES (
        workflow_record.id,
        workflow_record.title,
        COALESCE(workflow_record.description, workflow_record.summary),
        workflow_record.summary,
        COALESCE(workflow_record.source::source_type, 'manual'),
        workflow_record.link,
        COALESCE(workflow_record.category, 'Other'),
        COALESCE(workflow_record.tags, '{}'),
        COALESCE(workflow_record.license, 'Unknown'),
        COALESCE(workflow_record.complexity::complexity_type, 'Medium'),
        COALESCE(workflow_record.trigger_type::trigger_type, 'Manual'),
        COALESCE(workflow_record.integrations, '{}'),
        workflow_record.node_count,
        workflow_record.connection_count,
        workflow_record.json_url,
        workflow_record.workflow_data,
        workflow_record.author_name,
        workflow_record.author_username,
        workflow_record.author_avatar,
        COALESCE(workflow_record.author_verified, FALSE),
        workflow_record.author_email,
        COALESCE(workflow_record.analyzed_at, NOW()),
        NOW(),
        COALESCE(workflow_record.version, '1.0.0'),
        'verified',
        FALSE,
        COALESCE(workflow_record.validation_status::validation_status, 'valid'),
        workflow_record.setup_cost,
        workflow_record.estimated_time,
        workflow_record.estimated_cost,
        workflow_record.time_savings,
        COALESCE(workflow_record.downloads, 0),
        workflow_record.rating,
        COALESCE(workflow_record.popularity, 0),
        COALESCE(workflow_record.verified, FALSE),
        workflow_record.domain_primary,
        COALESCE(workflow_record.domain_secondary, '{}'),
        COALESCE(workflow_record.domain_confidences, '{}'),
        COALESCE(workflow_record.domain_origin::domain_origin, 'admin'),
        workflow_record.domain_last_updated,
        workflow_record.score_overall,
        workflow_record.score_category,
        workflow_record.score_service,
        workflow_record.score_trigger,
        workflow_record.score_complexity,
        workflow_record.score_integration,
        workflow_record.score_confidence,
        COALESCE(workflow_record.score_reasoning, '{}'),
        workflow_record.match_score,
        COALESCE(workflow_record.match_reasons, '{}'),
        COALESCE(workflow_record.match_relevant_integrations, '{}'),
        workflow_record.match_estimated_time_savings,
        workflow_record.download_url,
        workflow_record.preview_url,
        workflow_record.thumbnail_url,
        COALESCE(workflow_record.active, TRUE),
        workflow_record.file_hash,
        workflow_record.analyzed_at,
        workflow_record.last_accessed,
        workflow_record.cache_key
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        summary = EXCLUDED.summary,
        source = EXCLUDED.source,
        source_url = EXCLUDED.source_url,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        license = EXCLUDED.license,
        complexity = EXCLUDED.complexity,
        trigger_type = EXCLUDED.trigger_type,
        integrations = EXCLUDED.integrations,
        node_count = EXCLUDED.node_count,
        connection_count = EXCLUDED.connection_count,
        json_url = EXCLUDED.json_url,
        workflow_data = EXCLUDED.workflow_data,
        author_name = EXCLUDED.author_name,
        author_username = EXCLUDED.author_username,
        author_avatar = EXCLUDED.author_avatar,
        author_verified = EXCLUDED.author_verified,
        author_email = EXCLUDED.author_email,
        updated_at = NOW(),
        version = EXCLUDED.version,
        status = EXCLUDED.status,
        is_ai_generated = EXCLUDED.is_ai_generated,
        validation_status = EXCLUDED.validation_status,
        setup_cost = EXCLUDED.setup_cost,
        estimated_time = EXCLUDED.estimated_time,
        estimated_cost = EXCLUDED.estimated_cost,
        time_savings = EXCLUDED.time_savings,
        downloads = EXCLUDED.downloads,
        rating = EXCLUDED.rating,
        popularity = EXCLUDED.popularity,
        verified = EXCLUDED.verified,
        domain_primary = EXCLUDED.domain_primary,
        domain_secondary = EXCLUDED.domain_secondary,
        domain_confidences = EXCLUDED.domain_confidences,
        domain_origin = EXCLUDED.domain_origin,
        domain_last_updated = EXCLUDED.domain_last_updated,
        score_overall = EXCLUDED.score_overall,
        score_category = EXCLUDED.score_category,
        score_service = EXCLUDED.score_service,
        score_trigger = EXCLUDED.score_trigger,
        score_complexity = EXCLUDED.score_complexity,
        score_integration = EXCLUDED.score_integration,
        score_confidence = EXCLUDED.score_confidence,
        score_reasoning = EXCLUDED.score_reasoning,
        match_score = EXCLUDED.match_score,
        match_reasons = EXCLUDED.match_reasons,
        match_relevant_integrations = EXCLUDED.match_relevant_integrations,
        match_estimated_time_savings = EXCLUDED.match_estimated_time_savings,
        download_url = EXCLUDED.download_url,
        preview_url = EXCLUDED.preview_url,
        thumbnail_url = EXCLUDED.thumbnail_url,
        active = EXCLUDED.active,
        file_hash = EXCLUDED.file_hash,
        analyzed_at = EXCLUDED.analyzed_at,
        last_accessed = EXCLUDED.last_accessed,
        cache_key = EXCLUDED.cache_key;

      migrated_count := migrated_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate workflow %: %', workflow_record.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Migrated % workflows from workflow_cache to unified_workflows', migrated_count;
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to migrate agent_cache data
CREATE OR REPLACE FUNCTION migrate_agent_cache_to_unified()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
  agent_record RECORD;
BEGIN
  -- Check if agent_cache table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_cache') THEN
    RAISE NOTICE 'agent_cache table does not exist, skipping migration';
    RETURN 0;
  END IF;

  -- Migrate each agent from agent_cache
  FOR agent_record IN 
    SELECT * FROM agent_cache 
    WHERE id IS NOT NULL 
    AND title IS NOT NULL 
    AND summary IS NOT NULL
  LOOP
    BEGIN
      INSERT INTO unified_workflows (
        id,
        title,
        description,
        summary,
        source,
        source_url,
        category,
        tags,
        license,
        complexity,
        trigger_type,
        integrations,
        node_count,
        connection_count,
        json_url,
        workflow_data,
        author_name,
        author_username,
        author_avatar,
        author_verified,
        author_email,
        created_at,
        updated_at,
        version,
        status,
        is_ai_generated,
        validation_status,
        setup_cost,
        estimated_time,
        estimated_cost,
        time_savings,
        downloads,
        rating,
        popularity,
        verified,
        domain_primary,
        domain_secondary,
        domain_confidences,
        domain_origin,
        domain_last_updated,
        score_overall,
        score_category,
        score_service,
        score_trigger,
        score_complexity,
        score_integration,
        score_confidence,
        score_reasoning,
        match_score,
        match_reasons,
        match_relevant_integrations,
        match_estimated_time_savings,
        download_url,
        preview_url,
        thumbnail_url,
        active,
        file_hash,
        analyzed_at,
        last_accessed,
        cache_key
      ) VALUES (
        agent_record.id,
        agent_record.title,
        COALESCE(agent_record.description, agent_record.summary),
        agent_record.summary,
        COALESCE(agent_record.source::source_type, 'manual'),
        agent_record.link,
        COALESCE(agent_record.category, 'AI Agent'),
        COALESCE(agent_record.tags, '{}'),
        COALESCE(agent_record.license, 'Unknown'),
        COALESCE(agent_record.complexity::complexity_type, 'Medium'),
        'Manual',
        COALESCE(agent_record.integrations, '{}'),
        agent_record.node_count,
        agent_record.connection_count,
        agent_record.json_url,
        agent_record.workflow_data,
        agent_record.author_name,
        agent_record.author_username,
        agent_record.author_avatar,
        COALESCE(agent_record.author_verified, FALSE),
        agent_record.author_email,
        COALESCE(agent_record.analyzed_at, NOW()),
        NOW(),
        COALESCE(agent_record.version, '1.0.0'),
        'verified',
        FALSE,
        COALESCE(agent_record.validation_status::validation_status, 'valid'),
        agent_record.setup_cost,
        agent_record.estimated_time,
        agent_record.estimated_cost,
        agent_record.time_savings,
        COALESCE(agent_record.downloads, 0),
        agent_record.rating,
        COALESCE(agent_record.popularity, 0),
        COALESCE(agent_record.verified, FALSE),
        agent_record.domain_primary,
        COALESCE(agent_record.domain_secondary, '{}'),
        COALESCE(agent_record.domain_confidences, '{}'),
        COALESCE(agent_record.domain_origin::domain_origin, 'admin'),
        agent_record.domain_last_updated,
        agent_record.score_overall,
        agent_record.score_category,
        agent_record.score_service,
        agent_record.score_trigger,
        agent_record.score_complexity,
        agent_record.score_integration,
        agent_record.score_confidence,
        COALESCE(agent_record.score_reasoning, '{}'),
        agent_record.match_score,
        COALESCE(agent_record.match_reasons, '{}'),
        COALESCE(agent_record.match_relevant_integrations, '{}'),
        agent_record.match_estimated_time_savings,
        agent_record.download_url,
        agent_record.preview_url,
        agent_record.thumbnail_url,
        COALESCE(agent_record.active, TRUE),
        agent_record.file_hash,
        agent_record.analyzed_at,
        agent_record.last_accessed,
        agent_record.cache_key
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        summary = EXCLUDED.summary,
        source = EXCLUDED.source,
        source_url = EXCLUDED.source_url,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        license = EXCLUDED.license,
        complexity = EXCLUDED.complexity,
        trigger_type = EXCLUDED.trigger_type,
        integrations = EXCLUDED.integrations,
        node_count = EXCLUDED.node_count,
        connection_count = EXCLUDED.connection_count,
        json_url = EXCLUDED.json_url,
        workflow_data = EXCLUDED.workflow_data,
        author_name = EXCLUDED.author_name,
        author_username = EXCLUDED.author_username,
        author_avatar = EXCLUDED.author_avatar,
        author_verified = EXCLUDED.author_verified,
        author_email = EXCLUDED.author_email,
        updated_at = NOW(),
        version = EXCLUDED.version,
        status = EXCLUDED.status,
        is_ai_generated = EXCLUDED.is_ai_generated,
        validation_status = EXCLUDED.validation_status,
        setup_cost = EXCLUDED.setup_cost,
        estimated_time = EXCLUDED.estimated_time,
        estimated_cost = EXCLUDED.estimated_cost,
        time_savings = EXCLUDED.time_savings,
        downloads = EXCLUDED.downloads,
        rating = EXCLUDED.rating,
        popularity = EXCLUDED.popularity,
        verified = EXCLUDED.verified,
        domain_primary = EXCLUDED.domain_primary,
        domain_secondary = EXCLUDED.domain_secondary,
        domain_confidences = EXCLUDED.domain_confidences,
        domain_origin = EXCLUDED.domain_origin,
        domain_last_updated = EXCLUDED.domain_last_updated,
        score_overall = EXCLUDED.score_overall,
        score_category = EXCLUDED.score_category,
        score_service = EXCLUDED.score_service,
        score_trigger = EXCLUDED.score_trigger,
        score_complexity = EXCLUDED.score_complexity,
        score_integration = EXCLUDED.score_integration,
        score_confidence = EXCLUDED.score_confidence,
        score_reasoning = EXCLUDED.score_reasoning,
        match_score = EXCLUDED.match_score,
        match_reasons = EXCLUDED.match_reasons,
        match_relevant_integrations = EXCLUDED.match_relevant_integrations,
        match_estimated_time_savings = EXCLUDED.match_estimated_time_savings,
        download_url = EXCLUDED.download_url,
        preview_url = EXCLUDED.preview_url,
        thumbnail_url = EXCLUDED.thumbnail_url,
        active = EXCLUDED.active,
        file_hash = EXCLUDED.file_hash,
        analyzed_at = EXCLUDED.analyzed_at,
        last_accessed = EXCLUDED.last_accessed,
        cache_key = EXCLUDED.cache_key;

      migrated_count := migrated_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate agent %: %', agent_record.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Migrated % agents from agent_cache to unified_workflows', migrated_count;
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to migrate all existing data
CREATE OR REPLACE FUNCTION migrate_all_existing_workflows()
RETURNS TABLE(
  source_table TEXT,
  migrated_count INTEGER
) AS $$
DECLARE
  workflow_count INTEGER;
  agent_count INTEGER;
BEGIN
  -- Migrate workflow_cache
  SELECT migrate_workflow_cache_to_unified() INTO workflow_count;
  
  -- Migrate agent_cache
  SELECT migrate_agent_cache_to_unified() INTO agent_count;
  
  -- Return results
  RETURN QUERY SELECT 'workflow_cache'::TEXT, workflow_count;
  RETURN QUERY SELECT 'agent_cache'::TEXT, agent_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate migration
CREATE OR REPLACE FUNCTION validate_migration()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check if unified_workflows table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_workflows') THEN
    RETURN QUERY SELECT 'unified_workflows_table'::TEXT, 'PASS'::TEXT, 'Table exists'::TEXT;
  ELSE
    RETURN QUERY SELECT 'unified_workflows_table'::TEXT, 'FAIL'::TEXT, 'Table does not exist'::TEXT;
  END IF;
  
  -- Check if there are any workflows in unified_workflows
  IF EXISTS (SELECT 1 FROM unified_workflows LIMIT 1) THEN
    RETURN QUERY SELECT 'unified_workflows_data'::TEXT, 'PASS'::TEXT, 
      'Contains ' || COUNT(*)::TEXT || ' workflows'::TEXT
    FROM unified_workflows;
  ELSE
    RETURN QUERY SELECT 'unified_workflows_data'::TEXT, 'FAIL'::TEXT, 'No data found'::TEXT;
  END IF;
  
  -- Check if all required fields are populated
  IF NOT EXISTS (SELECT 1 FROM unified_workflows WHERE id IS NULL OR title IS NULL OR description IS NULL) THEN
    RETURN QUERY SELECT 'required_fields'::TEXT, 'PASS'::TEXT, 'All required fields populated'::TEXT;
  ELSE
    RETURN QUERY SELECT 'required_fields'::TEXT, 'FAIL'::TEXT, 'Some required fields are NULL'::TEXT;
  END IF;
  
  -- Check if source types are valid
  IF NOT EXISTS (SELECT 1 FROM unified_workflows WHERE source NOT IN ('github', 'n8n.io', 'ai-generated', 'manual', 'api')) THEN
    RETURN QUERY SELECT 'source_types'::TEXT, 'PASS'::TEXT, 'All source types are valid'::TEXT;
  ELSE
    RETURN QUERY SELECT 'source_types'::TEXT, 'FAIL'::TEXT, 'Some source types are invalid'::TEXT;
  END IF;
  
  -- Check if complexity types are valid
  IF NOT EXISTS (SELECT 1 FROM unified_workflows WHERE complexity NOT IN ('Low', 'Medium', 'High', 'Easy', 'Hard')) THEN
    RETURN QUERY SELECT 'complexity_types'::TEXT, 'PASS'::TEXT, 'All complexity types are valid'::TEXT;
  ELSE
    RETURN QUERY SELECT 'complexity_types'::TEXT, 'FAIL'::TEXT, 'Some complexity types are invalid'::TEXT;
  END IF;
  
  -- Check if trigger types are valid
  IF NOT EXISTS (SELECT 1 FROM unified_workflows WHERE trigger_type NOT IN ('Manual', 'Webhook', 'Scheduled', 'Complex')) THEN
    RETURN QUERY SELECT 'trigger_types'::TEXT, 'PASS'::TEXT, 'All trigger types are valid'::TEXT;
  ELSE
    RETURN QUERY SELECT 'trigger_types'::TEXT, 'FAIL'::TEXT, 'Some trigger types are invalid'::TEXT;
  END IF;
  
  -- Check if status types are valid
  IF NOT EXISTS (SELECT 1 FROM unified_workflows WHERE status NOT IN ('generated', 'verified', 'fallback', 'loading')) THEN
    RETURN QUERY SELECT 'status_types'::TEXT, 'PASS'::TEXT, 'All status types are valid'::TEXT;
  ELSE
    RETURN QUERY SELECT 'status_types'::TEXT, 'FAIL'::TEXT, 'Some status types are invalid'::TEXT;
  END IF;
  
  -- Check if validation status types are valid
  IF NOT EXISTS (SELECT 1 FROM unified_workflows WHERE validation_status IS NOT NULL AND validation_status NOT IN ('valid', 'invalid', 'pending')) THEN
    RETURN QUERY SELECT 'validation_status_types'::TEXT, 'PASS'::TEXT, 'All validation status types are valid'::TEXT;
  ELSE
    RETURN QUERY SELECT 'validation_status_types'::TEXT, 'FAIL'::TEXT, 'Some validation status types are invalid'::TEXT;
  END IF;
  
  -- Check if domain origin types are valid
  IF NOT EXISTS (SELECT 1 FROM unified_workflows WHERE domain_origin IS NOT NULL AND domain_origin NOT IN ('llm', 'admin', 'mixed')) THEN
    RETURN QUERY SELECT 'domain_origin_types'::TEXT, 'PASS'::TEXT, 'All domain origin types are valid'::TEXT;
  ELSE
    RETURN QUERY SELECT 'domain_origin_types'::TEXT, 'FAIL'::TEXT, 'Some domain origin types are invalid'::TEXT;
  END IF;
  
  -- Check if ratings are within valid range
  IF NOT EXISTS (SELECT 1 FROM unified_workflows WHERE rating IS NOT NULL AND (rating < 0 OR rating > 5)) THEN
    RETURN QUERY SELECT 'rating_range'::TEXT, 'PASS'::TEXT, 'All ratings are within valid range (0-5)'::TEXT;
  ELSE
    RETURN QUERY SELECT 'rating_range'::TEXT, 'FAIL'::TEXT, 'Some ratings are outside valid range (0-5)'::TEXT;
  END IF;
  
  -- Check if popularity scores are within valid range
  IF NOT EXISTS (SELECT 1 FROM unified_workflows WHERE popularity IS NOT NULL AND (popularity < 0 OR popularity > 100)) THEN
    RETURN QUERY SELECT 'popularity_range'::TEXT, 'PASS'::TEXT, 'All popularity scores are within valid range (0-100)'::TEXT;
  ELSE
    RETURN QUERY SELECT 'popularity_range'::TEXT, 'FAIL'::TEXT, 'Some popularity scores are outside valid range (0-100)'::TEXT;
  END IF;
  
  -- Check if domain confidences are within valid range
  IF NOT EXISTS (SELECT 1 FROM unified_workflows WHERE domain_confidences IS NOT NULL AND array_length(domain_confidences, 1) > 0) THEN
    IF NOT EXISTS (
      SELECT 1 FROM unified_workflows, 
      LATERAL unnest(domain_confidences) as conf
      WHERE conf < 0 OR conf > 1
    ) THEN
      RETURN QUERY SELECT 'domain_confidences_range'::TEXT, 'PASS'::TEXT, 'All domain confidences are within valid range (0-1)'::TEXT;
    ELSE
      RETURN QUERY SELECT 'domain_confidences_range'::TEXT, 'FAIL'::TEXT, 'Some domain confidences are outside valid range (0-1)'::TEXT;
    END IF;
  ELSE
    RETURN QUERY SELECT 'domain_confidences_range'::TEXT, 'PASS'::TEXT, 'No domain confidences to validate'::TEXT;
  END IF;
  
  -- Check if domain secondary and confidences arrays have matching lengths
  IF NOT EXISTS (
    SELECT 1 FROM unified_workflows 
    WHERE domain_secondary IS NOT NULL 
    AND domain_confidences IS NOT NULL
    AND array_length(domain_secondary, 1) != array_length(domain_confidences, 1)
  ) THEN
    RETURN QUERY SELECT 'domain_arrays_length'::TEXT, 'PASS'::TEXT, 'Domain secondary and confidences arrays have matching lengths'::TEXT;
  ELSE
    RETURN QUERY SELECT 'domain_arrays_length'::TEXT, 'FAIL'::TEXT, 'Domain secondary and confidences arrays have mismatched lengths'::TEXT;
  END IF;
  
END;
$$ LANGUAGE plpgsql;

-- Create function to rollback migration (if needed)
CREATE OR REPLACE FUNCTION rollback_migration()
RETURNS TEXT AS $$
BEGIN
  -- Drop the unified_workflows table
  DROP TABLE IF EXISTS unified_workflows CASCADE;
  
  -- Drop the views
  DROP VIEW IF EXISTS unified_workflows_stats CASCADE;
  DROP VIEW IF EXISTS unified_workflows_top_categories CASCADE;
  DROP VIEW IF EXISTS unified_workflows_top_integrations CASCADE;
  DROP VIEW IF EXISTS unified_workflows_recent CASCADE;
  DROP VIEW IF EXISTS unified_workflows_popular CASCADE;
  DROP VIEW IF EXISTS unified_workflows_ai_generated CASCADE;
  
  -- Drop the functions
  DROP FUNCTION IF EXISTS migrate_workflow_cache_to_unified();
  DROP FUNCTION IF EXISTS migrate_agent_cache_to_unified();
  DROP FUNCTION IF EXISTS migrate_all_existing_workflows();
  DROP FUNCTION IF EXISTS validate_migration();
  DROP FUNCTION IF EXISTS rollback_migration();
  
  -- Drop the triggers
  DROP TRIGGER IF EXISTS trigger_update_unified_workflows_updated_at ON unified_workflows;
  DROP TRIGGER IF EXISTS trigger_update_unified_workflows_last_accessed ON unified_workflows;
  DROP TRIGGER IF EXISTS trigger_validate_domain_confidences ON unified_workflows;
  DROP TRIGGER IF EXISTS trigger_calculate_popularity_score ON unified_workflows;
  
  -- Drop the trigger functions
  DROP FUNCTION IF EXISTS update_unified_workflows_updated_at();
  DROP FUNCTION IF EXISTS update_unified_workflows_last_accessed();
  DROP FUNCTION IF EXISTS validate_domain_confidences();
  DROP FUNCTION IF EXISTS calculate_popularity_score();
  
  -- Drop the enum types
  DROP TYPE IF EXISTS complexity_type CASCADE;
  DROP TYPE IF EXISTS trigger_type CASCADE;
  DROP TYPE IF EXISTS solution_status CASCADE;
  DROP TYPE IF EXISTS source_type CASCADE;
  DROP TYPE IF EXISTS validation_status CASCADE;
  DROP TYPE IF EXISTS domain_origin CASCADE;
  
  RETURN 'Migration rolled back successfully';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION migrate_workflow_cache_to_unified() IS 'Migrates data from workflow_cache table to unified_workflows table';
COMMENT ON FUNCTION migrate_agent_cache_to_unified() IS 'Migrates data from agent_cache table to unified_workflows table';
COMMENT ON FUNCTION migrate_all_existing_workflows() IS 'Migrates all existing workflow and agent data to unified_workflows table';
COMMENT ON FUNCTION validate_migration() IS 'Validates the migration by checking data integrity and constraints';
COMMENT ON FUNCTION rollback_migration() IS 'Rolls back the migration by dropping all created objects';

-- Execute the migration
SELECT migrate_all_existing_workflows();

-- Validate the migration
SELECT * FROM validate_migration();
