-- Row Level Security (RLS) Policies for unified_workflows table

-- Enable RLS
ALTER TABLE unified_workflows ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access to active workflows
CREATE POLICY "Public read access to active workflows"
ON unified_workflows FOR SELECT
USING (active = TRUE);

-- Policy: Service role full access
CREATE POLICY "Service role full access"
ON unified_workflows FOR ALL
USING (auth.role() = 'service_role');

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert"
ON unified_workflows FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update their own
CREATE POLICY "Authenticated users can update"
ON unified_workflows FOR UPDATE
USING (auth.role() = 'authenticated');

-- Policy: Admins can manage all
CREATE POLICY "Admins can manage all"
ON unified_workflows FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Add comments
COMMENT ON POLICY "Public read access to active workflows" ON unified_workflows IS 'Allows public read access to active workflows';
COMMENT ON POLICY "Service role full access" ON unified_workflows IS 'Allows full access for service role';
COMMENT ON POLICY "Authenticated users can insert" ON unified_workflows IS 'Allows authenticated users to insert workflows';
COMMENT ON POLICY "Authenticated users can update" ON unified_workflows IS 'Allows authenticated users to update workflows';
COMMENT ON POLICY "Admins can manage all" ON unified_workflows IS 'Allows admins full access to all workflows';
