// Use the centralized Supabase client from integrations
export { supabase } from '@/integrations/supabase/client';

export interface AnalyzeInputRequest {
  url?: string
  rawText?: string
}

export interface Task {
  text: string;
  score: number;
  label: "Automatisierbar" | "Mensch";
  category: string;
  confidence: number;
  complexity: "low" | "medium" | "high";
  automationTrend: "increasing" | "stable" | "decreasing";
}

export interface AnalysisResult {
  success: boolean
  data?: {
    originalText: string
    totalScore: number
    ratio: {
      automatisierbar: number;
      mensch: number;
    }
    tasks: Task[]
    summary: string
    recommendations: string[]
    automationTrends: {
      highPotential: string[];
      mediumPotential: string[];
      lowPotential: string[];
    }
  }
  error?: string
}

export async function callAnalyzeInput(input: AnalyzeInputRequest, lang: 'de' | 'en' = 'de'): Promise<AnalysisResult> {
  try {
    console.log('DEBUG callAnalyzeInput: lang =', lang);
    
    // Use local enhanced analysis engine instead of Supabase function
    const analysisText = input.rawText || '';
    
    if (!analysisText || analysisText.trim().length < 5) {
      return {
        success: false,
        error: "Zu wenig Inhalt gefunden. Bitte fügen Sie mehr Text ein."
      };
    }

    // Import and use the enhanced analysis engine
    const { runAnalysis } = await import('./runAnalysis');
    console.log('DEBUG: Calling runAnalysis with lang =', lang);
    const result = await runAnalysis(analysisText.slice(0, 10000), lang);

    return {
      success: true,
      data: {
        originalText: analysisText, // Store full original text for sharing
        ...result
      }
    };
  } catch (error) {
    console.error('Error calling enhanced analysis:', error)
    return {
      success: false,
      error: 'Fehler bei der Analyse'
    }
  }
}