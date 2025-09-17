-- Add domain classification fields to workflow_cache table
ALTER TABLE public.workflow_cache 
ADD COLUMN IF NOT EXISTS domains TEXT[],
ADD COLUMN IF NOT EXISTS domain_confidences FLOAT[],
ADD COLUMN IF NOT EXISTS domain_origin TEXT CHECK (domain_origin IN ('llm', 'admin', 'mixed'));

-- Create indexes for domain classification queries
CREATE INDEX IF NOT EXISTS idx_workflow_cache_domains ON public.workflow_cache USING GIN (domains);
CREATE INDEX IF NOT EXISTS idx_workflow_cache_domain_origin ON public.workflow_cache (domain_origin);

-- Create a function to extract domain classification from workflows JSONB
CREATE OR REPLACE FUNCTION public.extract_domain_classification(workflows_jsonb JSONB)
RETURNS TABLE (
    solution_id TEXT,
    domains TEXT[],
    domain_confidences FLOAT[],
    domain_origin TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (workflow->>'id')::TEXT as solution_id,
        CASE 
            WHEN workflow ? 'domains' AND jsonb_typeof(workflow->'domains') = 'array' 
            THEN ARRAY(SELECT jsonb_array_elements_text(workflow->'domains'))
            ELSE NULL
        END as domains,
        CASE 
            WHEN workflow ? 'domain_confidences' AND jsonb_typeof(workflow->'domain_confidences') = 'array'
            THEN ARRAY(SELECT jsonb_array_elements_text(workflow->'domain_confidences')::FLOAT)
            ELSE NULL
        END as domain_confidences,
        (workflow->>'domain_origin')::TEXT as domain_origin
    FROM jsonb_array_elements(workflows_jsonb) as workflow
    WHERE workflow ? 'domains' OR workflow ? 'domain_confidences' OR workflow ? 'domain_origin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.extract_domain_classification(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.extract_domain_classification(JSONB) TO anon;

-- Create a function to update domain classification in workflow cache
CREATE OR REPLACE FUNCTION public.update_workflow_domain_classification(
    cache_id INTEGER,
    solution_id TEXT,
    new_domains TEXT[],
    new_confidences FLOAT[],
    new_origin TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_workflows JSONB;
    updated_workflows JSONB;
    workflow_element JSONB;
    updated_element JSONB;
BEGIN
    -- Get current workflows
    SELECT workflows INTO current_workflows 
    FROM public.workflow_cache 
    WHERE id = cache_id;
    
    IF current_workflows IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update the specific workflow in the JSONB array
    updated_workflows := (
        SELECT jsonb_agg(
            CASE 
                WHEN (workflow->>'id') = solution_id THEN
                    workflow || jsonb_build_object(
                        'domains', to_jsonb(new_domains),
                        'domain_confidences', to_jsonb(new_confidences),
                        'domain_origin', new_origin
                    )
                ELSE workflow
            END
        )
        FROM jsonb_array_elements(current_workflows) as workflow
    );
    
    -- Update the cache record
    UPDATE public.workflow_cache 
    SET 
        workflows = updated_workflows,
        domains = new_domains,
        domain_confidences = new_confidences,
        domain_origin = new_origin,
        updated_at = NOW()
    WHERE id = cache_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_workflow_domain_classification(INTEGER, TEXT, TEXT[], FLOAT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_workflow_domain_classification(INTEGER, TEXT, TEXT[], FLOAT[], TEXT) TO anon;

-- Create a function to get solutions by domain
CREATE OR REPLACE FUNCTION public.get_solutions_by_domain(domain_name TEXT)
RETURNS TABLE (
    cache_id INTEGER,
    solution_id TEXT,
    title TEXT,
    summary TEXT,
    source TEXT,
    domains TEXT[],
    domain_confidences FLOAT[],
    domain_origin TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wc.id as cache_id,
        (workflow->>'id')::TEXT as solution_id,
        (workflow->>'title')::TEXT as title,
        (workflow->>'summary')::TEXT as summary,
        (workflow->>'source')::TEXT as source,
        CASE 
            WHEN workflow ? 'domains' AND jsonb_typeof(workflow->'domains') = 'array' 
            THEN ARRAY(SELECT jsonb_array_elements_text(workflow->'domains'))
            ELSE NULL
        END as domains,
        CASE 
            WHEN workflow ? 'domain_confidences' AND jsonb_typeof(workflow->'domain_confidences') = 'array'
            THEN ARRAY(SELECT jsonb_array_elements_text(workflow->'domain_confidences')::FLOAT)
            ELSE NULL
        END as domain_confidences,
        (workflow->>'domain_origin')::TEXT as domain_origin
    FROM public.workflow_cache wc,
         jsonb_array_elements(wc.workflows) as workflow
    WHERE 
        workflow ? 'domains' 
        AND jsonb_typeof(workflow->'domains') = 'array'
        AND domain_name = ANY(
            SELECT jsonb_array_elements_text(workflow->'domains')
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_solutions_by_domain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_solutions_by_domain(TEXT) TO anon;

-- Create a function to get domain statistics
CREATE OR REPLACE FUNCTION public.get_domain_statistics()
RETURNS TABLE (
    domain_name TEXT,
    solution_count BIGINT,
    avg_confidence FLOAT,
    sources TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        domain_label as domain_name,
        COUNT(*) as solution_count,
        AVG(confidence) as avg_confidence,
        ARRAY_AGG(DISTINCT source) as sources
    FROM (
        SELECT 
            jsonb_array_elements_text(workflow->'domains') as domain_label,
            jsonb_array_elements_text(workflow->'domain_confidences')::FLOAT as confidence,
            (workflow->>'source')::TEXT as source
        FROM public.workflow_cache wc,
             jsonb_array_elements(wc.workflows) as workflow
        WHERE 
            workflow ? 'domains' 
            AND jsonb_typeof(workflow->'domains') = 'array'
            AND workflow ? 'domain_confidences'
            AND jsonb_typeof(workflow->'domain_confidences') = 'array'
    ) as domain_data
    GROUP BY domain_label
    ORDER BY solution_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_domain_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_domain_statistics() TO anon;
