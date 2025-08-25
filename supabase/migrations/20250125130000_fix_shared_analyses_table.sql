-- Fix shared_analyses table structure
-- Drop the table and recreate it properly
DROP TABLE IF EXISTS public.shared_analyses CASCADE;

-- Create the correct table structure
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

-- Enable Row Level Security
ALTER TABLE public.shared_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
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

