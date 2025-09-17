-- Migration: Update Cache Versioning for Admin System
-- This migration updates the cache versioning system to support admin system components

-- ============================================================================
-- 1. UPDATE EXISTING CACHE ENTRIES
-- ============================================================================

-- Update existing workflow_cache entries to include admin system versioning
UPDATE workflow_cache 
SET 
    admin_system_version = '1.0.0',
    cache_type = 'workflow',
    updated_at = NOW()
WHERE admin_system_version IS NULL OR cache_type IS NULL;

-- ============================================================================
-- 2. CREATE CACHE VERSIONING FUNCTIONS
-- ============================================================================

-- Function to get cache versioning information
CREATE OR REPLACE FUNCTION get_cache_versioning_info()
RETURNS TABLE (
    current_version VARCHAR(10),
    admin_system_version VARCHAR(10),
    cache_type VARCHAR(50),
    total_entries BIGINT,
    entries_by_type JSONB,
    entries_by_version JSONB,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wc.version as current_version,
        wc.admin_system_version,
        wc.cache_type,
        COUNT(*) as total_entries,
        jsonb_object_agg(wc.cache_type, type_count) as entries_by_type,
        jsonb_object_agg(wc.admin_system_version, version_count) as entries_by_version,
        MAX(wc.updated_at) as last_updated
    FROM workflow_cache wc
    CROSS JOIN (
        SELECT 
            cache_type,
            COUNT(*) as type_count
        FROM workflow_cache
        GROUP BY cache_type
    ) type_stats
    CROSS JOIN (
        SELECT 
            admin_system_version,
            COUNT(*) as version_count
        FROM workflow_cache
        GROUP BY admin_system_version
    ) version_stats
    GROUP BY wc.version, wc.admin_system_version, wc.cache_type;
END;
$$ LANGUAGE plpgsql;

-- Function to update cache version
CREATE OR REPLACE FUNCTION update_cache_version(
    p_version VARCHAR(10),
    p_admin_system_version VARCHAR(10) DEFAULT NULL,
    p_cache_type VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE workflow_cache 
    SET 
        version = p_version,
        admin_system_version = COALESCE(p_admin_system_version, admin_system_version),
        cache_type = COALESCE(p_cache_type, cache_type),
        updated_at = NOW()
    WHERE version != p_version 
       OR (p_admin_system_version IS NOT NULL AND admin_system_version != p_admin_system_version)
       OR (p_cache_type IS NOT NULL AND cache_type != p_cache_type);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get cache entries by version and type
CREATE OR REPLACE FUNCTION get_cache_entries_by_version(
    p_version VARCHAR(10) DEFAULT NULL,
    p_admin_system_version VARCHAR(10) DEFAULT NULL,
    p_cache_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    id INTEGER,
    version VARCHAR(10),
    admin_system_version VARCHAR(10),
    cache_type VARCHAR(50),
    workflows JSONB,
    stats JSONB,
    last_fetch_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wc.id,
        wc.version,
        wc.admin_system_version,
        wc.cache_type,
        wc.workflows,
        wc.stats,
        wc.last_fetch_time,
        wc.created_at,
        wc.updated_at
    FROM workflow_cache wc
    WHERE (p_version IS NULL OR wc.version = p_version)
      AND (p_admin_system_version IS NULL OR wc.admin_system_version = p_admin_system_version)
      AND (p_cache_type IS NULL OR wc.cache_type = p_cache_type)
    ORDER BY wc.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old cache entries
CREATE OR REPLACE FUNCTION cleanup_old_cache_entries(
    p_keep_versions INTEGER DEFAULT 3,
    p_older_than_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old cache entries, keeping only the most recent versions
    WITH ranked_entries AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY cache_type ORDER BY updated_at DESC) as rn
        FROM workflow_cache
        WHERE updated_at < NOW() - INTERVAL '1 day' * p_older_than_days
    )
    DELETE FROM workflow_cache 
    WHERE id IN (
        SELECT id 
        FROM ranked_entries 
        WHERE rn > p_keep_versions
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. CREATE CACHE VERSIONING VIEWS
-- ============================================================================

-- View for cache versioning summary
CREATE OR REPLACE VIEW cache_versioning_summary AS
SELECT 
    version,
    admin_system_version,
    cache_type,
    COUNT(*) as entry_count,
    MIN(created_at) as first_created,
    MAX(updated_at) as last_updated,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_age_hours
FROM workflow_cache
GROUP BY version, admin_system_version, cache_type
ORDER BY last_updated DESC;

-- View for cache health monitoring
CREATE OR REPLACE VIEW cache_health_monitor AS
SELECT 
    cache_type,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 day') as recent_entries,
    COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '7 days') as stale_entries,
    MIN(updated_at) as oldest_entry,
    MAX(updated_at) as newest_entry,
    AVG(EXTRACT(EPOCH FROM (NOW() - updated_at))/3600) as avg_age_hours
FROM workflow_cache
GROUP BY cache_type
ORDER BY total_entries DESC;

-- ============================================================================
-- 4. CREATE CACHE VERSIONING TRIGGERS
-- ============================================================================

-- Function to automatically update admin_system_version on insert/update
CREATE OR REPLACE FUNCTION update_cache_admin_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default admin_system_version if not provided
    IF NEW.admin_system_version IS NULL THEN
        NEW.admin_system_version = '1.0.0';
    END IF;
    
    -- Set default cache_type if not provided
    IF NEW.cache_type IS NULL THEN
        NEW.cache_type = 'workflow';
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic version updates
DROP TRIGGER IF EXISTS trigger_update_cache_admin_version ON workflow_cache;
CREATE TRIGGER trigger_update_cache_admin_version
    BEFORE INSERT OR UPDATE ON workflow_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_cache_admin_version();

-- ============================================================================
-- 5. CREATE CACHE VERSIONING POLICIES
-- ============================================================================

-- Update RLS policies to include version-based access
DROP POLICY IF EXISTS "Allow read access to workflow cache" ON workflow_cache;
CREATE POLICY "Allow read access to workflow cache" ON workflow_cache
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage workflow cache" ON workflow_cache;
CREATE POLICY "Allow authenticated users to manage workflow cache" ON workflow_cache
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- 6. INSERT SAMPLE CACHE VERSIONING DATA
-- ============================================================================

-- Insert sample cache entries with different versions for testing
INSERT INTO workflow_cache (
    version,
    admin_system_version,
    cache_type,
    workflows,
    stats,
    last_fetch_time
) VALUES 
(
    '1.0.0',
    '1.0.0',
    'workflow',
    '{"sample": "workflow data"}'::jsonb,
    '{"total": 100, "last_updated": "2025-01-28T12:00:00Z"}'::jsonb,
    NOW()
),
(
    '1.1.0',
    '1.0.0',
    'workflow',
    '{"sample": "updated workflow data"}'::jsonb,
    '{"total": 150, "last_updated": "2025-01-28T13:00:00Z"}'::jsonb,
    NOW()
),
(
    '1.0.0',
    '1.1.0',
    'agent',
    '{"sample": "agent data"}'::jsonb,
    '{"total": 50, "last_updated": "2025-01-28T14:00:00Z"}'::jsonb,
    NOW()
)
ON CONFLICT (version, source) DO NOTHING;

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- Verify cache versioning update
DO $$
DECLARE
    updated_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM workflow_cache 
    WHERE admin_system_version IS NOT NULL AND cache_type IS NOT NULL;
    
    SELECT COUNT(*) INTO total_count FROM workflow_cache;
    
    IF updated_count = total_count THEN
        RAISE NOTICE 'Cache versioning update successful: %/% entries updated', updated_count, total_count;
    ELSE
        RAISE WARNING 'Cache versioning update incomplete: %/% entries updated', updated_count, total_count;
    END IF;
END $$;

-- Verify functions are created
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_cache_versioning_info', 'update_cache_version', 'get_cache_entries_by_version', 'cleanup_old_cache_entries');
    
    IF function_count = 4 THEN
        RAISE NOTICE 'Cache versioning functions created successfully: % functions', function_count;
    ELSE
        RAISE WARNING 'Expected 4 cache versioning functions, found %', function_count;
    END IF;
END $$;

-- Verify views are created
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name IN ('cache_versioning_summary', 'cache_health_monitor');
    
    IF view_count = 2 THEN
        RAISE NOTICE 'Cache versioning views created successfully: % views', view_count;
    ELSE
        RAISE WARNING 'Expected 2 cache versioning views, found %', view_count;
    END IF;
END $$;

-- ============================================================================
-- 8. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_cache_versioning_info() IS 'Get comprehensive cache versioning information';
COMMENT ON FUNCTION update_cache_version(VARCHAR, VARCHAR, VARCHAR) IS 'Update cache version and admin system version';
COMMENT ON FUNCTION get_cache_entries_by_version(VARCHAR, VARCHAR, VARCHAR) IS 'Get cache entries filtered by version and type';
COMMENT ON FUNCTION cleanup_old_cache_entries(INTEGER, INTEGER) IS 'Clean up old cache entries, keeping specified number of recent versions';

COMMENT ON VIEW cache_versioning_summary IS 'Summary of cache entries by version and type';
COMMENT ON VIEW cache_health_monitor IS 'Monitor cache health and staleness';

-- ============================================================================
-- 9. PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Create additional indexes for cache versioning queries
CREATE INDEX IF NOT EXISTS idx_workflow_cache_admin_version_type ON workflow_cache(admin_system_version, cache_type);
CREATE INDEX IF NOT EXISTS idx_workflow_cache_updated_at_desc ON workflow_cache(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_cache_version_admin_version ON workflow_cache(version, admin_system_version);

-- Analyze tables for better query planning
ANALYZE workflow_cache;
