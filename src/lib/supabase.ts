import { createClient } from '@supabase/supabase-js'

// These environment variables are automatically provided by Lovable's Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

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