-- Consolidated Migration: Admin System Tables and Functions
-- This migration ensures all admin system components are properly set up
-- Includes: ontology_domains, implementation_requests, pilot_feedback, and cache versioning

-- ============================================================================
-- 1. ONTOLOGY DOMAINS TABLE AND SEED DATA
-- ============================================================================

-- Create ontology_domains table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ontology_domains (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL,
    is_fallback BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ontology_domains_label ON public.ontology_domains (label);
CREATE INDEX IF NOT EXISTS idx_ontology_domains_order ON public.ontology_domains (display_order);
CREATE INDEX IF NOT EXISTS idx_ontology_domains_fallback ON public.ontology_domains (is_fallback);

-- Insert the 20 domains + fallback "Other" if they don't exist
INSERT INTO public.ontology_domains (label, display_order, is_fallback, description) VALUES
    ('Healthcare & Medicine', 1, FALSE, 'Medical services, patient care, clinical workflows'),
    ('Nursing & Care', 2, FALSE, 'Nursing services, patient care, healthcare support'),
    ('Life Sciences & Biotech', 3, FALSE, 'Biotechnology, research, pharmaceutical'),
    ('Finance & Accounting', 4, FALSE, 'Financial services, accounting, banking'),
    ('Marketing & Advertising', 5, FALSE, 'Marketing campaigns, advertising, brand management'),
    ('Sales & CRM', 6, FALSE, 'Sales processes, customer relationship management'),
    ('Human Resources & Recruiting', 7, FALSE, 'HR processes, recruitment, employee management'),
    ('Education & Training', 8, FALSE, 'Educational services, training programs, learning'),
    ('Legal & Compliance', 9, FALSE, 'Legal services, compliance, regulatory'),
    ('IT & Software Development', 10, FALSE, 'Software development, IT services, technical'),
    ('DevOps & Cloud', 11, FALSE, 'DevOps processes, cloud infrastructure, deployment'),
    ('Design & Creative', 12, FALSE, 'Design services, creative work, visual content'),
    ('E-commerce & Retail', 13, FALSE, 'Online retail, e-commerce, inventory management'),
    ('Manufacturing & Supply Chain', 14, FALSE, 'Manufacturing processes, supply chain management'),
    ('Real Estate & Property', 15, FALSE, 'Real estate services, property management'),
    ('Travel & Hospitality', 16, FALSE, 'Travel services, hospitality, tourism'),
    ('Media & Entertainment', 17, FALSE, 'Media production, entertainment, content creation'),
    ('Non-profit & Social Impact', 18, FALSE, 'Non-profit organizations, social impact initiatives'),
    ('Government & Public Sector', 19, FALSE, 'Government services, public administration'),
    ('Research & Development', 20, FALSE, 'Research activities, product development, innovation'),
    ('Other', 21, TRUE, 'General or uncategorized business domains')
ON CONFLICT (label) DO NOTHING;

-- ============================================================================
-- 2. IMPLEMENTATION REQUESTS TABLE
-- ============================================================================

-- Create implementation_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS implementation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User form data
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  preferred_tools TEXT[],
  timeline VARCHAR(100) NOT NULL,
  budget_range VARCHAR(100) NOT NULL,
  
  -- Task context
  task_description TEXT,
  subtasks JSONB,
  automation_score INTEGER,
  selected_workflow_ids UUID[],
  selected_agent_ids UUID[],
  
  -- Additional context
  user_agent TEXT,
  ip_address INET,
  referrer_url TEXT,
  session_id VARCHAR(255),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'in_progress', 'completed', 'cancelled')),
  admin_notes TEXT,
  admin_assigned_to VARCHAR(255),
  estimated_value NUMERIC(10,2),
  
  -- Email tracking
  email_sent_to_service BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  auto_reply_sent BOOLEAN DEFAULT FALSE,
  auto_reply_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  quoted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create indexes for implementation_requests
CREATE INDEX IF NOT EXISTS idx_implementation_requests_email ON implementation_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_implementation_requests_status ON implementation_requests(status);
CREATE INDEX IF NOT EXISTS idx_implementation_requests_created_at ON implementation_requests(created_at);

-- ============================================================================
-- 3. PILOT FEEDBACK SYSTEM
-- ============================================================================

-- Create pilot_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS pilot_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id TEXT NOT NULL,
    solution_type TEXT NOT NULL CHECK (solution_type IN ('workflow', 'agent')),
    step_id UUID,
    user_id TEXT,
    user_email TEXT,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('step_quality', 'step_clarity', 'step_completeness', 'step_accuracy', 'overall_rating', 'suggestion', 'issue', 'success_story')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    is_helpful BOOLEAN,
    difficulty_level TEXT CHECK (difficulty_level IN ('too_easy', 'just_right', 'too_hard')),
    time_taken INTEGER,
    completion_status TEXT CHECK (completion_status IN ('completed', 'partial', 'failed', 'not_attempted')),
    issues_encountered TEXT[],
    suggestions TEXT[],
    tools_used TEXT[],
    additional_resources TEXT[],
    user_agent TEXT,
    ip_address INET,
    referrer_url TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pilot_feedback_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS pilot_feedback_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_email TEXT,
    solution_id TEXT NOT NULL,
    solution_type TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_steps INTEGER DEFAULT 0,
    completed_steps INTEGER DEFAULT 0,
    total_feedback_items INTEGER DEFAULT 0,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    session_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for pilot feedback
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_solution_id ON pilot_feedback(solution_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_step_id ON pilot_feedback(step_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_type ON pilot_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_rating ON pilot_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_created_at ON pilot_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_sessions_session_id ON pilot_feedback_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_sessions_solution_id ON pilot_feedback_sessions(solution_id);

-- ============================================================================
-- 4. CACHE VERSIONING UPDATES
-- ============================================================================

-- Update workflow_cache table to include versioning for admin system
ALTER TABLE workflow_cache ADD COLUMN IF NOT EXISTS admin_system_version VARCHAR(10) DEFAULT '1.0.0';
ALTER TABLE workflow_cache ADD COLUMN IF NOT EXISTS cache_type VARCHAR(50) DEFAULT 'workflow';

-- Create index on admin_system_version for cache management
CREATE INDEX IF NOT EXISTS idx_workflow_cache_admin_version ON workflow_cache(admin_system_version);
CREATE INDEX IF NOT EXISTS idx_workflow_cache_type ON workflow_cache(cache_type);

-- ============================================================================
-- 5. ESSENTIAL FUNCTIONS
-- ============================================================================

-- Function to get ontology domains
CREATE OR REPLACE FUNCTION get_ontology_domains()
RETURNS TABLE (
    id INTEGER,
    label TEXT,
    display_order INTEGER,
    is_fallback BOOLEAN,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        od.id,
        od.label,
        od.display_order,
        od.is_fallback,
        od.description
    FROM public.ontology_domains od
    ORDER BY od.display_order;
END;
$$ LANGUAGE plpgsql;

-- Function to get implementation request stats
CREATE OR REPLACE FUNCTION get_implementation_request_stats()
RETURNS TABLE (
    total_requests BIGINT,
    pending_requests BIGINT,
    contacted_requests BIGINT,
    quoted_requests BIGINT,
    in_progress_requests BIGINT,
    completed_requests BIGINT,
    cancelled_requests BIGINT,
    avg_estimated_value NUMERIC,
    total_estimated_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted_requests,
        COUNT(*) FILTER (WHERE status = 'quoted') as quoted_requests,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_requests,
        AVG(estimated_value) as avg_estimated_value,
        SUM(estimated_value) as total_estimated_value
    FROM implementation_requests;
END;
$$ LANGUAGE plpgsql;

-- Function to submit pilot feedback
CREATE OR REPLACE FUNCTION submit_pilot_feedback(
    p_solution_id TEXT,
    p_solution_type TEXT,
    p_step_id UUID DEFAULT NULL,
    p_user_email TEXT DEFAULT NULL,
    p_feedback_type TEXT,
    p_rating INTEGER DEFAULT NULL,
    p_feedback_text TEXT DEFAULT NULL,
    p_is_helpful BOOLEAN DEFAULT NULL,
    p_difficulty_level TEXT DEFAULT NULL,
    p_time_taken INTEGER DEFAULT NULL,
    p_completion_status TEXT DEFAULT NULL,
    p_issues_encountered TEXT[] DEFAULT NULL,
    p_suggestions TEXT[] DEFAULT NULL,
    p_tools_used TEXT[] DEFAULT NULL,
    p_additional_resources TEXT[] DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    feedback_id UUID;
BEGIN
    INSERT INTO pilot_feedback (
        solution_id,
        solution_type,
        step_id,
        user_email,
        feedback_type,
        rating,
        feedback_text,
        is_helpful,
        difficulty_level,
        time_taken,
        completion_status,
        issues_encountered,
        suggestions,
        tools_used,
        additional_resources,
        session_id
    ) VALUES (
        p_solution_id,
        p_solution_type,
        p_step_id,
        p_user_email,
        p_feedback_type,
        p_rating,
        p_feedback_text,
        p_is_helpful,
        p_difficulty_level,
        p_time_taken,
        p_completion_status,
        p_issues_encountered,
        p_suggestions,
        p_tools_used,
        p_additional_resources,
        p_session_id
    ) RETURNING id INTO feedback_id;
    
    RETURN feedback_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get pilot feedback stats
CREATE OR REPLACE FUNCTION get_pilot_feedback_stats(p_solution_id TEXT)
RETURNS TABLE (
    total_feedback_count BIGINT,
    average_rating NUMERIC,
    completion_rate NUMERIC,
    helpful_feedback_count BIGINT,
    issue_count BIGINT,
    suggestion_count BIGINT,
    success_story_count BIGINT,
    average_time_taken NUMERIC,
    difficulty_distribution JSONB,
    rating_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_feedback_count,
        AVG(rating) as average_rating,
        (COUNT(*) FILTER (WHERE completion_status = 'completed') * 100.0 / NULLIF(COUNT(*), 0)) as completion_rate,
        COUNT(*) FILTER (WHERE is_helpful = true) as helpful_feedback_count,
        COUNT(*) FILTER (WHERE feedback_type = 'issue') as issue_count,
        COUNT(*) FILTER (WHERE feedback_type = 'suggestion') as suggestion_count,
        COUNT(*) FILTER (WHERE feedback_type = 'success_story') as success_story_count,
        AVG(time_taken) as average_time_taken,
        jsonb_object_agg(difficulty_level, difficulty_count) as difficulty_distribution,
        jsonb_object_agg(rating::text, rating_count) as rating_distribution
    FROM (
        SELECT 
            difficulty_level,
            COUNT(*) as difficulty_count
        FROM pilot_feedback 
        WHERE solution_id = p_solution_id AND difficulty_level IS NOT NULL
        GROUP BY difficulty_level
    ) difficulty_stats
    FULL OUTER JOIN (
        SELECT 
            rating,
            COUNT(*) as rating_count
        FROM pilot_feedback 
        WHERE solution_id = p_solution_id AND rating IS NOT NULL
        GROUP BY rating
    ) rating_stats ON true
    CROSS JOIN pilot_feedback
    WHERE pilot_feedback.solution_id = p_solution_id;
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
DROP TRIGGER IF EXISTS trigger_update_ontology_domains_updated_at ON public.ontology_domains;
CREATE TRIGGER trigger_update_ontology_domains_updated_at
    BEFORE UPDATE ON public.ontology_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_implementation_requests_updated_at ON implementation_requests;
CREATE TRIGGER trigger_update_implementation_requests_updated_at
    BEFORE UPDATE ON implementation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_pilot_feedback_updated_at ON pilot_feedback;
CREATE TRIGGER trigger_update_pilot_feedback_updated_at
    BEFORE UPDATE ON pilot_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_pilot_feedback_sessions_updated_at ON pilot_feedback_sessions;
CREATE TRIGGER trigger_update_pilot_feedback_sessions_updated_at
    BEFORE UPDATE ON pilot_feedback_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE public.ontology_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE implementation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_feedback_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for ontology_domains (read-only for all)
DROP POLICY IF EXISTS "Allow read access to ontology domains" ON public.ontology_domains;
CREATE POLICY "Allow read access to ontology domains" ON public.ontology_domains
    FOR SELECT USING (true);

-- Create policies for implementation_requests
DROP POLICY IF EXISTS "Allow read access to implementation requests" ON implementation_requests;
CREATE POLICY "Allow read access to implementation requests" ON implementation_requests
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to implementation requests" ON implementation_requests;
CREATE POLICY "Allow insert access to implementation requests" ON implementation_requests
    FOR INSERT WITH CHECK (true);

-- Create policies for pilot_feedback
DROP POLICY IF EXISTS "Allow read access to pilot feedback" ON pilot_feedback;
CREATE POLICY "Allow read access to pilot feedback" ON pilot_feedback
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to pilot feedback" ON pilot_feedback;
CREATE POLICY "Allow insert access to pilot feedback" ON pilot_feedback
    FOR INSERT WITH CHECK (true);

-- Create policies for pilot_feedback_sessions
DROP POLICY IF EXISTS "Allow read access to pilot feedback sessions" ON pilot_feedback_sessions;
CREATE POLICY "Allow read access to pilot feedback sessions" ON pilot_feedback_sessions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to pilot feedback sessions" ON pilot_feedback_sessions;
CREATE POLICY "Allow insert access to pilot feedback sessions" ON pilot_feedback_sessions
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 8. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.ontology_domains IS 'Business domain ontology for solution classification';
COMMENT ON TABLE implementation_requests IS 'User implementation requests from lead funnel';
COMMENT ON TABLE pilot_feedback IS 'Pilot user feedback on implementation steps';
COMMENT ON TABLE pilot_feedback_sessions IS 'User feedback sessions for analytics';

COMMENT ON FUNCTION get_ontology_domains() IS 'Retrieve all ontology domains ordered by display order';
COMMENT ON FUNCTION get_implementation_request_stats() IS 'Get statistics for implementation requests';
COMMENT ON FUNCTION submit_pilot_feedback(TEXT, TEXT, UUID, TEXT, TEXT, INTEGER, TEXT, BOOLEAN, TEXT, INTEGER, TEXT, TEXT[], TEXT[], TEXT[], TEXT[], TEXT) IS 'Submit pilot feedback for a solution';
COMMENT ON FUNCTION get_pilot_feedback_stats(TEXT) IS 'Get feedback statistics for a specific solution';

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Verify ontology domains are properly seeded
DO $$
DECLARE
    domain_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO domain_count FROM public.ontology_domains;
    IF domain_count < 20 THEN
        RAISE WARNING 'Expected at least 20 ontology domains, found %', domain_count;
    ELSE
        RAISE NOTICE 'Ontology domains properly seeded: % domains found', domain_count;
    END IF;
END $$;

-- Verify all tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('ontology_domains', 'implementation_requests', 'pilot_feedback', 'pilot_feedback_sessions');
    
    IF table_count = 4 THEN
        RAISE NOTICE 'All admin system tables created successfully';
    ELSE
        RAISE WARNING 'Expected 4 admin system tables, found %', table_count;
    END IF;
END $$;
