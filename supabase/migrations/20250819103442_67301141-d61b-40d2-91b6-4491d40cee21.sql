-- Fix security warnings by setting proper search_path for functions

-- Update cleanup function with proper security settings
CREATE OR REPLACE FUNCTION public.cleanup_expired_url_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.url_cache 
  WHERE expires_at < now();
END;
$$;

-- Update get cached data function with proper security settings
CREATE OR REPLACE FUNCTION public.get_cached_url_data(url_hash_param TEXT)
RETURNS TABLE (
  extracted_data JSONB,
  text_length INTEGER,
  was_rendered BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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