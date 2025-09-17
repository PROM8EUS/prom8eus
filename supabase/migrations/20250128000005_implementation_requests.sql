-- Migration: Create implementation_requests table for lead funnel
-- This table stores implementation requests from users with form data and task context

-- Create implementation_requests table
CREATE TABLE IF NOT EXISTS implementation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User form data
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  company VARCHAR(255), -- Optional
  preferred_tools TEXT[], -- Array of preferred tools (n8n, Zapier, etc.)
  timeline VARCHAR(100) NOT NULL, -- Mandatory timeline
  budget_range VARCHAR(100) NOT NULL, -- Mandatory budget range
  
  -- Task context (automatically attached)
  task_description TEXT, -- Original task description
  subtasks JSONB, -- Array of subtasks
  automation_score INTEGER, -- Overall automation score
  selected_workflow_ids UUID[], -- Array of selected workflow IDs
  selected_agent_ids UUID[], -- Array of selected agent IDs
  
  -- Additional context
  user_agent TEXT, -- Browser user agent
  ip_address INET, -- User IP address (for analytics)
  referrer_url TEXT, -- Where the user came from
  session_id VARCHAR(255), -- Session tracking
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'in_progress', 'completed', 'cancelled')),
  admin_notes TEXT, -- Admin notes
  admin_assigned_to VARCHAR(255), -- Admin user assigned
  estimated_value DECIMAL(10,2), -- Estimated project value
  
  -- Email tracking
  email_sent_to_service BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  auto_reply_sent BOOLEAN DEFAULT FALSE,
  auto_reply_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  quoted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_implementation_requests_status ON implementation_requests(status);
CREATE INDEX IF NOT EXISTS idx_implementation_requests_created_at ON implementation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_implementation_requests_user_email ON implementation_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_implementation_requests_company ON implementation_requests(company);
CREATE INDEX IF NOT EXISTS idx_implementation_requests_timeline ON implementation_requests(timeline);
CREATE INDEX IF NOT EXISTS idx_implementation_requests_budget_range ON implementation_requests(budget_range);
CREATE INDEX IF NOT EXISTS idx_implementation_requests_admin_assigned_to ON implementation_requests(admin_assigned_to);

-- GIN index for JSONB subtasks
CREATE INDEX IF NOT EXISTS idx_implementation_requests_subtasks ON implementation_requests USING GIN(subtasks);

-- GIN index for array fields
CREATE INDEX IF NOT EXISTS idx_implementation_requests_preferred_tools ON implementation_requests USING GIN(preferred_tools);
CREATE INDEX IF NOT EXISTS idx_implementation_requests_selected_workflow_ids ON implementation_requests USING GIN(selected_workflow_ids);
CREATE INDEX IF NOT EXISTS idx_implementation_requests_selected_agent_ids ON implementation_requests USING GIN(selected_agent_ids);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_implementation_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_implementation_requests_updated_at
  BEFORE UPDATE ON implementation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_implementation_requests_updated_at();

-- Create function to get implementation request statistics
CREATE OR REPLACE FUNCTION get_implementation_request_stats()
RETURNS TABLE (
  total_requests BIGINT,
  pending_requests BIGINT,
  contacted_requests BIGINT,
  quoted_requests BIGINT,
  in_progress_requests BIGINT,
  completed_requests BIGINT,
  cancelled_requests BIGINT,
  total_estimated_value DECIMAL(10,2),
  avg_estimated_value DECIMAL(10,2),
  requests_today BIGINT,
  requests_this_week BIGINT,
  requests_this_month BIGINT
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
    COALESCE(SUM(estimated_value), 0) as total_estimated_value,
    COALESCE(AVG(estimated_value), 0) as avg_estimated_value,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as requests_today,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as requests_this_week,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as requests_this_month
  FROM implementation_requests;
END;
$$ LANGUAGE plpgsql;

-- Create function to get requests by status
CREATE OR REPLACE FUNCTION get_implementation_requests_by_status(request_status VARCHAR(50))
RETURNS TABLE (
  id UUID,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  company VARCHAR(255),
  preferred_tools TEXT[],
  timeline VARCHAR(100),
  budget_range VARCHAR(100),
  task_description TEXT,
  automation_score INTEGER,
  selected_workflow_ids UUID[],
  selected_agent_ids UUID[],
  status VARCHAR(50),
  admin_notes TEXT,
  admin_assigned_to VARCHAR(255),
  estimated_value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ir.id,
    ir.user_name,
    ir.user_email,
    ir.company,
    ir.preferred_tools,
    ir.timeline,
    ir.budget_range,
    ir.task_description,
    ir.automation_score,
    ir.selected_workflow_ids,
    ir.selected_agent_ids,
    ir.status,
    ir.admin_notes,
    ir.admin_assigned_to,
    ir.estimated_value,
    ir.created_at,
    ir.updated_at
  FROM implementation_requests ir
  WHERE ir.status = request_status
  ORDER BY ir.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to update request status
CREATE OR REPLACE FUNCTION update_implementation_request_status(
  request_id UUID,
  new_status VARCHAR(50),
  admin_notes TEXT DEFAULT NULL,
  admin_assigned_to VARCHAR(255) DEFAULT NULL,
  estimated_value DECIMAL(10,2) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE implementation_requests 
  SET 
    status = new_status,
    admin_notes = COALESCE(admin_notes, implementation_requests.admin_notes),
    admin_assigned_to = COALESCE(admin_assigned_to, implementation_requests.admin_assigned_to),
    estimated_value = COALESCE(estimated_value, implementation_requests.estimated_value),
    updated_at = NOW(),
    contacted_at = CASE WHEN new_status = 'contacted' AND contacted_at IS NULL THEN NOW() ELSE contacted_at END,
    quoted_at = CASE WHEN new_status = 'quoted' AND quoted_at IS NULL THEN NOW() ELSE quoted_at END,
    completed_at = CASE WHEN new_status = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END
  WHERE id = request_id;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to get request with full context
CREATE OR REPLACE FUNCTION get_implementation_request_with_context(request_id UUID)
RETURNS TABLE (
  id UUID,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  company VARCHAR(255),
  preferred_tools TEXT[],
  timeline VARCHAR(100),
  budget_range VARCHAR(100),
  task_description TEXT,
  subtasks JSONB,
  automation_score INTEGER,
  selected_workflow_ids UUID[],
  selected_agent_ids UUID[],
  status VARCHAR(50),
  admin_notes TEXT,
  admin_assigned_to VARCHAR(255),
  estimated_value DECIMAL(10,2),
  email_sent_to_service BOOLEAN,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  auto_reply_sent BOOLEAN,
  auto_reply_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  contacted_at TIMESTAMP WITH TIME ZONE,
  quoted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ir.id,
    ir.user_name,
    ir.user_email,
    ir.company,
    ir.preferred_tools,
    ir.timeline,
    ir.budget_range,
    ir.task_description,
    ir.subtasks,
    ir.automation_score,
    ir.selected_workflow_ids,
    ir.selected_agent_ids,
    ir.status,
    ir.admin_notes,
    ir.admin_assigned_to,
    ir.estimated_value,
    ir.email_sent_to_service,
    ir.email_sent_at,
    ir.auto_reply_sent,
    ir.auto_reply_sent_at,
    ir.created_at,
    ir.updated_at,
    ir.contacted_at,
    ir.quoted_at,
    ir.completed_at
  FROM implementation_requests ir
  WHERE ir.id = request_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark email as sent
CREATE OR REPLACE FUNCTION mark_implementation_request_email_sent(
  request_id UUID,
  email_type VARCHAR(20) -- 'service' or 'auto_reply'
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  IF email_type = 'service' THEN
    UPDATE implementation_requests 
    SET 
      email_sent_to_service = TRUE,
      email_sent_at = NOW(),
      updated_at = NOW()
    WHERE id = request_id;
  ELSIF email_type = 'auto_reply' THEN
    UPDATE implementation_requests 
    SET 
      auto_reply_sent = TRUE,
      auto_reply_sent_at = NOW(),
      updated_at = NOW()
    WHERE id = request_id;
  END IF;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to get recent requests
CREATE OR REPLACE FUNCTION get_recent_implementation_requests(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  company VARCHAR(255),
  timeline VARCHAR(100),
  budget_range VARCHAR(100),
  status VARCHAR(50),
  automation_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ir.id,
    ir.user_name,
    ir.user_email,
    ir.company,
    ir.timeline,
    ir.budget_range,
    ir.status,
    ir.automation_score,
    ir.created_at
  FROM implementation_requests ir
  ORDER BY ir.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE implementation_requests IS 'Stores implementation requests from users with form data and task context for lead funnel';
COMMENT ON COLUMN implementation_requests.user_name IS 'User full name from form';
COMMENT ON COLUMN implementation_requests.user_email IS 'User email address from form';
COMMENT ON COLUMN implementation_requests.company IS 'User company (optional)';
COMMENT ON COLUMN implementation_requests.preferred_tools IS 'Array of preferred automation tools (n8n, Zapier, etc.)';
COMMENT ON COLUMN implementation_requests.timeline IS 'Desired implementation timeline (mandatory)';
COMMENT ON COLUMN implementation_requests.budget_range IS 'Budget range for project (mandatory)';
COMMENT ON COLUMN implementation_requests.task_description IS 'Original task description from user';
COMMENT ON COLUMN implementation_requests.subtasks IS 'JSONB array of subtasks generated by AI';
COMMENT ON COLUMN implementation_requests.automation_score IS 'Overall automation score for the task';
COMMENT ON COLUMN implementation_requests.selected_workflow_ids IS 'Array of selected workflow solution IDs';
COMMENT ON COLUMN implementation_requests.selected_agent_ids IS 'Array of selected agent solution IDs';
COMMENT ON COLUMN implementation_requests.status IS 'Request status: pending, contacted, quoted, in_progress, completed, cancelled';
COMMENT ON COLUMN implementation_requests.admin_notes IS 'Admin notes for internal tracking';
COMMENT ON COLUMN implementation_requests.admin_assigned_to IS 'Admin user assigned to handle this request';
COMMENT ON COLUMN implementation_requests.estimated_value IS 'Estimated project value in EUR';
COMMENT ON COLUMN implementation_requests.email_sent_to_service IS 'Whether email was sent to service@prom8.eus';
COMMENT ON COLUMN implementation_requests.auto_reply_sent IS 'Whether auto-reply was sent to user';
