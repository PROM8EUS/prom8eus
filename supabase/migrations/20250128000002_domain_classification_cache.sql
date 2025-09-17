-- Create domain classification cache table
CREATE TABLE IF NOT EXISTS public.domain_classification_cache (
    id SERIAL PRIMARY KEY,
    content_hash TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    source_id TEXT NOT NULL,
    domains TEXT[] NOT NULL,
    domain_confidences FLOAT[] NOT NULL,
    domain_origin TEXT NOT NULL CHECK (domain_origin IN ('llm', 'admin', 'mixed')),
    is_admin_override BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_domain_cache_content_hash ON public.domain_classification_cache (content_hash);
CREATE INDEX IF NOT EXISTS idx_domain_cache_source_id ON public.domain_classification_cache (source_id);
CREATE INDEX IF NOT EXISTS idx_domain_cache_domains ON public.domain_classification_cache USING GIN (domains);
CREATE INDEX IF NOT EXISTS idx_domain_cache_origin ON public.domain_classification_cache (domain_origin);
CREATE INDEX IF NOT EXISTS idx_domain_cache_admin_override ON public.domain_classification_cache (is_admin_override);

-- Grant permissions
GRANT ALL ON public.domain_classification_cache TO authenticated;
GRANT ALL ON public.domain_classification_cache TO anon;
GRANT USAGE ON SEQUENCE public.domain_classification_cache_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.domain_classification_cache_id_seq TO anon;

-- Create function to generate content hash
CREATE OR REPLACE FUNCTION public.generate_content_hash(
    title_text TEXT,
    summary_text TEXT,
    source_id_text TEXT
)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(title_text || '|' || summary_text || '|' || source_id_text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.generate_content_hash(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_content_hash(TEXT, TEXT, TEXT) TO anon;

-- Create function to get or create domain classification
CREATE OR REPLACE FUNCTION public.get_or_create_domain_classification(
    title_text TEXT,
    summary_text TEXT,
    source_id_text TEXT,
    default_domains TEXT[] DEFAULT ARRAY['Other'],
    default_confidences FLOAT[] DEFAULT ARRAY[1.0],
    default_origin TEXT DEFAULT 'llm'
)
RETURNS TABLE (
    id INTEGER,
    content_hash TEXT,
    domains TEXT[],
    domain_confidences FLOAT[],
    domain_origin TEXT,
    is_admin_override BOOLEAN,
    admin_notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    hash_value TEXT;
    existing_record RECORD;
BEGIN
    -- Generate content hash
    hash_value := public.generate_content_hash(title_text, summary_text, source_id_text);
    
    -- Check if record exists
    SELECT * INTO existing_record 
    FROM public.domain_classification_cache 
    WHERE content_hash = hash_value;
    
    IF existing_record IS NOT NULL THEN
        -- Return existing record
        RETURN QUERY
        SELECT 
            existing_record.id,
            existing_record.content_hash,
            existing_record.domains,
            existing_record.domain_confidences,
            existing_record.domain_origin,
            existing_record.is_admin_override,
            existing_record.admin_notes,
            existing_record.created_at,
            existing_record.updated_at;
    ELSE
        -- Create new record
        INSERT INTO public.domain_classification_cache (
            content_hash,
            title,
            summary,
            source_id,
            domains,
            domain_confidences,
            domain_origin
        ) VALUES (
            hash_value,
            title_text,
            summary_text,
            source_id_text,
            default_domains,
            default_confidences,
            default_origin
        );
        
        -- Return the new record
        RETURN QUERY
        SELECT 
            dc.id,
            dc.content_hash,
            dc.domains,
            dc.domain_confidences,
            dc.domain_origin,
            dc.is_admin_override,
            dc.admin_notes,
            dc.created_at,
            dc.updated_at
        FROM public.domain_classification_cache dc
        WHERE dc.content_hash = hash_value;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_or_create_domain_classification(TEXT, TEXT, TEXT, TEXT[], FLOAT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_domain_classification(TEXT, TEXT, TEXT, TEXT[], FLOAT[], TEXT) TO anon;

-- Create function to update domain classification (admin override)
CREATE OR REPLACE FUNCTION public.update_domain_classification(
    content_hash_text TEXT,
    new_domains TEXT[],
    new_confidences FLOAT[],
    new_origin TEXT,
    admin_notes_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.domain_classification_cache 
    SET 
        domains = new_domains,
        domain_confidences = new_confidences,
        domain_origin = new_origin,
        is_admin_override = TRUE,
        admin_notes = admin_notes_text,
        updated_at = NOW()
    WHERE content_hash = content_hash_text;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_domain_classification(TEXT, TEXT[], FLOAT[], TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_domain_classification(TEXT, TEXT[], FLOAT[], TEXT, TEXT) TO anon;

-- Create function to get admin overrides
CREATE OR REPLACE FUNCTION public.get_admin_overrides()
RETURNS TABLE (
    id INTEGER,
    content_hash TEXT,
    title TEXT,
    summary TEXT,
    source_id TEXT,
    domains TEXT[],
    domain_confidences FLOAT[],
    domain_origin TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.content_hash,
        dc.title,
        dc.summary,
        dc.source_id,
        dc.domains,
        dc.domain_confidences,
        dc.domain_origin,
        dc.admin_notes,
        dc.created_at,
        dc.updated_at
    FROM public.domain_classification_cache dc
    WHERE dc.is_admin_override = TRUE
    ORDER BY dc.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_admin_overrides() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_overrides() TO anon;

-- Create function to get domain classification statistics
CREATE OR REPLACE FUNCTION public.get_domain_classification_stats()
RETURNS TABLE (
    total_classifications BIGINT,
    llm_classifications BIGINT,
    admin_overrides BIGINT,
    mixed_classifications BIGINT,
    unique_domains BIGINT,
    avg_confidence FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_classifications,
        COUNT(*) FILTER (WHERE domain_origin = 'llm') as llm_classifications,
        COUNT(*) FILTER (WHERE is_admin_override = TRUE) as admin_overrides,
        COUNT(*) FILTER (WHERE domain_origin = 'mixed') as mixed_classifications,
        COUNT(DISTINCT unnest(domains)) as unique_domains,
        AVG(unnest(domain_confidences)) as avg_confidence
    FROM public.domain_classification_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_domain_classification_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_domain_classification_stats() TO anon;
