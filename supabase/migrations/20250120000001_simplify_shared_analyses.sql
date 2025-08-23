-- Simplify shared analyses table to only store original input
-- This allows for regeneration of analysis results

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_shared_analysis(TEXT);
DROP FUNCTION IF EXISTS public.store_shared_analysis(TEXT, JSONB, TEXT, TEXT, INTEGER, INTEGER);

-- Drop existing table
DROP TABLE IF EXISTS public.shared_analyses;

-- Create simplified shared analyses table
CREATE TABLE public.shared_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  original_text TEXT NOT NULL,
  job_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  views INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_shared_analyses_share_id ON public.shared_analyses(share_id);
CREATE INDEX idx_shared_analyses_expires_at ON public.shared_analyses(expires_at);
CREATE INDEX idx_shared_analyses_public ON public.shared_analyses(is_public) WHERE is_public = true;

-- Enable Row Level Security
ALTER TABLE public.shared_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to shared_analyses" 
ON public.shared_analyses 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Allow public insert to shared_analyses" 
ON public.shared_analyses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update view count on shared_analyses" 
ON public.shared_analyses 
FOR UPDATE 
USING (is_public = true)
WITH CHECK (is_public = true);

-- Create simplified function to get shared analysis
CREATE OR REPLACE FUNCTION public.get_shared_analysis(share_id_param TEXT)
RETURNS TABLE (
  original_text TEXT,
  job_title TEXT,
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
    sa.original_text,
    sa.job_title,
    sa.created_at,
    sa.views
  FROM public.shared_analyses sa
  WHERE sa.share_id = share_id_param
    AND sa.is_public = true
    AND sa.expires_at > now();
END;
$$;

-- Create simplified function to store shared analysis
CREATE OR REPLACE FUNCTION public.store_shared_analysis(
  share_id_param TEXT,
  original_text_param TEXT,
  job_title_param TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.shared_analyses (
    share_id,
    original_text,
    job_title
  ) VALUES (
    share_id_param,
    original_text_param,
    job_title_param
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
