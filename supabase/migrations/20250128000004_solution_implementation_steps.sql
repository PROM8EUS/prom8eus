-- Create table for storing LLM-extracted implementation steps
CREATE TABLE IF NOT EXISTS solution_implementation_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solution_id TEXT NOT NULL,
  solution_type TEXT NOT NULL CHECK (solution_type IN ('workflow', 'agent')),
  step_number INTEGER NOT NULL,
  step_title TEXT NOT NULL,
  step_description TEXT NOT NULL,
  step_category TEXT NOT NULL CHECK (step_category IN ('setup', 'configuration', 'testing', 'deployment', 'monitoring', 'maintenance')),
  estimated_time TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  prerequisites TEXT[],
  tools_required TEXT[],
  admin_validated BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  admin_validated_by UUID REFERENCES auth.users(id),
  admin_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(solution_id, step_number)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_solution_implementation_steps_solution_id ON solution_implementation_steps(solution_id);
CREATE INDEX IF NOT EXISTS idx_solution_implementation_steps_solution_type ON solution_implementation_steps(solution_type);
CREATE INDEX IF NOT EXISTS idx_solution_implementation_steps_admin_validated ON solution_implementation_steps(admin_validated);
CREATE INDEX IF NOT EXISTS idx_solution_implementation_steps_step_category ON solution_implementation_steps(step_category);

-- Create table for storing step extraction cache
CREATE TABLE IF NOT EXISTS step_extraction_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_hash TEXT NOT NULL UNIQUE,
  solution_id TEXT NOT NULL,
  solution_type TEXT NOT NULL,
  extracted_steps JSONB NOT NULL,
  extraction_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for content hash lookup
CREATE INDEX IF NOT EXISTS idx_step_extraction_cache_content_hash ON step_extraction_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_step_extraction_cache_solution_id ON step_extraction_cache(solution_id);

-- Function to generate content hash for step extraction
CREATE OR REPLACE FUNCTION generate_step_extraction_hash(
  solution_title TEXT,
  solution_description TEXT,
  solution_type TEXT,
  additional_context TEXT DEFAULT ''
) RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    digest(
      LOWER(TRIM(solution_title)) || '|' || 
      LOWER(TRIM(solution_description)) || '|' || 
      LOWER(TRIM(solution_type)) || '|' || 
      LOWER(TRIM(additional_context)),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get or create step extraction cache entry
CREATE OR REPLACE FUNCTION get_or_create_step_extraction_cache(
  p_content_hash TEXT,
  p_solution_id TEXT,
  p_solution_type TEXT,
  p_extracted_steps JSONB,
  p_extraction_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  cache_id UUID;
BEGIN
  -- Try to get existing cache entry
  SELECT id INTO cache_id 
  FROM step_extraction_cache 
  WHERE content_hash = p_content_hash;
  
  -- If not found, create new entry
  IF cache_id IS NULL THEN
    INSERT INTO step_extraction_cache (
      content_hash, 
      solution_id, 
      solution_type, 
      extracted_steps, 
      extraction_metadata
    ) VALUES (
      p_content_hash, 
      p_solution_id, 
      p_solution_type, 
      p_extracted_steps, 
      p_extraction_metadata
    ) RETURNING id INTO cache_id;
  ELSE
    -- Update existing entry
    UPDATE step_extraction_cache 
    SET 
      extracted_steps = p_extracted_steps,
      extraction_metadata = p_extraction_metadata,
      updated_at = NOW()
    WHERE id = cache_id;
  END IF;
  
  RETURN cache_id;
END;
$$ LANGUAGE plpgsql;

-- Function to store extracted implementation steps
CREATE OR REPLACE FUNCTION store_implementation_steps(
  p_solution_id TEXT,
  p_solution_type TEXT,
  p_steps JSONB
) RETURNS INTEGER AS $$
DECLARE
  step_record JSONB;
  step_count INTEGER := 0;
BEGIN
  -- Clear existing steps for this solution
  DELETE FROM solution_implementation_steps WHERE solution_id = p_solution_id;
  
  -- Insert new steps
  FOR step_record IN SELECT * FROM jsonb_array_elements(p_steps)
  LOOP
    INSERT INTO solution_implementation_steps (
      solution_id,
      solution_type,
      step_number,
      step_title,
      step_description,
      step_category,
      estimated_time,
      difficulty_level,
      prerequisites,
      tools_required
    ) VALUES (
      p_solution_id,
      p_solution_type,
      (step_record->>'step_number')::INTEGER,
      step_record->>'step_title',
      step_record->>'step_description',
      step_record->>'step_category',
      step_record->>'estimated_time',
      step_record->>'difficulty_level',
      CASE 
        WHEN step_record->'prerequisites' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(step_record->'prerequisites'))
        ELSE NULL 
      END,
      CASE 
        WHEN step_record->'tools_required' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(step_record->'tools_required'))
        ELSE NULL 
      END
    );
    
    step_count := step_count + 1;
  END LOOP;
  
  RETURN step_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get implementation steps for a solution
CREATE OR REPLACE FUNCTION get_implementation_steps(p_solution_id TEXT)
RETURNS TABLE (
  id UUID,
  step_number INTEGER,
  step_title TEXT,
  step_description TEXT,
  step_category TEXT,
  estimated_time TEXT,
  difficulty_level TEXT,
  prerequisites TEXT[],
  tools_required TEXT[],
  admin_validated BOOLEAN,
  admin_notes TEXT,
  admin_validated_by UUID,
  admin_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.step_number,
    s.step_title,
    s.step_description,
    s.step_category,
    s.estimated_time,
    s.difficulty_level,
    s.prerequisites,
    s.tools_required,
    s.admin_validated,
    s.admin_notes,
    s.admin_validated_by,
    s.admin_validated_at,
    s.created_at,
    s.updated_at
  FROM solution_implementation_steps s
  WHERE s.solution_id = p_solution_id
  ORDER BY s.step_number;
END;
$$ LANGUAGE plpgsql;

-- Function to validate implementation steps (admin only)
CREATE OR REPLACE FUNCTION validate_implementation_steps(
  p_solution_id TEXT,
  p_admin_user_id UUID,
  p_validation_notes TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE solution_implementation_steps 
  SET 
    admin_validated = TRUE,
    admin_notes = p_validation_notes,
    admin_validated_by = p_admin_user_id,
    admin_validated_at = NOW(),
    updated_at = NOW()
  WHERE solution_id = p_solution_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get step extraction statistics
CREATE OR REPLACE FUNCTION get_step_extraction_stats()
RETURNS TABLE (
  total_solutions INTEGER,
  solutions_with_steps INTEGER,
  total_steps INTEGER,
  validated_steps INTEGER,
  pending_validation INTEGER,
  extraction_cache_hits INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(DISTINCT solution_id) FROM solution_implementation_steps)::INTEGER as total_solutions,
    (SELECT COUNT(DISTINCT solution_id) FROM solution_implementation_steps)::INTEGER as solutions_with_steps,
    (SELECT COUNT(*) FROM solution_implementation_steps)::INTEGER as total_steps,
    (SELECT COUNT(*) FROM solution_implementation_steps WHERE admin_validated = TRUE)::INTEGER as validated_steps,
    (SELECT COUNT(*) FROM solution_implementation_steps WHERE admin_validated = FALSE)::INTEGER as pending_validation,
    (SELECT COUNT(*) FROM step_extraction_cache)::INTEGER as extraction_cache_hits;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE solution_implementation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_extraction_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access to implementation steps" ON solution_implementation_steps
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write access to implementation steps" ON solution_implementation_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Allow read access to step extraction cache" ON step_extraction_cache
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write access to step extraction cache" ON step_extraction_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_solution_implementation_steps_updated_at
  BEFORE UPDATE ON solution_implementation_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_step_extraction_cache_updated_at
  BEFORE UPDATE ON step_extraction_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
