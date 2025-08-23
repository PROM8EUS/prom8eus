import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

interface StoreAnalysisRequest {
  shareId: string;
  analysisData: any;
  originalText: string;
  jobTitle?: string;
  totalScore?: number;
  taskCount?: number;
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
      const { shareId, analysisData, originalText, jobTitle, totalScore, taskCount }: StoreAnalysisRequest = data;
      
      console.log('Storing shared analysis:', { shareId, jobTitle, totalScore, taskCount });
      
      const { data: result, error } = await supabase.rpc('store_shared_analysis', {
        share_id_param: shareId,
        analysis_data_param: analysisData,
        original_text_param: originalText,
        job_title_param: jobTitle || null,
        total_score_param: totalScore || null,
        task_count_param: taskCount || null
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
            error: 'Analysis not found or expired' 
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
            analysisData: analysis.analysis_data,
            originalText: analysis.original_text,
            jobTitle: analysis.job_title,
            totalScore: analysis.total_score,
            taskCount: analysis.task_count,
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
