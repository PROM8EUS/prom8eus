-- Create ontology_domains table for domain classification
CREATE TABLE IF NOT EXISTS public.ontology_domains (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL,
    is_fallback BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ontology_domains_label ON public.ontology_domains (label);
CREATE INDEX IF NOT EXISTS idx_ontology_domains_order ON public.ontology_domains (display_order);
CREATE INDEX IF NOT EXISTS idx_ontology_domains_fallback ON public.ontology_domains (is_fallback);

-- Insert the 20 domains as specified in the PRD
INSERT INTO public.ontology_domains (label, display_order, is_fallback, description) VALUES
    ('Healthcare & Medicine', 1, FALSE, 'Medical services, patient care, clinical workflows'),
    ('Nursing & Care', 2, FALSE, 'Nursing services, patient care, healthcare support'),
    ('Life Sciences & Biotech', 3, FALSE, 'Biotechnology, research, pharmaceutical'),
    ('Finance & Accounting', 4, FALSE, 'Financial services, accounting, banking'),
    ('Marketing & Advertising', 5, FALSE, 'Marketing campaigns, advertising, brand management'),
    ('Sales & CRM', 6, FALSE, 'Sales processes, customer relationship management'),
    ('Human Resources & Recruiting', 7, FALSE, 'HR processes, recruitment, employee management'),
    ('Education & Training', 8, FALSE, 'Educational services, training programs, learning'),
    ('Legal & Compliance', 9, FALSE, 'Legal services, compliance, regulatory'),
    ('IT & Software Development', 10, FALSE, 'Software development, IT services, technical'),
    ('DevOps & Cloud', 11, FALSE, 'DevOps processes, cloud infrastructure, deployment'),
    ('Design & Creative', 12, FALSE, 'Design services, creative work, visual content'),
    ('Manufacturing & Engineering', 13, FALSE, 'Manufacturing processes, engineering, production'),
    ('Energy & Utilities', 14, FALSE, 'Energy sector, utilities, infrastructure'),
    ('Logistics & Supply Chain', 15, FALSE, 'Logistics, supply chain, transportation'),
    ('Retail & E-Commerce', 16, FALSE, 'Retail operations, e-commerce, sales'),
    ('Real Estate & Property', 17, FALSE, 'Real estate, property management, construction'),
    ('Government & Public Sector', 18, FALSE, 'Government services, public administration'),
    ('Customer Support & Service', 19, FALSE, 'Customer service, support, help desk'),
    ('Research & Data Science', 20, FALSE, 'Research, data analysis, analytics'),
    ('Other', 21, TRUE, 'Fallback category for unclassified solutions');

-- Grant permissions
GRANT ALL ON public.ontology_domains TO authenticated;
GRANT ALL ON public.ontology_domains TO anon;
GRANT USAGE ON SEQUENCE public.ontology_domains_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.ontology_domains_id_seq TO anon;

-- Create a function to get all domains ordered by display_order
CREATE OR REPLACE FUNCTION public.get_ontology_domains()
RETURNS TABLE (
    id INTEGER,
    label TEXT,
    display_order INTEGER,
    is_fallback BOOLEAN,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        od.id,
        od.label,
        od.display_order,
        od.is_fallback,
        od.description
    FROM public.ontology_domains od
    ORDER BY od.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_ontology_domains() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ontology_domains() TO anon;

-- Create a function to validate domain labels
CREATE OR REPLACE FUNCTION public.validate_domain_label(domain_label TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.ontology_domains 
        WHERE label = domain_label
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the validation function
GRANT EXECUTE ON FUNCTION public.validate_domain_label(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_domain_label(TEXT) TO anon;
