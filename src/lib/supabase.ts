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
    console.log('Calling unified analysis function with:', input)
    
    // Call the new unified analysis function
    const { data, error } = await supabase.functions.invoke('analyze-input-unified', {
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
    console.error('Error calling analyze-input-unified:', error)
    return {
      success: false,
      error: 'Netzwerkfehler beim Aufrufen der Analyse'
    }
  }
}