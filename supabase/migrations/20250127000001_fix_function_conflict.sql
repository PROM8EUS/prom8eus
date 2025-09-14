-- Drop the existing function to fix the return type conflict
DROP FUNCTION IF EXISTS public.get_shared_analysis(TEXT);

-- Recreate the function with the correct return type
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


