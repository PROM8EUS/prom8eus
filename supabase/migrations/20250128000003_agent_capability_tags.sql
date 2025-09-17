-- Create agent capability tags table
CREATE TABLE IF NOT EXISTS public.agent_capability_tags (
    id SERIAL PRIMARY KEY,
    tag TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    is_core BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_agent_capability_tags_tag ON public.agent_capability_tags (tag);
CREATE INDEX IF NOT EXISTS idx_agent_capability_tags_category ON public.agent_capability_tags (category);
CREATE INDEX IF NOT EXISTS idx_agent_capability_tags_order ON public.agent_capability_tags (display_order);
CREATE INDEX IF NOT EXISTS idx_agent_capability_tags_core ON public.agent_capability_tags (is_core);

-- Grant permissions
GRANT ALL ON public.agent_capability_tags TO authenticated;
GRANT ALL ON public.agent_capability_tags TO anon;
GRANT USAGE ON SEQUENCE public.agent_capability_tags_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.agent_capability_tags_id_seq TO anon;

-- Insert standardized capability tags
INSERT INTO public.agent_capability_tags (tag, display_name, description, category, display_order, is_core) VALUES
-- Core capabilities (most common)
('web_search', 'Web Search', 'Search the internet for information', 'data_access', 1, TRUE),
('data_analysis', 'Data Analysis', 'Analyze and process data', 'data_processing', 2, TRUE),
('file_io', 'File Operations', 'Read, write, and manage files', 'data_access', 3, TRUE),
('email_send', 'Email Sending', 'Send emails and notifications', 'communication', 4, TRUE),

-- Data access and processing
('api_integration', 'API Integration', 'Connect to external APIs and services', 'data_access', 5, FALSE),
('database_query', 'Database Operations', 'Query and manipulate databases', 'data_access', 6, FALSE),
('data_visualization', 'Data Visualization', 'Create charts, graphs, and visual representations', 'data_processing', 7, FALSE),
('data_extraction', 'Data Extraction', 'Extract data from various sources', 'data_access', 8, FALSE),
('data_transformation', 'Data Transformation', 'Transform and clean data', 'data_processing', 9, FALSE),

-- Communication and collaboration
('chat_interaction', 'Chat Interaction', 'Interact through chat interfaces', 'communication', 10, FALSE),
('document_generation', 'Document Generation', 'Generate reports, documents, and content', 'content_creation', 11, FALSE),
('notification_sending', 'Notifications', 'Send various types of notifications', 'communication', 12, FALSE),
('calendar_management', 'Calendar Management', 'Manage calendars and scheduling', 'productivity', 13, FALSE),

-- Content creation and processing
('text_processing', 'Text Processing', 'Process and analyze text content', 'content_processing', 14, FALSE),
('image_processing', 'Image Processing', 'Process and analyze images', 'content_processing', 15, FALSE),
('code_generation', 'Code Generation', 'Generate and modify code', 'development', 16, FALSE),
('content_summarization', 'Content Summarization', 'Summarize and condense content', 'content_processing', 17, FALSE),

-- Automation and workflow
('workflow_automation', 'Workflow Automation', 'Automate business processes and workflows', 'automation', 18, FALSE),
('task_scheduling', 'Task Scheduling', 'Schedule and manage tasks', 'productivity', 19, FALSE),
('monitoring', 'Monitoring', 'Monitor systems, processes, and data', 'automation', 20, FALSE),
('alerting', 'Alerting', 'Send alerts and warnings', 'automation', 21, FALSE),

-- Development and technical
('code_review', 'Code Review', 'Review and analyze code', 'development', 22, FALSE),
('testing', 'Testing', 'Perform testing and quality assurance', 'development', 23, FALSE),
('deployment', 'Deployment', 'Deploy applications and services', 'development', 24, FALSE),
('security_analysis', 'Security Analysis', 'Analyze security and vulnerabilities', 'security', 25, FALSE),

-- Business and analytics
('reporting', 'Reporting', 'Generate business reports and analytics', 'business', 26, FALSE),
('forecasting', 'Forecasting', 'Make predictions and forecasts', 'business', 27, FALSE),
('optimization', 'Optimization', 'Optimize processes and performance', 'business', 28, FALSE),
('compliance_checking', 'Compliance Checking', 'Check compliance with regulations', 'business', 29, FALSE),

-- Specialized capabilities
('language_translation', 'Language Translation', 'Translate between languages', 'specialized', 30, FALSE),
('voice_processing', 'Voice Processing', 'Process voice and audio content', 'specialized', 31, FALSE),
('blockchain_interaction', 'Blockchain Interaction', 'Interact with blockchain networks', 'specialized', 32, FALSE),
('iot_management', 'IoT Management', 'Manage Internet of Things devices', 'specialized', 33, FALSE);

-- Create function to get all capability tags
CREATE OR REPLACE FUNCTION public.get_agent_capability_tags()
RETURNS SETOF public.agent_capability_tags
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.agent_capability_tags ORDER BY display_order;
END;
$$;

-- Create function to get core capability tags only
CREATE OR REPLACE FUNCTION public.get_core_capability_tags()
RETURNS SETOF public.agent_capability_tags
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.agent_capability_tags WHERE is_core = TRUE ORDER BY display_order;
END;
$$;

-- Create function to get capability tags by category
CREATE OR REPLACE FUNCTION public.get_capability_tags_by_category(category_name TEXT)
RETURNS SETOF public.agent_capability_tags
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.agent_capability_tags WHERE category = category_name ORDER BY display_order;
END;
$$;

-- Create function to validate capability tags
CREATE OR REPLACE FUNCTION public.validate_capability_tags(tags TEXT[])
RETURNS TABLE (
    valid_tags TEXT[],
    invalid_tags TEXT[],
    all_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH valid_tag_list AS (
    SELECT tag FROM public.agent_capability_tags
  ),
  tag_validation AS (
    SELECT 
      ARRAY(SELECT unnest(tags) INTERSECT SELECT tag FROM valid_tag_list) as valid,
      ARRAY(SELECT unnest(tags) EXCEPT SELECT tag FROM valid_tag_list) as invalid
  )
  SELECT 
    tag_validation.valid,
    tag_validation.invalid,
    array_length(tag_validation.invalid, 1) IS NULL OR array_length(tag_validation.invalid, 1) = 0
  FROM tag_validation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_agent_capability_tags() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_capability_tags() TO anon;
GRANT EXECUTE ON FUNCTION public.get_core_capability_tags() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_core_capability_tags() TO anon;
GRANT EXECUTE ON FUNCTION public.get_capability_tags_by_category(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_capability_tags_by_category(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_capability_tags(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_capability_tags(TEXT[]) TO anon;
