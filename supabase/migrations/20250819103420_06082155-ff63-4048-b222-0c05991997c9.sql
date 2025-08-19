-- Create URL cache table
CREATE TABLE public.url_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url_hash TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  text_length INTEGER NOT NULL,
  was_rendered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Create index for faster lookups by hash
CREATE INDEX idx_url_cache_hash ON public.url_cache(url_hash);

-- Create index for cleanup of expired entries
CREATE INDEX idx_url_cache_expires_at ON public.url_cache(expires_at);

-- Enable Row Level Security
ALTER TABLE public.url_cache ENABLE ROW LEVEL SECURITY;

-- Allow public access for reading and inserting cache entries (since this is a public service)
CREATE POLICY "Allow public read access to url_cache" 
ON public.url_cache 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to url_cache" 
ON public.url_cache 
FOR INSERT 
WITH CHECK (true);

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_url_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.url_cache 
  WHERE expires_at < now();
END;
$$;

-- Create function to get cached URL data
CREATE OR REPLACE FUNCTION public.get_cached_url_data(url_hash_param TEXT)
RETURNS TABLE (
  extracted_data JSONB,
  text_length INTEGER,
  was_rendered BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.extracted_data,
    uc.text_length,
    uc.was_rendered,
    uc.created_at
  FROM public.url_cache uc
  WHERE uc.url_hash = url_hash_param
    AND uc.expires_at > now();
END;
$$;