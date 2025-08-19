import { createClient } from '@supabase/supabase-js'

// Temporäre Konfiguration - diese Werte müssen aus der Supabase Integration bezogen werden
// TODO: Diese durch echte Supabase Projekt-URLs ersetzen
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    const result = runAnalysis(analysisText.slice(0, 10000), lang);

    return {
      success: true,
      data: {
        originalText: analysisText.substring(0, 500) + (analysisText.length > 500 ? '...' : ''),
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