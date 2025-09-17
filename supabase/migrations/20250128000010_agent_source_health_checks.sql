-- Migration: Create agent source health check system
-- This migration creates tables and functions for monitoring agent source health

-- ============================================================================
-- 1. AGENT SOURCES TABLE
-- ============================================================================

-- Create agent_sources table for managing agent source configurations
CREATE TABLE IF NOT EXISTS agent_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('huggingface', 'crewai', 'github', 'custom')),
    base_url TEXT NOT NULL,
    api_endpoint TEXT,
    health_endpoint TEXT,
    expected_data_size_min INTEGER,
    expected_data_size_max INTEGER,
    timeout_ms INTEGER DEFAULT 10000,
    retry_attempts INTEGER DEFAULT 3,
    backoff_multiplier NUMERIC(3,2) DEFAULT 2.0,
    max_backoff_ms INTEGER DEFAULT 30000,
    enabled BOOLEAN DEFAULT TRUE,
    last_health_check TIMESTAMPTZ,
    last_successful_check TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    health_status VARCHAR(20) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_sources
CREATE INDEX IF NOT EXISTS idx_agent_sources_type ON agent_sources(type);
CREATE INDEX IF NOT EXISTS idx_agent_sources_enabled ON agent_sources(enabled);
CREATE INDEX IF NOT EXISTS idx_agent_sources_health_status ON agent_sources(health_status);
CREATE INDEX IF NOT EXISTS idx_agent_sources_consecutive_failures ON agent_sources(consecutive_failures);
CREATE INDEX IF NOT EXISTS idx_agent_sources_last_health_check ON agent_sources(last_health_check);

-- ============================================================================
-- 2. AGENT SOURCE HEALTH CHECKS TABLE
-- ============================================================================

-- Create agent_source_health_checks table for storing health check results
CREATE TABLE IF NOT EXISTS agent_source_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES agent_sources(id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'warning', 'error')),
    response_time_ms INTEGER NOT NULL,
    data_size INTEGER,
    data_size_status VARCHAR(20) CHECK (data_size_status IN ('normal', 'too_small', 'too_large', 'unknown')),
    error_message TEXT,
    warning_message TEXT,
    http_status_code INTEGER,
    headers JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_source_health_checks
CREATE INDEX IF NOT EXISTS idx_health_checks_source_id ON agent_source_health_checks(source_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON agent_source_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON agent_source_health_checks(timestamp);
CREATE INDEX IF NOT EXISTS idx_health_checks_source_type ON agent_source_health_checks(source_type);
CREATE INDEX IF NOT EXISTS idx_health_checks_response_time ON agent_source_health_checks(response_time_ms);

-- ============================================================================
-- 3. AGENT SOURCE UPDATE SCHEDULE TABLE
-- ============================================================================

-- Create agent_source_update_schedule table for managing incremental updates
CREATE TABLE IF NOT EXISTS agent_source_update_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES agent_sources(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('periodic', 'on_demand', 'health_based')),
    interval_minutes INTEGER NOT NULL,
    last_update TIMESTAMPTZ,
    next_update TIMESTAMPTZ,
    update_status VARCHAR(20) DEFAULT 'pending' CHECK (update_status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    update_duration_ms INTEGER,
    records_processed INTEGER DEFAULT 0,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_removed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_source_update_schedule
CREATE INDEX IF NOT EXISTS idx_update_schedule_source_id ON agent_source_update_schedule(source_id);
CREATE INDEX IF NOT EXISTS idx_update_schedule_next_update ON agent_source_update_schedule(next_update);
CREATE INDEX IF NOT EXISTS idx_update_schedule_status ON agent_source_update_schedule(update_status);
CREATE INDEX IF NOT EXISTS idx_update_schedule_type ON agent_source_update_schedule(schedule_type);

-- ============================================================================
-- 4. HEALTH CHECK FUNCTIONS
-- ============================================================================

-- Function to get agent source health statistics
CREATE OR REPLACE FUNCTION get_agent_source_health_stats(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    source_id UUID,
    source_name VARCHAR(255),
    source_type VARCHAR(50),
    health_status VARCHAR(20),
    total_checks BIGINT,
    successful_checks BIGINT,
    warning_checks BIGINT,
    failed_checks BIGINT,
    avg_response_time_ms NUMERIC,
    last_check TIMESTAMPTZ,
    consecutive_failures INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as source_id,
        s.name as source_name,
        s.type as source_type,
        s.health_status,
        COUNT(h.id) as total_checks,
        COUNT(h.id) FILTER (WHERE h.status = 'success') as successful_checks,
        COUNT(h.id) FILTER (WHERE h.status = 'warning') as warning_checks,
        COUNT(h.id) FILTER (WHERE h.status = 'error') as failed_checks,
        AVG(h.response_time_ms) as avg_response_time_ms,
        MAX(h.timestamp) as last_check,
        s.consecutive_failures
    FROM agent_sources s
    LEFT JOIN agent_source_health_checks h ON s.id = h.source_id
        AND h.timestamp >= NOW() - INTERVAL '1 hour' * p_hours_back
    WHERE s.enabled = true
    GROUP BY s.id, s.name, s.type, s.health_status, s.consecutive_failures
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get health check summary
CREATE OR REPLACE FUNCTION get_health_check_summary(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_sources BIGINT,
    healthy_sources BIGINT,
    degraded_sources BIGINT,
    unhealthy_sources BIGINT,
    total_checks BIGINT,
    successful_checks BIGINT,
    warning_checks BIGINT,
    failed_checks BIGINT,
    avg_response_time_ms NUMERIC,
    sources_needing_attention BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT s.id) as total_sources,
        COUNT(DISTINCT s.id) FILTER (WHERE s.health_status = 'healthy') as healthy_sources,
        COUNT(DISTINCT s.id) FILTER (WHERE s.health_status = 'degraded') as degraded_sources,
        COUNT(DISTINCT s.id) FILTER (WHERE s.health_status = 'unhealthy') as unhealthy_sources,
        COUNT(h.id) as total_checks,
        COUNT(h.id) FILTER (WHERE h.status = 'success') as successful_checks,
        COUNT(h.id) FILTER (WHERE h.status = 'warning') as warning_checks,
        COUNT(h.id) FILTER (WHERE h.status = 'error') as failed_checks,
        AVG(h.response_time_ms) as avg_response_time_ms,
        COUNT(DISTINCT s.id) FILTER (WHERE s.health_status IN ('degraded', 'unhealthy') OR s.consecutive_failures >= 3) as sources_needing_attention
    FROM agent_sources s
    LEFT JOIN agent_source_health_checks h ON s.id = h.source_id
        AND h.timestamp >= NOW() - INTERVAL '1 hour' * p_hours_back
    WHERE s.enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent health check failures
CREATE OR REPLACE FUNCTION get_recent_health_check_failures(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    source_name VARCHAR(255),
    source_type VARCHAR(50),
    status VARCHAR(20),
    response_time_ms INTEGER,
    error_message TEXT,
    timestamp TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.source_name,
        h.source_type,
        h.status,
        h.response_time_ms,
        h.error_message,
        h.timestamp
    FROM agent_source_health_checks h
    WHERE h.status = 'error'
    ORDER BY h.timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update source health status
CREATE OR REPLACE FUNCTION update_source_health_status(
    p_source_id UUID,
    p_health_status VARCHAR(20),
    p_consecutive_failures INTEGER DEFAULT NULL,
    p_last_successful_check TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE agent_sources 
    SET 
        health_status = p_health_status,
        consecutive_failures = COALESCE(p_consecutive_failures, consecutive_failures),
        last_successful_check = COALESCE(p_last_successful_check, last_successful_check),
        last_health_check = NOW(),
        updated_at = NOW()
    WHERE id = p_source_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get sources needing attention
CREATE OR REPLACE FUNCTION get_sources_needing_attention()
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    type VARCHAR(50),
    health_status VARCHAR(20),
    consecutive_failures INTEGER,
    last_health_check TIMESTAMPTZ,
    last_successful_check TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.type,
        s.health_status,
        s.consecutive_failures,
        s.last_health_check,
        s.last_successful_check
    FROM agent_sources s
    WHERE s.enabled = true
    AND (
        s.health_status IN ('degraded', 'unhealthy')
        OR s.consecutive_failures >= 3
        OR s.last_health_check IS NULL
        OR s.last_health_check < NOW() - INTERVAL '1 hour'
    )
    ORDER BY s.consecutive_failures DESC, s.last_health_check ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. UPDATE SCHEDULE FUNCTIONS
-- ============================================================================

-- Function to get pending updates
CREATE OR REPLACE FUNCTION get_pending_updates(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    source_id UUID,
    source_name VARCHAR(255),
    schedule_type VARCHAR(50),
    interval_minutes INTEGER,
    next_update TIMESTAMPTZ,
    last_update TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.source_id,
        a.name as source_name,
        s.schedule_type,
        s.interval_minutes,
        s.next_update,
        s.last_update
    FROM agent_source_update_schedule s
    JOIN agent_sources a ON s.source_id = a.id
    WHERE s.update_status = 'pending'
    AND s.next_update <= NOW()
    AND a.enabled = true
    AND a.health_status != 'unhealthy'
    ORDER BY s.next_update ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update schedule status
CREATE OR REPLACE FUNCTION update_schedule_status(
    p_schedule_id UUID,
    p_status VARCHAR(20),
    p_records_processed INTEGER DEFAULT NULL,
    p_records_added INTEGER DEFAULT NULL,
    p_records_updated INTEGER DEFAULT NULL,
    p_records_removed INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE agent_source_update_schedule 
    SET 
        update_status = p_status,
        records_processed = COALESCE(p_records_processed, records_processed),
        records_added = COALESCE(p_records_added, records_added),
        records_updated = COALESCE(p_records_updated, records_updated),
        records_removed = COALESCE(p_records_removed, records_removed),
        error_message = p_error_message,
        updated_at = NOW(),
        last_update = CASE WHEN p_status = 'completed' THEN NOW() ELSE last_update END,
        next_update = CASE 
            WHEN p_status = 'completed' THEN NOW() + INTERVAL '1 minute' * interval_minutes
            ELSE next_update
        END
    WHERE id = p_schedule_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS trigger_update_agent_sources_updated_at ON agent_sources;
CREATE TRIGGER trigger_update_agent_sources_updated_at
    BEFORE UPDATE ON agent_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_update_schedule_updated_at ON agent_source_update_schedule;
CREATE TRIGGER trigger_update_update_schedule_updated_at
    BEFORE UPDATE ON agent_source_update_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE agent_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_source_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_source_update_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_sources
DROP POLICY IF EXISTS "Allow read access to agent sources" ON agent_sources;
CREATE POLICY "Allow read access to agent sources" ON agent_sources
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to agent sources" ON agent_sources;
CREATE POLICY "Allow insert access to agent sources" ON agent_sources
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to agent sources" ON agent_sources;
CREATE POLICY "Allow update access to agent sources" ON agent_sources
    FOR UPDATE USING (true);

-- Create policies for agent_source_health_checks
DROP POLICY IF EXISTS "Allow read access to health checks" ON agent_source_health_checks;
CREATE POLICY "Allow read access to health checks" ON agent_source_health_checks
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to health checks" ON agent_source_health_checks;
CREATE POLICY "Allow insert access to health checks" ON agent_source_health_checks
    FOR INSERT WITH CHECK (true);

-- Create policies for agent_source_update_schedule
DROP POLICY IF EXISTS "Allow read access to update schedule" ON agent_source_update_schedule;
CREATE POLICY "Allow read access to update schedule" ON agent_source_update_schedule
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to update schedule" ON agent_source_update_schedule;
CREATE POLICY "Allow insert access to update schedule" ON agent_source_update_schedule
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to update schedule" ON agent_source_update_schedule;
CREATE POLICY "Allow update access to update schedule" ON agent_source_update_schedule
    FOR UPDATE USING (true);

-- ============================================================================
-- 8. SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert default agent sources
INSERT INTO agent_sources (
    name,
    type,
    base_url,
    api_endpoint,
    health_endpoint,
    expected_data_size_min,
    expected_data_size_max,
    timeout_ms,
    retry_attempts,
    backoff_multiplier,
    max_backoff_ms,
    enabled,
    health_status
) VALUES 
(
    'HuggingFace Spaces',
    'huggingface',
    'https://huggingface.co',
    'https://huggingface.co/api/spaces',
    'https://huggingface.co/api/spaces?limit=1',
    1000,
    100000,
    15000,
    3,
    2.0,
    30000,
    true,
    'unknown'
),
(
    'CrewAI Examples',
    'crewai',
    'https://github.com',
    'https://api.github.com/repos/joaomdmoura/crewAI-examples',
    'https://api.github.com/repos/joaomdmoura/crewAI-examples',
    500,
    50000,
    10000,
    3,
    2.0,
    30000,
    true,
    'unknown'
),
(
    'GitHub Agent Repositories',
    'github',
    'https://github.com',
    'https://api.github.com/search/repositories',
    'https://api.github.com/search/repositories?q=AI+agent&per_page=1',
    1000,
    100000,
    10000,
    3,
    2.0,
    30000,
    true,
    'unknown'
);

-- Insert sample health check results
INSERT INTO agent_source_health_checks (
    source_id,
    source_name,
    source_type,
    status,
    response_time_ms,
    data_size,
    data_size_status,
    http_status_code
) 
SELECT 
    s.id,
    s.name,
    s.type,
    CASE 
        WHEN s.name = 'HuggingFace Spaces' THEN 'success'
        WHEN s.name = 'CrewAI Examples' THEN 'warning'
        ELSE 'error'
    END,
    CASE 
        WHEN s.name = 'HuggingFace Spaces' THEN 1200
        WHEN s.name = 'CrewAI Examples' THEN 3500
        ELSE 8000
    END,
    CASE 
        WHEN s.name = 'HuggingFace Spaces' THEN 50000
        WHEN s.name = 'CrewAI Examples' THEN 300
        ELSE NULL
    END,
    CASE 
        WHEN s.name = 'HuggingFace Spaces' THEN 'normal'
        WHEN s.name = 'CrewAI Examples' THEN 'too_small'
        ELSE 'unknown'
    END,
    CASE 
        WHEN s.name = 'HuggingFace Spaces' THEN 200
        WHEN s.name = 'CrewAI Examples' THEN 200
        ELSE 500
    END
FROM agent_sources s;

-- Insert sample update schedules
INSERT INTO agent_source_update_schedule (
    source_id,
    schedule_type,
    interval_minutes,
    next_update,
    update_status
)
SELECT 
    s.id,
    'periodic',
    CASE 
        WHEN s.name = 'HuggingFace Spaces' THEN 60
        WHEN s.name = 'CrewAI Examples' THEN 120
        ELSE 240
    END,
    NOW() + INTERVAL '1 hour',
    'pending'
FROM agent_sources s;

-- ============================================================================
-- 9. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE agent_sources IS 'Configuration and health status for agent data sources';
COMMENT ON TABLE agent_source_health_checks IS 'Health check results and monitoring data for agent sources';
COMMENT ON TABLE agent_source_update_schedule IS 'Scheduling and tracking of incremental updates for agent sources';

COMMENT ON FUNCTION get_agent_source_health_stats(INTEGER) IS 'Get comprehensive health statistics for all agent sources';
COMMENT ON FUNCTION get_health_check_summary(INTEGER) IS 'Get overall health check summary and metrics';
COMMENT ON FUNCTION get_recent_health_check_failures(INTEGER) IS 'Get recent health check failures for troubleshooting';
COMMENT ON FUNCTION update_source_health_status(UUID, VARCHAR, INTEGER, TIMESTAMPTZ) IS 'Update agent source health status and failure counts';
COMMENT ON FUNCTION get_sources_needing_attention() IS 'Get agent sources that need attention due to health issues';
COMMENT ON FUNCTION get_pending_updates(INTEGER) IS 'Get pending incremental updates for agent sources';
COMMENT ON FUNCTION update_schedule_status(UUID, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) IS 'Update incremental update schedule status and results';

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Verify tables are created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('agent_sources', 'agent_source_health_checks', 'agent_source_update_schedule');
    
    IF table_count = 3 THEN
        RAISE NOTICE 'Agent source health check tables created successfully: % tables', table_count;
    ELSE
        RAISE WARNING 'Expected 3 agent source health check tables, found %', table_count;
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
    AND routine_name IN (
        'get_agent_source_health_stats', 'get_health_check_summary', 'get_recent_health_check_failures',
        'update_source_health_status', 'get_sources_needing_attention',
        'get_pending_updates', 'update_schedule_status'
    );
    
    IF function_count = 7 THEN
        RAISE NOTICE 'Agent source health check functions created successfully: % functions', function_count;
    ELSE
        RAISE WARNING 'Expected 7 agent source health check functions, found %', function_count;
    END IF;
END $$;

-- Verify sample data
DO $$
DECLARE
    sources_count INTEGER;
    health_checks_count INTEGER;
    schedules_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO sources_count FROM agent_sources;
    SELECT COUNT(*) INTO health_checks_count FROM agent_source_health_checks;
    SELECT COUNT(*) INTO schedules_count FROM agent_source_update_schedule;
    
    IF sources_count >= 3 AND health_checks_count >= 3 AND schedules_count >= 3 THEN
        RAISE NOTICE 'Sample data inserted successfully: % sources, % health checks, % schedules', sources_count, health_checks_count, schedules_count;
    ELSE
        RAISE WARNING 'Sample data incomplete: % sources, % health checks, % schedules', sources_count, health_checks_count, schedules_count;
    END IF;
END $$;
