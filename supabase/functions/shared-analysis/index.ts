import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

interface StoreAnalysisRequest {
  shareId: string;
  originalText: string;
  jobTitle?: string;
}

interface GetAnalysisRequest {
  shareId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...data } = await req.json();

    if (action === 'store') {
      const { shareId, originalText, jobTitle }: StoreAnalysisRequest = data;
      
      console.log('Storing shared analysis:', { shareId, jobTitle });
      
      const { data: result, error } = await supabase.rpc('store_shared_analysis', {
        share_id_param: shareId,
        original_text_param: originalText,
        job_title_param: jobTitle || null
      });

      if (error) {
        console.error('Error storing shared analysis:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          shareId: result
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'get') {
      const { shareId }: GetAnalysisRequest = data;
      
      console.log('Retrieving shared analysis:', shareId);
      
      const { data: result, error } = await supabase.rpc('get_shared_analysis', {
        share_id_param: shareId
      });

      if (error) {
        console.error('Error retrieving shared analysis:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!result || result.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Die geteilte Analyse ist nicht mehr verfügbar oder abgelaufen. Bitte führen Sie eine neue Analyse durch.' 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const analysis = result[0];
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            originalText: analysis.original_text,
            jobTitle: analysis.job_title,
            createdAt: analysis.created_at,
            views: analysis.view_count
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid action. Use "store" or "get".' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in shared-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
