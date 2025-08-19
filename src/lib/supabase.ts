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

export interface AnalysisResult {
  success: boolean
  data?: {
    originalText: string
    automationScore: number
    automatedTasks: string[]
    manualTasks: string[]
    recommendations: string[]
    summary: string
  }
  error?: string
}

export async function callAnalyzeInput(input: AnalyzeInputRequest): Promise<AnalysisResult> {
  try {
    // Prüfe, ob Supabase korrekt konfiguriert ist
    if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
      return {
        success: false,
        error: 'Supabase ist noch nicht konfiguriert. Bitte fügen Sie die Projekt-URLs in src/lib/supabase.ts hinzu.'
      }
    }

    const { data, error } = await supabase.functions.invoke('analyze-input', {
      body: input
    })

    if (error) {
      console.error('Supabase function error:', error)
      return {
        success: false,
        error: error.message || 'Fehler beim Aufrufen der Analyse-Funktion'
      }
    }

    return data as AnalysisResult
  } catch (error) {
    console.error('Error calling analyze-input:', error)
    return {
      success: false,
      error: 'Netzwerkfehler beim Aufrufen der Analyse'
    }
  }
}