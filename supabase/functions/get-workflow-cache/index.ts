import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isUnifiedWorkflowReadEnabled } from '../_shared/feature-toggles.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check if unified workflow schema is enabled
    const useUnified = isUnifiedWorkflowReadEnabled();

    const { source, version, pageSize = 10000 } = await req.json()

    if (!source) {
      return new Response(
        JSON.stringify({ error: 'Source parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let data, error;

    if (useUnified) {
      // Query the unified_workflows table
      const { data: unifiedData, error: unifiedError } = await supabaseClient
        .from('unified_workflows')
        .select('*')
        .eq('source', source)
        .eq('active', true)
        .limit(pageSize);
      
      data = unifiedData;
      error = unifiedError;
    } else {
      // Query the workflow_cache table (legacy)
      const { data: legacyData, error: legacyError } = await supabaseClient
        .from('workflow_cache')
        .select('*')
        .eq('source', source)
        .eq('version', version || '1.0')
        .limit(pageSize);
      
      data = legacyData;
      error = legacyError;
    }

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database query failed', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        data: data || [],
        count: data?.length || 0,
        source,
        version: version || '1.0',
        unified: useUnified
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
