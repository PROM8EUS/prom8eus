-- Migration: Create enrichment pipeline tables and functions
-- This migration creates the necessary tables and functions for the LLM enrichment pipeline

-- ============================================================================
-- 1. ENRICHMENT CACHE TABLE
-- ============================================================================

-- Create enrichment_cache table for caching LLM enrichment results
CREATE TABLE IF NOT EXISTS enrichment_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash VARCHAR(64) NOT NULL,
    enrichment_type VARCHAR(50) NOT NULL CHECK (enrichment_type IN ('summary', 'categories', 'capabilities', 'domains')),
    solution_id TEXT NOT NULL,
    solution_type TEXT NOT NULL CHECK (solution_type IN ('workflow', 'agent')),
    result JSONB NOT NULL,
    llm_model VARCHAR(50) NOT NULL DEFAULT 'gpt-4o-mini',
    llm_tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_hash, enrichment_type)
);

-- Create indexes for enrichment_cache
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_content_hash ON enrichment_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_enrichment_type ON enrichment_cache(enrichment_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_solution_id ON enrichment_cache(solution_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_solution_type ON enrichment_cache(solution_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_created_at ON enrichment_cache(created_at);

-- ============================================================================
-- 2. ENRICHMENT LOGS TABLE
-- ============================================================================

-- Create enrichment_logs table for tracking enrichment activities
CREATE TABLE IF NOT EXISTS enrichment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id TEXT NOT NULL,
    solution_type TEXT NOT NULL CHECK (solution_type IN ('workflow', 'agent')),
    enrichment_type VARCHAR(50) NOT NULL CHECK (enrichment_type IN ('summary', 'categories', 'capabilities', 'domains')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'cached', 'skipped')),
    content_hash VARCHAR(64) NOT NULL,
    processing_time_ms INTEGER DEFAULT 0,
    llm_tokens_used INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for enrichment_logs
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_solution_id ON enrichment_logs(solution_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_solution_type ON enrichment_logs(solution_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_enrichment_type ON enrichment_logs(enrichment_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_status ON enrichment_logs(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_created_at ON enrichment_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_content_hash ON enrichment_logs(content_hash);

-- ============================================================================
-- 3. ENRICHMENT TRIGGERS TABLE
-- ============================================================================

-- Create enrichment_triggers table for managing enrichment triggers
CREATE TABLE IF NOT EXISTS enrichment_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id TEXT NOT NULL,
    solution_type TEXT NOT NULL CHECK (solution_type IN ('workflow', 'agent')),
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('first_import', 'admin_refresh', 'manual', 'scheduled')),
    enrichment_types TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority INTEGER DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for enrichment_triggers
CREATE INDEX IF NOT EXISTS idx_enrichment_triggers_solution_id ON enrichment_triggers(solution_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_triggers_solution_type ON enrichment_triggers(solution_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_triggers_trigger_type ON enrichment_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_triggers_status ON enrichment_triggers(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_triggers_priority ON enrichment_triggers(priority);
CREATE INDEX IF NOT EXISTS idx_enrichment_triggers_scheduled_at ON enrichment_triggers(scheduled_at);

-- ============================================================================
-- 4. ENRICHMENT FUNCTIONS
-- ============================================================================

-- Function to get enrichment cache entry
CREATE OR REPLACE FUNCTION get_enrichment_cache(
    p_content_hash VARCHAR(64),
    p_enrichment_type VARCHAR(50)
)
RETURNS TABLE (
    id UUID,
    content_hash VARCHAR(64),
    enrichment_type VARCHAR(50),
    solution_id TEXT,
    solution_type TEXT,
    result JSONB,
    llm_model VARCHAR(50),
    llm_tokens_used INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id,
        ec.content_hash,
        ec.enrichment_type,
        ec.solution_id,
        ec.solution_type,
        ec.result,
        ec.llm_model,
        ec.llm_tokens_used,
        ec.processing_time_ms,
        ec.created_at,
        ec.updated_at
    FROM enrichment_cache ec
    WHERE ec.content_hash = p_content_hash
    AND ec.enrichment_type = p_enrichment_type;
END;
$$ LANGUAGE plpgsql;

-- Function to cache enrichment result
CREATE OR REPLACE FUNCTION cache_enrichment_result(
    p_content_hash VARCHAR(64),
    p_enrichment_type VARCHAR(50),
    p_solution_id TEXT,
    p_solution_type TEXT,
    p_result JSONB,
    p_llm_model VARCHAR(50),
    p_llm_tokens_used INTEGER,
    p_processing_time_ms INTEGER
)
RETURNS UUID AS $$
DECLARE
    cache_id UUID;
BEGIN
    INSERT INTO enrichment_cache (
        content_hash,
        enrichment_type,
        solution_id,
        solution_type,
        result,
        llm_model,
        llm_tokens_used,
        processing_time_ms
    ) VALUES (
        p_content_hash,
        p_enrichment_type,
        p_solution_id,
        p_solution_type,
        p_result,
        p_llm_model,
        p_llm_tokens_used,
        p_processing_time_ms
    ) 
    ON CONFLICT (content_hash, enrichment_type) 
    DO UPDATE SET
        result = EXCLUDED.result,
        llm_model = EXCLUDED.llm_model,
        llm_tokens_used = EXCLUDED.llm_tokens_used,
        processing_time_ms = EXCLUDED.processing_time_ms,
        updated_at = NOW()
    RETURNING id INTO cache_id;
    
    RETURN cache_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log enrichment activity
CREATE OR REPLACE FUNCTION log_enrichment_activity(
    p_solution_id TEXT,
    p_solution_type TEXT,
    p_enrichment_type VARCHAR(50),
    p_status VARCHAR(20),
    p_content_hash VARCHAR(64),
    p_processing_time_ms INTEGER,
    p_llm_tokens_used INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO enrichment_logs (
        solution_id,
        solution_type,
        enrichment_type,
        status,
        content_hash,
        processing_time_ms,
        llm_tokens_used,
        error_message
    ) VALUES (
        p_solution_id,
        p_solution_type,
        p_enrichment_type,
        p_status,
        p_content_hash,
        p_processing_time_ms,
        p_llm_tokens_used,
        p_error_message
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get enrichment statistics
CREATE OR REPLACE FUNCTION get_enrichment_statistics()
RETURNS TABLE (
    total_enrichments BIGINT,
    successful_enrichments BIGINT,
    cached_enrichments BIGINT,
    failed_enrichments BIGINT,
    total_tokens_used BIGINT,
    avg_processing_time_ms NUMERIC,
    enrichment_types JSONB,
    solution_types JSONB,
    status_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_enrichments,
        COUNT(*) FILTER (WHERE status = 'success') as successful_enrichments,
        COUNT(*) FILTER (WHERE status = 'cached') as cached_enrichments,
        COUNT(*) FILTER (WHERE status = 'error') as failed_enrichments,
        SUM(COALESCE(llm_tokens_used, 0)) as total_tokens_used,
        AVG(processing_time_ms) as avg_processing_time_ms,
        jsonb_object_agg(enrichment_type, type_count) as enrichment_types,
        jsonb_object_agg(solution_type, solution_count) as solution_types,
        jsonb_object_agg(status, status_count) as status_distribution
    FROM (
        SELECT 
            enrichment_type,
            COUNT(*) as type_count
        FROM enrichment_logs
        GROUP BY enrichment_type
    ) type_stats
    CROSS JOIN (
        SELECT 
            solution_type,
            COUNT(*) as solution_count
        FROM enrichment_logs
        GROUP BY solution_type
    ) solution_stats
    CROSS JOIN (
        SELECT 
            status,
            COUNT(*) as status_count
        FROM enrichment_logs
        GROUP BY status
    ) status_stats
    CROSS JOIN enrichment_logs;
END;
$$ LANGUAGE plpgsql;

-- Function to get enrichment performance metrics
CREATE OR REPLACE FUNCTION get_enrichment_performance_metrics(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    enrichment_type VARCHAR(50),
    total_requests BIGINT,
    successful_requests BIGINT,
    cached_requests BIGINT,
    failed_requests BIGINT,
    avg_processing_time_ms NUMERIC,
    avg_tokens_used NUMERIC,
    success_rate NUMERIC,
    cache_hit_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.enrichment_type,
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE el.status = 'success') as successful_requests,
        COUNT(*) FILTER (WHERE el.status = 'cached') as cached_requests,
        COUNT(*) FILTER (WHERE el.status = 'error') as failed_requests,
        AVG(el.processing_time_ms) as avg_processing_time_ms,
        AVG(el.llm_tokens_used) as avg_tokens_used,
        (COUNT(*) FILTER (WHERE el.status = 'success') * 100.0 / COUNT(*)) as success_rate,
        (COUNT(*) FILTER (WHERE el.status = 'cached') * 100.0 / COUNT(*)) as cache_hit_rate
    FROM enrichment_logs el
    WHERE el.created_at >= NOW() - INTERVAL '1 hour' * p_hours_back
    GROUP BY el.enrichment_type
    ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to create enrichment trigger
CREATE OR REPLACE FUNCTION create_enrichment_trigger(
    p_solution_id TEXT,
    p_solution_type TEXT,
    p_trigger_type VARCHAR(50),
    p_enrichment_types TEXT[],
    p_priority INTEGER DEFAULT 0,
    p_scheduled_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    trigger_id UUID;
BEGIN
    INSERT INTO enrichment_triggers (
        solution_id,
        solution_type,
        trigger_type,
        enrichment_types,
        status,
        priority,
        scheduled_at
    ) VALUES (
        p_solution_id,
        p_solution_type,
        p_trigger_type,
        p_enrichment_types,
        'pending',
        p_priority,
        COALESCE(p_scheduled_at, NOW())
    ) RETURNING id INTO trigger_id;
    
    RETURN trigger_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending enrichment triggers
CREATE OR REPLACE FUNCTION get_pending_enrichment_triggers(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    solution_id TEXT,
    solution_type TEXT,
    trigger_type VARCHAR(50),
    enrichment_types TEXT[],
    priority INTEGER,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        et.id,
        et.solution_id,
        et.solution_type,
        et.trigger_type,
        et.enrichment_types,
        et.priority,
        et.scheduled_at,
        et.created_at
    FROM enrichment_triggers et
    WHERE et.status = 'pending'
    AND (et.scheduled_at IS NULL OR et.scheduled_at <= NOW())
    ORDER BY et.priority DESC, et.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update enrichment trigger status
CREATE OR REPLACE FUNCTION update_enrichment_trigger_status(
    p_trigger_id UUID,
    p_status VARCHAR(20),
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE enrichment_triggers 
    SET 
        status = p_status,
        error_message = p_error_message,
        updated_at = NOW(),
        started_at = CASE WHEN p_status = 'processing' THEN NOW() ELSE started_at END,
        completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE completed_at END
    WHERE id = p_trigger_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. TRIGGERS FOR UPDATED_AT TIMESTAMPS
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
DROP TRIGGER IF EXISTS trigger_update_enrichment_cache_updated_at ON enrichment_cache;
CREATE TRIGGER trigger_update_enrichment_cache_updated_at
    BEFORE UPDATE ON enrichment_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_enrichment_triggers_updated_at ON enrichment_triggers;
CREATE TRIGGER trigger_update_enrichment_triggers_updated_at
    BEFORE UPDATE ON enrichment_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_triggers ENABLE ROW LEVEL SECURITY;

-- Create policies for enrichment_cache
DROP POLICY IF EXISTS "Allow read access to enrichment cache" ON enrichment_cache;
CREATE POLICY "Allow read access to enrichment cache" ON enrichment_cache
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to enrichment cache" ON enrichment_cache;
CREATE POLICY "Allow insert access to enrichment cache" ON enrichment_cache
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to enrichment cache" ON enrichment_cache;
CREATE POLICY "Allow update access to enrichment cache" ON enrichment_cache
    FOR UPDATE USING (true);

-- Create policies for enrichment_logs
DROP POLICY IF EXISTS "Allow read access to enrichment logs" ON enrichment_logs;
CREATE POLICY "Allow read access to enrichment logs" ON enrichment_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to enrichment logs" ON enrichment_logs;
CREATE POLICY "Allow insert access to enrichment logs" ON enrichment_logs
    FOR INSERT WITH CHECK (true);

-- Create policies for enrichment_triggers
DROP POLICY IF EXISTS "Allow read access to enrichment triggers" ON enrichment_triggers;
CREATE POLICY "Allow read access to enrichment triggers" ON enrichment_triggers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to enrichment triggers" ON enrichment_triggers;
CREATE POLICY "Allow insert access to enrichment triggers" ON enrichment_triggers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to enrichment triggers" ON enrichment_triggers;
CREATE POLICY "Allow update access to enrichment triggers" ON enrichment_triggers
    FOR UPDATE USING (true);

-- ============================================================================
-- 7. SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample enrichment cache entries
INSERT INTO enrichment_cache (
    content_hash,
    enrichment_type,
    solution_id,
    solution_type,
    result,
    llm_model,
    llm_tokens_used,
    processing_time_ms
) VALUES 
(
    'abc123def456',
    'summary',
    'workflow-123',
    'workflow',
    '{"summary": "Enhanced workflow description with improved clarity and technical details."}',
    'gpt-4o-mini',
    150,
    2500
),
(
    'def456ghi789',
    'categories',
    'workflow-123',
    'workflow',
    '{"category": "ai_ml", "tags": ["automation", "ai", "workflow"]}',
    'gpt-4o-mini',
    120,
    1800
),
(
    'ghi789jkl012',
    'domains',
    'workflow-123',
    'workflow',
    '{"domains": ["IT & Software Development", "Marketing & Advertising"], "confidences": [0.9, 0.7], "origin": "llm"}',
    'gpt-4o-mini',
    200,
    3200
),
(
    'jkl012mno345',
    'capabilities',
    'agent-456',
    'agent',
    '{"capabilities": ["web_search", "data_analysis", "text_generation"]}',
    'gpt-4o-mini',
    180,
    2800
);

-- Insert sample enrichment logs
INSERT INTO enrichment_logs (
    solution_id,
    solution_type,
    enrichment_type,
    status,
    content_hash,
    processing_time_ms,
    llm_tokens_used
) VALUES 
(
    'workflow-123',
    'workflow',
    'summary',
    'success',
    'abc123def456',
    2500,
    150
),
(
    'workflow-123',
    'workflow',
    'categories',
    'success',
    'def456ghi789',
    1800,
    120
),
(
    'workflow-123',
    'workflow',
    'domains',
    'success',
    'ghi789jkl012',
    3200,
    200
),
(
    'agent-456',
    'agent',
    'capabilities',
    'success',
    'jkl012mno345',
    2800,
    180
);

-- Insert sample enrichment triggers
INSERT INTO enrichment_triggers (
    solution_id,
    solution_type,
    trigger_type,
    enrichment_types,
    status,
    priority,
    scheduled_at
) VALUES 
(
    'workflow-789',
    'workflow',
    'first_import',
    ARRAY['summary', 'categories', 'domains'],
    'pending',
    1,
    NOW()
),
(
    'agent-101',
    'agent',
    'admin_refresh',
    ARRAY['summary', 'capabilities', 'domains'],
    'pending',
    2,
    NOW()
);

-- ============================================================================
-- 8. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE enrichment_cache IS 'Cache for LLM enrichment results to avoid redundant API calls';
COMMENT ON TABLE enrichment_logs IS 'Logs of all enrichment activities for observability and debugging';
COMMENT ON TABLE enrichment_triggers IS 'Queue for managing enrichment triggers and processing';

COMMENT ON FUNCTION get_enrichment_cache(VARCHAR, VARCHAR) IS 'Retrieve cached enrichment result by content hash and type';
COMMENT ON FUNCTION cache_enrichment_result(VARCHAR, VARCHAR, TEXT, TEXT, JSONB, VARCHAR, INTEGER, INTEGER) IS 'Cache enrichment result with metadata';
COMMENT ON FUNCTION log_enrichment_activity(TEXT, TEXT, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER, TEXT) IS 'Log enrichment activity for observability';
COMMENT ON FUNCTION get_enrichment_statistics() IS 'Get comprehensive enrichment statistics and metrics';
COMMENT ON FUNCTION get_enrichment_performance_metrics(INTEGER) IS 'Get performance metrics for enrichment operations';
COMMENT ON FUNCTION create_enrichment_trigger(TEXT, TEXT, VARCHAR, TEXT[], INTEGER, TIMESTAMPTZ) IS 'Create enrichment trigger for processing';
COMMENT ON FUNCTION get_pending_enrichment_triggers(INTEGER) IS 'Get pending enrichment triggers for processing';
COMMENT ON FUNCTION update_enrichment_trigger_status(UUID, VARCHAR, TEXT) IS 'Update enrichment trigger status';

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Verify tables are created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('enrichment_cache', 'enrichment_logs', 'enrichment_triggers');
    
    IF table_count = 3 THEN
        RAISE NOTICE 'Enrichment pipeline tables created successfully: % tables', table_count;
    ELSE
        RAISE WARNING 'Expected 3 enrichment pipeline tables, found %', table_count;
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
        'get_enrichment_cache', 'cache_enrichment_result', 'log_enrichment_activity',
        'get_enrichment_statistics', 'get_enrichment_performance_metrics',
        'create_enrichment_trigger', 'get_pending_enrichment_triggers', 'update_enrichment_trigger_status'
    );
    
    IF function_count = 8 THEN
        RAISE NOTICE 'Enrichment pipeline functions created successfully: % functions', function_count;
    ELSE
        RAISE WARNING 'Expected 8 enrichment pipeline functions, found %', function_count;
    END IF;
END $$;

-- Verify sample data
DO $$
DECLARE
    cache_count INTEGER;
    logs_count INTEGER;
    triggers_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cache_count FROM enrichment_cache;
    SELECT COUNT(*) INTO logs_count FROM enrichment_logs;
    SELECT COUNT(*) INTO triggers_count FROM enrichment_triggers;
    
    IF cache_count >= 4 AND logs_count >= 4 AND triggers_count >= 2 THEN
        RAISE NOTICE 'Sample data inserted successfully: % cache, % logs, % triggers', cache_count, logs_count, triggers_count;
    ELSE
        RAISE WARNING 'Sample data incomplete: % cache, % logs, % triggers', cache_count, logs_count, triggers_count;
    END IF;
END $$;
