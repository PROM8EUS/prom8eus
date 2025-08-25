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
      
      // Direct insert instead of using RPC function
      const { data: result, error } = await supabase
        .from('shared_analyses')
        .insert({
          share_id: shareId,
          original_text: originalText,
          job_title: jobTitle || null,
          analysis_data: {}, // Empty object to satisfy NOT NULL constraint
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .select('share_id')
        .single();

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
          shareId: result?.share_id || shareId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'get') {
      const { shareId }: GetAnalysisRequest = data;
      
      console.log('Retrieving shared analysis:', shareId);
      
      // Direct select instead of using RPC function
      const { data: result, error } = await supabase
        .from('shared_analyses')
        .select('original_text, job_title, created_at, views')
        .eq('share_id', shareId)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        console.error('Error retrieving shared analysis:', error);
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

      if (!result) {
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

      // Update view count
      await supabase
        .from('shared_analyses')
        .update({ views: (result.views || 0) + 1 })
        .eq('share_id', shareId);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            originalText: result.original_text,
            jobTitle: result.job_title,
            createdAt: result.created_at,
            views: (result.views || 0) + 1
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
