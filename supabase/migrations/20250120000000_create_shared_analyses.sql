-- Create shared analyses table for cross-user sharing
CREATE TABLE public.shared_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  analysis_data JSONB NOT NULL,
  original_text TEXT NOT NULL,
  job_title TEXT,
  total_score INTEGER,
  task_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  views INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true
);

-- Create index for faster lookups by share_id
CREATE INDEX idx_shared_analyses_share_id ON public.shared_analyses(share_id);

-- Create index for cleanup of expired entries
CREATE INDEX idx_shared_analyses_expires_at ON public.shared_analyses(expires_at);

-- Create index for public analyses
CREATE INDEX idx_shared_analyses_public ON public.shared_analyses(is_public) WHERE is_public = true;

-- Enable Row Level Security
ALTER TABLE public.shared_analyses ENABLE ROW LEVEL SECURITY;

-- Allow public access for reading shared analyses
CREATE POLICY "Allow public read access to shared_analyses" 
ON public.shared_analyses 
FOR SELECT 
USING (is_public = true);

-- Allow public insert for creating shared analyses
CREATE POLICY "Allow public insert to shared_analyses" 
ON public.shared_analyses 
FOR INSERT 
WITH CHECK (true);

-- Allow public update for incrementing view count
CREATE POLICY "Allow public update view count on shared_analyses" 
ON public.shared_analyses 
FOR UPDATE 
USING (is_public = true)
WITH CHECK (is_public = true);

-- Create function to get shared analysis by share_id
CREATE OR REPLACE FUNCTION public.get_shared_analysis(share_id_param TEXT)
RETURNS TABLE (
  analysis_data JSONB,
  original_text TEXT,
  job_title TEXT,
  total_score INTEGER,
  task_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment view count
  UPDATE public.shared_analyses 
  SET views = views + 1 
  WHERE share_id = share_id_param AND is_public = true;
  
  -- Return the analysis data
  RETURN QUERY
  SELECT 
    sa.analysis_data,
    sa.original_text,
    sa.job_title,
    sa.total_score,
    sa.task_count,
    sa.created_at,
    sa.views
  FROM public.shared_analyses sa
  WHERE sa.share_id = share_id_param
    AND sa.is_public = true
    AND sa.expires_at > now();
END;
$$;

-- Create function to store shared analysis
CREATE OR REPLACE FUNCTION public.store_shared_analysis(
  share_id_param TEXT,
  analysis_data_param JSONB,
  original_text_param TEXT,
  job_title_param TEXT DEFAULT NULL,
  total_score_param INTEGER DEFAULT NULL,
  task_count_param INTEGER DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.shared_analyses (
    share_id,
    analysis_data,
    original_text,
    job_title,
    total_score,
    task_count
  ) VALUES (
    share_id_param,
    analysis_data_param,
    original_text_param,
    job_title_param,
    total_score_param,
    task_count_param
  );
  
  RETURN share_id_param;
END;
$$;

-- Create function to clean up expired shared analyses
CREATE OR REPLACE FUNCTION public.cleanup_expired_shared_analyses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.shared_analyses 
  WHERE expires_at < now();
END;
$$;
