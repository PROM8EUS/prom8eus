-- Migration: Create pilot feedback system
-- Description: Tables and functions for capturing and managing pilot user feedback on implementation steps

-- Create pilot_feedback table
CREATE TABLE IF NOT EXISTS pilot_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id TEXT NOT NULL,
    solution_type TEXT NOT NULL CHECK (solution_type IN ('workflow', 'agent')),
    step_id UUID REFERENCES solution_implementation_steps(id) ON DELETE CASCADE,
    user_id TEXT, -- Optional: for authenticated users
    user_email TEXT, -- Optional: for anonymous feedback
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('step_quality', 'step_clarity', 'step_completeness', 'step_accuracy', 'overall_rating', 'suggestion', 'issue', 'success_story')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    feedback_text TEXT,
    is_helpful BOOLEAN, -- For step-specific feedback
    difficulty_level TEXT CHECK (difficulty_level IN ('too_easy', 'just_right', 'too_hard')),
    time_taken INTEGER, -- Time taken in minutes
    completion_status TEXT CHECK (completion_status IN ('completed', 'partial', 'failed', 'not_attempted')),
    issues_encountered TEXT[], -- Array of issue descriptions
    suggestions TEXT[], -- Array of improvement suggestions
    tools_used TEXT[], -- Array of tools actually used
    additional_resources TEXT[], -- Array of additional resources needed
    user_agent TEXT,
    ip_address INET,
    referrer_url TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pilot_feedback_sessions table for tracking user sessions
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

-- Create pilot_feedback_analytics table for aggregated analytics
CREATE TABLE IF NOT EXISTS pilot_feedback_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id TEXT NOT NULL,
    solution_type TEXT NOT NULL,
    analysis_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_feedback_count INTEGER DEFAULT 0,
    average_rating NUMERIC(3,2),
    completion_rate NUMERIC(5,2), -- Percentage
    helpful_feedback_count INTEGER DEFAULT 0,
    issue_count INTEGER DEFAULT 0,
    suggestion_count INTEGER DEFAULT 0,
    success_story_count INTEGER DEFAULT 0,
    most_common_issues TEXT[],
    most_common_suggestions TEXT[],
    average_time_taken NUMERIC(8,2), -- Minutes
    difficulty_distribution JSONB, -- Distribution of difficulty levels
    rating_distribution JSONB, -- Distribution of ratings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(solution_id, analysis_period, period_start)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_solution_id ON pilot_feedback(solution_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_step_id ON pilot_feedback(step_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_type ON pilot_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_rating ON pilot_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_created_at ON pilot_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_sessions_session_id ON pilot_feedback_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_sessions_solution_id ON pilot_feedback_sessions(solution_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_analytics_solution_id ON pilot_feedback_analytics(solution_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_analytics_period ON pilot_feedback_analytics(analysis_period, period_start);

-- Create function to submit pilot feedback
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

-- Create function to start a feedback session
CREATE OR REPLACE FUNCTION start_pilot_feedback_session(
    p_session_id TEXT,
    p_solution_id TEXT,
    p_solution_type TEXT,
    p_user_email TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    session_uuid UUID;
BEGIN
    INSERT INTO pilot_feedback_sessions (
        session_id,
        solution_id,
        solution_type,
        user_email
    ) VALUES (
        p_session_id,
        p_solution_id,
        p_solution_type,
        p_user_email
    ) RETURNING id INTO session_uuid;
    
    RETURN session_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to complete a feedback session
CREATE OR REPLACE FUNCTION complete_pilot_feedback_session(
    p_session_id TEXT,
    p_overall_rating INTEGER DEFAULT NULL,
    p_session_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE pilot_feedback_sessions 
    SET 
        completed_at = NOW(),
        overall_rating = p_overall_rating,
        session_notes = p_session_notes,
        updated_at = NOW()
    WHERE session_id = p_session_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to get feedback statistics for a solution
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
        COUNT(*) FILTER (WHERE feedback_type = 'success_story') as suggestion_count,
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

-- Create function to get recent feedback for a solution
CREATE OR REPLACE FUNCTION get_recent_pilot_feedback(
    p_solution_id TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    feedback_type TEXT,
    rating INTEGER,
    feedback_text TEXT,
    is_helpful BOOLEAN,
    difficulty_level TEXT,
    completion_status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.id,
        pf.feedback_type,
        pf.rating,
        pf.feedback_text,
        pf.is_helpful,
        pf.difficulty_level,
        pf.completion_status,
        pf.created_at
    FROM pilot_feedback pf
    WHERE pf.solution_id = p_solution_id
    ORDER BY pf.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to get feedback analytics
CREATE OR REPLACE FUNCTION get_pilot_feedback_analytics(
    p_solution_id TEXT DEFAULT NULL,
    p_period TEXT DEFAULT 'weekly'
)
RETURNS TABLE (
    solution_id TEXT,
    solution_type TEXT,
    total_feedback_count BIGINT,
    average_rating NUMERIC,
    completion_rate NUMERIC,
    helpful_feedback_count BIGINT,
    issue_count BIGINT,
    suggestion_count BIGINT,
    success_story_count BIGINT,
    average_time_taken NUMERIC,
    most_common_issues TEXT[],
    most_common_suggestions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.solution_id,
        pf.solution_type,
        COUNT(*) as total_feedback_count,
        AVG(pf.rating) as average_rating,
        (COUNT(*) FILTER (WHERE pf.completion_status = 'completed') * 100.0 / NULLIF(COUNT(*), 0)) as completion_rate,
        COUNT(*) FILTER (WHERE pf.is_helpful = true) as helpful_feedback_count,
        COUNT(*) FILTER (WHERE pf.feedback_type = 'issue') as issue_count,
        COUNT(*) FILTER (WHERE pf.feedback_type = 'suggestion') as suggestion_count,
        COUNT(*) FILTER (WHERE pf.feedback_type = 'success_story') as success_story_count,
        AVG(pf.time_taken) as average_time_taken,
        ARRAY_AGG(DISTINCT unnest(pf.issues_encountered)) as most_common_issues,
        ARRAY_AGG(DISTINCT unnest(pf.suggestions)) as most_common_suggestions
    FROM pilot_feedback pf
    WHERE (p_solution_id IS NULL OR pf.solution_id = p_solution_id)
    AND pf.created_at >= CASE 
        WHEN p_period = 'daily' THEN NOW() - INTERVAL '1 day'
        WHEN p_period = 'weekly' THEN NOW() - INTERVAL '1 week'
        WHEN p_period = 'monthly' THEN NOW() - INTERVAL '1 month'
        ELSE NOW() - INTERVAL '1 week'
    END
    GROUP BY pf.solution_id, pf.solution_type;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pilot_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pilot_feedback_updated_at
    BEFORE UPDATE ON pilot_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_pilot_feedback_updated_at();

CREATE TRIGGER trigger_update_pilot_feedback_sessions_updated_at
    BEFORE UPDATE ON pilot_feedback_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_pilot_feedback_updated_at();

CREATE TRIGGER trigger_update_pilot_feedback_analytics_updated_at
    BEFORE UPDATE ON pilot_feedback_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_pilot_feedback_updated_at();

-- Insert sample data for testing
INSERT INTO pilot_feedback (
    solution_id,
    solution_type,
    feedback_type,
    rating,
    feedback_text,
    is_helpful,
    difficulty_level,
    time_taken,
    completion_status,
    issues_encountered,
    suggestions
) VALUES 
(
    'workflow-123',
    'workflow',
    'overall_rating',
    4,
    'The steps were clear and easy to follow. The authentication setup was straightforward.',
    true,
    'just_right',
    25,
    'completed',
    ARRAY['Had to look up OAuth2 documentation'],
    ARRAY['Add more specific API endpoint examples', 'Include troubleshooting section']
),
(
    'workflow-123',
    'workflow',
    'step_quality',
    5,
    'Step 1 was perfect - very clear instructions.',
    true,
    'just_right',
    15,
    'completed',
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[]
),
(
    'agent-456',
    'agent',
    'overall_rating',
    3,
    'The agent setup was more complex than expected. Some steps were unclear.',
    false,
    'too_hard',
    45,
    'partial',
    ARRAY['Missing dependency installation', 'Configuration file format unclear'],
    ARRAY['Add dependency checklist', 'Provide sample configuration files']
);

-- Insert sample feedback session
INSERT INTO pilot_feedback_sessions (
    session_id,
    solution_id,
    solution_type,
    user_email,
    total_steps,
    completed_steps,
    total_feedback_items,
    overall_rating,
    session_notes
) VALUES (
    'session-123',
    'workflow-123',
    'workflow',
    'pilot@example.com',
    6,
    4,
    3,
    4,
    'Good overall experience, some steps could be clearer'
);

COMMENT ON TABLE pilot_feedback IS 'Stores pilot user feedback on implementation steps and solutions';
COMMENT ON TABLE pilot_feedback_sessions IS 'Tracks user feedback sessions for analytics';
COMMENT ON TABLE pilot_feedback_analytics IS 'Aggregated analytics data for pilot feedback';
